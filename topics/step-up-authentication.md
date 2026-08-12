---
title: Step-Up Authentication & MFA
description: Technical guide to NIST SP 800-63B Rev 4 Authenticator Assurance Levels (AAL1-AAL3), RFC 9470 OAuth Step-Up challenges, and WebAuthn MFA.
permalink: /topics/step-up-authentication/
last_verified: 2026-08-06
---

<span class="eyebrow">Authentication & Authorization / Decision Guide</span>

# Step-Up Authentication & MFA

<p class="lede">Multi-Factor Authentication (MFA) verifies user identity during initial session creation. Step-Up Authentication (RFC 9470) dynamically raises authentication assurance levels (AAL) mid-session when a caller attempts a high-risk operation (*e.g., modifying bank wire details or exfiltrating administrative API keys*).</p>

## NIST SP 800-63B Rev. 4 Authenticator Assurance Levels (AAL)

Standardized in **[NIST SP 800-63B Rev. 4](https://pages.nist.gov/800-63-4/sp800-63b.html)**, Authenticator Assurance Levels define the confidence level of identity authentication:

<div class="diagram-frame">
  <img src="{{ '/assets/img/authentication-assurance-levels.svg' | relative_url }}" alt="NIST authentication assurance levels AAL1, AAL2, and AAL3 with progressively stronger authenticator requirements.">
  <p class="diagram-caption">Higher assurance combines stronger factors, binding, and resistance to impersonation</p>
</div>

| Assurance Level | Required Factor Combination | Session Expiry Limit | Restricted / Excluded Authenticators |
|---|---|---|---|
| **AAL1** | Any single factor (*Password, Passkey*) | Max 30 days | None |
| **AAL2** | Two distinct factors (*Something you know + Something you have*) | Max 24 hours (1 hour idle) | **Restricted**: SMS / Voice OTP (PSTN delivery vulnerable to SIM-swapping) |
| **AAL3** | **Hardware-bound non-exportable private key** + activation factor (PIN/Biometric) | Max 12 hours (15 min idle) | **Excluded**: Syncable Passkeys (*Cloud-synced passkeys barred from AAL3 due to key exportability*) |

## Authenticator Threat Profile Comparison

| Authenticator Type | NIST AAL Level | Primary Attack Vulnerability | Phishing Resistance |
|---|---|---|---|
| **Password** | AAL1 | Credential stuffing, dictionary attacks, breach leaks | **None** |
| **SMS / Voice OTP** | Restricted AAL2 | SIM-swapping, SS7 network interception, number porting | **None** |
| **TOTP App (RFC 6238)** | AAL2 | Real-time proxy phishing (*Evilginx2*), malware secret extraction | **None** |
| **Push Notifications** | AAL2 | "MFA Fatigue" / Push-bombing (*Uber 2022 breach*) | **None** |
| **Hardware Key (FIDO2 / WebAuthn)** | **AAL3** | Physical key theft | **High** (Bound to origin domain name) |

## OAuth 2.0 Step-Up Challenge Protocol (RFC 9470)

When a user attempts a high-risk action with a low-assurance session token, the Resource Server issues an **RFC 9470** step-up challenge:

<div class="diagram-frame">
  <img src="{{ '/assets/img/step-up-authentication-flow.svg' | relative_url }}" alt="Step-up authentication sequence in which a resource server requests fresher or stronger authentication before a high-risk transfer.">
  <p class="diagram-caption">The client retries the action only after obtaining the required authentication context</p>
</div>

1. **API Interception**: The Resource Server determines the current token's `acr` (Authentication Context Class Reference) or age is insufficient for the requested action.
2. **HTTP 401 Challenge**: Returns `error="insufficient_user_authentication"` specifying required `acr_values` and `max_age`.
3. **Targeted Re-authentication**: The client redirects the user to the Authorization Server to complete targeted AAL3 step-up verification without terminating the base user session.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Step-up authentication challenges the user for a higher assurance level at the moment a high-risk action is attempted, using OIDC's standardized <code>acr_values</code>/<code>max_age</code> parameters, without terminating the base session. Prefer phishing-resistant WebAuthn/FIDO2 over OTP-based step-up factors to defeat adversary-in-the-middle relay attacks.</p>
</div>

## Primary references

- **OpenID Connect Core 1.0**: *Authentication Context Class Reference (acr_values)* — [OpenID Spec](https://openid.net/specs/openid-connect-core-1_0.html)
- **NIST SP 800-63B**: *Authenticator Assurance Levels (AAL1, AAL2, AAL3)* — [NIST CSRC SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)
