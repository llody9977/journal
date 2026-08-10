---
title: Authorization, Administration & Audit
description: Least-privilege authorization, separation of duties, workload identity, break-glass control, and audit evidence for cryptographic key management.
permalink: /topics/key-authorization-administration-audit/
last_verified: 2026-08-10
---

<span class="eyebrow">Key Management / Access Control</span>

# Authorization, Administration & Audit

<p class="lede">Key security depends on who can change policy as much as who can call encrypt or sign. Separate administrative authority from cryptographic use, give workloads only the operations and keys they need, and preserve evidence that administrators cannot silently rewrite.</p>

## Separate control-plane and cryptographic permissions

A KMS exposes at least two classes of power:

- **Control-plane permissions** create keys, change policies, add grants, import material, schedule deletion, change rotation, and manage replicas.
- **Cryptographic-operation permissions** encrypt, decrypt, sign, verify, generate data keys, wrap, unwrap, derive, or establish keys.

An identity that cannot decrypt data may still gain equivalent power by changing the policy to grant itself decrypt. Least privilege therefore has to account for indirect escalation paths.

| Role | Typical allowed actions | Actions to separate |
|---|---|---|
| **Key-policy administrator** | Manage metadata, approved grants, rotation settings, and state transitions | Routine decrypt/sign operations; unilateral destructive actions. |
| **Key custodian or HSM operator** | Operate the protection boundary, quorum procedures, backup, and recovery | Application-data access and business approval. |
| **Workload identity** | Use named keys for narrowly specified cryptographic operations | Policy edits, key export, grant creation, broad enumeration, and deletion. |
| **Security auditor** | Read configuration, usage, change, approval, and incident evidence | Key use and policy mutation. |
| **Recovery operator** | Execute a tested, approved restore path | Routine production use and sole approval of recovery. |

This matrix is a journal working model, not a universal standard. Smaller environments may combine roles, but the resulting concentration of authority should be explicit and mitigated.

## Authorize the operation, key, and context

[NIST SP 800-130](https://csrc.nist.gov/pubs/sp/800/130/final) requires a CKMS design to specify how authorized entities access each key-management function. A useful policy decision includes:

- authenticated person, workload, device, or service identity;
- exact key, version, tenant, environment, and region;
- permitted operation and algorithm parameters;
- calling service, network, attestation, or resource context where supported;
- time, approval, or change-ticket conditions for exceptional operations; and
- explicit denial of export, policy mutation, deletion, and cross-tenant access unless required.

Prefer short-lived workload identity issued by the platform over long-lived API credentials stored in configuration. A workload identity should not share a broad human administrator role.

## Use separation of duties and dual control where impact justifies them

**Separation of duties** divides conflicting responsibilities across roles. **Dual control** requires two authorized entities to complete a particular action. They are related but not identical.

High-impact candidates include root-key ceremonies, import of external key material, changes to organization-wide key policy, recovery of archived key material, and permanent destruction. Dual approval is only meaningful if one participant cannot bypass it through another path, disable the audit trail, or assume both identities.

## Treat break-glass access as a controlled incident

Emergency access should be usable under pressure without becoming a standing bypass:

1. Keep the emergency identity separate from daily administration.
2. Require strong phishing-resistant authentication and, where supported, two-person activation.
3. Grant time-bound, task-bound access rather than permanent wildcard permission.
4. Generate immediate independent alerts to security and service owners.
5. Record the reason, approvers, commands or API actions, keys affected, and session end.
6. Revoke the grant, rotate any exposed credentials, and conduct a post-use review.

If the emergency path has never been exercised, availability is an assumption. Test it with non-production keys and a controlled production readiness exercise.

## Make audit records useful and difficult to alter

At minimum, key-management audit records should answer:

- who or what requested the action;
- which key and version were targeted;
- what administrative or cryptographic operation was attempted;
- when and from where it occurred;
- whether it succeeded or failed and why;
- which policy, grant, approval, or exceptional path authorized it; and
- which state or configuration changed.

Log creation, import, activation, grant and policy changes, failed access, decrypt and sign use where volume permits, rotation, disablement, recovery, export attempts, replica changes, and deletion scheduling or cancellation. Do not log plaintext keys, plaintext DEKs, sensitive payloads, or unredacted secrets.

Export logs promptly to a separately administered repository with integrity protection, retention, time synchronization, access control, and alerts. A KMS operator who can alter both key policy and the only audit copy can conceal misuse.

## Validate authorization from both directions

Positive tests show that the intended workload can perform its required operation. Negative tests are equally important:

- another tenant cannot use the key;
- a decrypt-only workload cannot encrypt or change policy;
- an administrator cannot perform cryptographic operations merely because it can view metadata;
- a disabled or revoked grant fails after propagation;
- denied requests and policy changes reach the independent audit store; and
- break-glass use expires and alerts as designed.

A denied API request proves the tested path is denied at that time. It does not prove that the identity has no alternate role, copied key, cached DEK, or provider-specific escalation route.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Review every route to key power, including policy mutation and recovery, not only decrypt or sign calls. Separate administration from use, scope workload identities to exact operations and keys, and send audit evidence beyond the administrators it records.</p>
</div>

## Primary references

- **[NIST SP 800-130: A Framework for Designing Cryptographic Key Management Systems](https://csrc.nist.gov/pubs/sp/800/130/final)** — verified CKMS access-control, entity, function, role, policy, audit, and design-documentation requirements.
- **[NIST SP 800-57 Part 1 Rev. 5: Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)** — verified key-management roles, accountability, split knowledge, usage, and compromise considerations.
- **[NIST SP 800-53 Rev. 5: Security and Privacy Controls](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)** — verified least privilege, separation of duties, event logging, audit protection, and contingency-control foundations; control selection remains organization-specific.

