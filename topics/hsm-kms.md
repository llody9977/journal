---
title: HSM & KMS
description: What actually protects a private key — hardware security modules, cloud KMS, and envelope encryption.
permalink: /topics/hsm-kms/
---

<span class="eyebrow">Key Management / Deep Dive</span>

# HSM & KMS

<p class="lede">"The private key is kept in an HSM" gets said a lot without explaining what that actually means — for <a href="{{ '/topics/certificates/' | relative_url }}#root-ca">Root CA keys</a>, <a href="{{ '/topics/full-disk-file-encryption/' | relative_url }}#the-real-problem-where-the-key-actually-comes-from">disk encryption keys</a>, and any production system that takes key custody seriously. An HSM is the actual mechanism behind that claim, and cloud KMS services expose that same protection as an API.</p>

## What an HSM actually is

A **Hardware Security Module (HSM)** is a dedicated, tamper-resistant device that generates, stores, and *uses* cryptographic keys — without ever letting the raw key material leave the device. Instead of exporting a private key to sign something, you send the data *to* the HSM, and it returns only the signature. The key itself never exists anywhere else, in memory or on disk, outside the module.

This single property — **non-extractability** — is what separates an HSM from "a key stored in an encrypted file." An attacker who fully compromises a server storing keys in files can copy them and walk away; an attacker who compromises a server that only ever *calls* an HSM gets the ability to request operations, for as long as they maintain that access, and nothing they can take with them.

HSMs are also physically tamper-resistant and often tamper-*responsive* — physical intrusion (drilling, probing, extreme temperature/voltage) can trigger automatic key zeroization, destroying the keys rather than letting them be extracted. This is the same principle behind the [Root CA's offline HSM storage]({{ '/topics/certificates/' | relative_url }}#root-ca) mentioned on the certificates page.

## Is an HSM mandatory?

No — and the "if KMS already works, why HSM" question usually has a simpler answer than it first appears: **a standard cloud KMS call is already HSM-backed**. AWS KMS, Google Cloud KMS, and Azure Key Vault all perform their key operations inside FIPS-validated HSMs internally — the KMS API is exactly the "protection as an API" this page describes, not a lesser substitute for one. For the overwhelming majority of applications, calling KMS *is* using an HSM; there's no separate box to add.

What you'd reach for a **dedicated** HSM (AWS CloudHSM, Azure Dedicated HSM, an on-prem Thales/Utimaco/Entrust appliance) instead of the shared KMS service for is a narrower set of real reasons:

- **Single-tenant exclusivity is a hard compliance requirement.** Some regulatory regimes and contracts require that no other customer's keys or operations ever share the same physical module — AWS KMS's HSMs are multi-tenant internally (isolated per customer, but shared hardware); CloudHSM's are not.
- **Low-level API access.** KMS only exposes a fixed set of operations over a REST API. A dedicated HSM speaks PKCS#11, JCE, or a vendor SDK directly, which some legacy applications or custom cryptographic workflows require.
- **A certification the shared service doesn't carry for your specific use case** — for example, [PCI PTS HSM]({{ '/topics/security-certifications/' | relative_url }}#pci-pts-hsm--the-payments-industrys-own-standard) for payment processing, or on-premises data residency rules that rule out a cloud-operated service entirely regardless of its own certifications.
- **Root-of-trust ceremonies** — an offline root CA (see [Certificate Authorities]({{ '/topics/certificates/' | relative_url }}#root-ca)) is typically generated and stored on a dedicated HSM kept physically air-gapped, which a cloud API-driven KMS can't provide by design.

Outside of those specific triggers, reaching for a dedicated HSM when KMS already covers the need mostly just adds operational cost and complexity without a corresponding increase in real protection.

## Seeing non-extractability enforced: SoftHSM + PKCS#11

[SoftHSM2](https://www.opendnssec.org/softhsm/) is an open-source software HSM implementing **PKCS#11**, the standard API most real HSMs speak. It's useful here precisely because it enforces the same access rules as physical hardware — a good way to see "the key can't leave" as an actual enforced property, not just a claim.

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

Refused outright — the API doesn't offer a way to do it, by design. And the signature produced is a completely ordinary, standards-compliant ECDSA signature — verifiable with plain OpenSSL once the public key is exported (public keys, unlike private ones, are meant to be extractable):

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

Running physical HSMs is expensive and operationally heavy, which is why **cloud KMS** services (AWS KMS, Google Cloud KMS, Azure Key Vault) exist — they're backed by HSMs (often literally, or available as a dedicated HSM tier) but expose key management as a simple API call instead of physical hardware you manage yourself.

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

## Key rotation: what actually happens, and why it doesn't touch the data

"Rotate the key" sounds like it should mean re-encrypting everything that key ever touched — for a KEK protecting terabytes of data, that would be prohibitively expensive, and it's not what actually happens.

A KEK never directly touches the bulk data at all — it only ever wraps (encrypts) the much smaller DEK, which is what actually encrypts the data (see the envelope-encryption diagram above). Rotating the KEK means:

1. A new KEK version is generated.
2. Each existing wrapped DEK is unwrapped with the *old* KEK version, then re-wrapped with the *new* one.
3. The underlying data — still encrypted under the same, unchanged DEK — is never touched, read, or re-encrypted at all.

Only the small wrapped-DEK blob changes, not the potentially enormous ciphertext it protects. That's the entire reason KEK rotation is a cheap, fast, routine operation regardless of how much data sits underneath it — the amount of actual data protected by a given KEK has no bearing on how long rotation takes, since rotation never touches it. This is exactly why there's rarely a good excuse not to rotate on a schedule (see [Common pitfalls](#common-pitfalls) below) — the operational cost that makes rotation feel risky simply doesn't apply here.

## Common pitfalls

- **Treating KMS/HSM access credentials as less sensitive than the keys they protect** — if the IAM role or API credential that can *call* the KMS leaks, the attacker doesn't need the key material; they can just ask the KMS to decrypt things for them. **[Code Spaces](https://thehackernews.com/2014/06/cyber-attack-on-code-spaces-puts.html)**, a source-control hosting company, was destroyed within hours in a real 2014 incident that illustrates exactly this: attackers who compromised its AWS console credentials didn't need to break any encryption at all — they simply used the legitimate, authenticated console access to delete the company's EC2 resources, S3 buckets, and every backup, including the offsite ones stored in the same AWS account. No key was ever "broken"; the credential controlling access to everything was the entire attack surface, and it was enough on its own to end the company.
- **Encrypting bulk data directly through the KMS API** instead of using envelope encryption — most KMS `Encrypt` APIs cap the payload size (AWS KMS: 4 KB) specifically to push callers toward the DEK/KEK pattern.
- **Equating "encrypted at rest" with "HSM-protected"** — ask specifically what protects the key doing the encrypting, not just whether the data happens to be encrypted somewhere.
- **No key rotation policy** — HSMs and KMS both support rotating the KEK without re-encrypting all underlying data (only the wrapped DEKs need re-wrapping), so there's rarely a good excuse not to.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/fips/140-3/final">FIPS 140-3</a></strong> (successor to FIPS 140-2) is the current cryptographic module validation standard. <strong><a href="https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search">NIST's CMVP validated modules search</a></strong> is the authoritative place to verify any specific FIPS claim. <strong><a href="https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final">NIST SP 800-57 Part 1 Rev. 5</a></strong> covers key management practices generally, including rotation. <strong><a href="https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.1/os/pkcs11-spec-v3.1-os.html">PKCS#11</a></strong> (OASIS) is the standard HSM/token API demonstrated above. <a href="https://docs.cloud.google.com/kms/docs/cmek">Google Cloud's CMEK documentation</a> and <a href="https://docs.aws.amazon.com/kms/latest/developerguide/symm-asymm-concepts.html">AWS KMS's symmetric/asymmetric key documentation</a> cover the provider-specific terminology and the asymmetric-key use case described above.</p>
</div>

## Where this fits

This is the "where do the keys actually live" answer underneath [Certificate Authorities]({{ '/topics/certificates/' | relative_url }}) (root keys), [Full-Disk & File Encryption]({{ '/topics/full-disk-file-encryption/' | relative_url }}) (the KEK), and any production system doing its own [symmetric]({{ '/topics/symmetric-cryptography/' | relative_url }}) or [asymmetric]({{ '/topics/asymmetric-cryptography/' | relative_url }}) cryptography at scale — the primitives are the same everywhere; HSM/KMS is about the custody of the keys those primitives depend on. [Security Certifications]({{ '/topics/security-certifications/' | relative_url }}) covers the broader landscape of assurance standards a module or product might be evaluated against beyond FIPS 140 alone.
