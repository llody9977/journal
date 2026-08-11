---
title: Full-Disk & File-Level Encryption
description: Data at rest protection architectures, AES-XTS (IEEE 1619), LUKS2 with Argon2id, TPM 2.0 / Secure Enclave binding, envelope key hierarchies (DEK/KEK), and CMEK cloud storage.
permalink: /topics/full-disk-file-encryption/
last_verified: 2026-08-11
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
2. **Active Booted Session (Transparent)**: Once the OS boots and unlocks the volume key, decryption occurs transparently at the block and file-system layer, though operating system access controls (user permissions, ACLs, process boundaries) still apply. Application-layer vulnerabilities (SQLi, path traversal) bypass FDE completely, since the OS transparently decrypts on the application's behalf. Adding file- or field-level encryption is not automatically a fix: it only helps if the compromised application component itself lacks the decryption key or the authorization to use it — if the same vulnerable process legitimately holds both (the common case for an application that reads its own encrypted data), that layer is bypassed too. What actually mitigates this class of vulnerability is application-level authorization and input validation, least-privilege service accounts, and a genuinely separate encryption/key boundary (e.g., a distinct service or KMS call the compromised component can't reach) — not merely stacking another encryption layer the same process can unlock.
3. **Screen-Locked, Still Mounted (Transparent, Not Protected)**: A locked screen is a separate security boundary from FDE — it does not, by itself, evict the volume key or unmount the disk. On iOS, only the narrower *Complete Protection* data class discards its keys at lock; the *After First Unlock* class (used by most app data) keeps its keys resident until reboot, and desktop FDE (FileVault, LUKS2) behaves the same way once mounted. An adversary with physical or software access to a locked-running machine cannot read decrypted data without bypassing operating system access controls, exploiting an authorized session, obtaining privileged execution, or extracting keys from RAM; only evicting the key (power-off, or an explicit re-lock of the volume) restores physical data-at-rest protection.

## Block Cipher Mode for Disks: AES-XTS (IEEE 1619)

Standard 512-byte disk sectors cannot change size when encrypted (a 512-byte plaintext sector must produce a 512-byte ciphertext sector) with no spare room for an appended tag, which is why mainstream FDE (LUKS2, BitLocker, FileVault) uses an unauthenticated tweakable mode like AES-XTS rather than AEAD there. This is a constraint of that specific on-disk layout, not an absolute law of block storage: drives or filesystems that reserve extra per-sector metadata (e.g., 520-byte "DIF/DIX" sectors) or that authenticate at a coarser granularity than the raw sector (storing tags in a separate metadata region) can and do support authenticated storage — they just aren't what conventional AES-XTS full-disk encryption uses. ZFS's own native encryption feature (per-dataset AES-GCM, distinct from its unkeyed block checksums discussed below) is one real-world example of this coarser-granularity authenticated approach.

Standardized in **[IEEE 1619](https://standards.ieee.org/ieee/1619/6966/)** and **[NIST SP 800-38E](https://csrc.nist.gov/pubs/sp/800/38/e/final)**, **AES-XTS** uses two independent, equal-length AES keys (<b>K<sub>1</sub>, K<sub>2</sub></b>) and a sector tweak value. Per NIST's naming convention the two halves are concatenated into one key, so **AES-256-XTS** — the common full-disk-encryption default — supplies **512 bits of total key material** (two 256-bit keys), while AES-128-XTS supplies 256 bits total (two 128-bit keys):

<b>C = AES-XTS(K<sub>1</sub>, K<sub>2</sub>, Sector Number, Plaintext)</b>

AES-XTS prevents pattern leakage between identical sectors. Per NIST SP 800-38E, modifying a single ciphertext byte completely randomizes the 16-byte AES block containing that byte upon decryption, while leaving the remaining 16-byte blocks in the sector unchanged (XTS provides confidentiality, not authenticity or integrity).

## Linux LUKS2 & Argon2id Header Security

On Linux systems, **LUKS2 (Linux Unified Key Setup v2)** is a header and key-management format layered on **dm-crypt** — it is not itself a cipher, but a key hierarchy that wraps the underlying disk cipher (typically the AES-XTS above). A LUKS2 header holds up to **32 independent key slots**, each a passphrase- or keyfile-derived wrapping of the volume key, so a passphrase and a separate recovery key can unlock the same block device independently. Each slot independently selects its own key-derivation function — LUKS2 supports **PBKDF2**, **Argon2i**, and **Argon2id** per [cryptsetup's `luksFormat` documentation](https://man7.org/linux/man-pages/man8/cryptsetup-luksformat.8.html) — so not every slot in a given header is necessarily Argon2id-derived, particularly on headers migrated from LUKS1 or created with an explicit `--pbkdf` override. Modern `cryptsetup` compiles with **Argon2id** as its *default* KDF for newly created slots (a change from LUKS1, which defaulted to PBKDF2), but that default is configurable at slot-creation time, not a hard guarantee for every slot.

## File-Level Encryption: A Distinct Construction & Threat Boundary

Everything above operates at the block-device layer: AES-XTS encrypts fixed-size sectors transparently, underneath the filesystem, without any concept of individual "files." **File-level (or file-based) encryption** — Android's fscrypt, encrypted archive formats, application-level "encrypt this document" features — is a different construction with its own design requirements, not simply AES-XTS applied to smaller units:

- **Authenticated file formats**: Unlike AES-XTS (confidentiality only, no built-in integrity), a well-designed file-level scheme wraps file contents in an AEAD envelope — an authentication tag over the ciphertext, not just XTS-style tweakable encryption. A single-shot AEAD call works for small files, but large files need a chunking strategy (below), since AEAD constructions have practical per-call plaintext-size bounds and streaming a multi-gigabyte file through one AEAD invocation is both impractical and, depending on the construction, insecure.
- **Nonce/chunk management**: Splitting a file into chunks and encrypting each with the same key reopens exactly the reordering/truncation/duplication problems discussed in the Safe Protocol Composition section on the Cryptography Overview page — an independent per-chunk AEAD tag doesn't stop an attacker from reordering, dropping, or duplicating whole chunks. Safe file formats bind a monotonic chunk index and a final-chunk flag into each chunk's nonce or associated data (the same STREAM-construction principle used by libsodium's `secretstream` and by `age`), so the decrypting side can detect a rearranged or truncated file as an authentication failure rather than silently reassembling tampered content.
- **Metadata authentication**: A file's logical metadata — original filename, size, permissions, modification time — often lives outside the encrypted content blob (in the surrounding filesystem, or in cleartext format headers), which means it isn't automatically covered by the content's authentication tag. If that metadata matters for security decisions downstream (e.g., a filename used to select which key or policy applies), it needs to be explicitly bound as AEAD associated data or otherwise authenticated — storing it as unauthenticated loose data next to authenticated content reopens the same tampering surface AEAD exists to close.
- **Safe partial reads**: Block-device FDE trivially supports random access — any sector decrypts independently. A chunked-AEAD file format supporting seek/partial-read needs to authenticate the specific chunk(s) actually read, not just the file as a whole; naively decrypting a chunk and returning its plaintext before verifying that chunk's own tag (or before confirming it's genuinely part of the complete, untruncated file) can release unauthenticated plaintext to the caller — the same "verify before release" discipline that applies to AEAD generally (see the AEAD rules on the Symmetric Cryptography page) applies per-chunk here too.

## Envelope Key Hierarchy: DEK & KEK

To encrypt millions of database fields or S3 objects efficiently, systems implement **Envelope Encryption**:

<div class="diagram-frame">
  <img src="{{ '/assets/img/dek-kek.svg' | relative_url }}" alt="Envelope encryption architecture showing KMS KEK wrapping data encryption key DEK.">
  <p class="diagram-caption">Envelope encryption: Key Encryption Key (KEK) in KMS wraps per-object Data Encryption Keys (DEKs)</p>
</div>

1. **Data Encryption Key (DEK)**: Commonly a single-use 256-bit AES key generated by a CSPRNG that encrypts the actual file or database payload — the specific size and generation method are deployment choices, not a fixed requirement of envelope encryption itself.
2. **Key Encryption Key (KEK)**: A long-lived master key managed inside an HSM or Cloud KMS wraps (encrypts) the DEK. **AES Key Wrap** ([RFC 3394](https://www.rfc-editor.org/rfc/rfc3394)) is one common wrapping construction for a symmetric KEK, but it's not the only one in use — some KMS providers wrap with AES-GCM instead, and asymmetric KEKs (e.g., RSA-OAEP) wrap the DEK under a public key rather than a shared secret.

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Hierarchy &amp; Rotation Mechanics</div>
  <div>
    <strong>CMEK, DEK, KEK &amp; Key Rotation Under the Hood</strong>
    <p>To secure massive data stores efficiently, envelope encryption divides responsibilities between local fast data keys and centralized master key custody:</p>
    <ul>
      <li><strong>Data Encryption Key (DEK)</strong>: A 256-bit AES symmetric key generated in memory. It encrypts the raw file or database payload. In a correctly implemented envelope-encryption scheme, the plaintext DEK is <strong>designed never to be written to disk</strong> — that's the architecture's security objective, not a property guaranteed automatically by calling something "envelope encryption"; a buggy or misconfigured implementation can still leak it (e.g., via a swap file, crash dump, or logging path). It encrypts the file, gets wrapped by the KEK into an <strong>Encrypted DEK (EDEK)</strong>, and the EDEK is stored alongside the payload file.</li>
      <li><strong>Key Encryption Key (KEK) / CMEK</strong>: A master key stored inside a Hardware Security Module (HSM) or Cloud KMS (e.g. AWS KMS, GCP KMS). A <strong>Customer-Managed Encryption Key (CMEK)</strong> is a KEK where the customer controls access policies, rotation schedules, and revocation. In non-exportable HSM-backed architectures, the KEK remains within the HSM security boundary, used primarily to wrap and unwrap key material such as local DEKs.</li>
    </ul>
    <strong>What Key Is Actually Being Rotated?</strong>
    <p>When key rotation is triggered (e.g. annually), one common efficient strategy is rotating only the Master KEK/CMEK inside KMS — avoiding multi-terabyte bulk data re-encryption — though DEKs and bulk data can also be rotated or re-encrypted after a compromise or according to policy:</p>
    <ul>
      <li><strong>Version Creation</strong>: KMS generates <code>KEK_v2</code> and marks it active for <em>new</em> encryptions. <code>KEK_v1</code> is retained inside KMS as <em>decrypt-only</em>.</li>
      <li><strong>Older Data Decryption</strong>: When reading older data, the application sends <code>EDEK_v1</code> to KMS. KMS inspects the key version header, uses <code>KEK_v1</code> to unwrap the DEK, and returns the plaintext DEK to RAM. <strong>No bulk data re-encryption is required!</strong></li>
      <li><strong>Re-wrapping EDEKs (Optional)</strong>: If security compliance mandates eliminating dependencies on <code>KEK_v1</code>, KMS performs a <em>ReEncrypt</em> operation: unwrapping <code>EDEK_v1</code> and wrapping the same 32-byte plaintext DEK under <code>KEK_v2</code>. The wrapped <code>EDEK</code> itself is larger than the 32-byte plaintext DEK it contains — wrapping constructions like AES Key Wrap add a fixed overhead (8 bytes for RFC 3394), and some KMS providers additionally prepend metadata (key version, algorithm identifier) to the stored EDEK — so don't assume EDEK and DEK are the same size on disk. The multi-terabyte data payload remains completely untouched on disk.</li>
    </ul>
  </div>
</div>

## Cloud Disk Encryption: Customer-Managed Encryption Keys (CMEK)

| Cloud Provider | Managed Service | Customer Key Control (CMEK) | HSM Backing Standard |
|---|---|---|---|
| **Amazon Web Services (AWS)** | AWS KMS / EBS Encryption | AWS KMS Customer Managed Keys (CMK) | FIPS 140-3 Level 3 validated HSM hardware in most AWS Regions — **China Regions are the documented exception**: AWS KMS there uses HSMs certified by China's OSCCA and compliant with Chinese regulations, but not validated under the FIPS 140-3 program ([AWS KMS data protection docs](https://docs.aws.amazon.com/kms/latest/developerguide/data-protection.html)). |
| **Google Cloud (GCP)** | Cloud KMS / Persistent Disk | Customer-Managed Encryption Keys (CMEK) | Not HSM-backed by default: Cloud KMS keys are **software-protected** unless you explicitly choose the **HSM**, **external**, or **external VPC** [protection level](https://docs.cloud.google.com/kms/docs/protection-levels) at key-ring creation; only the HSM protection level runs inside a FIPS 140-2/3 validated HSM boundary. Supports configurable regional, dual-region, or multi-region key locations ([Google Cloud KMS Locations](https://docs.cloud.google.com/kms/docs/locations)). |
| **Microsoft Azure** | Azure Key Vault / Disk Encryption | Customer-Managed Keys (CMK) | Three distinct tiers, not one HSM guarantee: **Key Vault Standard** stores keys in software (no HSM); **Key Vault Premium** can create HSM-backed keys inside a shared, multi-tenant HSM; **Azure Key Vault Managed HSM** is a separate, single-tenant FIPS 140-3 Level 3 validated HSM service. Confirm which tier and key type a deployment actually uses before assuming HSM backing ([Microsoft's comparison](https://learn.microsoft.com/en-us/azure/key-vault/managed-hsm/mhsm-control-data)). |

## Storage Encryption Gaps Beyond "Is It Encrypted?"

Confirming that a disk or object store is encrypted answers a narrower question than it sounds like — several adjacent concerns determine whether that encryption actually protects what you think it does:

- **Authenticated storage**: As covered above, mainstream FDE (AES-XTS) provides confidentiality without built-in integrity — a targeted single-block ciphertext modification is not detected by AES-XTS itself. Systems that need tamper-evidence at the storage layer add it separately, and it's worth distinguishing two different mechanisms often lumped together as "ZFS protects integrity": ZFS's default per-block **checksums** (Fletcher-4 or, optionally, SHA-256) are unkeyed and detect accidental corruption and bit-rot — they are not cryptographic authentication and don't resist a deliberate adversary who can recompute them, the same limitation unkeyed hashes have elsewhere in this section. ZFS's separate **native encryption** feature (per-dataset AES-GCM) is what actually provides authenticated encryption. Some database engines similarly add their own page-level checksums (integrity against corruption) or genuine authenticated encryption (integrity against tampering) on top of an unauthenticated disk layer — the two aren't interchangeable, and which one a given system has matters for what threat model it actually covers.
- **Metadata leakage**: Full-disk/volume encryption (FDE) normally protects filesystem metadata too — filenames, directory structure, and file sizes generally live inside the encrypted volume alongside file contents, so an offline, powered-off encrypted volume doesn't expose them by itself ([NIST SP 800-111](https://csrc.nist.gov/pubs/sp/800/111/final) describes FDE/volume encryption this way). What FDE doesn't hide: the total size of the encrypted container or device (ciphertext is the same size as plaintext), and — while the volume is mounted and active — I/O access patterns visible to anyone positioned to observe them (a hypervisor, a storage backend, block-level access logs): which sectors get touched, how often, and when. **File-level encryption** is the case that commonly does leave metadata exposed, precisely because it typically operates above an otherwise-unencrypted filesystem — the filesystem layer holding filenames and directory structure sits outside the encrypted blob even though individual file contents are protected; don't conflate that limitation with FDE's threat model.
- **Backup and snapshot coverage**: Encryption applied to a live volume does not automatically apply to every copy of that data. Snapshots, backups, replication targets, and cache layers can silently persist unencrypted (or separately-keyed) copies of data that was "encrypted at rest" on the primary volume — verify that backup and snapshot pipelines specifically inherit or independently enforce the same encryption and key-management posture as the source, rather than assuming coverage propagates automatically.
- **Recovery / escrow**: A volume that only the primary passphrase or TPM-bound key can unlock is one lost device or one forgotten passphrase away from permanent data loss. Production FDE deployments generally require a documented recovery mechanism — an escrowed recovery key (as with BitLocker's Active Directory or Azure AD key escrow, or a LUKS2 recovery key slot held separately from the daily-use passphrase) — which itself becomes a security-sensitive asset requiring the same access-control rigor as the primary key.
- **Hibernation and cold-boot exposure**: Suspending a device to disk (hibernation) can write the volume's decryption key, or decrypted memory contents including the key, into an unencrypted or separately-protected hibernation file — undermining FDE's powered-off guarantee if that file isn't itself covered by the encrypted volume. Separately, DRAM contents (including keys) don't vanish instantly on power loss; **cold-boot attacks** exploit the brief data-remanence window (extended by physically cooling the RAM chips) to recover keys from a machine that was recently running, even after it's been powered off — a risk FDE's "powered-off state is protected" framing doesn't fully capture for a machine that was unlocked moments before an attacker gained physical access.
- **Crypto-erasure**: Because FDE's actual protection boundary is the volume key rather than the bulk ciphertext, securely destroying that key (rather than overwriting the entire physical medium) renders the data unrecoverable — a technique called **crypto-erasure** or **crypto-shredding**, and the practical basis for "instant" secure disposal of cloud volumes and self-encrypting drives (where the drive firmware manages the key and erases it on command). This guarantee only holds if *every* copy of the key is actually destroyed — a key that was also escrowed for recovery, backed up, cached by a KMS, or embedded in a snapshot taken before erasure remains a live path back to the plaintext, so a crypto-erasure procedure needs to account for every place the key (or a wrapped copy of it) could exist, not just the primary volume header.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Disk &amp; File Encryption Summary</strong>
    <ul>
      <li><strong>IEEE 1619 AES-XTS</strong>: Standard sector block cipher mode preventing pattern leakage without altering sector size.</li>
      <li><strong>LUKS2 &amp; Argon2id</strong>: Linux disk encryption header format; Argon2id is the modern `cryptsetup` default KDF for new key slots protecting the volume master key, but individual slots can independently use PBKDF2 or Argon2i instead (see above) — a given header isn't guaranteed to have every slot on Argon2id.</li>
      <li><strong>Envelope Key Rotation</strong>: Re-wrapping DEKs or rotating the Master KEK inside KMS avoids re-encrypting bulk data payloads, though full data re-encryption may still be performed for specific compliance policies.</li>
    </ul>
  </div>
</div>

## Primary References

- **IEEE 1619-2018**: *IEEE Standard for Cryptographic Protection of Data on Block-Oriented Storage Devices* — [IEEE 1619 Standard](https://standards.ieee.org/ieee/1619/6966/)
- **NIST SP 800-38E**: *Recommendation for Block Cipher Modes of Operation: The XTS-AES Mode for Confidentiality on Storage Devices* — [NIST CSRC SP 800-38E](https://csrc.nist.gov/pubs/sp/800/38/e/final)
- **RFC 3394**: *Advanced Encryption Standard (AES) Key Wrap Algorithm* — [IETF RFC 3394](https://www.rfc-editor.org/rfc/rfc3394)
- **AWS KMS Key Management**: *AWS Key Management Service Cryptographic Details* — [AWS KMS Security Documentation](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html)
- **Google Cloud KMS**: *Cloud Key Management Service overview* — [Cloud KMS overview](https://docs.cloud.google.com/kms/docs/key-management-service)
- **Azure Key Vault**: *Microsoft Azure Key Vault Security Guidelines* — [Azure Key Vault Documentation](https://learn.microsoft.com/en-us/azure/key-vault/general/overview)
