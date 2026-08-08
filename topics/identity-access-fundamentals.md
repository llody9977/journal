---
title: Identity & Access Fundamentals
description: Technical framework for digital identity assurance levels (IAL, AAL, FAL), access control models (RBAC, ABAC, ReBAC, PBAC), failure mode matrices, and Zero Trust policy enforcement.
permalink: /topics/identity-access-fundamentals/
last_verified: 2026-08-07
---

<span class="eyebrow">Security Foundations / Concepts</span>

# Identity & Access Fundamentals

<p class="lede">Identity and Access Management (IAM) governs the continuous engineering lifecycle of binding real-world entities to digital subjects, verifying authenticators, asserting federated tokens, evaluating dynamic authorization policies, and enforcing automated lifecycle revocation. Securing identity boundaries requires separating authentication proofing from authorization evaluation while eliminating implicit trust perimeters.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/identity-access-architecture.svg' | relative_url }}" alt="Identity and Access Management Architecture diagram showing Setup (IAL, AAL, FAL), Zero Trust Runtime Enforcement (PEP/PDP), and Automated Lifecycle Revocation (NIST SP 800-63 & NIST SP 800-207).">
  <p class="diagram-caption">Identity &amp; Access Management Architecture: Setup &amp; Enrollment (IAL/AAL/FAL) → Zero Trust Policy Enforcement (PEP/PDP) → Automated Revocation &amp; SIEM Audit (NIST SP 800-63-3 / SP 800-207)</p>
</div>

## Digital Identity Assurance Model (NIST SP 800-63-3 / SP 800-63-4)

The **NIST SP 800-63** Digital Identity Guidelines decompose identity architecture into three independent assurance dimensions: **Identity Assurance Level (IAL)**, **Authenticator Assurance Level (AAL)**, and **Federation Assurance Level (FAL)**:

| Assurance Dimension &amp; Level | Assurance Level Tier | Technical Requirements &amp; Mechanics | Primary Engineering Application |
|---|---|---|---|
| **AAL1: Single-Factor Assurance** | Level 1 | Password, PIN, or single-factor memorized secret (**[NIST SP 800-63B § 4.1](https://pages.nist.gov/800-63-4/sp800-63b.html#aal1)**). | Basic consumer accounts, non-sensitive read-only portals. |
| **AAL2: Multi-Factor Assurance** | Level 2 | 2-factor authentication (Password + TOTP App / FIDO2 Passkey) (**[NIST SP 800-63B § 4.2](https://pages.nist.gov/800-63-4/sp800-63b.html#aal2)**). | Standard enterprise employee SSO, B2B SaaS applications. |
| **AAL3: Hardware Cryptographic Assurance** | Level 3 | Hardware cryptographic key bound to physical device with PIN/Biometric (**[NIST SP 800-63B § 4.3](https://pages.nist.gov/800-63-4/sp800-63b.html#aal3)**). | Financial ledgers, root administrator access, federal enclaves. |
| **FAL1: Bearer Assertion** | Level 1 | Standard OpenID Connect (OIDC) or SAML bearer assertion (**[NIST SP 800-63C § 4.1](https://pages.nist.gov/800-63-4/sp800-63c.html#fal1)**). | Public OAuth clients, basic SSO federation. |
| **FAL2: Encrypted Assertion** | Level 2 | Assertion signed by IdP and encrypted with RP public key (**[NIST SP 800-63C § 4.2](https://pages.nist.gov/800-63-4/sp800-63c.html#fal2)**). | B2B enterprise federation, cross-domain SSO. |
| **FAL3: Holder-Bound Token** | Level 3 | Cryptographically subject-bound token using DPoP (RFC 9449) or mTLS (**[NIST SP 800-63C § 4.3](https://pages.nist.gov/800-63-4/sp800-63c.html#fal3)**). | Zero Trust microservices, high-assurance token binding. |
| **IAL1: Self-Asserted Identity** | Level 1 | No identity verification or attribute proofing required (**[NIST SP 800-63A § 4.1](https://pages.nist.gov/800-63-4/sp800-63a.html#ial1)**). | Public consumer registration, anonymous trial access. |
| **IAL2: Verified Identity** | Level 2 | Remote identity document validation, PII verification &amp; address proofing (**[NIST SP 800-63A § 4.2](https://pages.nist.gov/800-63-4/sp800-63a.html#ial2)**). | B2B SaaS onboarding, customer KYC verification. |
| **IAL3: In-Person Biometric Proof** | Level 3 | In-person biometric enrollment, physical ID inspection &amp; supervisor sign-off (**[NIST SP 800-63A § 4.3](https://pages.nist.gov/800-63-4/sp800-63a.html#ial3)**). | Federal clearance systems, high-assurance banking credentials. |

## Authentication Mechanism vs AAL & Step-Up Suitability Matrix (NIST SP 800-63B)

Mapping specific authentication implementations (*SMS, TOTP, WebAuthn, Push, Passwords*) to NIST AAL assurance levels, 1st-factor login suitability, 2nd-factor / step-up authorization, and target risk profiles:

| Authentication Control Mechanism | NIST AAL Level | 1st-Factor Login Suitability | 2nd-Factor / Step-Up Suitability | Target Risk Level &amp; Vulnerability Profile | Engineering Guidance &amp; Recommendation |
|---|---|---|---|---|---|
| **Email Link / Magic Link** | **AAL1** (Out-of-band) | **Acceptable** (Passwordless onboarding) | **Not Recommended** (Shared email dependency) | **HIGH RISK**: Email account takeover compromises all magic links; vulnerable to phishing &amp; link interception. | Acceptable for low-risk passwordless consumer onboarding; prohibited for privileged enterprise or admin access. |
| **Hardware Security Key / PIV Smart Card (YubiKey / CAC)** | **AAL3** (Hardware Crypto) | **Highly Recommended** (Passwordless PIN + FIDO2) | **Highly Recommended** (Mandatory for Level 2 Step-Up) | **VERY LOW RISK**: Hardware tamper-resistant, 100% phishing-resistant, MitM-resistant, non-exportable private key. | Enforce for root/global administrators, financial wire transfers, KMS key destruction, and federal enclaves. |
| **In-App Push Notification (Prompt / Number Match)** | **AAL2** (Multi-Factor) | **Prohibited** (Requires primary identity context) | **Acceptable with Number Match** (Not Recommended if simple Accept) | **MODERATE RISK**: Vulnerable to Push Fatigue attacks (*e.g., Lapsus$ breach*) &amp; proxy MitM unless number matching is enforced. | Enforce mandatory **Number Matching** (displaying login numbers to type into push prompt) to block push fatigue exploits. |
| **SMS / Voice OTP** | **Deprecated** (NIST SP 800-63B) | **Prohibited** | **Restricted / Prohibited** | **HIGH RISK**: Vulnerable to SIM-swapping, SS7 network wiretapping, carrier porting fraud, and real-time phishing kits. | Phase out completely. Prohibited for enterprise workforce and financial systems per **NIST SP 800-63B § 5.1.3**. |
| **Software TOTP (Authenticator App e.g. Google/Microsoft Auth)** | **AAL2** (Multi-Factor) | **Prohibited** (Must pair with primary factor) | **Acceptable** (Standard 2FA fallback) | **MODERATE RISK**: Neutralizes static credential stuffing; vulnerable to real-time reverse-proxy phishing kits (**Evilginx**). | Acceptable standard 2FA fallback for consumer users; migrate enterprise workforce to WebAuthn / FIDO2 Passkeys. |
| **Username + Password** | **AAL1** (Memorized Secret) | **Acceptable** (Legacy standard) | **Prohibited** (Not an independent second factor) | **HIGH RISK**: Vulnerable to credential stuffing, password spraying, keylogging, database leaks, and dictionary attacks. | Must be paired with AAL2/AAL3 MFA or replaced with passwordless WebAuthn / FIDO2 Passkeys. |
| **WebAuthn / FIDO2 Passkey (Platform / Roaming)** | **AAL2 / AAL3** (Phishing-Resistant) | **Highly Recommended** (Passwordless Passkey) | **Highly Recommended** (Gold standard for Step-Up) | **LOW / VERY LOW RISK**: 100% Phishing-resistant, MitM-resistant, and replay-resistant via domain `rp.id` origin binding. | Gold standard for all modern enterprise SSO, B2B SaaS applications, and high-risk step-up authorization flows. |

### Key Architectural Insights & Strategic Trade-offs

Evaluating authentication control implementations against NIST SP 800-63B reveals three foundational engineering insights:

1. **The Phishing-Resistance Divide (Legacy AAL2 vs FIDO2 Passkeys)**:
   - Traditional AAL2 authenticators (*SMS OTP, TOTP apps, push notifications*) fail against automated reverse-proxy phishing kits (*e.g., Evilginx, Modlishka*). Attackers proxy authentication requests in real time, capturing both credentials and active session cookies.
   - WebAuthn / FIDO2 Passkeys enforce cryptographic origin binding (`rp.id`), ensuring authentication payloads cannot be replayed to an adversary's proxy server.

2. **Dynamic Step-Up Authentication Trajectory**:
   - Modern Zero Trust architectures do not enforce static AAL levels across an entire user session.
   - Low-risk read requests operate under baseline AAL1/AAL2. When users trigger high-risk operations (*e.g., updating wire transfer payout addresses or deleting KMS encryption keys*), API Gateways enforce dynamic **Step-Up Authentication** to AAL2-PhishResist or AAL3 hardware keys before approving payload execution.

3. **SMS &amp; Voice OTP Deprecation Mandate**:
   - **NIST SP 800-63B § 5.1.3** explicitly restricts and deprecates SMS and voice-call OTP due to SIM-swapping, SS7 network interception, and carrier routing hijacks. Enterprise architectures must phase out SMS OTP in favor of FIDO2 Passkeys or authenticator apps.

## Access Control Models Comparison Matrix

Evaluating permissions across cloud microservices, databases, and multi-tenant SaaS requires selecting an appropriate access control model based on domain complexity:

| Access Control Model | Core Evaluation Mechanism | Architectural Strengths | Primary Engineering Use Case |
|---|---|---|---|
| **Attribute-Based Access Control (ABAC)** | Evaluates dynamic attributes (*Subject, Resource, Action, Environment*) via policy engines (**OPA / Rego**). | Context-aware (*IP, time, device compliance*), highly fine-grained policy enforcement. | Zero Trust network access, healthcare ePHI access, dynamic API gateway authorization. |
| **Policy-Based Access Control (PBAC / Zero Trust)** | Centralized Policy Decision Point (**PDP**) evaluating real-time risk scores and pushing decisions to Policy Enforcement Points (**PEP**). | Continuous verification (**NIST SP 800-207**), eliminates implicit trust perimeters. | Cloud-native microservice service meshes, mTLS ingress proxies, federal Zero Trust architectures. |
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

Implementing secure identity perimeters requires enforcing six mandatory architectural principles:

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
