---
title: Trust Boundaries & Threat Modeling
description: My practical model for scope, data flows, trust decisions, attack surface, threats, mitigations, and validation.
permalink: /topics/trust-boundaries-threat-modeling/
last_verified: 2026-08-06
---

<span class="eyebrow">Security Foundations / Concepts</span>

# Trust Boundaries & Threat Modeling

<p class="lede">Threat modeling is how I apply general security knowledge to one actual system. I first model what exists—actors, components, data, flows, dependencies, and trust boundaries—then ask what can go wrong, what I will do about it, and how I will validate the result.</p>

## What: understand the system before listing threats

A useful system model includes:

- **Scope** — what is included, excluded, and assumed.
- **Assets and security objectives** — what matters and which properties must be preserved.
- **Actors** — people, workloads, devices, administrators, suppliers, and possible attackers.
- **Components and data stores** — what processes or retains information.
- **Data flows** — what moves, in which direction, under which protocol and identity.
- **Entry points and attack surface** — where an actor can interact with the system.
- **Trust zones and boundaries** — where data or an action crosses between different trust assumptions or privileges.
- **Dependencies** — identity providers, cloud services, libraries, operators, and other systems whose behavior I rely on.

A trust boundary is not automatically a firewall or network segment. It is a point where a trust decision must be made—for example, when a browser calls an API, one service accepts a token from another, a process reads a file, or my application sends data to a supplier.

<div class="diagram-frame">
  <img src="{{ '/assets/img/payroll-trust-boundaries.svg' | relative_url }}?v=3" alt="Payroll data-flow and trust-boundary diagram. An employee browser sends an HTTPS request containing an authenticated session and untrusted input to the payroll web API. Inside the payroll application boundary, the API authorizes the employee action, validates the amount and payee, and enforces approval rules. The API uses a workload or service identity to access the payroll database across a separate sensitive-data boundary. Only an approved payment instruction is sent through an authenticated service request to the external bank API. Three numbered boundary checks call out user authentication, authorization and input validation; workload identity, least privilege and safe database queries; and payment approval, bank endpoint authentication and replay protection.">
  <p class="diagram-caption">The arrows show data flows; the numbered boundaries show where trust changes and verification must happen</p>
</div>

Each arrow crosses a boundary with different questions. HTTPS can protect a channel, but it does not make browser input safe, grant database permission, or prove that a bank request is authorized.

## Attack surface and trust boundaries are related, not identical

- The **attack surface** is the set of reachable ways an actor could interact with or influence the system: endpoints, ports, files, queues, administrative consoles, identities, dependencies, and physical interfaces.
- A **trust boundary** marks a change in trust assumptions, authority, or privilege where the receiving side must verify what it is accepting.

An internal service can still cross a trust boundary. A public endpoint is part of the attack surface, but the important boundary may continue deeper when that endpoint calls a high-privilege service.

## So what: use four questions

The [OWASP Threat Modeling Project](https://owasp.org/www-project-threat-modeling/) gives me a methodology-neutral starting point:

1. **What am I working on?** Agree on the scope and model the system.
2. **What can go wrong?** Identify threats, misuse, failures, unsafe assumptions, and affected security properties.
3. **What will I do about it?** Prioritize and choose design changes, mitigations, tests, or an explicit risk response.
4. **Did I do a good job?** Review coverage, validate controls, record assumptions and residual risk, and revisit the model when the system changes.

STRIDE can help me remember six threat categories: spoofing, tampering, repudiation, information disclosure, denial of service, and elevation of privilege. It is a prompt, not a complete threat model or risk rating. I can use another method when privacy, safety, fraud, abuse, or a specialized system needs a different lens.

## Now what: produce a useful threat model

For one system or feature, I create:

1. A short purpose, scope, and list of assumptions.
2. A diagram showing actors, components, stores, flows, and trust boundaries.
3. A list of assets and required security properties.
4. Prioritized threat scenarios tied to real components and flows.
5. A response for each material scenario: mitigation, design change, transfer, avoidance, or acceptance.
6. A named owner and validation method for each selected control.
7. Residual risk and the conditions that require another review.

I revisit the model when a feature changes trust boundaries, a new dependency or data type appears, authorization changes, an incident invalidates an assumption, or the operating environment changes. The [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) treats the model as a maintained system artifact, not a one-time diagram.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>A threat model begins with an accurate system model. I mark where trust changes, identify what can go wrong, choose responses, validate them, and keep the assumptions and residual risk visible.</p>
</div>

## Primary references

- **[OWASP Threat Modeling Project](https://owasp.org/www-project-threat-modeling/)** — the four-question framework and methodology-neutral guidance.
- **[OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)** — practical system modeling and lifecycle guidance.
- **[OWASP Threat Model Library](https://owasp.org/www-project-threat-model-library/)** — scope, actors, data flows, trust zones, boundaries, assumptions, threats, and mitigations.
