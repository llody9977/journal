---
title: Identity & Access Fundamentals
description: Technical framework for digital identity assurance levels (IAL, AAL, FAL), access control models (RBAC, ABAC, ReBAC, PBAC), failure mode matrices, and Zero Trust policy enforcement.
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

## Digital Identity Assurance Model (NIST SP 800-63-4)

The **NIST SP 800-63** Digital Identity Guidelines decompose identity architecture into three independent assurance dimensions: **Identity Assurance Level (IAL)**, **Authenticator Assurance Level (AAL)**, and **Federation Assurance Level (FAL)**. **Revision 4** finalized in 2025 and is the current version referenced below; Revision 3 is cited only where its requirements differ from Revision 4.

| Assurance Dimension &amp; Level | Assurance Level Tier | Technical Requirements &amp; Mechanics | Primary Engineering Application |
|---|---|---|---|
| **AAL1: Single-Factor Assurance** | Level 1 | Password, PIN, or single-factor memorized secret, or single-factor OTP device (**[NIST SP 800-63B § 4.1](https://pages.nist.gov/800-63-4/sp800-63b.html#aal1)**). | Basic consumer accounts, non-sensitive read-only portals. |
| **AAL2: Multi-Factor Assurance** | Level 2 | Multi-factor authentication combining two distinct factors—e.g., Password + TOTP App, or a single multi-factor authenticator such as a FIDO2 Passkey (**[NIST SP 800-63B § 4.2](https://pages.nist.gov/800-63-4/sp800-63b.html#aal2)**). | Standard enterprise employee SSO, B2B SaaS applications. |
| **AAL3: Hardware Cryptographic Assurance** | Level 3 | Hardware cryptographic key bound to physical device with PIN/Biometric (**[NIST SP 800-63B § 4.3](https://pages.nist.gov/800-63-4/sp800-63b.html#aal3)**). | Financial ledgers, root administrator access, federal enclaves. |
| **FAL1: Bearer Assertion** | Level 1 | Standard OpenID Connect (OIDC) or SAML bearer assertion (**[NIST SP 800-63C § 4.1](https://pages.nist.gov/800-63-4/sp800-63c.html#fal1)**). | Public OAuth clients, basic SSO federation. |
| **FAL2: Bearer Assertion with Injection Protection** | Level 2 | Still a bearer assertion (not exportable holder-of-key), but adds audience restriction, replay protection, and assertion-injection protection under a pre-established IdP–RP trust relationship (**[NIST SP 800-63C § 4.2](https://pages.nist.gov/800-63-4/sp800-63c.html#fal2)**). Encryption of the assertion is a common implementation choice, not the defining FAL2 requirement. | B2B enterprise federation, cross-domain SSO. |
| **FAL3: Holder-of-Key Assertion** | Level 3 | Assertion cryptographically bound to a key held by the subscriber ("holder-of-key" / bound authenticator), so a stolen bearer token alone is insufficient. **DPoP (RFC 9449)** and **mTLS** are common implementation mechanisms, not the only ones NIST recognizes (**[NIST SP 800-63C § 4.3](https://pages.nist.gov/800-63-4/sp800-63c.html#fal3)**). | Zero Trust microservices, high-assurance token binding. |
| **IAL1: Self-Asserted Identity** | Level 1 | No identity verification or attribute proofing required (**[NIST SP 800-63A § 4.1](https://pages.nist.gov/800-63-4/sp800-63a.html#ial1)**). | Public consumer registration, anonymous trial access. |
| **IAL2: Verified Identity** | Level 2 | Remote identity document validation, PII verification &amp; address proofing (**[NIST SP 800-63A § 4.2](https://pages.nist.gov/800-63-4/sp800-63a.html#ial2)**). | B2B SaaS onboarding, customer KYC verification. |
| **IAL3: In-Person or Supervised-Remote Verified Proof** | Level 3 | In-person or supervised-remote identity verification with physical/biometric comparison and higher-assurance evidence validation (**[NIST SP 800-63A § 4.3](https://pages.nist.gov/800-63-4/sp800-63a.html#ial3)**). | Federal clearance systems, high-assurance banking credentials. |

## Authentication Mechanism vs AAL & Step-Up Suitability Matrix (NIST SP 800-63B)

Mapping specific authentication implementations (*SMS, TOTP, WebAuthn, Push, Passwords*) to NIST AAL assurance levels, 1st-factor login suitability, 2nd-factor / step-up authorization, and target risk profiles:

| Authentication Control Mechanism | NIST AAL Level | 1st-Factor Login Suitability | 2nd-Factor / Step-Up Suitability | Target Risk Level &amp; Vulnerability Profile | Engineering Guidance &amp; Recommendation |
|---|---|---|---|---|---|
| **Email Link / Magic Link** | **Not an AAL1 out-of-band authenticator under NIST SP 800-63B**—NIST explicitly excludes email as an out-of-band channel (§ 5.1.3.1). | **Used in practice** (Passwordless onboarding) despite not meeting NIST's OOB bar. | **Not Recommended** (Shared email dependency) | **HIGH RISK**: Email account takeover compromises all magic links; vulnerable to phishing &amp; link interception. | Treat as a convenience mechanism for low-risk consumer onboarding, not as an assured authenticator; do not use for privileged enterprise or admin access. |
| **Hardware Security Key / PIV Smart Card (YubiKey / CAC)** | **AAL3** (Hardware Crypto) | **Highly Recommended** (Passwordless PIN + FIDO2) | **Highly Recommended** (Mandatory for Level 2 Step-Up) | **VERY LOW RISK**: Hardware tamper-resistant, phishing-resistant and MitM-resistant under the WebAuthn origin-binding model, non-exportable private key. | Enforce for root/global administrators, financial wire transfers, KMS key destruction, and federal enclaves. |
| **In-App Push Notification (Prompt / Number Match)** | **AAL2** (Multi-Factor) | **Prohibited** (Requires primary identity context) | **Acceptable with Number Match** (Not Recommended if simple Accept) | **MODERATE RISK**: Vulnerable to Push Fatigue attacks (*e.g., Lapsus$ breach*) &amp; proxy MitM unless number matching is enforced. | Enforce mandatory **Number Matching** (displaying login numbers to type into push prompt) to block push fatigue exploits. |
| **SMS / Voice OTP** | **Restricted** (NIST SP 800-63B §5.1.3.3)—NIST places conditions on its use (e.g., verifying the number is not VoIP) rather than banning it outright. | **Restricted** | **Restricted** | **HIGH RISK**: Vulnerable to SIM-swapping, SS7 network wiretapping, carrier porting fraud, and real-time phishing kits. | Journal recommendation: phase out in favor of WebAuthn/FIDO2 or authenticator apps where feasible, even though NIST's own status is "restricted" rather than "prohibited." |
| **Software TOTP (Authenticator App e.g. Google/Microsoft Auth)** | **AAL1 as a standalone single-factor OTP device, or AAL2 when combined with a second distinct factor** (**NIST SP 800-63B § 4**)—TOTP is not inherently AAL2. | **Acceptable** as a single factor at AAL1; not sufficient alone for AAL2. | **Acceptable** (Standard 2FA fallback) | **MODERATE RISK**: Neutralizes static credential stuffing; vulnerable to real-time reverse-proxy phishing kits (**Evilginx**). | Acceptable standard 2FA fallback for consumer users; migrate enterprise workforce to WebAuthn / FIDO2 Passkeys. |
| **Username + Password** | **AAL1** (Memorized Secret) | **Acceptable** (Legacy standard) | **Prohibited** (Not an independent second factor) | **HIGH RISK**: Vulnerable to credential stuffing, password spraying, keylogging, database leaks, and dictionary attacks. | Must be paired with AAL2/AAL3 MFA or replaced with passwordless WebAuthn / FIDO2 Passkeys. |
| **WebAuthn / FIDO2 Passkey (Platform / Roaming)** | **Typically AAL2**; a **non-exportable, hardware-bound** passkey (e.g., roaming security key or a platform authenticator whose key cannot leave the device) can meet **AAL3**. A syncable/cloud-backed passkey does not satisfy AAL3's non-exportability requirement, regardless of platform. | **Highly Recommended** (Passwordless Passkey) | **Highly Recommended** (Strong default for Step-Up) | **LOW / VERY LOW RISK**: Phishing-resistant and MitM/replay-resistant under the WebAuthn authentication model via domain `rp.id` origin binding—not an absolute, unconditional guarantee. | Strong default for modern enterprise SSO, B2B SaaS applications, and high-risk step-up authorization flows; confirm non-exportable key storage before relying on it for AAL3. |

### Key Architectural Insights & Strategic Trade-offs

Evaluating authentication control implementations against NIST SP 800-63B reveals three foundational engineering insights:

1. **The Phishing-Resistance Divide (Legacy AAL2 vs FIDO2 Passkeys)**:
   - Traditional AAL2 authenticators (*SMS OTP, TOTP apps, push notifications*) fail against automated reverse-proxy phishing kits (*e.g., Evilginx, Modlishka*). Attackers proxy authentication requests in real time, capturing both credentials and active session cookies.
   - WebAuthn / FIDO2 Passkeys enforce cryptographic origin binding (`rp.id`), ensuring authentication payloads cannot be replayed to an adversary's proxy server.

2. **Dynamic Step-Up Authentication Trajectory**:
   - Modern Zero Trust architectures do not enforce static AAL levels across an entire user session.
   - Low-risk read requests operate under baseline AAL1/AAL2. When users trigger high-risk operations (*e.g., updating wire transfer payout addresses or deleting KMS encryption keys*), API Gateways enforce dynamic **Step-Up Authentication** to an AAL2 phishing-resistant authenticator (such as a passkey) or an AAL3 hardware key before approving payload execution.

3. **SMS &amp; Voice OTP Restriction**:
   - **NIST SP 800-63B § 5.1.3.3** places restrictions on SMS and voice-call OTP (e.g., verifying the destination is not a VoIP number)—NIST's own status is "restricted," not a blanket prohibition. Given the SIM-swapping, SS7 network interception, and carrier routing hijack risk, this journal's engineering recommendation is still to phase out SMS OTP where feasible in favor of FIDO2 Passkeys or authenticator apps.

## Access Control Models Comparison Matrix

Evaluating permissions across cloud microservices, databases, and multi-tenant SaaS requires selecting an appropriate access control model based on domain complexity:

| Access Control Model | Core Evaluation Mechanism | Architectural Strengths | Primary Engineering Use Case |
|---|---|---|---|
| **Attribute-Based Access Control (ABAC)** | Evaluates dynamic attributes (*Subject, Resource, Action, Environment*) via policy engines (**OPA / Rego**). | Context-aware (*IP, time, device compliance*), highly fine-grained policy enforcement. | Zero Trust network access, healthcare ePHI access, dynamic API gateway authorization. |
| **Policy-Based Access Control (PBAC)** | Centralized Policy Decision Point (**PDP**) evaluating real-time risk scores and pushing decisions to Policy Enforcement Points (**PEP**). Note: Zero Trust (**NIST SP 800-207**) is an architectural strategy, not an access-control model itself—a Zero Trust Architecture commonly implements its policy decisions using PBAC (and can also use RBAC or ABAC underneath). | Supports continuous, per-request verification and reduces implicit trust perimeters when paired with a Zero Trust strategy. | Cloud-native microservice service meshes, mTLS ingress proxies, federal Zero Trust architectures. |
| **Relationship-Based Access Control (ReBAC)** | Evaluates graph relationship tuples (*Subject `is_viewer_of` Document inside Folder*) via graph engines (**OpenFGA / Zanzibar**). | Handles deep object inheritance, multi-tenant sharing, and hierarchical permissions effortlessly. | Google Drive-style file sharing, SaaS multi-tenant workspaces, collaborative document platforms. |
| **Role-Based Access Control (RBAC)** | Evaluates static subject roles mapped to permissions (`User -> Role -> Permission`). | Simple auditing, predictable policy structure, easy administrative onboarding. | Administrative portals, basic application permissions, internal enterprise tools. |

## Authentication vs Authorization Failure Modes Matrix

Confusing authentication proof with authorization permission grants creates critical system vulnerabilities. The matrix below contrasts major failure boundaries, vulnerability root causes, and technical safeguards:

| Vulnerability & Risk Boundary | Vulnerability Root Cause | Real-World Attack Scenario | Correct Engineering Safeguard |
|---|---|---|---|
| **Broken Authentication** | Weak credential validation, missing MFA, or flaw in authenticator binding (**NIST SP 800-63B**). | Attacker executes credential stuffing or SIM-swaps SMS OTP to hijack account access. | Enforce phishing-resistant **WebAuthn / FIDO2 Passkeys** (AAL2/AAL3) and eliminate SMS/password-only logins. |
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
