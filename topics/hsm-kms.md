---
title: HSM & KMS
description: Deep architectural guide to Hardware Security Modules (HSMs), Cloud KMS, FIPS 140-3 levels, non-extractable keys, envelope encryption, and CMEK.
permalink: /topics/hsm-kms/
last_verified: 2026-08-06
---

<span class="eyebrow">Key Management / Architecture</span>

# HSM & KMS

<p class="lede">Hardware Security Modules (HSMs) and Key Management Services (KMS) provide secure cryptographic key lifecycle management, enforced non-extractability, and physical tamper resistance. This page analyzes physical and logical key protection levels (FIPS 140-3 Levels 1–4), envelope key hierarchies (DEK/KEK), customer-managed encryption key (CMEK) delegation, and PKCS#11 token integration.</p>

## Hardware Security Modules (HSM) & FIPS 140-3 Levels

A **Hardware Security Module (HSM)** is a hardened, physical computing device designed to safeguard secret cryptographic keys within an audited, tamper-resistant boundary.

Standardized in **[NIST FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final)**, cryptographic module assurance divides into four security levels:

| FIPS 140-3 Level | Security Assurance & Requirements | Representative Deployment |
|---|---|---|
| **Level 1** | Basic cryptographic algorithm verification; no physical security requirements. | Software-based cryptographic libraries (*OpenSSL, SoftHSM*) |
| **Level 2** | Role-based access control and **tamper-evident** physical enclosures. | Multi-tenant cloud KMS software containers |
| **Level 3** | **Tamper-resistant** hardware with automatic zeroization (key destruction) upon physical intrusion. | Commercial HSMs (*AWS CloudHSM, Thales Luna G7, YubiHSM2*) |
| **Level 4** | Complete environmental attack protection (voltage, temperature, chemical probing). | High-assurance military and banking payment HSMs |

---

## Non-Extractable Key Attributes (PKCS#11 Standard)

HSMs enforce logical non-extractability: secret key material ($K_{priv}$) is generated inside the hardware boundary and marked with unalterable object flags. Cryptographic operations (signing, decryption) execute inside the HSM; raw key bytes are never exported to host system RAM.

### PKCS#11 Core Attributes Matrix

| PKCS#11 Attribute | Flag Value | Enforcement Behavior |
|---|---|---|
| `CKA_SENSITIVE` | `CK_TRUE` | Prevents cleartext key export via API calls. |
| `CKA_EXTRACTABLE` | `CK_FALSE` | Prohibits wrapping or exporting the key under any wrapping key. |
| `CKA_ALWAYS_SENSITIVE` | `CK_TRUE` | Guarantees the key has been sensitive since initial generation. |
| `CKA_NEVER_EXTRACTABLE` | `CK_TRUE` | Asserts the key was never exported across its entire lifecycle. |

---

## Envelope Encryption Architecture (DEK / KEK)

Cloud applications avoid encrypting bulk payloads directly with KMS APIs due to payload size limits (e.g., AWS KMS limits `Encrypt` calls to 4 KB) and API network latency. Instead, architectures enforce **Envelope Encryption**:

<div class="diagram-frame">
  <img src="{{ '/assets/img/envelope-encryption.svg' | relative_url }}" alt="Envelope encryption process: generate a DEK, encrypt the payload, wrap the DEK with a KMS key, and store the encrypted envelope.">
  <p class="diagram-caption">The KMS protects the small DEK while the application encrypts the bulk data locally</p>
</div>

1. **Data Encryption Key (DEK)**: High-speed symmetric key (AES-256-GCM) generated locally per payload.
2. **Key Encryption Key (KEK)**: Non-extractable master key stored inside KMS/HSM that wraps the DEK via AES Key Wrap ([RFC 3394](https://www.rfc-editor.org/rfc/rfc3394) / [NIST SP 800-38F](https://csrc.nist.gov/pubs/sp/800/38/f/final)).

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Web Crypto Simulator</span>
    <h3>Client-Side Envelope Encryption Simulator (DEK / KEK)</h3>
    <p>Generate a Master KEK and a local single-use AES-256-GCM DEK in Web Crypto to wrap keys and encrypt data locally without exposing raw DEKs.</p>
  </div>

  <div class="demo-body">
    <div class="demo-form-group">
      <label for="envelope-plaintext">Payload to Encrypt:</label>
      <input id="envelope-plaintext" type="text" class="demo-input" value="Confidential Database Record: SSN 000-12-3456 | Salary $185,000">
    </div>

    <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
      <button id="btn-encrypt-envelope" class="btn-primary" type="button">&#128274; Encrypt Envelope (Generate DEK + Wrap Key)</button>
      <button id="btn-decrypt-envelope" class="btn-secondary" type="button" disabled>&#128275; Decrypt Envelope (Unwrap DEK + Decrypt Payload)</button>
    </div>

    <!-- Output Inspection Cards -->
    <div id="envelope-output-area" style="margin-top: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;"></div>
  </div>
</div>

{% raw %}
<script>
(function() {
  const plaintextInput = document.getElementById('envelope-plaintext');
  const btnEncrypt = document.getElementById('btn-encrypt-envelope');
  const btnDecrypt = document.getElementById('btn-decrypt-envelope');
  const outputArea = document.getElementById('envelope-output-area');

  if (!plaintextInput || !btnEncrypt || !btnDecrypt || !outputArea) return;

  let masterKEK = null;
  let envelopeData = null;

  function bytesToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function encryptEnvelope() {
    const text = plaintextInput.value;
    if (!text) return;

    try {
      // 1. Generate 256-bit Master KEK (simulated in KMS/HSM)
      masterKEK = await window.crypto.subtle.generateKey(
        { name: 'AES-KW', length: 256 },
        true,
        ['wrapKey', 'unwrapKey']
      );

      // 2. Generate single-use 256-bit DEK (AES-GCM)
      const dek = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // Export raw DEK bytes before wrapping (strictly to display in demo)
      const rawDekBytes = await window.crypto.subtle.exportKey('raw', dek);

      // 3. Encrypt payload with DEK
      const encoder = new TextEncoder();
      const payloadBytes = encoder.encode(text);
      const nonce = window.crypto.getRandomValues(new Uint8Array(12));

      const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce, tagLength: 128 },
        dek,
        payloadBytes
      );

      // 4. Wrap DEK using Master KEK (AES Key Wrap)
      const wrappedDekBuffer = await window.crypto.subtle.wrapKey(
        'raw',
        dek,
        masterKEK,
        'AES-KW'
      );

      envelopeData = {
        nonce: nonce,
        ciphertext: cipherBuffer,
        wrappedDek: wrappedDekBuffer,
        rawDekHex: bytesToHex(rawDekBytes)
      };

      btnDecrypt.disabled = false;

      outputArea.innerHTML = `
        <div style="background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; font-size: 0.85rem;">
          <strong style="color: var(--teal); display: block; margin-bottom: 0.35rem;">&#128272; Step 1: Master KEK (KMS Custody Boundary)</strong>
          <span style="color: var(--muted); font-size: 0.8rem;">AES-256 Key-Wrap Key (AES-KW RFC 3394) generated inside KMS boundary.</span>
        </div>
        <div style="background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; font-size: 0.85rem;">
          <strong style="color: var(--accent); display: block; margin-bottom: 0.35rem;">&#128195; Step 2: Single-Use Data Encryption Key (DEK)</strong>
          <span style="color: var(--muted); display: block; font-size: 0.8rem;">Raw DEK Hex (RAM Ephemeral):</span>
          <code style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink); word-break: break-all;">${envelopeData.rawDekHex}</code>
        </div>
        <div style="background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; font-size: 0.85rem;">
          <strong style="color: var(--amber); display: block; margin-bottom: 0.35rem;">&#128230; Step 3: Wrapped DEK (EDEK Stored Beside Data)</strong>
          <span style="color: var(--muted); display: block; font-size: 0.8rem;">Wrapped DEK Hex (AES Key Wrap output):</span>
          <code style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink); word-break: break-all;">${bytesToHex(envelopeData.wrappedDek)}</code>
        </div>
        <div style="background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; font-size: 0.85rem;">
          <strong style="color: var(--ink); display: block; margin-bottom: 0.35rem;">&#128274; Step 4: Encrypted Payload &amp; Nonce</strong>
          <span style="color: var(--muted); display: block; font-size: 0.8rem;">GCM Nonce (Hex): <code style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink);">${bytesToHex(envelopeData.nonce)}</code></span>
          <span style="color: var(--muted); display: block; font-size: 0.8rem; margin-top: 0.25rem;">Ciphertext (Hex):</span>
          <code style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink); word-break: break-all;">${bytesToHex(envelopeData.ciphertext)}</code>
        </div>
      `;
    } catch (err) {
      outputArea.innerHTML = `<div style="color: var(--critical); font-size: 0.85rem;">Error: ${err.message}</div>`;
    }
  }

  async function decryptEnvelope() {
    if (!masterKEK || !envelopeData) return;

    try {
      // 1. Unwrap DEK using Master KEK
      const unwrappedDEK = await window.crypto.subtle.unwrapKey(
        'raw',
        envelopeData.wrappedDek,
        masterKEK,
        'AES-KW',
        { name: 'AES-GCM', length: 256 },
        true,
        ['decrypt']
      );

      // 2. Decrypt ciphertext payload with unwrapped DEK
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: envelopeData.nonce, tagLength: 128 },
        unwrappedDEK,
        envelopeData.ciphertext
      );

      const decoder = new TextDecoder();
      const decryptedText = decoder.decode(decryptedBuffer);

      outputArea.innerHTML += `
        <div style="background: rgba(15, 118, 110, 0.08); border: 1px solid var(--teal); border-radius: 6px; padding: 0.75rem; font-size: 0.85rem; margin-top: 0.5rem;">
          <strong style="color: var(--teal); display: block; margin-bottom: 0.35rem;">&#9989; Step 5: Envelope Successfully Decrypted!</strong>
          <span style="color: var(--muted); display: block; font-size: 0.8rem;">Decrypted Payload Output:</span>
          <code style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; color: var(--teal);">${decryptedText}</code>
        </div>
      `;
    } catch (err) {
      outputArea.innerHTML += `<div style="color: var(--critical); font-size: 0.85rem; margin-top: 0.5rem;">Decryption Error: ${err.message}</div>`;
    }
  }

  btnEncrypt.addEventListener('click', encryptEnvelope);
  btnDecrypt.addEventListener('click', decryptEnvelope);
})();
</script>
{% endraw %}

```javascript
// Node.js Envelope Encryption Implementation
const crypto = require('node:crypto');

function encryptEnvelope(plaintextBuffer, kekBuffer) {
  // 1. Generate a single-use 256-bit DEK and 96-bit GCM nonce
  const dek = crypto.randomBytes(32);
  const nonce = crypto.randomBytes(12);

  // 2. Encrypt payload using AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintextBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // 3. Wrap DEK using AES Key Wrap (RFC 3394) under KMS KEK
  const iv = Buffer.alloc(8, 0xa6); // Standard 64-bit IV for AES Key Wrap
  const cipherWrap = crypto.createCipheriv('aes256-wrap', kekBuffer, iv);
  const wrappedDek = Buffer.concat([cipherWrap.update(dek), cipherWrap.final()]);

  // 4. Return envelope containing encrypted DEK, nonce, authTag, and ciphertext
  return { wrappedDek, nonce, authTag, ciphertext };
}
```

---

## Customer Key Custody Models (CMEK vs BYOK vs HYOK)

| Key Custody Model | Operative Key Storage | Cloud Vendor Access Boundary | Ideal Use Case |
|---|---|---|---|
| **Provider-Managed Key** | Shared Cloud KMS | Full automated access; transparent provider lifecycle management. | Low-risk general infrastructure. |
| **CMEK (Customer-Managed Key)** | Dedicated KMS Vault | Dedicated service account granted narrow `encrypt`/`decrypt` permissions via KMS grants. | Enterprise regulatory compliance with full lifecycle control. |
| **BYOK (Bring Your Own Key)** | Generated on-prem, imported to Cloud KMS | Key material resides inside Cloud KMS; customer retains backup. | Regulatory requirement for independent key generation. |
| **HYOK (Hold Your Own Key)** | On-premise HSM | Cryptographic API calls cross customer boundary; raw key never leaves on-prem HSM. | High-assurance defense or banking environments (*Adds latency*). |

---

## SoftHSM2 & PKCS#11 Demonstration

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Web Crypto Simulator</span>
    <h3>SoftHSM2 &amp; PKCS#11 Token Client Simulator</h3>
    <p>Simulate a PKCS#11 hardware token slot, generate non-extractable EC P-256 keys in browser Web Crypto (<code>extractable: false</code>), inspect PKCS#11 object flags, and sign payloads within the secure hardware boundary.</p>
  </div>

  <div class="demo-body">
    <!-- Slot Status Header -->
    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
      <div style="flex: 1; background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.65rem; text-align: center;">
        <span style="font-size: 0.75rem; color: var(--muted); display: block;">Token Slot</span>
        <span id="hsm-slot-label" style="font-size: 0.95rem; font-weight: 800; color: var(--ink);">Slot 0 (production-hsm)</span>
      </div>
      <div style="flex: 1; background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.65rem; text-align: center;">
        <span style="font-size: 0.75rem; color: var(--muted); display: block;">User PIN Session</span>
        <span id="hsm-pin-status" style="font-size: 0.95rem; font-weight: 800; color: var(--amber);">Unauthenticated (PIN: 1234)</span>
      </div>
      <div style="flex: 1; background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.65rem; text-align: center;">
        <span style="font-size: 0.75rem; color: var(--muted); display: block;">Key Object Status</span>
        <span id="hsm-key-status" style="font-size: 0.95rem; font-weight: 800; color: var(--muted);">Uninitialized</span>
      </div>
    </div>

    <!-- Step Buttons -->
    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
      <button id="btn-hsm-init" class="btn-primary" type="button">1. Init Token &amp; Generate Non-Extractable Key (P-256)</button>
      <button id="btn-hsm-attributes" class="btn-secondary" type="button" disabled>2. Inspect PKCS#11 Flags &amp; Test Non-Exportability</button>
      <button id="btn-hsm-sign" class="btn-secondary" type="button" disabled>3. Authenticate PIN (1234) &amp; Sign Payload</button>
    </div>

    <!-- Live Output Terminal -->
    <div id="hsm-terminal" style="margin-top: 1rem; background: #0f172a; color: #38bdf8; border-radius: 6px; padding: 0.85rem; font-family: var(--font-mono); font-size: 0.8rem; min-height: 140px; white-space: pre-wrap; word-break: break-all;">SoftHSM2 PKCS#11 Token Simulator ready. Click Step 1 to initialize token slot...</div>
  </div>
</div>

{% raw %}
<script>
(function() {
  const btnInit = document.getElementById('btn-hsm-init');
  const btnAttr = document.getElementById('btn-hsm-attributes');
  const btnSign = document.getElementById('btn-hsm-sign');

  const pinStatus = document.getElementById('hsm-pin-status');
  const keyStatus = document.getElementById('hsm-key-status');
  const terminal = document.getElementById('hsm-terminal');

  if (!btnInit || !btnAttr || !btnSign || !pinStatus || !keyStatus || !terminal) return;

  let keyPair = null;

  function bytesToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function logTerminal(msg) {
    terminal.innerText += '\n' + msg;
    terminal.scrollTop = terminal.scrollHeight;
  }

  async function initHSMKey() {
    terminal.innerText = '$ softhsm2-util --init-token --slot 0 --label "production-hsm"\n[OK] Token initialized in Slot 0.';
    logTerminal('$ pkcs11-tool --keypairgen --key-type EC:prime256v1 --label "signing-key" --id 01');

    try {
      // Generate Web Crypto EC P-256 key pair with extractable = false (Non-Extractable!)
      keyPair = await window.crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        false, // extractable = false! Enforces non-extractability in browser hardware/OS sandbox!
        ['sign', 'verify']
      );

      keyStatus.innerText = 'EC P-256 Key Present';
      keyStatus.style.color = 'var(--teal)';
      btnAttr.disabled = false;
      btnSign.disabled = false;

      logTerminal('[SUCCESS] Non-extractable EC P-256 Key Pair generated inside token boundary.');
      logTerminal('[INFO] Key attributes enforced: CKA_SENSITIVE=TRUE, CKA_EXTRACTABLE=FALSE.');
    } catch (err) {
      logTerminal('[ERROR] Key generation failed: ' + err.message);
    }
  }

  async function inspectAttributes() {
    if (!keyPair) return;

    logTerminal('\n$ pkcs11-tool --list-objects --id 01');
    logTerminal('---------------------------------------------------------');
    logTerminal('Private Key Object; EC P-256');
    logTerminal('  label:              signing-key');
    logTerminal('  ID:                 01');
    logTerminal('  Usage:              sign, verify');
    logTerminal('  CKA_SENSITIVE:      CK_TRUE');
    logTerminal('  CKA_EXTRACTABLE:     CK_FALSE (Non-Extractable)');
    logTerminal('  CKA_ALWAYS_SENSITIVE:CK_TRUE');
    logTerminal('  CKA_NEVER_EXTRACTABLE:CK_TRUE');
    logTerminal('---------------------------------------------------------');

    // Live test: Attempting to export private key
    logTerminal('\n[TESTING EXPORTABILITY] Calling crypto.subtle.exportKey("pkcs8", privateKey)...');
    try {
      await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      logTerminal('[UNEXPECTED] Key was exported!');
    } catch (err) {
      logTerminal('[CONFIRMED SECURITY] Export rejected by Crypto Engine: "DOMException: The key is not extractable"');
    }
  }

  async function signPayload() {
    if (!keyPair) return;

    const userPin = prompt('Enter SoftHSM2 User PIN to authorize signing:', '1234');
    if (userPin !== '1234') {
      logTerminal('\n$ pkcs11-tool --login --pin **** --sign');
      logTerminal('[FAIL] CKR_PIN_INCORRECT: Access denied. Incorrect PIN.');
      pinStatus.innerText = 'PIN Error (Incorrect PIN)';
      pinStatus.style.color = 'var(--critical)';
      return;
    }

    pinStatus.innerText = 'Authenticated (PIN 1234)';
    pinStatus.style.color = 'var(--teal)';

    logTerminal('\n$ pkcs11-tool --login --pin 1234 --sign --mechanism ECDSA-SHA256 --id 01');
    logTerminal('[PIN AUTHENTICATED] Session logged in as CKU_USER.');

    const payloadText = 'Transaction Payload: Transfer $50,000 to Account #882194';
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadText);

    try {
      // Perform ECDSA signing inside the non-extractable boundary
      const sigBuffer = await window.crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        keyPair.privateKey,
        data
      );

      const sigHex = bytesToHex(sigBuffer);
      logTerminal(`[SIGNATURE COMPUTED INSIDE HSM BOUNDARY] (${sigBuffer.byteLength} bytes)`);
      logTerminal(`Signature DER/P1363 Hex:\n${sigHex}`);

      // Verify signature
      const valid = await window.crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        keyPair.publicKey,
        sigBuffer,
        data
      );

      logTerminal(`[VERIFICATION] Signature Verification Status: ${valid ? 'VALID (Integrity Proven)' : 'INVALID'}`);
    } catch (err) {
      logTerminal('[ERROR] Signing failed: ' + err.message);
    }
  }

  btnInit.addEventListener('click', initHSMKey);
  btnAttr.addEventListener('click', inspectAttributes);
  btnSign.addEventListener('click', signPayload);
})();
</script>
{% endraw %}

```bash
# 1. Initialize a new SoftHSM2 slot
softhsm2-util --init-token --free --label "production-hsm" --pin 1234 --so-pin 5678

# 2. Generate a non-extractable EC P-256 key pair inside the token
pkcs11-tool --module /opt/homebrew/lib/softhsm/libsofthsm2.so --slot-index 0 \
    --login --pin 1234 --keypairgen --key-type EC:prime256v1 --id 01 --label "signing-key"

# 3. Inspect key attributes (Confirm sensitive & non-extractable)
pkcs11-tool --module /opt/homebrew/lib/softhsm/libsofthsm2.so --slot-index 0 \
    --login --pin 1234 --list-objects --id 01
# Output snippet:
# Private Key Object; EC
#   Usage:      decrypt, sign
#   Access:     sensitive, always sensitive, never extractable

# 4. Sign a payload inside the HSM boundary without extracting the key
pkcs11-tool --module /opt/homebrew/lib/softhsm/libsofthsm2.so --slot-index 0 \
    --login --pin 1234 --sign --mechanism ECDSA-SHA256 --id 01 \
    --input-file payload.bin --output-file payload.sig
```

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>HSM &amp; KMS Summary</strong>
    <ul>
      <li><strong>FIPS 140-3 Levels</strong>: Level 1 (software), Level 2 (tamper-evident), Level 3 (tamper-resistant zeroization), Level 4 (environmental protection).</li>
      <li><strong>Non-Extractable Keys</strong>: PKCS#11 attributes (<code>CKA_SENSITIVE=TRUE</code>, <code>CKA_EXTRACTABLE=FALSE</code>) guarantee key bytes never leave HSM RAM.</li>
      <li><strong>Envelope Encryption</strong>: KMS wraps small DEK (AES Key Wrap RFC 3394); application encrypts bulk data locally with DEK.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST FIPS 140-3**: *Security Requirements for Cryptographic Modules* — [NIST CSRC FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final)
- **RFC 3394**: *Advanced Encryption Standard (AES) Key Wrap Algorithm* — [IETF RFC 3394](https://www.rfc-editor.org/rfc/rfc3394)
