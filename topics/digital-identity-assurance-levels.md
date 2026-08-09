---
title: Digital Identity Assurance Levels (IAL, AAL, FAL)
description: NIST SP 800-63-4 Identity, Authenticator, and Federation Assurance Levels, authenticator-to-AAL mapping, and phishing-resistance trade-offs.
permalink: /topics/digital-identity-assurance-levels/
last_verified: 2026-08-09
---

<span class="eyebrow">Authentication & Authorization / Decision Guide</span>

# Digital Identity Assurance Levels (IAL, AAL, FAL)

<p class="lede">Digital identity assurance answers three separate questions with three independent scales: how confident is the enrollment that this person is who they claim to be, how confident is each login that the same person is back, and how much can a relying party trust an identity assertion forwarded by someone else's login. Conflating these three—for example, treating a strong login as proof of identity, or a signed token as proof of non-repudiation—is a common source of access-control design errors.</p>

## Three Independent Assurance Dimensions (NIST SP 800-63-4)

The **[NIST SP 800-63](https://pages.nist.gov/800-63-4/)** Digital Identity Guidelines decompose identity architecture into three independent assurance dimensions: **Identity Assurance Level (IAL)**, **Authenticator Assurance Level (AAL)**, and **Federation Assurance Level (FAL)**. **Revision 4** finalized in 2025 and is the current version referenced below.

| Assurance Dimension &amp; Level | Assurance Level Tier | Technical Requirements &amp; Mechanics | Primary Engineering Application |
|---|---|---|---|
| **IAL1: Self-Asserted Identity** | Level 1 | No identity verification or attribute proofing required (**[NIST SP 800-63A § 4.1](https://pages.nist.gov/800-63-4/sp800-63a.html#ial1)**). | Public consumer registration, anonymous trial access. |
| **IAL2: Verified Identity** | Level 2 | Remote identity document validation, PII verification &amp; address proofing (**[NIST SP 800-63A § 4.2](https://pages.nist.gov/800-63-4/sp800-63a.html#ial2)**). | B2B SaaS onboarding, customer KYC verification. |
| **IAL3: In-Person or Supervised-Remote Verified Proof** | Level 3 | In-person or supervised-remote identity verification with physical/biometric comparison and higher-assurance evidence validation (**[NIST SP 800-63A § 4.3](https://pages.nist.gov/800-63-4/sp800-63a.html#ial3)**). | Federal clearance systems, high-assurance banking credentials. |
| **AAL1: Single-Factor Assurance** | Level 1 | Password, PIN, or single-factor memorized secret, or single-factor OTP device (**[NIST SP 800-63B § 4.1](https://pages.nist.gov/800-63-4/sp800-63b.html#aal1)**). | Basic consumer accounts, non-sensitive read-only portals. |
| **AAL2: Multi-Factor Assurance** | Level 2 | Multi-factor authentication combining two distinct factors—e.g., Password + TOTP App, or a single multi-factor authenticator such as a FIDO2 Passkey (**[NIST SP 800-63B § 4.2](https://pages.nist.gov/800-63-4/sp800-63b.html#aal2)**). | Standard enterprise employee SSO, B2B SaaS applications. |
| **AAL3: Hardware Cryptographic Assurance** | Level 3 | Hardware cryptographic key bound to physical device with PIN/Biometric (**[NIST SP 800-63B § 4.3](https://pages.nist.gov/800-63-4/sp800-63b.html#aal3)**). | Financial ledgers, root administrator access, federal enclaves. |
| **FAL1: Bearer Assertion** | Level 1 | Standard OpenID Connect (OIDC) or SAML bearer assertion (**[NIST SP 800-63C § 4.1](https://pages.nist.gov/800-63-4/sp800-63c.html#fal1)**). | Public OAuth clients, basic SSO federation. |
| **FAL2: Bearer Assertion with Injection Protection** | Level 2 | Still a bearer assertion (not exportable holder-of-key), but adds audience restriction, replay protection, and assertion-injection protection under a pre-established IdP–RP trust relationship (**[NIST SP 800-63C § 4.2](https://pages.nist.gov/800-63-4/sp800-63c.html#fal2)**). Encryption of the assertion is a common implementation choice, not the defining FAL2 requirement. | B2B enterprise federation, cross-domain SSO. |
| **FAL3: Holder-of-Key Assertion** | Level 3 | Assertion cryptographically bound to a key held by the subscriber ("holder-of-key" / bound authenticator), so a stolen bearer token alone is insufficient. **DPoP (RFC 9449)** and **mTLS** are common implementation mechanisms, not the only ones NIST recognizes (**[NIST SP 800-63C § 4.3](https://pages.nist.gov/800-63-4/sp800-63c.html#fal3)**). | Zero Trust microservices, high-assurance token binding. |

IAL, AAL, and FAL are chosen independently for a given system—a consumer app might run IAL1/AAL2/FAL1, while a banking core might require IAL2/AAL3/FAL3. There is no requirement that the three levels move together.

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

For the runtime protocol used to raise a session from a baseline AAL to a higher one mid-session (RFC 9470 step-up challenges), see **[Step-Up Authentication & MFA]({{ '/topics/step-up-authentication/' | relative_url }})**.

## Key Architectural Insights

1. **The Phishing-Resistance Divide (Legacy AAL2 vs FIDO2 Passkeys)**: Traditional AAL2 authenticators (*SMS OTP, TOTP apps, push notifications*) fail against automated reverse-proxy phishing kits (*e.g., Evilginx, Modlishka*), which proxy authentication requests in real time and capture both credentials and active session cookies. WebAuthn / FIDO2 Passkeys enforce cryptographic origin binding (`rp.id`), so authentication payloads cannot be replayed to an adversary's proxy server.
2. **IAL, AAL, and FAL Solve Different Failure Modes**: A system can have strong login assurance (AAL3) with weak identity proofing (IAL1)—e.g., a hardware key registered against a self-asserted email address. Each dimension must be evaluated against the specific harm it is meant to prevent: account takeover (AAL), impersonation at enrollment (IAL), or a forged or replayed federation assertion (FAL).
3. **SMS &amp; Voice OTP Restriction**: NIST's own status for SMS/voice OTP is "restricted," not a blanket prohibition. Given the SIM-swapping, SS7 interception, and carrier routing hijack risk, this journal's engineering recommendation is still to phase out SMS OTP where feasible in favor of FIDO2 Passkeys or authenticator apps.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Digital Identity Assurance Summary</strong>
    <ul>
      <li><strong>Three Independent Dimensions</strong>: IAL (identity proofing), AAL (login assurance), and FAL (federation assertion strength) are chosen independently—none substitutes for the other two.</li>
      <li><strong>Non-Exportable Key for AAL3</strong>: A hardware-bound WebAuthn passkey can meet AAL3; a syncable/cloud-backed passkey cannot, regardless of platform.</li>
      <li><strong>SMS/Voice OTP is Restricted, Not Prohibited</strong>: NIST's own status is "restricted"; this journal still recommends phasing it out where feasible.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-63-4**: *Digital Identity Guidelines* — [NIST CSRC SP 800-63-4](https://pages.nist.gov/800-63-4/)
- **NIST SP 800-63B § 5.1.3**: *Restricted Authenticators (SMS/Voice OTP)* — [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html)
