---
title: Identity Provisioning, Access Lifecycle & PAM
description: Joiner-mover-leaver access lifecycle, SCIM provisioning, reconciliation, just-in-time access, privileged access management, recovery, and evidence.
permalink: /topics/identity-provisioning-access-lifecycle-pam/
last_verified: 2026-08-13
---

<span class="eyebrow">Authentication & Authorization / Operations</span>

# Identity Provisioning, Access Lifecycle & PAM

<p class="lede">Identity lifecycle management keeps accounts, authenticators, entitlements, sessions, and privileged credentials aligned with a person or workload's current relationship to the organization. Authentication and authorization can be correctly designed yet remain unsafe when transfers, terminations, dormant accounts, emergency grants, or failed provisioning leave stale access behind.</p>

## Joiner, mover, and leaver is a reconciliation loop

| Event | Required outcome | Common residual failure |
|---|---|---|
| **Joiner** | Establish authoritative identity, create only required accounts, bind approved authenticators, and grant least privilege with an owner and reason. | Birthright access is broader than the job or duplicate accounts are linked incorrectly. |
| **Mover** | Recalculate access from the new role/context, add required permissions, and remove incompatible old permissions. | Access accumulates because the process adds but never subtracts. |
| **Leaver** | Disable sign-in, revoke sessions/tokens, remove privileged and federated access, recover assets, transfer ownership, and retain records under policy. | A disabled directory account leaves cloud roles, API keys, SSH keys, local accounts, or active sessions usable. |

The authoritative source may be HR, a contractor system, a workload registry, or another governed system. Identity correlation is security-sensitive: an incorrect join can give one person another person's accounts, while an incorrect split can leave duplicate access paths.

## SCIM standardizes resource management, not governance

SCIM 2.0 defines JSON schemas and an HTTP protocol for managing resources such as `Users` and `Groups` across domains. It supports create, retrieve, replace, patch, delete, bulk, discovery, and versioning behavior. SCIM does not define the organization's approval policy, authoritative source, role model, or the complete meaning of “deactivate.”

Operational controls include:

- authenticate and authorize the provisioning client with narrow tenant and resource scope;
- map schemas explicitly, including case sensitivity, mutability, multi-valued attributes, enterprise extensions, and vendor-specific fields;
- make updates idempotent where possible and use resource versions/ETags to avoid lost updates;
- distinguish account disablement from deletion and define downstream session/token revocation separately;
- protect filters, bulk operations, and error responses from cross-tenant disclosure; and
- reconcile source and target regularly instead of assuming that a successful API response proves durable state.

## JIT access and PAM solve different privileged-access problems

- **Just-in-time (JIT) access** grants an entitlement only when requested and approved, normally with a bounded duration. It reduces standing privilege but still needs eligibility policy, approval integrity, expiration enforcement, and emergency revocation.
- **Privileged Access Management (PAM)** controls elevated accounts or sessions through credential vaulting, brokered access, approvals, session controls, command restrictions, and recording where justified. A vault alone does not remove shared-account attribution or endpoint compromise.
- **Break-glass access** is a separately protected recovery path for identity-provider or control-plane failure. It needs limited scope, strong custody, alerting, post-use rotation, and periodic end-to-end tests.

## Complete lifecycle control loop

1. **Request and approve**: Record subject, entitlement, resource, business reason, owner, approver, start/end time, segregation-of-duties conflicts, and any emergency basis.
2. **Provision**: Create or change the target state through a controlled connector. Do not treat the source-system request as proof of target enforcement.
3. **Verify and observe**: Read back target state, monitor failures and drift, and alert on privileged grants, dormant accounts, unowned accounts, and access outside approved windows.
4. **Review**: Have accountable owners review actual effective access, including nested groups, inherited roles, local accounts, service credentials, and relationships.
5. **Revoke and recover**: Remove entitlement, disable account where appropriate, revoke sessions/tokens/keys, transfer resource ownership, and verify target state.
6. **Retain evidence**: Preserve authoritative event, approval, connector result, target read-back, exceptions, review outcome, and revocation evidence under the applicable retention/privacy policy.

## Failure and recovery tests

Test delayed HR events, duplicate identities, connector outage, partial batch success, target rate limiting, schema change, group nesting, privilege-expiry failure, terminated-user active sessions, orphaned resources, IdP outage, and break-glass use. Define retry and dead-letter handling without allowing an old update to overwrite a newer lifecycle event.

Authentication recovery must not silently become an entitlement-recovery bypass. The authenticator lifecycle and recovery rules in **[Digital Identity Assurance Levels]({{ '/topics/digital-identity-assurance-levels/' | relative_url }})** and **[WebAuthn & Passkeys]({{ '/topics/webauthn-passkeys/' | relative_url }})** remain applicable after an account is provisioned.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Provisioning is not complete when a request is approved or an API returns success. Reconcile authoritative intent with effective target access, remove old access during moves, revoke every credential and session path during departure, and test JIT, PAM, connector failure, and break-glass recovery.</p>
</div>

## Primary references

- **[RFC 7643: SCIM Core Schema](https://www.rfc-editor.org/rfc/rfc7643.html)** — verified user/group resource schema, mutability, uniqueness, and extension semantics.
- **[RFC 7644: SCIM Protocol](https://www.rfc-editor.org/rfc/rfc7644.html)** — verified HTTP operations, authentication/authorization boundary, bulk, versioning, multi-tenancy, and security considerations.
- **[NIST SP 800-53 Rev. 5, AC and IA controls](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)** — verified account-management, privilege, authenticator, review, and termination control objectives in the federal control catalog.
- **[NIST SP 800-63B-4 authenticator event management](https://pages.nist.gov/800-63-4/sp800-63b/events/)** — verified binding, loss, compromise, replacement, and recovery lifecycle requirements.
