---
title: Secure Key Generation & Provisioning
description: Entropy, random-bit generators, key provenance, in-boundary generation, BYOK import, wrapping, split knowledge, and key ceremonies.
permalink: /topics/secure-key-generation-provisioning/
last_verified: 2026-08-11
---

<span class="eyebrow">Key Management / Provisioning</span>

# Secure Key Generation & Provisioning

<p class="lede">Key generation creates the unpredictability on which cryptographic security depends; provisioning moves or authorizes the resulting key without losing control of its provenance. Strong algorithms cannot compensate for predictable keys, ambiguous origin, or an exposed import path.</p>

## Generation begins with an approved random-bit source

[NIST SP 800-133 Rev. 2](https://csrc.nist.gov/pubs/sp/800/133/r2/final) covers direct generation from a random-bit generator (RBG), derivation from another key, password-based derivation, and keys established by agreement. For the NIST federal profile, keys are based directly or indirectly on approved RBG output and are generated and used within FIPS 140-validated cryptographic modules.

The security strength of the process is bounded by its weakest input and mechanism:

- An entropy source supplies unpredictable input.
- A deterministic random bit generator (DRBG) expands internal state into pseudorandom output.
- Correct instantiation, reseeding, health testing, and state protection matter as much as the named DRBG algorithm.
- Derived keys inherit risk from the ancestor key, derivation function, context separation, and input handling.
- Password-derived keys remain limited by password entropy and require a password-specific construction rather than being treated as randomly generated keys.

Do not substitute identifiers, timestamps, non-cryptographic (general-purpose) pseudorandom number generators, or user passwords for a cryptographic RBG. This is distinct from a cryptographic pseudorandom function (PRF) — approved KDFs (e.g., [NIST SP 800-108 Rev. 1](https://csrc.nist.gov/pubs/sp/800/108/r1/upd1/final)) are legitimately built on PRFs, provided the PRF is keyed with sufficient entropy in the first place.

## Choose the generation boundary deliberately

| Pattern | Plaintext-key exposure | When it fits | Main proof required |
|---|---|---|---|
| **Generate in the destination HSM/KMS** | Key material need not cross an import boundary | The destination's generator and custody model are acceptable | Exact module, mechanism, attributes, and audit record. |
| **Generate externally and import (BYOK)** | Plaintext exists in the source boundary and is transported in wrapped form | Independent provenance or external backup is required | Source generator, wrapping path, import attestation, and handling of source copies. |
| **Derive inside a controlled service** | Ancestor key remains in the service; derived key exposure depends on API | Many context-separated subkeys are needed | Approved KDF, unique context, purpose binding, and derivation limits. |
| **Establish by key agreement** | Parties derive a shared secret rather than transport the final secret | Protocol endpoints must establish a session key | Authenticated protocol, peer validation, key confirmation where required, and immediate derivation into purpose-specific keys. |

Generation inside an HSM reduces export paths but does not establish the wider application policy. BYOK establishes external origin but does not mean the imported key remains outside the destination service during use. The exact boundary is part of the key's provenance record.

## Provision keys through a protected and bound process

A provisioning record should bind:

- source and destination key identifiers;
- algorithm, length or parameter set, and intended operations;
- source generator and module evidence;
- wrapping or transport mechanism and wrapping-key identifier;
- import time, operator or workload identities, approvals, and result;
- extractability, sensitivity, activation, expiration, and deletion settings; and
- hash, check value, public-key fingerprint, or attestation used to confirm that the intended object arrived without recording the secret value.

Wrapping protects key confidentiality and, depending on the specified mechanism, integrity during transport. The process also needs to prevent substitution: metadata such as purpose, owner, tenant, and permitted operations should be cryptographically bound or independently verified at import.

## Use ceremonies for exceptional trust anchors

A **key ceremony** is a controlled, witnessed procedure for creating or handling a high-impact key such as a certification-authority root or an HSM domain key. It is not required for every application DEK.

A defensible ceremony defines the script, roles, equipment, room controls, approved software and firmware, input media, output artifacts, abort conditions, evidence, and post-ceremony custody. Rehearse with non-production material before the live event.

Two controls are commonly confused:

- **Dual control** requires at least two authorized entities to complete a sensitive action.
- **Split knowledge** divides a key or key components so that one person does not know the complete value.

An M-of-N secret-sharing or component process can implement split knowledge, dual control, or both, depending on the design. Merely requiring two approvals in an access system does not prove that no single component or administrator can reconstruct the key.

## Validate the result without exposing the key

After provisioning:

1. Compare public-key fingerprints, key check values, or attestations as appropriate to the key type.
2. Perform a permitted test operation and verify its result with non-production data.
3. Confirm disallowed operations, export attempts, and pre-activation use fail.
4. Confirm inventory, ownership, policy, logs, backup eligibility, and lifecycle state were created atomically or are reconciled.
5. Destroy temporary plaintext components and source copies only after the required recovery model and evidence are established.

A successful test operation proves that the destination object can perform that operation. It does not prove the absence of an unauthorized source copy or the quality of entropy unless the generation path supplies separate evidence.

NIST published [SP 800-133 Rev. 3 as an Initial Public Draft](https://csrc.nist.gov/pubs/sp/800/133/r3/ipd) on April 17, 2026. It proposes changes for key-pair randomness, seed expansion, key-encapsulation mechanisms, and post-quantum references. Rev. 2 remains the final publication as of this page's verification date; the draft should be tracked, not presented as final guidance.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>A key's assurance starts with its entropy and follows every boundary it crosses. Record generation provenance, bind purpose and policy during provisioning, and validate the destination object without turning verification into another plaintext-key exposure.</p>
</div>

## Primary references

- **[NIST SP 800-133 Rev. 2: Recommendation for Cryptographic Key Generation](https://csrc.nist.gov/pubs/sp/800/133/r2/final)** — verified final NIST guidance for random-based generation, derived and established keys, security strength, and generation boundaries.
- **[NIST SP 800-90A Rev. 1: Recommendation for Random Number Generation Using Deterministic Random Bit Generators](https://csrc.nist.gov/pubs/sp/800/90/a/r1/final)** — verified the approved DRBG constructions referenced by the generation guidance.
- **[NIST SP 800-57 Part 1 Rev. 5: Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)** — verified split knowledge, key components, distribution, and protection requirements.
- **[NIST SP 800-38F: Methods for Key Wrapping](https://csrc.nist.gov/pubs/sp/800/38/f/final)** — verified approved AES key-wrapping methods.
- **[NIST SP 800-133 Rev. 3 Initial Public Draft](https://csrc.nist.gov/pubs/sp/800/133/r3/ipd)** — verified draft status and proposed 2026 changes; it is not used as final normative guidance.
