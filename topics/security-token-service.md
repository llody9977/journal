---
title: Security Token Service (STS)
description: What an STS actually is — WS-Trust's original definition, OAuth 2.0 Token Exchange, and the concrete systems (AWS STS, SAML/OIDC federation) that implement it.
permalink: /topics/security-token-service/
last_verified: 2026-08-05
---

<span class="eyebrow">Authentication & Authorization / Concepts</span>

# Security Token Service (STS)

<p class="lede">"STS" gets used for at least three different things — an enterprise SOAP-era role, a specific AWS API, and a modern OAuth grant type — and they all genuinely issue tokens, so conflating them is an easy mistake. I want the general definition pinned down first, then each concrete implementation kept separate.</p>

## The general idea: a service that trades trust for tokens

The term originates with **WS-Trust**, an OASIS specification. Its own definition is the cleanest starting point:

<div class="callout">
  <p>"A security token service (STS) is a Web service that issues security tokens. That is, it makes assertions based on evidence that it trusts, to whoever trusts it."</p>
</div>

Strip away the SOAP/XML machinery WS-Trust wraps this in, and an STS is just: a service a relying party already trusts, that vouches for a caller by handing back a token — instead of the relying party having to verify the caller's identity itself. Every concrete example below is that same shape, wearing different transport and token formats.

## AWS STS: the concrete example most people actually touch

AWS's own documentation states the purpose plainly:

<div class="callout">
  <p>"You can use the AWS Security Token Service (AWS STS) to create and provide trusted users with temporary security credentials that can control access to your AWS resources... Temporary security credentials are short-term, as the name implies. They can be configured to last for anywhere from a few minutes to several hours."</p>
</div>

The mechanism people reach for most is `AssumeRole` — trading one identity's permissions for a role's permissions, temporarily, without ever creating or handing over a long-term IAM credential. AWS STS also accepts external proof of identity as input to the exchange: **[SAML]({{ '/topics/saml/' | relative_url }}) federation** (an on-prem Active Directory/[AD FS]({{ '/topics/http-auth-schemes/' | relative_url }}#ad-fs--federation) login exchanged for temporary AWS credentials) and **OIDC federation** (a third-party OpenID Connect login, or a CI/CD system's own OIDC token, exchanged for temporary AWS access — the mechanism behind GitHub Actions' `AssumeRoleWithWebIdentity` pattern, which is why so many pipelines no longer need a stored AWS access key at all). Either way, the shape is identical to WS-Trust's definition above: present evidence, get back a token scoped to what that evidence entitles you to.

## OAuth 2.0 Token Exchange (RFC 8693): the modern, RESTful STS

[RFC 8693](https://www.rfc-editor.org/rfc/rfc8693) brings the same idea into the OAuth/JSON world, and says so explicitly in its own abstract:

<div class="callout">
  <p>"This specification defines a protocol for an HTTP- and JSON-based Security Token Service (STS) by defining how to request and obtain security tokens from OAuth 2.0 authorization servers, including security tokens employing impersonation and delegation."</p>
</div>

A client sends a `subject_token` (the token it currently holds) to a new grant type, `urn:ietf:params:oauth:grant-type:token-exchange`, and gets back a token possibly scoped differently, possibly formatted differently, possibly narrower — e.g. a front-end's user-facing access token traded for a downstream token that's valid only for calling one specific backend service. This is the same problem [machine-to-machine authentication]({{ '/topics/api-security/' | relative_url }}) runs into once a call has to hop between services: something has to narrow and re-scope a credential at each hop rather than passing the original all the way through.

RFC 8693 draws a specific, useful line between two things that are easy to blur:

- **Impersonation** — "principal A impersonates principal B, A is given all the rights that B has... and is indistinguishable from B in that context." The new token simply asserts the original subject's identity; nothing in it says a substitution happened.
- **Delegation** — "principal A still has its own identity separate from B, and it is explicitly understood that while B may have delegated some of its rights to A, any actions taken are being taken by A representing B." This is expressed with an explicit `act` claim identifying the acting party, plus an optional `may_act` claim an authorization server can check upfront to confirm a client is even allowed to request that delegation.

Delegation is auditable in a way impersonation isn't — a downstream service can see from the `act` claim that the request is A-acting-for-B, not simply "B, again." That distinction matters most exactly where things go wrong: after an incident, "who actually made this call" is a very different question from "which identity does this token merely claim."

## How the three actually relate

| | WS-Trust STS | [SAML 2.0]({{ '/topics/saml/' | relative_url }}) | OAuth 2.0 Token Exchange |
|---|---|---|---|
| Era | Enterprise SOAP, mid-2000s | Browser-era enterprise SSO, still widely deployed | Modern OAuth option where token exchange is implemented |
| Transport / format | SOAP requests, WS-Security XML tokens | XML assertions, browser redirects/POST | HTTP + JSON |
| Where it still shows up | Legacy ADFS-style enterprise deployments | Enterprise SSO into SaaS and cloud (including AWS STS's SAML federation, above) | New federation and delegation work: token exchange, on-behalf-of flows |

AWS STS isn't a fourth, unrelated thing here — it's a concrete cloud implementation of the same STS role, which happens to accept both SAML assertions and OIDC tokens as the "evidence" side of the trade.

## Common pitfalls

- **Treating an STS-issued token as equivalent to the original credential** — a temporary, narrowly-scoped token should not silently regain the full permission set of whatever it was traded from; that defeats the entire reason to exchange in the first place.
- **Using impersonation where delegation was the intent** — if audit trails or downstream authorization decisions need to know who is actually acting, an impersonation token throws that information away.
- **Assuming "temporary" credentials are risk-free** — a leaked temporary credential is still valid for whatever's left of its lifetime; short-lived narrows the blast radius, it doesn't remove it.
- **Forgetting the trust boundary the STS itself sits on** — every one of these systems works by the relying party trusting the STS's assertions instead of verifying the original evidence itself; a compromised STS (or a misconfigured trust policy that accepts tokens from more issuers than intended) undermines everything downstream of it at once.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://docs.oasis-open.org/ws-sx/ws-trust/v1.4/errata01/os/ws-trust-1.4-errata01-os-complete.html">WS-Trust 1.4</a></strong> (OASIS) defines the original Security Token Service role. <strong><a href="https://www.rfc-editor.org/rfc/rfc8693">RFC 8693</a></strong> defines OAuth 2.0 Token Exchange. <strong><a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html">AWS's own documentation</a></strong> covers AWS STS and temporary security credentials.</p>
</div>
