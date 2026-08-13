---
title: Digital Identity Assurance Levels (IAL, AAL, FAL)
description: NIST SP 800-63-4 identity-proofing, authentication, and federation assurance levels, including selection boundaries and deployment prerequisites.
permalink: /topics/digital-identity-assurance-levels/
last_verified: 2026-08-13
---

<span class="eyebrow">Authentication & Authorization / Decision Guide</span>

# Digital Identity Assurance Levels (IAL, AAL, FAL)

<p class="lede">Digital identity assurance separates three questions: how strongly an applicant was proofed, how strongly a subscriber authenticates, and how a relying party receives a federated assertion. The three scales are independent. A phishing-resistant login cannot repair weak enrollment, and a strongly protected federation assertion cannot establish facts the identity provider never verified.</p>

## Three independent assurance dimensions

The **[NIST SP 800-63-4 Digital Identity Guidelines](https://pages.nist.gov/800-63-4/)** define Identity Assurance Level (IAL), Authenticator Assurance Level (AAL), and Federation Assurance Level (FAL). Revision 4 was finalized in 2025. These requirements apply to U.S. federal online services within the Guidelines' scope; non-federal organizations can adopt them voluntarily as an assurance vocabulary.

| Dimension | Level | Current Rev. 4 boundary | Selection implication |
|---|---|---|---|
| **Identity proofing** | **IAL1** | Collects qualifying identity evidence, core attributes including a government identifier, validates the evidence and attributes, and verifies ownership of one piece of evidence. Biometrics are optional. | Use only when the consequences of identity-proofing error are consistent with IAL1. A service that does not need a verified real-world identity is outside the IAL model rather than automatically “IAL1.” |
| | **IAL2** | Uses stronger evidence combinations and offers non-biometric, biometric, or digital-evidence verification pathways. It may be remote unattended, remote attended, on-site unattended, or on-site attended when the applicable requirements are met. | Select when impersonation harm requires stronger evidence and verification than IAL1. Record which verification pathway was used. |
| | **IAL3** | Adds IAL3 evidence, validation, biometric, and issuance controls. Proofing is on-site attended; the proofing agent may be co-located or attend through a CSP-controlled kiosk or device. | Reserve for the highest proofing-assurance needs and account for biometric retention, supervised issuance, privacy, and accessibility impacts. |
| **Authentication** | **AAL1** | Permits one or more single-factor or multifactor authenticators. Authentication must be replay resistant, but phishing resistance is not required. | Appropriate only where the assessed authentication risk permits single-factor assurance. |
| | **AAL2** | Requires proof of two distinct factors, through one multifactor authenticator or two separate single-factor authenticators. A phishing-resistant option must be offered. | Typical target for protected enterprise and consumer accounts; select the actual authenticator combination and recovery path, not merely a product label. |
| | **AAL3** | Requires a phishing-resistant public-key authenticator with a non-exportable key, verifier-compromise resistance, an activation factor, and approved cryptography under the federal profile. | A hardware key or smart card qualifies only when the complete authenticator and verifier deployment satisfies every AAL3 requirement. |
| **Federation** | **FAL1** | Uses a signed bearer assertion with audience restriction and the required assertion protections. Possession is enough to present the assertion. | Suitable where the assessed federation risk permits a bearer assertion. |
| | **FAL2** | Adds assertion-injection protection and a pre-established trust relationship between the identity provider and relying party. The assertion remains a bearer assertion. | Use when injection and federation-relationship risks require stronger controls than FAL1. Encryption can be profile-specific but is not the defining property. |
| | **FAL3** | Requires the subscriber to demonstrate possession of a key referenced by the assertion or use an RP-bound authenticator. | Requires a protocol profile that binds the federation assertion or RP authentication accordingly. NIST notes that no current industry-standard OIDC FAL3 profile exists. |

IAL, AAL, and FAL do not move together. A pseudonymous service could have no IAL requirement while using AAL2; a proofed subscriber can still authenticate at AAL1; and an AAL3 event can be carried in a lower-FAL bearer assertion.

## Authenticators do not map to an AAL by product name alone

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/authentication-assurance-levels.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the authentication assurance levels diagram at full size">
    <img src="{{ '/assets/img/authentication-assurance-levels.svg' | relative_url }}" alt="NIST AAL1, AAL2, and AAL3 compared by factor proof, phishing resistance, key exportability, verifier compromise resistance, and cryptographic requirements.">
  </a>
  <p class="diagram-caption">An authenticator reaches an AAL only as part of a deployment that satisfies the complete level requirements.</p>
</div>

| Mechanism | Potential NIST treatment | Important preconditions and limits | Journal selection rule |
|---|---|---|---|
| **Password** | Single-factor memorized secret usable at AAL1. | Not phishing resistant; not an independent second factor when repeated. | Avoid as the only factor for sensitive accounts. |
| **Email magic link** | Email is not an approved out-of-band authenticator under SP 800-63B-4. | Security inherits the email account, link handling, and recovery path. | Limit to low-risk convenience flows outside a claimed NIST AAL. |
| **PSTN SMS or voice OTP** | A restricted authenticator; it can participate in AAL2 when all restrictions and the second-factor requirement are met. | Susceptible to number reassignment, SIM swap, routing attacks, and phishing. | Retain only as a risk-accepted fallback while migrating to phishing-resistant options. |
| **TOTP app** | A single-factor OTP authenticator alone can satisfy AAL1; paired with an independent factor it can participate in AAL2. | Codes can be relayed by an adversary-in-the-middle and seeds can be exposed by endpoint compromise. | Use as an AAL2 fallback, not as the preferred high-risk control. |
| **Push approval** | Can participate in AAL2 when the implementation proves two factors. | Generic approval prompts remain susceptible to fatigue and relay. Number matching reduces blind approvals but does not make the method phishing resistant. | Apply rate limits, context display, and anomaly detection; prefer WebAuthn for high-risk use. |
| **Syncable passkey** | A multifactor cryptographic authenticator that can satisfy AAL2 when its activation and deployment meet the requirements. | Key synchronization means it does not satisfy AAL3's non-exportable-key requirement. Recovery and provider-account security remain dependencies. | Strong default for usable phishing-resistant authentication. |
| **Device-bound WebAuthn credential, security key, or PIV** | Can participate in AAL2 or AAL3. | AAL3 additionally requires a non-exportable key, phishing resistance, activation, verifier-compromise resistance, and approved cryptography; hardware alone is insufficient. | Verify the complete authenticator profile before claiming AAL3. |

## Selecting and operating an assurance profile

1. **Start with impact assessment**: Select each dimension from the harm caused by proofing, authentication, or federation failure rather than copying one level across all three.
2. **Document the complete profile**: Record evidence and proofing pathway, authenticator type and key properties, federation protocol/profile, recovery path, and every exception.
3. **Validate dependencies**: Test verifier configuration, trusted issuers, audience restrictions, authenticator metadata where relied on, key non-exportability evidence, and recovery controls.
4. **Preserve lifecycle evidence**: Log proofing-pathway changes, authenticator binding/removal, federation key rotation, revocation, and account recovery. Reassess when the threat model or service impact changes.
5. **Treat step-up separately**: A runtime request for fresher or stronger authentication is covered in **[Step-Up Authentication & MFA]({{ '/topics/step-up-authentication/' | relative_url }})**; it does not change the original proofing level.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>IAL, AAL, and FAL measure different failure boundaries and must be selected independently. Never infer an assurance level from a product name: verify the full proofing process, authenticator deployment, federation profile, recovery path, and lifecycle controls.</p>
</div>

## Primary references

- **[NIST SP 800-63A-4: Identity Proofing and Enrollment](https://pages.nist.gov/800-63-4/sp800-63a/ial/)** — verified the IAL1–IAL3 evidence, verification, biometric, and proofing-type requirements.
- **[NIST SP 800-63B-4: Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b/aal/)** — verified the AAL factor, phishing-resistance, key-exportability, and cryptographic requirements.
- **[NIST SP 800-63C-4: Federation and Assertions](https://pages.nist.gov/800-63-4/sp800-63c/fal/)** — verified FAL assertion protections and the FAL3 holder-of-key boundary.
