---
title: SAML 2.0
description: Architectural guide to Security Assertion Markup Language (SAML 2.0), XML-DSig assertions, Identity Provider (IdP) vs Service Provider (SP) flows, and OIDC comparison.
permalink: /topics/saml/
last_verified: 2026-08-06
---

<span class="eyebrow">Authentication & Authorization / Protocol</span>

# SAML 2.0

<p class="lede">Security Assertion Markup Language (SAML 2.0) is an OASIS standard for federated enterprise Single Sign-On (SSO). SAML enables Identity Providers (IdP) to transmit XML-encoded authentication assertions and attribute statements to Service Providers (SP) over browser redirects and POST bindings without exposing user passwords.</p>

## Enterprise Roles: Identity Provider vs Service Provider

<div class="diagram-frame">
  <img src="{{ '/assets/img/saml-sp-initiated-flow.svg' | relative_url }}" alt="SAML service-provider-initiated sign-in sequence among the browser, service provider, and identity provider.">
  <p class="diagram-caption">The browser transports the signed assertion from the identity provider to the service provider</p>
</div>

1. **Identity Provider (IdP)**: The centralized enterprise directory (*Okta, Entra ID, PingIdentity, Keycloak, AD FS*) that authenticates users and signs SAML assertions using an X.509 private key.
2. **Service Provider (SP)**: The target SaaS application (*Salesforce, Workday, ServiceNow, AWS Console*) that relies on IdP assertions to create local user sessions.

## SP-Initiated vs IdP-Initiated SSO Flows

| Dimension | SP-Initiated SSO | IdP-Initiated SSO |
|---|---|---|
| **Entry Point** | User navigates directly to SP URL (*e.g., `app.example.com`*). | User clicks app tile inside IdP Portal (*e.g., `okta.com`*). |
| **Request Message** | SP generates `SAMLRequest` (AuthnRequest) sent to IdP. | No `AuthnRequest`; IdP directly generates `SAMLResponse`. |
| **Replay Protection** | SP validates `InResponseTo` attribute matching request ID. | Requires strict timestamp (`NotOnOrAfter`) and assertion ID tracking. |
| **Security Risk Profile** | **Recommended Flow**: Strongest CSRF and replay protection. | Vulnerable to unsolicited assertion replay if SP validation is weak. |

## Anatomy of a SAML 2.0 XML Assertion

A SAML Assertion is an XML payload signed using **XML Digital Signatures (XML-DSig)**:

```xml
<saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion"
                 ID="_a1b2c3d4e5" IssueInstant="2026-08-06T12:00:00Z" Version="2.0">
  <saml2:Issuer>https://idp.enterprise.com/saml</saml2:Issuer>
  <!-- XML Digital Signature over Assertion -->
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">...</ds:Signature>
  <saml2:Subject>
    <saml2:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">
      alice@enterprise.com
    </saml2:NameID>
  </saml2:Subject>
  <saml2:Conditions NotBefore="2026-08-06T11:59:00Z" NotOnOrAfter="2026-08-06T12:05:00Z">
    <saml2:AudienceRestriction>
      <saml2:Audience>https://sp.service.com/saml/metadata</saml2:Audience>
    </saml2:AudienceRestriction>
  </saml2:Conditions>
  <saml2:AttributeStatement>
    <saml2:Attribute Name="role">
      <saml2:AttributeValue>SecurityAdmin</saml2:AttributeValue>
    </saml2:Attribute>
  </saml2:AttributeStatement>
</saml2:Assertion>
```

## Technical Comparison: SAML 2.0 vs OpenID Connect (OIDC)

| Dimension | SAML 2.0 | OpenID Connect (OIDC) |
|---|---|---|
| **Data Encoding** | XML Assertions (Verbose) | JSON Web Tokens (JWT / JWS) |
| **Signature Standard** | XML-DSig (Complex canonicalization rules) | JWS (JSON Web Signature - Compact Base64URL) |
| **Primary Domain** | Enterprise B2B SaaS SSO | Web, Mobile Native, Microservices, Public APIs |
| **Native Mobile Support** | Complex (Requires embedded browser webviews) | **Native** (OAuth 2.1 Authorization Code + PKCE) |
| **API Authorization** | Unsuited for API access token delegation | **Standard** (Provides both ID Token and Access Token) |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>SAML assertions must be validated for element positioning, not just signature validity — XML Signature Wrapping attacks manipulate the DOM tree while keeping a valid signature block intact. Enforce tight <code>NotOnOrAfter</code> timestamps and track assertion IDs to prevent replay.</p>
</div>

## Primary references

- **OASIS SAML v2.0**: *SAML 2.0 Executive Overview* — [OASIS SAML 2.0 Standard](http://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- **OWASP SAML Security**: *SAML Security Cheat Sheet* — [OWASP SAML Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html)
