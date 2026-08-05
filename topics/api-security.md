---
title: Machine-to-Machine API Authentication
description: My notes on API keys, OAuth client credentials, mTLS, proof-of-possession, and signed requests.
permalink: /topics/api-security/
last_verified: 2026-08-05
---

<span class="eyebrow">Authentication & Authorization / Decision Guide</span>

# Machine-to-Machine API Authentication

<p class="lede">I keep this page narrowly scoped to authenticating service-to-service calls, scheduled jobs, CLI tools, and webhooks. API security is much broader: it also includes object and function authorization, input validation, rate limits, inventory, business-logic abuse, and safe use of third-party APIs. I use the <a href="https://owasp.org/API-Security/">OWASP API Security Top 10</a> for that wider checklist.</p>

## API keys: the simplest, and weakest, option

An API key is a static secret string sent with every request (a header or query parameter), identifying — and sometimes authenticating — the caller. They're popular because they're trivial to implement, and risky for exactly the same reason:

- **No expiry by default** — a key generated once often works forever unless someone deliberately revokes it.
- **Easy to leak** — committed to a public repo, printed in logs, bundled into client-side JavaScript or a mobile app where anyone can extract it.
- **Coarse-grained** — frequently all-or-nothing access rather than scoped permissions.
- **Hard to rotate safely** — rotating a key that's hardcoded in a dozen places tends to mean an outage unless the system supports two valid keys simultaneously during rollover.

High-entropy API keys do not need a deliberately slow password hash. A common design is to give the key a non-secret identifier/prefix for lookup, then store a fast cryptographic hash or, preferably, an HMAC under a server-side secret and compare in constant time. Slow Argon2/bcrypt mainly adds denial-of-service cost here because a properly generated API key is already outside a human password dictionary. I should still scope keys narrowly, avoid logging them, and support overlapping keys during rotation.

## OAuth's Client Credentials grant: machine-to-machine OAuth

When both parties are services (no user, no browser, no redirect), OAuth 2.0 has a purpose-built grant type: the client sends its `client_id` and `client_secret` directly to the Authorization Server and receives an access token back — a much shorter version of the [Authorization Code flow]({{ '/topics/oauth-oidc/' | relative_url }}#the-authorization-code-flow-with-pkce), since there's no user consent step to orchestrate. The `client_secret` still needs to be protected exactly like a password — this grant only makes sense between two systems that can each keep a secret safely. It also has a specific weakness worth naming directly: unlike the user-facing flow, there's no human present to answer a [step-up challenge]({{ '/topics/step-up-authentication/' | relative_url }}) if something looks wrong. [The section below](#closing-the-impersonation-gap-in-machine-to-machine-auth) covers what actually substitutes for that.

## Mutual TLS (mTLS): both sides prove who they are

The [TLS handshake]({{ '/topics/tls-ssl-handshake/' | relative_url }}) only authenticates the server by default. **mTLS** extends the same handshake so the client presents a certificate too:

<div class="diagram-frame">
  <img src="{{ '/assets/img/mtls-flow.svg' | relative_url }}" alt="Diagram showing mutual TLS: the server presents its certificate as in a normal TLS handshake, and the client also presents its own certificate, which the server validates the same way a browser validates a server's certificate." >
  <p class="diagram-caption">Same certificate validation logic, running in both directions</p>
</div>

mTLS is one common building block in **service mesh** and **zero-trust** architectures. A deployment can give each workload a short-lived certificate from an internal [private CA]({{ '/topics/certificates/' | relative_url }}#public-vs-private-ca-side-by-side), then authenticate both ends of an internal connection without a shared application secret. Authorization is still separate: a valid workload certificate does not decide which operation that workload may perform.

## Signed requests and webhooks: similar goal, different schemes

These products all authenticate messages, but I should not describe them as one identical “HMAC over the entire request” construction:

- **[AWS Signature Version 4](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv-create-signed-request.html)** derives a scoped signing key and HMACs a string containing a canonical request hash, credential scope, and timestamp.
- **[Stripe webhooks](https://docs.stripe.com/webhooks/signature)** HMAC the timestamp and raw request payload using the endpoint secret. The receiver checks the signature and timestamp tolerance.
- **[Shopify webhooks](https://shopify.dev/docs/apps/build/webhooks/subscribe/https#step-5-verify-the-webhook)** HMAC the raw request body with the app client secret. Shopify documents `X-Shopify-Event-Id` for duplicate detection; the HMAC itself is not a generic canonical-request timestamp scheme.
- **[PayPal webhooks](https://developer.paypal.com/api/rest/webhooks/rest/)** use an asymmetric signature and certificate. Verification incorporates transmission ID, timestamp, webhook ID, and the body CRC32; it is not HMAC.

AWS's actual scheme is worth walking through once, because "sign with the secret key" undersells it — SigV4 never uses the raw secret access key directly. It derives a one-time-per-day, per-region, per-service **signing key** first, through a chain of nested HMACs, so the long-term secret never has to be reused for the final signature at all:

```
$ python3 -c "
import hmac, hashlib

def hmac_sha256(key, msg):
    return hmac.new(key, msg.encode(), hashlib.sha256).digest()

secret_key = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'  # AWS's own published example key
date, region, service = '20260725', 'us-east-1', 's3'

date_key                = hmac_sha256(('AWS4' + secret_key).encode(), date)
date_region_key         = hmac_sha256(date_key, region)
date_region_service_key = hmac_sha256(date_region_key, service)
signing_key             = hmac_sha256(date_region_service_key, 'aws4_request')

print('DateKey:              ', date_key.hex())
print('DateRegionKey:        ', date_region_key.hex())
print('DateRegionServiceKey: ', date_region_service_key.hex())
print('SigningKey:           ', signing_key.hex())
"
DateKey:               2f7d7408029d7b909bb2a4ffdaf77438f28392cc9298f26240c8c6cc87c1c0c6
DateRegionKey:         5587d7674299f451bd33533e358c3cc359af8495fbf7562429709fc47fe4d113
DateRegionServiceKey:  a722a1f7e186d55b4bfb5818e6e3e5f169f3b37fccbb133c9d6732d1297d57e4
SigningKey:            bd0362926643f0268045315543c2cfc7142516ffad906eefb3ea258bed14a9b2
```

That `SigningKey` — not the original secret access key — is what actually HMACs the request's canonical form (method, URI, headers, and a hash of the body, joined into one string per [AWS's own specification](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html)) to produce the signature that lands in the request's `Authorization` header. Because the signing key is scoped to one day/region/service, a signing key derived for `20260725/us-east-1/s3` is worthless for signing a request to a different service or a different day — narrowing exactly what a single leaked derived key (as opposed to the actual long-term secret) is good for.

Changing signed bytes makes verification fail under the corresponding scheme. This is the **opposite** of the unauthenticated CBC bit-flipping demo, where the modification succeeds precisely because there is no tag. Replay controls are scheme-specific: timestamps narrow a window; event IDs/nonces plus durable deduplication prevent repeated processing; a signature alone does not make a message unique.

## Closing the impersonation gap in machine-to-machine auth

A stolen `client_id`/`client_secret` pair — or a stolen bare API key, or a stolen bearer token — *is* the service's identity to whoever holds it, indistinguishably from the real client. In the user-facing [Authorization Code flow]({{ '/topics/oauth-oidc/' | relative_url }}#the-authorization-code-flow-with-pkce), a login from a new device or an unusual location can still be met with a [step-up challenge]({{ '/topics/step-up-authentication/' | relative_url }}) — MFA, a re-auth prompt, a risk-based check — because a human is present to answer one. Client Credentials has no equivalent: there's nobody to challenge, so the credential alone is the entire proof of identity, and a leak (checked into a repo, exposed in a build log, exfiltrated from a compromised host) hands over full impersonation with nothing else asked of the attacker.

Three real mechanisms close this gap by removing the shared secret from the picture entirely, rather than trying to bolt on a "step-up" with no human to prompt:

- **mTLS-bound access tokens** ([RFC 8705](https://www.rfc-editor.org/rfc/rfc8705)) — the client authenticates with its own TLS client certificate (the [mTLS pattern above](#mutual-tls-mtls-both-sides-prove-who-they-are)) instead of a `client_secret`, and the issued access token is cryptographically bound to that certificate. A stolen bearer token alone is now useless — the resource server checks the token against the TLS certificate actually presented on the connection, not just the token string, so replaying it from anywhere else fails.
- **`private_key_jwt` client authentication** ([RFC 7523](https://www.rfc-editor.org/rfc/rfc7523); adopted for OAuth/OIDC clients in OpenID Connect Core §9) — the client signs a short-lived JWT assertion with its private key instead of sending a shared client secret. The private key does not cross the wire, but the assertion itself can be replayed within its validity window unless the server validates issuer, subject, audience and expiry and enforces one-time `jti` use where required.
- **DPoP (Demonstrating Proof-of-Possession)** ([RFC 9449](https://www.rfc-editor.org/rfc/rfc9449)) — binds the *access token itself*, not just the initial client authentication step, to a key pair the client holds, via a signed proof header attached to every API call. A token copied from a log or intercepted in transit can't be replayed by anyone who doesn't also hold the private key it was bound to.

Where none of these are in reach, the fallback is limiting what a leaked secret is actually worth: short-lived, frequently-rotated secrets stored in a vault or KMS rather than a config file or repo (see [HSM & KMS]({{ '/topics/hsm-kms/' | relative_url }})), the narrowest scope the integration can function with, and monitoring for anomalous use of a given `client_id` — an unexpected source IP range, an unusual call volume, activity outside normal hours — as the closest available substitute for a human-facing risk check.

## Comparing the options

| Method | Mutual auth? | Replay protection? | Best fit |
|---|---|---|---|
| API key | No (identifies, doesn't always authenticate) | No | Low-stakes, easy integration; public/free-tier APIs |
| OAuth Client Credentials | Client authenticates to authorization server | Bearer token remains replayable until expiry unless sender-constrained | Service-to-service calls through a central identity provider |
| mTLS | Yes, both directions | TLS protects records on a connection; the application must still make operations idempotent where needed | Internal service mesh, zero-trust networks |
| HMAC request signing | One-directional, but tamper-evident per request | Only when the scheme signs freshness data and the receiver enforces timestamp/nonce/event-ID checks | Webhooks, signed API requests crossing untrusted infrastructure |

## Real-world case: T-Mobile's API exposure (2023)

In January 2023, T-Mobile disclosed that a bad actor had obtained names, billing addresses, emails, phone numbers, dates of birth, account numbers, and other limited account data for roughly 37 million customer accounts through a single API. T-Mobile said the actor first retrieved data around 25 November 2022, that it identified the activity on 5 January 2023, and that it traced and stopped the activity within a day.

The company's [Form 8-K](https://www.sec.gov/Archives/edgar/data/1283699/000119312523010949/d641142d8k.htm) says the data was obtained “without authorization”, but does not say whether that meant missing authentication, a stolen credential, an authorization flaw, or another control failure. I therefore cannot claim that every authentication method in this table would have stopped the actor. The defensible lesson is narrower: every endpoint needs tested authentication **and authorization**, least privilege, enumeration resistance, rate limits, anomaly detection, and data-minimization controls.

## Common pitfalls

- **Shipping a real secret to a client that can't keep one** — any API key or secret embedded in a mobile app, browser JS bundle, or public repository should be treated as already public.
- **No replay protection on signed requests** — a valid signed request captured once and replayed later succeeds unless a timestamp or nonce is checked and enforced.
- **Treating HTTPS as sufficient authentication** — TLS protects the channel; it says nothing about who's on the other end of a plain API-key request unless the key itself is also validated properly.
- **No key/secret rotation plan** — the same lesson as [HSM & KMS]({{ '/topics/hsm-kms/' | relative_url }}#common-pitfalls): rotation that requires simultaneous cutover across every caller basically never happens on schedule.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.rfc-editor.org/rfc/rfc6749#section-4.4">RFC 6749 §4.4</a></strong> defines Client Credentials; <strong><a href="https://www.rfc-editor.org/rfc/rfc8705">RFC 8705</a></strong> defines OAuth mTLS; <strong><a href="https://www.rfc-editor.org/rfc/rfc7523">RFC 7523</a></strong> defines JWT assertions; and <strong><a href="https://www.rfc-editor.org/rfc/rfc9449">RFC 9449</a></strong> defines DPoP. The examples above cite the official <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv-create-signed-request.html">AWS</a>, <a href="https://docs.stripe.com/webhooks/signature">Stripe</a>, <a href="https://shopify.dev/docs/apps/build/webhooks/subscribe/https#step-5-verify-the-webhook">Shopify</a>, and <a href="https://developer.paypal.com/api/rest/webhooks/rest/">PayPal</a> verification documentation. The <a href="https://owasp.org/API-Security/">OWASP API Security Top 10</a> covers the wider API-security scope outside authentication.</p>
</div>
