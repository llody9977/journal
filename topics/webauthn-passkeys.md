---
title: WebAuthn & Passkeys Deep-Dive
description: FIDO2/WebAuthn ceremony mechanics, public-key credentials, Attestation vs Assertion, and syncable passkeys vs hardware security keys.
permalink: /topics/webauthn-passkeys/
last_verified: 2026-08-06
---

<span class="eyebrow">Authentication & Authorization / Concepts</span>

# WebAuthn & Passkeys Deep-Dive

<p class="lede">WebAuthn (W3C Web Authentication) and FIDO2 replace passwords with asymmetric public-key cryptography bound to a specific origin. Passkeys eliminate phishing by design because the browser and authenticator enforce origin binding at the cryptographic protocol layer—a lookalike phishing site cannot trick an authenticator into signing a challenge for a domain it does not control.</p>

## What is WebAuthn: origin-bound public key authentication

WebAuthn replaces passwords with asymmetric key pairs generated per web domain (Relying Party). The server stores the public key; the device's authenticator (Secure Enclave, TPM, YubiKey) protects the private key behind local biometric/PIN authorization.

WebAuthn involves three distinct entities:

<div class="diagram-frame">
  <img src="{{ '/assets/img/webauthn-components.svg' | relative_url }}" alt="WebAuthn components: the user and browser, a private-key-holding authenticator, and the relying party server that verifies signed challenges.">
  <p class="diagram-caption">The private key remains in the authenticator while the relying party stores the public key</p>
</div>

1. **Relying Party (RP)**: The server application requesting authentication.
2. **Client / Browser**: The user agent enforcing origin verification (`https://login.example.com`).
3. **Authenticator**: The hardware or software module generating and signing challenges via **CTAP2** (Client-to-Authenticator Protocol).

## The WebAuthn Ceremony: Registration vs Authentication

### 1. Registration Ceremony (Attestation)
During account setup, the server sends a challenge and RP ID. The authenticator generates a new key pair and returns an **Attestation Object**:

- **Credential ID**: Unique identifier for the generated key pair.
- **Public Key**: Exported to the server to store in the user database.
- **Attestation Statement**: Cryptographic proof verifying the hardware manufacturer/type of the authenticator (optional).

### 2. Authentication Ceremony (Assertion)
When the user logs in later, the server issues a random cryptographic challenge:

- The browser passes the challenge and origin (`https://example.com`) to the authenticator.
- The user completes local biometric authorization (Touch ID / Face ID / PIN).
- The authenticator computes a digital signature over `clientDataJSON` (containing challenge + origin) and `authenticatorData`.
- The server verifies the signature using the stored public key.

## Syncable Passkeys vs Hardware Security Keys

Passkeys come in two distinct operational models:

| Dimension | Syncable Passkeys (Multi-Device) | Hardware Security Keys (Single-Device) |
|---|---|---|
| **Private Key Storage** | Synced across user devices via end-to-end encrypted cloud fabric (Apple Keychain, Google Password Manager, 1Password) | Non-exportable private key bound permanently to a physical chip (YubiKey, Titan Key) |
| **User Convenience** | High (available automatically across all user devices) | Requires physically plugging in or tapping NFC key |
| **Phishing Resistance** | **Phishing Resistant** | **Phishing Resistant** |
| **NIST AAL Level** | Satisfies **NIST AAL2** | Satisfies **NIST AAL3** (due to non-exportable private key requirement) |

## Why WebAuthn is immune to phishing

In traditional password or TOTP authentication, a user can be tricked into entering credentials on `examp1e.com`.

In WebAuthn:
1. The browser automatically inspects the actual TLS origin (`https://examp1e.com`).
2. The browser packages `https://examp1e.com` into `clientDataJSON`.
3. The signature is computed over that exact origin.
4. When the attacker forwards the signature to `example.com`, the server checks `clientDataJSON.origin`, detects the mismatch (`examp1e.com` != `example.com`), and rejects the authentication instantly.
