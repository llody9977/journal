---
title: Model Context Protocol Authorization
description: MCP 2026-07-28 authorization for HTTP transports, protected-resource and authorization-server discovery, client registration priority, resource indicators, issuer validation, scope step-up, and lifecycle risks.
permalink: /topics/mcp-authorization/
last_verified: 2026-08-14
---

<span class="eyebrow">Authentication & Authorization / Protocol</span>

# Model Context Protocol Authorization

<p class="lede">Model Context Protocol (MCP) authorization protects an MCP client's access to a remote MCP server over HTTP. The 2026-07-28 specification profiles OAuth, protected-resource metadata, authorization-server discovery, client registration, and resource indicators. Authorization itself is <strong>optional</strong> for an MCP implementation; where it is used over HTTP, the profile applies. It does not authorize local stdio transports, and it does not permit an MCP server to pass a client token through to an unrelated upstream API.</p>

## Transport determines whether the authorization profile applies

- **stdio**: The client launches a local server process and communicates over its standard streams. The HTTP OAuth profile does not apply — implementations using stdio should retrieve credentials from the environment instead. Trust comes from process launch, filesystem permissions, sandboxing, and local secret handling. See [MCP & Agentic Security]({{ '/topics/mcp-security-agentics/' | relative_url }}) for why a local server is arbitrary code running with the client's privileges.
- **Streamable HTTP**: The current remote transport posts each message to a single MCP endpoint, with replies as JSON or a request-scoped SSE stream. This replaces the older standalone HTTP+SSE transport design.

## Discovery and authorization sequence

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/mcp-oauth-discovery.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the MCP authorization discovery diagram at full size">
    <img src="{{ '/assets/img/mcp-oauth-discovery.svg' | relative_url }}" alt="MCP authorization discovery: a client makes an unauthenticated call, obtains protected-resource metadata from the 401 WWW-Authenticate challenge, falling back to well-known URI probing, discovers and registers with an authorization server, sends the canonical resource URI in both the authorization and token requests, and presents the resource-bound token. A footer lists the three validations the client owns.">
  </a>
  <p class="diagram-caption">The header path is preferred and well-known probing is the fallback; the resource indicator binds both requests to the target MCP server</p>
</div>

1. The client calls the MCP server without a token and receives `401 Unauthorized`.
2. The client obtains **OAuth Protected Resource Metadata**. It must use the `resource_metadata` URL from the `WWW-Authenticate` header when one is present, and otherwise fall back to probing the well-known URIs — the MCP endpoint's sub-path form first, then the root form. The server side must implement at least one of those two mechanisms; the client must support both.
3. The metadata's `authorization_servers` field names one or more authorization servers, and choosing between them is the client's responsibility. Each is an independent OAuth authorization server: client identifiers and tokens are **per authorization server** and must not be assumed to work at another.
4. The client retrieves authorization-server metadata, trying the OAuth 2.0 Authorization Server Metadata endpoint before OpenID Connect Discovery, with defined path-insertion rules for issuer URLs that carry a path. It must then check that the `issuer` inside the returned document matches the identifier used to build the URL, and reject the document if it does not. This is what stops a document fetched from an attacker's well-known endpoint from claiming an honest issuer.
5. The client registers by one of three mechanisms (below) and records the authorization server's `issuer` before redirecting.
6. The client sends the canonical MCP server URI in the `resource` parameter of **both** the authorization request and the token request, and must send it even if the authorization server ignores it.
7. On the authorization response, the client validates the `iss` parameter against the issuer it recorded, using exact string comparison with no scheme, host, port, slash, or percent-encoding normalization. This applies to error responses too — on a mismatch the client must not act on or display the error.
8. The authorization server issues an access token for that resource. The client presents it in `Authorization: Bearer` on every request; it is never placed in a query string.
9. The MCP server validates that the token was issued for it as the audience, and rejects tokens issued for anything else. It must not accept or forward any other token.

The MCP specification profiles OAuth 2.1, which is still an Internet-Draft — the 2026-07-28 revision pins a specific draft revision rather than a finished RFC. Implement against the exact MCP revision and the draft it names rather than treating "2.1" as a finalized standard label.

## Client registration choices

Clients that support all three should follow the specification's priority order: pre-registered information if available, then Client ID Metadata Documents if the authorization server advertises `client_id_metadata_document_supported`, then Dynamic Client Registration if a `registration_endpoint` exists, and only then prompt the user.

| Approach | Fit | Risk and operation |
|---|---|---|
| **Pre-registration** | Managed enterprise clients and stable deployments. | Strong administrative control; requires coordinated distribution and rotation of client metadata and credentials. Credentials are specific to one authorization server. |
| **Client ID Metadata Document** | The default for the common case where client and server have no prior relationship. | The client ID is an HTTPS URL resolving to a JSON document that must contain a matching `client_id`, a `client_name`, and `redirect_uris`. The authorization server fetches and validates it, which makes fetch-side URL and redirect restrictions and cache policy load-bearing. Client IDs are portable across authorization servers. |
| **Dynamic Client Registration** | **Deprecated.** Retained only for backwards compatibility with authorization servers that do not support Client ID Metadata Documents. | New implementations should not choose it. Where it is used, registration-endpoint abuse, redirect URI quality, and client lifecycle need explicit policy, and an OIDC authorization server may reject registrations whose `application_type` conflicts with a native-style redirect URI. |

**Authorization server binding.** Pre-registered credentials, and any persisted from Dynamic Client Registration, must be stored against the issuing authorization server's `issuer` identifier. If protected-resource metadata later names a different authorization server, the client must not reuse the old credentials — it re-registers, or surfaces an error rather than silently trying a mismatched pair. Client ID Metadata Documents avoid this problem, because the authorization server resolves the URL on demand.

## Scope selection and step-up

The `WWW-Authenticate` challenge can carry a `scope` parameter naming what the current operation needs, and the client should treat those scopes as authoritative for that operation. When no scope is offered, the client falls back to the `scopes_supported` list in the protected-resource metadata.

At runtime an insufficiently scoped token produces `403 Forbidden` with `error="insufficient_scope"` and the required scopes. The client re-authorizes with the **union** of what it previously requested and what the challenge now names, so a per-operation challenge does not silently drop permissions the client still needs. Scope accumulation is the client's job; servers should emit all scopes an operation needs in one challenge rather than one at a time.

The reason to care is blast radius. A token granted every scope up front is a single credential whose theft reaches every tool, and revoking it disrupts everything at once.

## Authorization is narrower than tool safety

An access token proves that the client holds the represented authorization to call the MCP server. It does not prove that a tool is safe, that a tool description is trustworthy, or that the user approved a destructive invocation. Treat tool metadata and tool output as untrusted content, enforce server-side authorization per tool and resource, and require explicit confirmation for consequential actions — [MCP & Agentic Security]({{ '/topics/mcp-security-agentics/' | relative_url }}) covers that layer.

Two further boundaries worth keeping straight:

- **Audience validation failure** is a server accepting a token that was not issued for it. **Token passthrough** is a server forwarding such a token upstream. **Confused deputy**, in this specification's usage, is a narrower attack on a proxy server that pairs a static third-party client ID with dynamic client registration and a stale consent cookie.
- **A localhost redirect URI cannot be attributed to a process.** A Client ID Metadata Document proves control of a domain, not which local program is listening on the port, so an attacker can present a legitimate client's metadata URL and receive the code at their own loopback listener.

## Security and lifecycle checklist

- Canonicalize the resource URI consistently; prevent a client from obtaining a token for a parent or lookalike resource and replaying it elsewhere.
- Validate the authorization-server metadata `issuer` against the URL it was fetched from, and reject a mismatch.
- Validate the authorization response `iss` against the recorded issuer by exact string comparison, including on error responses. PKCE alone does not prevent a mix-up attack, because the client sends the verifier to the attacker's token endpoint.
- Key stored client credentials by authorization-server `issuer`, and re-register rather than reuse when the authorization server changes.
- Request the minimum scope, accumulate by union on step-up, and avoid publishing an omnibus scope catalog.
- Never forward the MCP access token upstream. The server uses its own upstream credential, or a deliberate token exchange targeting a different audience.
- Protect refresh tokens and client credentials, use platform redirect mechanisms, and treat a `localhost` redirect as unattributable to a specific process.
- Define token expiry, revocation, consent withdrawal, client de-registration, authorization-server key rollover, and MCP server URL migration. Note that MCP has no protocol-level session, so anything spanning requests is an explicit handle the server must authorize on every call rather than treat as proof of identity.
- Log authorization decisions, tool and resource access, client identity, resource, scope, and correlation identifiers — without logging bearer tokens or sensitive tool data.
- Test multiple authorization servers, unavailable metadata, issuer mismatch in both the metadata and the authorization response, wrong `resource`, token passthrough, stale keys, denied and insufficient scope, revoked tokens, and downgrade to unauthenticated endpoints.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>MCP's HTTP authorization profile uses protected-resource discovery and OAuth resource indicators to obtain a token for exactly one MCP server. Prefer the <code>WWW-Authenticate</code> path and fall back to well-known probing, validate the issuer twice — in the metadata document and in the authorization response — key client credentials to the authorization server that issued them, prefer Client ID Metadata Documents now that dynamic registration is deprecated, reject token passthrough, and keep tool authorization and human approval separate from OAuth login.</p>
</div>

## Primary references

- **[MCP Authorization, specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)** — verified the optional status, resource-indicator requirements, authorization-response issuer validation, scope selection and step-up, and the token-passthrough prohibition.
- **[MCP Authorization Server Discovery, specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery)** — verified the two protected-resource discovery mechanisms, their client-side priority, the metadata endpoint probing order, and the issuer-match validation.
- **[MCP Client Registration, specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration)** — verified the three mechanisms, their priority order, the deprecation of Dynamic Client Registration, and authorization-server binding.
- **[MCP Transports, specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)** — verified stdio and Streamable HTTP as the two standard bindings.
- **[RFC 9728: OAuth 2.0 Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728.html)** and **[RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707.html)** — verified discovery metadata and target-resource signaling.
- **[RFC 9207: OAuth 2.0 Authorization Server Issuer Identification](https://www.rfc-editor.org/rfc/rfc9207.html)** — verified the `iss` parameter and the mix-up attack it mitigates.
- **[OAuth 2.1 Internet-Draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/15/)** — verified the current non-final publication status.
