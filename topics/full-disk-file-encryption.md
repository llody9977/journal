---
title: Full-Disk & File Encryption
description: Data at rest vs data in transit, XTS mode, and why disk encryption uses two keys (DEK/KEK) instead of one.
permalink: /topics/full-disk-file-encryption/
---

<span class="eyebrow">Cryptography / Applied Cryptography / Deep Dive</span>

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

- **DEK (Data Encryption Key)** — encrypts the actual bulk data under XTS, fixed for the entire life of the volume. Re-encrypting an entire multi-terabyte disk every time a password changes would be impossibly slow, so it never does.
- **KEK (Key Encryption Key)** — encrypts (*wraps*) the DEK itself. This is the key that's actually derived from something you know or something the hardware verifies. Changing your password only re-wraps the (unchanged) DEK with a new KEK — a near-instant operation regardless of disk size.

The KEK itself can come from a few different sources, often combined:

- **Password/PIN** — run through a [password-hardened KDF]({{ '/topics/password-storage/' | relative_url }}) like PBKDF2 or Argon2, exactly as covered on that page.
- **TPM (Trusted Platform Module) / Secure Enclave** — a dedicated hardware chip that measures the boot process and only releases the KEK automatically if the boot chain is untampered, letting the disk unlock without a password prompt on trusted hardware.
- **Recovery key** — a long, randomly-generated backup unlock code (BitLocker's is 48 digits), meant to be stored somewhere separate and safe — an organization's key escrow, a printed copy in a safe — for when the primary unlock method is lost.

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

The VA had no technical control requiring full-disk encryption on a device that, by design, could leave a secured facility carrying a database of that size. The incident is estimated to have cost the agency [$100–500 million](https://www.airandspaceforces.com/article/0906scandal/) in remediation, credit monitoring, and legal exposure, and it became one of the most-cited early arguments for mandating FDE on any device that both holds sensitive data and can physically leave a building. Every laptop a large organization issues today with BitLocker or FileVault enabled by default is, in part, a direct policy response to exactly this incident.

## Common pitfalls

- **Confusing sleep with shutdown** — decryption keys often remain resident in RAM during sleep, and some cold-boot attacks can extract keys from recently-powered-down RAM. Full shutdown clears this risk more reliably.
- **Assuming FDE protects a running, unlocked system** — see the file-vs-disk distinction above; it doesn't, by design.
- **Losing the recovery key** — the backup unlock method is only useful if it was actually saved somewhere durable before it's needed.
- **Assuming “TPM 2.0” automatically prevents bus sniffing** — discrete TPM traffic can still be exposed if the platform and unlock design do not protect the relevant exchange. A pre-boot PIN, parameter/session encryption where supported, and integrated SoC security can reduce this risk; the TPM version number alone is not proof.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/sp/800/38/e/final">NIST SP 800-38E</a></strong> defines XTS-AES for storage confidentiality and explicitly notes the lack of authentication. Hardware cryptographic-module claims can be checked against <strong><a href="https://csrc.nist.gov/pubs/fips/140-3/final">FIPS 140-3</a></strong> and the NIST CMVP database.</p>
</div>

## How I connect this

The cipher underneath full-disk encryption is the same [AES]({{ '/topics/symmetric-cryptography/' | relative_url }}) covered earlier — only the *mode* (XTS instead of GCM/CTR) changes, driven entirely by the random-access requirement. The key-derivation half reuses [Password Storage]({{ '/topics/password-storage/' | relative_url }})'s slow-KDF approach for the password-unlock path, layered underneath a second key purely to make password changes fast.
