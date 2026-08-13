---
title: "NTLM, Kerberos & HTTP Authentication Schemes"
description: HTTP challenge-response authentication, Basic, Bearer, and Digest schemes, Windows Negotiate with Kerberos or NTLM, delegation, and AD FS boundaries.
permalink: /topics/http-auth-schemes/
last_verified: 2026-08-13
---

<span class="eyebrow">Authentication & Authorization / Protocols</span>

# NTLM, Kerberos & HTTP Authentication Schemes

<p class="lede">HTTP defines a challenge framework in which a server advertises authentication schemes and a client retries with credentials. Basic, Digest, Bearer, and Negotiate have different credential and replay properties. Authentication success identifies or authenticates a credential holder under the selected scheme; authorization remains a separate resource decision.</p>

## The RFC 9110 challenge framework

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/http-authentication-challenge.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the HTTP authentication challenge diagram at full size">
    <img src="{{ '/assets/img/http-authentication-challenge.svg' | relative_url }}" alt="HTTP authentication sequence in which a server returns 401 with a WWW-Authenticate challenge, the client selects a supported scheme, and the client retries with Authorization credentials before a separate authorization decision.">
  </a>
  <p class="diagram-caption">The challenge selects a credential scheme; the application still evaluates authorization after authentication.</p>
</div>

| Scheme | Credential behavior | Main boundary |
|---|---|---|
| **Basic (RFC 7617)** | Sends Base64-encoded `user-id:password` with requests. | Base64 provides no confidentiality; TLS, credential storage, scope, and rotation carry the security burden. |
| **Bearer (RFC 6750)** | Sends an access token whose possession authorizes use under the token's scope and resource-server policy. | A stolen valid token can normally be replayed until it expires or is revoked unless a sender-constrained profile is used. |
| **Digest (RFC 7616)** | Sends a digest response derived from credentials, method, URI, challenge, and nonce rather than sending the password directly. | Legacy and rarely deployed; protects neither the entity body nor all headers by default, depends on password-equivalent verifier handling, and still needs TLS against active attacks and metadata exposure. |
| **Negotiate (RFC 4559)** | Carries SPNEGO tokens that commonly select Kerberos and may fall back to NTLM in Windows environments. | Security depends on the selected mechanism, service principal, channel/configuration, and whether fallback is allowed. |

### Basic authentication demonstration

```bash
python3 -c "import base64; print(base64.b64encode(b'Aladdin:open sesame').decode())"
# Output: QWxhZGRpbjpvcGVuIHNlc2FtZQ==
```

Anyone who obtains that header can decode and reuse the credentials. TLS protects the header in transit only between its TLS endpoints; logs, proxies, browser storage, endpoint compromise, and over-broad credential scope remain risks.

## Kerberos and NTLM under Windows Negotiate

| Axis | NTLM | Kerberos v5 |
|---|---|---|
| **Mechanism** | Challenge-response based on password-derived secrets. | The client obtains a ticket-granting ticket (TGT), then service tickets from the Key Distribution Center (KDC). |
| **Server authentication** | Does not provide Kerberos-equivalent service authentication and is exposed to relay when channel/service protections are absent. | The service proves possession of the service key; mutual authentication depends on the protocol exchange and application configuration. |
| **Credential reuse attacks** | Password-hash disclosure can enable pass-the-hash and relaying in susceptible configurations. | Ticket or key disclosure can enable pass-the-ticket or forged-ticket attacks within the compromised principal/key scope. |
| **Delegation** | Does not provide Kerberos delegation semantics. | Unconstrained, constrained, and resource-based constrained delegation have different trust and blast-radius properties; delegation is not automatically enabled or safe. |
| **Directory traffic** | A server handling a domain account may need a domain-controller exchange for a new NTLM authentication. Connection reuse can avoid doing so for every HTTP request. | The client contacts a KDC to obtain/renew TGTs and service tickets; a cached valid service ticket avoids a KDC request for every application call. |

Kerberos failures commonly fall back to NTLM because of missing service principal names, name-resolution errors, aliases, clock problems, or application configuration. Monitor the negotiated mechanism rather than assuming “Negotiate” means Kerberos.

Microsoft has removed NTLMv1 from Windows Server 2025 and deprecated broader NTLM use, including NTLMv2, for future removal. Existing dependencies require discovery, Kerberos remediation, explicit fallback reduction, and validation—not merely disabling NTLM without understanding service accounts, workgroups, local accounts, and legacy devices.

## Delegation and AD FS boundaries

Kerberos delegation lets a front-end service obtain or use credentials to call a downstream service for a user. Prefer narrowly scoped constrained or resource-based constrained delegation, protect service-account keys, and test the exact service principal and protocol-transition configuration. Unconstrained delegation expands the credential-theft blast radius.

Active Directory Federation Services (AD FS) is a federation service that can issue SAML assertions and OAuth/OIDC tokens after authenticating against Active Directory or another source. It is not an HTTP authentication scheme alongside Basic or Negotiate. A deployment may use Windows Integrated Authentication to sign into AD FS and then use a federation protocol to reach the application; keep those two protocol boundaries distinct.

The current MCP OAuth profile is maintained separately in **[Model Context Protocol Authorization]({{ '/topics/mcp-authorization/' | relative_url }})**.

## Operational selection and validation

- Prefer short-lived, audience-restricted access tokens or Kerberos for managed SSO scenarios rather than distributing reusable passwords through Basic.
- Require TLS for all schemes; TLS does not repair replayable credential design or a compromised endpoint.
- Pin allowed authentication schemes and disable unsafe downgrade/fallback paths where dependencies permit.
- Validate the final authenticated principal, service name, token audience/scope where relevant, and local authorization on every protected route.
- Observe scheme negotiation, authentication failures, fallback, ticket/token age, service-account use, and privileged delegation.
- Test credential rotation, key rollover, password change, account disablement, ticket/token expiry, revocation behavior, and disaster recovery.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>HTTP authentication is a challenge framework, not one security property. Identify the actual negotiated scheme, protect its credential lifecycle and transport, prevent unintended downgrade, and enforce authorization after authentication. AD FS federation is a separate layer that may itself use Windows authentication.</p>
</div>

## Primary references

- **[RFC 9110: HTTP Semantics — Authentication](https://www.rfc-editor.org/rfc/rfc9110.html#name-http-authentication)** — verified HTTP challenge and credential framework semantics.
- **[RFC 7617: The Basic HTTP Authentication Scheme](https://www.rfc-editor.org/rfc/rfc7617.html)** and **[RFC 7616: HTTP Digest Access Authentication](https://www.rfc-editor.org/rfc/rfc7616.html)** — verified Basic and Digest credential behavior and limitations.
- **[RFC 4559: SPNEGO-based Kerberos and NTLM HTTP Authentication](https://www.rfc-editor.org/rfc/rfc4559.html)** — verified HTTP Negotiate behavior.
- **[RFC 4120: The Kerberos Network Authentication Service](https://www.rfc-editor.org/rfc/rfc4120.html)** — verified ticket, KDC, and service-authentication mechanics.
- **[Microsoft: NTLM overview](https://learn.microsoft.com/en-us/windows-server/security/kerberos/ntlm-overview)** and **[removed or deprecated Windows Server features](https://learn.microsoft.com/en-us/windows-server/get-started/removed-deprecated-features-windows-server)** — verified NTLM operating behavior and current lifecycle status.
- **[Microsoft: AD FS overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-fs/ad-fs-overview)** — verified the federation-service boundary.
