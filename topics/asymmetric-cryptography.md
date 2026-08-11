---
title: Asymmetric Cryptography & Public-Key Infrastructure
description: Core principles of asymmetric key pairs, HPKE, RSA vs ECC comparison, Ed25519 signatures, and an interactive RSA-OAEP/RSA-PSS playground showing why private keys aren't used to encrypt data.
permalink: /topics/asymmetric-cryptography/
last_verified: 2026-08-11
---

<span class="eyebrow">Cryptography / Concepts</span>

# Asymmetric Cryptography & Public-Key Infrastructure

<p class="lede">Asymmetric cryptography uses mathematically linked pairs of keys: a Public Key that can be shared freely with any endpoint, and a Private Key that must be kept secret by its owner. Asymmetric primitives enable public-key distribution without a pre-shared secret channel and establish ephemeral keys for transport security — but distribution alone doesn't establish *whose* key it is; that additionally requires an authenticated binding (a CA-issued certificate, or an out-of-band fingerprint check) tying the public key to an identity, without which the exchange is vulnerable to MitM key substitution. Digital signatures similarly provide verifiable evidence that an action was performed by whoever controls a given private key, which is a weaker claim than "verified real-world identity" unless that same key-to-identity binding is separately established.</p>

## Asymmetric Paradigm: Linked Key Pairs

Unlike symmetric ciphers which rely on a single shared key, asymmetric cryptography generates a key pair (<b>K<sub>pub</sub></b>, <b>K<sub>priv</sub></b>) with complementary, non-interchangeable roles. For encryption/decryption and sign/verify schemes specifically, an operation performed with one key is inverted or verified by the corresponding key in the pair. Key Encapsulation Mechanisms (KEMs, e.g. ML-KEM) and key-agreement protocols (ECDH/X25519) use the pair differently: encapsulation/decapsulation and Diffie-Hellman-style agreement each compute a shared value from both parties' key material rather than one key simply inverting an operation the other key performed — the "one key locks, the other unlocks" framing describes encryption and signing, not every asymmetric operation.

<div class="diagram-frame">
  <img src="{{ '/assets/img/asymmetric-flow.svg' | relative_url }}" alt="Diagram showing asymmetric cryptography: encryption using public key, decryption using private key, signing using private key, verification using public key.">
  <p class="diagram-caption">Public and private keys have complementary, non-interchangeable roles</p>
</div>

### Three Distinct Operations

1. **Public-Key Encryption (RSA-OAEP direct, or HPKE hybrid)**: With RSA-OAEP, the sender encrypts a short payload directly under the recipient's public key. HPKE (RFC 9180) instead uses the public key only to encapsulate a KEM-derived shared secret; a KDF expands that secret into keys for an AEAD cipher, which performs the actual (arbitrary-length) encryption. Either way, only the recipient's private key can recover the secret.
2. **Digital Signatures (Ed25519 / RSA-PSS)**: The sender computes a signature over data using their private key; anyone holding the sender's public key can verify origin and integrity.
3. **Key Agreement (ECDHE / X25519)**: Peer endpoints combine their own private keys with each other's public keys to derive a matching shared secret.

## Operations Comparison Matrix

| Objective | Public Key Action | Private Key Action | Standard Protocol | Primary Output |
|---|---|---|---|---|
| **Confidentiality** (RSA-OAEP direct; HPKE hybrid) | Encrypts payload (RSA-OAEP) / KEM encapsulation (HPKE) | Decrypts payload (RSA-OAEP) / KEM decapsulation (HPKE) | RSA-OAEP; RFC 9180 HPKE = KEM + KDF + AEAD | Unreadable ciphertext; in HPKE the KEM encapsulates a shared secret (not a pre-existing symmetric key) using the public key, a KDF derives the AEAD key/nonce from that secret, and the AEAD cipher encrypts the actual payload |
| **Integrity &amp; Authenticity** | Verifies signature tag | Generates digital signature tag | Ed25519 (RFC 8032), RSA-PSS, ECDSA | Verifiable evidence that the signing key was used |
| **Key Agreement** | Exchanged with peer | Combined with peer public key | Ephemeral ECDH (X25519 / NIST P-256) | Raw shared-secret material — not yet a usable key; passed through a KDF (see Key Exchange &amp; Derivation page) to derive the actual symmetric AEAD traffic key |

## Can I Use a Private Key to Encrypt Data?

**Not in any standardized or secure sense.** No conforming asymmetric encryption scheme — RSA-OAEP, HPKE, ECIES — defines "encrypt with the private key" as an operation at all; standardized encryption APIs simply don't expose a private-key-encryption call to make.

A **Private Key is used for Digital Signing** (and for decrypting incoming data locked under its matching public key). The popular shorthand *"signing is encrypting with the private key"* is an understandable simplification: for raw/textbook RSA specifically, generating a signature (`m^d mod n`) and decrypting ciphertext (`c^d mod n`) really are the same modular-exponentiation primitive with the key roles swapped — PKCS#1 / RFC 8017 names these RSASP1 and RSADP, and they're defined identically. But treating a signature as "ciphertext" is still inaccurate for three reasons:

1. **Signatures Leave Plaintext Intact**: Digital signing computes a separate signature tag file (*`payload.sig`*) over a message digest while leaving the original payload file (*`payload.txt`*) completely unencrypted and readable in cleartext.
2. **Standardized Padding Differs and Isn't Interchangeable**: RSA-OAEP (encryption) and RSA-PSS / PKCS#1v1.5 (signing) wrap that shared modular-exponentiation primitive in different, non-interchangeable padding schemes. A valid signature is not a valid OAEP ciphertext: RSA-PSS/PKCS#1v1.5 signature *verification* is a public-key operation, while RSA-OAEP *decryption* — which does use the private key, applying RSADP followed by OAEP decoding and padding validation ([RFC 8017](https://www.rfc-editor.org/rfc/rfc8017.html)) — is a different operation over a different padding scheme; treating one as a substitute for the other fails.
3. **Most Modern Signature Schemes Have No Encryption Primitive at All**: Ed25519, ECDSA, and FIPS 204 ML-DSA are not built from an invertible trapdoor function the way RSA is — there is no "decrypt" operation that recovers anything from one of their signatures, so the RSA-specific shorthand doesn't generalize to them.

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

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

      // 2. RSA-PSS Keys for Signature
      signKeyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-PSS",
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
      keyStatus.innerHTML = `<span style="color: #b91c1c;">Key Generation Error: ${escapeHtml(err.message || String(err))}</span>`;
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
        <strong>Encryption Error:</strong> ${escapeHtml(err.message || String(err))}
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
            <code>"<strong>${escapeHtml(decText)}</strong>"</code>
            <span class="matched-tag">✔ RECOVERED OK</span>
          </div>
        </div>
      </div>`;
    } catch (err) {
      encOutput.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">
        <strong>Decryption Error:</strong> ${escapeHtml(err.message || String(err))}
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
          <p style="margin-bottom:0;">Error Message: <code>${escapeHtml(err.message || String(err))}</code>. RSA-OAEP's own API contract defines decryption as a private-key operation — this isn't a universal prohibition on every asymmetric primitive, but for RSA-OAEP specifically, only the private key can decrypt.</p>
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
        { name: "RSA-PSS", saltLength: 32 },
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
            <code>"<strong>${escapeHtml(textVal)}</strong>"</code>
          </div>
        </div>

        <div class="ecb-block-item target-block-decrypted">
          <div class="block-meta">
            <span class="block-num">RSA-PSS Digital Signature Tag (${currentSignatureBytes.length} Bytes)</span>
            <span class="block-plain-preview">Signed via Private Key</span>
          </div>
          <div class="block-hex-val" style="word-break: break-all; font-size: 0.75rem;">
            <code>${sigHex}</code>
          </div>
        </div>
      </div>`;
    } catch (err) {
      sigOutput.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">
        <strong>Signature Error:</strong> ${escapeHtml(err.message || String(err))}
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
        { name: "RSA-PSS", saltLength: 32 },
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
        <strong>Verification Error:</strong> ${escapeHtml(err.message || String(err))}
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

To achieve a given **Symmetric Security Strength** (measured in bits of brute-force work), asymmetric algorithm key sizes scale at drastically different rates. The bit-strength values and required key sizes below come from [NIST SP 800-57 Part 1 Rev. 5](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final); the parenthetical labels ("Legacy Minimum," "Current Standard," "High Security," "Maximum Strength") are this page's own descriptive shorthand for how each tier is commonly treated in practice, not terminology NIST itself uses:

| Target Security Strength (NIST SP 800-57) | Required RSA Key Size (Prime Factorization) | Required ECC Key Size (Elliptic Curve Discrete Log) | Key Size Efficiency &amp; Guidance |
|---|---|---|---|
| **112-bit Security** (Legacy Minimum) | **2,048 bits** | **224 bits** | ECC key is ~9x smaller than RSA. Legacy minimum strength. |
| **128-bit Security** (Current Standard) | **3,072 bits** | **256 bits** (Curve25519 / P-256) | ECC key is **12x smaller** than RSA. Standard for web TLS/SSL. |
| **192-bit Security** (High Security) | **7,680 bits** (Sub-Exponential Spike!) | **384 bits** (P-384) | ECC key is **20x smaller** than RSA. RSA-7680 causes severe CPU overhead. |
| **256-bit Security** (Maximum Strength) | **15,360 bits** | **521 bits** (P-521) | ECC key is **~29x smaller** than RSA. RSA-15360 is generally impractical for production TLS. |

<div class="diagram-frame">
  <img src="{{ '/assets/img/key-size-comparison.svg' | relative_url }}?v=2" alt="Comparison chart comparing RSA and ECC key sizes in bits across 112-bit, 128-bit, 192-bit, and 256-bit security strengths. RSA key sizes grow sub-exponentially while ECC key sizes scale compactly.">
  <p class="diagram-caption">Comparison of required RSA vs. ECC key lengths in bits across NIST security strength levels (112-bit to 256-bit security)</p>
</div>

### Why RSA Key Sizes Grow Much Faster Than ECC

1. **Security Strength Scaling**: The chart compares the required key lengths in bits to achieve equivalent NIST symmetric security levels.
2. **Sub-Exponential Attacks on RSA**: General Number Field Sieve (GNFS) algorithms allow attackers to factor RSA primes faster than pure brute-force. GNFS runs in **sub-exponential time** — faster than exponential, but slower than any polynomial — so counteracting it requires RSA key sizes to grow sub-exponentially with the target security level (2,048 bits → 3,072 bits → 7,680 bits → 15,360 bits). This growth is not literally "exponential," but it is still far steeper than ECC's scaling.
3. **Linear Scaling of ECC**: Elliptic Curve Discrete Logarithms (ECDLP) have no sub-exponential attack algorithm. Doubling ECC's security strength requires only doubling the curve key size (224 bits → 256 bits → 384 bits → 512 bits).
4. **Engineering Consequence**: At 192-bit security, RSA requires a towering **7,680-bit key** (a 2.5x spike from 3,072 bits!), rendering RSA handshakes extremely slow and CPU-intensive compared to a compact **384-bit ECC key**.

### Why Ed25519 (EdDSA) is Preferred for Modern Applications

Specified in **[RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)**, **Ed25519** offers major advantages over legacy ECDSA:
- **Deterministic Nonce Derivation**: Ed25519 derives its per-signature nonce deterministically from the private key and message hash, eliminating catastrophic ECDSA private key leaks caused by weak random number generators.
- **Side-Channel &amp; Timing Attack Resistance (Implementation-Dependent)**: Ed25519's Edwards-curve arithmetic admits complete addition formulas that avoid conditional branching on secret data, making constant-time implementations easier to write correctly than for curves lacking this property. This is a property the algorithm *enables*, not a guarantee every implementation delivers — a careless or unoptimized implementation can still leak key material through cache-timing, power analysis, or other side channels.

## Public-Key Input Validation: Why Accepting a Key Isn't Enough

Asymmetric protocols must validate peer-supplied key material before using it, not just successfully parse its encoding — several well-known attack classes exploit implementations that skip this step:

- **Invalid-curve attacks**: This applies specifically to **short-Weierstrass curves** (NIST P-256/P-384/P-521 and similar) used with standard ECDH: an attacker sends a point that doesn't actually satisfy the expected curve equation, and without a curve-membership check before scalar multiplication, the arithmetic silently proceeds using a different, often much weaker, effective curve that shares some parameters with the real one — letting the attacker leak bits of the victim's static private key across repeated queries. Validated short-Weierstrass ECDH implementations check curve membership on every received point. X25519's Montgomery-curve formulation is a different case (see the low-order-input point below) — it isn't validated the same way, and "check curve membership" isn't the applicable defense there.
- **Small-subgroup attacks**: Curve groups with a cofactor greater than 1 contain small-order subgroups alongside the main large-order group. A point of small order forces the resulting shared secret into a tiny, enumerable set of values; against a responder that reuses a static key and doesn't detect this, an attacker can recover the static private key modulo that small subgroup's order through repeated probes, and combine several such probes (with different small subgroups) to reconstruct more of the key via the Chinese Remainder Theorem.
- **Low-order X25519 inputs**: X25519 has a handful of publicly known low-order points; [RFC 7748 §6.1](https://www.rfc-editor.org/rfc/rfc7748.html#section-6.1) specifically identifies that such inputs decode to a fixed, attacker-predictable **all-zero** shared-secret output, regardless of the other party's private key. RFC 7748 permits implementations to skip full point validation for performance, since X25519's Montgomery-ladder design tolerates invalid inputs without leaking the private key; the RFC itself only says implementations **MAY** check for and reject an all-zero output, not that they must. In practice, most security guidance and higher-level protocols treat that check as effectively mandatory — silently accepting an all-zero shared secret hands the attacker a session key they already know — so don't read RFC 7748's permissive wording as license to skip the check; treat it as a protocol- or deployment-specific requirement layered on top of the RFC's baseline. Whether rejection is mandatory for a given deployment is protocol-specific rather than something RFC 7748 itself dictates.
- **RSA-OAEP message-size limits**: RSA-OAEP's maximum plaintext length is bounded by the modulus and hash sizes — `mLen &le; k - 2&times;hLen - 2` bytes, where **k** is the RSA modulus size in bytes and **hLen** is the hash output size. This is not a soft limit; a well-formed OAEP implementation rejects an oversized message outright rather than silently truncating it. [RFC 8017 §7.1](https://www.rfc-editor.org/rfc/rfc8017.html#section-7.1) does permit RSA-OAEP to directly encrypt any message within that size bound — the interactive playground above does exactly this for a short demo payload — but treating RSA-OAEP as capable of encrypting arbitrary-length or bulk payloads directly is a common integration mistake: production systems normally use RSA-OAEP to wrap a short symmetric key (see Hybrid Encryption below) rather than encrypt bulk data directly, since the size bound makes direct encryption impractical for anything beyond a small payload.
- **Key confirmation**: A successfully computed shared secret proves the arithmetic executed, not that the peer is who they claim to be, or even that both sides actually derived the *same* value — an implementation bug could have each side silently compute a different secret. Protocols add an explicit key-confirmation step (a MAC or `Finished`-style message computed over the derived key material, exchanged and checked before either side trusts the channel) specifically to catch key-agreement mismatches, rather than assuming a completed exchange implies a working, authenticated channel.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Asymmetric Cryptography Summary</strong>
    <ul>
      <li><strong>Private Keys Aren't Used to Encrypt Data</strong>: Standardized asymmetric encryption (HPKE, RSA-OAEP) always locks data under a recipient's Public Key — private keys are used for Digital Signing, for decryption, for KEM decapsulation, and as one input to key-agreement (ECDH/X25519) computations, never for encryption itself.</li>
      <li><strong>RSA vs. ECC Efficiency</strong>: 256-bit Elliptic Curve keys (Curve25519 / P-256) provide equivalent security to 3072-bit RSA with 12× smaller key sizes.</li>
      <li><strong>HPKE (RFC 9180)</strong>: Standardized hybrid public-key encryption API combining KEM key exchange, HKDF expansion, and AEAD encryption.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 9180**: *Hybrid Public Key Encryption (HPKE)* — [IETF RFC 9180](https://www.rfc-editor.org/rfc/rfc9180)
- **NIST SP 800-56B Rev. 2**: *Recommendation for Pair-Wise Key-Establishment Schemes Using Integer Factorization Cryptography* — [NIST CSRC SP 800-56B](https://csrc.nist.gov/pubs/sp/800/56/b/r2/final)
