---
title: API & Microservice Security
description: Comprehensive technical guide to API and microservice security, OWASP API Security Top 10, Broken Object Level Authorization (BOLA), JWT signature & algorithm confusion attacks, and GraphQL query depth/introspection hardening.
permalink: /topics/api-microservice-security/
last_verified: 2026-08-13
---

<span class="eyebrow">Application Security / API Security</span>

# API & Microservice Security

<p class="lede">APIs and microservice endpoints are the primary data transport mechanisms of modern cloud-native architectures. Unlike traditional web applications that render HTML server-side, APIs expose raw underlying data objects and business logic directly to client applications. Securing APIs requires defending against the OWASP API Security Top 10—specifically Broken Object Level Authorization (BOLA), hardening JSON Web Token (JWT) verification, and enforcing GraphQL query complexity limits.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/api-microservice-security.svg' | relative_url }}" alt="API &amp; Microservice Security diagram showing OWASP API Top 10, BOLA, JWT security, and GraphQL query depth limits.">
  <p class="diagram-caption">API &amp; Microservice Security Architecture: OWASP API Top 10 &leftrightarrow; BOLA Authorization Enforcement &leftrightarrow; JWT Hardening &amp; Rate Limiting</p>
</div>

## OWASP API Security Top 10

The **OWASP API Security Top 10** highlights the recurring vulnerability patterns specific to REST, gRPC, and GraphQL APIs:

| Vulnerability ID | Vulnerability Title | Operational Vulnerability &amp; Risk Surface |
|---|---|---|
| **API1:2023** | **Broken Object Level Authorization (BOLA)** | User accesses data objects belonging to other users by manipulating resource IDs in API paths. |
| **API2:2023** | **Broken Authentication** | Flawed authentication mechanisms, exposed tokens, or missing signature validation. |
| **API3:2023** | **Broken Object Property Level Authorization** | Exposing sensitive internal object properties (*Mass Assignment*) or allowing unauthorized property updates. |
| **API4:2023** | **Unrestricted Resource Consumption** | Missing API rate limits, execution timeouts, or payload size caps leading to DoS. |
| **API5:2023** | **Broken Function Level Authorization (BFLA)** | Regular users executing administrative API functions (*e.g., POST /api/v1/admin/users*). |
| **API6:2023** | **Unrestricted Access to Sensitive Business Flows** | Automated bots exploiting legitimate business workflows (*e.g. ticket buying, account creation*). |
| **API7:2023** | **Server Side Request Forgery (SSRF)** | API endpoints fetching external URLs without validating IP ranges or protocol schemes. |
| **API8:2023** | **Security Misconfiguration** | Unencrypted transport, verbose error stack traces, CORS wildcard origins (`*`). |
| **API9:2023** | **Improper Inventory Management** | Shadow APIs, un-deprecated legacy endpoint versions (`/api/v1`), un-documented endpoints. |
| **API10:2023** | **Unsafe Consumption of APIs** | Blindly trusting third-party API data without input sanitization or validation. |

## Mitigating Broken Object Level Authorization (BOLA / IDOR)

BOLA (Insecure Direct Object Reference) is the **#1 vulnerability in API security**:

```
GET /api/v1/account/101 (User 101 Authorized)  ──> SUCCESS (200 OK)
GET /api/v1/account/102 (User 101 Unauthorized) ──> BOLA Flaw Returns User 102 Data!
```

### Technical Defense: Mandatory Object-Level Context Checks
An API endpoint must never assume that an authenticated user is authorized to access a requested resource ID simply because the user holds a valid session token. Every handler must execute explicit ownership verification:

```python
# SECURE API HANDLER (Python / FastAPI Example)
@app.get("/api/v1/account/{account_id}")
def get_account(account_id: str, current_user: User = Depends(get_current_user)):
    # 1. Query object from database
    account = db.find_account(account_id)
    
    # 2. ENFORCE BOLA OBJECT-LEVEL AUTHORIZATION CHECK
    if account.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden: Unauthorized object access")
        
    return account
```

## JSON Web Token (JWT) Hardening & Attack Mitigations

JSON Web Tokens (JWTs - RFC 7519) are widely used for stateless API authorization. Flawed JWT verification introduces severe authentication bypasses:

```
[ JWT Header (alg, kid) ] . [ Payload (sub, exp, roles) ] . [ Cryptographic Signature ]
```

1. **Algorithm Confusion (`alg: none`) Attack**: Attackers set `"alg": "none"` in the JWT header and strip the signature.
   - *Fix*: Explicitly reject `none` algorithm algorithms in the JWT parser configuration.
2. **RS256 to HS256 Public Key Substitution**: Attackers change `"alg": "RS256"` (Asymmetric) to `"HS256"` (Symmetric) and sign the token using the server's public RSA key as the secret key.
   - *Fix*: Enforce fixed, explicit algorithm expectations in verification handlers; never trust the `alg` header blindly.
3. **Key ID (`kid`) Injection**: Attackers manipulate the `kid` header field to perform SQL injection or directory traversal (`../../dev/null`) during key lookup.
   - *Fix*: Treat `kid` as untrusted string input; sanitize and match against an explicit whitelist of key identifiers.

## GraphQL Security Hardening

GraphQL APIs allow clients to request arbitrary nested data schemas through a single HTTP endpoint (`/graphql`), introducing unique attack vectors:

- **Introspection Disabling**: Disable GraphQL introspection queries in production to prevent adversaries from mapping the complete schema.
- **Max Query Depth Limits**: Enforce maximum depth limits (e.g. max depth = 5) to block recursive nested queries (*e.g. `user { friends { friends { friends ... } } }`*) designed to crash database engines.
- **Batching & Cost Analysis**: Assign cost scores to schema fields and enforce maximum query cost limits to prevent resource exhaustion via batched queries.

## Essential API Security Diagnostic Checklist

When auditing an API gateway or microservices cluster, evaluate these 6 criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **BOLA Object-Level Checks** | Does every API endpoint handler verify that the authenticated user owns the requested resource ID? | API code review &amp; automated BOLA test logs. |
| **JWT Verification Hardening** | Are `alg: none` tokens explicitly rejected and algorithm expectations fixed in the JWT verifier? | JWT middleware config &amp; security unit tests. |
| **GraphQL Production Hardening** | Is GraphQL introspection disabled in production and max query depth limits enforced? | GraphQL server configuration files. |
| **API Rate Limiting** | Are rate limits enforced at the API Gateway level per IP address and client identity token? | API Gateway rate limit policies (Kong / Envoy / AWS API GW). |
| **DTO Mass Assignment Shield** | Are API request inputs bound strictly to explicit Data Transfer Objects (DTOs) omitting internal fields? | API DTO class definitions &amp; schema validators. |
| **API Inventory & Spec Audit** | Is an up-to-date OpenAPI (Swagger) specification automatically generated and audited for shadow APIs? | OpenAPI spec files &amp; API discovery tool reports. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>APIs expose raw data objects directly. Defend against Broken Object Level Authorization (BOLA) by verifying user ownership of object IDs on every request. Harden JWT verification against algorithm confusion attacks, and enforce query depth limits on GraphQL endpoints.</p>
</div>

## Primary references

- **OWASP API Security Top 10**: *API Vulnerability Project (2023)* — [OWASP API Security](https://owasp.org/www-project-api-security/)
- **RFC 7519**: *JSON Web Token (JWT) Specification* — [IETF Datatracker](https://datatracker.ietf.org/doc/html/rfc7519)
