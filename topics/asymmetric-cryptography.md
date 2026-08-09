---
title: Asymmetric Cryptography & Public-Key Infrastructure
description: Core principles of asymmetric key pairs, HPKE, RSA vs ECC comparison, Ed25519 signatures, and OpenSSL CLI demonstrations proving why private keys cannot encrypt data.
permalink: /topics/asymmetric-cryptography/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Concepts</span>

# Asymmetric Cryptography & Public-Key Infrastructure

<p class="lede">Asymmetric cryptography uses mathematically linked pairs of keys: a Public Key that can be shared freely with any endpoint, and a Private Key that must be kept secret by its owner. Asymmetric primitives solve the key-distribution problem, enable digital signatures for non-repudiation, and establish ephemeral keys for transport security.</p>

## Asymmetric Paradigm: Linked Key Pairs

Unlike symmetric ciphers which rely on a single shared key, asymmetric ciphers generate a key pair (<b>K<sub>pub</sub></b>, <b>K<sub>priv</sub></b>). Operations executed with one key can only be inverted or verified by the corresponding key in the pair.

<div class="diagram-frame">
  <img src="{{ '/assets/img/asymmetric-flow.svg' | relative_url }}" alt="Diagram showing asymmetric cryptography: encryption using public key, decryption using private key, signing using private key, verification using public key.">
  <p class="diagram-caption">Public and private keys have complementary, non-interchangeable roles</p>
</div>

### Three Distinct Operations

1. **Public-Key Encryption (HPKE / RSA-OAEP)**: The sender encrypts a short payload using the recipient's public key; only the recipient's private key can decrypt it.
2. **Digital Signatures (Ed25519 / RSA-PSS)**: The sender computes a signature over data using their private key; anyone holding the sender's public key can verify origin and integrity.
3. **Key Agreement (ECDHE / X25519)**: Peer endpoints combine their own private keys with each other's public keys to derive a matching shared secret.

## Operations Comparison Matrix

| Objective | Public Key Action | Private Key Action | Standard Protocol | Primary Output |
|---|---|---|---|---|
| **Confidentiality** (HPKE) | Encrypts payload / KEM encapsulation | Decrypts payload / KEM decapsulation | RFC 9180 (HPKE), RSA-OAEP | Unreadable ciphertext readable only by private key holder |
| **Integrity &amp; Authenticity** | Verifies signature tag | Generates digital signature tag | Ed25519 (RFC 8032), RSA-PSS, ECDSA | Non-repudiable proof of private key possession |
| **Key Agreement** | Exchanged with peer | Combined with peer public key | Ephemeral ECDH (X25519 / NIST P-256) | Shared symmetric secret key for bulk AEAD encryption |

## Can I Use a Private Key to Encrypt Data?

**No.** It is mathematically impossible to use a private key to encrypt data under any asymmetric algorithm.

A **Private Key is used for Digital Signing** (and for decrypting incoming data locked under its matching public key). Describing a digital signature as *"encrypting data with a private key"* is cryptographically inaccurate for three technical reasons:

1. **Signatures Leave Plaintext Intact**: Digital signing computes a separate signature tag file (*`payload.sig`*) over a message digest while leaving the original payload file (*`payload.txt`*) completely unencrypted and readable in cleartext.
2. **Signature Algorithms Do Not Possess Encryption Functions**: Signature algorithms (*Ed25519, ECDSA, RSA-PSS, FIPS 204 ML-DSA*) operate strictly on mathematical signature equations. They do not contain encryption functions and cannot transform plaintext into ciphertext.
3. **Asymmetric Encryption Standards Enforce Fixed Key Roles**: Asymmetric encryption standards (*RSA-OAEP, HPKE RFC 9180*) define encryption as locking data using a recipient's Public Key. Standardized padding routines (*RSA-OAEP*) cannot execute using a private key, and decryption APIs explicitly reject public keys.

### Client-Side Executable RSA Asymmetric Encryption & Digital Signature Playground

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Browser Playground</span>
    <h3>RSA Asymmetric Key Encryption & Digital Signature Playground</h3>
    <p>Generate real 2048-bit RSA key pairs directly in your browser. Interactively test RSA-OAEP public key encryption, private key decryption, and digital signature verification (Zero server calls / Executed locally via Web Crypto API).</p>
  </div>

  <div class="demo-body">
    <!-- 1. Key Generation Control -->
    <div class="demo-form-group">
      <label>1. Browser Asymmetric Key Pair Management:</label>
      <div class="demo-actions" style="margin: 0.5rem 0;">
        <button id="btn-gen-rsa-keys" class="btn-primary" type="button">🔑 Generate Real 2048-bit RSA Keypair</button>
      </div>
      <small class="demo-help" id="rsa-key-status">Status: Keys generated on page load via Web Crypto API.</small>
    </div>

    <!-- Public / Private Key Display -->
    <div class="demo-form-group">
      <label>Generated Public &amp; Private Keys (PEM Format):</label>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
        <div>
          <small><strong>Recipient Public Key (Shareable):</strong></small>
          <textarea id="rsa-pub-pem" rows="4" class="demo-textarea" readonly style="font-size: 0.72rem; cursor: default;"></textarea>
        </div>
        <div>
          <small><strong>Recipient Private Key (Secret):</strong></small>
          <textarea id="rsa-priv-pem" rows="4" class="demo-textarea" readonly style="font-size: 0.72rem; cursor: default;"></textarea>
        </div>
      </div>
    </div>

    <!-- 2. Asymmetric Encryption Section -->
    <div class="demo-form-group">
      <label for="rsa-plain-input">2. Plaintext Message Input:</label>
      <input type="text" id="rsa-plain-input" class="demo-input" value="Confidential Payroll Data: $100,000" placeholder="Enter message to encrypt or sign...">
      <div class="demo-actions" style="margin: 0.75rem 0 0.5rem;">
        <button id="btn-rsa-encrypt" class="btn-primary" type="button">🔒 Encrypt with Public Key (RSA-OAEP)</button>
        <button id="btn-rsa-decrypt" class="btn-secondary" type="button">🔓 Decrypt with Private Key</button>
        <button id="btn-rsa-fail-decrypt" class="btn-secondary" type="button" style="color: #b91c1c; border-color: #fca5a5;">❌ Attempt Decrypt with Public Key</button>
      </div>
    </div>

    <!-- Encryption Output Display -->
    <div id="rsa-enc-output-area" class="demo-output-area"></div>

    <hr style="border: 0; border-top: 1px solid var(--rule); margin: 1.5rem 0;">

    <!-- 3. Digital Signature Section -->
    <div class="demo-form-group">
      <label>3. Digital Signature &amp; Integrity Verification:</label>
      <p style="font-size: 0.85rem; color: var(--muted); margin: 0.25rem 0 0.75rem;">Proving that signing locks a hash digest tag, leaving the original payload file 100% unencrypted in cleartext.</p>
      <div class="demo-actions" style="margin-bottom: 0.5rem;">
        <button id="btn-rsa-sign" class="btn-primary" type="button">✍️ Sign Payload with Private Key</button>
        <button id="btn-rsa-verify" class="btn-secondary" type="button">✔ Verify Signature with Public Key</button>
      </div>
    </div>

    <!-- Signature Output Display -->
    <div id="rsa-sig-output-area" class="demo-output-area"></div>
  </div>
</div>

<script>
(function() {
  const btnGenKeys = document.getElementById('btn-gen-rsa-keys');
  const pubPemText = document.getElementById('rsa-pub-pem');
  const privPemText = document.getElementById('rsa-priv-pem');
  const keyStatus = document.getElementById('rsa-key-status');

  const plainInput = document.getElementById('rsa-plain-input');
  const btnEncrypt = document.getElementById('btn-rsa-encrypt');
  const btnDecrypt = document.getElementById('btn-rsa-decrypt');
  const btnFailDecrypt = document.getElementById('btn-rsa-fail-decrypt');
  const encOutput = document.getElementById('rsa-enc-output-area');

  const btnSign = document.getElementById('btn-rsa-sign');
  const btnVerify = document.getElementById('btn-rsa-verify');
  const sigOutput = document.getElementById('rsa-sig-output-area');

  if (!btnGenKeys || !encOutput) return;

  let encKeyPair = null;
  let signKeyPair = null;
  let currentCipherBytes = null;
  let currentSignatureBytes = null;

  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  function formatPEM(b64, type) {
    const lines = b64.match(/.{1,64}/g) || [b64];
    return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
  }

  async function generateRSAKeys() {
    try {
      keyStatus.innerHTML = '<span style="color: var(--amber); font-weight: 600;">⏳ Generating 2048-bit RSA keys...</span>';

      // 1. RSA-OAEP Keys for Encryption
      encKeyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
      );

      // 2. RSASSA-PKCS1-v1_5 Keys for Signature
      signKeyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSASSA-PKCS1-v1_5",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256"
        },
        true,
        ["sign", "verify"]
      );

      // Export Public Key to PEM
      const pubSpki = await window.crypto.subtle.exportKey("spki", encKeyPair.publicKey);
      const pubB64 = arrayBufferToBase64(pubSpki);
      pubPemText.value = formatPEM(pubB64, "PUBLIC KEY");

      // Export Private Key to PEM
      const privPkcs8 = await window.crypto.subtle.exportKey("pkcs8", encKeyPair.privateKey);
      const privB64 = arrayBufferToBase64(privPkcs8);
      privPemText.value = formatPEM(privB64, "PRIVATE KEY");

      keyStatus.innerHTML = '<span style="color: #15803d; font-weight: 600;">✔ 2048-bit RSA Keypair Generated Successfully!</span>';
    } catch (err) {
      keyStatus.innerHTML = `<span style="color: #b91c1c;">Key Generation Error: ${err.message || err}</span>`;
    }
  }

  async function handleEncrypt() {
    try {
      if (!encKeyPair) await generateRSAKeys();
      const textVal = plainInput.value;
      const encoder = new TextEncoder();
      const plainBytes = encoder.encode(textVal);

      const encrypted = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        encKeyPair.publicKey,
        plainBytes
      );

      currentCipherBytes = new Uint8Array(encrypted);
      const hexStr = bytesToHex(currentCipherBytes);

      encOutput.innerHTML = `
      <div class="ecb-blocks-list">
        <div class="ecb-block-item target-block-decrypted">
          <div class="block-meta">
            <span class="block-num">RSA-OAEP Binary Ciphertext Output (${currentCipherBytes.length} Bytes)</span>
            <span class="block-plain-preview">Encrypted under Public Key</span>
          </div>
          <div class="block-hex-val" style="word-break: break-all; font-size: 0.78rem;">
            <code>${hexStr}</code>
          </div>
        </div>
      </div>`;
    } catch (err) {
      encOutput.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">
        <strong>Encryption Error:</strong> ${err.message || err}
      </div>`;
    }
  }

  async function handleDecrypt() {
    try {
      if (!currentCipherBytes) {
        encOutput.innerHTML = '<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">⚠️ Please encrypt a message first before decrypting.</div>';
        return;
      }

      const decrypted = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        encKeyPair.privateKey,
        currentCipherBytes
      );

      const decText = new TextDecoder().decode(decrypted);

      encOutput.innerHTML = `
      <div class="ecb-blocks-list">
        <div class="ecb-block-item target-block-decrypted">
          <div class="block-meta">
            <span class="block-num">Decrypted Plaintext Output</span>
            <span class="block-plain-preview">✔ Decrypted via Private Key</span>
          </div>
          <div class="block-hex-val">
            <code>"<strong>${decText}</strong>"</code>
            <span class="matched-tag">✔ RECOVERED OK</span>
          </div>
        </div>
      </div>`;
    } catch (err) {
      encOutput.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">
        <strong>Decryption Error:</strong> ${err.message || err}
      </div>`;
    }
  }

  async function handleFailDecrypt() {
    try {
      if (!currentCipherBytes) {
        encOutput.innerHTML = '<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">⚠️ Please encrypt a message first.</div>';
        return;
      }
      // Intentionally pass Public Key to decrypt API (Key Usage rejection)
      await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        encKeyPair.publicKey,
        currentCipherBytes
      );
    } catch (err) {
      encOutput.innerHTML = `
      <div class="security-layer security-layer-direct" style="margin-top: 1rem;">
        <div class="security-layer-label">API Contract Rejection Confirmed</div>
        <div>
          <strong>Public Key Decryption Rejected by Web Crypto API!</strong>
          <p style="margin-bottom:0;">Error Message: <code>${err.message || err}</code>. Asymmetric cryptography standards explicitly prohibit using Public Keys for decryption!</p>
        </div>
      </div>`;
    }
  }

  async function handleSign() {
    try {
      if (!signKeyPair) await generateRSAKeys();
      const textVal = plainInput.value;
      const encoder = new TextEncoder();
      const plainBytes = encoder.encode(textVal);

      const sigBuffer = await window.crypto.subtle.sign(
        { name: "RSASSA-PKCS1-v1_5" },
        signKeyPair.privateKey,
        plainBytes
      );

      currentSignatureBytes = new Uint8Array(sigBuffer);
      const sigHex = bytesToHex(currentSignatureBytes);

      sigOutput.innerHTML = `
      <div class="ecb-blocks-list">
        <div class="ecb-block-item">
          <div class="block-meta">
            <span class="block-num">Original Payload File (100% Cleartext Unchanged)</span>
            <span class="block-plain-preview">NOT ENCRYPTED!</span>
          </div>
          <div class="block-hex-val">
            <code>"<strong>${textVal}</strong>"</code>
          </div>
        </div>

        <div class="ecb-block-item target-block-decrypted">
          <div class="block-meta">
            <span class="block-num">RSASSA-PKCS1-v1_5 Digital Signature Tag (${currentSignatureBytes.length} Bytes)</span>
            <span class="block-plain-preview">Signed via Private Key</span>
          </div>
          <div class="block-hex-val" style="word-break: break-all; font-size: 0.75rem;">
            <code>${sigHex}</code>
          </div>
        </div>
      </div>`;
    } catch (err) {
      sigOutput.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">
        <strong>Signature Error:</strong> ${err.message || err}
      </div>`;
    }
  }

  async function handleVerify() {
    try {
      if (!currentSignatureBytes) {
        sigOutput.innerHTML = '<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">⚠️ Please generate a signature first.</div>';
        return;
      }

      const textVal = plainInput.value;
      const encoder = new TextEncoder();
      const plainBytes = encoder.encode(textVal);

      const isValid = await window.crypto.subtle.verify(
        { name: "RSASSA-PKCS1-v1_5" },
        signKeyPair.publicKey,
        currentSignatureBytes,
        plainBytes
      );

      if (isValid) {
        sigOutput.innerHTML += `
        <div class="security-layer security-layer-protect" style="margin-top: 1rem;">
          <div class="security-layer-label">Signature Verification Successful</div>
          <div>
            <strong>✔ Signature Verified OK!</strong>
            <p style="margin-bottom:0;">The signature tag matches the message payload and was mathematically generated by the holder of the matching Private Key.</p>
          </div>
        </div>`;
      } else {
        sigOutput.innerHTML += `
        <div class="security-layer security-layer-direct" style="margin-top: 1rem;">
          <div class="security-layer-label">Verification Failure</div>
          <div>
            <strong>❌ Signature Invalid!</strong>
            <p style="margin-bottom:0;">The payload or signature has been tampered with.</p>
          </div>
        </div>`;
      }
    } catch (err) {
      sigOutput.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">
        <strong>Verification Error:</strong> ${err.message || err}
      </div>`;
    }
  }

  btnGenKeys.addEventListener('click', generateRSAKeys);
  btnEncrypt.addEventListener('click', handleEncrypt);
  btnDecrypt.addEventListener('click', handleDecrypt);
  btnFailDecrypt.addEventListener('click', handleFailDecrypt);

  btnSign.addEventListener('click', handleSign);
  btnVerify.addEventListener('click', handleVerify);

  // Generate initial keypair on load
  generateRSAKeys();
})();
</script>

## Comparative Analysis: RSA vs Elliptic Curve Cryptography (ECC)

To achieve a given **Symmetric Security Strength** (measured in bits of brute-force work), asymmetric algorithm key sizes scale at drastically different rates:

| Target Security Strength (NIST SP 800-57) | Required RSA Key Size (Prime Factorization) | Required ECC Key Size (Elliptic Curve Discrete Log) | Key Size Efficiency &amp; Guidance |
|---|---|---|---|
| **112-bit Security** (Legacy Minimum) | **2,048 bits** | **224 bits** | ECC key is ~9x smaller than RSA. Legacy minimum strength. |
| **128-bit Security** (Current Standard) | **3,072 bits** | **256 bits** (Curve25519 / P-256) | ECC key is **12x smaller** than RSA. Standard for web TLS/SSL. |
| **192-bit Security** (High Security) | **7,680 bits** (Exponential Spike!) | **384 bits** (P-384) | ECC key is **20x smaller** than RSA. RSA-7680 causes severe CPU overhead. |
| **256-bit Security** (Maximum Strength) | **15,360 bits** | **512 bits** (P-521) | ECC key is **30x smaller** than RSA. RSA-15360 is unviable for production TLS. |

<div class="diagram-frame">
  <img src="{{ '/assets/img/key-size-comparison.svg' | relative_url }}?v=2" alt="Bar chart comparing RSA and ECC key sizes in bits across 112-bit, 128-bit, and 192-bit security strengths. RSA-7680 spikes exponentially while ECC-384 remains compact.">
  <p class="diagram-caption">Key size growth (Y-Axis: Key Length in Bits): RSA key sizes scale exponentially, whereas ECC key sizes scale linearly</p>
</div>

### Why the RSA-7680 Bar Spikes Exponentially

1. **Y-Axis Unit**: The vertical height of the chart measures **Required Key Length in Bits**.
2. **Sub-Exponential Attacks on RSA**: General Number Field Sieve (GNFS) algorithms allow attackers to factor RSA primes faster than pure brute-force. To counter this, increasing RSA's security strength requires **exponentially larger RSA key sizes** (2,048 bits → 3,072 bits → 7,680 bits → 15,360 bits).
3. **Linear Scaling of ECC**: Elliptic Curve Discrete Logarithms (ECDLP) have no sub-exponential attack algorithm. Doubling ECC's security strength requires only doubling the curve key size (224 bits → 256 bits → 384 bits → 512 bits).
4. **Engineering Consequence**: At 192-bit security, RSA requires a towering **7,680-bit key** (a 2.5x spike from 3,072 bits!), rendering RSA handshakes extremely slow and CPU-intensive compared to a compact **384-bit ECC key**.

### Why Ed25519 (EdDSA) is Preferred for Modern Applications

Specified in **[RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)**, **Ed25519** offers major advantages over legacy ECDSA:
- **Deterministic Nonce Derivation**: Ed25519 derives its per-signature nonce deterministically from the private key and message hash, eliminating catastrophic ECDSA private key leaks caused by weak random number generators.
- **Side-Channel &amp; Timing Attack Resistance**: Implemented using complete addition formulas on Edwards curves without conditional branching.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Asymmetric Cryptography Summary</strong>
    <ul>
      <li><strong>Private Keys Cannot Encrypt Data</strong>: Private keys are used for Digital Signing. Asymmetric encryption locks data under a recipient's Public Key (HPKE / RSA-OAEP).</li>
      <li><strong>RSA vs. ECC Efficiency</strong>: 256-bit Elliptic Curve keys (Curve25519 / P-256) provide equivalent security to 3072-bit RSA with 12× smaller key sizes.</li>
      <li><strong>HPKE (RFC 9180)</strong>: Standardized hybrid public-key encryption API combining KEM key exchange, HKDF expansion, and AEAD encryption.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 9180**: *Hybrid Public Key Encryption (HPKE)* — [IETF RFC 9180](https://www.rfc-editor.org/rfc/rfc9180)
- **NIST SP 800-56B Rev. 2**: *Recommendation for Pair-Wise Key-Establishment Schemes Using Integer Factorization Cryptography* — [NIST CSRC SP 800-56B](https://csrc.nist.gov/pubs/sp/800/56/b/r2/final)
