---
title: "NTLM, Kerberos & HTTP Authentication Schemes"
description: Architectural guide to HTTP authentication frameworks (RFC 9110), Basic Auth (RFC 7617), NTLM vs Kerberos, AD FS, and Model Context Protocol (MCP) OAuth 2.1.
permalink: /topics/http-auth-schemes/
last_verified: 2026-08-06
---

<span class="eyebrow">Authentication & Authorization / Protocols</span>

# NTLM, Kerberos & HTTP Authentication Schemes

<p class="lede">HTTP authentication mechanisms specify how callers prove identity to web services and APIs. Standardized under RFC 9110, HTTP authentication uses explicit challenge-response headers (<code>WWW-Authenticate</code> and <code>Authorization</code>). This page analyzes standard HTTP schemes (Basic, Bearer), Windows Active Directory protocols (NTLM, Kerberos), and the Model Context Protocol (MCP) OAuth 2.1 authorization profile.</p>

## The HTTP Authentication Framework (RFC 9110)

Standardized in **[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110#name-http-authentication)** (which obsoletes RFC 7235), the HTTP authentication handshake uses a standardized challenge-response pattern:

<div class="diagram-frame">
  <img src="{{ '/assets/img/http-authentication-challenge.svg' | relative_url }}" alt="HTTP authentication sequence in which a server returns a 401 challenge and the client retries with an Authorization header.">
  <p class="diagram-caption">The challenge selects an authentication scheme; authorization remains a separate decision</p>
</div>

| HTTP Authentication Scheme | RFC Standard | Credential Format / Payload | Security Profile |
|---|---|---|---|
| **Basic** | RFC 7617 | `Authorization: Basic Base64(username:password)` | **Unsafe over HTTP**; Base64 is cleartext encoding. Requires mandatory TLS. |
| **Bearer** | RFC 6750 | `Authorization: Bearer <opaque_or_JWT_access_token>` | Requires TLS; token grants access to whoever holds it (possession-based). |
| **Negotiate (SPNEGO)** | RFC 4559 | `Authorization: Negotiate <Kerberos_Ticket_or_NTLM_Blob>` | Used in Windows enterprise environments for SSO (Kerberos / NTLM). |
| **Digest** | RFC 7616 | `Authorization: Digest username=..., response=...` | Legacy challenge-response scheme replacing cleartext passwords (*Rarely used today*). |

---

## HTTP Basic Authentication (RFC 7617)

**HTTP Basic Auth** concatenates `username` and `password` separated by a colon, Base64-encoding the resulting string:

```bash
# Generate HTTP Basic Auth Header Payload
python3 -c "import base64; print(base64.b64encode(b'Aladdin:open sesame').decode())"
# Output: QWxhZGRpbjpvcGVuIHNlc2FtZQ==
```

<div class="callout warn">
  <span class="callout-title">Base64 Encodes Data; It Does Not Encrypt It</span>
  <p>Base64 encoding provides zero confidentiality. Anyone inspecting an HTTP trace can decode `QWxhZGRpbjpvcGVuIHNlc2FtZQ==` instantly back into cleartext credentials. Basic Auth must strictly run over encrypted TLS transport channels.</p>
</div>

---

## Windows Enterprise Authentication: NTLM vs Kerberos

Active Directory (AD) enterprise environments use two primary authentication protocols:

| Feature | NTLM (NT LAN Manager) | Kerberos v5 (RFC 4120) |
|---|---|---|
| **Protocol Type** | 3-Way Challenge-Response (Negotiate, Challenge, Authenticate) | Key Distribution Center (KDC) Ticket-Granting Architecture |
| **Mutual Authentication** | **No**: Server authenticates client; client cannot verify server. | **Yes**: Client and server verify each other's identity via KDC. |
| **Delegation Support** | No support (Vulnerable to NTLM relay attacks). | Full support via Kerberos constrained delegation (KCD). |
| **Performance Impact** | Requires Domain Controller round-trip on *every* request. | Client requests reusable Ticket-Granting Ticket (TGT); no DC load per call. |
| **Security Status** | **Deprecated Fallback**: Vulnerable to relay and pass-the-hash attacks. | **Primary AD Standard**: Fast, scalable, mutually authenticated. |

---

## Model Context Protocol (MCP) Authorization Profile

The **Model Context Protocol (MCP)** specification profiles **OAuth 2.1** for securing client-to-server AI agent communications over HTTP/SSE transports:

<div class="diagram-frame">
  <img src="{{ '/assets/img/mcp-oauth-discovery.svg' | relative_url }}" alt="MCP OAuth discovery sequence using Protected Resource Metadata to locate an authorization server and obtain a resource-bound token.">
  <p class="diagram-caption">The MCP client discovers the authorization server before requesting a token for the resource</p>
</div>

### Core MCP Security Requirements

- **RFC 9728 (Protected Resource Metadata)**: MCP servers return a `401 Unauthorized` with `WWW-Authenticate` pointing to protected resource metadata.
- **RFC 8707 (Resource Indicators)**: Token requests MUST specify the `resource` parameter set to the target MCP server's canonical URI.
- **Anti-Token Passthrough Rule**: MCP servers MUST validate the token audience (`aud`) and reject incoming tokens that were issued for third-party upstream APIs to prevent "confused deputy" attacks.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>HTTP Authentication Summary</strong>
    <ul>
      <li><strong>Bearer Token Hazard</strong>: Anyone possessing a Bearer token (RFC 6750) can impersonate the subject. Always combine with TLS and short lifetimes.</li>
      <li><strong>Sender-Constrained Tokens</strong>: DPoP (RFC 9449) and mTLS (RFC 8705) bind tokens to client private keys, preventing stolen token replay.</li>
      <li><strong>Basic Auth Deprecation</strong>: Basic Authentication sends base64 credentials in cleartext; restrict strictly to local debug or replace with OAuth2.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 6750**: *The OAuth 2.0 Authorization Framework: Bearer Token Usage* — [IETF RFC 6750](https://www.rfc-editor.org/rfc/rfc6750)
- **RFC 9449**: *OAuth 2.0 Demonstrating Proof of Possession (DPoP)* — [IETF RFC 9449](https://www.rfc-editor.org/rfc/rfc9449)
