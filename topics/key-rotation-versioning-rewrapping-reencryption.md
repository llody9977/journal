---
title: Rotation, Versioning, Rewrapping & Re-encryption
description: How key versions change, why rotation does not rewrite existing ciphertext, and when to rewrap data keys or re-encrypt bulk data.
permalink: /topics/key-rotation-versioning-rewrapping-reencryption/
last_verified: 2026-08-10
---

<span class="eyebrow">Key Management / Rotation</span>

# Rotation, Versioning, Rewrapping & Re-encryption

<p class="lede">Rotation changes the key material used for new protection. It normally does not rewrite existing ciphertext, remove old dependencies, or repair a compromise by itself. Safe rotation requires explicit version references, retained read paths, and a separate decision about rewrapping or re-encrypting old data.</p>

## Rotation changes the write path first

A logical key can have multiple material versions. An alias or stable resource name can direct new encryption or signing requests to the current version, while ciphertext metadata identifies the version needed for later decryption or verification.

This behavior is explicit in major managed KMSs:

- [AWS KMS rotation](https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html) retains previous key material and selects the correct material for decryption.
- [Google Cloud KMS rotation](https://docs.cloud.google.com/kms/docs/key-rotation) creates a new primary version but does not re-encrypt data or disable or destroy previous versions.

The provider behavior supports continuity, but it can hide old-version dependency. Inventory and usage telemetry are still needed before an old version can be disabled or destroyed.

## Scheduled and event-driven rotation solve different problems

| Trigger | Purpose | Required follow-through |
|---|---|---|
| **Scheduled cryptoperiod end** | Limit exposure and meet local or external policy | Activate the new version, move new protection, observe old-version use, then retire dependencies. |
| **Personnel, ownership, or environment change** | Remove access paths or change custody | Review principals and copies; rotation alone does not revoke an unauthorized copy. |
| **Algorithm or parameter transition** | Move to a different cryptographic construction | Test formats, APIs, hardware, certificates, protocols, and interoperability. |
| **Suspected or confirmed compromise** | Stop trusting the old material | Disable or revoke new protective use immediately, determine compromise timing, replace independent material, and remediate affected data or signatures. |

Automatic rotation is useful for predictable version creation. It is not a complete incident-response mechanism because the old material may remain enabled and provider rotation may preserve the same logical policy boundary.

## Distinguish rewrapping from re-encryption

| Operation | What changes | Plaintext bulk data exposed? | Typical use |
|---|---|---|---|
| **Rotate KEK version** | New DEKs are wrapped by the new KEK version | No | Change the write path while retaining old KEK versions for existing encrypted DEKs. |
| **Rewrap encrypted DEK** | Existing DEK is unwrapped and wrapped under a new KEK; payload ciphertext stays unchanged | Not necessarily; the DEK is exposed inside an authorized cryptographic boundary or process | Remove dependency on an old KEK without processing the entire payload. |
| **Rotate DEK** | New payloads use a new DEK | No change to existing payloads | Limit per-key data volume or scope. |
| **Re-encrypt bulk data** | Plaintext is recovered and encrypted under a new DEK | Yes, within the re-encryption path | Remove dependency on a compromised DEK, change content algorithm or AAD, or meet a data-migration requirement. |

Rewrapping is sufficient only when the DEK and payload construction remain trusted. If the DEK may be compromised, wrapping the same DEK under a new KEK does not restore confidentiality.

## Version every dependency explicitly

An encrypted envelope should carry or resolve all information needed to select the right primitive and key:

- stable key identifier and material version;
- content-encryption and key-wrapping algorithm identifiers;
- nonce or initialization vector and authentication tag;
- encrypted DEK;
- authenticated context or a stable reference to it; and
- format version for migration logic.

Aliases are useful for the write path but dangerous as the only stored reference. If an alias is repointed, old ciphertext still needs to resolve the exact version that protected it. The same rule applies to public keys and certificates: consumers need the correct historical verification key, not merely today's alias.

## Use a staged retirement workflow

1. Create or generate independent replacement material.
2. Validate permissions, replication, quotas, latency, and disaster recovery before activation.
3. Make the new version primary for new protective operations.
4. Measure old-version decrypt, unwrap, verify, and direct-use requests by workload.
5. Rewrap or re-encrypt dependencies according to the threat and retirement objective.
6. Disable the old version and observe failures for a defined test window.
7. Restore if an unknown dependency appears; otherwise complete the approved destruction workflow.

The disable test is intentionally reversible. A zero-error observation window reduces risk but does not prove that dormant archives, offline clients, or disaster-recovery copies have no dependency.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Rotation changes which key protects new material; old ciphertext still depends on old versions until it is rewrapped or re-encrypted. Rewrap when the DEK remains trusted, re-encrypt when the DEK or content construction has to change, and do not destroy a version based only on its age.</p>
</div>

## Primary references

- **[NIST SP 800-57 Part 1 Rev. 5: Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)** — verified cryptoperiods, replacement, compromise response, usage periods, and key-wrapping concepts.
- **[AWS KMS: Rotate keys](https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html)** — verified that new key material handles new encryption while retained prior material handles earlier ciphertext.
- **[AWS KMS: Rotate keys manually](https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys-manually.html)** — verified the need to keep the original key enabled for data encrypted under it.
- **[Google Cloud KMS: Key rotation](https://docs.cloud.google.com/kms/docs/key-rotation)** — verified that rotation creates a new version without re-encrypting data or disabling previous versions.
- **[NIST SP 800-38F: Methods for Key Wrapping](https://csrc.nist.gov/pubs/sp/800/38/f/final)** — verified the approved key-wrapping boundary used in rewrapping designs.
