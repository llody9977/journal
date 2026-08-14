---
title: API & Microservice Security
description: Technical reference for the OWASP API Security Top 10 (2023), object- and function-level authorization enforcement, JWT verification against RFC 8725, GraphQL cost controls, and service-to-service identity between microservices.
permalink: /topics/api-microservice-security/
last_verified: 2026-08-14
---

<span class="eyebrow">Application Security / API Security</span>

# API & Microservice Security

<p class="lede">A server-rendered application decides what a user may see and then emits HTML containing only that. An API inverts the arrangement: it exposes object identifiers and lets the client ask for them by name. That shift moves the authorization decision from a template into every request handler, and it is where most API breaches originate — not in a broken cryptographic primitive, but in a handler that authenticated the caller and then never asked whether this caller may have this object. The second half of the problem is internal: once a system is decomposed into services, every internal call also needs an identity and an authorization decision.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/api-microservice-security.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the API and microservice security controls diagram at full size">
    <img src="{{ '/assets/img/api-microservice-security.svg' | relative_url }}" alt="Three panels. Broken object level authorization: swapping a resource identifier returns another user's object because the handler checked authentication but not ownership, remediated by an ownership check on every handler. JWT verification: rejecting the none algorithm, pinning the expected algorithm against RS256-to-HS256 confusion, treating kid as untrusted, and validating issuer, audience and expiry. GraphQL and resource limits: introspection disabled in production, depth and cost ceilings, and rate limits applied per client identity rather than per IP alone.">
  </a>
  <p class="diagram-caption">Where API authorization is actually enforced, and the three verification steps a token check has to complete</p>
</div>

## The OWASP API Security Top 10 (2023)

The current published edition is **2023**, released by the OWASP API Security Project on 5 June 2023. Like the main Top 10 it is an awareness document rather than a standard.

| ID | Title | Risk surface |
|---|---|---|
| **API1:2023** | **Broken Object Level Authorization (BOLA)** | A caller reaches another user's object by changing an identifier in the path, query, or body. |
| **API2:2023** | **Broken Authentication** | Weak or missing credential verification, unvalidated tokens, guessable session material, absent brute-force limits. |
| **API3:2023** | **Broken Object Property Level Authorization** | Reading properties the caller should not see, or writing properties the caller should not set (*mass assignment*). Merges the 2019 excessive-data-exposure and mass-assignment entries. |
| **API4:2023** | **Unrestricted Resource Consumption** | Absent rate limits, payload caps, execution timeouts, or spend limits on metered downstream services. |
| **API5:2023** | **Broken Function Level Authorization (BFLA)** | A regular user invokes an administrative operation because the route, not the identity, was assumed to be the control. |
| **API6:2023** | **Unrestricted Access to Sensitive Business Flows** | Automation abusing a flow that is functioning correctly — bulk purchase, mass account creation, scraping. |
| **API7:2023** | **Server Side Request Forgery** | The API fetches a caller-supplied URL without bounding the destination. |
| **API8:2023** | **Security Misconfiguration** | Missing transport security, verbose stack traces, permissive CORS, unpatched components. |
| **API9:2023** | **Improper Inventory Management** | Undocumented, shadow, and un-retired endpoints, including older versions left routable. |
| **API10:2023** | **Unsafe Consumption of APIs** | Trusting data returned by a third-party API without the validation applied to user input. |

Four of the ten — API1, API3, API5, and to a degree API7 — are authorization failures. That concentration is the point of the list.

## Object-level authorization: the check that has to be in every handler

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/bola-request-flow.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the broken object level authorization request flow diagram at full size">
    <img src="{{ '/assets/img/bola-request-flow.svg' | relative_url }}" alt="Two request lanes compared. In the vulnerable lane a caller holding a valid token for account 101 requests account 102; the gateway validates the token, the handler loads the object by identifier, and the response returns another user's data. In the fixed lane the same request reaches a handler that loads the object, compares its owner against the authenticated subject, and returns 404 rather than 403 so the response does not disclose that the object exists. A footer notes that authentication answers who is calling while object-level authorization answers whether this caller may have this object, and that unguessable identifiers are not an authorization control.">
  </a>
  <p class="diagram-caption">Same token, same route, one missing comparison — and why the deny path returns 404 rather than 403</p>
</div>

BOLA (also called IDOR, *insecure direct object reference*, the older and broader term) is ranked **API1:2023**, first in the OWASP API Security Top 10. The mechanism is a handler that treats a valid session as sufficient:

```python
# VULNERABLE: authentication was checked; authorization was not.
@app.get("/api/v1/account/{account_id}")
def get_account(account_id: str, current_user: User = Depends(get_current_user)):
    return db.find_account(account_id)
```

The corrected handler loads the object, compares its owner against the authenticated subject, and returns the same response for "does not exist" and "exists but is not yours":

```python
# SECURE: ownership is verified on the loaded object, and the deny path
# does not disclose whether the object exists.
@app.get("/api/v1/account/{account_id}")
def get_account(account_id: str, current_user: User = Depends(get_current_user)):
    account = db.find_account(account_id)

    # A missing object and an unauthorized object return the same status,
    # so the response cannot be used to enumerate valid identifiers.
    if account is None or not can_read_account(current_user, account):
        raise HTTPException(status_code=404, detail="Not found")

    return account
```

Three details carry most of the weight:

- **404 rather than 403 on the deny path.** Returning 403 for an object the caller does not own confirms that the identifier is valid, which re-enables the enumeration the check exists to stop. Use 404 wherever object existence is itself sensitive; 403 is a reasonable choice only where existence is public knowledge and the distinction helps legitimate callers debug.
- **A missing object must not crash.** Dereferencing a `None` result raises and returns 500, which is both an availability bug and an oracle — a 500 and a 404 are distinguishable.
- **Centralize the decision, do not inline the rule.** `can_read_account` above stands for a single authorization function or policy engine. An `if account.owner_id != current_user.id` copied into ninety handlers will be missing from at least one, and admin exceptions written inline are how BFLA appears. See [Authorization Models]({{ '/topics/authorization-models/' | relative_url }}) for the RBAC, ABAC, and ReBAC models behind that function.

**Unguessable identifiers are not an authorization control.** Replacing sequential integers with UUIDv4 raises the cost of blind enumeration and is worth doing, but identifiers leak through referral headers, logs, share links, exports, and other endpoints. Treat it as a hardening measure layered on the check, never as the check.

### Function-level and property-level authorization

- **BFLA (API5)** is the same omission at the route level: an administrative handler that is protected only by not being linked in the client. Enforce the role or permission requirement in the handler or in a policy layer the router cannot bypass, and test the administrative route with a non-administrative token as a standing test case.
- **Mass assignment (API3)** happens when a request body is bound directly onto a persistence model, letting the caller set `role`, `is_admin`, `account_balance`, or `owner_id`. Bind to an explicit data transfer object listing exactly the writable fields, and serialize responses through an explicit output schema so newly added internal columns are not exposed by default.

## JWT verification

A JSON Web Token (JWT, [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)) is a set of claims carried in a JWS Compact Serialization — three base64url segments separated by dots:

```
base64url(header) . base64url(payload) . base64url(signature)
```

**The payload is encoded, not encrypted.** Anyone holding the token can read every claim. Do not place data in a JWT that the bearer should not see.

The mitigations below are specified in [RFC 8725 / BCP 225, *JSON Web Token Best Current Practices*](https://datatracker.ietf.org/doc/html/rfc8725) — the document to cite for JWT hardening, since RFC 7519 defines the format rather than how to verify it safely.

| Attack | Mechanism | Required verification behavior |
|---|---|---|
| **Unsecured JWS (`"alg":"none"`)** | The header declares no algorithm and the signature segment is empty. A parser that honors the header accepts an unsigned token. | Reject `none` explicitly. Never let the token select whether verification happens. |
| **Algorithm confusion (RS256 → HS256)** | The attacker rewrites `alg` from an asymmetric to a symmetric algorithm and signs with the server's *public* key as the HMAC secret. A verifier that reads `alg` from the token then verifies the HMAC with that same public key, which it has. | Pin the expected algorithm at the verifier from configuration, not from the token. Bind each key to one algorithm. |
| **`kid` injection** | The key identifier header is used to look up a key — via file path, database query, or URL — and is attacker-controlled, giving path traversal or SQL injection at the lookup. | Treat `kid` as untrusted input. Match it against an explicit set of known key identifiers; never concatenate it into a path or query. |
| **`jku` / `x5u` header injection** | The token points the verifier at an attacker-hosted key set. | Ignore these headers, or resolve them only against an allowlisted issuer URL. |

Algorithm attacks get the attention; **claim validation is the more common production failure**. A verifier must check, on every request:

- **`iss`** matches the expected issuer, and the verification key belongs to that issuer.
- **`aud`** contains this service. Without this, a token minted for a different service in the same estate is accepted here — the most common cross-service escalation.
- **`exp`**, and `nbf` where present, against the current time with only a small clock-skew allowance.
- **Scopes and roles** against what this operation requires, rather than the presence of a valid token being treated as sufficient.

### Lifetime, revocation, and binding

A stateless token is valid until it expires, because nothing consults the issuer at use time. That is the point of the design and also its cost:

- **Short access-token lifetimes bound the exposure window** after theft. Any specific value is an operational choice, not a standard requirement — the trade is refresh traffic and issuer availability against how long a stolen token stays useful.
- **Revocation needs a mechanism you actually deploy**: token introspection ([RFC 7662](https://datatracker.ietf.org/doc/html/rfc7662)) makes the check stateful; a denylist keyed on the `jti` claim keeps stateless validation for the common path. Neither is free.
- **Sender-constrained tokens** remove the bearer property: **DPoP** ([RFC 9449](https://datatracker.ietf.org/doc/html/rfc9449)) binds the token to a client-held key proven per request, and **mTLS-bound tokens** ([RFC 8705](https://datatracker.ietf.org/doc/html/rfc8705)) bind it to the client certificate. A stolen sender-constrained token is not usable on its own.
- For access tokens intended to be validated by resource servers, [RFC 9068](https://datatracker.ietf.org/doc/html/rfc9068) defines the JWT profile — including the `at+jwt` type header, which lets a verifier reject an ID token presented as an access token.

Token issuance, scopes, and the flows that produce these tokens are covered in [OAuth & OpenID Connect]({{ '/topics/oauth-oidc/' | relative_url }}); short-lived credential exchange is in [Security Token Service (STS)]({{ '/topics/security-token-service/' | relative_url }}).

## GraphQL: one endpoint, caller-defined query cost

GraphQL moves query composition to the client. A single `POST /graphql` can request an arbitrary traversal of the schema, so the server no longer controls how much work a request implies.

- **Disable introspection in production.** Introspection returns the full schema, including fields not used by the first-party client. Disabling it is not a security boundary — schemas can be inferred through field suggestions and clients ship queries — but it removes the free map.
- **Cap query depth.** Recursive relationships (`user { friends { friends { … } } }`) expand combinatorially and exhaust resolver, memory, and database resources. A ceiling such as depth 5 is an application-specific setting, not a standard value; pick it from the deepest legitimate query the first-party client issues.
- **Score query cost, not just depth.** Assign per-field costs weighted by expected result size and reject queries over a budget. Depth alone does not catch a shallow query requesting a million-row list.
- **Bound aliases and batching.** Field aliasing lets one document repeat the same expensive field hundreds of times at constant depth; array-batched requests multiply the whole document. Cap both.
- **Authorize in resolvers, not at the endpoint.** Every resolver returning an object is a separate object-level authorization decision. A single endpoint-level check is API1 waiting to happen.
- **Disable batching on authentication mutations,** or rate-limit them per identity — batched `login` mutations in one HTTP request are a standard way around per-request brute-force limits.

## Resource consumption and rate limiting

API4 is about the absence of ceilings, and the ceilings have to be layered because each catches a different abuse:

- **Per-client-identity limits** on the authenticated subject or API key. IP-based limits alone are defeated by distributed clients and penalize shared egress addresses such as corporate NAT.
- **Request and payload caps** — maximum body size, maximum array lengths, maximum page size on list endpoints, and pagination that is enforced rather than advisory.
- **Execution timeouts and connection caps** on the service and on every downstream call, so one slow dependency does not hold the whole pool.
- **Spend limits on metered downstream services.** Where a request triggers an SMS, an email, or a model inference, an unlimited endpoint is a direct financial loss rather than only a capacity problem.
- **Business-flow limits (API6)** measure a legitimate operation at illegitimate volume — account creation, checkout, coupon redemption. These need per-flow counters and anomaly thresholds; a generic request-rate limit does not see them.

Return `429 Too Many Requests` with `Retry-After` so well-behaved clients back off.

## Service-to-service security between microservices

Everything above concerns the north-south edge. Decomposition creates a second, larger surface: east-west calls between services, which frequently inherit an implicit trust that the network no longer justifies.

| Concern | East-west treatment |
|---|---|
| **Service identity** | Each workload gets a cryptographic identity, not a shared static secret. [SPIFFE](https://spiffe.io/docs/latest/spiffe-about/overview/) defines the SPIFFE ID and the SVID document that carries it; a service mesh (Istio, Linkerd) or the platform issues and rotates them automatically. See [Workload Identity Federation]({{ '/topics/workload-identity-federation/' | relative_url }}). |
| **Transport authentication** | Mutual TLS between services, so both ends are authenticated and the channel is confidential. This authenticates the *workload*; it does not carry the end user's identity. |
| **End-user context** | Propagate the caller's identity explicitly as a signed token that each hop validates with its own `aud`, rather than trusting a plain header. Token exchange ([RFC 8693](https://datatracker.ietf.org/doc/html/rfc8693)) narrows a token's audience and scope at each hop, so a downstream compromise does not yield a token usable everywhere. |
| **Authorization** | Per-service policy on both the caller's workload identity and the end user's claims. mTLS establishes that service A is calling; it does not establish that service A may perform this operation for this user. |
| **Blast radius** | Network policy restricting which services may reach which — see [Network Segmentation & Microsegmentation]({{ '/topics/network-segmentation-microsegmentation/' | relative_url }}). Flat pod networks make one compromised service equivalent to all of them. |

Two failure modes specific to this layer are worth naming: **the confused deputy**, where an internal service performs a privileged action on behalf of a caller without re-checking that caller's authority; and **trusting internal headers**, where an `X-User-Id` set by the gateway is accepted by a service that is also reachable directly.

For **gRPC**, the same requirements hold with different mechanics: transport security is channel credentials, per-call identity is call credentials, and authorization belongs in an interceptor so it cannot be skipped per method. Set maximum message sizes explicitly — the default receive limit is a resource control, and streaming methods need their own timeouts, since a long-lived stream is not bounded by a per-request deadline.

## API inventory and lifecycle

API9 is an inventory problem before it is a vulnerability. Endpoints outlive the teams that wrote them, and an unlisted `/api/v1` retains the flaws that `/api/v2` fixed.

- Generate the OpenAPI or protobuf specification **from the running code**, not by hand, and fail the build when a route exists that the specification does not describe.
- Reconcile the generated specification against observed gateway traffic to surface shadow endpoints.
- Give versions an announced deprecation and removal date, and return `410 Gone` after removal rather than leaving the route quietly routable.
- Keep non-production deployments off public DNS or behind the same authentication as production; a staging copy with production data is the same breach.

## API security review checklist

The checklist below is a journal working model, not a published audit standard. When auditing an API estate, evaluate these eight criteria:

| Diagnostic area | Evaluation question | Verification &amp; audit evidence |
|---|---|---|
| **Object-level authorization coverage** | Does every handler that accepts a client-supplied identifier route through a shared authorization function, and does the deny path return 404 where existence is sensitive? | Handler inventory against route table, authorization function call sites, an automated cross-account access test per resource type. |
| **Function-level authorization** | Is every administrative route enforced by role or permission at the handler rather than by obscurity, with a standing negative test using a non-administrative token? | Route-to-permission mapping, CI test results for the administrative deny case. |
| **Write and read shaping** | Are request bodies bound to explicit DTOs and responses serialized through explicit output schemas, so new model fields are not exposed or writable by default? | DTO and serializer definitions, a diff of model fields against exposed fields. |
| **Token verification completeness** | Does the verifier pin the algorithm, reject `none`, and validate `iss`, `aud`, and `exp` on every request — with `kid` matched against a known set? | JWT middleware configuration, unit tests for each attack case, key-set loading code. |
| **Token lifetime and revocation** | Is there a deployed revocation path, and is the access-token lifetime a documented decision rather than a default? | Introspection or denylist implementation, issuer configuration, incident runbook for token compromise. |
| **Query cost limits** | For GraphQL, are introspection disabled in production and depth, cost, alias, and batch ceilings enforced — with authorization in resolvers? | GraphQL server configuration, cost analysis plugin settings, resolver authorization review. |
| **Layered consumption limits** | Are rate limits applied per client identity as well as per IP, with payload caps, timeouts, and spend limits on metered downstream calls? | Gateway policy, load-test evidence, downstream spend alerts. |
| **East-west identity** | Do internal calls authenticate with workload identity and mutual TLS, and is end-user context carried in a validated token rather than a trusted header? | Mesh policy (`STRICT` mTLS), SPIFFE ID inventory, a direct-call test bypassing the gateway. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Authentication answers who is calling; object-level authorization answers whether this caller may have this object, and it has to run in every handler that accepts an identifier — returning 404, not 403, wherever existence is sensitive. Unguessable IDs are hardening, never the check. For JWTs, pin the algorithm at the verifier and validate <code>iss</code>, <code>aud</code>, and <code>exp</code> — a missing audience check is how a token for one service works on another. GraphQL hands query cost to the caller, so cap depth, cost, aliases, and batches. Between services, mutual TLS proves which workload is calling and nothing about whether it may act for this user.</p>
</div>

## Primary references

- **[OWASP API Security Project](https://owasp.org/www-project-api-security/)** — verified that 2023 is the current published edition and the ten category identifiers and titles used above.
- **[RFC 7519: JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519)** — verified the compact serialization structure and that claims are base64url-encoded rather than encrypted.
- **[RFC 8725 / BCP 225: JSON Web Token Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725)** — verified as a Best Current Practice, and the source for rejecting `none`, pinning the algorithm, and treating `kid` and `jku` as untrusted.
- **[RFC 9068: JWT Profile for OAuth 2.0 Access Tokens](https://datatracker.ietf.org/doc/html/rfc9068)** — verified the `at+jwt` type header and the required claim validation for access tokens.
- **[RFC 9449: OAuth 2.0 Demonstrating Proof of Possession (DPoP)](https://datatracker.ietf.org/doc/html/rfc9449)** — verified the per-request proof mechanism that removes the bearer property.
- **[RFC 8693: OAuth 2.0 Token Exchange](https://datatracker.ietf.org/doc/html/rfc8693)** — verified audience and scope narrowing across service hops.
- **[SPIFFE overview](https://spiffe.io/docs/latest/spiffe-about/overview/)** — verified the SPIFFE ID and SVID model for workload identity between services.
