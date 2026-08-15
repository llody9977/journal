---
title: Identity & Access Fundamentals
description: Fundamentals of identity assurance, identity types, access control models, authentication and authorization failure modes, emergency access, and the complete identity and access lifecycle.
permalink: /topics/identity-access-fundamentals/
last_verified: 2026-08-15
---

<span class="eyebrow">Security Foundations / Concepts</span>

# Identity & Access Fundamentals

<p class="lede">Identity and Access Management (IAM) governs the continuous engineering lifecycle of binding subjects—verified real-world people, but also pseudonymous users, services, workloads, devices, and software agents that are never tied to a verified individual—to digital identities, verifying authenticators, issuing federation assertions or tokens and validating them at relying parties, evaluating dynamic authorization policies, and enforcing automated lifecycle revocation. Securing identity boundaries requires separating authentication proofing from authorization evaluation while removing implicit trust based on network location and enforcing explicit micro-boundaries.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/identity-access-architecture.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the identity and access management architecture diagram at full size">
    <img src="{{ '/assets/img/identity-access-architecture.svg' | relative_url }}" alt="Identity and Access Management Architecture diagram showing independent Setup assurance dimensions (IAL, AAL, FAL), followed by Zero Trust Runtime Enforcement (PEP/PDP), then Automated Lifecycle Revocation and SIEM audit. Stage-level arrows show the operating sequence without implying that IAL, AAL, and FAL are sequential.">
  </a>
  <p class="diagram-caption">Identity &amp; Access Management Architecture: Independent Setup &amp; Enrollment assurance dimensions (IAL/AAL/FAL) → Zero Trust Policy Enforcement (PEP/PDP) → Automated Revocation &amp; SIEM Audit (NIST SP 800-63-4 / SP 800-207). The arrows connect lifecycle stages, not IAL, AAL, and FAL as a sequence.</p>
</div>

## Digital Identity Assurance in Brief (NIST SP 800-63-4)

The **NIST SP 800-63** Digital Identity Guidelines decompose identity architecture into three independent assurance dimensions:

- **Identity Assurance Level (IAL)**: how confident enrollment is that the applicant is who they claim to be under NIST SP 800-63-4 (IAL1 involves basic identity-evidence and attribute validation/verification → IAL2 involves stronger identity evidence and verification → IAL3 requires in-person attended verification (a proofing agent may participate remotely only through a CSP-controlled on-site kiosk or device)). IAL1 and IAL2 may each be delivered through any proofing type—remote or on-site, attended or unattended; only IAL3 is restricted to on-site attended sessions. Accounts with no identity proofing (including self-asserted or pseudonymous accounts) are recorded as **not identity-proofed (unproofed)**, rather than automatically labeled IAL1.
- **Authenticator Assurance Level (AAL)**: how confident a login is that the same subject is returning (single factor → multi-factor → multi-factor public-key authenticator with phishing resistance and a non-exportable private key).
- **Federation Assurance Level (FAL)**: how strongly a relying party can trust an identity assertion forwarded by an identity provider (bearer → injection-protected bearer → holder-of-key).

These three dimensions are chosen independently for a given system and none substitutes for the other two. The full assurance-level tables, the authenticator-to-AAL mapping (including where email magic links, SMS OTP, TOTP, and passkeys actually land), and step-up authentication mechanics live in **[Digital Identity Assurance Levels]({{ '/topics/digital-identity-assurance-levels/' | relative_url }})** and **[Step-Up Authentication & MFA]({{ '/topics/step-up-authentication/' | relative_url }})**.

## Who or What Holds a Digital Identity

Not every subject requiring an identity is a verified real-world person. IAM systems commonly manage several distinct identity types side by side, each with different enrollment and lifecycle needs:

| Identity Type | What It Represents | Typical Credential | IAL Applicability |
|---|---|---|---|
| **Human User (Verified)** | A person whose real-world identity has been proofed to a specific IAL. | Passkey/WebAuthn, password + MFA. | IAL applies directly (IAL1 basic evidence → IAL2 strong evidence → IAL3 in-person attended). |
| **Human User (Pseudonymous)** | A person who authenticates consistently but whose real-world identity is not verified (e.g., a forum or free-tier account). | Password, passkey, social login. | IAL is not meaningfully applicable—the system verifies *consistency* of the subject, not who they are. |
| **Workload / Service Identity** | A running process, microservice, or application component that authenticates to other systems on its own behalf. | SPIFFE/SPIRE X.509-SVIDs, cloud IAM roles, short-lived OIDC tokens. | Not applicable—no enrollment of a person occurs; the identity is attested by its runtime environment instead. |
| **Device Identity** | A physical or virtual endpoint, authenticated independently of whichever user is currently operating it. | Device certificates, TPM-backed attestation, MDM enrollment tokens. | Not applicable; device trust is a separate signal from user identity, often combined with it for context-aware authorization. |
| **Software Agent / Automation Identity** | A script, bot, or autonomous agent acting on behalf of a user or system, increasingly requiring its own scoped, distinguishable identity rather than inheriting a human's full credentials. | Scoped API keys or short-lived tokens issued specifically to the agent, distinct from the delegating user's own session. | Not applicable in the human sense; the relevant question is what the agent is authorized to do and on whose authority. |

## Access Control Models in Brief

Evaluating permissions across cloud microservices, databases, and multi-tenant SaaS requires selecting an appropriate access control model based on domain complexity:

- **Role-Based Access Control (RBAC)**: static subject roles mapped to permissions (`User → Role → Permission`). Simple to audit; best fit for coarse, stable organizational roles.
- **Attribute-Based Access Control (ABAC)**: dynamic attributes of subject, resource, action, and environment evaluated at request time via a policy engine (e.g., OPA/Rego). Best fit when access depends on context like time, IP, or device posture.
- **Relationship-Based Access Control (ReBAC)**: access derived from graph relationships (e.g., `is_viewer_of`) rather than flat roles. Best fit for nested ownership and sharing, such as document or folder permissions.
- **Zero Trust (NIST SP 800-207)** is an architectural strategy, not a fourth access-control model—it requires whichever model is chosen (RBAC, ABAC, or ReBAC) to be evaluated explicitly per session or per request, with continuing evaluation of signals over the session's lifetime, rather than trusted implicitly by network location. This does not mandate a brand-new authentication event on every single request.

The full comparison matrix, trade-offs, and the Zero Trust relationship live in **[Authorization Models: RBAC, ABAC, ReBAC & Zero Trust]({{ '/topics/authorization-models/' | relative_url }})**.

## Authentication vs Authorization Failure Modes Matrix

Confusing authentication proof with authorization permission grants creates critical system vulnerabilities. The matrix below contrasts major failure boundaries, vulnerability root causes, and technical safeguards:

| Vulnerability & Risk Boundary | Vulnerability Root Cause | Real-World Attack Scenario | Correct Engineering Safeguard |
|---|---|---|---|
| **Broken Authentication** | Weak credential validation, missing MFA, or flaw in authenticator binding (**NIST SP 800-63B**). | Attacker executes credential stuffing or SIM-swaps SMS OTP to hijack account access. | For systems requiring AAL2 or higher, enforce phishing-resistant **WebAuthn / FIDO2 Passkeys**—typically AAL2, or AAL3 when using a multi-factor public-key authenticator with phishing resistance and a non-exportable private key—and avoid SMS/password-only logins; NIST SP 800-63B still permits passwords at AAL1 and SMS OTP as a restricted AAL2 authenticator, so this is a journal recommendation for higher-assurance systems, not a universal prohibition. |
| **Broken Function-Level Authorization (BFLA)** | Administrative endpoints (`POST /api/v1/admin/delete`) aren't restricted to admin roles. | Standard user crafts HTTP request to administrative API routes and executes privileged operations. | Enforce **ABAC / OPA policy checks** for coarse-grained filtering at the API Gateway, but the owning microservice must independently enforce its own function-level authorization too—a route added, proxied, or reached by any path that bypasses the gateway must not default to open. |
| **Broken Object-Level Authorization (BOLA / IDOR)** | API endpoint validates authentication token but fails to verify if identity owns target object ID. | Authenticated user changes `/api/v1/users/102/invoice` to `/103` and reads another user's invoice. | Enforce object-level resource ownership validation in the authoritative service or resource that owns the object, on every access path—not only at a perimeter gateway. A gateway PEP can enforce coarse-grained checks, but it typically cannot evaluate per-object ownership without calling back into the owning service, so the owning service must perform this check itself as the final authority. |
| **Broken Session Security** | Exposure, replayability, weak storage, excessive token lifetime, or missing cryptographic binding (e.g., unbound session tokens accessible to client-side scripts). | Attacker steals a browser session cookie via XSS, or an OAuth bearer token via a compromised client/log, and replays it from a hostile IP. | Two distinct mechanisms for two distinct token types: set `HttpOnly` and `Secure` on browser session cookies; select `SameSite=Strict`, `Lax`, or `None` according to the login, federation, and cross-site flow (`None` requires `Secure`), and retain separate CSRF defenses because SameSite is defense in depth rather than a complete CSRF control. Sender-constrain OAuth tokens with **DPoP (RFC 9449)** or **mTLS**. |

## Core Access Control Architectural Principles

Implementing secure identity perimeters relies on seven recommended IAM design principles:

| Architectural Principle | Target Security Requirement | System Risk Mitigated | Technical Realization |
|---|---|---|---|
| **Automated Lifecycle Revocation** | Define a bounded revocation objective (e.g., "propagated to all resource servers within N minutes") when personnel roles change or containers terminate, and verify actual propagation—treat "immediate" as an aspiration, not a guarantee. **RFC 7009** revokes a token at the authorization server, but it does not retroactively invalidate a self-contained JWT already accepted by a resource server that validates the token locally without a revocation check; short token lifetimes and introspection reduce this gap. | Orphaned account access & persistent dormant credentials. | SCIM 2.0 Joiner-Mover-Leaver (JML) integration &amp; automated OAuth token revocation (RFC 7009), paired with short-lived tokens or introspection where self-contained JWTs are used. |
| **Context-Aware Evaluation** | Incorporate environment signals (*device health, IP, geo-velocity*) into authorization decisions. | Stolen session replay from unauthorized locations/devices. | NIST SP 800-207 Zero Trust Policy Decision Points evaluating risk telemetry. |
| **Default Deny** | Implicitly reject all requests unless an explicit policy rule permits access. | Over-permissive access leaks & un-gated API endpoints. | Configure API gateways and firewall rules to default to `DENY ALL`. |
| **Least Privilege** | Grant minimum permissions necessary for specific tasks, restricted in scope and duration. | Lateral movement during account or service compromise. | Short-lived OAuth access tokens, scoped IAM roles, and Just-In-Time (JIT) access. |
| **Non-Human Workload Identity** | Treat microservices, CI/CD runners, and containers as distinct identities requiring credentials. | Hardcoded API keys & long-lived service account tokens. | SPIFFE/SPIRE workload attestations, short-lived OIDC tokens & Vault secret rotation. |
| **Separation of Duties (SoD)** | Prevent a single identity from possessing end-to-end authority over critical operations. | Fraudulent transaction execution & insider threat abuse. | Dual-custody approval workflows (*e.g., initiator cannot approve wire transfer*). |
| **Controlled Emergency Access** | Maintain a narrowly scoped recovery path that remains usable when the primary identity provider, federation path, or privileged-access workflow is unavailable, without turning it into a standing bypass. | Organization-wide administrative lockout during an identity outage; misuse of dormant emergency credentials. | Separately stored emergency identities with hardware-backed phishing-resistant authentication where the platform supports it, two-person retrieval for the highest-impact access, time-bounded activation, real-time alerting, complete session logging, post-use review, and credential rotation after use. |

## The Core Identity and Access Lifecycle

Authentication and authorization, covered above, are two stages inside a longer lifecycle. Weaknesses concentrate disproportionately in the stages that get the least design attention—recovery and session management are commonly the weakest links, even in systems with strong primary authentication:

| Lifecycle Stage | What Happens | Common Weak Point |
|---|---|---|
| **Enrollment &amp; Identity Proofing** | The subject is registered and, for human users, identity-proofed to a target IAL; the resulting subscriber account records the proofing outcome and attributes. | Weak proofing lets an attacker enroll under a false identity from the outset—every later control inherits this gap. |
| **Authenticator Binding &amp; Maintenance** | One or more authenticators are bound to the subscriber account, then maintained, renewed, replaced, or invalidated when lost, stolen, duplicated, expired, or compromised. | A strong authenticator is undermined if an attacker can bind a new authenticator or keep a compromised one active without equivalent authorization and notification checks. |
| **Provisioning &amp; Account Maintenance** | Access rights are granted and account attributes are updated, ideally via SCIM 2.0 Joiner-Mover-Leaver automation tied to an authoritative source (HR system, service catalog). | Manual, out-of-band provisioning or stale account attributes create orphaned, misrouted, or over-permissioned access. |
| **Authentication** | The subject proves control of a registered authenticator at the AAL required for this session. | Authenticator downgrade paths (e.g., an SMS fallback next to a passkey) undermine an otherwise strong AAL. |
| **Federation &amp; Trust-Agreement Management** | An identity provider and relying party establish and maintain the trust agreement, keys, metadata, assertion protections, and FAL needed to convey identity and authentication information. | Stale signing keys, redirect endpoints, client registrations, or trust terms allow assertions to be accepted outside their intended audience or lifecycle. |
| **Session Management** | A successful authentication is translated into a bounded session—token issuance, lifetime, and binding (see Broken Session Security above). | Long-lived, unbound session tokens outlive the trust decision that created them; theft of the token grants standing access without re-authentication. |
| **Recovery** | A subject who has lost their authenticator re-establishes access through an alternate, typically lower-assurance path (email link, backup codes, support desk verification). | Often the weakest point in the entire chain—compromising a lower-assurance recovery path (e.g., the linked email account) can bypass a high-assurance primary authenticator entirely. |
| **Emergency Administrative Access &amp; Return to Normal** | An authorized responder activates a separately controlled break-glass identity when the ordinary identity or privileged-access path cannot be used, performs only the necessary recovery actions, then disables the emergency path and returns administration to the normal control plane. | An untested emergency identity fails during an outage; a permanently enabled account becomes an unmonitored bypass; or emergency changes remain in place after service recovery. Every activation should alert, expire, be reviewed, and trigger rotation or re-sealing of the credentials used. |
| **Periodic Review** | Access rights are periodically re-certified against continued need (access reviews / attestations). | Without a review cadence, provisioned access accumulates silently ("access creep") long after its original justification expired. |
| **Suspension, Termination, Revocation &amp; Deprovisioning** | Accounts or access are suspended while conditions are investigated, terminated when no longer valid, and associated authenticators, sessions, tokens, federation registrations, and permissions are revoked during role change, offboarding, compromise, or workload termination. | Revocation is rarely instant across every relying party and resource server; see **Automated Lifecycle Revocation** above for the bounded-objective framing. |

## Essential Access Path Diagnostic Checklist

When auditing an identity perimeter, microservice API, or SSO federation flow, evaluate these 7 diagnostic questions against target verification evidence:

| Diagnostic Focus Area | Key Architectural Evaluation Question | Target Verification & Audit Evidence |
|---|---|---|
| **Authenticator Assurance** | What Authenticator Assurance Level (**AAL1, AAL2, AAL3**) is enforced at login? | WebAuthn FIDO2 registration logs & MFA enforcement policy code. |
| **Automated Revocation** | How is access revoked when an employee leaves or a container workload is destroyed? | SCIM 2.0 JML provisioning logs & OAuth RFC 7009 token revocation endpoints. |
| **Least Privilege Audit** | Are wildcard permissions (`*`) or over-permissive administrative default roles present? | Automated IAM policy analyzers (*e.g., AWS IAM Access Analyzer / GCP Policy Intelligence*). |
| **Policy Enforcement Point (PEP)** | Beyond coarse-grained gateway or sidecar enforcement, does the authoritative service that owns each resource independently enforce object-level authorization on every access path to it? | API Gateway OPA / Rego policy configs, envoy sidecar filter code &amp; owning-service authorization unit tests. |
| **Session Binding** | Are OAuth tokens sender-constrained via mTLS or cryptographic proof (**DPoP / RFC 9449**), and are browser session cookies separately hardened with `HttpOnly`/`Secure`/`SameSite`? Client-IP binding is brittle (NAT, mobile networks, and CDNs routinely change a legitimate client's IP mid-session) and is not a cryptographic substitute for either mechanism. | DPoP proof-of-possession headers & mTLS client certificate verification logs. |
| **Subject Identification** | Is the requesting subject a human user, federated identity, or automated non-human workload? | SPIFFE/SPIRE ID certificates, OIDC `sub` claim audits & IAM identity inventories. |
| **Emergency Access** | Can authorized responders regain narrowly scoped administrative access when the primary identity path is unavailable, and does every activation expire, alert, produce reviewable evidence, and return the system to normal administration? | Dated break-glass exercise, emergency-identity vault and hardware-key records, activation alerts, session logs, expiry evidence &amp; post-use credential rotation. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Authentication establishes confidence in a returning subject, while authorization decides what that subject may do; IAL, AAL, and FAL measure different assurance questions. Identity security spans proofing, sessions, recovery, controlled emergency access, maintenance, and revocation—not login alone.</p>
</div>

## Primary references

- **NIST SP 800-207**: *Zero Trust Architecture* — [NIST CSRC SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)
- **NIST SP 800-53 Rev. 5**: *Account Management (AC-2), including temporary and emergency account lifecycle controls* — [NIST CSRC SP 800-53](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
- **NIST SP 800-63-4**: *Digital Identity Guidelines* — [NIST CSRC SP 800-63-4](https://pages.nist.gov/800-63-4/)
- **RFC 9449**: *OAuth 2.0 Demonstrating Proof of Possession (DPoP)* — [RFC 9449](https://datatracker.ietf.org/doc/html/rfc9449)
- **RFC 7009**: *OAuth 2.0 Token Revocation* — [RFC 7009](https://datatracker.ietf.org/doc/html/rfc7009)
- **RFC 6265**: *HTTP State Management Mechanism* — [RFC 6265](https://www.rfc-editor.org/rfc/rfc6265.html) — the currently published cookie specification. Its replacement, **draft-ietf-httpbis-rfc6265bis**, has been allocated RFC number 10025 but is still in the RFC Editor queue and is **not yet a published RFC**; track it at [IETF Datatracker](https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/).
- **OWASP Cross-Site Request Forgery Prevention Cheat Sheet** — [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
