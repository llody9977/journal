---
title: OAuth & OpenID Connect
description: Authentication vs authorization, the OAuth 2.0 authorization code flow with PKCE, and what OpenID Connect and JWTs actually prove.
permalink: /topics/oauth-oidc/
---

<span class="eyebrow">Authentication & Authorization / Deep Dive</span>

# OAuth & OpenID Connect

<p class="lede">"Authentication" and "authorization" get used almost interchangeably in casual conversation, but they're answering two completely different questions — and OAuth 2.0 and OpenID Connect are, respectively, the industry-standard answer to each one.</p>

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
  <img src="{{ '/assets/img/oauth-auth-code-flow.svg' | relative_url }}" alt="Sequence diagram of the OAuth 2.0 Authorization Code flow with PKCE: the user asks to log in, the client generates a code verifier and challenge, the user authenticates directly with the Authorization Server and approves scopes, a one-time authorization code is returned via redirect, the client exchanges that code plus the verifier and client secret for an access token in a server-to-server call, and finally uses the access token as a bearer token to call the Resource Server API." >
  <p class="diagram-caption">The client never sees the password — only a scoped, revocable token</p>
</div>

**PKCE (Proof Key for Code Exchange)**, defined in [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), closes a specific gap: if an attacker intercepts the authorization code in step ③ (easier than it sounds on mobile, where redirects go through the OS rather than a private browser channel), they still can't redeem it for a token, because doing so requires the original `code_verifier` — a random secret the legitimate client generated at the very start and never transmitted anywhere except as a hashed `code_challenge`. OAuth 2.1 (the in-progress consolidation of OAuth 2.0 best practices) makes PKCE mandatory for every client type, not just ones that can't hold a secret.

**Access tokens** are short-lived and sent on every API call. **Refresh tokens** are longer-lived and used only to silently obtain a new access token when the old one expires, without re-prompting the user to log in again.

## Flows worth knowing about — because they're deprecated

- **Implicit flow** — returned the access token directly in the URL fragment after login, with no server-side exchange step. That token ends up in browser history, referrer headers, and server logs. Removed entirely in OAuth 2.1.
- **Resource Owner Password Credentials (ROPC)** — the client collects the user's actual username and password and trades them directly for a token. This is precisely the anti-pattern OAuth was invented to eliminate, and it's deprecated for exactly that reason — it only ever made sense as a legacy migration path, never a target design.

## OAuth 1.0, 1.0a, 2.0, 2.1 — the version landscape

- **OAuth 1.0** (2007) required every single request to be individually signed (HMAC-SHA1 or RSA-SHA1) using a shared secret and a precise "signature base string" assembled from the HTTP method, URL, and parameters, normalized and sorted in an exact way. It didn't mandate TLS either. A session-fixation flaw in the original request-token step was found in 2009.
- **OAuth 1.0a** ([RFC 5849](https://www.rfc-editor.org/rfc/rfc5849), 2010) fixed that specific flaw with a callback-confirmation step. Both 1.0 and 1.0a are legacy today — not because the underlying cryptography broke, but because per-request signing was fragile to implement correctly. A single stray character in how a client normalized and sorted parameters before signing silently broke the signature, and chasing down why a signature didn't match was a routine source of real integration pain.
- **OAuth 2.0** ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), 2012) dropped mandatory per-request signing for **bearer tokens over mandatory TLS** — far simpler to implement, no signature base string to get wrong, at the cost of a different trust assumption: whoever holds the bearer token, however they got it, can use it, so the whole model now leans on TLS actually being in place and the token itself never leaking. This is the version essentially every current API and identity provider runs.
- **OAuth 2.1** (an active IETF draft, [draft-ietf-oauth-v2-1](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1), not yet a published RFC) isn't a new protocol — it's OAuth 2.0 plus the security best practices that accumulated as separate RFCs over the following decade, folded back into one document: PKCE mandatory for every client type rather than just public ones, Implicit and ROPC removed outright instead of merely discouraged, redirect URIs required to match exactly rather than by pattern. Everything OAuth 2.1 mandates — PKCE, no Implicit, no ROPC, exact redirect matching — is already the recommended practice above; 2.1 mainly turns optional-but-recommended into non-optional.

1.0a hasn't fully disappeared: X (formerly Twitter) still requires it specifically for media-upload endpoints, even though the rest of its API moved to 2.0 — [X's own developer forum confirms this](https://devcommunity.x.com/t/will-oauth-1-0a-user-context-continue-to-be-supported-for-api-v2/245571) is simply because that one endpoint was never migrated. Old versions rarely disappear cleanly; they persist exactly where nobody's gotten around to replacing them.

There's no version field to inspect, so telling 1.0a from 2.0/2.1 in practice comes down to the shape of the request itself:

| Signal | OAuth 1.0/1.0a | OAuth 2.0 / 2.1 |
|---|---|---|
| Authorization header | `OAuth oauth_consumer_key="...", oauth_signature="...", oauth_timestamp="...", ...` | `Bearer <token>` |
| Per-request work | Every request individually signed | Token presented as-is, no per-request signature |
| Token acquisition | Request token → user authorizes → exchange for access token (three-legged) | Authorization Code or Client Credentials grant, generally two steps |

`oauth_signature` and `oauth_nonce` parameters anywhere in a request are the fastest tell that it's 1.0a, not 2.0.

## OpenID Connect: adding "who is this," on top

An OAuth access token only proves *an app has some permission* — it says nothing about the user's identity, and resource servers often can't even parse it (many are opaque strings, deliberately meaningless outside the authorization server). **OpenID Connect** adds a second, distinct token to solve this:

- **ID Token** — a [JWT]({{ '/topics/digital-signatures/' | relative_url }}#where-signatures-show-up-in-practice), signed by the Authorization Server (called an **OpenID Provider** in OIDC terms), containing identity claims: `sub` (subject/user ID), `email`, `name`, `iat`/`exp` (issued/expiry times). The client verifies this signature exactly the way [Digital Signatures]({{ '/topics/digital-signatures/' | relative_url }}) describes, using the provider's published public key.
- **UserInfo endpoint** — an API the client can call with the access token to fetch additional profile details not embedded in the ID token itself.

## JWTs are signed, not encrypted — a real demo

A JWT is three base64url segments — `header.payload.signature` — and only the signature actually requires a secret to produce. The header and payload are just encoded, not encrypted, and anyone can read them without any key at all:

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

No key, no secret, no signature verification — full claims, in plain sight. This is exactly why a JWT should never carry anything actually sensitive (passwords, SSNs, raw secrets) in its payload. What the signature *does* guarantee is that nobody tampered with those claims after signing — a real forgery attempt, run end to end:

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

Changing one field breaks verification instantly — the same [avalanche-effect]({{ '/topics/hash-functions-macs/' | relative_url }}#what-a-cryptographic-hash-function-guarantees) property from Hash Functions & MACs, since `HS256` is HMAC-SHA256 under the hood. Note the algorithm matters here too: `HS256` is a symmetric MAC (same secret signs and verifies — fine when the signer and verifier are the same server), while `RS256`/`ES256` are true asymmetric signatures (verify with a public key, no shared secret needed). [AWS Cognito's user pools sign with RS256 by default](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-id-token.html), and [Auth0's own guidance](https://support.auth0.com/center/s/article/What-s-the-difference-between-RS256-and-HS256-JWT-signing-algorithms) is explicit about why: `RS256` is close to mandatory the moment a third party — anyone other than the server that issued the token — needs to verify it, since verifying only ever needs the public key, never the secret that created it.

## Real-world case: the Booking.com OAuth flaw (2022–2023)

In late 2022, researchers at Salt Labs privately disclosed a vulnerability chain in Booking.com's "Login with Facebook" OAuth integration that could lead to full account takeover — without breaking any cryptography at all. The issue was in how the OAuth flow's steps were wired together on Booking.com's side: by manipulating the sequence, an attacker could hijack the session resulting from a victim's legitimate Facebook login and take over the Booking.com account behind it, including the ability to view personal data and make or cancel bookings on the victim's behalf. Salt Labs followed coordinated disclosure — reporting the flaw to Booking.com in late November 2022, confirming a fix by January 2023, and [publishing the technical details](https://salt.security/blog/traveling-with-oauth-account-takeover-on-booking-com) only afterward, with no evidence the flaws were ever exploited in the wild.

Nothing about OAuth's cryptography failed here — the tokens involved were signed and validated exactly as designed. The gap was entirely in how the surrounding application handled the flow's steps and redirects, at a company processing logins for hundreds of millions of users. It's a useful, low-drama reminder (precisely because it was caught by researchers, not attackers) that OAuth implementation bugs — not weaknesses in OAuth's actual cryptography — are where real-world account-takeover risk concentrates, which is exactly why `state` validation and redirect handling are called out as pitfalls below rather than treated as boilerplate.

## Common pitfalls

- **Confusing the ID token with the access token** — the ID token proves identity to the *client*; it was never meant to be sent to a resource server as an API credential. Using it that way is a frequent real-world mistake.
- **Storing tokens in `localStorage`** — accessible to any script on the page, making tokens a direct target for XSS. An `httpOnly` cookie (inaccessible to JavaScript) is the safer default for browser-based apps.
- **Skipping `state` parameter validation** — `state` is OAuth's CSRF protection for the redirect step; omitting it lets an attacker bind their own authorization code to a victim's session.
- **Not validating token signature and expiry on every request** — a resource server that only checks a token's presence, not its validity, isn't actually checking anything.
- **Using the deprecated Implicit or ROPC flows** in new code, often copied from outdated tutorials.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.rfc-editor.org/rfc/rfc5849">RFC 5849</a></strong> defines OAuth 1.0a. <strong><a href="https://www.rfc-editor.org/rfc/rfc6749">RFC 6749</a></strong> defines OAuth 2.0. <strong><a href="https://www.rfc-editor.org/rfc/rfc6750">RFC 6750</a></strong> defines Bearer Token usage. <strong><a href="https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1">draft-ietf-oauth-v2-1</a></strong> is the in-progress OAuth 2.1 consolidation. <strong><a href="https://www.rfc-editor.org/rfc/rfc7636">RFC 7636</a></strong> defines PKCE. <strong><a href="https://www.rfc-editor.org/rfc/rfc7519">RFC 7519</a></strong> defines JWT. The <a href="https://openid.net/specs/openid-connect-core-1_0.html">OpenID Connect Core 1.0</a> specification defines OIDC itself.</p>
</div>

## Where this fits

The ID token's signature is exactly the [Digital Signatures]({{ '/topics/digital-signatures/' | relative_url }}) pipeline (hash, then sign; verify with the issuer's public key), and `HS256` tokens rely on the same [HMAC]({{ '/topics/hash-functions-macs/' | relative_url }}) construction covered under Hash Functions & MACs. The access tokens issued here are also exactly what [API Security]({{ '/topics/api-security/' | relative_url }}) covers using as bearer credentials for machine-to-machine calls.
