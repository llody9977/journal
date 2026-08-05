---
title: HSM & KMS
description: What actually protects a private key — hardware security modules, cloud KMS, and envelope encryption.
permalink: /topics/hsm-kms/
last_verified: 2026-08-05
---

<span class="eyebrow">Key Management / Architecture</span>

# HSM & KMS

<p class="lede">When I write “the key is in an HSM or KMS”, I need to be precise about the protection level, whether the key is extractable, who may request operations, and what rotation actually changes. The product name alone does not answer these.</p>

## What an HSM actually is

A **Hardware Security Module (HSM)** is a dedicated device for generating, storing, and using cryptographic keys inside a controlled boundary. Keys are commonly marked sensitive and non-extractable, but this is an object attribute and policy choice rather than a universal definition: some HSM keys can be exported in wrapped form for backup or migration, and some products permit plaintext export for specifically authorized objects.

For a correctly configured non-extractable key, a compromised caller may be able to request signing or decryption without copying the raw key. That contains one failure mode, but stolen credentials with broad operation permissions can still abuse the key through the API.

HSMs are also physically tamper-resistant and often tamper-*responsive* — physical intrusion (drilling, probing, extreme temperature/voltage) can trigger automatic key zeroization, destroying the keys rather than letting them be extracted. This is the same principle behind the [Root CA's offline HSM storage]({{ '/topics/certificates/' | relative_url }}#root-ca) mentioned on the certificates page.

## Is an HSM mandatory?

No. I first need to check the provider and protection level. AWS KMS documents HSM-backed protection for KMS keys. Google Cloud KMS offers `SOFTWARE`, `HSM`, and external protection levels. Azure Key Vault supports both software-protected and HSM-protected keys, while Managed HSM supports HSM-protected keys only. A generic “KMS” label therefore does not mean the selected key is HSM-backed. See [Google Cloud protection levels](https://docs.cloud.google.com/kms/docs/protection-levels) and [Azure Key Vault key types](https://learn.microsoft.com/en-us/azure/key-vault/keys/about-keys).

I would reach for a **dedicated** HSM (AWS CloudHSM, Azure Dedicated HSM, or an on-premises appliance) instead of a shared KMS service for a narrower set of reasons:

- **Single-tenant exclusivity is a hard compliance requirement.** Some regulatory regimes and contracts require that no other customer's keys or operations ever share the same physical module — AWS KMS's HSMs are multi-tenant internally (isolated per customer, but shared hardware); CloudHSM's are not.
- **Low-level API access.** KMS only exposes a fixed set of operations over a REST API. A dedicated HSM speaks PKCS#11, JCE, or a vendor SDK directly, which some legacy applications or custom cryptographic workflows require.
- **A certification the shared service doesn't carry for your specific use case** — for example, [PCI PTS HSM]({{ '/topics/security-certifications/' | relative_url }}#pci-pts-hsm--the-payments-industrys-own-standard) for payment processing, or on-premises data residency rules that rule out a cloud-operated service entirely regardless of its own certifications.
- **Root-of-trust ceremonies** — an offline root CA (see [Certificate Authorities]({{ '/topics/certificates/' | relative_url }}#root-ca)) is typically generated and stored on a dedicated HSM kept physically air-gapped, which a cloud API-driven KMS can't provide by design.

Outside of those specific triggers, reaching for a dedicated HSM when KMS already covers the need mostly just adds operational cost and complexity without a corresponding increase in real protection.

## Seeing non-extractability enforced: SoftHSM + PKCS#11

[SoftHSM2](https://www.opendnssec.org/en/latest/softhsm/) is a software implementation of a PKCS#11 token. It is useful for learning the API and object attributes, but it cannot demonstrate the physical security of an HSM.

```
$ softhsm2-util --init-token --free --label "demo-hsm" --pin 1234 --so-pin 5678
Slot 0 has a free/uninitialized token.
The token has been initialized and is reassigned to slot 233074420

$ pkcs11-tool --module /opt/homebrew/lib/softhsm/libsofthsm2.so --slot-index 0 \
    --login --pin 1234 --keypairgen --key-type EC:prime256v1 --id 01 --label "demo-key"

Private Key Object; EC
  label:      demo-key
  Usage:      decrypt, sign, signRecover, unwrap, derive
  Access:     sensitive, always sensitive, never extractable, local
```

That `never extractable` isn't a description — it's an access-control flag the token enforces. Signing still works normally:

```
$ pkcs11-tool --module /opt/homebrew/lib/softhsm/libsofthsm2.so --slot-index 0 \
    --login --pin 1234 --sign --mechanism ECDSA-SHA256 --id 01 \
    --input-file firmware.bin --output-file firmware.sig
Using signature algorithm ECDSA-SHA256
```

But asking the token to hand back the private key object itself:

```
$ pkcs11-tool --module /opt/homebrew/lib/softhsm/libsofthsm2.so --slot-index 0 \
    --login --pin 1234 --read-object --type privkey --id 01 --output-file extracted.key
sorry, reading private keys not (yet) supported
```

This particular error comes from `pkcs11-tool`: that client does not implement reading private-key objects. It does **not**, by itself, prove that SoftHSM enforced `CKA_EXTRACTABLE=false`. The earlier object listing is still useful evidence that the generated key carries `sensitive`, `always sensitive`, and `never extractable` attributes. A stronger test would inspect those attributes through PKCS#11 and attempt a supported wrap/export operation, expecting the token to reject it.

```
$ openssl dgst -sha256 -verify pubkey.pem -signature firmware_der.sig firmware.bin
Verified OK
```

(SoftHSM/PKCS#11 return raw `r‖s` signature bytes, while OpenSSL expects DER encoding — converting between the two is a one-time, well-documented step, and a common point of confusion the first time you integrate real PKCS#11 hardware.)

<div class="callout warn">
  <span class="callout-title">SoftHSM2 is not FIPS validated — and isn't trying to be</span>
  <p>Searching NIST's own <a href="https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search">CMVP validated modules list</a> for "SoftHSM" returns zero results — it has never been through FIPS testing, and the project doesn't claim otherwise. That's by design, not an oversight: SoftHSM2 exists to let developers and CI pipelines exercise the real PKCS#11 API and its access-control behavior (exactly what the demo above shows) without needing physical hardware. What it does <em>not</em> provide is any of the physical tamper-resistance, validated random number generation, or independently-audited implementation a certified HSM guarantees — keys in SoftHSM2 live in an ordinary file on disk, encrypted with a key derived from the PIN. Fine for development and testing; never a substitute for a certified module in production.</p>
</div>

## FIPS 140: the assurance standard behind "HSM-grade"

**[FIPS 140-2](https://csrc.nist.gov/pubs/fips/140-2/final)** (and its successor, **[FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final)**) is the standard hardware and software cryptographic modules are validated against, in four increasing levels:

| Level | Assurance |
|---|---|
| Level 1 | Basic — approved algorithms, no physical security requirements |
| Level 2 | Adds tamper-evidence (you can tell if it was opened) and role-based authentication |
| Level 3 | Adds tamper-*resistance* and zeroization on detected tampering — where most commercial HSMs sit |
| Level 4 | Adds protection against environmental attacks (voltage/temperature manipulation) — the highest assurance level |

When a vendor says “FIPS-validated,” the level and exact module are the claims worth checking. AWS documents its standard KMS HSM fleet as FIPS 140-3 Security Level 3 validated. For CloudHSM, the result depends on the instance type and cluster mode: AWS lists `hsm2m.medium` in FIPS mode under certificate #4703. I still need to verify the exact region, product version, mode, and certificate status rather than transfer one claim to every deployment.

### Where to actually verify a FIPS claim

Take the claim to the source rather than the vendor's own page: NIST's **[CMVP validated modules search](https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search)** lists active, historical, and revoked validations and is searchable by vendor, module name, standard, and level. A real entry looks like **[certificate #4962, the Thales Luna G7 Cryptographic Module](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4962)** — it names the exact hardware and firmware versions, validation status, level, and operating caveats. If I cannot match a product and configuration to a CMVP certificate, the claimed validation remains unverified; I should ask the vendor for the certificate number and approved-mode instructions.

FIPS 140 is the most common certification to check for a cryptographic module specifically, but it isn't the only one in play — [Security Certifications: FIPS, Common Criteria & PCI PTS]({{ '/topics/security-certifications/' | relative_url }}) covers the fuller landscape (Common Criteria, PCI PTS HSM, eIDAS) and why each exists.

## Cloud KMS: managed key operations through an API

Running physical HSMs is operationally heavy, which is why **cloud KMS** services expose key management through APIs. Depending on the product and tier, the key may be software-protected, protected by a shared HSM service, stored in a managed single-tenant HSM, or handled by an external key manager.

Cloud KMS services commonly support **envelope encryption**—the DEK/KEK pattern from Full-Disk & File Encryption, generalized beyond disks to application data:

<div class="diagram-frame">
  <img src="{{ '/assets/img/dek-kek.svg' | relative_url }}" alt="Diagram showing application data encrypted by a Data Encryption Key (DEK), which is itself wrapped by a Key Encryption Key (KEK) that never leaves the KMS or HSM — only the wrapped DEK and the encrypted data are stored together." >
  <p class="diagram-caption">Same DEK/KEK pattern as disk encryption — the KEK just lives in a KMS instead of a TPM</p>
</div>

In practice: your application asks the KMS to generate a data key, gets back both a plaintext copy (used immediately, then discarded from memory) and an encrypted copy (safe to store alongside the ciphertext it protects). The KMS's own master key — the KEK — never leaves the KMS at all; decrypting later means sending the wrapped data key back to the KMS and asking for the plaintext version again.

This pattern exists partly for exactly the reason [Symmetric Cryptography]({{ '/topics/symmetric-cryptography/' | relative_url }}) already establishes — asymmetric-adjacent operations (and KMS API calls) are comparatively expensive and rate-limited, so bulk data always gets encrypted locally and fast; only the small data key ever touches the KMS.

## CMEK: customer-managed keys, and whether they're symmetric or asymmetric

**CMEK (Customer-Managed Encryption Key)** is the term for a KEK resource the customer selects and controls—its access policy, location, rotation, disablement, and deletion—rather than relying only on a default key managed invisibly by the cloud service. The actual bulk-data cryptography may stay the same; what changes is customer control over the KEK lifecycle at the top of the DEK/KEK chain.

Whether a CMEK can be asymmetric depends on which provider's terminology is meant:

- **Google Cloud** uses “CMEK” narrowly. Its [CMEK guidance](https://docs.cloud.google.com/kms/docs/cmek-best-practices) requires the symmetric `ENCRYPT_DECRYPT` purpose for CMEK-integrated services. Cloud KMS also supports asymmetric RSA and EC keys for other purposes, but those are not the CMEKs used by these service integrations.
- **AWS** and **Azure** use broader terms (“customer-managed key” / “CMK”) for customer-controlled KMS or Key Vault keys. The selected product still determines which key types and operations it accepts; for example, EBS requires a symmetric KMS key while Azure Managed Disks uses an RSA wrapping key.

**Which to pick, and why:**

- **Symmetric** is the default choice for the actual envelope-encryption use case this page describes — wrapping a DEK to protect data at rest. It's faster, and it's what the DEK/KEK pattern above assumes throughout.
- **Asymmetric** earns its place for a different job: letting a party that cannot or should not call the KMS API still participate. [AWS KMS documents](https://docs.aws.amazon.com/kms/latest/developerguide/offline-public-key.html) downloading the public key for offline encryption or signature verification while the private key remains non-exportable in KMS. Neither operation is possible with a symmetric CMEK because there is no public half to distribute.

### Visual walkthrough: how the key layers and rotation fit together

<div class="diagram-frame">
  <video class="diagram-video" controls muted loop playsinline preload="metadata" poster="{{ '/assets/video/envelope-key-rotation-poster.png' | relative_url }}?v=1" aria-label="A slow envelope-encryption and key-rotation walkthrough. A symmetric data-encryption key encrypts the bulk data. A customer-managed key acts as the key-encryption key and wraps the data key. The animation compares a symmetric CMEK with an asymmetric RSA wrapping key, shows a vendor receiving narrow key-use permission instead of raw key material, rotates the CMEK from version 1 to version 2, decrypts old data with the retained version 1, compares rotation with rewrapping and re-encryption, and shows why version 1 must not be destroyed while old wrapped data keys still depend on it.">
    <source src="{{ '/assets/video/envelope-key-rotation.webm' | relative_url }}?v=1" type="video/webm">
    <source src="{{ '/assets/video/envelope-key-rotation.mp4' | relative_url }}?v=1" type="video/mp4">
    <img src="{{ '/assets/video/envelope-key-rotation-poster.png' | relative_url }}?v=1" alt="Comparison of KEK rotation, DEK rewrapping, and data re-encryption, showing which key or ciphertext layer changes in each operation.">
  </video>
  <p class="diagram-caption">The DEK encrypts the data; the CMEK/KEK protects the DEK; old KEK versions remain available until migration is complete</p>
</div>

The animation uses one envelope throughout so I can follow the dependency: **data ciphertext → DEK → wrapped DEK → KEK version → customer-managed KMS policy**. The asymmetric example changes only the wrapping layer; the bulk data is still encrypted symmetrically.

## Giving a vendor access without giving away key custody

When an integration guide says “share the CMEK,” I need to identify whether it means **grant permission to use a key** or **transfer key material**. These are not the same security model.

For a normal managed-service integration, I prefer this boundary:

1. I own the key resource in my KMS account, project, vault, or external key manager.
2. The vendor or cloud service gives me a dedicated service principal, service account, or managed identity.
3. I grant that identity only the required operations on one named key. Examples are `Encrypt`/`Decrypt`, `GenerateDataKey`, or `wrapKey`/`unwrapKey`; key administration, export, policy changes, grant delegation, and deletion remain separate unless the product has a documented need.
4. I restrict the grant by service, resource, encryption context, account, region, or expiry where the platform supports it.
5. I enable data-access audit logs, assign an owner and offboarding date, and test what happens when access is revoked or the key is unavailable.

The cloud patterns make this distinction concrete:

- **AWS:** the customer account keeps the KMS key. Cross-account use requires the key owner's key policy plus permission in the caller's account; KMS grants can give one principal revocable cryptographic use of one key. I should avoid a wildcard principal and broad `CreateGrant` permission.
- **Google Cloud:** the resource service agent—not the developer or vendor employee—normally receives `roles/cloudkms.cryptoKeyEncrypterDecrypter` on the CMEK. Google recommends separating key administrators from key users.
- **Azure:** services such as Managed Disks use a managed identity with only `wrapKey`, `unwrapKey`, and `get` access to the Key Vault or Managed HSM key.

Granting use is still meaningful authority. A vendor identity allowed to decrypt or unwrap can cause the KMS to perform that operation without extracting the raw key. Non-extractability protects against copying the key; it does not prevent abuse through an authorized API. I therefore need least privilege, resource binding, logs, and revocation—not only a claim that the key never leaves the HSM.

### Custody models I should not confuse

| Model | Where the operative key material resides | What the service receives | Control and limitation |
|---|---|---|---|
| Provider-managed key | Provider-controlled KMS/HSM | Transparent service access | Lowest operational effort; customer has little direct lifecycle or policy control |
| CMEK with delegated use | Customer-controlled KMS namespace or vault | Permission to invoke named operations; not a raw key export | Customer controls policy, disablement, rotation, and deletion; service use can still expose authorized plaintext |
| BYOK / imported key | A copy is imported into the provider's KMS/HSM | Provider service uses the imported copy through KMS | Customer chose or generated the material, but custody is no longer exclusively external once a copy is imported |
| HYOK / external key manager | Customer-operated system outside the provider | Cryptographic requests cross to the external manager | Keeps raw key material outside the provider and supplies an independent kill switch; adds latency, availability, recovery, and integration dependencies |

My working rule: if a vendor asks me to email, paste, or upload a raw symmetric CMEK outside a documented import ceremony, I stop. A supported integration should normally ask for a key identifier and a grant to its dedicated identity. If key import or external key management is required, the architecture and contract should name that custody model explicitly.

## Key rotation: distinguish version rotation from data migration

My mental model is: **rotation changes the key version used for future protection; it does not make old ciphertext understand the new key**. Old data remains readable only while the system can still locate and use the old key material that protects its DEK.

For one old object, the dependency looks like this:

```
old data A  --encrypted by-->  DEK-A
DEK-A       --wrapped by---->  CMEK version 1
envelope    --stores-------->  ciphertext + wrapped DEK-A + key/version reference
```

After rotation, version 2 becomes primary for new wrap or encryption operations. The old envelope does not change. To read it, the service follows its stored metadata, asks KMS to use version 1, unwraps DEK-A, and then uses DEK-A to decrypt the old data. Version 1 can be non-current or decrypt-only, but it must remain enabled and available.

The exact lookup is product-specific:

- **AWS automatic/on-demand rotation of a symmetric KMS key:** the logical key ID stays the same. AWS retains the older backing key material and automatically selects the material that originally encrypted the KMS ciphertext. The caller cannot select that internal material version.
- **Google Cloud symmetric keys:** ciphertext records the version used. The new primary version handles new encryption; Cloud KMS can infer the old version for decryption while it remains enabled. CMEK-integrated services may re-encrypt old DEKs, use the new version only for new data, or continue using the originally configured version, depending on the service.
- **Azure Key Vault:** rotation creates a new version. Encryption systems should retain a versioned key URI with protected data; old and new versions remain enabled until dependent DEKs are rewrapped. A versionless URI helps supported services discover the latest version for new operations.

Asymmetric wrapping adds one lifecycle step: writers must receive the new public key for version 2, while the private key for version 1 must remain available to unwrap old DEKs. Google Cloud therefore does not automatically rotate asymmetric keys; distributing the new public key and tracking old versions are application responsibilities.

“Rotate the key” is overloaded, so I identify which operation the product actually performs:

1. **Create a new key version for future writes.** Existing ciphertext and wrapped DEKs remain associated with old versions, which the service retains for decryption.
2. **Rewrap existing DEKs.** The application or managed service unwraps each DEK with the old KEK version and wraps it with the new version.
3. **Re-encrypt the underlying data.** This is a separate and potentially expensive migration, usually required if the DEK itself changes.

| Operation | What changes | What stays unchanged | When I need it |
|---|---|---|---|
| Rotate the KEK | Primary/current KEK material for future wraps | Existing wrapped DEKs and data ciphertext | Routine version rotation or compliance requirement |
| Rewrap a DEK | The wrapped representation moves from KEK v1 to v2 | The plaintext DEK and bulk-data ciphertext | Remove dependence on an old KEK without rewriting the data |
| Re-encrypt the data | The DEK and bulk-data ciphertext | The business plaintext and intended policy | Replace a compromised DEK, change the data cipher/format, or fully migrate protection |

Rewrapping can be expressed as `Wrap(v2, Unwrap(v1, wrapped-DEK-A))`. The service temporarily recovers DEK-A inside its trusted boundary, wraps the same DEK under version 2, and replaces only the wrapped-DEK field. The large data ciphertext does not move.

Routine KEK rotation also does not repair every compromise. If an attacker copied an old plaintext DEK, rewrapping that DEK does not make the attacker's copy disappear; I need a new DEK and data re-encryption. If only the old KEK's API permission was exposed and the raw key remained non-extractable, I can revoke that access, rewrap dependent DEKs, and retire the old version after verification. If the raw KEK material itself was copied, an attacker may still unwrap any old wrapped DEKs they captured; I should treat those DEKs as exposed and re-encrypt the affected data under new DEKs.

### When can I disable or destroy the old version?

I use this sequence:

1. Inventory every reference to the old version, including wrapped DEKs, application ciphertext, snapshots, backups, replicas, exports, and offline archives.
2. Confirm the service's rotation behavior. I do not assume it rewraps existing DEKs merely because a new primary version exists.
3. Rewrap DEKs or re-encrypt data that must remain readable, then test recovery through the new version.
4. Disable the old version first and monitor for failures. Disablement is normally reversible; destruction may not be.
5. Destroy the old version only after retention, restore, legal-hold, and disaster-recovery checks show that no required data depends on it.

Destroying an old KEK version while a wrapped DEK still depends on it is effectively cryptographic deletion of that data path: the ciphertext may still exist, but its DEK cannot be recovered. This is an availability and recovery decision, not routine cleanup.

[AWS KMS rotation documentation](https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html) states that older key material is retained and automatically selected for decryption, while rotation does not rotate data keys or re-encrypt data. [Google Cloud CMEK rotation guidance](https://docs.cloud.google.com/kms/docs/cmek-rotation) documents three different service behaviors and keeps previous versions active for old DEKs. [Azure Key Vault rotation guidance](https://learn.microsoft.com/en-us/azure/key-vault/keys/how-to-configure-key-rotation) requires version references and both versions to remain enabled until rewrapping completes.

## Common pitfalls

- **Treating KMS/HSM access credentials as less sensitive than the keys they can use** — an attacker allowed to call `Decrypt`, `Sign`, change policy, schedule deletion, or disable a key may not need the raw bytes. I need least-privilege policies, separation of duties, protected recovery access, audit alerts, and deletion safeguards around the control plane as well as the cryptographic module.
- **Encrypting bulk data directly through the KMS API** instead of using envelope encryption — most KMS `Encrypt` APIs cap the payload size (AWS KMS: 4 KB) specifically to push callers toward the DEK/KEK pattern.
- **Equating "encrypted at rest" with "HSM-protected"** — ask specifically what protects the key doing the encrypting, not just whether the data happens to be encrypted somewhere.
- **Copying a generic rotation policy** — rotation frequency should follow the threat model, cryptoperiod, provider semantics, compliance requirements, operational cost, and recovery plan. A new KMS version may protect only future writes unless I arrange rewrap or re-encryption separately.
- **Calling raw-key transfer “CMEK sharing”** — a key identifier plus a least-privilege use grant preserves a different custody boundary from exporting and sending the key bytes. I should record which model the vendor actually implements.
- **Granting the vendor key-administration rights when it only needs cryptographic use** — `Decrypt`, `wrapKey`, or `GenerateDataKey` is already powerful; policy changes, key deletion, export, and unrestricted grant creation should remain with separate customer-controlled identities.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/fips/140-3/final">FIPS 140-3</a></strong> is the current cryptographic-module standard, and the <strong><a href="https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search">CMVP search</a></strong> verifies module claims. <strong><a href="https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.1/os/pkcs11-spec-v3.1-os.html">PKCS#11 v3.1</a></strong> defines the token API and attributes demonstrated above. KMS and CMEK access are cloud-product behavior rather than one RFC: see <a href="https://docs.aws.amazon.com/kms/latest/developerguide/key-policy-modifying-external-accounts.html">AWS cross-account KMS access</a>, <a href="https://docs.aws.amazon.com/kms/latest/developerguide/grants.html">AWS KMS grants</a>, <a href="https://docs.cloud.google.com/kms/docs/cmek">Google Cloud CMEK</a>, <a href="https://docs.cloud.google.com/kms/docs/separation-of-duties">Google Cloud separation of duties</a>, and <a href="https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption">Azure Managed Disks CMEK</a>. Provider protection and rotation behavior is documented separately by <a href="https://docs.aws.amazon.com/kms/latest/developerguide/kms-internals.html">AWS KMS internals</a>, <a href="https://docs.aws.amazon.com/cloudhsm/latest/userguide/fips-validation.html">AWS CloudHSM validation</a>, <a href="https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html">AWS KMS rotation</a>, <a href="https://docs.cloud.google.com/kms/docs/protection-levels">Google Cloud protection levels</a>, and <a href="https://learn.microsoft.com/en-us/azure/key-vault/keys/about-keys">Azure Key Vault key types</a>.</p>
</div>
