---
title: "SAML 2.0"
description: The Identity Provider / Service Provider roles, what an assertion actually contains, SP- vs IdP-initiated SSO, and how SAML compares to OAuth/OIDC in practice.
permalink: /topics/saml/
last_verified: 2026-08-05
---

<span class="eyebrow">Authentication & Authorization / Protocol</span>

# SAML 2.0

<p class="lede">I use SAML 2.0 mainly for federated enterprise sign-on. It carries XML assertions between an Identity Provider and a Service Provider. OAuth solves delegated authorization, while OpenID Connect adds authentication on top of OAuth; the protocols overlap in SSO use cases but are not interchangeable.</p>

## The two roles

- **Identity Provider (IdP)** — "the entity providing the identities, including the ability to authenticate a user," per [Okta's own SAML documentation](https://developer.okta.com/docs/concepts/saml/). This is where the user actually logs in — a corporate directory, Okta, Azure AD/Entra ID, or [AD FS]({{ '/topics/http-auth-schemes/' | relative_url }}#ad-fs--federation) sitting in front of Active Directory.
- **Service Provider (SP)** — "the entity providing the service, typically in the form of an app." The SP never sees the user's password; it only ever sees what the IdP hands it.

An **assertion** is an XML statement about the subject, authentication event, and optional attributes such as group, role, or email. Web SSO deployments normally protect the response or assertion with a signature; encryption is optional and serves a different confidentiality need. The SP must validate the applicable signature, issuer, audience, recipient or destination, time conditions, response correlation, and replay controls before creating a session.

## SP-initiated vs. IdP-initiated SSO

- **SP-initiated** — the user goes straight to the app first. The SP doesn't know who the user is yet, so it redirects them to the IdP, the IdP authenticates and redirects back with an assertion.
- **IdP-initiated** — the user starts at the IdP (a corporate SSO portal/dashboard of app tiles), clicks an app, and the IdP sends the assertion to that SP directly, with no prior request from the SP to respond to.

The common Redirect/POST browser profile uses the browser as the front channel. That is not the only SAML binding: Artifact Resolution and several other profiles use direct SOAP exchanges between the SP and IdP. I therefore need to identify the profile and binding before assuming where the assertion travels or which party communicates directly.

## How this compares to OAuth/OIDC

| | SAML 2.0 | OAuth 2.0 / OIDC |
|---|---|---|
| Token format | XML assertion, XML-DSig signed | JWT (typically), JWS/JWE |
| Common browser transport | HTTP Redirect, POST, or Artifact bindings with XML/SOAP where specified | Front-channel redirects plus direct HTTP token calls; JSON is common |
| What it was built for | Enterprise browser-based SSO | Delegated API authorization (OAuth), with identity added by OIDC |
| Mobile/native app support | Web SSO profile is browser-oriented | Authorization Code with PKCE is designed for native apps |
| Machine-to-machine | Not really designed for it | [Client Credentials]({{ '/topics/api-security/' | relative_url }}#oauths-client-credentials-grant-machine-to-machine-oauth) exists specifically for this |
| Where it still dominates | Enterprise SSO into SaaS (Workday, Salesforce, ServiceNow, internal portals) | Everything web/mobile/API since roughly the mid-2010s |

Neither has fully replaced the other. New consumer-facing and API-first products default to OIDC; a lot of enterprise B2B SSO integrations still speak SAML because that's what the buyer's existing IdP already does, and a vendor selling into large enterprises usually has to support both.

## Common pitfalls

- **Not validating the assertion's signature (or validating against the wrong key)** — an SP that skips signature validation, or that doesn't pin exactly which IdP/certificate it trusts, will accept a forged assertion from anyone who can reach it.
- **Missing audience/recipient restriction checks** — an assertion issued for one SP should be rejected by a different SP it wasn't intended for; skipping this check opens the door to an assertion being replayed against the wrong service.
- **Treating IdP-initiated SSO as inherently less secure without cause** — the real risk is skipping `InResponseTo`/replay checks that SP-initiated flows get almost for free, not the IdP-initiated pattern itself.
- **Assuming SAML is "legacy" and therefore unmaintained** — it's an actively used, current standard for enterprise SSO; the accurate framing is "different use case than OIDC," not "obsolete."

<div class="callout">
  <span class="callout-title">Reference</span>
  <p>The <strong><a href="https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf">SAML 2.0 Core specification</a></strong> and its companion <a href="https://groups.oasis-open.org/higherlogic/ws/public/document?document_id=27819">Technical Overview</a> are published by OASIS. <a href="https://developer.okta.com/docs/concepts/saml/">Okta's SAML documentation</a> covers the IdP/SP roles and SSO flows in practical terms.</p>
</div>
