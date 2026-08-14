---
title: Fundamental Security Design Principles
description: Technical reference for Saltzer and Schroeder's eight design principles, the fail-safe versus fail-open boundary, defense-in-depth tiers and the independence condition they rely on, and attack surface reduction.
permalink: /topics/security-design-principles/
last_verified: 2026-08-14
---

<span class="eyebrow">Security Architecture & Design Principles / Core Axioms</span>

# Fundamental Security Design Principles

<p class="lede">Security is an architectural property, not a feature retrofitted onto a finished system. Most exploitable failures trace back to a structural decision — a default that grants rather than denies, a check that runs once instead of every time, a shared mechanism that leaks across a tenant boundary. Saltzer and Schroeder named eight such decisions in 1975, and the names still hold. What they are is design heuristics that constrain each other, not a checklist that can be satisfied independently.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/security-design-principles.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the Saltzer and Schroeder design principles diagram at full size">
    <img src="{{ '/assets/img/security-design-principles.svg' | relative_url }}" alt="Eight cards, one per Saltzer and Schroeder principle — economy of mechanism, fail-safe defaults, complete mediation, open design, separation of privilege, least privilege, least common mechanism, and psychological acceptability — each stating the principle and what it protects against, with a footer noting the paper's two further principles and that defense in depth is not among the eight.">
  </a>
  <p class="diagram-caption">The eight principles from the 1975 paper, each paired with the failure it is meant to prevent</p>
</div>

## Saltzer and Schroeder's eight design principles

Jerome Saltzer and Michael Schroeder published these in *The Protection of Information in Computer Systems* (Proceedings of the IEEE, September 1975). They remain the most widely cited foundation for secure system architecture. They are **design heuristics, not requirements of any standard** — the paper itself presents them as principles that guide a design rather than tests a system passes.

| Principle | What it says | Engineering realization |
|---|---|---|
| **Economy of mechanism** | Keep the protection design as simple and small as it can be. | Narrow service boundaries, small audited codebases, distroless container images. |
| **Fail-safe defaults** | Base access decisions on permission rather than exclusion: deny unless explicitly granted. | Default-deny firewall and security-group rules, explicit RBAC grants, strict CORS origins. |
| **Complete mediation** | Check every access to every object on every invocation. Caching a decision is compatible with this only when freshness is bounded and revocation propagates; an indefinitely cached decision is not complete mediation. | Authorization at every layer an object is reachable from — gateway, service, and data layer — with bounded token and decision lifetimes. |
| **Open design** | Security must not depend on the design staying secret, only on protected secrets such as keys (*Kerckhoffs' principle*). Open design does not prevent an attacker from finding a flaw; it removes secrecy as the thing holding the system up. | Peer-reviewed algorithms (AES-GCM, Ed25519) and published protocol specifications rather than proprietary constructions. |
| **Separation of privilege** | Require more than one key or condition to release a critical operation. | Multi-approver merge gates, dual-control production access, M-of-N key custody. |
| **Least privilege** | Every subject operates with the minimum privileges its task needs. | Scoped IAM policies, non-root containers, short-lived credentials, read-only replicas. |
| **Least common mechanism** | Minimize mechanism shared between users and trust domains. | Per-tenant schemas, namespace and kernel isolation, separate caches rather than one shared in-process cache. |
| **Psychological acceptability** | A mechanism people find intrusive is a mechanism people route around. | Single sign-on, FIDO2 passkeys, short-lived SSH certificates instead of forced password rotation. |

The same paper adds two more principles borrowed from physical security — **work factor** (compare the cost of defeating the mechanism against the attacker's resources) and **compromise recording** (reliable evidence of compromise, potentially in place of prevention) — and states that both apply only imperfectly to computer systems, because the cost of defeating a software mechanism is usually not calculable.

**Defense in depth and separation of duties are not among the eight.** Both are legitimate and widely cited alongside them, but attributing them to the 1975 paper misstates its content. [Security Controls & Defense in Depth]({{ '/topics/security-controls-defense-in-depth/' | relative_url }}) treats both in depth, including the fail-closed versus fail-open trade-off summarized below.

### The principles constrain each other

Treating the eight as an independent checklist is the common mistake. They trade against one another, and the trade is a design decision rather than a defect:

- **Economy of mechanism against defense in depth.** Every added layer is more code that can be wrong. A simpler system with three well-understood gates can be safer than a complex one with seven poorly-understood ones.
- **Complete mediation against availability and latency.** A remote authorization call on every object access is the strictest reading; it also makes the policy decision point a hard dependency and a denial-of-service target.
- **Psychological acceptability against separation of privilege.** Dual control on a frequent operation reliably produces a shared account or a rubber-stamp approver, which removes the control while leaving the audit trail.

## Fail-safe defaults is not fail-open, and "safe" is not a fixed direction

This is the boundary most often collapsed, and collapsing it inverts the control.

- **Fail-safe defaults**, in the Saltzer and Schroeder sense, means *deny unless explicitly permitted*. In access-control terms this maps to **fail-closed**.
- **Fail-open** means continuing to grant when the deciding component is unavailable. It is sometimes the correct choice — a badge reader on a fire door, a payment path where a brief authorization outage costs more than the fraud it prevents — but it is a deliberate availability decision, not an application of this principle.
- In safety engineering, the state that is actually *safe for people* during a failure can be either open or closed depending on the hazard: a door should unlock in a fire, a vault should not. "Safe" has to be evaluated per scenario.

The practical rule: state which direction the component fails in, and why, in the design rather than discovering it during the outage.

## Defense in depth, and the condition that makes it work

Defense in depth assumes any single control will eventually fail or be bypassed, and places several controls on the same path so one failure is not the whole compromise.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/defense-in-depth-tiers.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the defense in depth tiers diagram at full size">
    <img src="{{ '/assets/img/defense-in-depth-tiers.svg' | relative_url }}" alt="Five tier rows on one request path — edge, network, identity, application, and data — each naming its controls and what an attacker still holds after that tier is bypassed, with an attacker-path arrow down the left and a footer stating that layering only helps when the tiers fail for independent reasons.">
  </a>
  <p class="diagram-caption">Five tiers on one request path, each annotated with what survives its bypass</p>
</div>

1. **Edge**: WAF payload filtering, cloud DDoS mitigation, TLS termination.
2. **Network**: microsegmentation, default-deny security groups, egress proxy filtering.
3. **Identity**: phishing-resistant MFA, scoped tokens, bounded session lifetimes.
4. **Application**: parameterized queries, per-object authorization, context-aware output encoding.
5. **Data**: envelope encryption, row-level security, append-only audit logs.

Two qualifications carry the whole idea:

- **Layering lowers the likelihood that one failure becomes systemic compromise. It does not eliminate it.** A stated residual always remains.
- **It only helps when the tiers fail for largely independent reasons.** Two WAF engines sharing a parser fail on the same malformed request; that is duplication, not depth. Count independent failure modes, not boxes on the architecture diagram.

The tiers are also not uniformly sequential against one attack. The first four form a genuine chain against an in-band request; encryption at rest sits on a different branch entirely — it protects against theft of the storage medium and does nothing against an application that is entitled to decrypt and has been driven into doing so.

## Attack surface reduction

Reducing attack surface removes entry points rather than defending them:

- **Disable unused protocols and endpoints**: retire cleartext and legacy administrative protocols (Telnet, plain HTTP, SMBv1), and remove unauthenticated debug endpoints such as `/debug/vars` or an exposed `/actuator`.
- **Minimal base images**: build on **distroless** or **scratch** images, removing the shell and network utilities (`/bin/sh`, `curl`, `nc`) that post-exploitation depends on.
- **Port and protocol isolation**: deny all inbound by default and expose only the required TLS listener.

Attack surface reduction has a limit worth naming: it removes *reachable* surface, not *logic* flaws. A distroless image with an authorization bug is still exploitable through its own API, and a smaller image does nothing about supply-chain compromise of what remains in it.

## Design review checklist

The checklist below is a journal working model, not a published audit standard. When reviewing an architecture against these principles, evaluate these six criteria:

| Diagnostic area | Evaluation question | Verification &amp; audit evidence |
|---|---|---|
| **Default deny** | Do firewalls, IAM policies, and API gateways deny unless explicitly granted, and is the failure direction of each deciding component stated deliberately? | Firewall rulesets, IAM policy documents, documented fail-closed/fail-open decisions. |
| **Least privilege scoping** | Do services run as unprivileged accounts without root or administrative rights? | Pod Security Standards, IAM role policies, container runtime settings. |
| **Complete mediation** | Does every path to an object check authorization, including internal service-to-service routes, and is any cached decision bounded and revocable? | Route inventories, token and cache lifetime settings, penetration test findings. |
| **Attack surface** | Are production images stripped of shells, compilers, and debugging tools, and are debug endpoints unreachable? | Image build files, image scan output, exposed-endpoint inventory. |
| **Layer independence** | Do the layers protecting sensitive data fail for genuinely different reasons, or do they share a parser, library, or identity? | Architecture dependency graphs, threat model records, failure mode analyses. |
| **Kerckhoffs' principle** | Does security rest on protected secrets rather than on an undisclosed design or algorithm? | Cryptographic implementation review, algorithm inventory. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>The eight Saltzer and Schroeder principles are design heuristics that constrain each other, not a checklist to satisfy independently — and defense in depth is not one of them. Fail-safe defaults means fail-closed; "safe" in safety engineering can mean open, so state the failure direction deliberately. Layering lowers the likelihood of systemic compromise only when the tiers fail for independent reasons.</p>
</div>

## Primary references

- **[Saltzer & Schroeder, *The Protection of Information in Computer Systems*](https://web.mit.edu/Saltzer/www/publications/protection/)** — Proceedings of the IEEE 63(9), September 1975; author-hosted MIT copy. Verified the eight enumerated principles and their definitions, and the two additional principles (work factor, compromise recording) the paper marks as applying only imperfectly to computer systems.
- **[NIST SP 800-160 Vol. 1 Rev. 1: Engineering Trustworthy Secure Systems](https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final)** — verified the framing of security as a system property established through design rather than added afterwards.
