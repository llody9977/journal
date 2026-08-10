---
title: Cryptographic Agility & PQC Operations
description: Operational practices for discovering cryptographic dependencies, changing algorithm policy, migrating to post-quantum cryptography, rehearsing coexistence, and controlling rollback.
permalink: /topics/cryptographic-agility-pqc-operations/
last_verified: 2026-08-10
---

<span class="eyebrow">Key Management / Transition</span>

# Cryptographic Agility & PQC Operations

<p class="lede">Cryptographic agility is the ability to replace or adapt cryptography across protocols, applications, hardware, firmware, and infrastructure while preserving security and operations. It is an inventory, architecture, deployment, and recovery capability—not a runtime switch that accepts any algorithm.</p>

## Agility starts with dependency discovery

[NIST CSWP 39upd1](https://csrc.nist.gov/pubs/cswp/39/upd1/considerations-for-achieving-crypto-agility/final), updated June 29, 2026, defines crypto agility in terms of replacing and adapting algorithms while preserving security and ongoing operations. The prerequisite is a maintained view of:

- applications, protocols, libraries, firmware, hardware, and provider services that perform cryptography;
- algorithms, modes, parameter sets, certificates, key types, and data formats in use;
- keys, versions, owners, data sensitivity, secrecy lifetime, and dependency scope;
- hard-coded identifiers, negotiation rules, pins, trust stores, and provider defaults;
- performance, message-size, storage, network, and device constraints; and
- external parties and vendors needed for a coordinated transition.

The [key inventory]({{ '/topics/key-inventory-classification-ownership/' | relative_url }}) identifies managed keys; the agility inventory extends to cryptography embedded outside the KMS.

## Put algorithm choice behind policy, not arbitrary input

An agile design centralizes approved suites and transition state while preventing callers or attackers from selecting weak algorithms.

- Use versioned envelope, certificate, signature, and protocol formats with explicit algorithm identifiers.
- Bind identifiers and negotiation results to authentication so an attacker cannot downgrade them.
- Keep a narrow allowlist that distinguishes create/protect operations from legacy read/verify operations.
- Isolate provider-specific APIs behind tested service boundaries where that does not hide security-relevant behavior.
- Preserve exact historical parameters needed to decrypt or verify old material.
- Fail closed on unknown algorithms and formats; do not guess from key length or ciphertext shape.

Agility means controlled change. Supporting more algorithms at once also increases code, configuration, and attack surface.

## Treat post-quantum migration as a system migration

The algorithms and standards are covered in [Post-Quantum Cryptography]({{ '/topics/post-quantum-cryptography/' | relative_url }}). Key management also has to handle the operational differences:

| Area | PQC migration question |
|---|---|
| Key generation | Do approved libraries, modules, HSMs, and entropy paths support the selected parameter set? |
| Interfaces | Can KMS, HSM, PKCS #11, certificate, and protocol APIs represent the new key and operation? |
| Size | Do certificates, handshakes, signatures, databases, queues, MTUs, proxies, logs, and caches accept larger artifacts? |
| Performance | Can endpoints and central services meet latency, throughput, memory, and energy targets under load? |
| Lifecycle | Can inventory, rotation, revocation, recovery, archival verification, and destruction distinguish classical and PQC versions? |
| Interoperability | Which clients, partners, devices, and trust anchors can operate during coexistence? |

NIST standardized ML-KEM, ML-DSA, and SLH-DSA in [FIPS 203](https://csrc.nist.gov/pubs/fips/203/final), [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final), and [FIPS 205](https://csrc.nist.gov/pubs/fips/205/final). NIST currently lists potential errata for FIPS 203 and FIPS 204, so implementations should check the current publication pages and errata. A standard's publication does not prove that a particular protocol profile, product, validation, or deployment is ready.

## Use coexistence and hybrid designs only with a defined construction

A transition may use parallel certificates, dual signatures, classical and PQC key establishment, or a protocol-defined hybrid combiner. “Use both” is not a complete design. Specify:

- whether success requires both components or either one;
- how shared secrets or authentication results are combined and context-bound;
- how downgrade and stripping attacks are detected;
- how failures are logged without silently falling back;
- how algorithm identifiers and public keys are authenticated; and
- when the classical component can be removed.

Hybrid security depends on the complete protocol and combiner. It should not be claimed merely because two algorithms appear in a handshake.

## Migrate in measured, reversible stages

1. **Discover:** reconcile cryptographic dependencies and data secrecy lifetimes.
2. **Prioritize:** rank systems by risk, exposure, replacement lead time, and interoperability constraints.
3. **Prepare:** update policies, formats, interfaces, inventories, test vectors, capacity, and vendor commitments.
4. **Pilot:** deploy to a bounded population with telemetry for negotiation, failure, performance, and compatibility.
5. **Coexist:** make the new suite preferred for new protection while preserving a deliberately constrained old-data path.
6. **Migrate:** rotate keys and certificates, rewrap or re-encrypt data where needed, and update external trust relationships.
7. **Retire:** disable old protective use, observe, then remove algorithms, keys, code paths, and exceptions when dependencies are cleared.

Rollback should restore a known-good configuration without creating new weakly protected data. Define the rollback window, allowed legacy operations, data written during the pilot, and the condition that stops the rollout.

## Prove the transition at the boundaries

Test more than algorithm correctness:

- known-answer and negative cryptographic tests;
- certificate, protocol, and message-format interoperability;
- malformed, unknown, and downgrade inputs;
- HSM/KMS failover, quotas, latency, and recovery;
- mixed-version clients and historical decrypt or verify paths;
- inventory accuracy before and after migration; and
- disablement of the old protective path.

A successful laboratory handshake proves interoperability for those versions and parameters. It does not prove production capacity, ecosystem support, downgrade resistance in every path, or complete migration of stored data.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Crypto agility is controlled replacement backed by inventory, versioned formats, policy, testing, telemetry, and rollback. PQC migration changes keys, protocols, hardware, data formats, capacity, and trust relationships together; algorithm support alone is not readiness.</p>
</div>

## Primary references

- **[NIST CSWP 39upd1: Considerations for Achieving Crypto Agility](https://csrc.nist.gov/pubs/cswp/39/upd1/considerations-for-achieving-crypto-agility/final)** — verified the current NIST definition, strategies, practices, challenges, and June 2026 update status.
- **[NIST NCCoE Migration to Post-Quantum Cryptography](https://www.nccoe.nist.gov/applied-cryptography/migration-to-pqc)** — verified the operational need for discovery, planning, interoperability, and performance evaluation.
- **[NIST FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism Standard](https://csrc.nist.gov/pubs/fips/203/final)** — verified the final ML-KEM standard and the current potential-errata notice.
- **[NIST FIPS 204: Module-Lattice-Based Digital Signature Standard](https://csrc.nist.gov/pubs/fips/204/final)** — verified the final ML-DSA standard and the current potential-errata notice.
- **[NIST FIPS 205: Stateless Hash-Based Digital Signature Standard](https://csrc.nist.gov/pubs/fips/205/final)** — verified the final SLH-DSA standard.
