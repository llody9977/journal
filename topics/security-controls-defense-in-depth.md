---
title: Security Controls & Defense in Depth
description: My foundation for control purpose, layers, least privilege, validation, and residual risk.
permalink: /topics/security-controls-defense-in-depth/
last_verified: 2026-08-05
---

<span class="eyebrow">Security Foundations / Concepts</span>

# Security Controls & Defense in Depth

<p class="lede">A security control is a safeguard or countermeasure chosen to change a specific risk. Defense in depth combines people, process, and technology across several layers so one failure does not immediately become unacceptable harm.</p>

## What: classify a control by what it does

One control may fit several labels. I use classifications to expose gaps, not to force every control into one box.

| View | Categories | Example |
|---|---|---|
| **Nature** | Administrative, technical, physical | Access policy, authorization service, locked equipment room |
| **Function** | Prevent, detect, respond, recover | Deny a request, alert on abuse, revoke a session, restore data |
| **Placement** | People, identity, endpoint, application, data, network, supplier, physical environment | Training, passkey, hardening, input validation, encryption, segmentation, contract, barrier |

The [NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) catalog groups security and privacy controls into families, but a catalog entry is still only a candidate. I must tailor it to the system, threat, obligations, and risk.

## So what: defense in depth needs independent barriers

[NIST defines defense in depth](https://csrc.nist.gov/glossary/term/defense_in_depth) as integrating people, technology, and operational capabilities to establish barriers across multiple layers. The objective is not to buy several products that fail for the same reason.

For an account-takeover and fraudulent-payment scenario, useful layers might be:

1. **Reduce credential theft** with phishing-resistant authentication and secure enrollment and recovery.
2. **Limit the session** with short-lived tokens, device or risk checks, and safe session revocation.
3. **Limit privilege** so the account can access only the required records and actions.
4. **Protect the transaction** with independent approval or step-up verification for a bank-detail change.
5. **Detect abuse** through change alerts, audit evidence, and behavior monitoring.
6. **Contain and recover** by disabling access, reversing or holding the payment where possible, restoring trustworthy state, and investigating the path.

These controls interrupt different parts of the attack path. If password login, recovery, and step-up verification all depend on the same compromised email account, the apparent layers share one failure and are weaker than they look.

## Principles I use when selecting controls

- **Least privilege** — grant only the access required for the task, scope, and duration.
- **Deny by default** — allow a request only when an explicit rule authorizes it.
- **Separation of duties** — require independent action where one identity should not control the whole sensitive process.
- **Minimize attack surface** — remove unnecessary interfaces, services, privileges, data, and dependencies.
- **Secure defaults** — make the normal configuration safe without relying on every operator to harden it later.
- **Fail safely** — a component failure should not silently grant access, disable validation, or corrupt trusted state.
- **Make controls observable** — generate enough trustworthy evidence to detect failure and validate operation.
- **Plan recovery** — preserve and test the ability to restore services, data, identities, and trust.

I also check control interactions. Encryption needs key management. Logging needs integrity, access limits, retention, and time synchronization. Failover needs the same security policy as the primary system. An emergency bypass needs strict scope, monitoring, expiry, and review.

## Now what: validate the control, not the document

For each important control, I ask four questions:

1. **Design:** Does it address the stated threat and failure path under realistic assumptions?
2. **Implementation:** Is it configured and integrated as designed, including alternate and error paths?
3. **Operation:** Is it running consistently, owned, monitored, maintained, and used by the intended people and systems?
4. **Outcome:** Does evidence show that it reduces likelihood, impact, or detection and recovery time without creating unacceptable new risk?

I test both allowed and denied behavior. I attempt to bypass the main path, use stale or excessive privileges, alter data, disable a dependency, trigger alerts, revoke access, and restore from backup. A policy, screenshot, product license, or passed audit may be evidence, but none alone proves that the control reduces the intended risk.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>I choose controls for a named risk, layer them across independent failure points, and validate design, implementation, operation, and outcome. Defense in depth slows and contains failure; it does not remove residual risk.</p>
</div>

## Primary references

- **[NIST security-control glossary](https://csrc.nist.gov/glossary/term/security_control)** — safeguard and countermeasure definitions.
- **[NIST defense-in-depth glossary](https://csrc.nist.gov/glossary/term/defense_in_depth)** — the layered people, technology, and operations strategy.
- **[NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)** — security and privacy control catalog.
