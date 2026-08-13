---
title: KMS Architecture & Interoperability
description: How to choose among application cryptography, managed KMS, managed HSM, dedicated HSM, and external KMS while accounting for trust, availability, and portability.
permalink: /topics/kms-architecture-interoperability/
last_verified: 2026-08-13
---

<span class="eyebrow">Key Management / Architecture</span>

# KMS Architecture & Interoperability

<p class="lede">A KMS architecture decides where plaintext key material may exist, which system authorizes each operation, and which dependencies need to remain available. The strongest module is not automatically the best system if identity, policy, network, quota, recovery, or portability failures are ignored.</p>

## Choose a boundary before choosing a product

The first question is not “HSM or KMS?” An HSM can be a component inside several KMS models. The useful comparison is the complete operational boundary.

| Architecture | Key-operation boundary | Customer responsibility | Main trade-off |
|---|---|---|---|
| **Application cryptography with software-held keys** | Application process or local software module | Generation, storage, permissions, memory handling, rotation, backup, and audit | Lowest call latency but widest application exposure and highest operational burden. |
| **Managed KMS** | Provider API backed by provider-controlled cryptographic modules | Key policy, workload authorization, lifecycle decisions, application envelope handling, dependency inventory | Strong integration and lower operations burden; provider control plane, quotas, formats, and availability become dependencies. |
| **Managed HSM or dedicated KMS partition** | Customer-controlled logical or physical partition in provider-operated infrastructure | HSM roles, clients, clusters, backup, availability, and often more key policy | More interface and custody control with substantially more operational responsibility. |
| **Customer-operated HSM/KMS** | Customer facility or infrastructure | Full service, facility, module, identity, network, backup, patch, capacity, and incident operation | Maximum direct control with high expertise and resilience cost. |
| **External KMS or HYOK** | Cloud service depends on a customer-controlled external authorization or cryptographic path | External service availability, secure connectivity, policy, capacity, failover, and emergency access | Stronger control separation but added latency and correlated outage risk. |

These categories are a working model. Provider services use different names and may combine boundaries; verify the actual data path, administrative path, and contract.

## Map every trust boundary and failure dependency

A complete data-flow review should identify:

- where keys are generated, stored, backed up, cached, and destroyed;
- whether plaintext DEKs return to the workload and how long they remain there;
- which identities can use keys and which can change authorization;
- whether provider personnel or service software have a supported path to operations;
- where metadata, policy, aliases, audit logs, and replicas reside;
- which networks, regions, identity providers, DNS, time sources, and control planes are required; and
- what fails open, fails closed, retries, or uses cached material during an outage.

The shared-responsibility boundary should be recorded per function. “Keys are in an HSM” answers only one part of the system design.

## Treat availability and capacity as security properties

Remote cryptographic services add round trips, quotas, throttling, and control-plane consistency. Model normal and degraded behavior:

- peak encrypt, decrypt, sign, verify, data-key, and administrative request rates;
- per-region quotas and time to obtain a quota increase;
- p50, p95, and p99 latency targets measured from each workload location;
- replica consistency and failover semantics;
- client retry and idempotency behavior;
- cache scope and maximum exposure if a plaintext DEK cache is compromised; and
- effect of identity, KMS, HSM quorum, network, or audit failure.

Do not respond to an unavailable KMS by silently switching to plaintext storage or an unapproved local key. The application should have an explicit failure mode and recovery objective.

## Separate interface interoperability from key portability

| Mechanism | What it standardizes | What it does not solve |
|---|---|---|
| **PKCS #11** | A programming interface for cryptographic tokens and key objects | Cloud policy models, lifecycle orchestration, identical mechanism support, or application portability without testing. |
| **KMIP** | Protocol operations, managed objects, attributes, states, and messages for key-management interoperability | Identical vendor extensions, policy semantics, performance, custody, or export permission. |
| **Provider KMS API or SDK** | Native service operations and resource model | Cross-provider portability. |
| **Application envelope format** | The application's ciphertext, algorithm, context, and wrapped-DEK metadata | Ability to export a non-extractable KEK or reproduce provider authorization semantics. |

A portable API does not make key material portable. A non-extractable key may require rewrapping or re-encryption under a new destination key. Conversely, exportable key material does not preserve aliases, grants, audit history, quotas, or trust relationships.

## Design an exit path before activation

For each high-value key, document:

1. whether key material can be exported, replicated, re-imported, or only used through the current service;
2. how encrypted DEKs or bulk ciphertext will move if it cannot;
3. how applications identify algorithms and key versions independently of provider-specific ciphertext formats;
4. how historical decrypt and verify operations work during coexistence;
5. how policy and workload identity map to the destination;
6. what throughput and time the migration requires; and
7. how rollback avoids creating new data under two ambiguous write paths.

Run a small migration rehearsal. Documentation that an API supports import or re-encryption proves capability exists, not that the organization's formats, policies, volumes, and outage constraints will work.

## Maintain a portability registry beside the key inventory

An exit plan needs enough detail to reconstruct the full protection and authorization path. The following is a journal working model rather than a standardized schema:

| Registry field | Example content | Migration decision supported |
|---|---|---|
| Envelope and schema version | `customer-record/v3` | Selects the parser and authenticated metadata rules. |
| Logical key and material reference | Provider resource, alias, explicit version, or opaque-rotation model | Determines whether historical material is application-visible or provider-resolved. |
| Cryptographic formats | Provider ciphertext blob, raw wrapped DEK, PKCS #8, JWK, PEM, certificate profile | Shows which objects can be parsed, exported, or must be transformed. |
| Algorithms and parameters | Content AEAD, wrapping mechanism, nonce rules, signature or KEM parameters | Prevents migration code from guessing from key length or ciphertext shape. |
| Authenticated context | Canonical fields, serialization, encoding, and stability rules | Preserves tag verification and identifies metadata that can or cannot change during rewrapping. |
| Policy translation | Source grants, conditions, workload identities, destination roles | Exposes authorization semantics that an API adapter cannot preserve automatically. |
| Migration ownership | Application owner, key custodian, data owner, rollback approver | Assigns decisions for outage, unknown dependencies, and irreversible retirement. |
| Capacity and recovery | Volume, rate, regional path, retry behavior, checkpoints, recovery objectives | Estimates migration time and makes interruption and restart behavior testable. |

Serialization alone is not portability. A valid PKCS #8 or JWK object may still be unusable because the source key is non-extractable, the destination lacks the mechanism, the envelope depends on provider-specific metadata, or policy and identity semantics cannot be reproduced.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Select a KMS architecture by tracing plaintext-key exposure, authorization, and failure dependencies end to end. Interface standards help systems communicate, but portability also requires movable ciphertext, metadata, policy, identity, capacity, and a rehearsed exit path.</p>
</div>

## Primary references

- **[NIST SP 800-130: A Framework for Designing Cryptographic Key Management Systems](https://csrc.nist.gov/pubs/sp/800/130/final)** — verified CKMS architecture topics including policy, interfaces, access control, metadata, interoperability, continuity, and transitions.
- **[NIST FIPS 140-3: Security Requirements for Cryptographic Modules](https://csrc.nist.gov/pubs/fips/140-3/final)** — verified the assurance boundary for cryptographic modules.
- **[OASIS PKCS #11 v3.1](https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.1/os/pkcs11-spec-v3.1-os.html)** — verified the token programming-interface and object-attribute boundary.
- **[OASIS KMIP v2.1](https://docs.oasis-open.org/kmip/kmip-spec/v2.1/kmip-spec-v2.1.html)** — verified interoperable operations, managed objects, states, and attributes.
