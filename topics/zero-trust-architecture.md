---
title: Zero Trust Architecture (ZTA) & NIST SP 800-207
description: Technical reference for the seven tenets of NIST SP 800-207, the policy engine, policy administrator and policy enforcement point, the trust algorithm, deployment variations, and the threats SP 800-207 attributes to ZTA itself.
permalink: /topics/zero-trust-architecture/
last_verified: 2026-08-14
---

<span class="eyebrow">Security Architecture & Design Principles / Zero Trust</span>

# Zero Trust Architecture (ZTA) & NIST SP 800-207

<p class="lede">A perimeter model grants broad access once a subject is inside the network. Zero Trust removes that implicit grant: network position stops being an input to the access decision, and every request to every resource is authenticated and authorized against current policy and current asset state. <strong>NIST SP 800-207</strong> is the reference model most implementations are described against. It is guidance rather than a mandate, and it says so — it calls its tenets an ideal goal that a given deployment may not fully reach.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/zero-trust-architecture.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the seven tenets of NIST SP 800-207 diagram at full size">
    <img src="{{ '/assets/img/zero-trust-architecture.svg' | relative_url }}" alt="Seven numbered rows reproducing the tenets of NIST SP 800-207 section 2.1, from all data sources being resources through to collecting asset and communication state to improve security posture, with a footer noting that the verify explicitly, least privilege, assume breach formulation is Microsoft's rather than NIST's.">
  </a>
  <p class="diagram-caption">The seven tenets defined in NIST SP 800-207 §2.1, each with its operational consequence</p>
</div>

## The seven tenets of NIST SP 800-207

Section 2.1 of the publication enumerates seven tenets. It frames them as the ideal goal and acknowledges that not all of them will be fully implemented in their purest form in a given strategy.

1. **All data sources and computing services are considered resources.** Not only databases — endpoints, SaaS applications, small-footprint devices reporting to aggregators, and personally owned devices that reach enterprise resources.
2. **All communication is secured regardless of network location.** Sitting inside a legacy perimeter earns nothing: a request from enterprise-owned infrastructure must meet the same requirements as one from any other network.
3. **Access to individual enterprise resources is granted on a per-session basis.** Trust is evaluated before access, with least privilege for the task. Authorization to one resource does not carry to another.
4. **Access is determined by dynamic policy** — including the observable state of client identity, application or service, and requesting asset — **and may include behavioral and environmental attributes** such as measured deviation from usual usage, location, and time.
5. **The enterprise monitors and measures the integrity and security posture of all owned and associated assets.** No asset is inherently trusted; a subverted, vulnerable, or unmanaged asset may be treated differently, up to denying every connection.
6. **All resource authentication and authorization are dynamic and strictly enforced before access is allowed.** SP 800-207 describes this as a constant cycle of obtaining access, assessing threats, adapting, and re-evaluating trust during the session.
7. **The enterprise collects as much information as possible about the current state of assets, network infrastructure, and communications, and uses it to improve its security posture.**

A shorter formulation is widely quoted alongside Zero Trust: *verify explicitly, use least privilege access, assume breach*. That is **Microsoft's** set of three principles, not NIST's — the phrase "assume breach" appears nowhere in SP 800-207. It is a serviceable summary, and tenet 2 carries the same idea, but the two should not be attributed to each other.

Zero Trust is an architectural strategy rather than an access-control model. It does not replace RBAC, ABAC, or ReBAC; it requires whichever model is chosen to be evaluated per session against current signals. [Authorization Models]({{ '/topics/authorization-models/' | relative_url }}) covers that boundary, including why a bounded, revocable cached decision can still satisfy the model.

## Logical components: PE, PA, and PEP

SP 800-207 splits the policy decision point into two logical components on a control plane, separate from the data plane carrying application traffic.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/zero-trust-pdp-pep-flow.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the policy decision point and enforcement point request flow diagram at full size">
    <img src="{{ '/assets/img/zero-trust-pdp-pep-flow.svg' | relative_url }}" alt="A control plane band holding policy inputs, the policy engine, and the policy administrator above a data plane band holding the subject and device, the policy enforcement point, and the enterprise resource, with numbered arrows tracing one request from the subject through the enforcement point, up to the administrator and engine, back down as a configure or terminate command, and on to the resource.">
  </a>
  <p class="diagram-caption">One request traversing the control plane and the data plane, with the components SP 800-207 names</p>
</div>

- **Policy engine (PE)** — makes the ultimate decision to grant, deny, or revoke access for a subject and resource. It runs a **trust algorithm** over enterprise policy plus external input: identity attributes, asset posture from a continuous diagnostics or EDR system, threat intelligence, and activity logs. The PE makes and logs the decision.
- **Policy administrator (PA)** — executes it. The PA establishes or shuts down the communication path between subject and resource by issuing commands to the relevant PEPs, and generates any session-specific credential or token the client uses.
- **Policy enforcement point (PEP)** — enables, monitors, and eventually terminates the connection. It may be a single component or split into a client-side agent and a resource-side gateway, or a portal acting as gatekeeper.

Some implementations collapse the PE and PA into one service; SP 800-207 keeps them logically separate. The **trust algorithm** (§3.3) is where the real design choices sit: criteria-based versus score-based evaluation, and singular versus contextual — whether each request is judged alone or against the subject's recent history.

### Three approaches and four deployment variations

SP 800-207 does not prescribe one architecture. §3.1 describes three approaches, usually combined rather than chosen:

- **Enhanced identity governance** — identity and assigned attributes are the primary policy input.
- **Micro-segmentation** — resources sit behind infrastructure gateways enforcing per-workload policy.
- **Network infrastructure and software-defined perimeters** — an overlay network where the control plane configures per-session paths.

§3.2 then describes four deployment variations, which differ in where the PEP actually sits: **device agent/gateway**, **enclave-based**, **resource portal-based**, and **device application sandboxing**. The choice is driven by whether enterprise software can be installed on the asset and whether the resource can sit behind a gateway. [Network Segmentation & Microsegmentation]({{ '/topics/network-segmentation-microsegmentation/' | relative_url }}) covers the segmentation variant in operational detail.

## Continuous re-evaluation, and what revocation actually ends

Tenet 6 requires re-evaluation during a session rather than only at login. Gartner uses a separate name for the same idea, **Continuous Adaptive Risk and Trust Assessment (CARTA)**, introduced in 2017; it is an analyst framework and is not part of SP 800-207.

The operational question is what happens when a signal changes mid-session — an EDR agent reports malware, or a risk score spikes on an impossible-travel anomaly. The PA signals the PEP to shut down the path. **What that actually ends depends on the token design**, and this is where implementations commonly overstate their position:

- A **PEP that terminates the connection** ends that session immediately, because the traffic cannot reach the resource without it.
- **[RFC 7009](https://www.rfc-editor.org/rfc/rfc7009) token revocation** invalidates a token at the authorization server. That stops refresh and stops any resource server that validates by introspection.
- A **self-contained JWT that a resource server validates locally by signature** keeps working until it expires, because nothing consults the authorization server. Short lifetimes *bound* that residual window; they do not close it.

Closing the window requires introspection, a revocation list the PEP consults, or a PEP that terminates the transport itself. Choosing short token lifetimes and calling it revocation is the mistake to avoid.

## Threats SP 800-207 attributes to ZTA itself

Section 5 is the part most summaries omit. Concentrating access decisions into a control plane creates its own exposure:

| Threat (SP 800-207 §5) | What it means in practice |
|---|---|
| **Subversion of the ZTA decision process** | The PE and PA become the highest-value target in the enterprise. Anyone who can alter policy or its configuration grants themselves access without exploiting anything else. |
| **Denial of service or network disruption** | The PA is on the path of every session establishment. If it is unreachable, nothing is authorized — the availability of the decision point becomes the availability of the enterprise. |
| **Stolen credentials and insider threat** | Zero Trust raises the cost of using stolen credentials through per-session evaluation and posture checks, but does not remove the risk; a legitimate account behaving plausibly still passes. |
| **Visibility on the network** | Encrypted traffic the enterprise cannot inspect limits the metadata available for analysis, so detection shifts toward traffic patterns and endpoint telemetry. |
| **Storage of system and network information** | The telemetry that tenet 7 requires becomes a concentrated map of the enterprise, and a target in its own right. |
| **Reliance on proprietary data formats** | Components that do not interoperate create lock-in and gaps at the seams between them. |
| **Use of non-person entities** | Service accounts and automated agents must be authenticated too, and are harder to challenge interactively when a decision is uncertain. |

The two that most often go unplanned are the first two: the PDP is simultaneously the most attractive target and a hard availability dependency.

## Zero Trust review checklist

The checklist below is a journal working model, not a published audit standard. When evaluating a Zero Trust implementation, evaluate these six criteria:

| Diagnostic area | Evaluation question | Verification &amp; audit evidence |
|---|---|---|
| **Network location removed as input** | Is an internal request evaluated by the same policy as an external one, with no route that reaches a resource without passing a PEP? | Route and PEP inventory, network policy, proxy logs. |
| **Control and data plane separation** | Are the PE and PA reachable only over the control plane, and is the PDP's own access policy at least as strict as the resources it protects? | Architecture documentation, PDP administrative access review. |
| **PDP availability planning** | What happens to new session establishment when the PA is unavailable, and is that failure direction a deliberate decision? | Redundancy design, documented fail-closed/fail-open decision, tested outage runbook. |
| **Asset posture input** | Does the policy engine consume current asset posture rather than an enrollment-time snapshot? | EDR/CDM integration configuration, policy rule definitions. |
| **Session re-evaluation and revocation** | When a risk signal fires mid-session, what actually stops — the connection, the token, or neither until expiry? | Token validation mode (local vs introspection), PEP termination behavior, tested revocation timings. |
| **Telemetry protection** | Is the collected asset and network state protected at least as strongly as the resources it describes? | Access policy on telemetry stores, retention rules. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>NIST SP 800-207 defines seven tenets and is guidance, not a mandate; "assume breach" is Microsoft's wording and CARTA is Gartner's, neither appears in the publication. The policy engine decides, the policy administrator executes by opening or shutting the path, the PEP enforces on the data plane. Revoking a token at the authorization server does not stop a self-contained JWT a resource server validates locally. SP 800-207 §5 makes the decision point itself a target and a hard availability dependency.</p>
</div>

## Primary references

- **[NIST SP 800-207: Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)** — August 2020. Verified the seven tenets in §2.1 and their "ideal goal" framing, the PE/PA/PEP definitions and trust algorithm in §3, the three approaches and four deployment variations, and the seven threats in §5.
- **[CISA Zero Trust Maturity Model v2.0](https://www.cisa.gov/zero-trust-maturity-model)** — the federal maturity framing (five pillars, four stages) that agencies plan migrations against, distinct from SP 800-207's logical architecture.
- **[RFC 7009: OAuth 2.0 Token Revocation](https://www.rfc-editor.org/rfc/rfc7009)** — verified that revocation is performed at the authorization server, which is why locally validated self-contained tokens remain acceptable until expiry.
- **[Microsoft Zero Trust guiding principles](https://learn.microsoft.com/en-us/security/zero-trust/zero-trust-overview)** — verified the attribution of "verify explicitly, use least privilege access, assume breach" to Microsoft rather than to NIST.
