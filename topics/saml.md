---
title: SAML 2.0
description: SAML 2.0 browser SSO roles, bindings, signed-response and assertion validation, metadata and certificate rollover, replay defense, and OIDC comparison.
permalink: /topics/saml/
last_verified: 2026-08-13
---

<span class="eyebrow">Authentication & Authorization / Protocol</span>

# SAML 2.0

<p class="lede">Security Assertion Markup Language (SAML) 2.0 federates authentication and attributes between an identity provider and a service provider. In browser SSO, the browser transports protocol messages, but the service provider's trust comes from validated signatures, metadata, message correlation, destination and audience checks, time limits, and replay controls—not from the browser session itself.</p>

## Actors, metadata, and browser flow

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/saml-sp-initiated-flow.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the SAML service-provider-initiated flow at full size">
    <img src="{{ '/assets/img/saml-sp-initiated-flow.svg' | relative_url }}" alt="SAML service-provider-initiated SSO sequence: the service provider creates an AuthnRequest, the browser carries it to the identity provider, the identity provider authenticates the user, and the browser posts a protected SAML response to the service provider's assertion consumer service.">
  </a>
  <p class="diagram-caption">The browser is a message carrier; the SP validates the response under its configured IdP trust and the request it initiated.</p>
</div>

- **Identity Provider (IdP)**: Authenticates the subject and issues a SAML response containing assertions.
- **Service Provider (SP)**: Requests authentication, receives the response at an Assertion Consumer Service (ACS), validates it, and establishes its own application session.
- **Metadata**: Publishes entity identifiers, endpoints, bindings, signing/encryption keys, and supported roles. Metadata must be obtained and refreshed through an authenticated trust process; XML signature presence alone does not establish trust in an unknown signer.
- **Browser**: Carries redirects, form posts, and cookies. It is not trusted to preserve or select security-sensitive XML.

## SP-initiated and IdP-initiated flows have different correlation evidence

| Validation axis | SP-initiated SSO | IdP-initiated or unsolicited response |
|---|---|---|
| **Request correlation** | Validate `InResponseTo` against a live, single-use AuthnRequest identifier. | No initiating AuthnRequest exists; policy must explicitly permit unsolicited responses. |
| **Replay defense** | Correlation plus assertion/response ID replay tracking and time checks. | Assertion/response ID replay tracking and time checks are essential because request correlation is unavailable. |
| **Destination and recipient** | Validate the response `Destination` and bearer `Recipient` against the exact ACS. | Apply the same checks. |
| **Risk decision** | Generally easier to bind to locally initiated state. | Accept only when the business need and compensating controls justify the weaker correlation model. |

Neither flow is secure when signature selection, audience, recipient, issuer, timing, or replay validation is weak.

## Signature location and XML processing are part of the policy

The Web Browser SSO profile requires integrity protection for the delivered assertion. Depending on the binding and profile, that protection can come from a signed response, a signed assertion, or both. The SP must define which structure it accepts and verify that the exact element consumed by application logic is the element protected by a trusted signature.

XML Signature Wrapping exploits appear when signature validation resolves one element but business logic reads another element with a duplicated or relocated identifier. Defenses include hardened XML parsers, schema and namespace validation, unique-ID enforcement, an explicit expected signature location, rejection of unexpected assertions or signatures, and passing the already-validated element directly to claim processing.

## Illustrative browser SSO response structure

This fragment shows the security-relevant structure; namespace boilerplate, canonicalized signature values, and optional attributes are abbreviated. It is not a reusable production response.

```xml
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                ID="_response123" InResponseTo="_request456"
                Version="2.0" IssueInstant="2026-08-13T09:00:00Z"
                Destination="https://sp.example/saml/acs">
  <saml:Issuer>https://idp.example/metadata</saml:Issuer>
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <!-- Trusted signature over this Response ID; values omitted. -->
  </ds:Signature>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  <saml:Assertion ID="_assertion789" Version="2.0"
                  IssueInstant="2026-08-13T09:00:00Z">
    <saml:Issuer>https://idp.example/metadata</saml:Issuer>
    <saml:Subject>
      <saml:NameID>alice@example.com</saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData InResponseTo="_request456"
          Recipient="https://sp.example/saml/acs"
          NotOnOrAfter="2026-08-13T09:05:00Z"/>
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="2026-08-13T08:59:00Z"
                     NotOnOrAfter="2026-08-13T09:05:00Z">
      <saml:AudienceRestriction>
        <saml:Audience>https://sp.example/metadata</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement AuthnInstant="2026-08-13T08:59:30Z">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>urn:example:assurance:phishing-resistant</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
  </saml:Assertion>
</samlp:Response>
```

## SP validation checklist

1. Resolve the expected IdP from local transaction/tenant state, then validate the response and assertion issuer against authenticated metadata.
2. Accept only configured bindings, endpoints, algorithms, and signature locations. Validate the signature and certificate chain or pinned metadata key according to the trust policy.
3. Enforce XML schema, namespace, ID uniqueness, and structural expectations before consuming attributes.
4. Validate response `Destination`; bearer `Recipient`, `InResponseTo`, and `NotOnOrAfter`; assertion `Conditions`; audience; and any required `AuthnContext`.
5. Permit bounded clock skew intentionally; do not turn it into an open replay window.
6. Track response and assertion IDs through their validity period. Consume request IDs once. Unsolicited responses require an explicit policy and cannot use request correlation.
7. Apply local account linking and authorization rules. An IdP role attribute is input to policy, not an instruction the application must trust blindly.
8. Create a new local session only after all checks pass; rotate session identifiers and apply the application's own logout and revocation behavior.

## Metadata, key rollover, and migration

Monitor metadata freshness and certificate validity, support an intentional overlap where old and new signing keys are both trusted, and test rollover before the old key expires. Do not accept arbitrary `KeyInfo` material embedded in a message unless the trust model explicitly authenticates it. Coordinate entity IDs, ACS URLs, NameID/attribute contracts, clock policy, signing requirements, and logout behavior with each partner.

## SAML and OIDC serve overlapping but different ecosystems

| Dimension | SAML 2.0 browser SSO | OpenID Connect |
|---|---|---|
| **Representation** | XML protocol messages and assertions. | JSON/HTTP authorization response plus JWT ID Token. |
| **Trust distribution** | SAML metadata and configured signing/encryption keys. | Issuer discovery/configuration and JWKS under OIDC rules. |
| **Typical fit** | Established enterprise browser SSO and B2B federation. | Web and native-client sign-in built on OAuth authorization flows. |
| **Native applications** | Usually requires a browser-mediated federation bridge or platform-specific integration. Embedded credential-collecting webviews are not a security requirement. | Native apps use an external user-agent and Authorization Code with PKCE under RFC 8252. |
| **API authorization** | Browser SSO assertions normally establish the SP session; they are not general OAuth access tokens. | OIDC authenticates the user; OAuth separately defines access tokens for resource servers. |

Migration is not a format conversion. Preserve account linking, assurance context, session behavior, logout, attribute semantics, key rollover, and recovery when moving between protocols.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>A valid XML signature is only one SAML check. The SP must validate the exact protected element, trusted issuer and key, destination, recipient, audience, request correlation, time bounds, replay state, and local account/authorization policy before creating a session.</p>
</div>

## Primary references

- **[OASIS SAML 2.0 Core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf)** — verified assertion, subject-confirmation, condition, authentication-statement, and signature structures.
- **[OASIS SAML 2.0 Profiles](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf)** — verified browser SSO processing, bearer assertion, response, and signature requirements.
- **[OASIS SAML 2.0 Bindings](https://docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf)** — verified HTTP Redirect and POST transport behavior.
- **[OASIS SAML 2.0 Metadata](https://docs.oasis-open.org/security/saml/v2.0/saml-metadata-2.0-os.pdf)** — verified entity, endpoint, role, and key publication semantics.
- **[OASIS SAML Security and Privacy Considerations](https://docs.oasis-open.org/security/saml/v2.0/saml-sec-consider-2.0-os.pdf)** — verified replay, XML signature, confidentiality, and implementation threats.
- **[RFC 8252: OAuth 2.0 for Native Apps](https://www.rfc-editor.org/rfc/rfc8252.html)** — verified the external user-agent requirement used in the OIDC comparison.
