---
title: Step-Up Authentication & MFA
description: NIST SP 800-63B-4 authenticator assurance, RFC 9470 step-up challenges, transaction binding, token validation, and elevated-session lifecycle.
permalink: /topics/step-up-authentication/
last_verified: 2026-08-15
---

<span class="eyebrow">Authentication & Authorization / Decision Guide</span>

# Step-Up Authentication & MFA

<p class="lede">Multi-factor authentication proves control of multiple authentication factors; it does not by itself prove a person's civil identity. Step-up authentication asks for a fresher or stronger authentication context when a protected action exceeds the current session's assurance. The authorization decision must bind the successful step-up to the intended action, account, and short validity window.</p>

## AAL describes the complete authentication event

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/aal-inputs-and-session-limits.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the AAL inputs and session limits diagram at full size">
    <img src="{{ '/assets/img/aal-inputs-and-session-limits.svg' | relative_url }}" alt="Six inputs feed one outcome: authenticator type, verifier behavior, key non-exportability, an activation factor, approved cryptography, and a recovery path that does not downgrade assurance. Together they determine the achieved AAL, and the weakest input caps the result. Three cards below give the NIST SP 800-63B-4 session guidance per level: AAL1 inactivity no more than 30 days; AAL2 overall no more than 24 hours and inactivity no more than 1 hour; AAL3 overall no more than 12 hours and inactivity no more than 15 minutes.">
  </a>
  <p class="diagram-caption">Authenticator type is only one input; the verifier, key properties, activation, recovery, and session controls determine the achieved AAL.</p>
</div>

| Level | Authentication requirement | Rev. 4 session guidance | Important boundary |
|---|---|---|---|
| **AAL1** | One or more single-factor or multifactor authenticators; replay-resistant authentication. | Inactivity timeout **should** be no more than 30 days. | Phishing resistance is not required. |
| **AAL2** | Two distinct factors, supplied by one multifactor authenticator or two separate single-factor authenticators. | Overall timeout **shall** be no more than 24 hours; inactivity timeout **should** be no more than 1 hour. | A phishing-resistant option must be offered, but not every permitted AAL2 event is phishing resistant. |
| **AAL3** | Phishing-resistant public-key authentication using a non-exportable key, an activation factor, verifier-compromise resistance, and approved cryptography. | Overall timeout **shall** be no more than 12 hours; inactivity timeout **should** be no more than 15 minutes. | A hardware key reaches AAL3 only when the full authenticator and verifier deployment meets every requirement. |

The **[Digital Identity Assurance Levels]({{ '/topics/digital-identity-assurance-levels/' | relative_url }})** page separates AAL from identity proofing and federation assurance and gives the complete authenticator-selection boundary.

## Select step-up by action and threat model

| Mechanism | Likely role | Main residual risk |
|---|---|---|
| **TOTP or PSTN OTP plus an independent factor** | AAL2 fallback where allowed by policy. | Real-time phishing relay; PSTN delivery is restricted under NIST guidance. |
| **Push with contextual display or number matching** | AAL2-capable implementation when two factors are actually proven. | Fatigue, social engineering, and adversary-in-the-middle relay remain possible. |
| **WebAuthn passkey** | Phishing-resistant AAL2-capable default. | Registration, recovery, endpoint, and session compromise remain outside origin binding. |
| **AAL3-qualified public-key authenticator** | Highest-assurance federal profile where justified. | Requires verified non-exportability, activation, verifier behavior, approved cryptography, and a recovery path that does not downgrade assurance. |

These are deployment possibilities, not automatic product classifications.

## RFC 9470 challenge and retry sequence

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/step-up-authentication-flow.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the OAuth step-up authentication flow at full size">
    <img src="{{ '/assets/img/step-up-authentication-flow.svg' | relative_url }}" alt="OAuth step-up sequence: the resource server rejects insufficient authentication with an RFC 9470 challenge, the client requests the specified authentication context or recency, and the resource server validates a replacement token before reconsidering the action.">
  </a>
  <p class="diagram-caption">RFC 9470 communicates the unmet authentication context; the authorization server may satisfy or reject the request, and the resource server validates the resulting token.</p>
</div>

1. **Evaluate the protected action**: The resource server determines that the token's authentication context or age is insufficient for this subject–action–resource tuple.
2. **Return the challenge**: It responds with `401 Unauthorized`, `error="insufficient_user_authentication"`, and one or both of `acr_values` and `max_age` as defined by RFC 9470.
3. **Request authentication**: The client starts a new authorization request using the indicated values. `acr_values` names acceptable authentication-context classes; it does not inherently mean AAL3.
4. **Handle refusal or inability**: The authorization server may be unable or unwilling to satisfy the request. The client must stop retry loops and preserve a clear denial path.
5. **Validate replacement credentials**: The client and resource server validate issuer, audience, signature or introspection result, time bounds, token type/profile, `acr`, `auth_time`, authorization claims, and any sender constraint before retrying.
6. **Re-evaluate authorization**: Stronger authentication is evidence for the policy decision, not an automatic grant. The resource server evaluates the original action again.

RFC 9470 does not require the authorization server to terminate the base session. Whether the original session survives, is replaced, or is globally elevated is an implementation policy; a globally elevated session creates unnecessary privilege bleed.

## Bind elevation to the exact transaction

The following are journal design requirements, not claims that RFC 9470 defines transaction signing:

- store server-side state tying the challenge to subject, client, resource, action, material parameters, and expiration;
- show the user the exact consequence being approved, such as destination account and amount—not a generic “confirm” prompt;
- consume the approval once or within a narrowly defined operation window;
- prevent session fixation by rotating or securely rebinding session state when authentication context changes;
- serialize or safely reject concurrent attempts so one completed challenge cannot authorize another queued action;
- keep elevated authorization local to the required resource/action unless a documented policy needs broader scope; and
- log the original decision, challenge, achieved context, transaction identifier, and final authorization result without recording reusable credentials.

## Test the complete lifecycle

Test insufficient-context challenges, unsupported `acr`, expired and missing `auth_time`, replay of completed transactions, denial and cancellation, timeout, concurrent requests, recovery fallbacks, token substitution, logout, and revocation. A passing authenticator ceremony proves only that authentication event; it does not prove transaction integrity, correct token validation, or correct authorization.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Step-up requests fresher or stronger authentication, but authorization still decides whether the exact action is allowed. Validate the replacement token, bind elevation to the transaction, handle failure without loops, and expire the elevated state without silently upgrading the whole session.</p>
</div>

## Primary references

- **[NIST SP 800-63B-4: Authentication Assurance Levels](https://pages.nist.gov/800-63-4/sp800-63b/aal/)** — verified factor combinations, phishing resistance, cryptographic requirements, and session timeout language.
- **[RFC 9470: OAuth 2.0 Step Up Authentication Challenge Protocol](https://www.rfc-editor.org/rfc/rfc9470.html)** — verified the challenge fields, client retry flow, and error behavior.
- **[OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)** — verified `acr`, `acr_values`, `auth_time`, `max_age`, and ID Token validation context.
- **[W3C WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/)** — verified the phishing-resistant authenticator mechanism used in the preferred step-up path.
