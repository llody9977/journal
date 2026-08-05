---
title: Identity & Access Fundamentals
description: My foundation for identity proofing, authentication, sessions, authorization, accountability, and access lifecycle.
permalink: /topics/identity-access-fundamentals/
last_verified: 2026-08-05
---

<span class="eyebrow">Security Foundations / Concepts</span>

# Identity & Access Fundamentals

<p class="lede">Identity and access control answer a chain of separate questions: who or what is requesting access, how strongly that identity was verified, what it may do to this resource now, and how the action will be traced. A login only answers part of that chain.</p>

## What: the identity and access sequence

My compact flow is:

> Establish an identity → bind authenticators → authenticate → create a protected session → authorize each action → record important results → review and remove access when it is no longer needed.

The stages have different purposes:

| Stage | Question |
|---|---|
| **Identity proofing and enrollment** | What evidence connects this person, device, or workload to the claimed identity? |
| **Authenticator binding** | Which password, passkey, certificate, token, or key is associated with that identity? |
| **Authentication** | Does the current claimant control the required authenticator? |
| **Session management** | How is the authenticated state protected, limited, renewed, and ended? |
| **Authorization** | Is this identity allowed to perform this action on this resource under the present conditions? |
| **Accountability** | Can important actions and decisions be traced with trustworthy evidence? |
| **Lifecycle management** | Is access changed or removed when the role, device, service, or relationship changes? |

The current [NIST Digital Identity Guidelines, SP 800-63-4](https://pages.nist.gov/800-63-4/) separate identity proofing, authentication, and federation because strength in one does not repair weakness in another.

## So what: authentication and authorization fail differently

Consider a payroll application:

1. Mei signs in with a passkey. **Authentication** establishes confidence that the claimant controls Mei's registered authenticator.
2. The application receives a protected session associated with Mei.
3. Mei requests Chen's salary record. **Authorization** evaluates her role, the requested record, action, organization, and other policy conditions.
4. The application allows or denies the request and records the decision for **accountability**.

Strong authentication cannot repair a rule that lets every employee read every salary record. Correct authorization cannot help if a stolen session lets an attacker act as Mei. I need both, plus session protection and lifecycle controls.

Identity is also not limited to people. Applications, workloads, devices, automation, and service accounts need identities, credentials, authorization, rotation, and removal. A machine credential copied into several systems weakens attribution because I can no longer tell which workload used it.

## The access principles I start with

- **Deny by default.** Allow only requests that match an explicit rule.
- **Least privilege.** Grant only the access needed for the task, scope, and duration.
- **Separate duties.** Do not let one identity initiate, approve, and conceal a sensitive action when independent approval is required.
- **Use individual identities.** Avoid shared accounts where accountability matters.
- **Evaluate context.** Resource, action, tenant, device, location, risk, and time may all affect an authorization decision.
- **Protect sessions and tokens.** A stolen authenticated session may bypass the login control entirely.
- **Revoke promptly.** Joiner, mover, and leaver events apply to people; deployment, rotation, ownership, and decommissioning events apply to workloads and devices.
- **Recheck sensitive actions.** A long-lived session may need fresh authentication or stronger evidence before a high-impact action.

[NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) makes the boundary clear for zero trust: network location or asset ownership should not create implicit trust, and authentication and authorization are distinct functions before access to a resource is established.

## Now what: review one access path

For one important action, I record:

1. The human or machine subject requesting access.
2. How the identity was established and which authenticator is used.
3. Where the session or token is created, stored, validated, renewed, and revoked.
4. The exact resource and action being requested.
5. The authorization rule, policy inputs, and default decision.
6. Which privilege is unnecessary or too broad.
7. Which audit evidence records the request and decision without exposing secrets.
8. How access is removed and how I test that removal.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Identity says who or what the subject is. Authentication verifies the current claimant. Authorization decides what that subject may do. Session security preserves the decision between requests, and accountability records what happened.</p>
</div>

## Primary references

- **[NIST SP 800-63-4](https://pages.nist.gov/800-63-4/)** — digital identity, identity proofing, authentication, and federation.
- **[NIST authentication glossary](https://csrc.nist.gov/glossary/term/authentication)** and **[authorization glossary](https://csrc.nist.gov/glossary/term/authorization)** — the separate definitions.
- **[NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)** — zero trust architecture and resource-focused access decisions.
