---
title: HSM & KMS
description: How Hardware Security Modules and Key Management Services differ, how their protection boundaries are evaluated, and how they support envelope encryption and custody choices.
permalink: /topics/hsm-kms/
last_verified: 2026-08-11
---

<span class="eyebrow">Key Management / Architecture</span>

# HSM & KMS

<p class="lede">An HSM is a cryptographic module and protection boundary; a KMS is a wider management system for keys, metadata, policy, authorization, and lifecycle operations. A KMS may use HSMs, but the terms are not interchangeable. This page explains that boundary, how FIPS 140-3 validation should be read, how PKCS #11 expresses key attributes, and how envelope encryption limits direct use of high-value wrapping keys.</p>

## HSMs protect key operations; KMSs manage the wider lifecycle

A **Hardware Security Module (HSM)** is hardware that protects sensitive security parameters and performs cryptographic operations within a defined module boundary. A **Key Management Service (KMS)** coordinates the policies, procedures, roles, metadata, interfaces, and components used to manage keys. The KMS can place high-value keys in an HSM while keeping policy and workflow logic outside that module.

| Boundary | HSM | KMS |
|---|---|---|
| Primary concern | Protect key material and execute cryptographic operations | Govern keys and bound metadata across their lifecycle |
| Typical controls | Module authentication, sensitive-parameter handling, physical protection, self-tests | Inventory, state transitions, authorization, rotation, recovery, audit, and incident workflow |
| Relationship | Can operate alone or as a KMS component | May use software modules, HSMs, or external key services |
| Assurance question | What exact module, version, environment, mode, and certificate were evaluated? | Does the complete service enforce the required policy and operational controls? |

## FIPS 140-3 validates an exact cryptographic module

[FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final) defines four qualitative security levels across eleven requirement areas, including module interfaces, roles and authentication, physical security, sensitive security parameter management, self-tests, and lifecycle assurance. It does not validate an algorithm by itself or automatically validate every product or cloud service that embeds a validated module.

| Validation question | Correct interpretation | Check before relying on the claim |
|---|---|---|
| **What was evaluated?** | A specific cryptographic module implementation, not a product category. | Module name, version or part number, vendor, and certificate number. |
| **Where is it valid?** | Software and firmware modules are evaluated in stated operational environments. | The deployed environment and configuration match the certificate and security policy. |
| **Which behavior is covered?** | A module may support approved and non-approved modes. | The service operates in the approved mode and observes every certificate caveat. |
| **Is the whole application validated?** | Correct use of an embedded validated module is outside the module validation boundary. | The application routes all claimed cryptographic services through the validated module and handles keys safely outside it. |
| **Is the validation current?** | Active, historical, and revoked certificates have different evidentiary value. | Current CMVP status, sunset date, caveats, and applicable transition rules. |

The [Cryptographic Module Validation Program (CMVP) FAQ](https://csrc.nist.gov/Projects/cryptographic-module-validation-program/FAQs) is the decision point for interpreting a vendor claim. A product name or a claimed level is not enough.

## PKCS #11 attributes constrain API behavior

PKCS #11 exposes key-object attributes that a conforming token uses to control API operations. Non-extractability reduces the ordinary export path, but it is not proof against implementation flaws, privileged code outside the interface, invasive attacks, or side channels. Whether raw key bytes enter host memory depends on how the key was generated, imported, restored, and used.

### PKCS #11 core attributes

| PKCS #11 attribute | Meaning when `CK_TRUE` | Evidence boundary |
|---|---|---|
| `CKA_SENSITIVE` | The object is sensitive; secret components cannot be revealed through the PKCS #11 interface in plaintext. | Describes current API treatment. |
| `CKA_EXTRACTABLE` | Required for the key to be wrapped; `CK_TRUE` is necessary but not sufficient — the key type, the requested mechanism, token policy, and other attribute constraints can still disallow it. When `CK_FALSE`, PKCS #11 wrapping is always disallowed. | Governs wrapping through the token interface, not every possible compromise path. |
| `CKA_ALWAYS_SENSITIVE` | The key has always had `CKA_SENSITIVE=CK_TRUE`. | Records attribute history defined by PKCS #11. |
| `CKA_NEVER_EXTRACTABLE` | The key has never had `CKA_EXTRACTABLE=CK_TRUE`. | Does not independently prove that the key was never exposed by another mechanism. |

## Envelope encryption separates bulk data from high-value keys

Envelope encryption uses a short-lived or narrowly scoped **data-encryption key (DEK)** for the payload and a **key-encryption key (KEK)** to wrap the DEK. This pattern keeps bulk cryptography local to the workload and limits the KMS or HSM operation to a small key object.

<div class="diagram-frame">
  <img src="{{ '/assets/img/envelope-encryption.svg' | relative_url }}" alt="Envelope encryption process: generate a DEK, encrypt the payload, wrap the DEK with a KMS key, and store the encrypted envelope.">
  <p class="diagram-caption">A KMS coordinates the KEK's use, but the KEK itself lives in a separate cryptographic protection boundary — an HSM, a software module, or an external key service, as described above — not the KMS as a whole.</p>
</div>

1. Generate a DEK with an approved random-bit generator or ask the KMS to generate one.
2. Encrypt the payload with an authenticated-encryption mode such as AES-GCM and a nonce that is unique for that DEK.
3. Bind immutable context—tenant, object identifier, content algorithm, and key reference—as authenticated additional data (AAD) where the protocol supports it.
4. Wrap the DEK under a KEK using a specified key-wrapping mechanism such as an approved method in [NIST SP 800-38F](https://csrc.nist.gov/pubs/sp/800/38/f/final).
5. Store the ciphertext, authentication tag, nonce, encrypted DEK, KEK identifier and version, algorithm identifiers, and authenticated context together.
6. Minimize the lifetime and number of plaintext DEK copies in memory. A cache trades KMS availability and latency for a larger exposure window, so bound it by time, use count, data volume, and tenant or security context.

Changing the KEK can mean **rewrapping** the encrypted DEK without re-encrypting the bulk ciphertext. Changing the DEK requires decrypting and re-encrypting the bulk data. If the referenced KEK version is disabled, unavailable, or destroyed, the encrypted DEK cannot be unwrapped; destruction therefore requires dependency checks and a tested recovery decision.

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Web Crypto Simulator</span>
    <h3>Client-Side Envelope Encryption Simulator (DEK / KEK)</h3>
    <p>This browser-only logic simulation generates a local AES-KW key and an extractable AES-GCM DEK, then wraps the DEK and encrypts the payload. It does not call a KMS, use an HSM, or prove hardware-backed storage. This implementation sets the DEK as extractable so Web Crypto can wrap it.</p>
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

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function encryptEnvelope() {
    const text = plaintextInput.value;
    if (!text) return;

    try {
      // 1. Generate a local wrapping key. This is not a KMS or HSM boundary.
      masterKEK = await window.crypto.subtle.generateKey(
        { name: 'AES-KW', length: 256 },
        false,
        ['wrapKey', 'unwrapKey']
      );

      // 2. Generate single-use 256-bit DEK (AES-GCM)
      const dek = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // 3. Encrypt payload with DEK
      const encoder = new TextEncoder();
      const payloadBytes = encoder.encode(text);
      const nonce = window.crypto.getRandomValues(new Uint8Array(12));
      const aadText = JSON.stringify({
        tenant: 'demo-tenant',
        object: 'demo-record',
        keyId: 'local-demo-kek',
        keyVersion: 'v1',
        contentAlgorithm: 'AES-256-GCM',
        wrapAlgorithm: 'A256KW'
      });
      const aad = encoder.encode(aadText);

      const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce, additionalData: aad, tagLength: 128 },
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
        aad: aad,
        aadText: aadText,
        ciphertext: cipherBuffer,
        wrappedDek: wrappedDekBuffer
      };

      btnDecrypt.disabled = false;

      outputArea.innerHTML = `
        <div style="background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; font-size: 0.85rem;">
          <strong style="color: var(--teal); display: block; margin-bottom: 0.35rem;">&#128272; Step 1: Local Wrapping Key (Simulation Only)</strong>
          <span style="color: var(--muted); font-size: 0.8rem;">Non-extractable AES-256-KW <code>CryptoKey</code> generated by Web Crypto. This is not evidence of KMS or HSM custody.</span>
        </div>
        <div style="background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; font-size: 0.85rem;">
          <strong style="color: var(--accent); display: block; margin-bottom: 0.35rem;">&#128195; Step 2: Single-Use Data Encryption Key (DEK)</strong>
          <span style="color: var(--muted); display: block; font-size: 0.8rem;">The DEK is extractable inside this page so Web Crypto can wrap it. Its raw bytes are intentionally not displayed.</span>
        </div>
        <div style="background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; font-size: 0.85rem;">
          <strong style="color: var(--amber); display: block; margin-bottom: 0.35rem;">&#128230; Step 3: Wrapped DEK (EDEK Stored Beside Data)</strong>
          <span style="color: var(--muted); display: block; font-size: 0.8rem;">Wrapped DEK Hex (AES Key Wrap output):</span>
          <code style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink); word-break: break-all;">${bytesToHex(envelopeData.wrappedDek)}</code>
        </div>
        <div style="background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; font-size: 0.85rem;">
          <strong style="color: var(--ink); display: block; margin-bottom: 0.35rem;">&#128274; Step 4: Encrypted Payload &amp; Nonce</strong>
          <span style="color: var(--muted); display: block; font-size: 0.8rem;">GCM Nonce (Hex): <code style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink);">${bytesToHex(envelopeData.nonce)}</code></span>
          <span style="color: var(--muted); display: block; font-size: 0.8rem; margin-top: 0.25rem;">Authenticated Context (AAD): <code style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink); word-break: break-all;">${envelopeData.aadText}</code></span>
          <span style="color: var(--muted); display: block; font-size: 0.8rem; margin-top: 0.25rem;">Ciphertext + Authentication Tag (Hex) — Web Crypto's AES-GCM output appends the tag to the ciphertext:</span>
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
        { name: 'AES-GCM', iv: envelopeData.nonce, additionalData: envelopeData.aad, tagLength: 128 },
        unwrappedDEK,
        envelopeData.ciphertext
      );

      const decoder = new TextDecoder();
      const decryptedText = decoder.decode(decryptedBuffer);

      outputArea.innerHTML += `
        <div style="background: rgba(15, 118, 110, 0.08); border: 1px solid var(--teal); border-radius: 6px; padding: 0.75rem; font-size: 0.85rem; margin-top: 0.5rem;">
          <strong style="color: var(--teal); display: block; margin-bottom: 0.35rem;">&#9989; Step 5: Demo Envelope Decrypted</strong>
          <span style="color: var(--muted); display: block; font-size: 0.8rem;">Decrypted Payload Output:</span>
          <code style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; color: var(--teal);">${escapeHtml(decryptedText)}</code>
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

## Custody labels describe different control boundaries

Provider terminology varies, so architecture decisions should be based on who generates the key material, where plaintext key material can exist, who authorizes operations, who can disable or destroy the key, and what happens when an external dependency is unavailable.

| Custody model | Operational boundary | Control retained by the customer | Important limitation |
|---|---|---|---|
| **Provider-managed key** | Provider creates and operates the key for an integrated service. | Usually little direct policy or lifecycle control. | Exact isolation, rotation, deletion, and audit behavior is service-specific. |
| **Customer-managed key (CMEK)** | Customer configures a key in the provider KMS and authorizes a service to use it. | Policy, service grants, disablement, and often rotation scheduling. | Does not by itself mean exclusive custody or prove a compliance outcome. |
| **Bring your own key (BYOK)** | Key material originates outside the provider and is imported under a documented wrapping process. | Generation provenance and, if retained, an external recovery copy. | The imported material is still available to the destination service's cryptographic boundary during use. |
| **Hold your own key (HYOK) or external KMS** | Key operations or release authorization depend on a customer-controlled external system. | Stronger operational control over availability and authorization. | Adds network, latency, quota, failover, and emergency-access dependencies. |

## Browser non-extractability and PKCS #11 mapping simulation

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Web Crypto Simulator</span>
    <h3>Web Crypto Non-Extractability Simulator</h3>
    <p>This demonstration creates a browser <code>CryptoKey</code> with <code>extractable: false</code>, shows a conceptual mapping to PKCS #11 attributes, and signs a test payload. It does not run SoftHSM2 or PKCS #11, and Web Crypto does not guarantee that the key is hardware-backed.</p>
  </div>

  <div class="demo-body">
    <!-- Slot Status Header -->
    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
      <div style="flex: 1; background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.65rem; text-align: center;">
        <span style="font-size: 0.75rem; color: var(--muted); display: block;">Execution Context</span>
        <span id="hsm-slot-label" style="font-size: 0.95rem; font-weight: 800; color: var(--ink);">Browser Web Crypto</span>
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
      <button id="btn-hsm-init" class="btn-primary" type="button">1. Generate Non-Extractable Browser Key (P-256)</button>
      <button id="btn-hsm-attributes" class="btn-secondary" type="button" disabled>2. Compare API Flags &amp; Test Export</button>
      <button id="btn-hsm-sign" class="btn-secondary" type="button" disabled>3. Enter Demo PIN (1234) &amp; Sign Payload</button>
    </div>

    <!-- Live Output Terminal -->
    <div id="hsm-terminal" style="margin-top: 1rem; background: #0f172a; color: #38bdf8; border-radius: 6px; padding: 0.85rem; font-family: var(--font-mono); font-size: 0.8rem; min-height: 140px; white-space: pre-wrap; word-break: break-all;">Web Crypto simulation ready. The PKCS #11 lines shown later are illustrative mappings, not live token output.</div>
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
    terminal.innerText = '$ window.crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"])';

    try {
      // Generate a Web Crypto EC P-256 key pair with API-level export disabled.
      keyPair = await window.crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign', 'verify']
      );

      keyStatus.innerText = 'EC P-256 Key Present';
      keyStatus.style.color = 'var(--teal)';
      btnAttr.disabled = false;
      btnSign.disabled = false;

      logTerminal('[SUCCESS] EC P-256 CryptoKey generated with extractable=false.');
      logTerminal('[LIMIT] This proves an API export restriction only; it does not prove hardware-backed storage.');
    } catch (err) {
      logTerminal('[ERROR] Key generation failed: ' + err.message);
    }
  }

  async function inspectAttributes() {
    if (!keyPair) return;

    logTerminal('\n[CONCEPTUAL PKCS #11 COMPARISON — NOT LIVE TOKEN OUTPUT]');
    logTerminal('---------------------------------------------------------');
    logTerminal('Private Key Object; EC P-256');
    logTerminal('  label:              signing-key');
    logTerminal('  ID:                 01');
    logTerminal('  Usage:              sign, verify');
    logTerminal('  Web Crypto extractable: false');
    logTerminal('  Rough PKCS #11 analogue: CKA_EXTRACTABLE=CK_FALSE');
    logTerminal('  CKA_SENSITIVE / CKA_ALWAYS_SENSITIVE / CKA_NEVER_EXTRACTABLE');
    logTerminal('  are not returned or proven by this Web Crypto object.');
    logTerminal('---------------------------------------------------------');

    // Live test: Attempting to export private key
    logTerminal('\n[TESTING EXPORTABILITY] Calling crypto.subtle.exportKey("pkcs8", privateKey)...');
    try {
      await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      logTerminal('[UNEXPECTED] Key was exported!');
    } catch (err) {
      logTerminal('[EXPECTED] Export rejected because the CryptoKey has extractable=false.');
      logTerminal('[PROVES] The browser API refused this export request.');
      logTerminal('[DOES NOT PROVE] HSM custody, PKCS #11 conformance, or resistance to implementation compromise.');
    }
  }

  async function signPayload() {
    if (!keyPair) return;

    const userPin = prompt('Enter the demonstration PIN to continue:', '1234');
    if (userPin !== '1234') {
      logTerminal('\n[DEMO AUTHORIZATION] Access denied. Incorrect PIN.');
      pinStatus.innerText = 'PIN Error (Incorrect PIN)';
      pinStatus.style.color = 'var(--critical)';
      return;
    }

    pinStatus.innerText = 'Authenticated (PIN 1234)';
    pinStatus.style.color = 'var(--teal)';

    logTerminal('\n[DEMO AUTHORIZATION] PIN accepted by page logic.');
    logTerminal('[LIMIT] This prompt is not browser, operating-system, token, or HSM authentication.');

    const payloadText = 'Transaction Payload: Transfer $50,000 to Account #882194';
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadText);

    try {
      // Perform ECDSA signing through Web Crypto.
      const sigBuffer = await window.crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        keyPair.privateKey,
        data
      );

      const sigHex = bytesToHex(sigBuffer);
      logTerminal(`[WEB CRYPTO SIGNATURE COMPUTED] (${sigBuffer.byteLength} bytes)`);
      logTerminal(`Signature bytes (hex):\n${sigHex}`);

      // Verify signature
      const valid = await window.crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        keyPair.publicKey,
        sigBuffer,
        data
      );

      logTerminal(`[VERIFICATION] ${valid ? 'VALID for this payload and generated public key' : 'INVALID'}`);
      logTerminal('[LIMIT] The demo does not bind the public key to a trusted identity.');
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

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>An HSM protects cryptographic operations inside a module boundary; a KMS governs keys and metadata across a wider operational lifecycle. Verify the exact module certificate and deployment context, treat non-extractability as a bounded API property, and preserve every dependency needed to unwrap an encrypted DEK.</p>
</div>

## Primary references

- **[NIST FIPS 140-3: Security Requirements for Cryptographic Modules](https://csrc.nist.gov/pubs/fips/140-3/final)** — verified the validation scope, four-level model, and eleven requirement areas.
- **[NIST CMVP FAQ](https://csrc.nist.gov/Projects/cryptographic-module-validation-program/FAQs)** — verified certificate, version, operational-environment, approved-mode, and embedded-module caveats.
- **[NIST SP 800-57 Part 1 Rev. 5: Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)** — verified that key management extends beyond storage to lifecycle protection and operational controls.
- **[NIST SP 800-130: A Framework for Designing Cryptographic Key Management Systems](https://csrc.nist.gov/pubs/sp/800/130/final)** — verified the KMS boundary of policies, procedures, components, devices, keys, and metadata.
- **[NIST SP 800-133 Rev. 2: Recommendation for Cryptographic Key Generation](https://csrc.nist.gov/pubs/sp/800/133/r2/final)** — verified key-generation and random-bit-generator requirements in the NIST federal profile.
- **[NIST SP 800-38F: Recommendation for Block Cipher Modes of Operation—Methods for Key Wrapping](https://csrc.nist.gov/pubs/sp/800/38/f/final)** — verified approved AES key-wrapping methods.
- **[OASIS PKCS #11 v3.1](https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.1/os/pkcs11-spec-v3.1-os.html)** — verified the exact meanings of sensitive and extractability attributes.
- **[OASIS KMIP v2.1](https://docs.oasis-open.org/kmip/kmip-spec/v2.1/kmip-spec-v2.1.html)** — verified the broader managed-object lifecycle and metadata model used for interoperable key management.
