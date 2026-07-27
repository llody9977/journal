---
title: OAuth & OpenID Connect
description: Authentication vs authorization, the OAuth 2.0 authorization code flow with PKCE, and what OpenID Connect and JWTs actually prove.
permalink: /topics/oauth-oidc/
last_verified: 2026-07-26
---

<span class="eyebrow">Authentication & Authorization / Deep Dive</span>

# OAuth & OpenID Connect

<p class="lede">My first check is always whether I am solving authentication or delegated authorisation. OAuth 2.0 gives a client limited access to a resource; OpenID Connect adds an identity layer for the client. Using an access token as a generic “login token” is where the concepts get mixed up.</p>

## Authentication vs. authorization, precisely

| | Authentication (AuthN) | Authorization (AuthZ) |
|---|---|---|
| Question answered | *Who are you?* | *What are you allowed to do?* |
| Example | Logging in with a password or passkey | An app being allowed to read your calendar but not delete your emails |
| Standard | OpenID Connect | OAuth 2.0 |

OAuth 2.0 is fundamentally an **authorization** protocol — it was never designed to tell an application who a user is, only to let that application act on a user's behalf with limited, revocable permission. OpenID Connect (OIDC) is a thin identity layer built directly on top of OAuth 2.0, adding the authentication piece OAuth deliberately left out.

## The problem OAuth actually solves

Before OAuth existed, letting a third-party app "check your Gmail" or "post to your Twitter" meant literally handing that app your username and password. The app now had your full account access, forever, with no way to limit what it could touch or revoke it without changing your password everywhere else that used it too.

OAuth replaces the password with a **token**: narrowly scoped (e.g. "read calendar events" only), time-limited, and revocable without affecting anything else. Four roles are involved:

- **Resource Owner** — you, the user.
- **Client** — the third-party application requesting access.
- **Authorization Server** — issues tokens after you approve a request (e.g. Google's, Okta's, Auth0's login/consent screens).
- **Resource Server** — the API actually holding your data, which accepts the token as proof of permission.

## The Authorization Code flow, with PKCE

This is the flow that matters — nearly everything else in OAuth 2.0 is either a variant of this or a deprecated shortcut (see below):

<div class="diagram-frame">
  <img src="{{ '/assets/img/oauth-auth-code-flow.svg' | relative_url }}" alt="Sequence diagram of the OAuth Authorization Code flow with PKCE. The client exchanges the code and verifier for tokens; a confidential client also authenticates, while a public client has no client secret." >
  <p class="diagram-caption">The client never sees the password — only a scoped, revocable token</p>
</div>

**PKCE (Proof Key for Code Exchange)**, defined in [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), closes a specific gap: if an attacker intercepts the authorization code in step ③ (easier than it sounds on mobile, where redirects go through the OS rather than a private browser channel), they still can't redeem it for a token, because doing so requires the original `code_verifier` — a random secret the legitimate client generated at the very start and never transmitted anywhere except as a hashed `code_challenge`. OAuth 2.1 (the in-progress consolidation of OAuth 2.0 best practices) makes PKCE mandatory for every client type, not just ones that can't hold a secret.

**Access tokens** are short-lived and sent on every API call. **Refresh tokens** are longer-lived and used only to silently obtain a new access token when the old one expires, without re-prompting the user to log in again.

## Flows worth knowing about — because they're deprecated

- **Implicit flow** — returned the access token directly in the URL fragment after login, with no code exchange. URL fragments are not sent in HTTP requests and therefore do not normally appear in server logs or Referer headers. The real exposure includes browser history, scripts running in the page, token leakage through front-channel processing, and the inability to apply modern code-flow protections. OAuth 2.1 removes this grant.
- **Resource Owner Password Credentials (ROPC)** — the client collects the user's actual username and password and trades them directly for a token. This is precisely the anti-pattern OAuth was invented to eliminate, and it's deprecated for exactly that reason — it only ever made sense as a legacy migration path, never a target design.

## OAuth 1.0, 1.0a, 2.0, 2.1 — the version landscape

- **OAuth 1.0** (2007) required every single request to be individually signed (HMAC-SHA1 or RSA-SHA1) using a shared secret and a precise "signature base string" assembled from the HTTP method, URL, and parameters, normalized and sorted in an exact way. It didn't mandate TLS either. A session-fixation flaw in the original request-token step was found in 2009.
- **OAuth 1.0a** ([RFC 5849](https://www.rfc-editor.org/rfc/rfc5849), 2010) fixed that specific flaw with a callback-confirmation step. Both 1.0 and 1.0a are legacy today — not because the underlying cryptography broke, but because per-request signing was fragile to implement correctly. A single stray character in how a client normalized and sorted parameters before signing silently broke the signature, and chasing down why a signature didn't match was a routine source of real integration pain.
- **OAuth 2.0** ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), 2012) dropped mandatory per-request signing for **bearer tokens over mandatory TLS** — far simpler to implement, no signature base string to get wrong, at the cost of a different trust assumption: whoever holds the bearer token, however they got it, can use it, so the whole model now leans on TLS actually being in place and the token itself never leaking. This is the version essentially every current API and identity provider runs.
- **OAuth 2.1** remains an active IETF draft, not a published RFC. As of **2 March 2026**, the current version was [draft-ietf-oauth-v2-1-15](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/). It consolidates OAuth 2.0 and later security practice, including PKCE, exact redirect matching, and removal of Implicit and ROPC.

1.0a hasn't fully disappeared. X still documents [OAuth 1.0a User Context](https://docs.x.com/fundamentals/authentication/oauth-1-0a/overview) alongside OAuth 2.0, and some endpoint guides label 1.0a as legacy support. The exact requirement is endpoint-specific and changes over time — for example, X's [current v2 media-upload documentation](https://docs.x.com/x-api/media/upload-media) shows an OAuth 2.0 bearer token — so I should check the current integration guide instead of carrying an old platform-wide rule in my head.

There's no version field to inspect, so telling 1.0a from 2.0/2.1 in practice comes down to the shape of the request itself:

| Signal | OAuth 1.0/1.0a | OAuth 2.0 / 2.1 |
|---|---|---|
| Authorization header | `OAuth oauth_consumer_key="...", oauth_signature="...", oauth_timestamp="...", ...` | `Bearer <token>` |
| Per-request work | Every request individually signed | Token presented as-is, no per-request signature |
| Token acquisition | Request token → user authorizes → exchange for access token (three-legged) | Authorization Code or Client Credentials grant, generally two steps |

`oauth_signature` and `oauth_nonce` parameters anywhere in a request are the fastest tell that it's 1.0a, not 2.0.

## OpenID Connect: adding "who is this," on top

An OAuth access token only proves *an app has some permission* — it says nothing about the user's identity, and resource servers often can't even parse it (many are opaque strings, deliberately meaningless outside the authorization server). **OpenID Connect** adds a second, distinct token to solve this:

- **ID Token** — normally a signed JWT issued by the OpenID Provider. Core required claims include `iss`, `sub`, `aud`, `exp`, and `iat`; `email` and `name` are optional profile claims and are not guaranteed to be present. The client validates the signature and protocol claims using the provider metadata and keys.
- **UserInfo endpoint** — an API the client can call with the access token to fetch additional profile details not embedded in the ID token itself.

## A signed JWT is readable unless it is also encrypted

A JWT is a container format. It can be a signed/MACed JWS, an encrypted JWE, or an unsecured JWT where the algorithm is `none`. The common three-segment `header.payload.signature` form below is JWS: its header and payload are base64url-encoded, not encrypted, so anyone can read them.

```
$ python3 -c "
import json, base64
def b64url_decode(s): return base64.urlsafe_b64decode(s + '=' * (-len(s) % 4))
token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIiwiZW1haWwiOiJhbGljZUBleGFtcGxlLmNvbSIsImlhdCI6MTc1MzAwMDAwMCwiZXhwIjoxNzUzMDAzNjAwfQ.8CQ_V-1KiBB4ffZtzr0We4gQS-F5QZS7isQDvLMfsuE'
h, p, s = token.split('.')
print('header: ', json.loads(b64url_decode(h)))
print('payload:', json.loads(b64url_decode(p)))
"
header:  {'alg': 'HS256', 'typ': 'JWT'}
payload: {'sub': '1234567890', 'name': 'Alice', 'email': 'alice@example.com', 'iat': 1753000000, 'exp': 1753003600}
```

No key and no signature verification are needed to read these claims. Even where JWE is available, I should minimise sensitive token contents because tokens are copied through logs, clients, proxies, and debugging tools. A valid JWS signature/MAC makes unauthorised modification detectable; it does not hide the claims.

```
$ python3 -c "
import json, base64, hmac, hashlib

def b64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=')

def make_token(payload, secret):
    header = b64url(json.dumps({'alg':'HS256','typ':'JWT'}, separators=(',',':')).encode())
    body   = b64url(json.dumps(payload, separators=(',',':')).encode())
    sig    = b64url(hmac.new(secret, header+b'.'+body, hashlib.sha256).digest())
    return b'.'.join([header, body, sig]).decode()

def verify(token, secret):
    header, body, sig = token.encode().split(b'.')
    expected = b64url(hmac.new(secret, header+b'.'+body, hashlib.sha256).digest())
    return hmac.compare_digest(expected, sig)

secret = b'shared-signing-secret'
token = make_token({'sub': '1234567890', 'name': 'Alice'}, secret)

# attacker decodes the payload, edits the name, re-encodes -- but has no secret to re-sign with
header_b64, body_b64, sig_b64 = token.split('.')
forged_payload = json.loads(base64.urlsafe_b64decode(body_b64 + '=='))
forged_payload['name'] = 'Mallory'
forged_body_b64 = b64url(json.dumps(forged_payload, separators=(',',':')).encode()).decode()
tampered = '.'.join([header_b64, forged_body_b64, sig_b64])

print('original token valid:', verify(token, secret))
print('tampered token valid:', verify(tampered, secret))
"
original token valid: True
tampered token valid: False
```

Changing one field breaks verification because the attacker cannot compute a valid HMAC for the changed signing input without the key. This is an unforgeability property, not merely the hash avalanche effect. `HS256` is a symmetric MAC; `RS256` and `ES256` are asymmetric signatures. A verifier must pin/allow the intended algorithm and key source rather than trusting the token header to choose them.

## Real-world case: the Booking.com OAuth flaw (2022–2023)

In late 2022, researchers at Salt Labs privately disclosed a vulnerability chain in Booking.com's "Login with Facebook" OAuth integration that could lead to full account takeover — without breaking any cryptography at all. The issue was in how the OAuth flow's steps were wired together on Booking.com's side: by manipulating the sequence, an attacker could hijack the session resulting from a victim's legitimate Facebook login and take over the Booking.com account behind it, including the ability to view personal data and make or cancel bookings on the victim's behalf. Salt Labs followed coordinated disclosure — reporting the flaw to Booking.com in late November 2022, confirming a fix by January 2023, and [publishing the technical details](https://salt.security/blog/traveling-with-oauth-account-takeover-on-booking-com) only afterward, with no evidence the flaws were ever exploited in the wild.

Nothing about OAuth's cryptography failed here — the tokens involved were signed and validated exactly as designed. The gap was entirely in how the surrounding application handled the flow's steps and redirects, at a company processing logins for hundreds of millions of users. It's a useful, low-drama reminder (precisely because it was caught by researchers, not attackers) that OAuth implementation bugs — not weaknesses in OAuth's actual cryptography — are where real-world account-takeover risk concentrates, which is exactly why `state` validation and redirect handling are called out as pitfalls below rather than treated as boilerplate.

## Common pitfalls

- **Confusing the ID token with the access token** — the ID token proves identity to the *client*; it was never meant to be sent to a resource server as an API credential. Using it that way is a frequent real-world mistake.
- **Choosing token storage without the browser threat model** — `localStorage` exposes tokens to successful XSS. An `HttpOnly`, `Secure`, appropriately `SameSite` cookie keeps the token away from JavaScript but requires CSRF and cookie-scope controls. A backend-for-frontend design can keep OAuth tokens off the browser entirely.
- **Skipping `state` parameter validation** — `state` is OAuth's CSRF protection for the redirect step; omitting it lets an attacker bind their own authorization code to a victim's session.
- **Doing only signature and expiry checks** — validation also needs the expected issuer, audience, allowed algorithm, key, token type/use, and relevant time/nonce claims. An API must still authorise the requested action after validating the token.
- **Using the deprecated Implicit or ROPC flows** in new code, often copied from outdated tutorials.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.rfc-editor.org/rfc/rfc5849">RFC 5849</a></strong> defines OAuth 1.0a. <strong><a href="https://www.rfc-editor.org/rfc/rfc6749">RFC 6749</a></strong> defines OAuth 2.0. <strong><a href="https://www.rfc-editor.org/rfc/rfc6750">RFC 6750</a></strong> defines Bearer Token usage. <strong><a href="https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1">draft-ietf-oauth-v2-1</a></strong> is the in-progress OAuth 2.1 consolidation. <strong><a href="https://www.rfc-editor.org/rfc/rfc7636">RFC 7636</a></strong> defines PKCE. <strong><a href="https://www.rfc-editor.org/rfc/rfc7519">RFC 7519</a></strong> defines JWT. The <a href="https://openid.net/specs/openid-connect-core-1_0.html">OpenID Connect Core 1.0</a> specification defines OIDC itself.</p>
</div>

## How I connect this

The ID token's signature is exactly the [Digital Signatures]({{ '/topics/digital-signatures/' | relative_url }}) pipeline (hash, then sign; verify with the issuer's public key), and `HS256` tokens rely on the same [HMAC]({{ '/topics/hash-functions-macs/' | relative_url }}) construction covered under Hash Functions & MACs. The access tokens issued here are also exactly what [API Security]({{ '/topics/api-security/' | relative_url }}) covers using as bearer credentials for machine-to-machine calls.
