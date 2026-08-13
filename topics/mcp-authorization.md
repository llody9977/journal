---
title: Model Context Protocol Authorization
description: MCP 2025-11-25 authorization for HTTP transports, protected-resource discovery, OAuth client registration, resource indicators, token validation, and lifecycle risks.
permalink: /topics/mcp-authorization/
last_verified: 2026-08-13
---

<span class="eyebrow">Authentication & Authorization / Protocol</span>

# Model Context Protocol Authorization

<p class="lede">Model Context Protocol (MCP) authorization protects an MCP client's access to a remote MCP server over HTTP. The 2025-11-25 specification profiles OAuth, protected-resource metadata, authorization-server discovery, and resource indicators. It does not authorize local stdio transports and does not permit an MCP server to pass a client token through to an unrelated upstream API.</p>

## Transport determines whether the authorization profile applies

- **stdio**: The client launches a local server process and communicates over standard input/output. The HTTP OAuth profile does not apply; process launch, filesystem permissions, sandboxing, and local secret handling establish trust.
- **Streamable HTTP**: The current remote transport uses HTTP POST and GET and can optionally use Server-Sent Events for streaming. This replaces the older standalone HTTP+SSE transport design.

## Discovery and authorization sequence

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/mcp-oauth-discovery.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the MCP authorization discovery diagram at full size">
    <img src="{{ '/assets/img/mcp-oauth-discovery.svg' | relative_url }}" alt="MCP authorization discovery: a client obtains protected-resource metadata from a WWW-Authenticate challenge or the well-known URI, discovers an authorization server, registers through a supported method, requests authorization and a token with the MCP resource URI, and presents the resource-bound token to the MCP server.">
  </a>
  <p class="diagram-caption">Both metadata discovery paths are valid; the resource indicator binds the authorization and token requests to the target MCP resource.</p>
</div>

1. The client obtains **OAuth Protected Resource Metadata** either from the MCP server's well-known URI or from the `resource_metadata` URL in a `401 Unauthorized` `WWW-Authenticate` challenge.
2. The metadata identifies one or more authorization servers. The client retrieves authorization-server metadata and validates issuer/endpoint relationships.
3. The client uses one supported registration approach: pre-registration/configured client information, OAuth Client ID Metadata Documents, or Dynamic Client Registration where the server supports it.
4. The client sends the canonical MCP server URI in the `resource` parameter of both the authorization request and token request.
5. The authorization server issues an access token for that resource under its policy. The MCP client presents it in `Authorization: Bearer` to the MCP server.
6. The MCP server validates the token under the applicable profile, including issuer, audience/resource, time, scope/authorization, and any sender constraint. It rejects tokens issued for unrelated upstream services.

The MCP specification references OAuth 2.1 while OAuth 2.1 remains an Internet-Draft. Implementations must follow the exact MCP specification version they claim and the referenced OAuth requirements rather than treating “2.1” as a finalized RFC label.

## Client registration choices

| Approach | Fit | Risk and operation |
|---|---|---|
| **Pre-registration** | Managed enterprise clients and stable deployments. | Strong administrative control; requires coordinated distribution and rotation of client metadata/credentials. |
| **Client ID Metadata Document** | Clients that can host HTTPS metadata identified by their client ID URL. | Authorization server must fetch and validate metadata safely, including URL/redirect restrictions and cache policy. |
| **Dynamic Client Registration** | Open ecosystems where the authorization server deliberately enables RFC 7591 registration. | Registration endpoint abuse, redirect URI quality, software metadata, initial access controls, and client lifecycle need explicit policy. |

## Authorization is narrower than tool safety

An access token proves that the client has the represented authorization to call the MCP server. It does not prove that a tool is safe, that tool descriptions are trustworthy, or that the user approved a destructive tool invocation. Treat tool metadata and tool output as untrusted content, enforce server-side authorization per tool/resource, and use explicit confirmation for consequential actions.

## Security and lifecycle checklist

- Canonicalize the resource URI consistently; prevent clients from obtaining a token for a parent or lookalike resource and replaying it elsewhere.
- Validate authorization-server metadata, redirect URIs, PKCE, state/transaction binding, TLS, access-token audience/resource, and requested scopes.
- Never forward the MCP access token to an upstream API. The server uses its own upstream credential or a deliberate token-exchange flow with a different target audience.
- Protect refresh tokens and client credentials; use platform redirect mechanisms and secure storage appropriate to the client type.
- Define token expiry, revocation, consent withdrawal, client de-registration, authorization-server key rollover, and MCP server URL migration.
- Log authorization decisions, tool/resource access, client identity, resource, scope, and correlation identifiers without logging bearer tokens or sensitive tool data.
- Test multiple authorization servers, unavailable metadata, issuer mismatch, wrong `resource`, token passthrough, stale keys, denied scope, revoked tokens, and downgrade to unauthenticated endpoints.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>MCP's HTTP authorization profile uses protected-resource discovery and OAuth resource indicators to obtain a token for one MCP server. Validate both discovery paths and the exact resource, select a controlled client-registration method, reject token passthrough, and keep tool authorization and human approval separate from OAuth login.</p>
</div>

## Primary references

- **[MCP Authorization, specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)** — verified discovery paths, registration approaches, resource indicators, access-token use, and token-passthrough prohibition.
- **[MCP Transports, specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)** — verified stdio and Streamable HTTP transport boundaries.
- **[RFC 9728: OAuth 2.0 Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728.html)** and **[RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707.html)** — verified discovery metadata and target-resource signaling.
- **[RFC 7591: OAuth 2.0 Dynamic Client Registration](https://www.rfc-editor.org/rfc/rfc7591.html)** — verified the optional dynamic-registration mechanism.
- **[OAuth 2.1 Internet-Draft 15](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/15/)** — verified the current non-final publication status.
