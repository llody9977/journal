---
title: Keys vs Secrets, Certificates & Tokens
description: A selection boundary for cryptographic keys, arbitrary secrets, certificates, and issued tokens, including where each object belongs and how its lifecycle differs.
permalink: /topics/keys-vs-secrets-certificates-tokens/
last_verified: 2026-08-10
---

<span class="eyebrow">Key Management / Boundaries</span>

# Keys vs Secrets, Certificates & Tokens

<p class="lede">Keys, secrets, certificates, and tokens can all be sensitive, but they solve different problems. Store and rotate the object according to its semantics: cryptographic keys perform algorithms, secret values are retrieved by consumers, certificates bind public keys to identities, and tokens carry or reference delegated authorization.</p>

## Identify the object before selecting the service

| Object | What it is | Normal system of record | Core lifecycle event |
|---|---|---|---|
| **Cryptographic key** | Secret, private, or public parameter used by a cryptographic algorithm | KMS or HSM for high-value secret/private keys; controlled repositories for public keys | Generate or establish, activate, rotate, revoke or deactivate, recover where justified, destroy. |
| **Secret** | Arbitrary confidential value retrieved for use, such as a database password, API key, or webhook secret | Secrets manager or a platform credential facility | Create, distribute at runtime, rotate value and consumer configuration, revoke, delete. |
| **Certificate** | Signed data that binds a public key to a subject and constraints | Certificate authority and certificate-management system; private key remains in its key boundary | Enroll, issue, deploy, renew or rekey, revoke, expire, retain status and chain evidence. |
| **Token** | Issued credential or assertion carrying or referencing authorization and related claims | Authorization server or Security Token Service (STS); consumers usually cache only for its short lifetime | Issue, validate, expire, refresh or exchange, revoke where supported. |

These are functional boundaries. A provider may offer several functions in one product, and the implementation may store one object inside another system.

## Put cryptographic keys where operations can be constrained

Use a KMS or HSM when the application needs encrypt, decrypt, sign, MAC, wrap, unwrap, derive, or key-establishment operations and raw key export should be limited. The service should enforce purpose, allowed algorithms, caller identity, lifecycle state, and audit.

A KMS is not automatically the right place for every sensitive string. Treating a database password as an opaque “key” can lose secret-version rollout features and still requires the application to retrieve the password. Conversely, placing a signing private key in a general secrets store exposes raw material to every authorized reader instead of offering a constrained sign operation.

## Rotate secrets with their consumers

A secret manager normally returns the plaintext value to an authorized workload. Rotation therefore has two coordinated parts:

1. change the credential at the target system or issuer; and
2. update consumers so they retrieve and use the new version.

During transition, old and new values may coexist. The rotation is incomplete until telemetry shows the old credential is no longer accepted or used. This differs from transparent KMS key-material rotation, where a stable KMS identifier may select the correct retained version during decryption.

Prefer dynamically issued, short-lived credentials when the target supports them. A long-lived API key in a secrets manager is better controlled than one in source code, but it remains a replayable bearer secret after retrieval.

## Manage certificates and private keys as linked but separate objects

An X.509 certificate is normally public. Its integrity and chain matter, but its confidentiality does not. The corresponding private key is the sensitive cryptographic object and may remain in a KMS or HSM.

The certificate lifecycle includes identity validation, profile and extension constraints, issuance, deployment, renewal, revocation, expiration, chain building, and status publication. A certificate renewal may reuse the same key, while **rekeying** creates a new key pair. Those actions have different compromise and cryptoperiod consequences.

See [Certificate Authorities & Certificates]({{ '/topics/certificates/' | relative_url }}) for Public Key Infrastructure (PKI) mechanics and [HSM & KMS]({{ '/topics/hsm-kms/' | relative_url }}) for the private-key protection boundary.

## Treat tokens as issued, time-bounded authority

OAuth access tokens and STS credentials are normally outputs of an authorization system, not long-term secrets chosen by an application. The resource server validates token scope, audience, issuer, time, signature or introspection result, and other protocol-defined conditions.

Token signing or encryption keys belong in the authorization server's key-management boundary. The tokens themselves belong in short-lived client or service caches with protections appropriate to bearer or proof-of-possession semantics. Rotating a token-signing key requires publishing or distributing the new verification key while retaining the old public verification path until previously issued tokens expire or are otherwise invalidated.

See [OAuth & OpenID Connect]({{ '/topics/oauth-oidc/' | relative_url }}) and [Security Token Service]({{ '/topics/security-token-service/' | relative_url }}) for token issuance and validation.

## Use a short selection rule

1. **Does a workload need a cryptographic operation without receiving the raw secret/private key?** Use a KMS or HSM-backed service.
2. **Does a workload need to retrieve an arbitrary confidential value?** Use a secrets manager or dynamic credential issuer.
3. **Does a public key need a signed identity binding and validity status?** Use a CA and certificate-management system; protect the private key separately.
4. **Does a caller need short-lived delegated authority?** Use an authorization server or STS and validate the token at the resource boundary.

Cross-system references should be explicit. A certificate record should point to its private-key ID; a token issuer should point to its signing-key version; a secret should identify its target system and consumers; encrypted data should identify its KMS key and version.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Choose the system from the object's behavior: keys perform constrained cryptographic operations, secrets are retrieved, certificates bind public keys to identities, and tokens convey issued authority. Their rotation workflows differ, even when one product stores several of them.</p>
</div>

## Primary references

- **[NIST SP 800-57 Part 1 Rev. 5: Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)** — verified cryptographic key types, purposes, lifecycle, and protection differences.
- **[RFC 5280: Internet X.509 Public Key Infrastructure Certificate and CRL Profile](https://www.rfc-editor.org/rfc/rfc5280)** — verified certificate structure, validity, public-key binding, and revocation mechanisms.
- **[RFC 6749: The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749)** — verified access-token issuance, scope, expiry, refresh, and resource-server use in OAuth 2.0.
- **[NIST SP 800-63C-4: Federation and Assertions](https://pages.nist.gov/800-63-4/sp800-63c.html)** — verified current NIST federation, assertion, and relying-party lifecycle concepts.

