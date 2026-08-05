---
title: "NTLM, Kerberos & HTTP Authentication Schemes"
description: The Authorization/WWW-Authenticate header framework, HTTP Basic Auth, whether an API key is "just Basic Auth," Windows/AD authentication (NTLM, Kerberos, AD FS), and how MCP actually authenticates.
permalink: /topics/http-auth-schemes/
last_verified: 2026-08-05
---

<span class="eyebrow">Authentication & Authorization / Protocols</span>

# NTLM, Kerberos & HTTP Authentication Schemes

<p class="lede">The <a href="{{ '/topics/oauth-oidc/' | relative_url }}">OAuth & OpenID Connect</a> page covers delegated authorization specifically. This page is everything else that answers "how does this particular call actually prove who's calling" — the raw HTTP mechanism underneath the <code>Authorization</code> header, Windows/AD's own protocols, and how a brand-new protocol like MCP chose to bolt OAuth on top of itself rather than invent something new.</p>

## The HTTP authentication framework: `Authorization` and `WWW-Authenticate`

[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-http-authentication) now defines the HTTP authentication framework and obsoletes RFC 7235. A server that rejects an unauthenticated request normally replies `401 Unauthorized` with a `WWW-Authenticate` challenge naming one or more schemes. The client can retry with an `Authorization` field using a selected scheme. `realm` is an optional scheme parameter used to describe a protection space; it is not present in every challenge.

This is why "what auth does this API use" has a fast, reliable answer that doesn't require reading documentation: send a request with no credentials and read the `WWW-Authenticate` header the server sends back, or inspect the `Authorization` header prefix on a request that's already known to work.

## HTTP Basic Authentication (RFC 7617)

[RFC 7617](https://www.rfc-editor.org/rfc/rfc7617) is the oldest and simplest scheme: concatenate `user-id:password`, Base64-encode the result, send it as `Authorization: Basic <encoded>`. The RFC's own example, for user `Aladdin` and password `open sesame`:

```
$ python3 -c "
import base64
print(base64.b64encode(b'Aladdin:open sesame').decode())
"
QWxhZGRpbjpvcGVuIHNlc2FtZQ==

$ python3 -c "
import base64
print(base64.b64decode('QWxhZGRpbjpvcGVuIHNlc2FtZQ==').decode())
"
Aladdin:open sesame
```

Base64 is an encoding, not encryption — anyone who intercepts this header reads the credential instantly. RFC 7617 is explicit that Basic Auth must only run over TLS. There is no expiry, no scope, and no signature; it's exactly one shared secret, transmitted (encoded) on every single request.

## Is an API key + secret "just Basic Auth"?

Sometimes literally yes, sometimes no — it depends entirely on what actually goes out over the wire, not on the concept of "a key and a secret."

- **Stripe: yes, literally.** Stripe's own documentation says it directly: "The Stripe API authenticates requests using HTTP Basic Auth. Provide your API key as the basic auth username value. You don't need to provide a password," with the example `curl https://api.stripe.com/v1/charges -u sk_test_...:` — that trailing colon is the empty password Basic Auth's format requires. This is RFC 7617, unmodified, with a secret key standing in for the username.
- **A custom `X-API-Key` header: no.** A bare, unprefixed header outside the `Authorization`/`WWW-Authenticate` framework entirely isn't using the Basic scheme (or any registered HTTP auth scheme) — it's just a static credential in a header of the API's own choosing.
- **AWS SigV4: no.** Covered in more depth on the [Machine-to-Machine API Authentication]({{ '/topics/api-security/' | relative_url }}#oauths-client-credentials-grant-machine-to-machine-oauth) page — the secret access key never goes on the wire at all. It derives a signing key and HMACs the request; what's transmitted is a signature, not the credential.
- **A Bearer token: no**, even though it's also just one string in the `Authorization` header — `Bearer` is a distinct registered scheme (RFC 6750) with no username/password structure or Base64 step.

The test is mechanical, not conceptual: does the `Authorization` header literally say `Basic`, followed by Base64 of `something:something`? If yes, it's Basic Auth, whatever the "something" represents. If the credential goes anywhere else, or gets transformed before transmission, it isn't.

## NTLM: Windows' legacy challenge-response

Microsoft's own NTLM overview describes it as "a family of authentication protocols... encompassed in the Windows Msv1_0.dll," working as "a challenge response mechanism that proves to a server or domain controller that a user knows the password associated with an account," without ever sending the password itself — the classic three-message exchange (negotiate, challenge, authenticate) proves knowledge of a password hash instead.

Microsoft is direct about its current status: "Kerberos version 5 authentication is the preferred authentication method for Active Directory environments, but a non-Microsoft or Microsoft application might still use NTLM," and NTLM "is still supported and must be used... with systems configured as a member of a workgroup" (i.e. no domain controller at all) or for local, non-domain logons. The [Kerberos overview](#kerberos-active-directorys-actual-default) is blunter about the specific gap: "NTLM does not enable clients to verify a server's identity or enable one server to verify the identity of another" — there is no mutual authentication, which is precisely why a machine-in-the-middle relaying NTLM traffic between a victim and a real server is a structural weakness, not an implementation bug.

## Kerberos: Active Directory's actual default

Kerberos (RFC 4120, Microsoft's Windows Server implementation of v5) is what Active Directory actually authenticates with day to day; NTLM is the fallback. Microsoft's own description covers the pieces:

- **KDC (Key Distribution Center)** — runs on the domain controller, "integrated with other Windows Server security services," using Active Directory Domain Services itself as its account database.
- **Tickets, not repeated password checks** — a client obtains a ticket once and reuses it across a logon session, rather than a server contacting a domain controller on every request the way NTLM does: "renewable session tickets replace pass-through authentication."
- **Mutual authentication** — "a party at either end of a network connection can verify that the party on the other end is the entity it claims to be," explicitly contrasted against NTLM's one-directional trust model above.
- **Delegation** — "Kerberos authentication supports a delegation mechanism that enables a service to act on behalf of its client when connecting to other services," the same front-end-calls-back-end shape that OAuth Token Exchange solves in the web/API world, covered on the [Security Token Service]({{ '/topics/security-token-service/' | relative_url }}#oauth-20-token-exchange-rfc-8693-the-modern-restful-sts) page.

## AD FS & federation

Active Directory Federation Services extends the same domain-bound trust outward: Microsoft describes it as enabling "Federated Identity and Access Management by securely sharing digital identity and entitlements rights across security and enterprise boundaries," giving Internet-facing applications the same single sign-on a user gets inside one domain. Structurally, AD FS *is* a concrete [Security Token Service]({{ '/topics/security-token-service/' | relative_url }}#the-general-idea-a-service-that-trades-trust-for-tokens) — the same WS-Trust role, running on Windows Server, and it's the specific product [AWS STS's SAML federation]({{ '/topics/security-token-service/' | relative_url }}#aws-sts-the-concrete-example-most-people-actually-touch) is built to accept tokens from. AD FS has since grown beyond WS-Federation/SAML to speak OpenID Connect and OAuth as well.

<div class="callout warn">
  <span class="callout-title">Microsoft is steering people away from AD FS itself</span>
  <p>Microsoft's own AD FS overview leads with: "Instead of upgrading to the latest version of AD FS, Microsoft highly recommends migrating to Microsoft Entra ID." The federation <em>role</em> described above isn't going away — it's moving to a cloud-hosted STS rather than one an organization runs itself.</p>
</div>

## Human login vs. service/API vs. MCP — putting it together

The same `Authorization`/`WWW-Authenticate` framework carries very different schemes depending on who — or what — is on the calling end:

| Caller | Typical mechanism | Is there a human to challenge? |
|---|---|---|
| Browser, website login | Session cookie after an [OIDC]({{ '/topics/oauth-oidc/' | relative_url }}#openid-connect-adding-who-is-this-on-top)/[SAML]({{ '/topics/saml/' | relative_url }}) redirect flow; `WWW-Authenticate: Basic`/`Negotiate` mainly survive as legacy fallbacks | Yes — [step-up authentication]({{ '/topics/step-up-authentication/' | relative_url }}) is available |
| Intranet service call (Windows domain) | `Negotiate` (SPNEGO) carrying Kerberos, falling back to NTLM | No — the machine account or logged-on user's ticket stands in |
| API with a static credential | `Basic` (Stripe-style key-as-username) or a custom header scheme | No |
| [Machine-to-Machine]({{ '/topics/api-security/' | relative_url }}) | OAuth Client Credentials (`Bearer`), mTLS, or SigV4-style request signing | No — [that's exactly the gap]({{ '/topics/api-security/' | relative_url }}#closing-the-impersonation-gap-in-machine-to-machine-auth) mTLS/DPoP close instead |
| MCP client &rarr; MCP server | `Bearer` access token, OAuth 2.1-based | Only during the initial authorization grant, if any — see below |

### MCP: OAuth 2.1 as the authorization layer

The [Model Context Protocol authorization specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) does not invent a new HTTP authentication scheme. It profiles OAuth 2.1 and supporting specifications for HTTP transports. Authorization remains optional at the protocol level; STDIO implementations should obtain credentials from the environment instead of using this flow. The current profile includes:

- **[RFC 9728](https://datatracker.ietf.org/doc/html/rfc9728) (OAuth 2.0 Protected Resource Metadata)** — an MCP server, acting as an OAuth 2.1 resource server, returns a `WWW-Authenticate` challenge on a 401 pointing the client at a metadata document, which names the authorization server(s) it trusts.
- **[RFC 8414](https://datatracker.ietf.org/doc/html/rfc8414) (Authorization Server Metadata)** — the client resolves that authorization server's own endpoints from a well-known discovery document, rather than anything hardcoded.
- **Client registration** — the 2026-07-28 profile prefers OAuth Client ID Metadata Documents, also permits preregistration, and retains [RFC 7591](https://datatracker.ietf.org/doc/html/rfc7591) Dynamic Client Registration for backward compatibility. The client must follow the profile's selection order rather than assume every authorization server accepts dynamic registration.
- **[RFC 8707](https://www.rfc-editor.org/rfc/rfc8707.html) (Resource Indicators)** — every authorization and token request MUST carry a `resource` parameter naming the exact MCP server's canonical URI, and a receiving MCP server MUST reject any token not issued for it. The spec calls out **token passthrough** — an MCP server forwarding a token it received straight through to some other upstream API — as an explicit "confused deputy" risk, forbidden outright, not just discouraged.

Once authorized, the client sends `Authorization: Bearer <token>` on each HTTP request. Interoperability depends on discovery, client registration, exact resource indicators, issuer checks, and token audience validation; successful discovery does not mean the client should trust an unknown server automatically.

## Common pitfalls

- **Assuming "an API key" tells me the transport** — the same words can describe a Basic Auth username, a Bearer token, a signed request, or a custom header. I inspect the actual scheme and header format.
- **Treating NTLM as equivalent to Kerberos because both are "Windows auth"** — NTLM has no mutual authentication and no delegation; substituting it doesn't just weaken the protocol, it removes properties Kerberos deployments may be silently relying on.
- **Running Basic Auth without TLS** — the credential is reversible with one command; RFC 7617 assumes TLS is a hard requirement, not an enhancement.
- **An MCP server trusting a token's audience claim without checking it, or forwarding a client's token upstream unchanged** — both are explicitly called out in the MCP spec as leading directly to the confused-deputy problem.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.rfc-editor.org/rfc/rfc9110.html#name-http-authentication">RFC 9110</a></strong> defines the current HTTP authentication framework and obsoletes RFC 7235. <strong><a href="https://www.rfc-editor.org/rfc/rfc7617">RFC 7617</a></strong> defines HTTP Basic Authentication. <a href="https://docs.stripe.com/api/authentication">Stripe's API authentication docs</a> show its use of Basic Auth. <a href="https://learn.microsoft.com/en-us/windows-server/security/kerberos/ntlm-overview">Microsoft's NTLM overview</a> and <a href="https://learn.microsoft.com/en-us/windows-server/security/kerberos/kerberos-authentication-overview">Kerberos overview</a> cover Windows/AD authentication; <a href="https://learn.microsoft.com/en-us/windows-server/identity/ad-fs/ad-fs-overview">AD FS Overview</a> covers federation. The <a href="https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization">MCP Authorization specification</a> profiles OAuth and supporting discovery, registration, resource-indicator, and token-validation specifications for HTTP-based connections.</p>
</div>
