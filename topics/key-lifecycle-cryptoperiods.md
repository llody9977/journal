---
title: Key Lifecycle & Cryptoperiods
description: Key states, usage periods, cryptoperiod selection, and the operational gates between generation, activation, deactivation, compromise, and destruction.
permalink: /topics/key-lifecycle-cryptoperiods/
last_verified: 2026-08-13
---

<span class="eyebrow">Key Management / Lifecycle</span>

# Key Lifecycle & Cryptoperiods

<p class="lede">A key lifecycle is a state machine that determines which operations are allowed at each point in time. A cryptoperiod is the authorized time span for a key's use; it is a risk limit, not a promise that the key remains safe until a calendar date.</p>

## State controls matter more than a rotation date

A key can exist without being authorized for normal use. [NIST SP 800-57 Part 1 Rev. 5](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final) groups key management into pre-operational, operational, post-operational, and destroyed phases. [OASIS KMIP v2.1](https://docs.oasis-open.org/kmip/kmip-spec/v2.1/kmip-spec-v2.1.html) provides interoperable managed-object states and transition operations.

| Practical state | Allowed use | Required operational evidence |
|---|---|---|
| **Pre-active** | No normal protection or processing | Generation or import provenance, attributes, owner, policy, and activation approval. |
| **Active** | Apply protection, process protected data, or both as explicitly authorized | Activation time, permitted operations, caller authorization, and usage logs. |
| **Disabled or suspended** | No new use while an operator investigates or tests impact | Reason, approver, affected dependencies, and a time-bound resolution path. This is a local reversible control; terminology varies by system. |
| **Deactivated** | No new protection; limited processing of previously protected data may continue | Deactivation time, retained dependencies, and removal plan. |
| **Compromised** | No new protection; exceptional processing only under documented risk decisions | Compromise and occurrence dates, revocation status, incident owner, and replacement plan. |
| **Destroyed** | No cryptographic use because usable key material is gone | Destruction method, approvals, dependency check, and evidence. Metadata may remain. |

The transition should be enforced by the system, not recorded only in a spreadsheet. A stale application credential, copied private key, cached plaintext DEK, or offline public key can bypass a state change unless the dependency is also controlled.

<div class="diagram-frame">
  <img src="{{ '/assets/img/key-lifecycle-state-model.svg' | relative_url }}" alt="Journal working model for key lifecycle transitions: generated or imported material becomes pre-active, then active; it can move through a reversible disabled state, become deactivated or compromised, remain recoverable only under policy, and finally become destroyed after dependencies are cleared.">
  <p class="diagram-caption">This journal working model separates reversible suspension, normal deactivation, compromise, controlled recovery, and irreversible destruction. Exact state names and permitted transitions vary by KMS, HSM, and protocol.</p>
</div>

## Separate originator and recipient usage periods

The **originator-usage period (OUP)** is the time during which a key may apply protection, such as encrypting data or creating a signature. The **recipient-usage period (RUP)** is the time during which the corresponding key may process protected information, such as decrypting old ciphertext or verifying a signature.

These periods often differ:

- An encryption key version may stop encrypting new data while remaining available to decrypt old data.
- A private signature key should stop creating signatures at the end of its OUP; its public verification key may be retained longer to verify historical signatures.
- An ephemeral session key normally has a short OUP and RUP tied to the session.

This distinction prevents a common failure: destroying an old version immediately after making a new version primary. Rotation changes which key applies new protection; it does not remove old dependencies.

## Select cryptoperiods from risk, not habit

NIST provides suggested periods for specific key types in its federal guidance, while also stating that application and environment can justify shorter or longer periods. A local cryptoperiod decision should document at least:

- key function and algorithm strength;
- amount and sensitivity of protected information;
- exposure of plaintext key material and protection boundary;
- number of users, workloads, copies, regions, and transactions;
- cost and time of replacement, redistribution, or re-encryption;
- threat change, personnel change, provider change, and algorithm transition;
- time for which old protected data still needs processing; and
- consequences of compromise or unrecoverable loss.

A scheduled date is an upper bound under normal conditions. Suspected compromise, policy error, vulnerable implementation, owner change, unauthorized copy, or algorithm withdrawal can end the usage period early.

## Gate every lifecycle transition

| Transition | Gate before change | Validation after change |
|---|---|---|
| Generate/import → pre-active | Approved mechanism, provenance, purpose, owner, and metadata exist | Key cannot yet perform normal operations. |
| Pre-active → active | Consumers are ready and permissions are reviewed | New operations identify the intended version. |
| Active → deactivated | A replacement handles new protection and old dependencies are inventoried | New protection fails on the old version; permitted historical processing still works. |
| Any state → compromised | Incident decision and compromise timing are recorded | New protection stops and alerts, revocation, and replacement workflows run. |
| Deactivated/compromised → destroyed | No required dependency remains, or loss is explicitly accepted | Use fails across every replica, cache, backup, and recovery path; evidence is retained. |

The final validation should state what was tested and what remains uncertain. A successful KMS disable test proves that requests reaching that KMS fail; it does not prove that no copy of the key exists elsewhere.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Lifecycle state controls which operation a key may perform now; the cryptoperiod limits how long that authorization lasts. Stop new protection before removing the ability to process old data, and validate every state transition against real dependencies.</p>
</div>

## Primary references

- **[NIST SP 800-57 Part 1 Rev. 5: Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)** — verified key-management phases, states, key-type usage periods, cryptoperiod factors, compromise handling, and destruction concepts.
- **[OASIS KMIP v2.1](https://docs.oasis-open.org/kmip/kmip-spec/v2.1/kmip-spec-v2.1.html)** — verified interoperable managed-object states, transition operations, and compromise metadata.
- **[NIST SP 800-130: A Framework for Designing Cryptographic Key Management Systems](https://csrc.nist.gov/pubs/sp/800/130/final)** — verified that lifecycle functions, metadata, policies, and access controls belong in the CKMS design.
