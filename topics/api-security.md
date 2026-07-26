---
title: API Security
description: API keys, OAuth client credentials, mutual TLS, and HMAC request signing — authenticating machine-to-machine calls.
permalink: /topics/api-security/
---

<span class="eyebrow">Authentication & Authorization / Deep Dive</span>

# API Security

<p class="lede"><a href="{{ '/topics/oauth-oidc/' | relative_url }}">OAuth & OpenID Connect</a> handles access delegated by a human, through a browser. The other common case — no human in the loop at all, just service-to-service calls, scheduled jobs, CLI tools, and integrations — needs a different set of tools entirely.</p>

## API keys: the simplest, and weakest, option

An API key is a static secret string sent with every request (a header or query parameter), identifying — and sometimes authenticating — the caller. They're popular because they're trivial to implement, and risky for exactly the same reason:

- **No expiry by default** — a key generated once often works forever unless someone deliberately revokes it.
- **Easy to leak** — committed to a public repo, printed in logs, bundled into client-side JavaScript or a mobile app where anyone can extract it.
- **Coarse-grained** — frequently all-or-nothing access rather than scoped permissions.
- **Hard to rotate safely** — rotating a key that's hardcoded in a dozen places tends to mean an outage unless the system supports two valid keys simultaneously during rollover.

Done properly: store keys **hashed**, exactly the same way [Password Storage]({{ '/topics/password-storage/' | relative_url }}) recommends for passwords (a leaked database shouldn't hand out usable keys), scope each key as narrowly as the integration allows, and always support at least two active keys per client so rotation doesn't require simultaneous cutover.

## OAuth's Client Credentials grant: machine-to-machine OAuth

When both parties are services (no user, no browser, no redirect), OAuth 2.0 has a purpose-built grant type: the client sends its `client_id` and `client_secret` directly to the Authorization Server and receives an access token back — a much shorter version of the [Authorization Code flow]({{ '/topics/oauth-oidc/' | relative_url }}#the-authorization-code-flow-with-pkce), since there's no user consent step to orchestrate. The `client_secret` still needs to be protected exactly like a password — this grant only makes sense between two systems that can each keep a secret safely. It also has a specific weakness worth naming directly: unlike the user-facing flow, there's no human present to answer a step-up challenge if something looks wrong. [The section below](#closing-the-impersonation-gap-in-machine-to-machine-auth) covers what actually substitutes for that.

## Mutual TLS (mTLS): both sides prove who they are

The [TLS handshake]({{ '/topics/tls-ssl-handshake/' | relative_url }}) only authenticates the server by default. **mTLS** extends the same handshake so the client presents a certificate too:

<div class="diagram-frame">
  <img src="{{ '/assets/img/mtls-flow.svg' | relative_url }}" alt="Diagram showing mutual TLS: the server presents its certificate as in a normal TLS handshake, and the client also presents its own certificate, which the server validates the same way a browser validates a server's certificate." >
  <p class="diagram-caption">Same certificate validation logic, running in both directions</p>
</div>

This is the backbone of most **service mesh** and **zero-trust** architectures — every service gets its own short-lived certificate, usually issued by an internal [private CA]({{ '/topics/certificates/' | relative_url }}#public-vs-private-ca-side-by-side) (exactly the `step-ca` pattern demonstrated on the Certificates page), so that every internal call is authenticated without any shared secret at all.

## HMAC request signing

This pattern — sign the *entire request*, not just a token — is exactly what [**AWS's SigV4**](https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html) does on every single authenticated call to any AWS API, [**Stripe**](https://docs.stripe.com/webhooks) does on every webhook it sends, and [**Shopify**](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries) and [PayPal](https://developer.paypal.com/api/rest/webhooks/) do on theirs. It's the same [HMAC]({{ '/topics/hash-functions-macs/' | relative_url }}#macs-adding-a-key-to-prove-who-sent-it) construction covered under Hash Functions & MACs, applied to a canonical string built from the request itself rather than to an arbitrary message.

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

Stripe, Shopify, and PayPal's webhook signatures work on the same underlying idea with a flatter derivation (HMAC-SHA256 straight over the payload with a per-endpoint secret, timestamped to block replay) — the AWS version above is simply the most elaborate real-world instance of "HMAC over a canonical request," not a different idea. Changing any signed field after the fact — the transfer amount, the request path, the timestamp — breaks the signature exactly like the [CBC bit-flipping]({{ '/topics/symmetric-mode-attacks/' | relative_url }}) and [JWT tampering]({{ '/topics/oauth-oidc/' | relative_url }}#jwts-are-signed-not-encrypted--a-real-demo) demos above, and a timestamp check (present in all four schemes above) catches a valid signed request being replayed later, which neither a bare API key nor a bare OAuth bearer token protects against on its own.

## Closing the impersonation gap in machine-to-machine auth

A stolen `client_id`/`client_secret` pair — or a stolen bare API key, or a stolen bearer token — *is* the service's identity to whoever holds it, indistinguishably from the real client. In the user-facing [Authorization Code flow]({{ '/topics/oauth-oidc/' | relative_url }}#the-authorization-code-flow-with-pkce), a login from a new device or an unusual location can still be met with a step-up challenge — MFA, a re-auth prompt, a risk-based check — because a human is present to answer one. Client Credentials has no equivalent: there's nobody to challenge, so the credential alone is the entire proof of identity, and a leak (checked into a repo, exposed in a build log, exfiltrated from a compromised host) hands over full impersonation with nothing else asked of the attacker.

Three real mechanisms close this gap by removing the shared secret from the picture entirely, rather than trying to bolt on a "step-up" with no human to prompt:

- **mTLS-bound access tokens** ([RFC 8705](https://www.rfc-editor.org/rfc/rfc8705)) — the client authenticates with its own TLS client certificate (the [mTLS pattern above](#mutual-tls-mtls-both-sides-prove-who-they-are)) instead of a `client_secret`, and the issued access token is cryptographically bound to that certificate. A stolen bearer token alone is now useless — the resource server checks the token against the TLS certificate actually presented on the connection, not just the token string, so replaying it from anywhere else fails.
- **`private_key_jwt` client authentication** ([RFC 7523](https://www.rfc-editor.org/rfc/rfc7523); adopted for OAuth/OIDC clients in OpenID Connect Core §9) — the client signs a short-lived JWT assertion with its own private key and sends that instead of a `client_secret`. Nothing secret ever crosses the wire — the Authorization Server only needs the client's public key, registered in advance. A full network capture of the request reveals nothing an attacker could reuse later.
- **DPoP (Demonstrating Proof-of-Possession)** ([RFC 9449](https://www.rfc-editor.org/rfc/rfc9449)) — binds the *access token itself*, not just the initial client authentication step, to a key pair the client holds, via a signed proof header attached to every API call. A token copied from a log or intercepted in transit can't be replayed by anyone who doesn't also hold the private key it was bound to.

Where none of these are in reach, the fallback is limiting what a leaked secret is actually worth: short-lived, frequently-rotated secrets stored in a vault or KMS rather than a config file or repo (see [HSM & KMS]({{ '/topics/hsm-kms/' | relative_url }})), the narrowest scope the integration can function with, and monitoring for anomalous use of a given `client_id` — an unexpected source IP range, an unusual call volume, activity outside normal hours — as the closest available substitute for a human-facing risk check.

## Comparing the options

| Method | Mutual auth? | Replay protection? | Best fit |
|---|---|---|---|
| API key | No (identifies, doesn't always authenticate) | No | Low-stakes, easy integration; public/free-tier APIs |
| OAuth Client Credentials | One-directional (client authenticates to server) | Via short token expiry | Service-to-service calls through a central identity provider |
| mTLS | Yes, both directions | N/A (per-connection) | Internal service mesh, zero-trust networks |
| HMAC request signing | One-directional, but tamper-evident per request | Yes, with timestamp/nonce | Webhooks, signed API requests crossing untrusted infrastructure |

## Real-world case: T-Mobile's unauthenticated API (2023)

In January 2023, T-Mobile disclosed that an attacker had pulled personal data — names, billing addresses, emails, phone numbers, dates of birth, account numbers — for roughly 37 million customer accounts, by hitting a single API endpoint continuously for about six weeks starting in late November 2022. T-Mobile detected and shut down the access within a day of noticing it, but by then the extraction had been running, undetected, for the better part of two months. The endpoint didn't require authentication at all to return account data for a given identifier — this wasn't a leaked API key or a forged token; there was no credential check in place to defeat in the first place.

Every mechanism compared in the table above — even the weakest one, a bare API key — would have stopped this specific attack, because all of them require *something* the attacker didn't have. [Coverage at the time](https://www.bleepingcomputer.com/news/security/t-mobile-hacked-to-steal-data-of-37-million-accounts-in-api-data-breach/) noted this was one of several T-Mobile breaches disclosed in recent years, which is its own lesson: API authentication isn't a one-time architecture decision made when an endpoint ships — it's a control that has to still be true on every endpoint, checked continuously, not assumed.

## Common pitfalls

- **Shipping a real secret to a client that can't keep one** — any API key or secret embedded in a mobile app, browser JS bundle, or public repository should be treated as already public.
- **No replay protection on signed requests** — a valid signed request captured once and replayed later succeeds unless a timestamp or nonce is checked and enforced.
- **Treating HTTPS as sufficient authentication** — TLS protects the channel; it says nothing about who's on the other end of a plain API-key request unless the key itself is also validated properly.
- **No key/secret rotation plan** — the same lesson as [HSM & KMS]({{ '/topics/hsm-kms/' | relative_url }}#common-pitfalls): rotation that requires simultaneous cutover across every caller basically never happens on schedule.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.rfc-editor.org/rfc/rfc6749#section-4.4">RFC 6749 Section 4.4</a></strong> defines the OAuth Client Credentials grant. <strong><a href="https://www.rfc-editor.org/rfc/rfc8705">RFC 8705</a></strong> defines mTLS-bound client authentication and access tokens. <strong><a href="https://www.rfc-editor.org/rfc/rfc7523">RFC 7523</a></strong> defines the JWT client-authentication assertion used by <code>private_key_jwt</code>. <strong><a href="https://www.rfc-editor.org/rfc/rfc9449">RFC 9449</a></strong> defines DPoP. <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html">AWS's own SigV4 documentation</a> details the canonical-request and key-derivation steps demonstrated above. The <a href="https://owasp.org/www-project-api-security/">OWASP API Security Top 10</a> is the standard practical checklist for this whole page's scope. <strong><a href="https://csrc.nist.gov/pubs/sp/800/63/b/final">NIST SP 800-63B</a></strong> covers authenticator/secret management generally.</p>
</div>

## Where this fits

Every mechanism here is a recombination of the same primitives: mTLS is [certificates]({{ '/topics/certificates/' | relative_url }}) and the [TLS handshake]({{ '/topics/tls-ssl-handshake/' | relative_url }}) applied in both directions, HMAC signing is [Hash Functions & MACs]({{ '/topics/hash-functions-macs/' | relative_url }}) applied to HTTP requests instead of generic messages, and OAuth Client Credentials is [OAuth & OpenID Connect]({{ '/topics/oauth-oidc/' | relative_url }}) without the human step. Securing an API is mostly about picking the right existing tool for who — or what — is actually on the other end of the connection.
