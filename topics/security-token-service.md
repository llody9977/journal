---
title: Security Token Service (STS)
description: Security token issuance and exchange across trust domains, AWS STS role assumption, workload federation, and OAuth 2.0 Token Exchange.
permalink: /topics/security-token-service/
last_verified: 2026-08-13
---

<span class="eyebrow">Authentication & Authorization / Concepts</span>

# Security Token Service (STS)

<p class="lede">A Security Token Service (STS) validates configured evidence and issues a new credential or assertion under its own policy. The output's audience, scope, subject, actor, lifetime, and sender constraints are choices of the service and protocol profile; token exchange does not inherently down-scope, shorten, or revoke the input credential.</p>

## STS is an architectural role, not one wire protocol

WS-Trust standardized an STS model for SOAP security. AWS STS and OAuth 2.0 Token Exchange implement related brokerage patterns through different protocols and token semantics. None is the historical origin of every service that issues or exchanges credentials.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/security-token-service-flow.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the security token service policy flow at full size">
    <img src="{{ '/assets/img/security-token-service-flow.svg' | relative_url }}" alt="Security token service flow: configured caller evidence and client authentication enter policy validation; the service selects subject, actor, audience, scope, lifetime, and token type; it may then issue a target credential under that policy.">
  </a>
  <p class="diagram-caption">An STS can narrow, preserve, or transform authority only as its validated policy and output profile define.</p>
</div>

The service must validate the input issuer, audience, signature or introspection result, time bounds, token type, intended use, client authentication, and any proof-of-possession requirement before treating evidence as trusted. It then applies local authorization rather than assuming that a valid input token is exchangeable.

## AWS STS operations and duration boundaries

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/aws-sts-mechanisms.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the AWS STS role-assumption mechanisms diagram at full size">
    <img src="{{ '/assets/img/aws-sts-mechanisms.svg' | relative_url }}" alt="AWS STS mechanisms comparing AssumeRole for an AWS principal, AssumeRoleWithWebIdentity for trusted OIDC evidence, and AssumeRoleWithSAML for a trusted SAML assertion.">
  </a>
  <p class="diagram-caption">Each operation accepts different caller evidence and evaluates a role trust policy before returning temporary AWS credentials.</p>
</div>

- `AssumeRole` accepts 15 minutes through the role's configured maximum session duration, which can be 1–12 hours. **Role chaining is limited to one hour**, even if the target role allows longer sessions.
- `AssumeRoleWithWebIdentity` and `AssumeRoleWithSAML` apply their own operation and role-duration rules.
- `GetSessionToken` and `GetFederationToken` support operation-specific ranges; calls using root credentials are capped at one hour. Root credentials should not be used for routine federation.

AWS temporary credentials remain bearer-like credential sets: access key ID, secret access key, and session token. Their permissions are the intersection and union effects defined by the role, resource policies, permissions boundaries, session policy, SCPs, and other AWS policy layers—not simply “the scopes in the source token.”

### GitHub Actions OIDC trust must restrict the workflow identity

The role trust policy should validate GitHub's token issuer and `aud`, and restrict `sub` to the intended organization, repository, branch, tag, environment, or reusable workflow pattern. A trust policy that accepts every subject from the GitHub issuer turns any eligible repository or workflow into a role-assumption path. Protect the workflow files and environment approval rules because they become authorization inputs.

For the wider lifecycle, provider mapping, and SPIFFE comparison, see **[Workload Identity Federation]({{ '/topics/workload-identity-federation/' | relative_url }})**.

## OAuth 2.0 Token Exchange

RFC 8693 defines a grant in which a client presents a `subject_token` and may request a token type, resource, audience, and scope. The client still authenticates under the authorization server's normal token-endpoint policy when authentication is required.

```http
POST /oauth/token HTTP/1.1
Host: authorization.example
Authorization: Basic BASE64-OF-CLIENT-CREDENTIALS
Content-Type: application/x-www-form-urlencoded

grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Atoken-exchange
&subject_token=eyJhbGciOiJSUzI1NiIs...
&subject_token_type=urn%3Aietf%3Aparams%3Aoauth%3Atoken-type%3Aaccess_token
&requested_token_type=urn%3Aietf%3Aparams%3Aoauth%3Atoken-type%3Aaccess_token
&resource=https%3A%2F%2Fbackend.example%2F
&scope=records.read
```

The illustrative Basic client authentication above is appropriate only over TLS and only where that client method is configured; private-key JWT or mTLS may be preferable. A successful response includes `access_token`, `issued_token_type`, `token_type`, and possibly `expires_in`, `scope`, and `refresh_token`. The client and target resource server must interpret the output under its declared token profile.

### Subject, actor, impersonation, and delegation

| Representation | Meaning available to the recipient | Limit |
|---|---|---|
| `{"sub":"user_123"}` | Identifies the token subject. | Does not reveal which client or service initiated the exchange unless another claim or audit record carries it. |
| `{"sub":"user_123","act":{"sub":"service_A"}}` | Identifies a current actor acting for the subject; nested `act` can retain a prior actor chain. | Downstream attribution still depends on issuer integrity, claim validation, logging, and local authorization. |

RFC 8693 does not guarantee down-scoping. The authorization server must define how requested resource/audience/scope interact with the input authority and must reject escalation. Chained exchanges amplify policy mistakes and make revocation harder because invalidating an input may not automatically invalidate already issued outputs.

## Operational and lifecycle controls

1. Inventory trusted issuers, input token types, client-authentication methods, claim mappings, target audiences, output formats, signing keys, and maximum lifetimes.
2. Apply explicit allowlists for exchange paths; reject arbitrary issuer-to-resource or token-type conversion.
3. Preserve subject and actor context required for downstream audit, while minimizing personal data.
4. Detect replay, unusual exchange chains, audience expansion, anomalous subject/client combinations, and repeated denied exchanges.
5. Define revocation propagation: introspection, short lifetimes, deny lists, session revocation, or provider-specific invalidation. State what happens to already issued descendants.
6. Test key rollover, issuer outage, expired evidence, unknown token type, target-resource mismatch, client-authentication failure, scope escalation, chain depth, and emergency trust removal.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>An STS issues a new credential according to its own trust and authorization policy. Validate both caller and evidence, constrain every exchange path, preserve subject/actor semantics, and define lifetime and revocation propagation; do not assume exchange automatically narrows authority.</p>
</div>

## Primary references

- **[OASIS WS-Trust 1.4](https://docs.oasis-open.org/ws-sx/ws-trust/v1.4/ws-trust.html)** — verified the WS-Trust STS model without treating it as the origin of all token services.
- **[AWS STS API Reference](https://docs.aws.amazon.com/STS/latest/APIReference/Welcome.html)** and **[AssumeRole](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)** — verified temporary-credential operations, durations, and the one-hour role-chaining limit.
- **[AWS IAM OIDC federation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html)** and **[GitHub OIDC for AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)** — verified trust-policy audience and subject restrictions.
- **[RFC 8693: OAuth 2.0 Token Exchange](https://www.rfc-editor.org/rfc/rfc8693.html)** — verified request, response, actor, delegation, and token-exchange semantics.
