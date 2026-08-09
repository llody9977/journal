---
title: Identity & Access Fundamentals
description: Fundamentals of identity assurance (IAL/AAL/FAL), access control models (RBAC, ABAC, ReBAC), authentication vs authorization failure modes, and core IAM design principles, with links to the deep-dive pages for assurance-level matrices and authorization models.
permalink: /topics/identity-access-fundamentals/
last_verified: 2026-08-09
---

<span class="eyebrow">Security Foundations / Concepts</span>

# Identity & Access Fundamentals

<p class="lede">Identity and Access Management (IAM) governs the continuous engineering lifecycle of binding real-world entities to digital subjects, verifying authenticators, asserting federated tokens, evaluating dynamic authorization policies, and enforcing automated lifecycle revocation. Securing identity boundaries requires separating authentication proofing from authorization evaluation while eliminating implicit trust perimeters.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/identity-access-architecture.svg' | relative_url }}" alt="Identity and Access Management Architecture diagram showing Setup (IAL, AAL, FAL), Zero Trust Runtime Enforcement (PEP/PDP), and Automated Lifecycle Revocation (NIST SP 800-63 & NIST SP 800-207).">
  <p class="diagram-caption">Identity &amp; Access Management Architecture: Setup &amp; Enrollment (IAL/AAL/FAL) → Zero Trust Policy Enforcement (PEP/PDP) → Automated Revocation &amp; SIEM Audit (NIST SP 800-63-4 / SP 800-207)</p>
</div>

## Digital Identity Assurance in Brief (NIST SP 800-63-4)

The **NIST SP 800-63** Digital Identity Guidelines decompose identity architecture into three independent assurance dimensions:

- **Identity Assurance Level (IAL)**: how confident enrollment is that the applicant is who they claim to be (self-asserted → remotely verified → in-person/supervised verified).
- **Authenticator Assurance Level (AAL)**: how confident a login is that the same subject is returning (single factor → multi-factor → hardware-bound cryptographic key).
- **Federation Assurance Level (FAL)**: how strongly a relying party can trust an identity assertion forwarded by an identity provider (bearer → injection-protected bearer → holder-of-key).

These three dimensions are chosen independently for a given system and none substitutes for the other two. The full assurance-level tables, the authenticator-to-AAL mapping (including where email magic links, SMS OTP, TOTP, and passkeys actually land), and step-up authentication mechanics live in **[Digital Identity Assurance Levels]({{ '/topics/digital-identity-assurance-levels/' | relative_url }})** and **[Step-Up Authentication & MFA]({{ '/topics/step-up-authentication/' | relative_url }})**.

## Access Control Models in Brief

Evaluating permissions across cloud microservices, databases, and multi-tenant SaaS requires selecting an appropriate access control model based on domain complexity:

- **Role-Based Access Control (RBAC)**: static subject roles mapped to permissions (`User → Role → Permission`). Simple to audit; best fit for coarse, stable organizational roles.
- **Attribute-Based Access Control (ABAC)**: dynamic attributes of subject, resource, action, and environment evaluated at request time via a policy engine (e.g., OPA/Rego). Best fit when access depends on context like time, IP, or device posture.
- **Relationship-Based Access Control (ReBAC)**: access derived from graph relationships (e.g., `is_viewer_of`) rather than flat roles. Best fit for nested ownership and sharing, such as document or folder permissions.
- **Zero Trust (NIST SP 800-207)** is an architectural strategy, not a fourth access-control model—it requires whichever model is chosen (RBAC, ABAC, or ReBAC) to be evaluated explicitly per request rather than trusted implicitly by network location.

The full comparison matrix, trade-offs, and the Zero Trust relationship live in **[Authorization Models: RBAC, ABAC, ReBAC & Zero Trust]({{ '/topics/authorization-models/' | relative_url }})**.

## Authentication vs Authorization Failure Modes Matrix

Confusing authentication proof with authorization permission grants creates critical system vulnerabilities. The matrix below contrasts major failure boundaries, vulnerability root causes, and technical safeguards:

| Vulnerability & Risk Boundary | Vulnerability Root Cause | Real-World Attack Scenario | Correct Engineering Safeguard |
|---|---|---|---|
| **Broken Authentication** | Weak credential validation, missing MFA, or flaw in authenticator binding (**NIST SP 800-63B**). | Attacker executes credential stuffing or SIM-swaps SMS OTP to hijack account access. | Enforce phishing-resistant **WebAuthn / FIDO2 Passkeys**—typically AAL2, or AAL3 only with a non-exportable, hardware-bound key—and eliminate SMS/password-only logins. |
| **Broken Function-Level Authorization (BFLA)** | API gateway fails to restrict administrative endpoints (`POST /api/v1/admin/delete`) to admin roles. | Standard user crafts HTTP request to administrative API routes and executes privileged operations. | Enforce centralized **ABAC / OPA policy checks** at the API Gateway before routing requests to microservices. |
| **Broken Object-Level Authorization (BOLA / IDOR)** | API endpoint validates authentication token but fails to verify if identity owns target object ID. | Authenticated user changes `/api/v1/users/102/invoice` to `/103` and reads another user's invoice. | Enforce object-level resource ownership validation at the Policy Enforcement Point (PEP) on every API request. |
| **Broken Session Security** | Unbound, long-lived, or un-encrypted session tokens returned after authentication. | Attacker steals opaque session cookie or JWT via XSS and replays it from a hostile IP. | Set `HttpOnly`, `Secure`, `SameSite=Strict` cookies; bind OAuth tokens with **DPoP (RFC 9449)** or **mTLS**. |

## Core Access Control Architectural Principles

Implementing secure identity perimeters relies on six recommended IAM design principles:

| Architectural Principle | Target Security Requirement | System Risk Mitigated | Technical Realization |
|---|---|---|---|
| **Automated Lifecycle Revocation** | Enforce immediate access removal when personnel roles change or containers terminate. | Orphaned account access & persistent dormant credentials. | SCIM 2.0 Joiner-Mover-Leaver (JML) integration & automated OAuth token revocation (RFC 7009). |
| **Context-Aware Evaluation** | Incorporate environment signals (*device health, IP, geo-velocity*) into authorization decisions. | Stolen session replay from unauthorized locations/devices. | NIST SP 800-207 Zero Trust Policy Decision Points evaluating risk telemetry. |
| **Default Deny** | Implicitly reject all requests unless an explicit policy rule permits access. | Over-permissive access leaks & un-gated API endpoints. | Configure API gateways and firewall rules to default to `DENY ALL`. |
| **Least Privilege** | Grant minimum permissions necessary for specific tasks, restricted in scope and duration. | Lateral movement during account or service compromise. | Short-lived OAuth access tokens, scoped IAM roles, and Just-In-Time (JIT) access. |
| **Non-Human Workload Identity** | Treat microservices, CI/CD runners, and containers as distinct identities requiring credentials. | Hardcoded API keys & long-lived service account tokens. | SPIFFE/SPIRE workload attestations, short-lived OIDC tokens & Vault secret rotation. |
| **Separation of Duties (SoD)** | Prevent a single identity from possessing end-to-end authority over critical operations. | Fraudulent transaction execution & insider threat abuse. | Dual-custody approval workflows (*e.g., initiator cannot approve wire transfer*). |

## Essential Access Path Diagnostic Checklist

When auditing an identity perimeters, microservice API, or SSO federation flow, evaluate these 6 diagnostic questions against target verification evidence:

| Diagnostic Focus Area | Key Architectural Evaluation Question | Target Verification & Audit Evidence |
|---|---|---|
| **Authenticator Assurance** | What Authenticator Assurance Level (**AAL1, AAL2, AAL3**) is enforced at login? | WebAuthn FIDO2 registration logs & MFA enforcement policy code. |
| **Automated Revocation** | How is access revoked when an employee leaves or a container workload is destroyed? | SCIM 2.0 JML provisioning logs & OAuth RFC 7009 token revocation endpoints. |
| **Least Privilege Audit** | Are wildcard permissions (`*`) or over-permissive administrative default roles present? | Automated IAM policy analyzers (*e.g., AWS IAM Access Analyzer / GCP Policy Intelligence*). |
| **Policy Enforcement Point (PEP)** | Is authorization enforced centrally at an API gateway or decentralized inside microservice sidecars? | API Gateway OPA / Rego policy configs & envoy sidecar filter code. |
| **Session Binding** | Are session tokens bound to client IP, mTLS connection, or cryptographic proof (**DPoP / RFC 9449**)? | DPoP proof-of-possession headers & mTLS client certificate verification logs. |
| **Subject Identification** | Is the requesting subject a human user, federated identity, or automated non-human workload? | SPIFFE/SPIRE ID certificates, OIDC `sub` claim audits & IAM identity inventories. |

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Identity &amp; Access Summary</strong>
    <ul>
      <li><strong>Authentication vs. Authorization</strong>: Authentication verifies identity ("Who are you?"); Authorization determines permissions ("What can you do?").</li>
      <li><strong>Zero Trust Architecture (NIST SP 800-207)</strong>: Never trust, always verify. Enforce explicit authentication and authorization per request regardless of network location.</li>
      <li><strong>Principle of Least Privilege</strong>: Grant entities only the minimum permissions required to perform their explicit function.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-207**: *Zero Trust Architecture* — [NIST CSRC SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)
- **NIST SP 800-63-4**: *Digital Identity Guidelines* — [NIST CSRC SP 800-63-4](https://pages.nist.gov/800-63-4/)
- **RFC 9449**: *OAuth 2.0 Demonstrating Proof of Possession (DPoP)* — [RFC 9449](https://datatracker.ietf.org/doc/html/rfc9449)
- **RFC 7009**: *OAuth 2.0 Token Revocation* — [RFC 7009](https://datatracker.ietf.org/doc/html/rfc7009)
