---
title: Backup, Escrow, Recovery, Availability & Destruction
description: How key purpose changes backup eligibility, how to design recoverable key services, and how to retire key material without accidental data loss.
permalink: /topics/key-backup-recovery-destruction/
last_verified: 2026-08-10
---

<span class="eyebrow">Key Management / Resilience</span>

# Backup, Escrow, Recovery, Availability & Destruction

<p class="lede">Key recovery preserves access when key material or a service becomes unavailable; key destruction intentionally removes that access. The same control cannot optimize both outcomes, so backup eligibility should follow key purpose and destruction should follow dependency evidence.</p>

## Recoverability is a key-type decision

A missing decryption key can make data permanently unreadable. A recovered signing key can allow new signatures to be created under an old identity, weakening the evidentiary meaning of sole control. [NIST SP 800-57 Part 1 Rev. 5](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final) therefore treats recovery case by case rather than declaring every key recoverable.

| Key type | Practical starting rule | Reason and boundary |
|---|---|---|
| **Data-decryption key or KEK** | Provide protected recovery when data must outlive the primary service or copy | Loss can permanently deny access to dependent ciphertext. Recovery protection must match the key's value. |
| **Private signature key** | Do not normally archive; justify exceptional backup explicitly | Recovery can undermine sole-control assumptions. NIST notes limited exceptions, such as cases where timely CA-key replacement is not feasible. |
| **Public verification key or certificate** | Retain as long as historical verification is required | It is public material, but integrity and association with identity remain important. |
| **Ephemeral session key** | Do not back up | Recovery defeats ephemerality and normally provides no business value. |
| **Authentication or MAC key** | Decide from whether historical verification or service continuity is required | Shared-key recovery also recreates impersonation capability. |
| **Root, domain, or recovery key** | Use highly controlled offline or quorum-based recovery if the architecture requires it | It can unlock or reconstruct many subordinate keys, so compromise has exceptional blast radius. |

This table is a practical default, not a universal mandate. Legal, evidentiary, safety, availability, and retention requirements can change the decision.

## Distinguish backup, archive, and escrow

- A **backup** supports restoration during the key's normal operational lifetime.
- An **archive** retains key material or related information for post-operational processing, investigation, or verification.
- **Key escrow** places recoverable key material or components with an authorized third party or role under defined release conditions.

Each copy expands the attack surface. Record who can request recovery, who approves it, how identity and authority are verified, where reconstruction occurs, how the recovered key is constrained, and what evidence is produced.

## Design for service availability as well as material recovery

Key bytes in a vault do not make a KMS available. The service also depends on metadata, policy, identity, DNS and networking, quotas, regions, HSM quorum, software and firmware compatibility, audit, and trained operators.

A resilience design should address:

- regional or site failure and the consistency model for replicas;
- dependency on provider identity and control planes;
- offline or isolated recovery for the highest-level keys;
- restoration of key metadata, aliases, policies, grants, and version state;
- client retry, timeout, circuit-breaker, and safe caching behavior;
- recovery-point and recovery-time objectives defined by the application owner; and
- failure modes when the KMS is reachable but a required version is disabled or missing.

Run restore exercises that perform a real cryptographic operation on test data. A successful backup job proves that an artifact was produced, not that the key, metadata, permissions, and application can be restored together.

## Make destruction staged and observable

Permanent deletion is an availability event. Managed KMSs commonly provide a reversible phase because dependency discovery is imperfect. For example, [AWS KMS](https://docs.aws.amazon.com/kms/latest/developerguide/deleting-keys.html) recommends disabling a key when continued need is uncertain, and [Google Cloud KMS](https://docs.cloud.google.com/kms/docs/destroy-restore) requires destruction to be scheduled and warns that usage tracking can be delayed or incomplete.

A practical retirement sequence is:

1. Stop new protection with the version.
2. Inventory ciphertext, encrypted DEKs, certificates, backups, replicas, offline clients, and recovery copies.
3. Migrate required dependencies.
4. Disable the key and observe application, audit, and recovery behavior through a representative period.
5. Obtain approvals from the key owner and data owner.
6. Schedule destruction and monitor the recovery window.
7. Confirm deletion across replicas and backup paths, then retain non-secret metadata and evidence according to policy.

**Crypto-shredding** makes data irrecoverable by destroying the only usable copies of its encryption key. It succeeds only if encryption covered every relevant copy, no plaintext or alternative key remains, backups and caches are included, and the encryption construction was correctly implemented. Key deletion alone does not prove those conditions.

## Preserve destruction evidence without preserving the secret

Evidence can include stable key and version identifiers, owner and approvers, dependency query results, last-use observations, disablement test results, scheduled and completed timestamps, provider or HSM audit events, affected replicas and backups, exceptions, and the method used. Never place the destroyed key value in the evidence record.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Back up keys only when their purpose requires recovery, and protect every recovery path as strongly as the primary key. Before destruction, prove that required dependencies have moved, test disablement reversibly, and treat crypto-shredding as a claim that needs system-wide evidence.</p>
</div>

## Primary references

- **[NIST SP 800-57 Part 1 Rev. 5: Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)** — verified backup, archive, recovery, key-type differences, compromise handling, and destruction guidance.
- **[NIST SP 800-130: A Framework for Designing Cryptographic Key Management Systems](https://csrc.nist.gov/pubs/sp/800/130/final)** — verified disaster recovery, continuity, key metadata, roles, and CKMS design scope.
- **[AWS KMS: Delete an AWS KMS key](https://docs.aws.amazon.com/kms/latest/developerguide/deleting-keys.html)** — verified irreversibility, the value of disablement before deletion, and the provider's ciphertext-visibility limitation.
- **[Google Cloud KMS: Destroy and restore key versions](https://docs.cloud.google.com/kms/docs/destroy-restore)** — verified scheduled destruction, restore windows, usage-check limitations, and permanent data-loss risk.
