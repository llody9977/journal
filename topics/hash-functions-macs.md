---
title: Hash Functions & MACs
description: Cryptographic hash properties (Preimage, 2nd-Preimage, Collision resistance), SHA-2/SHA-3 standards, HMAC-SHA256, KMAC, BLAKE3, and length-extension mitigation.
permalink: /topics/hash-functions-macs/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Concepts</span>

# Hash Functions & MACs

<p class="lede">Cryptographic hash functions map arbitrary-length data streams into fixed-size digest values, providing integrity verification and avalanche diffusion. Unkeyed hashes prove payload integrity against accidental corruption, whereas Hash-based Message Authentication Codes (HMAC) incorporate a shared secret key to provide origin authentication and protect against active tampering.</p>

## The Three Formal Security Properties

Standardized in **[FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/final)** and **[FIPS 202](https://csrc.nist.gov/pubs/fips/202/final)**, a secure cryptographic hash function **H(x)** must satisfy three formal mathematical properties:

<div class="diagram-frame">
  <img src="{{ '/assets/img/hash-security-properties.svg' | relative_url }}" alt="Comparison of preimage, second-preimage, and collision resistance in cryptographic hash functions.">
  <p class="diagram-caption">The three hash properties describe different attacker search problems</p>
</div>

| Security Property | Mathematical &amp; Search Definition | Failure Consequence | Target Engineering Mitigation |
|---|---|---|---|
| **Collision Resistance** | Infeasible to find *any* pair **x ≠ x'** such that **H(x) = H(x')**. | Attacker generates two distinct documents (one benign, one malicious) sharing an identical hash. | Migrate from MD5 / SHA-1 to SHA-256 or SHA3-256. |
| **Preimage Resistance** (One-Way) | Given **y = H(x)**, infeasible to compute original **x**. | Attacker reverses a stored password digest or token hash to recover the secret plaintext. | Deploy salted password hashes (**Argon2id**) or CSPRNG secret tokens. |
| **Second-Preimage Resistance** | Given **x**, infeasible to find **x' ≠ x** such that **H(x) = H(x')**. | Attacker substitutes a malicious software binary for a target release while matching its published hash. | Verify cryptographic signatures over releases rather than plain unkeyed hashes. |

### The Avalanche Effect

A secure cryptographic hash exhibits strong **avalanche diffusion**: modifying a single bit in the input alters approximately 50% of the output bits in an unpredictable pattern.

<div class="diagram-frame">
  <img src="{{ '/assets/img/hash-avalanche.svg' | relative_url }}" alt="SHA-256 avalanche effect showing how changing a single character flips half the digest bits.">
  <p class="diagram-caption">SHA-256 avalanche effect: altering one character produces an unrelated digest</p>
</div>

## Hash Algorithm Status Matrix

| Algorithm | Digest Size | Current Security Status | Target Applications |
|---|---|---|---|
| **BLAKE3** | Variable (256-bit default) | **HIGH-SPEED APPROVED**: Tree-hashing design with extreme multi-core parallelism. | High-throughput file deduplication, supply chain hashing, tree proofs. |
| **KMAC128 / KMAC256** | Variable ([NIST SP 800-185](https://csrc.nist.gov/pubs/sp/800/185/final)) | **APPROVED NIST MAC**: Keccak-based PRF/MAC natively immune to length extension. | High-assurance message authentication without HMAC nested overhead. |
| **MD5** | 128 bits | **CRITICALLY BROKEN**: Practical collisions demonstrated (Flame malware, 2004). | Legacy non-security checksums (*Do not use for security*). |
| **SHA-1** | 160 bits | **BROKEN**: Practical collision demonstrated ("SHAttered" attack, 2017). Prohibited by NIST SP 800-131A. | Deprecated (*Do not use for signatures or security*). |
| **SHA-256 / SHA-512** (SHA-2) | 256 / 512 bits | **APPROVED &amp; STANDARD**: Primary federal and commercial hash standard. | Digital signatures, TLS 1.3, WebAuthn, block headers. |
| **SHA3-256 / SHA3-512** (SHA-3) | 256 / 512 bits | **APPROVED ALTERNATIVE**: Based on Keccak sponge construction (FIPS 202). | High-assurance alternative hedging against SHA-2 cryptanalysis. |

## Hash-based Message Authentication Codes (HMAC) & KMAC

Unkeyed hashes like `SHA-256(message)` do not prove origin authenticity; an attacker in the middle can alter both the message payload and the digest.

Standardized in **[FIPS 198-1](https://csrc.nist.gov/pubs/fips/198-1/final)**, **HMAC** binds a secret key **K** to the message:

**HMAC(K, M) = H((K ⊕ opad) || H((K ⊕ ipad) || M))**

<div class="diagram-frame">
  <img src="{{ '/assets/img/hmac-flow.svg' | relative_url }}" alt="HMAC nested hash flow diagram showing inner and outer key padding blocks.">
  <p class="diagram-caption">HMAC-SHA256 nested construction: double-hashing with inner (ipad) and outer (opad) key padding</p>
</div>

### Why Naive `H(Key || Message)` Fails: Length-Extension Attacks

Naive concatenation `H(key || message)` using Merkle–Damgård hashes (MD5, SHA-1, SHA-256) is vulnerable to **length-extension attacks**. An adversary observing `H(key || message)` can compute a valid digest for `key || message || padding || attacker_data` without learning `key`.

HMAC's nested construction prevents length-extension attacks by wrapping the inner hash output inside an outer hash layer protected by `opad`. Modern sponge-based constructions (**SHA-3 / FIPS 202**, **KMAC / SP 800-185**, **BLAKE3**) are inherently immune to length extension by design.

### Client-Side Executable Hash Digest & HMAC-SHA256 Authentication Playground

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Browser Playground</span>
    <h3>SHA-256 Digest & HMAC-SHA256 Authentication Playground</h3>
    <p>Compute unkeyed SHA-256 digests and keyed HMAC-SHA256 authentication tags directly in your browser. Test secret key verification and observe how invalid keys trigger authentication rejections (Zero server calls / Executed locally via Web Crypto API).</p>
  </div>

  <div class="demo-body">
    <!-- 1. Payload Input -->
    <div class="demo-form-group">
      <label for="hmac-payload-input">1. Message Payload Input:</label>
      <input type="text" id="hmac-payload-input" class="demo-input" value="The quick brown fox" placeholder="Enter message payload...">
    </div>

    <!-- 2. Secret Key Inputs -->
    <div class="demo-form-group">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
        <div>
          <label for="hmac-key-input">2. Sender Secret Key (HMAC Generator):</label>
          <input type="text" id="hmac-key-input" class="demo-input" value="secret-key-32-bytes" placeholder="Enter shared secret key...">
        </div>
        <div>
          <label for="hmac-verify-key-input">3. Receiver Verification Key (Test Authentication):</label>
          <input type="text" id="hmac-verify-key-input" class="demo-input" value="secret-key-32-bytes" placeholder="Enter key to verify...">
        </div>
      </div>
      <small class="demo-help">Try changing the Receiver Verification Key to <code>"wrong-secret-key"</code> to verify invalid authentication rejection!</small>
    </div>

    <!-- 3. Actions -->
    <div class="demo-form-group">
      <div class="demo-actions" style="margin: 0.5rem 0;">
        <button id="btn-run-hmac" class="btn-primary" type="button">⚡ Compute Hash &amp; Verify HMAC Tag</button>
        <button id="btn-invalid-key" class="btn-secondary" type="button" style="color: #b91c1c; border-color: #fca5a5;">❌ Inject Wrong Key ("wrong-key")</button>
        <button id="btn-reset-hmac" class="btn-secondary" type="button">Reset Default Key</button>
      </div>
    </div>

    <!-- 4. Output Displays -->
    <div id="hmac-output-area" class="demo-output-area"></div>
  </div>
</div>

<script>
(function() {
  const payloadInput = document.getElementById('hmac-payload-input');
  const keyInput = document.getElementById('hmac-key-input');
  const verifyKeyInput = document.getElementById('hmac-verify-key-input');
  const btnRun = document.getElementById('btn-run-hmac');
  const btnInvalid = document.getElementById('btn-invalid-key');
  const btnReset = document.getElementById('btn-reset-hmac');
  const outputArea = document.getElementById('hmac-output-area');

  if (!payloadInput || !keyInput || !verifyKeyInput || !btnRun || !outputArea) return;

  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function runHmacCalculation() {
    try {
      const payloadStr = payloadInput.value;
      const keyStr = keyInput.value;
      const verifyKeyStr = verifyKeyInput.value;

      const encoder = new TextEncoder();
      const payloadBytes = encoder.encode(payloadStr);

      // 1. Unkeyed SHA-256 Digest
      const shaBuffer = await window.crypto.subtle.digest("SHA-256", payloadBytes);
      const shaHex = bytesToHex(new Uint8Array(shaBuffer));

      // 2. Keyed HMAC-SHA256 Generation
      const genCryptoKey = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(keyStr),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const hmacBuffer = await window.crypto.subtle.sign(
        "HMAC",
        genCryptoKey,
        payloadBytes
      );
      const hmacBytes = new Uint8Array(hmacBuffer);
      const hmacHex = bytesToHex(hmacBytes);

      // 3. Receiver HMAC Verification using verifyKeyStr
      const verifyCryptoKey = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(verifyKeyStr),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );

      const isValid = await window.crypto.subtle.verify(
        "HMAC",
        verifyCryptoKey,
        hmacBytes,
        payloadBytes
      );

      let html = '<div class="ecb-blocks-list">';

      // SHA-256 Digest Display
      html += `
      <div class="ecb-block-item">
        <div class="block-meta">
          <span class="block-num">Unkeyed SHA-256 Hash Digest (32 Bytes / 256 Bits)</span>
          <span class="block-plain-preview">No Origin Authentication</span>
        </div>
        <div class="block-hex-val" style="word-break: break-all; font-size: 0.78rem;">
          <code>${shaHex}</code>
        </div>
      </div>`;

      // HMAC-SHA256 Tag Display
      html += `
      <div class="ecb-block-item ${isValid ? 'target-block-decrypted' : 'is-repeat-block'}">
        <div class="block-meta">
          <span class="block-num">Keyed HMAC-SHA256 Authentication Tag</span>
          <span class="block-plain-preview">Key: "${keyStr}"</span>
        </div>
        <div class="block-hex-val" style="word-break: break-all; font-size: 0.78rem;">
          <code>${hmacHex}</code>
        </div>
      </div>`;

      html += '</div>';

      if (isValid) {
        html += `
        <div class="security-layer security-layer-protect" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Authentication Status</div>
          <div>
            <strong>✔ AUTHENTICATION SUCCESSFUL!</strong>
            <p style="margin-bottom:0;">The receiver verification key <code>"${verifyKeyStr}"</code> matches the sender key. Payload integrity and origin authenticity are 100% verified!</p>
          </div>
        </div>`;
      } else {
        html += `
        <div class="security-layer security-layer-direct" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Authentication Status</div>
          <div>
            <strong>❌ AUTHENTICATION FAILED! (Invalid Secret Key)</strong>
            <p style="margin-bottom:0;">The receiver verification key <code>"${verifyKeyStr}"</code> does not match the sender key. The HMAC authentication tag was rejected!</p>
          </div>
        </div>`;
      }

      outputArea.innerHTML = html;

    } catch (err) {
      outputArea.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">
        <strong>HMAC Error:</strong> ${err.message || err}
      </div>`;
    }
  }

  btnRun.addEventListener('click', runHmacCalculation);
  payloadInput.addEventListener('input', runHmacCalculation);
  keyInput.addEventListener('input', runHmacCalculation);
  verifyKeyInput.addEventListener('input', runHmacCalculation);

  btnInvalid.addEventListener('click', function() {
    verifyKeyInput.value = "wrong-secret-key";
    runHmacCalculation();
  });

  btnReset.addEventListener('click', function() {
    verifyKeyInput.value = keyInput.value;
    runHmacCalculation();
  });

  runHmacCalculation();
})();
</script>

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Hash &amp; MAC Summary</strong>
    <ul>
      <li><strong>Three Security Properties</strong>: Preimage resistance (one-way), Second-preimage resistance (target substitution proof), Collision resistance (any match proof).</li>
      <li><strong>HMAC Construction</strong>: HMAC uses double-nested key hashing (<code>ipad</code> / <code>opad</code>) to prevent Merkle–Damgård length-extension attacks.</li>
      <li><strong>Modern Sponge MACs</strong>: KMAC (SP 800-185) and BLAKE3 are inherently immune to length extension by design.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST FIPS 180-4**: *Secure Hash Standard (SHS)* — [NIST CSRC FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/final)
- **NIST FIPS 198-1**: *The Keyed-Hash Message Authentication Code (HMAC)* — [NIST CSRC FIPS 198-1](https://csrc.nist.gov/pubs/fips/198-1/final)
- **NIST SP 800-185**: *SHA-3 Derived Functions: cSHAKE, KMAC, TupleHash, and ParallelHash* — [NIST CSRC SP 800-185](https://csrc.nist.gov/pubs/sp/800/185/final)
