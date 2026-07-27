---
title: HSM & KMS
description: What actually protects a private key — hardware security modules, cloud KMS, and envelope encryption.
permalink: /topics/hsm-kms/
last_verified: 2026-07-26
---

<span class="eyebrow">Key Management / Deep Dive</span>

# HSM & KMS

<p class="lede">When I write “the key is in an HSM or KMS”, I need to be precise about the protection level, whether the key is extractable, who may request operations, and what rotation actually changes. The product name alone does not answer these.</p>

## What an HSM actually is

A **Hardware Security Module (HSM)** is a dedicated device for generating, storing, and using cryptographic keys inside a controlled boundary. Keys are commonly marked sensitive and non-extractable, but this is an object attribute and policy choice rather than a universal definition: some HSM keys can be exported in wrapped form for backup or migration, and some products permit plaintext export for specifically authorised objects.

For a correctly configured non-extractable key, a compromised caller may be able to request signing or decryption operations without being able to copy the raw key. That is a useful containment property, but it does not make compromised credentials or unlimited HSM access harmless.

HSMs are also physically tamper-resistant and often tamper-*responsive* — physical intrusion (drilling, probing, extreme temperature/voltage) can trigger automatic key zeroization, destroying the keys rather than letting them be extracted. This is the same principle behind the [Root CA's offline HSM storage]({{ '/topics/certificates/' | relative_url }}#root-ca) mentioned on the certificates page.

## Is an HSM mandatory?

No. I first need to check the provider and protection level. AWS KMS documents HSM-backed protection for KMS keys. Google Cloud KMS offers `SOFTWARE`, `HSM`, and external protection levels. Azure Key Vault supports both software-protected and HSM-protected keys, while Managed HSM supports HSM-protected keys only. A generic “KMS” label therefore does not mean the selected key is HSM-backed. See [Google Cloud protection levels](https://docs.cloud.google.com/kms/docs/protection-levels) and [Azure Key Vault key types](https://learn.microsoft.com/en-us/azure/key-vault/keys/about-keys).

What you'd reach for a **dedicated** HSM (AWS CloudHSM, Azure Dedicated HSM, an on-prem Thales/Utimaco/Entrust appliance) instead of the shared KMS service for is a narrower set of real reasons:

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

When a vendor says "FIPS-validated," the level is the actual claim worth checking — Level 1 and Level 3 are very different guarantees. **AWS KMS and AWS CloudHSM are both, for example, validated at FIPS 140-3 Level 3** — a real, checkable claim, not marketing shorthand.

### Where to actually verify a FIPS claim

Take the claim to the source rather than the vendor's own page: NIST's **[CMVP validated modules search](https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search)** is the authoritative, free, public list of every module that has actually passed testing — searchable by vendor, module name, standard (FIPS 140-2 or 140-3), and level. A real entry looks like **[certificate #4962, the Thales Luna G7 Cryptographic Module](https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search)** — vendor name, exact module and firmware version, validation date, and level, all independently listed by NIST rather than self-reported. If a product claims "FIPS 140-3 Level 3" and it isn't findable on this list under that exact vendor and module name, that claim can't be verified as it stands — worth asking the vendor for the certificate number directly.

FIPS 140 is the most common certification to check for a cryptographic module specifically, but it isn't the only one in play — [Security Certifications: FIPS, Common Criteria & PCI PTS]({{ '/topics/security-certifications/' | relative_url }}) covers the fuller landscape (Common Criteria, PCI PTS HSM, eIDAS) and why each exists.

## Cloud KMS: the same protection, as an API

Running physical HSMs is operationally heavy, which is why **cloud KMS** services expose key management through APIs. Depending on the product and tier, the key may be software-protected, protected by a shared HSM service, stored in a managed single-tenant HSM, or handled by an external key manager.

Almost every cloud KMS is built around **envelope encryption** — exactly the DEK/KEK pattern from Full-Disk & File Encryption, generalized beyond disks to any application data:

<div class="diagram-frame">
  <img src="{{ '/assets/img/dek-kek.svg' | relative_url }}" alt="Diagram showing application data encrypted by a Data Encryption Key (DEK), which is itself wrapped by a Key Encryption Key (KEK) that never leaves the KMS or HSM — only the wrapped DEK and the encrypted data are stored together." >
  <p class="diagram-caption">Same DEK/KEK pattern as disk encryption — the KEK just lives in a KMS instead of a TPM</p>
</div>

In practice: your application asks the KMS to generate a data key, gets back both a plaintext copy (used immediately, then discarded from memory) and an encrypted copy (safe to store alongside the ciphertext it protects). The KMS's own master key — the KEK — never leaves the KMS at all; decrypting later means sending the wrapped data key back to the KMS and asking for the plaintext version again.

This pattern exists partly for exactly the reason [Symmetric Cryptography]({{ '/topics/symmetric-cryptography/' | relative_url }}) already establishes — asymmetric-adjacent operations (and KMS API calls) are comparatively expensive and rate-limited, so bulk data always gets encrypted locally and fast; only the small data key ever touches the KMS.

## CMEK: customer-managed keys, and whether they're symmetric or asymmetric

**CMEK (Customer-Managed Encryption Key)** is the term for a KEK the customer explicitly creates and controls — its rotation schedule, access policy, region, and deletion — rather than a default key the cloud provider generates and manages invisibly on the customer's behalf. The actual cryptography doesn't change; what changes is who controls the KEK's lifecycle sitting at the top of the same DEK/KEK chain described above.

Whether a CMEK can be asymmetric depends on which provider's terminology is meant:

- **Google Cloud** uses "CMEK" narrowly — a CMEK is specifically a **symmetric** key used for envelope encryption of Google-managed data (Cloud Storage, BigQuery, and similar). Cloud KMS also supports asymmetric keys (RSA, EC), but those aren't called CMEKs in GCP's own terminology — they're used directly for signing or encryption, not for wrapping a DEK.
- **AWS** and **Azure** use broader terms ("customer-managed key" / "CMK") that cover both symmetric and asymmetric keys under one umbrella.

**Which to pick, and why:**

- **Symmetric** is the default choice for the actual envelope-encryption use case this page describes — wrapping a DEK to protect data at rest. It's faster, and it's what the DEK/KEK pattern above assumes throughout.
- **Asymmetric** earns its place for one specific, different job: letting a party who can't (or shouldn't) call the KMS API at all still participate. AWS KMS documents this directly — an external partner can download just the public key and encrypt data with it entirely outside AWS, with only the KMS-custodied private key able to decrypt it back inside the account that owns it. The same asymmetric key can also let a client verify a signature offline, with no network call to the KMS required at all. Neither of those is possible with a symmetric CMEK, since there's no "public half" to hand out in the first place.

## Key rotation: distinguish version rotation from data migration

“Rotate the key” is overloaded. I need to identify which of these operations the product actually performs:

1. **Create a new key version for future writes.** Existing ciphertext and wrapped DEKs remain associated with old versions, which the service retains for decryption.
2. **Rewrap existing DEKs.** The application or managed service unwraps each DEK with the old KEK version and wraps it with the new version.
3. **Re-encrypt the underlying data.** This is a separate and potentially expensive migration, usually required if the DEK itself changes.

AWS KMS automatic/on-demand rotation is the first case: AWS states that it does not rotate data keys or re-encrypt existing data, and older key material remains available for decryption. Rewrapping existing DEKs is a valid application-managed migration, but it is not automatic or free; its cost scales with the number of wrapped keys and service behaviour. See the [AWS KMS rotation documentation](https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html) and [Google Cloud CMEK rotation guidance](https://docs.cloud.google.com/kms/docs/cmek-rotation).

## Common pitfalls

- **Treating KMS/HSM access credentials as less sensitive than the keys they protect** — if the IAM role or API credential that can *call* the KMS leaks, the attacker doesn't need the key material; they can just ask the KMS to decrypt things for them. **[Code Spaces](https://thehackernews.com/2014/06/cyber-attack-on-code-spaces-puts.html)**, a source-control hosting company, was destroyed within hours in a real 2014 incident that illustrates exactly this: attackers who compromised its AWS console credentials didn't need to break any encryption at all — they simply used the legitimate, authenticated console access to delete the company's EC2 resources, S3 buckets, and every backup, including the offsite ones stored in the same AWS account. No key was ever "broken"; the credential controlling access to everything was the entire attack surface, and it was enough on its own to end the company.
- **Encrypting bulk data directly through the KMS API** instead of using envelope encryption — most KMS `Encrypt` APIs cap the payload size (AWS KMS: 4 KB) specifically to push callers toward the DEK/KEK pattern.
- **Equating "encrypted at rest" with "HSM-protected"** — ask specifically what protects the key doing the encrypting, not just whether the data happens to be encrypted somewhere.
- **Copying a generic rotation policy** — rotation frequency should follow the threat model, cryptoperiod, provider semantics, compliance requirements, operational cost, and recovery plan. A new KMS version may protect only future writes unless I arrange rewrap or re-encryption separately.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/fips/140-3/final">FIPS 140-3</a></strong> is the current cryptographic-module standard, and the <strong><a href="https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search">CMVP search</a></strong> verifies module claims. <strong><a href="https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.1/os/pkcs11-spec-v3.1-os.html">PKCS#11 v3.1</a></strong> defines the token API and attributes demonstrated above. Provider behaviour is documented separately by <a href="https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html">AWS KMS rotation</a>, <a href="https://docs.cloud.google.com/kms/docs/protection-levels">Google Cloud protection levels</a>, and <a href="https://learn.microsoft.com/en-us/azure/key-vault/keys/about-keys">Azure Key Vault key types</a>.</p>
</div>

## How I connect this

This is the "where do the keys actually live" answer underneath [Certificate Authorities]({{ '/topics/certificates/' | relative_url }}) (root keys), [Full-Disk & File Encryption]({{ '/topics/full-disk-file-encryption/' | relative_url }}) (the KEK), and any production system doing its own [symmetric]({{ '/topics/symmetric-cryptography/' | relative_url }}) or [asymmetric]({{ '/topics/asymmetric-cryptography/' | relative_url }}) cryptography at scale — the primitives are the same everywhere; HSM/KMS is about the custody of the keys those primitives depend on. [Security Certifications]({{ '/topics/security-certifications/' | relative_url }}) covers the broader landscape of assurance standards a module or product might be evaluated against beyond FIPS 140 alone.
