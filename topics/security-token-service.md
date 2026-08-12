---
title: Security Token Service (STS)
description: Deep architectural guide to Security Token Services (STS), WS-Trust origins, AWS STS assume-role mechanisms, and OAuth 2.0 Token Exchange (RFC 8693).
permalink: /topics/security-token-service/
last_verified: 2026-08-12
---

<span class="eyebrow">Authentication & Authorization / Concepts</span>

# Security Token Service (STS)

<p class="lede">A Security Token Service (STS) is an architectural service component that issues, exchanges, and validates security tokens across trust boundaries. An STS accepts identity evidence (SAML assertions, OIDC tokens, or client credentials) and trades it for short-lived, down-scoped security tokens (AWS IAM temporary credentials, OAuth 2.0 delegation tokens).</p>

## The Security Token Service Paradigm

Originated in the OASIS **WS-Trust** specification, an STS acts as a trusted broker between identity providers and relying party APIs:

<div class="diagram-frame">
  <img src="{{ '/assets/img/security-token-service-flow.svg' | relative_url }}" alt="Security token exchange from identity evidence through STS policy evaluation to a short-lived down-scoped resource token.">
  <p class="diagram-caption">An STS exchanges trusted identity evidence for a purpose-limited token</p>
</div>

Rather than sharing static long-lived credentials (*e.g., permanent AWS access keys or master database passwords*), clients present short-lived evidence to an STS to obtain dynamic, time-limited credentials.

## AWS Security Token Service (AWS STS)

AWS STS provides short-lived temporary security credentials for AWS IAM authorization. The valid session-duration range depends on the specific STS API operation: `AssumeRole` accepts 15 minutes up to the target role's configured maximum session duration (which itself is capped between 1 and 12 hours, default 1 hour if unspecified), while `GetSessionToken` and `GetFederationToken` accept 15 minutes up to 36 hours (default 12 hours), except when called with AWS account root user credentials, which are capped at 1 hour. See the [AWS STS API Reference](https://docs.aws.amazon.com/STS/latest/APIReference/Welcome.html) for the exact current values per operation:

<div class="diagram-frame">
  <img src="{{ '/assets/img/aws-sts-mechanisms.svg' | relative_url }}" alt="Comparison of AWS STS AssumeRole, AssumeRoleWithWebIdentity, and AssumeRoleWithSAML.">
  <p class="diagram-caption">The APIs differ mainly in the evidence accepted for role assumption</p>
</div>

### GitHub Actions OIDC to AWS STS Flow

Modern CI/CD pipelines avoid storing static AWS secret keys in repository secrets. Instead, GitHub Actions requests an OIDC token from GitHub's identity provider and trades it via `AssumeRoleWithWebIdentity` for temporary AWS STS credentials:

$$\text{GitHub OIDC JWT} \xrightarrow{\text{AWS STS}} \text{Temporary AWS Access Key + Secret Key + Session Token}$$

## OAuth 2.0 Token Exchange (RFC 8693)

Standardized in **[RFC 8693](https://www.rfc-editor.org/rfc/rfc8693)**, OAuth 2.0 Token Exchange brings the STS model to RESTful APIs and microservice architectures:

```http
POST /oauth/token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Atoken-exchange
&subject_token=eyJhbGciOiJKV1...
&subject_token_type=urn%3Aietf%3Aparams%3Aoauth%3Atoken-type%3Aaccess_token
&requested_token_type=urn%3Aietf%3Aparams%3Aoauth%3Atoken-type%3Aaccess_token
&audience=https://backend-service.internal/
```

### Impersonation vs Delegation Claims (RFC 8693)

| Exchange Mode | JSON Claim Structure | Architectural Audit Meaning |
|---|---|---|
| **Impersonation** | `{"sub": "user_123"}` | Client A assumes User B's identity completely; if the token carries only the `sub` claim, downstream APIs relying on the token alone cannot distinguish Client A from User B. |
| **Delegation** | `{"sub": "user_123", "act": {"sub": "client_A"}}` | Client A acts *on behalf of* User B. Downstream APIs can identify both the subject and current actor from the token; nested `act` claims can retain prior actors. Operational auditability still depends on issuer behavior and downstream logging. |

Whether actor context is preserved is a design choice of the issuing system, not an inherent property of "impersonation" as a category. RFC 8693 defines the `act` claim to express delegation, but does not prohibit an authorization server from populating it (or logging the original actor separately, e.g., in an audit trail) even when the resulting token otherwise behaves as an impersonation token. Systems that want auditability across an impersonation exchange can retain it; systems that strip actor identity by design cannot recover it downstream.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>An STS exchanges security tokens for new tokens appropriate to another trust domain or resource; credential type and duration depend on the implementation and operation. RFC 8693's <code>act</code> claim can identify the current actor, and nested <code>act</code> claims can retain prior actors. That improves downstream attribution but does not replace audit logging or guarantee full auditability.</p>
</div>

## Primary references

- **AWS STS Documentation**: *Temporary security credentials in IAM* — [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html) — verified per-operation session duration ranges via the [AWS STS API Reference](https://docs.aws.amazon.com/STS/latest/APIReference/Welcome.html).
- **RFC 8693**: *OAuth 2.0 Token Exchange* — [IETF RFC 8693](https://www.rfc-editor.org/rfc/rfc8693) — verified the `act` claim is not restricted to delegation-labeled exchanges.
