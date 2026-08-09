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
