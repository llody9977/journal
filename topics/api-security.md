---
title: Machine-to-Machine API Authentication
description: API keys, OAuth client authentication, mTLS, HMAC request signing, AWS SigV4, DPoP, sender constraints, rotation, and workload selection.
permalink: /topics/api-security/
last_verified: 2026-08-13
---

<span class="eyebrow">Authentication & Authorization / Decision Guide</span>

# Machine-to-Machine API Authentication

<p class="lede">Machine-to-machine authentication identifies an automated caller and protects the credential used to reach an API. It may use bearer credentials, client-authenticated token issuance, certificate-bound tokens, proof-of-possession tokens, or signed requests. No mechanism replaces resource-level authorization, credential rotation, replay policy, and workload lifecycle management.</p>

## Compare mechanisms by what the API verifies

| Pattern | What proves the caller | Sender-constrained? | Main failure boundary |
|---|---|---|---|
| **API key** | Possession of a static identifier/secret accepted by the API. | Usually no. | Repository/log leakage and indefinite reuse unless expiry, scope, and rotation are added. |
| **OAuth Client Credentials** | The authorization server authenticates the client using an allowed method—such as client secret, `private_key_jwt`, or mTLS—and issues an access token for the client's own authorization. | The access token is bearer unless a sender-constrained profile is used. | Client-key/secret compromise, over-broad token audience or scope, and weak resource-server validation. |
| **mTLS client authentication** | The TLS peer proves possession of the private key for an accepted client certificate. | The connection is mutually authenticated, but an independently issued bearer token remains bearer. | PKI issuance/revocation and correct client identity mapping. |
| **mTLS certificate-bound access token** | RFC 8705 token confirmation binds the token to the client certificate; the resource server matches it on each request. | Yes. | Incorrect certificate-thumbprint enforcement or compromise of the bound private key/client endpoint. |
| **HMAC request signing** | A MAC over a canonicalized request proves possession of a shared signing secret. | Bound to the covered request fields. | Canonicalization differences, shared-secret disclosure, unsigned fields, and replay unless freshness and duplicate detection are enforced. |
| **DPoP-bound access token** | A `DPoP` HTTP header carries a signed proof JWT; the resource server matches its key to the token confirmation claim and request. | Yes. | Proof validation, endpoint/method binding, freshness window, nonce policy, and bound-key compromise. |

## Request signing needs explicit freshness and canonicalization

An HMAC or asymmetric signature detects modification of the fields included in its canonical input. Replay resistance is separate. Define which method, path, query, headers, body digest, timestamp, nonce, and credential identifier are signed; define normalization identically at both endpoints; enforce a bounded clock window; and track duplicates when the threat model requires single use.

### AWS Signature Version 4 key derivation

SigV4 derives a signing key scoped to a date, region, and service. That derived key can sign multiple requests in its scope; it is not single-use. The following runnable example demonstrates only key derivation, not canonical-request construction or final request signing:

```python
import hashlib
import hmac

def hmac_sha256(key, message):
    return hmac.new(key, message.encode(), hashlib.sha256).digest()

secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"  # AWS documentation example
date, region, service = "20260813", "us-east-1", "s3"

k_date = hmac_sha256(("AWS4" + secret_key).encode(), date)
k_region = hmac_sha256(k_date, region)
k_service = hmac_sha256(k_region, service)
k_signing = hmac_sha256(k_service, "aws4_request")

print(len(k_signing), k_signing.hex())
# Output invariant: 32 bytes and 64 lowercase hexadecimal characters.
```

A full SigV4 implementation also constructs a canonical request, hashes it, creates a credential-scoped string to sign, calculates the signature, and sends signed headers. Use the cloud SDK where possible because canonicalization edge cases are security- and interoperability-sensitive.

## DPoP and mTLS bind tokens differently

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/sender-constrained-tokens.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the sender-constrained token comparison at full size">
    <img src="{{ '/assets/img/sender-constrained-tokens.svg' | relative_url }}" alt="Comparison of RFC 8705 certificate-bound access tokens, which are matched to the request's TLS client certificate, and RFC 9449 DPoP-bound access tokens, which are matched to a signed per-request proof JWT.">
  </a>
  <p class="diagram-caption">mTLS client authentication and mTLS token binding are distinct; DPoP carries application-layer proof in the DPoP header.</p>
</div>

For DPoP, validate proof signature and key, `typ`, algorithm, HTTP method (`htm`), target URI (`htu`), issued-at time, unique identifier (`jti`) under the server's replay policy, access-token hash (`ath`) at the resource server, and server nonce when used. RFC 9449 requires an acceptance window for `iat`; nonce and duplicate-`jti` tracking provide stronger replay handling but are not universally mandatory. A captured proof may remain replayable to the same endpoint within the accepted window when stronger controls are absent.

For RFC 8705, distinguish:

1. **mTLS client authentication at the token endpoint**, which authenticates the OAuth client; and
2. **certificate-bound access tokens**, in which the authorization server records certificate binding and the resource server enforces the same certificate association.

Deploying the first does not automatically provide the second.

## Workload selection and lifecycle

1. Prefer platform/workload federation over distributed static secrets when a trustworthy workload identity is available. See **[Workload Identity Federation]({{ '/topics/workload-identity-federation/' | relative_url }})**.
2. Scope credentials to one workload, environment, resource, and minimum permission. Separate production from development identities.
3. Store private keys and secrets in workload-appropriate protected storage; prevent accidental logging and repository inclusion.
4. Automate issuance and rotation; document overlap, cache, revocation, and outage behavior. Short lifetime reduces but does not eliminate theft risk.
5. Validate authentication and authorization separately at every API path, including batch, queue consumer, webhook, administrative, and retry paths.
6. Observe failed proof validation, replay indicators, unusual audiences/scopes, stale credentials, signing-clock drift, and credential use from unexpected environments.
7. Test compromise and recovery: revoke or remove trust, rotate issuers and keys, invalidate caches, restore service, and prove the old credential no longer works.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>M2M security depends on the exact proof the API validates. Separate client authentication from token binding, request integrity from replay defense, and successful authentication from authorization; prefer short-lived federated workload credentials with tested rotation and revocation.</p>
</div>

## Primary references

- **[RFC 6749: Client Credentials Grant](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.4)** and **[RFC 7523: JWT Client Authentication](https://www.rfc-editor.org/rfc/rfc7523.html)** — verified client-authorization and client-authentication choices.
- **[RFC 8705: OAuth Mutual-TLS Client Authentication and Certificate-Bound Access Tokens](https://www.rfc-editor.org/rfc/rfc8705.html)** — verified the separation of mTLS client authentication and token binding.
- **[RFC 9449: OAuth DPoP](https://www.rfc-editor.org/rfc/rfc9449.html)** — verified proof construction, binding, freshness, nonce, and replay considerations.
- **[AWS Signature Version 4](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv-create-signed-request.html)** — verified signing-key scope and the full canonical-request signing sequence.
