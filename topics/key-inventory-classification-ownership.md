---
title: Key Inventory, Classification & Ownership
description: A practical inventory model for identifying cryptographic keys, their purpose, owners, dependencies, state, and protection requirements.
permalink: /topics/key-inventory-classification-ownership/
last_verified: 2026-08-10
---

<span class="eyebrow">Key Management / Governance</span>

# Key Inventory, Classification & Ownership

<p class="lede">A key inventory is the control plane for cryptographic operations: it records which key exists, what it may do, who is accountable for it, where it can operate, and which data or systems depend on it. Without that map, rotation, compromise response, migration, and destruction become guesswork.</p>

## Inventory keys as dependencies, not isolated byte strings

A cryptographic key has meaning only in context. The same bytes become operationally different objects when their permitted use, algorithm, owner, tenant, location, or lifecycle state changes. [NIST SP 800-130](https://csrc.nist.gov/pubs/sp/800/130/final) treats a Cryptographic Key Management System (CKMS) as managing keys together with bound metadata; the inventory should preserve that relationship.

The inventory has two linked layers:

- **Managed-key records** identify key objects, versions, policy, custody, and state.
- **Cryptographic-dependency records** identify where applications, protocols, certificates, libraries, devices, encrypted datasets, and vendors rely on those objects or on embedded cryptography.

The second layer matters because a KMS can list its own keys but cannot infer every offline ciphertext, copied public key, pinned version, certificate, backup, or application default that depends on them.

## Record the fields needed for a safe decision

| Field group | Minimum useful fields | Decision it supports |
|---|---|---|
| Identity | Stable key ID, provider resource name, version, aliases | Distinguishes a logical key from its key-material versions. |
| Purpose | Encrypt/decrypt, sign/verify, MAC, wrap/unwrap, derive, establish | Prevents incompatible or excessive reuse. |
| Cryptography | Algorithm, mode, parameters, key length or security strength | Finds disallowed or migration-sensitive configurations. |
| Ownership | Business owner, technical custodian, application, service team, escalation contact | Assigns risk acceptance and operational action. |
| Custody | Generator, storage boundary, provider, HSM or module reference, extractability, import origin | Establishes who can access or reconstruct key material. |
| Location | Account or project, region, tenant, environment, device, backup and archive locations | Tests residency, separation, and recovery assumptions. |
| Lifecycle | Creation, activation, scheduled review, deactivation, compromise, archive, and destruction data | Enables state and cryptoperiod enforcement. |
| Dependencies | Data stores, encrypted DEKs, certificates, protocols, workloads, backups, external consumers | Calculates blast radius before disablement or destruction. |
| Control evidence | Policy reference, authorized principals, approvals, last use, audit-log source, exceptions | Supports access review and investigation. |

Do not place plaintext key material in the inventory. The inventory contains identifiers, attributes, relationships, and evidence; it points to the protection boundary that holds the key.

## Classify by function and consequence

Key classification should drive controls. A practical classification considers:

1. **Function:** signature, authentication, data encryption, key wrapping, key derivation, or key establishment.
2. **Scope:** one message, one session, one object, one tenant, one service, or an enterprise root.
3. **Impact of compromise:** disclosure, forgery, impersonation, loss of integrity, or loss of trust in historical evidence.
4. **Impact of loss:** recoverable outage, permanent loss of encrypted data, inability to verify old signatures, or failure of a trust hierarchy.
5. **Exposure and lifetime:** how long the key is active, where plaintext key material may exist, and how much material depends on it.

The classification is a local policy decision, not a NIST-defined universal tiering scheme. It should produce concrete consequences such as required module assurance, approval model, logging, backup eligibility, cryptoperiod, and incident priority.

## Keep one cryptographic purpose per key

[NIST SP 800-57 Part 1 Rev. 5](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final) recommends that a key generally be used for only one purpose. Separating purposes limits cross-protocol interactions and makes compromise impact understandable. Examples include:

- Do not use one asymmetric private key for both signing and decryption.
- Do not use a KEK to encrypt application payloads directly.
- Do not share one tenant's DEK or signing key across unrelated tenants.
- Do not treat a certificate's public-key usage extensions as a substitute for enforcing private-key permissions in the KMS or HSM.

## Reconcile declared inventory with discovered use

A useful inventory is continuously reconciled rather than completed once.

1. Export metadata from KMSs, HSMs, certificate systems, secrets stores, cloud services, and configuration repositories.
2. Discover cryptography in applications, protocols, libraries, firmware, network captures, and data formats.
3. Join records by stable identifiers, certificate fingerprints, key IDs, aliases, endpoints, and ownership data.
4. Flag orphaned keys, unknown owners, stale versions, over-broad purpose, unapproved algorithms, missing logs, and dependencies with no key reference.
5. Require inventory updates as part of provisioning, rotation, incident response, migration, and destruction workflows.

A **cryptographic bill of materials (CBOM)** can be an export or exchange view of this data, but no single schema should be assumed to capture every operational dependency. The authoritative control is the maintained inventory and its reconciliation process.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>A key inventory binds each key and version to purpose, owner, custody, state, and downstream dependencies. A key is not safe to rotate, revoke, migrate, or destroy until both the managed object and everything that relies on it can be identified.</p>
</div>

## Primary references

- **[NIST SP 800-130: A Framework for Designing Cryptographic Key Management Systems](https://csrc.nist.gov/pubs/sp/800/130/final)** — verified that a CKMS manages keys with bound metadata, policies, roles, functions, and system interfaces.
- **[NIST SP 800-57 Part 1 Rev. 5: Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)** — verified key types, usage constraints, inventory management, cryptoperiod, and compromise considerations.
- **[NIST SP 1800-38B Preliminary Draft: Public-Key Application Discovery](https://www.nccoe.nist.gov/sites/default/files/2023-12/pqc-migration-nist-sp-1800-38b-preliminary-draft.pdf)** — verified the role of cryptographic discovery and inventory in risk management and migration; this source remains a preliminary draft.

