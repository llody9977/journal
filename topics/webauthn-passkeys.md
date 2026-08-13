---
title: WebAuthn & Passkeys Deep-Dive
description: WebAuthn registration and authentication mechanics, attestation policy, passkey deployment models, validation, recovery, conditional UI, and cross-device authentication.
permalink: /topics/webauthn-passkeys/
last_verified: 2026-08-13
---

<span class="eyebrow">Authentication & Authorization / Concepts</span>

# WebAuthn & Passkeys Deep-Dive

<p class="lede">WebAuthn lets a relying party authenticate a user with a per-site public-key credential. The browser and authenticator bind the ceremony to the relying-party identifier and origin, providing verifier-name-bound phishing resistance. That property blocks credential relay to a lookalike site; it does not protect an insecure recovery flow, a compromised authenticated session, or an attacker-authorized credential registration.</p>

## Components and protocol boundary

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/webauthn-components.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the WebAuthn components diagram at full size">
    <img src="{{ '/assets/img/webauthn-components.svg' | relative_url }}" alt="WebAuthn flow in which the relying party sends options through the browser, the browser communicates with a platform or roaming authenticator, and the browser returns the credential response to the relying party.">
  </a>
  <p class="diagram-caption">The browser mediates both directions; the authenticator protects the private key while the relying party stores the credential public key.</p>
</div>

1. **Relying Party (RP)**: Generates ceremony options and validates the returned credential response.
2. **Client**: The browser or user agent that exposes the WebAuthn API and supplies the effective origin.
3. **Authenticator**: Generates or uses the credential private key and reports user-presence (UP) and, when performed, user-verification (UV) state. A platform authenticator is integrated into the client device; a roaming authenticator can communicate through CTAP, USB, NFC, or another supported transport. CTAP is therefore a concrete external-authenticator path, not a requirement for every authenticator.

## Registration, attestation, and authentication are distinct

### Registration creates a credential

The RP sends a fresh challenge, RP information, user information, acceptable algorithms, and selection preferences. The authenticator creates a credential scoped to the RP ID. The browser returns an attestation object and `clientDataJSON`; the RP validates the response before associating the credential ID and public key with the intended account.

**Attestation is optional policy evidence inside registration, not another name for registration.** Depending on the attestation conveyance and authenticator behavior, the statement may be none, self, basic, enterprise, or an anonymized form. Its evidentiary value depends on chain validation and trusted metadata; it does not universally prove a particular manufacturer or device model.

### Authentication produces an assertion

1. The RP issues a fresh, unpredictable challenge and its credential-selection options.
2. The browser supplies the effective origin and invokes an eligible authenticator.
3. The authenticator checks user presence and performs user verification only when the options and authenticator operation require it. UV may use a PIN, biometric, device unlock, or another authenticator-supported method.
4. The authenticator signs `authenticatorData || SHA-256(clientDataJSON)` with the credential private key.
5. The browser returns the assertion; the RP validates the complete response against stored credential state and the original request.

## Passkey deployment models and assurance

| Model | Key availability | Operational advantage | Assurance boundary |
|---|---|---|---|
| **Syncable passkey** | Credential material can be made available across a provider's trusted device ecosystem. | Recovery and cross-device usability are easier. | Can satisfy AAL2 when the complete deployment meets AAL2; synchronization conflicts with AAL3's non-exportable-key requirement. Provider-account recovery is a dependency. |
| **Device-bound credential** | Credential is not synced by the credential provider. | Stronger device custody and administrative separation. | Device binding alone does not establish AAL3; the deployment must also meet activation, phishing-resistance, verifier-compromise-resistance, and approved-cryptography requirements. |
| **Roaming security key** | Credential remains on a separate authenticator and can be used with supported clients. | Portable, separable custody and useful administrator workflows. | Can participate in AAL2 or AAL3 depending on the authenticator and verifier profile; the product label is not sufficient evidence. |

## Relying-party validation checklist

For registration and authentication, use a maintained WebAuthn implementation and verify at least:

- the returned `type`, challenge, and origin exactly match the stored ceremony state and allowed origins;
- the RP ID hash in authenticator data matches the expected RP ID;
- UP and UV flags satisfy the RP's requested policy;
- the credential algorithm is allowed and the assertion signature verifies with the registered public key;
- registration was authorized by an already trusted account session or a controlled enrollment/recovery process;
- attestation is evaluated only when policy requires it, against explicitly trusted roots and metadata;
- the signature counter is treated as a signal, not universal cloning proof—some authenticators do not maintain a useful global counter;
- backup-eligibility and backup-state flags are interpreted according to the credential-management policy; and
- ceremony state is single-use, expires promptly, and is bound to the intended account and transaction.

## Conditional UI and cross-device authentication

**Conditional mediation** allows discoverable credentials to appear in browser sign-in UI without forcing an immediate modal prompt. It changes discovery and user experience, not RP validation requirements.

**Hybrid or cross-device authentication** lets one device use a nearby authenticator, often after a QR-code/bootstrap exchange and proximity-assisted channel establishment. The RP still receives a normal WebAuthn assertion. Treat the transport and paired device as additional dependencies; do not infer that the credential has become syncable or device-bound solely from the cross-device ceremony.

## Lifecycle, recovery, and residual risk

- Provide a credential inventory with recognizable names, registration time, backup state where available, and last-use information.
- Notify the account through an independent channel when a credential is added or removed.
- Require strong reauthentication and risk checks before adding a credential; prevent helpdesk social engineering from becoming the weakest path.
- Support multiple authenticators, lost-device recovery, and prompt server-side removal of a compromised credential. WebAuthn has no universal global revocation service; the RP controls credential acceptance.
- Test domain/RP-ID migrations before deployment because credentials are intentionally scoped. Preserve old origins only when the WebAuthn rules and migration plan permit them.
- Protect authenticated sessions and sensitive transactions separately; origin binding does not stop malware using an already authenticated browser session.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>WebAuthn's core security property is verifier-name binding, but the relying party must still validate the complete ceremony and secure registration, session, recovery, and credential-removal paths. Syncable, device-bound, and roaming credentials have different custody properties; none reaches AAL3 by product name alone.</p>
</div>

## Primary references

- **[W3C Web Authentication Level 3](https://www.w3.org/TR/webauthn-3/)** — verified ceremony data, signed bytes, UP/UV flags, attestation, backup state, conditional mediation, and hybrid transport semantics.
- **[FIDO Alliance passkeys](https://fidoalliance.org/passkeys/)** — verified passkey terminology and multi-device/device-bound operating models.
- **[NIST SP 800-63B-4 authenticator requirements](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/)** — verified verifier-name binding and the assurance boundary for syncable and non-exportable authenticators.
