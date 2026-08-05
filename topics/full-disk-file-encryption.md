---
title: Full-Disk & File Encryption
description: Data at rest vs data in transit, XTS mode, and why disk encryption uses two keys (DEK/KEK) instead of one.
permalink: /topics/full-disk-file-encryption/
last_verified: 2026-08-05
---

<span class="eyebrow">Cryptography / Applied</span>

# Full-Disk & File Encryption

<p class="lede">For my threat model, full-disk encryption mainly answers one question: if somebody takes the powered-off or locked device, can they read the storage without the unlock secret? It does not protect an already unlocked machine from malware or a logged-in attacker.</p>

## The threat model: physical access, not network eavesdropping

Full-disk encryption (FDE) exists for a specific scenario: a lost or stolen laptop, a decommissioned hard drive that wasn't wiped, a seized device, a repair shop technician with unsupervised access. None of these involve intercepting network traffic — the attacker already has the bytes. The only question is whether those bytes are usable without the key.

## How full-disk encryption actually works: XTS mode

Disks need independent, rewriteable data units and must avoid leaking equality patterns when sectors are moved or rewritten. Sector-local CBC constructions and counter modes can support random access, so random access alone does not “rule them out”. XTS was designed specifically for storage-device confidentiality and uses the data-unit position as a tweak.

**XTS mode** (XEX-based Tweaked-codebook with Ciphertext Stealing) uses the data-unit number—normally related to the sector—as a tweak. Identical plaintext at different positions encrypts differently while each data unit remains independently accessible.

<div class="callout warn">
  <span class="callout-title">XTS gives confidentiality, not authentication</span>
  <p><a href="https://csrc.nist.gov/pubs/sp/800/38/e/final">NIST SP 800-38E</a> states that XTS-AES does not authenticate the data or its source. An attacker able to modify sectors may cause controlled or unpredictable plaintext changes without an authentication failure. A complete storage design may need integrity protection from the filesystem, hardware, or another authenticated layer.</p>
</div>

## The real problem: where the key actually comes from

The cipher is almost never the hard part of disk encryption — key management is. If the decryption key were just sitting on the disk in the clear, none of this would matter. Real systems solve this with two separate keys, not one:

<div class="diagram-frame">
  <img src="{{ '/assets/img/dek-kek.svg' | relative_url }}" alt="Diagram showing disk data encrypted by a Data Encryption Key (DEK), which is itself wrapped by a Key Encryption Key (KEK). The KEK can be unlocked three ways: a password or PIN via PBKDF2/Argon2, a TPM or Secure Enclave that only releases it if the boot process is untampered, or a recovery key as a backup." >
  <p class="diagram-caption">Changing an unlock password normally changes its protector/KEK and re-wraps the unchanged volume key; the bulk data is not re-encrypted</p>
</div>

- **DEK (Data Encryption Key)** — encrypts the bulk data under XTS. It is normally long-lived, so changing an unlock password can rewrap the same DEK without rewriting every sector. Some products can rotate or migrate a volume key through a separate re-encryption operation.
- **KEK (Key Encryption Key)** — encrypts (*wraps*) the DEK itself. It can be derived from a passphrase or released after hardware policy checks. Changing my password normally re-wraps the unchanged DEK with a new KEK, so the disk contents do not need to be encrypted again.

The KEK itself can come from a few different sources, often combined:

- **Password/PIN** — run through a [password-hardened KDF]({{ '/topics/password-storage/' | relative_url }}) like PBKDF2 or Argon2, exactly as covered on that page.
- **TPM (Trusted Platform Module) / Secure Enclave** — hardware-backed key protection can release or use key material only when a configured policy is satisfied. A TPM policy may bind release to expected platform measurements; the exact policy and recovery behavior depend on the product configuration.
- **Recovery key** — a long, randomly-generated backup unlock code (BitLocker's is 48 digits), meant to be stored somewhere separate and safe — an organization's key escrow, a printed copy in a safe — for when the primary unlock method is lost.

## Cloud disk encryption: where CMEK fits

Cloud disk encryption uses the same envelope pattern, but the trust boundary is different from my laptop. The cloud storage service encrypts disk I/O with a **symmetric DEK** because it must process large amounts of data efficiently. A **customer-managed encryption key (CMEK)** controls how that DEK is wrapped or made usable. CMEK gives the customer direct policy, audit, rotation, disablement, and deletion controls over the key resource; it does not mean the disk sectors are encrypted directly with that key.

| Cloud disk example | What encrypts the disk data | What the customer-managed key does | Identity that receives access | What this does not mean |
|---|---|---|---|---|
| AWS EBS | An AES-256 data key | A **symmetric** KMS key encrypts the data key | Amazon EC2/EBS uses KMS grants and `Decrypt` under the key policy | EBS does not use an RSA key to encrypt every disk block |
| Google Cloud CMEK-integrated storage | A service-managed symmetric DEK | A **symmetric** Cloud KMS key protects the DEK through server-side envelope encryption | The product's service agent gets `CryptoKey Encrypter/Decrypter` on the key | An application user does not need direct CMEK access just to read an authorized resource |
| Azure Managed Disks | A symmetric DEK | A Key Vault or Managed HSM **RSA key** wraps and unwraps the DEK | The Disk Encryption Set's managed identity gets `wrapKey`, `unwrapKey`, and `get` access | RSA still does not encrypt the disk data; it protects only the small DEK |

The provider implementations are not interchangeable. [AWS documents](https://docs.aws.amazon.com/ebs/latest/userguide/how-ebs-encryption-works.html) an AES-256 data key protected by a symmetric KMS key. [Google documents](https://docs.cloud.google.com/kms/docs/cmek) symmetric server-side envelope encryption for CMEK-integrated services. [Azure documents](https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption) a symmetric DEK wrapped and unwrapped by an RSA customer-managed key through a managed identity.

The [DEK, KEK, CMEK and rotation animation]({{ '/topics/hsm-kms/' | relative_url }}#visual-walkthrough-how-the-key-layers-and-rotation-fit-together) follows this hierarchy from bulk-data encryption through old-key-version retirement.

### Why I keep seeing symmetric encryption for disks

- **Volume:** symmetric ciphers are designed for high-throughput bulk data. Public-key encryption has small payload limits and higher computational cost.
- **Access pattern:** disk encryption must process sectors repeatedly with low latency. XTS-AES was designed for storage confidentiality and random access.
- **Key hierarchy:** asymmetric cryptography can still appear at the small-key layer, as Azure's RSA wrapping shows, without touching every disk block.
- **Different objective:** signatures and certificates authenticate identities or changes; they do not make disk contents confidential.

I use asymmetric encryption when a sender cannot be given a shared secret or KMS credential but can obtain my public key—for example, an external party encrypting a small DEK that only my KMS-held private key can recover. I then use that DEK with symmetric authenticated encryption for the file. I do not encrypt a disk, database, or large file directly with RSA.

### Keep custody; grant the service permission to use the CMEK

“Share the CMEK with the vendor” is dangerously ambiguous. My preferred managed-service pattern is:

1. I create and own the key in my KMS account, project, vault, or external key manager.
2. The vendor or cloud service provides a dedicated service identity.
3. I grant that identity only the required operations on the specific key, such as wrap/unwrap or encrypt/decrypt. I do not send raw key bytes, a key-export file, or administrator credentials.
4. I retain lifecycle control, monitor use, and test both revocation and recovery before production.

This keeps the key resource under my control and avoids giving the vendor another raw-key copy. Physical custody still depends on whether the key is software-backed, HSM-backed, or held in an external key manager. It also does not make the vendor powerless: an identity allowed to unwrap a DEK can use that authority within its permitted workflow. The control comes from a narrow, revocable, auditable permission boundary. If a product requires me to upload key material, I should classify it accurately as imported-key or bring-your-own-key custody, not the same model as a customer-held key with delegated use. [HSM & KMS]({{ '/topics/hsm-kms/' | relative_url }}#giving-a-vendor-access-without-giving-away-key-custody) keeps the fuller decision checklist.

## Common implementations

| System | Platform | Typical backing |
|---|---|---|
| BitLocker | Windows | AES-XTS, usually TPM-backed with a PIN option |
| FileVault | macOS | AES-XTS; hardware-backed key handling differs between Intel Macs, T2 Macs, and Apple silicon |
| LUKS / dm-crypt | Linux | AES-XTS, passphrase, keyfile, or TPM-backed unlock |

## File-level vs. disk-level encryption

Full-disk encryption only protects data **while the device is off or locked**. The moment it's unlocked and running, every file is available in plaintext to any process with permission to read it — FDE says nothing about malware, a logged-in attacker, or a compromised running application. That's a different problem, solved by **file-level or application-level encryption** (an encrypted archive, a GPG- or `age`-encrypted file, application-level field encryption in a database) — protecting specific data even while the surrounding system is fully powered on and logged in.

## Practical demo: creating a real encrypted volume

```
$ hdiutil create -size 10m -fs APFS -encryption AES-256 \
    -stdinpass -volname DemoVolume encrypted_demo.dmg
Password:
created: /private/tmp/encrypted_demo.dmg

$ hdiutil imageinfo encrypted_demo.dmg -stdinpass
Password:
Format: UDRW
	Encrypted: true
```

`hdiutil imageinfo` fields vary by macOS release. The command above was rechecked on 26 July 2026; `Encrypted: true` is the stable field I rely on, rather than expecting an old `Class Name` line.

That's a genuinely encrypted, mountable volume — the same primitive concept as BitLocker/FileVault/LUKS, just created directly via macOS's disk image tooling rather than the OS's built-in whole-disk flow.

## Real-world case: the VA laptop theft (2006)

In May 2006, a data analyst at the US Department of Veterans Affairs took home a laptop and an external hard drive holding unencrypted personal data — names, dates of birth, and Social Security numbers — for an estimated 26.5 million veterans and active-duty personnel. Both were stolen in a burglary at his home. They were recovered intact three weeks later, and an FBI forensic examination found no evidence the data had actually been accessed — but that outcome was luck, not a property of any encryption, because there wasn't any on the device at all.

The control failure was clear: sensitive data could leave a secured facility on portable storage without encryption. Full-disk encryption would not have prevented the theft, but it could have made the stored records unreadable without the unlock material. The broader lesson is to combine encryption with data minimization, device management, access controls, inventory, and a tested recovery process rather than rely on one control after a loss.

## Common pitfalls

- **Confusing sleep with shutdown** — decryption keys often remain resident in RAM during sleep, and some cold-boot attacks can extract keys from recently-powered-down RAM. Full shutdown clears this risk more reliably.
- **Assuming FDE protects a running, unlocked system** — see the file-vs-disk distinction above; it doesn't, by design.
- **Losing the recovery key** — the backup unlock method is only useful if it was actually saved somewhere durable before it's needed.
- **Assuming “TPM 2.0” automatically prevents bus sniffing** — discrete TPM traffic can still be exposed if the platform and unlock design do not protect the relevant exchange. A pre-boot PIN, parameter/session encryption where supported, and integrated SoC security can reduce this risk; the TPM version number alone is not proof.
- **Sending raw CMEK material to a vendor** — for a managed integration, I should normally grant a dedicated service identity the minimum key operations instead. Exporting or uploading the key changes the custody model and creates another copy to govern, rotate, revoke, and destroy.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/sp/800/38/e/final">NIST SP 800-38E</a></strong> defines XTS-AES for storage confidentiality and explicitly notes the lack of authentication. Storage encryption is specified by NIST and IEEE rather than one general-purpose RFC. Provider-specific CMEK behavior is documented by <a href="https://docs.aws.amazon.com/ebs/latest/userguide/how-ebs-encryption-works.html">AWS EBS</a>, <a href="https://docs.cloud.google.com/kms/docs/cmek">Google Cloud KMS</a>, and <a href="https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption">Azure Managed Disks</a>. Hardware cryptographic-module claims can be checked against <strong><a href="https://csrc.nist.gov/pubs/fips/140-3/final">FIPS 140-3</a></strong> and the NIST CMVP database.</p>
</div>
