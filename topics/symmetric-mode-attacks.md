---
title: "Symmetric Mode Attacks: ECB, CBC & CTR"
description: Practical cryptanalysis and runnable CLI demonstrations of ECB pattern leakage, CBC bit-flipping malleability, and CTR two-time pad nonce reuse attacks.
permalink: /topics/symmetric-mode-attacks/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Failure Analysis</span>

# Symmetric Mode Attacks: ECB, CBC & CTR

<p class="lede">Evaluating symmetric block cipher modes requires understanding their specific cryptanalytic failure modes. Unauthenticated cipher modes fail in distinct ways: Electronic Codebook (ECB) leaks structural patterns, Cipher Block Chaining (CBC) is vulnerable to bit-flipping and padding oracle attacks, and Counter (CTR) mode collapses into a two-time pad when nonces repeat under the same key.</p>

## Attack Summary Matrix

| Cipher Mode | Vulnerability / Failure Mode | Root Cause | Impact | Defensive Countermeasure |
|---|---|---|---|---|
| **AES-CBC** | Bit-Flipping Malleability &amp; Padding Oracles | Ciphertext block **N** XORed into plaintext block **N+1** during decryption | Attacker flips arbitrary bits in block **N+1** without knowing the key | **Use AEAD (AES-GCM)** or apply Encrypt-then-MAC (HMAC-SHA256). |
| **AES-CTR** | Two-Time Pad Keystream Reuse | Identical nonce/counter generates duplicate keystream | **C<sub>1</sub> &oplus; C<sub>2</sub> = P<sub>1</sub> &oplus; P<sub>2</sub>**; recovers plaintext without knowing key | **Never Reuse Nonces**; deploy CSPRNG 96-bit nonces or **AES-GCM-SIV ([RFC 8452](https://www.rfc-editor.org/rfc/rfc8452))**. |
| **AES-ECB** | Structural Pattern Leakage | Independent block encryption (**C<sub>i</sub> = E<sub>K</sub>(P<sub>i</sub>)**) | Plaintext patterns and duplicate blocks remain visible in ciphertext | **Do Not Use ECB**; deploy AES-GCM or ChaCha20-Poly1305. |

## 1. ECB Mode: Structural Pattern Leakage

In **ECB (Electronic Codebook)** mode, every 16-byte plaintext block **P<sub>i</sub>** is encrypted independently using key **K**:

**C<sub>i</sub> = E<sub>K</sub>(P<sub>i</sub>)**

When identical plaintext blocks occur in input data, identical ciphertext blocks are emitted.

<div class="diagram-frame">
  <img src="{{ '/assets/img/ecb-openssl-block-leak.svg' | relative_url }}?v=3" alt="AES-128-ECB block pattern leakage breakdown showing identical 16-byte plaintext blocks producing identical 16-byte hex ciphertext outputs.">
  <p class="diagram-caption">AES-128-ECB block pattern leakage: four identical 16-byte plaintext blocks yield identical 16-byte hex ciphertext outputs (ecb_leak.py)</p>
</div>

### Client-Side Executable ECB Cryptanalysis Playground

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Browser Demonstration</span>
    <h3>AES-128-ECB Structural Pattern Leakage Playground</h3>
    <p>Test plaintext block repetition and key conversion directly in your browser (Zero server calls / Executed locally via Web Crypto API).</p>
  </div>

  <div class="demo-body">
    <div class="demo-form-group">
      <label for="ecb-plaintext-input">Plaintext Payload Input:</label>
      <textarea id="ecb-plaintext-input" rows="3" class="demo-textarea" placeholder="Enter plaintext message...">ATTACKATDAWN1234ATTACKATDAWN1234ATTACKATDAWN1234ATTACKATDAWN1234</textarea>
      <small class="demo-help">Default input consists of four identical 16-byte blocks ("ATTACKATDAWN1234").</small>
    </div>

    <div class="demo-form-group">
      <label for="ecb-key-input">Encryption Key / Passphrase:</label>
      <input type="text" id="ecb-key-input" class="demo-input" value="000102030405060708090a0b0c0d0e0f" placeholder="e.g. 000102030405060708090a0b0c0d0e0f or 'ab'">
      <small class="demo-help" id="key-conversion-info">Key format: 32-character Hex key (128 bits).</small>
    </div>

    <div class="demo-actions">
      <button id="btn-encrypt-ecb" class="btn-primary" type="button">Encrypt with AES-ECB</button>
      <button id="btn-reset-ecb" class="btn-secondary" type="button">Reset Default Inputs</button>
    </div>

    <div id="ecb-output-container" class="demo-output-area"></div>
  </div>
</div>

<script>
(function() {
  const plainInput = document.getElementById('ecb-plaintext-input');
  const keyInput = document.getElementById('ecb-key-input');
  const keyInfo = document.getElementById('key-conversion-info');
  const btnEncrypt = document.getElementById('btn-encrypt-ecb');
  const btnReset = document.getElementById('btn-reset-ecb');
  const outputContainer = document.getElementById('ecb-output-container');

  if (!plainInput || !keyInput || !btnEncrypt) return;

  function hexToBytes(hex) {
    hex = hex.replace(/\s+/g, '');
    if (hex.length % 2 !== 0) hex = '0' + hex;
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function processKey(inputStr) {
    const trimmed = inputStr.trim();
    if (/^[0-9a-fA-F]{32}$/.test(trimmed)) {
      keyInfo.innerHTML = '<span style="color: #15803d; font-weight: 600;">✔ Exact 16-byte (128-bit) Hex key detected</span>';
      return hexToBytes(trimmed);
    }
    
    const encoder = new TextEncoder();
    const rawBytes = encoder.encode(trimmed);
    const keyBytes = new Uint8Array(16);
    
    if (rawBytes.length === 0) {
      keyInfo.innerHTML = '<span style="color: #b91c1c; font-weight: 600;">⚠️ Empty key entered. Using 16-byte zero fallback key.</span>';
    } else {
      for (let i = 0; i < 16; i++) {
        keyBytes[i] = i < rawBytes.length ? rawBytes[i] : 0;
      }
      keyInfo.innerHTML = `<span style="color: #0369a1; font-weight: 600;">ℹ️ Passphrase "${trimmed}" converted &amp; zero-padded to 16-byte key: <code>${bytesToHex(keyBytes)}</code></span>`;
    }
    return keyBytes;
  }

  function pkcs7Pad(bytes) {
    const blockSize = 16;
    const padLen = blockSize - (bytes.length % blockSize);
    const padded = new Uint8Array(bytes.length + padLen);
    padded.set(bytes);
    for (let i = bytes.length; i < padded.length; i++) {
      padded[i] = padLen;
    }
    return padded;
  }

  async function encryptECBBlock(keyBytes, blockBytes) {
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw", keyBytes, { name: "AES-CBC" }, false, ["encrypt"]
    );
    const zeroIv = new Uint8Array(16);
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-CBC", iv: zeroIv }, cryptoKey, blockBytes
    );
    return new Uint8Array(encrypted.slice(0, 16));
  }

  async function runECBEncryption() {
    try {
      const textVal = plainInput.value;
      const keyVal = keyInput.value;
      
      const keyBytes = processKey(keyVal);
      const encoder = new TextEncoder();
      let plainBytes = encoder.encode(textVal);
      
      if (plainBytes.length === 0) {
        outputContainer.innerHTML = '<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">⚠️ Please enter a non-empty plaintext message to encrypt.</div>';
        return;
      }
      
      const needsPadding = plainBytes.length % 16 !== 0;
      if (needsPadding) {
        plainBytes = pkcs7Pad(plainBytes);
      }
      
      const totalBlocks = plainBytes.length / 16;
      const ciphertextBlocks = [];
      const blockHexMap = {};
      
      for (let i = 0; i < totalBlocks; i++) {
        const blockSlice = plainBytes.slice(i * 16, (i + 1) * 16);
        const cipherBlockBytes = await encryptECBBlock(keyBytes, blockSlice);
        const hex = bytesToHex(cipherBlockBytes);
        ciphertextBlocks.push(hex);
        blockHexMap[hex] = (blockHexMap[hex] || 0) + 1;
      }
      
      let html = '<div class="ecb-results-wrapper">';
      html += `<div class="ecb-summary-banner">
        <span>Ciphertext Output: ${totalBlocks} Blocks (${plainBytes.length} Bytes Total)</span>
        ${needsPadding ? '<span class="badge-padded">(Auto PKCS#7 Padded to 16-byte boundary)</span>' : ''}
      </div>`;
      
      html += '<div class="ecb-blocks-list">';
      
      let repeatCount = 0;
      ciphertextBlocks.forEach((hex, idx) => {
        const isRepeat = blockHexMap[hex] > 1;
        if (isRepeat) repeatCount++;
        
        const plainSlice = plainBytes.slice(idx * 16, (idx + 1) * 16);
        const plainTextSnippet = Array.from(plainSlice)
          .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
          .join('');
          
        html += `
        <div class="ecb-block-item ${isRepeat ? 'is-repeat-block' : ''}">
          <div class="block-meta">
            <span class="block-num">Block ${idx + 1} (Bytes ${idx * 16}–${idx * 16 + 15})</span>
            <span class="block-plain-preview">Plaintext: "<code>${plainTextSnippet}</code>"</span>
          </div>
          <div class="block-hex-val">
            <code>${hex}</code>
            ${isRepeat ? '<span class="repeat-tag">⚠️ IDENTICAL BLOCK MATCH</span>' : ''}
          </div>
        </div>`;
      });
      
      html += '</div>';
      
      if (repeatCount > 0) {
        html += `
        <div class="security-layer security-layer-direct" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Structural Vulnerability Verified</div>
          <div>
            <strong>ECB Pattern Leakage Active!</strong>
            <p style="margin-bottom:0;">Identical 16-byte plaintext blocks produced <strong>identical ciphertext blocks</strong>. An adversary observing this ciphertext stream instantly recovers structural boundaries without knowing the encryption key.</p>
          </div>
        </div>`;
      } else {
        html += `
        <div class="security-layer security-layer-protect" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Block Uniqueness</div>
          <div>
            <strong>Distinct Ciphertext Blocks</strong>
            <p style="margin-bottom:0;">All 16-byte plaintext blocks were distinct, producing distinct ciphertext outputs. However, if any 16-byte block repeats in future payloads under ECB mode, identical ciphertext will leak.</p>
          </div>
        </div>`;
      }
      
      html += '</div>';
      outputContainer.innerHTML = html;
      
    } catch (err) {
      outputContainer.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">
        <strong>Encryption Error:</strong> ${err.message || err}
      </div>`;
    }
  }

  btnEncrypt.addEventListener('click', runECBEncryption);
  plainInput.addEventListener('input', runECBEncryption);
  keyInput.addEventListener('input', runECBEncryption);
  
  btnReset.addEventListener('click', function() {
    plainInput.value = "ATTACKATDAWN1234ATTACKATDAWN1234ATTACKATDAWN1234ATTACKATDAWN1234";
    keyInput.value = "000102030405060708090a0b0c0d0e0f";
    runECBEncryption();
  });

  runECBEncryption();
})();
</script>

### Chosen-Plaintext & Dictionary Cryptanalysis Attack (ECB Codebook Exploitation)

When a server encrypts data using **AES-ECB** mode, an adversary possessing stolen target ciphertext does not need to guess the secret key **K**. If the adversary has access to an **Encryption Oracle** (such as a web portal or API endpoint that encrypts user inputs under the same key **K**), they can build a **Codebook / Dictionary Table** mapping candidate plaintexts to generated ciphertext blocks.

Once a generated ciphertext block matches a block in the stolen target file, the target block is **instantly decrypted**:

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Chosen-Plaintext Attack Playground</span>
    <h3>ECB Codebook Dictionary Cryptanalysis Playground</h3>
    <p>Simulate an attacker using an Encryption Oracle portal to build a Codebook / Dictionary mapping candidate plaintexts to ciphertexts, decrypting stolen target data block-by-block without key K.</p>
  </div>

  <div class="demo-body">
    <!-- 1. Stolen Target Ciphertext Display -->
    <div class="demo-form-group">
      <label>1. Stolen Target Ciphertext (Intercepted Server Payload):</label>
      <div style="background: var(--paper); border: 1px solid var(--rule); border-radius: 6px; padding: 0.75rem; font-family: var(--font-mono); font-size: 0.82rem;">
        <div><strong>Target Block 1:</strong> <code id="target-b1-hex">f443167bd98b197e88e7a6fdc7c01f50</code></div>
        <div><strong>Target Block 2:</strong> <code id="target-b2-hex">de28f66b406a9553e16e0227efff68a1</code></div>
        <div><strong>Target Block 3:</strong> <code id="target-b3-hex">1ccee8e0f42d116dc93b77651c4aed13</code></div>
      </div>
    </div>

    <!-- 2. Encryption Oracle Form -->
    <div class="demo-form-group">
      <label for="dict-candidate-input">2. Submit Candidate Plaintext to Web Portal Oracle:</label>
      <div style="display: flex; gap: 0.5rem;">
        <input type="text" id="dict-candidate-input" class="demo-input" value="ROLE=ADMIN______" placeholder="Enter candidate plaintext block (e.g. ROLE=ADMIN______)...">
        <button id="btn-oracle-submit" class="btn-primary" type="button" style="white-space: nowrap;">Submit to Oracle</button>
      </div>
      <small class="demo-help">Quick Test Suggestions: Click to query 
        <a href="javascript:void(0)" onclick="document.getElementById('dict-candidate-input').value='ATTACKATDAWN1234';">"ATTACKATDAWN1234"</a> | 
        <a href="javascript:void(0)" onclick="document.getElementById('dict-candidate-input').value='ROLE=USER_______';">"ROLE=USER_______"</a> | 
        <a href="javascript:void(0)" onclick="document.getElementById('dict-candidate-input').value='ROLE=ADMIN______';">"ROLE=ADMIN______"</a> | 
        <a href="javascript:void(0)" onclick="document.getElementById('dict-candidate-input').value='STATUS=ACTIVE___';">"STATUS=ACTIVE___"</a>
      </small>
    </div>

    <!-- 3. Dynamic Codebook Dictionary Table -->
    <div class="demo-form-group">
      <label>3. Attacker Codebook / Dictionary Mapping Table:</label>
      <div class="dict-table-wrapper">
        <table class="dict-table">
          <thead>
            <tr>
              <th>Candidate Plaintext</th>
              <th>Oracle Ciphertext Block (Hex)</th>
              <th>Dictionary Match Status</th>
            </tr>
          </thead>
          <tbody id="dict-table-body">
            <tr>
              <td colspan="3" style="text-align: center; color: var(--muted);">No candidate plaintexts submitted to dictionary yet. Enter candidate text above.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 4. Decrypted Target Output -->
    <div class="demo-form-group">
      <label>4. Stolen Target Decryption Status (Live Recovery):</label>
      <div id="dict-decryption-results" class="ecb-blocks-list">
        <!-- Rendered via JS below -->
      </div>
    </div>
  </div>
</div>

<script>
(function() {
  const targetB1Hex = "f443167bd98b197e88e7a6fdc7c01f50"; // "ATTACKATDAWN1234"
  const targetB2Hex = "de28f66b406a9553e16e0227efff68a1"; // "ROLE=ADMIN______"
  const targetB3Hex = "1ccee8e0f42d116dc93b77651c4aed13"; // "STATUS=ACTIVE___"
  
  const targetBlocks = [
    { num: 1, hex: targetB1Hex, expected: "ATTACKATDAWN1234" },
    { num: 2, hex: targetB2Hex, expected: "ROLE=ADMIN______" },
    { num: 3, hex: targetB3Hex, expected: "STATUS=ACTIVE___" }
  ];

  const oracleKeyHex = "000102030405060708090a0b0c0d0e0f";
  
  const candidateInput = document.getElementById('dict-candidate-input');
  const btnSubmit = document.getElementById('btn-oracle-submit');
  const tableBody = document.getElementById('dict-table-body');
  const decResults = document.getElementById('dict-decryption-results');

  if (!candidateInput || !btnSubmit || !tableBody) return;

  const dictionaryMap = {}; // hex -> plaintext

  function hexToBytes(hex) {
    hex = hex.replace(/\s+/g, '');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function encryptOracleBlock(plainText) {
    const keyBytes = hexToBytes(oracleKeyHex);
    const encoder = new TextEncoder();
    let rawBytes = encoder.encode(plainText);
    
    // Standardize to 16 bytes (pad with underscore or space if shorter)
    const blockBytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      blockBytes[i] = i < rawBytes.length ? rawBytes[i] : 95; // 95 = '_'
    }
    
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw", keyBytes, { name: "AES-CBC" }, false, ["encrypt"]
    );
    const zeroIv = new Uint8Array(16);
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-CBC", iv: zeroIv }, cryptoKey, blockBytes
    );
    const cipherHex = bytesToHex(new Uint8Array(encrypted.slice(0, 16)));
    const blockPlainStr = String.fromCharCode.apply(null, blockBytes);
    return { hex: cipherHex, plainStr: blockPlainStr };
  }

  function updateDecryptionDisplay() {
    let html = '';
    let decryptedCount = 0;

    targetBlocks.forEach(tb => {
      const matchPlain = dictionaryMap[tb.hex];
      const isDecrypted = Boolean(matchPlain);
      if (isDecrypted) decryptedCount++;

      html += `
      <div class="ecb-block-item ${isDecrypted ? 'target-block-decrypted' : ''}">
        <div class="block-meta">
          <span class="block-num">Target Block ${tb.num}</span>
          <span class="block-plain-preview">${isDecrypted ? '✔ DECRYPTED VIA DICTIONARY' : '🔒 ENCRYPTED (UNKNOWN)'}</span>
        </div>
        <div class="block-hex-val">
          <code>Ciphertext: ${tb.hex}</code>
          ${isDecrypted 
            ? `<span class="matched-tag">Plaintext: "<strong>${matchPlain}</strong>"</span>` 
            : '<span class="unmatched-tag">Query Oracle to Decrypt</span>'}
        </div>
      </div>`;
    });

    decResults.innerHTML = html;
  }

  async function submitCandidate() {
    const textVal = candidateInput.value.trim();
    if (!textVal) return;

    const res = await encryptOracleBlock(textVal);
    dictionaryMap[res.hex] = res.plainStr;

    // Check if matches any target block
    const matchedTarget = targetBlocks.filter(tb => tb.hex === res.hex);

    // Update Table
    if (tableBody.children.length === 1 && tableBody.children[0].cells.length === 1) {
      tableBody.innerHTML = '';
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><code>${res.plainStr}</code></td>
      <td><code>${res.hex}</code></td>
      <td>${matchedTarget.length > 0 
        ? `<span class="matched-tag">🎯 MATCHED TARGET BLOCK ${matchedTarget.map(t => t.num).join(', ')}</span>` 
        : '<span class="unmatched-tag">No Target Match</span>'}</td>
    `;
    tableBody.prepend(row);

    updateDecryptionDisplay();
  }

  btnSubmit.addEventListener('click', submitCandidate);

  // Initial Seed Entry: Submit "ATTACKATDAWN1234" by default
  encryptOracleBlock("ATTACKATDAWN1234").then(res => {
    dictionaryMap[res.hex] = res.plainStr;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><code>${res.plainStr}</code></td>
      <td><code>${res.hex}</code></td>
      <td><span class="matched-tag">🎯 MATCHED TARGET BLOCK 1</span></td>
    `;
    tableBody.innerHTML = '';
    tableBody.appendChild(row);
    updateDecryptionDisplay();
  });
})();
</script>



## 2. CBC Mode: Bit-Flipping Malleability & Padding Oracle Attacks

In **CBC (Cipher Block Chaining)** mode, plaintext block **P<sub>i</sub>** is XORed with previous ciphertext block **C<sub>i-1</sub>** before encryption:

**P<sub>i</sub> = D<sub>K</sub>(C<sub>i</sub>) &oplus; C<sub>i-1</sub>**

Because **C<sub>i-1</sub>** is XORed directly into decrypted plaintext **P<sub>i</sub>**, altering byte **k** of **C<sub>i-1</sub>** changes byte **k** of **P<sub>i</sub>** by the exact same bitmask, while scrambling block **P<sub>i-1</sub>** into unrecoverable noise.

<div class="diagram-frame">
  <img src="{{ '/assets/img/cbc-bitflip.svg' | relative_url }}?v=2" alt="CBC bit-flipping attack diagram showing how flipping byte k in ciphertext block 1 alters byte k in decrypted block 2.">
  <p class="diagram-caption">CBC bit-flipping mechanics: altering ciphertext block 1 flips targeted bits in block 2</p>
</div>

### Client-Side Executable CBC Bit-Flipping Privilege Escalation Playground

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive CBC Bit-Flipping Playground</span>
    <h3>AES-128-CBC Malleability & Privilege Escalation Playground</h3>
    <p>Demonstrate how altering ciphertext byte 13 in Block 1 flips the exact bit in Decrypted Block 2, forcing <code>isadmin=0</code> → <code>isadmin=1</code> without knowing key K (Zero server calls / Executed locally via Web Crypto API).</p>
  </div>

  <div class="demo-body">
    <!-- 1. Original Plaintext Payload -->
    <div class="demo-form-group">
      <label>1. Original Session Plaintext (32 Bytes / 2 Blocks):</label>
      <div style="background: var(--paper); border: 1px solid var(--rule); border-radius: 6px; padding: 0.75rem; font-family: var(--font-mono); font-size: 0.82rem;">
        <div><strong>Block 1 (Bytes 0–15) :</strong> <code>"user=alice;role="</code></div>
        <div><strong>Block 2 (Bytes 16–31):</strong> <code>"user;isadmin=0;;"</code> (Target byte: '0' at index 13)</div>
      </div>
    </div>

    <!-- 2. Bit-Flipping Tampering Action -->
    <div class="demo-form-group">
      <label>2. Attacker Ciphertext Tampering Action:</label>
      <div class="demo-actions" style="margin: 0.5rem 0;">
        <button id="btn-flip-cbc" class="btn-primary" type="button">⚡ Flip Bit 13 (Force "0" → "1")</button>
        <button id="btn-reset-cbc" class="btn-secondary" type="button">Reset Original Ciphertext</button>
      </div>
      <small class="demo-help" id="cbc-flip-status">Status: Untampered Ciphertext (Original <code>isadmin=0</code> payload).</small>
    </div>

    <!-- 3. Ciphertext Inspection -->
    <div class="demo-form-group">
      <label>3. Ciphertext Inspection (AES-128-CBC Hex):</label>
      <div style="background: var(--paper); border: 1px solid var(--rule); border-radius: 6px; padding: 0.75rem; font-family: var(--font-mono); font-size: 0.82rem;">
        <div><strong>Ciphertext Block 1 (Hex):</strong> <code id="cbc-c1-hex">bc718c55b1a5ff2fae647de3debd047f</code></div>
        <div><strong>Ciphertext Block 2 (Hex):</strong> <code id="cbc-c2-hex">f3a7ff30057f22130d2d45e041d774f8</code></div>
      </div>
    </div>

    <!-- 4. Decrypted Result -->
    <div class="demo-form-group">
      <label>4. Server Decryption Result (Tampered Ciphertext):</label>
      <div id="cbc-decryption-output" class="ecb-blocks-list">
        <!-- Rendered via JS -->
      </div>
    </div>
  </div>
</div>

<script>
(function() {
  const keyHex = "000102030405060708090a0b0c0d0e0f";
  const ivHex  = "0102030405060708090a0b0c0d0e0f10";

  const b1Str = "user=alice;role=";
  const b2Str = "user;isadmin=0;;";
  
  const c1Code = document.getElementById('cbc-c1-hex');
  const c2Code = document.getElementById('cbc-c2-hex');
  const flipStatus = document.getElementById('cbc-flip-status');
  const btnFlip = document.getElementById('btn-flip-cbc');
  const btnReset = document.getElementById('btn-reset-cbc');
  const outputContainer = document.getElementById('cbc-decryption-output');

  if (!btnFlip || !outputContainer) return;

  let isFlipped = false;

  function hexToBytes(hex) {
    hex = hex.replace(/\s+/g, '');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function runCBCAttack() {
    try {
      const keyBytes = hexToBytes(keyHex);
      const ivBytes = hexToBytes(ivHex);
      
      const encoder = new TextEncoder();
      const plainBytes = encoder.encode(b1Str + b2Str);

      const cryptoKey = await window.crypto.subtle.importKey(
        "raw", keyBytes, { name: "AES-CBC" }, false, ["encrypt", "decrypt"]
      );

      const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-CBC", iv: ivBytes }, cryptoKey, plainBytes
      );
      
      const cipherBytes = new Uint8Array(encrypted);

      if (isFlipped) {
        cipherBytes[13] ^= ('0'.charCodeAt(0) ^ '1'.charCodeAt(0));
      }

      c1Code.textContent = bytesToHex(cipherBytes.slice(0, 16));
      c2Code.textContent = bytesToHex(cipherBytes.slice(16, 32));

      if (isFlipped) {
        c1Code.style.color = "#b91c1c";
        c1Code.style.fontWeight = "700";
        flipStatus.innerHTML = '<span style="color: #b91c1c; font-weight: 700;">⚡ BIT FLIPPED: Byte 13 in Ciphertext Block 1 modified by XOR mask (0x30 ^ 0x31)</span>';
      } else {
        c1Code.style.color = "var(--ink)";
        c1Code.style.fontWeight = "400";
        flipStatus.innerHTML = 'Status: Untampered Ciphertext (Original <code>isadmin=0</code> payload).';
      }

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-CBC", iv: ivBytes }, cryptoKey, cipherBytes
      );
      const decBytes = new Uint8Array(decryptedBuffer);

      const decB1Bytes = decBytes.slice(0, 16);
      const decB2Bytes = decBytes.slice(16, 32);

      const decB1Str = Array.from(decB1Bytes)
        .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
        .join('');
      const decB2Str = new TextDecoder().decode(decB2Bytes);

      let html = '<div class="ecb-blocks-list">';
      
      html += `
      <div class="ecb-block-item ${isFlipped ? 'is-repeat-block' : ''}">
        <div class="block-meta">
          <span class="block-num">Decrypted Block 1 (Bytes 0–15)</span>
          <span class="block-plain-preview">${isFlipped ? '⚠️ SCRAMBLED NOISE (Decryption Matrix Corruption)' : '✔ Normal Payload'}</span>
        </div>
        <div class="block-hex-val">
          <code>"<strong>${decB1Str}</strong>"</code>
        </div>
      </div>`;

      const isAdminOne = decB2Str.includes("isadmin=1");
      html += `
      <div class="ecb-block-item ${isAdminOne ? 'target-block-decrypted' : ''}">
        <div class="block-meta">
          <span class="block-num">Decrypted Block 2 (Bytes 16–31)</span>
          <span class="block-plain-preview">${isAdminOne ? '🎯 PRIVILEGE ESCALATED TO ADMIN' : 'Regular User Rights'}</span>
        </div>
        <div class="block-hex-val">
          <code>"<strong>${decB2Str}</strong>"</code>
          ${isAdminOne ? '<span class="matched-tag">⚡ isadmin=1 FORCED</span>' : '<span class="unmatched-tag">isadmin=0</span>'}
        </div>
      </div>`;

      html += '</div>';

      if (isAdminOne) {
        html += `
        <div class="security-layer security-layer-direct" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Privilege Escalation Verified</div>
          <div>
            <strong>CBC Bit-Flipping Successful!</strong>
            <p style="margin-bottom:0;">Decryption completed without integrity check errors because unauthenticated AES-CBC lacks an authentication tag. Regular user <code>alice</code> has been granted <strong>admin rights (isadmin=1)</strong>!</p>
          </div>
        </div>`;
      } else {
        html += `
        <div class="security-layer security-layer-protect" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Normal Decryption</div>
          <div>
            <strong>Original Payload Decrypted</strong>
            <p style="margin-bottom:0;">The ciphertext is untampered. User rights remain set to regular user (<code>isadmin=0</code>).</p>
          </div>
        </div>`;
      }

      outputContainer.innerHTML = html;

    } catch (err) {
      outputContainer.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">
        <strong>Decryption Error:</strong> ${err.message || err}
      </div>`;
    }
  }

  btnFlip.addEventListener('click', function() {
    isFlipped = true;
    runCBCAttack();
  });

  btnReset.addEventListener('click', function() {
    isFlipped = false;
    runCBCAttack();
  });

  runCBCAttack();
})();
</script>

Because unauthenticated CBC mode lacks an authentication tag (AEAD), decryption succeeds without raising an integrity exception, granting unauthorized administrative privileges.

## 3. CTR Mode: Nonce Reuse Two-Time Pad Attack

In **CTR (Counter)** mode, AES operates as a stream cipher, encrypting a counter value to generate a pseudo-random keystream **KS**:

**C<sub>1</sub> &oplus; C<sub>2</sub> = (P<sub>1</sub> &oplus; KS) &oplus; (P<sub>2</sub> &oplus; KS) = P<sub>1</sub> &oplus; P<sub>2</sub>**

If a nonce is reused under the same key, the exact same keystream **KS** is generated (**KS<sub>1</sub> = KS<sub>2</sub>**). XORing two ciphertexts together eliminates the keystream and secret key entirely, leaving the XOR sum of the two plaintexts (**P<sub>1</sub> &oplus; P<sub>2</sub>**).

<div class="diagram-frame">
  <img src="{{ '/assets/img/ctr-two-time-pad.svg' | relative_url }}?v=2" alt="CTR two-time pad attack diagram showing keystream cancellation when nonces repeat under the same key.">
  <p class="diagram-caption">CTR nonce-reuse two-time pad: XORing ciphertexts C1 and C2 reveals P1 XOR P2</p>
</div>

### Client-Side Executable CTR Nonce Reuse Playground

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive CTR Playground</span>
    <h3>AES-128-CTR Nonce Reuse Two-Time Pad Playground</h3>
    <p>Demonstrate how encrypting any two arbitrary messages with the same Nonce cancels out the AES keystream (C1 ⊕ C2 = P1 ⊕ P2). Type any text in Message 1 and Message 2, then guess a snippet of either message to recover the other!</p>
  </div>

  <div class="demo-body">
    <!-- 1. Two Plaintexts -->
    <div class="demo-form-group">
      <label for="ctr-p1-input">1. Message 1 Plaintext (P1):</label>
      <input type="text" id="ctr-p1-input" class="demo-input" value="Transfer $100 to Bob!!!" placeholder="Enter any text for Message 1...">
    </div>

    <div class="demo-form-group">
      <label for="ctr-p2-input">2. Message 2 Plaintext (P2):</label>
      <input type="text" id="ctr-p2-input" class="demo-input" value="Meet me at 9pm sharp!!!" placeholder="Enter any text for Message 2...">
      <small class="demo-help">Both messages will be encrypted under the exact same AES-CTR key and nonce.</small>
    </div>

    <!-- 2. Attacker Guess Input -->
    <div class="demo-form-group">
      <label for="ctr-guess-mode">3. Attacker Recovery Mode:</label>
      <select id="ctr-guess-mode" class="demo-input" style="margin-bottom: 0.5rem;">
        <option value="guess_p1" selected>Guess P1 snippet → Recover P2 Plaintext</option>
        <option value="guess_p2">Guess P2 snippet → Recover P1 Plaintext</option>
      </select>
      <div style="display: flex; gap: 0.5rem;">
        <input type="text" id="ctr-guess-input" class="demo-input" value="Transfer $100 to" placeholder="Enter guessed snippet...">
        <button id="btn-recover-ctr" class="btn-primary" type="button" style="white-space: nowrap;">Extract Bytes</button>
      </div>
      <small class="demo-help" id="ctr-mode-help">The attacker XORs (C1 ⊕ C2) with the guessed P1 snippet to recover P2.</small>
    </div>

    <!-- 3. Decryption Result -->
    <div class="demo-form-group">
      <label>4. Two-Time Pad Keystream Extraction Output:</label>
      <div id="ctr-extraction-output" class="ecb-blocks-list">
        <!-- Rendered via JS -->
      </div>
    </div>
  </div>
</div>

<script>
(function() {
  const p1Input = document.getElementById('ctr-p1-input');
  const p2Input = document.getElementById('ctr-p2-input');
  const modeSelect = document.getElementById('ctr-guess-mode');
  const guessInput = document.getElementById('ctr-guess-input');
  const btnRecover = document.getElementById('btn-recover-ctr');
  const outputContainer = document.getElementById('ctr-extraction-output');
  const modeHelp = document.getElementById('ctr-mode-help');

  const keyHex = "000102030405060708090a0b0c0d0e0f";
  const nonceHex = "000000000000000000000001";

  if (!p1Input || !p2Input || !modeSelect || !guessInput || !btnRecover || !outputContainer) return;

  function hexToBytes(hex) {
    hex = hex.replace(/\s+/g, '');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function runCTRReuseAttack() {
    try {
      const p1Text = p1Input.value;
      const p2Text = p2Input.value;
      const mode = modeSelect.value;

      if (mode === 'guess_p1') {
        modeHelp.textContent = 'The attacker XORs (C1 ⊕ C2) with the guessed P1 snippet to recover P2.';
      } else {
        modeHelp.textContent = 'The attacker XORs (C1 ⊕ C2) with the guessed P2 snippet to recover P1.';
      }

      const keyBytes = hexToBytes(keyHex);
      const counterBytes = new Uint8Array(16);
      counterBytes.set(hexToBytes(nonceHex), 0);

      const encoder = new TextEncoder();
      const p1Bytes = encoder.encode(p1Text);
      const p2Bytes = encoder.encode(p2Text);

      const cryptoKey = await window.crypto.subtle.importKey(
        "raw", keyBytes, { name: "AES-CTR" }, false, ["encrypt"]
      );

      const c1Buffer = await window.crypto.subtle.encrypt(
        { name: "AES-CTR", counter: counterBytes, length: 64 }, cryptoKey, p1Bytes
      );
      const c2Buffer = await window.crypto.subtle.encrypt(
        { name: "AES-CTR", counter: counterBytes, length: 64 }, cryptoKey, p2Bytes
      );

      const c1Bytes = new Uint8Array(c1Buffer);
      const c2Bytes = new Uint8Array(c2Buffer);

      const cXor = new Uint8Array(Math.min(c1Bytes.length, c2Bytes.length));
      for (let i = 0; i < cXor.length; i++) {
        cXor[i] = c1Bytes[i] ^ c2Bytes[i];
      }

      const guessStr = guessInput.value;
      const guessBytes = encoder.encode(guessStr);

      const recoveredBytes = new Uint8Array(Math.min(cXor.length, guessBytes.length));
      for (let i = 0; i < recoveredBytes.length; i++) {
        recoveredBytes[i] = cXor[i] ^ guessBytes[i];
      }

      const recoveredStr = new TextDecoder().decode(recoveredBytes);

      let html = '<div class="ecb-blocks-list">';

      html += `
      <div class="ecb-block-item">
        <div class="block-meta">
          <span class="block-num">Ciphertext XOR Sum (C1 ⊕ C2 = P1 ⊕ P2)</span>
          <span class="block-plain-preview">Keystream Cancelled</span>
        </div>
        <div class="block-hex-val">
          <code>Hex: ${bytesToHex(cXor)}</code>
        </div>
      </div>`;

      const targetLabel = (mode === 'guess_p1') ? 'P2' : 'P1';
      const isTargetFound = recoveredStr.length > 0;
      html += `
      <div class="ecb-block-item ${isTargetFound ? 'target-block-decrypted' : ''}">
        <div class="block-meta">
          <span class="block-num">Recovered ${targetLabel} Plaintext Snippet</span>
          <span class="block-plain-preview">${isTargetFound ? '✔ RECOVERED WITHOUT KEY' : 'Enter Snippet'}</span>
        </div>
        <div class="block-hex-val">
          <code>"<strong>${recoveredStr}</strong>"</code>
          ${isTargetFound ? `<span class="matched-tag">🎯 ${targetLabel} RECOVERED (${recoveredBytes.length} Bytes)</span>` : ''}
        </div>
      </div>`;

      html += '</div>';

      if (isTargetFound) {
        html += `
        <div class="security-layer security-layer-direct" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Keystream Reuse Vulnerability Verified</div>
          <div>
            <strong>${targetLabel} Plaintext Extracted!</strong>
            <p style="margin-bottom:0;">Because the server reused the AES-CTR nonce, the keystream cancelled out completely. Entering guessed snippet <code>"${guessStr}"</code> instantly extracted ${targetLabel} bytes <code>"${recoveredStr}"</code> without knowing secret key K.</p>
          </div>
        </div>`;
      }

      outputContainer.innerHTML = html;

    } catch (err) {
      outputContainer.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">
        <strong>CTR Attack Error:</strong> ${err.message || err}
      </div>`;
    }
  }

  btnRecover.addEventListener('click', runCTRReuseAttack);
  p1Input.addEventListener('input', runCTRReuseAttack);
  p2Input.addEventListener('input', runCTRReuseAttack);
  guessInput.addEventListener('input', runCTRReuseAttack);
  modeSelect.addEventListener('change', runCTRReuseAttack);

  runCTRReuseAttack();
})();
</script>

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Symmetric Mode Vulnerabilities Summary</strong>
    <ul>
      <li><strong>ECB Block Leakage</strong>: Identical plaintext blocks produce identical ciphertext blocks. Never use ECB for multi-block payloads.</li>
      <li><strong>CBC Bit-Flipping</strong>: Modifying ciphertext block <em>C₁</em> flips corresponding bits in decrypted plaintext block <em>P₂</em>. Always enforce AEAD or HMAC.</li>
      <li><strong>CTR Two-Time Pad</strong>: Reusing a counter/nonce exposes <em>C₁ ⊕ C₂ = P₁ ⊕ P₂</em>, allowing adversaries to recover cleartext payloads.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-38A**: *Recommendation for Block Cipher Modes of Operation* — [NIST CSRC SP 800-38A](https://csrc.nist.gov/pubs/sp/800/38/a/final)
- **RFC 8452**: *AES-GCM-SIV: Nonce-Misuse-Resistant Authenticated Encryption* — [IETF RFC 8452](https://www.rfc-editor.org/rfc/rfc8452)
