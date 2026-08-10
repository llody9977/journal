---
title: Full-Disk & File-Level Encryption
description: Data at rest protection architectures, AES-XTS (IEEE 1619), LUKS2 with Argon2id, TPM 2.0 / Secure Enclave binding, envelope key hierarchies (DEK/KEK), and CMEK cloud storage.
permalink: /topics/full-disk-file-encryption/
last_verified: 2026-08-09
---

<span class="eyebrow">Cryptography / Storage Security</span>

# Full-Disk & File-Level Encryption

<p class="lede">Data at rest security protects stored information against physical storage theft, unauthorized disk cloning, and cloud infrastructure exfiltration. Architecture decisions span full-disk encryption (FDE) operating at the block-device layer (e.g. Linux LUKS2, encrypting an entire partition under one volume key), file-system encryption (FBE, e.g. Android's fscrypt) enforcing per-file access boundaries, and database field-level encryption using Key Encryption Key (KEK) envelope hierarchies.</p>

## Threat Scope: Data at Rest Protection Boundaries

Full-disk encryption protects data **only while its key is evicted from memory — in practice, chiefly when the device is fully powered off**:

<div class="diagram-frame">
  <img src="{{ '/assets/img/full-disk-encryption-scope.svg' | relative_url }}" alt="Full-disk encryption threat scope diagram showing physical theft protection when powered off vs transparent access when unlocked.">
  <p class="diagram-caption">FDE Threat Scope: protects against physical disk theft when powered off; OS transparently decrypts blocks while running</p>
</div>

1. **Powered-Off State (Protected)**: Storage blocks are encrypted under volume keys that may be bound to hardware elements such as a TPM 2.0 or Secure Enclave, or protected by user passphrases/keyfiles. Physical removal of the SSD yields unreadable ciphertext.
2. **Active Booted Session (Transparent)**: Once the OS boots and unlocks the volume key, decryption occurs transparently at the block and file-system layer, though operating system access controls (user permissions, ACLs, process boundaries) still apply. Application-layer vulnerabilities (SQLi, path traversal) bypass FDE completely, requiring file-level or field-level encryption.
3. **Screen-Locked, Still Mounted (Transparent, Not Protected)**: A locked screen is a separate security boundary from FDE — it does not, by itself, evict the volume key or unmount the disk. On iOS, only the narrower *Complete Protection* data class discards its keys at lock; the *After First Unlock* class (used by most app data) keeps its keys resident until reboot, and desktop FDE (FileVault, LUKS2) behaves the same way once mounted. An adversary with physical or software access to a locked-running machine cannot read decrypted data without bypassing operating system access controls, exploiting an authorized session, obtaining privileged execution, or extracting keys from RAM; only evicting the key (power-off, or an explicit re-lock of the volume) restores physical data-at-rest protection.

## Block Cipher Mode for Disks: AES-XTS (IEEE 1619)

Standard 512-byte disk sectors cannot change size when encrypted (a 512-byte plaintext sector must produce a 512-byte ciphertext sector) with no spare room for an appended tag, which is why mainstream FDE (LUKS2, BitLocker, FileVault) uses an unauthenticated tweakable mode like AES-XTS rather than AEAD there. This is a constraint of that specific on-disk layout, not an absolute law of block storage: drives or filesystems that reserve extra per-sector metadata (e.g., 520-byte "DIF/DIX" sectors) or that authenticate at a coarser granularity than the raw sector (storing tags in a separate metadata region, as ZFS and some authenticated filesystem designs do) can and do support authenticated storage — they just aren't what conventional AES-XTS full-disk encryption uses.

Standardized in **[IEEE 1619](https://standards.ieee.org/ieee/1619/6966/)** and **[NIST SP 800-38E](https://csrc.nist.gov/pubs/sp/800/38/e/final)**, **AES-XTS** uses two independent, equal-length AES keys (<b>K<sub>1</sub>, K<sub>2</sub></b>) and a sector tweak value. Per NIST's naming convention the two halves are concatenated into one key, so **AES-256-XTS** — the common full-disk-encryption default — supplies **512 bits of total key material** (two 256-bit keys), while AES-128-XTS supplies 256 bits total (two 128-bit keys):

<b>C = AES-XTS(K<sub>1</sub>, K<sub>2</sub>, Sector Number, Plaintext)</b>

AES-XTS prevents pattern leakage between identical sectors. Per NIST SP 800-38E, modifying a single ciphertext byte completely randomizes the 16-byte AES block containing that byte upon decryption, while leaving the remaining 16-byte blocks in the sector unchanged (XTS provides confidentiality, not authenticity or integrity).

## Linux LUKS2 & Argon2id Header Security

On Linux systems, **LUKS2 (Linux Unified Key Setup v2)** is a header and key-management format layered on **dm-crypt** — it is not itself a cipher, but a key hierarchy that wraps the underlying disk cipher (typically the AES-XTS above). A LUKS2 header holds up to **32 independent key slots**, each a passphrase- or keyfile-derived wrapping of the volume key, so a passphrase and a separate recovery key can unlock the same block device independently. Each slot independently selects its own key-derivation function — LUKS2 supports **PBKDF2**, **Argon2i**, and **Argon2id** per [cryptsetup's `luksFormat` documentation](https://man7.org/linux/man-pages/man8/cryptsetup-luksformat.8.html) — so not every slot in a given header is necessarily Argon2id-derived, particularly on headers migrated from LUKS1 or created with an explicit `--pbkdf` override. Modern `cryptsetup` compiles with **Argon2id** as its *default* KDF for newly created slots (a change from LUKS1, which defaulted to PBKDF2), but that default is configurable at slot-creation time, not a hard guarantee for every slot.

## Envelope Key Hierarchy: DEK & KEK

To encrypt millions of database fields or S3 objects efficiently, systems implement **Envelope Encryption**:

<div class="diagram-frame">
  <img src="{{ '/assets/img/dek-kek.svg' | relative_url }}" alt="Envelope encryption architecture showing KMS KEK wrapping data encryption key DEK.">
  <p class="diagram-caption">Envelope encryption: Key Encryption Key (KEK) in KMS wraps per-object Data Encryption Keys (DEKs)</p>
</div>

1. **Data Encryption Key (DEK)**: A single-use 256-bit AES key generated by a CSPRNG encrypts the actual file or database payload.
2. **Key Encryption Key (KEK)**: A long-lived master key managed inside an HSM or Cloud KMS wraps (encrypts) the DEK using AES Key Wrap ([RFC 3394](https://www.rfc-editor.org/rfc/rfc3394)).

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Hierarchy &amp; Rotation Mechanics</div>
  <div>
    <strong>CMEK, DEK, KEK &amp; Key Rotation Under the Hood</strong>
    <p>To secure massive data stores efficiently, envelope encryption divides responsibilities between local fast data keys and centralized master key custody:</p>
    <ul>
      <li><strong>Data Encryption Key (DEK)</strong>: A 256-bit AES symmetric key generated in memory. It encrypts the raw file or database payload. The plaintext DEK is <strong>never written to disk</strong>; it encrypts the file, gets wrapped by the KEK into an <strong>Encrypted DEK (EDEK)</strong>, and the EDEK is stored alongside the payload file.</li>
      <li><strong>Key Encryption Key (KEK) / CMEK</strong>: A master key stored inside a Hardware Security Module (HSM) or Cloud KMS (e.g. AWS KMS, GCP KMS). A <strong>Customer-Managed Encryption Key (CMEK)</strong> is a KEK where the customer controls access policies, rotation schedules, and revocation. In non-exportable HSM-backed architectures, the KEK remains within the HSM security boundary, used primarily to wrap and unwrap key material such as local DEKs.</li>
    </ul>
    <strong>What Key Is Actually Being Rotated?</strong>
    <p>When key rotation is triggered (e.g. annually), one common efficient strategy is rotating only the Master KEK/CMEK inside KMS — avoiding multi-terabyte bulk data re-encryption — though DEKs and bulk data can also be rotated or re-encrypted after a compromise or according to policy:</p>
    <ul>
      <li><strong>Version Creation</strong>: KMS generates <code>KEK_v2</code> and marks it active for <em>new</em> encryptions. <code>KEK_v1</code> is retained inside KMS as <em>decrypt-only</em>.</li>
      <li><strong>Older Data Decryption</strong>: When reading older data, the application sends <code>EDEK_v1</code> to KMS. KMS inspects the key version header, uses <code>KEK_v1</code> to unwrap the DEK, and returns the plaintext DEK to RAM. <strong>No bulk data re-encryption is required!</strong></li>
      <li><strong>Re-wrapping EDEKs (Optional)</strong>: If security compliance mandates eliminating dependencies on <code>KEK_v1</code>, KMS performs a <em>ReEncrypt</em> operation: unwrapping the 32-byte <code>EDEK_v1</code> and wrapping the same 32-byte DEK under <code>KEK_v2</code>. The multi-terabyte data payload remains completely untouched on disk.</li>
    </ul>
  </div>
</div>

## Cloud Disk Encryption: Customer-Managed Encryption Keys (CMEK)

| Cloud Provider | Managed Service | Customer Key Control (CMEK) | HSM Backing Standard |
|---|---|---|---|
| **Amazon Web Services (AWS)** | AWS KMS / EBS Encryption | AWS KMS Customer Managed Keys (CMK) | FIPS 140-3 Level 3 HSM hardware module backing. |
| **Google Cloud (GCP)** | Cloud KMS / Persistent Disk | Customer-Managed Encryption Keys (CMEK) | Not HSM-backed by default: Cloud KMS keys are **software-protected** unless you explicitly choose the **HSM**, **external**, or **external VPC** [protection level](https://docs.cloud.google.com/kms/docs/protection-levels) at key-ring creation; only the HSM protection level runs inside a FIPS 140-2/3 validated HSM boundary. Supports configurable regional, dual-region, or multi-region key locations ([Google Cloud KMS Locations](https://docs.cloud.google.com/kms/docs/locations)). |
| **Microsoft Azure** | Azure Key Vault / Disk Encryption | Customer-Managed Keys (CMK) | Managed HSM providing dedicated FIPS 140-3 Level 3 hardware. |

## Storage Encryption Gaps Beyond "Is It Encrypted?"

Confirming that a disk or object store is encrypted answers a narrower question than it sounds like — several adjacent concerns determine whether that encryption actually protects what you think it does:

- **Authenticated storage**: As covered above, mainstream FDE (AES-XTS) provides confidentiality without built-in integrity — a targeted single-block ciphertext modification is not detected by AES-XTS itself. Systems that need tamper-evidence at the storage layer add it separately: ZFS and similar checksummed/authenticated filesystems verify block integrity independently of the disk encryption layer, and some database engines add their own page-level checksums or authenticated encryption on top of an unauthenticated disk layer.
- **Metadata leakage**: Full-disk and even most file-level encryption protect file *contents* but commonly leave metadata exposed — file names, sizes, directory structure, access-time patterns, and (for FDE specifically) the total volume of data written can all be visible to anyone with access to the encrypted container or its access patterns, even without the decryption key. Threat models involving a curious host provider, a compromised hypervisor, or forensic analysis of an unmounted encrypted volume's free space and slack space need to separately account for what metadata remains visible.
- **Backup and snapshot coverage**: Encryption applied to a live volume does not automatically apply to every copy of that data. Snapshots, backups, replication targets, and cache layers can silently persist unencrypted (or separately-keyed) copies of data that was "encrypted at rest" on the primary volume — verify that backup and snapshot pipelines specifically inherit or independently enforce the same encryption and key-management posture as the source, rather than assuming coverage propagates automatically.
- **Recovery / escrow**: A volume that only the primary passphrase or TPM-bound key can unlock is one lost device or one forgotten passphrase away from permanent data loss. Production FDE deployments generally require a documented recovery mechanism — an escrowed recovery key (as with BitLocker's Active Directory or Azure AD key escrow, or a LUKS2 recovery key slot held separately from the daily-use passphrase) — which itself becomes a security-sensitive asset requiring the same access-control rigor as the primary key.
- **Hibernation and cold-boot exposure**: Suspending a device to disk (hibernation) can write the volume's decryption key, or decrypted memory contents including the key, into an unencrypted or separately-protected hibernation file — undermining FDE's powered-off guarantee if that file isn't itself covered by the encrypted volume. Separately, DRAM contents (including keys) don't vanish instantly on power loss; **cold-boot attacks** exploit the brief data-remanence window (extended by physically cooling the RAM chips) to recover keys from a machine that was recently running, even after it's been powered off — a risk FDE's "powered-off state is protected" framing doesn't fully capture for a machine that was unlocked moments before an attacker gained physical access.
- **Crypto-erasure**: Because FDE's actual protection boundary is the volume key rather than the bulk ciphertext, securely destroying just that key (rather than overwriting the entire physical medium) renders all data on the volume permanently unrecoverable — a technique called **crypto-erasure** or **crypto-shredding**. This is the practical basis for "instant" secure disposal of cloud volumes and self-encrypting drives (where the drive firmware manages the key and erases it on command), and for efficiently fulfilling data-deletion requirements on data that would otherwise require expensive full-medium overwrites.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Disk &amp; File Encryption Summary</strong>
    <ul>
      <li><strong>IEEE 1619 AES-XTS</strong>: Standard sector block cipher mode preventing pattern leakage without altering sector size.</li>
      <li><strong>LUKS2 &amp; Argon2id</strong>: Linux disk encryption header format using Argon2id KDF to protect volume master keys.</li>
      <li><strong>Envelope Key Rotation</strong>: Re-wrapping DEKs or rotating the Master KEK inside KMS avoids re-encrypting bulk data payloads, though full data re-encryption may still be performed for specific compliance policies.</li>
    </ul>
  </div>
</div>

## Primary References

- **IEEE 1619-2018**: *IEEE Standard for Cryptographic Protection of Data on Block-Oriented Storage Devices* — [IEEE 1619 Standard](https://standards.ieee.org/ieee/1619/6966/)
- **NIST SP 800-38E**: *Recommendation for Block Cipher Modes of Operation: The XTS-AES Mode for Confidentiality on Storage Devices* — [NIST CSRC SP 800-38E](https://csrc.nist.gov/pubs/sp/800/38/e/final)
- **RFC 3394**: *Advanced Encryption Standard (AES) Key Wrap Algorithm* — [IETF RFC 3394](https://www.rfc-editor.org/rfc/rfc3394)
- **AWS KMS Key Management**: *AWS Key Management Service Cryptographic Details* — [AWS KMS Security Documentation](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html)
- **Google Cloud KMS**: *Google Cloud Key Management Service Architecture* — [GCP Cloud KMS Docs](https://cloud.google.com/kms/docs/architecture-overview)
- **Azure Key Vault**: *Microsoft Azure Key Vault Security Guidelines* — [Azure Key Vault Documentation](https://learn.microsoft.com/en-us/azure/key-vault/general/overview)
