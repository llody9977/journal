---
title: OAuth & OpenID Connect
description: OAuth 2.0 authorization and OpenID Connect authentication, Authorization Code with PKCE, token validation, lifecycle security, and advanced profiles.
permalink: /topics/oauth-oidc/
last_verified: 2026-08-13
---

<span class="eyebrow">Authentication & Authorization / Protocol</span>

# OAuth & OpenID Connect

<p class="lede">OAuth 2.0 lets a client obtain a credential for protected resources without giving the client the resource owner's password. It supports delegated user access, first-party clients, and machine authorization. OpenID Connect (OIDC) adds an authentication layer in which a client validates an ID Token and related response to establish an authenticated end-user session.</p>

## OAuth authorization and OIDC authentication have different audiences

| Boundary | OAuth 2.0 | OpenID Connect |
|---|---|---|
| **Question** | What authorized access can this client exercise at a resource server? | What authentication event and subject is the client relying on? |
| **Credential or assertion** | Access token: a protocol/profile-defined credential, which may be opaque or a structured token such as a JWT under an applicable profile. | ID Token: a JWT assertion intended for the client. |
| **Consumer** | Resource server. | Client acting as the relying party. |
| **Human required?** | No. Client Credentials and workload flows have no human resource owner. | Yes for the end-user authentication described by OIDC Core. |

An authorization server issues credentials after processing an authorization grant or client authorization. It does not necessarily authenticate a human—for example, Client Credentials represents the client's own authorization. A resource owner may be a person or another entity capable of granting access.

## Roles and trust boundaries

1. **Resource owner**: Entity capable of granting access to a protected resource; often, but not always, an end user.
2. **Client**: Application requesting access. Public clients cannot keep a client secret; confidential clients can authenticate using an appropriate method such as a secret, private-key JWT, or mTLS.
3. **Authorization server**: Issues access tokens after evaluating the grant, client, policy, and requested resource/scope.
4. **Resource server**: Accepts and validates access tokens and independently enforces authorization.
5. **OpenID Provider**: In OIDC, the authorization server that authenticates the end user and issues an ID Token to the client.

## Authorization Code with PKCE

**[RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html)** requires PKCE for public clients using Authorization Code and recommends it for confidential clients. OAuth 2.1 is still an Internet-Draft; its consolidated defaults are useful design context but are not a final RFC.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/oauth-auth-code-flow.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the OAuth authorization code with PKCE flow at full size">
    <img src="{{ '/assets/img/oauth-auth-code-flow.svg' | relative_url }}" alt="OAuth Authorization Code with PKCE flow: the client creates a verifier and challenge, sends the user through the authorization endpoint, receives a code, proves possession of the verifier at the token endpoint, and calls the resource server with the access token.">
  </a>
  <p class="diagram-caption">PKCE binds code redemption to possession of the verifier that corresponds to the authorization request's challenge.</p>
</div>

The client creates a high-entropy verifier of 43–128 unreserved characters and sends `BASE64URL(SHA-256(verifier))` as the `S256` challenge. At the token endpoint, the authorization server recomputes the challenge from the verifier before accepting the code. PKCE does not authenticate the client's organizational identity; it prevents a party that intercepts only the code from redeeming it.

For OIDC, add `scope=openid`, a nonce when required by the flow/threat model, and complete ID Token validation. Do not relabel a pure OAuth authorization flow as “login” merely because the same authorization server also supports OIDC.

## Token format and validation boundaries

- **Opaque access token**: The resource server normally validates it through local state or authorization-server introspection.
- **JWT access token**: The resource server validates it under a defined profile such as RFC 9068, including an explicit algorithm allowlist and the profile's issuer, audience, time, type, client, subject, and authorization semantics.
- **ID Token**: The client validates it under OIDC Core. It is not an access token and must not be presented to an API as one.
- **Refresh token**: A credential used only at the token endpoint to obtain replacement access tokens. Its storage, rotation, sender constraint, revocation, and reuse detection are separate controls.

JWT libraries must not choose trust policy from attacker-controlled token headers. Pin accepted issuers, keys/key sources, algorithms, token types, and audiences from configuration and the governing profile.

### Runnable JWS integrity demonstration

This toy example creates and verifies an HS256 JWS using an illustrative key. It proves only that the compact token was not modified by someone lacking that key; it is not a production JWT validator.

```python
import base64
import hashlib
import hmac
import json
import time

def encode(value):
    return base64.urlsafe_b64encode(value).rstrip(b"=")

def decode(value):
    return base64.urlsafe_b64decode(value + b"=" * (-len(value) % 4))

illustrative_key = b"local-demo-key-do-not-use-in-production"
now = int(time.time())
header = encode(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
payload = encode(json.dumps({
    "iss": "https://issuer.example/",
    "sub": "user_12345",
    "aud": "https://api.example/",
    "iat": now,
    "exp": now + 300
}, separators=(",", ":")).encode())
signing_input = header + b"." + payload
signature = encode(hmac.new(illustrative_key, signing_input, hashlib.sha256).digest())
token = signing_input + b"." + signature

h_b64, p_b64, supplied_signature = token.split(b".")
expected_signature = encode(hmac.new(
    illustrative_key, h_b64 + b"." + p_b64, hashlib.sha256
).digest())
claims = json.loads(decode(p_b64))

print("Signature valid:", hmac.compare_digest(expected_signature, supplied_signature))
print("Illustrative time check valid:", claims["iat"] <= now < claims["exp"])
# Output:
# Signature valid: True
# Illustrative time check valid: True
```

Base64url is encoding, not encryption. A token holder, client, intermediary that sees the token, or party with log access can decode JWS claims. TLS limits passive network observation while the token is transported; it does not make the claims secret from token participants. JWE can provide encryption for an intended recipient, but sensitive claims should still be minimized, and passwords or reusable secrets never belong in token claims.

## Authorization-flow security checklist

1. **Match redirect URIs exactly** and reject open redirectors. Bind authorization response state to the initiating browser session and intended redirect.
2. **Use PKCE and a CSRF defense**. `state` is the broadly applicable mechanism. RFC 9700 permits PKCE to provide CSRF protection when support is assured and the transaction binding is implemented correctly; OIDC nonce provides another protocol-specific correlation check. Document which mechanism is authoritative and test it.
3. **Prevent mix-up** by validating the authorization-server issuer in the response or using another standardized issuer-identification mechanism, especially when one client talks to multiple issuers.
4. **Validate ID Tokens completely**: issuer, audience and authorized party where applicable, signature/algorithm, expiration, nonce, authentication time/context when requested, and flow-specific hash claims.
5. **Validate access tokens at the resource server** according to format and profile; never infer authorization from successful signature verification alone.
6. **Rotate and revoke**: use short access-token lifetimes appropriate to the threat model; protect refresh tokens, use rotation or sender constraints for public clients where specified, detect reuse, and support revocation or introspection where required.
7. **Operate discovery and keys safely**: pin expected issuers, validate metadata consistency, cache JWKS within policy, handle planned key overlap, and fail safely when an unknown key or issuer appears.
8. **Separate session lifecycle**: define application logout, authorization-server session behavior, token revocation, back/front-channel logout where used, and what happens to active API credentials.
9. **Retire unsafe grants**: do not use the implicit grant or Resource Owner Password Credentials grant for new designs. Avoid embedding clients in hostile user agents when a system browser and claimed HTTPS redirect or loopback mechanism is available.

## Advanced profiles solve narrower risks

| Profile or extension | Purpose | Selection boundary |
|---|---|---|
| **PAR (RFC 9126)** | Sends authorization-request parameters directly to the authorization server and uses a request URI at the browser endpoint. | Reduces front-channel request exposure and enables server-side validation; it does not replace redirect and response validation. |
| **JAR (RFC 9101)** | Protects authorization-request parameters in a signed and optionally encrypted JWT. | Use when request integrity, authentication, or confidentiality requirements justify the added key lifecycle. |
| **JARM** | Protects the authorization response in a signed and optionally encrypted JWT response mode. | Common in financial-grade profiles; clients must still validate issuer, audience, state, code, and JWT protection. |
| **FAPI 2.0 Security Profile** | Defines a high-security interoperable OAuth profile using constrained choices and additional protections. | Adopt the complete conformance profile rather than selecting isolated controls and claiming FAPI compliance. |
| **Device Authorization Grant (RFC 8628)** | Supports input-constrained devices through a separate user interaction and polling client. | Enforce user-code protections, polling interval, expiry, and phishing-resistant user authorization where possible. |
| **CIBA** | Supports decoupled user authentication initiated without a browser redirect on the consumption device. | Requires explicit consent/context display, transaction correlation, and protection against approval phishing. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>OAuth access tokens are credentials for resource servers; OIDC ID Tokens are authentication assertions for clients. Secure deployment requires more than a valid signature: bind the authorization transaction, validate the applicable token profile, operate refresh and key lifecycles, and choose advanced profiles only as complete solutions to their stated risks.</p>
</div>

## Primary references

- **[RFC 6749: The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749.html)** — verified roles, grants, clients, and access-token boundaries.
- **[RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html)** — verified PKCE, CSRF, redirect, mix-up, refresh-token, and deprecated-flow guidance.
- **[OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)** — verified OIDC roles, ID Token claims, nonce, authentication context, and validation.
- **[OAuth 2.1 Internet-Draft 15](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/15/)** — verified its current draft status and consolidated protocol direction.
- **[RFC 9068: JWT Profile for OAuth 2.0 Access Tokens](https://www.rfc-editor.org/rfc/rfc9068.html)** — verified structured access-token validation requirements.
- **[RFC 9126: Pushed Authorization Requests](https://www.rfc-editor.org/rfc/rfc9126.html)** and **[RFC 9101: JWT-Secured Authorization Request](https://www.rfc-editor.org/rfc/rfc9101.html)** — verified the advanced request-protection profiles.
- **[OpenID FAPI 2.0 Security Profile](https://openid.net/specs/fapi-security-profile-2_0-final.html)** — verified the current financial-grade profile boundary.
- **[RFC 8628: OAuth 2.0 Device Authorization Grant](https://www.rfc-editor.org/rfc/rfc8628.html)** and **[OpenID CIBA Core](https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0-final.html)** — verified device and decoupled authorization flows.
