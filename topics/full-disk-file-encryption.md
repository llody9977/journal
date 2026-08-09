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

1. **Powered-Off State (Protected)**: Storage blocks are encrypted under hardware keys bound to TPM 2.0 / Secure Enclave. Physical removal of the SSD yields unreadable ciphertext.
2. **Active Booted Session (Transparent)**: Once the OS boots and unlocks the volume key, disk decryption is transparent to all processes. Application-layer vulnerabilities (SQLi, path traversal) bypass FDE completely, requiring file-level or field-level encryption.
3. **Screen-Locked, Still Mounted (Transparent, Not Protected)**: A locked screen is a separate security boundary from FDE — it does not, by itself, evict the volume key or unmount the disk. On iOS, only the narrower *Complete Protection* data class discards its keys at lock; the *After First Unlock* class (used by most app data) keeps its keys resident until reboot, and desktop FDE (FileVault, LUKS2) behaves the same way once mounted. Anyone with software or physical access to a locked-but-running machine can still read decrypted data; only evicting the key (power-off, or an explicit re-lock of the volume) restores protection.

## Block Cipher Mode for Disks: AES-XTS (IEEE 1619)

Disk sectors cannot change size when encrypted (a 512-byte plaintext sector must produce a 512-byte ciphertext sector), ruling out AEAD modes like AES-GCM that append 16-byte authentication tags.

Standardized in **[IEEE 1619](https://standards.ieee.org/ieee/1619/6966/)** and **[NIST SP 800-38E](https://csrc.nist.gov/pubs/sp/800/38/e/final)**, **AES-XTS** uses two independent, equal-length AES keys (<b>K<sub>1</sub>, K<sub>2</sub></b>) and a sector tweak value. Per NIST's naming convention the two halves are concatenated into one key, so **AES-256-XTS** — the common full-disk-encryption default — supplies **512 bits of total key material** (two 256-bit keys), while AES-128-XTS supplies 256 bits total (two 128-bit keys):

<b>C = AES-XTS(K<sub>1</sub>, K<sub>2</sub>, Sector Number, Plaintext)</b>

AES-XTS prevents pattern leakage between identical sectors. Per NIST SP 800-38E, modifying a single ciphertext byte completely randomizes the 16-byte AES block containing that byte upon decryption, while leaving the remaining 16-byte blocks in the sector unchanged (XTS provides confidentiality, not authenticity or integrity).

## Linux LUKS2 & Argon2id Header Security

On Linux systems, **LUKS2 (Linux Unified Key Setup v2)** is a header and key-management format layered on **dm-crypt** — it is not itself a cipher, but a key hierarchy that wraps the underlying disk cipher (typically the AES-XTS above). A LUKS2 header holds up to **32 independent key slots**, each an Argon2id-derived wrapping of the volume key, so a passphrase and a separate recovery key can unlock the same block device independently. LUKS2 uses **Argon2id** (RFC 9106) as its default Key Derivation Function to protect the volume key against offline passphrase cracking when headers are dumped — a change from LUKS1, which defaulted to PBKDF2.

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
      <li><strong>Key Encryption Key (KEK) / CMEK</strong>: A master key stored inside a Hardware Security Module (HSM) or Cloud KMS (e.g. AWS KMS, GCP KMS). A <strong>Customer-Managed Encryption Key (CMEK)</strong> is a KEK where the customer controls access policies, rotation schedules, and revocation. The KEK <strong>never leaves the HSM</strong>; it is used solely to wrap and unwrap small 32-byte DEKs.</li>
    </ul>
    <strong>What Key Is Actually Being Rotated?</strong>
    <p>When key rotation is triggered (e.g. annually), <strong>only the Master KEK/CMEK in KMS is rotated—NOT the bulk data or DEKs!</strong></p>
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
| **Google Cloud (GCP)** | Cloud KMS / Persistent Disk | Customer-Managed Encryption Keys (CMEK) | Cloud HSM with dual-region key replication. |
| **Microsoft Azure** | Azure Key Vault / Disk Encryption | Customer-Managed Keys (CMK) | Managed HSM providing dedicated FIPS 140-3 Level 3 hardware. |

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Disk &amp; File Encryption Summary</strong>
    <ul>
      <li><strong>IEEE 1619 AES-XTS</strong>: Standard sector block cipher mode preventing pattern leakage without altering sector size.</li>
      <li><strong>LUKS2 &amp; Argon2id</strong>: Linux disk encryption header format using Argon2id KDF to protect volume master keys.</li>
      <li><strong>Envelope Key Rotation</strong>: Key rotation rotates the Master KEK/CMEK inside KMS—NOT the bulk data. Older data is decrypted seamlessly via key version headers.</li>
    </ul>
  </div>
</div>

## Primary References

- **IEEE 1619-2018**: *IEEE Standard for Cryptographic Protection of Data on Block-Oriented Storage Devices* — [IEEE 1619 Standard](https://standards.ieee.org/ieee/1619/6966/)
- **NIST SP 800-38E**: *Recommendation for Block Cipher Modes of Operation: The XTS-AES Mode for Confidentiality on Storage Devices* — [NIST CSRC SP 800-38E](https://csrc.nist.gov/pubs/sp/800/38/e/final)
- **RFC 3394**: *Advanced Encryption Standard (AES) Key Wrap Algorithm* — [IETF RFC 3394](https://www.rfc-editor.org/rfc/rfc3394)
