---
title: Fundamental Security Design Principles
description: Comprehensive technical guide to foundational security design principles, Saltzer and Schroeder axioms, Defense-in-Depth layering, Least Privilege, Fail-Safe Defaults, and Attack Surface Reduction.
permalink: /topics/security-design-principles/
last_verified: 2026-08-13
---

<span class="eyebrow">Security Architecture & Design Principles / Core Axioms</span>

# Fundamental Security Design Principles

<p class="lede">Security is not an add-on feature retrofitted onto a completed system; it is an architectural property established through fundamental design principles. System failures and vulnerabilities stem primarily from architectural flaws that violate core security axioms. Applying Saltzer and Schroeder’s design principles, enforcing Defense-in-Depth, and minimizing attack surface ensures systems remain resilient even when individual components are compromised.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/security-design-principles.svg' | relative_url }}" alt="Security Design Principles diagram showing Saltzer and Schroeder principles, Defense-in-Depth layers, Least Privilege, and Attack Surface Reduction.">
  <p class="diagram-caption">Fundamental Security Design Principles Architecture: Saltzer &amp; Schroeder Axioms &leftrightarrow; Multi-Tiered Defense-in-Depth &leftrightarrow; Attack Surface Minimization</p>
</div>

## Saltzer & Schroeder’s Security Design Principles

Formulated in 1975 by Jerome Saltzer and Michael Schroeder, these 8 principles remain the authoritative foundation for secure system architecture:

| Principle | Architectural Axiom | Operational Engineering Implementation |
|---|---|---|
| **Least Privilege** | Every module, process, or user must operate using the minimum set of privileges necessary to perform its task. | AWS IAM scoped policies, non-root container execution, database read-only replicas. |
| **Fail-Safe Defaults** | Access decisions must default to denial rather than permission unless explicitly granted. | Default-deny firewall rules (`DENY ALL`), explicit RBAC permissions, strict CORS headers. |
| **Complete Mediation** | Every access request to every object must be checked for authorization without relying on cached decisions. | API Gateway authorization enforcement on every HTTP request; zero bypass routes. |
| **Open Design** | System security must not depend on secret implementation details (*Kerckhoffs' Principle*). | Publicly audited cryptographic algorithms (AES-GCM, Ed25519) and open-source protocol specs. |
| **Separation of Privilege** | Critical operations must require multiple independent conditions or approvals to execute. | Multi-person code review PR gates, dual-control production access, M-of-N key escrow. |
| **Least Common Mechanism** | Minimize shared mechanisms between users to prevent cross-tenant interference. | Dedicated database schemas, container namespace isolation, VPC network perimeters. |
| **Psychological Acceptability** | Security controls must be intuitive and easy to use so users do not bypass them. | Single Sign-On (SSO), FIDO2 Passkeys, automated passwordless SSH via short-lived certificates. |
| **Economy of Mechanism** | Keep the security design as simple and small as possible (*KISS principle*). | Minimalist micro-service boundaries, small codebase size, distroless container base images. |

## Defense-in-Depth & Layered Redundancy

**Defense-in-Depth** assumes that any single security control will eventually fail or be bypassed. Security architecture must deploy multiple independent, overlapping safeguard layers so that a failure in one tier is contained by the next:

```
[ Edge WAF & DDoS ] ──> [ Network Firewall ] ──> [ Identity & MFA ] ──> [ App Input Validation ] ──> [ Data Encryption ]
```

1. **Edge Tier**: Web Application Firewall (WAF) filtering malicious HTTP payloads and Cloud DDoS mitigation.
2. **Network Tier**: Subnet microsegmentation, default-deny security groups, and egress proxy filtering.
3. **Identity Tier**: Multi-Factor Authentication (MFA), OAuth 2.0 scoped tokens, and short-lived session limits.
4. **Application Tier**: Strict input sanitization, parameterized queries, and context-aware output encoding.
5. **Data Tier**: Envelope encryption (AES-256-GCM), row-level security (RLS), and immutable append-only logs.

## Attack Surface Reduction (ASR)

Minimizing a system's **attack surface** reduces the number of accessible entry points available to adversaries:

- **Disable Unused Protocols & Endpoints**: Terminate legacy administrative protocols (Telnet, HTTP, SMBv1) and remove unauthenticated debug API endpoints (`/debug/vars`, `/actuator`).
- **Minimal Base Images**: Build container workloads using **Distroless** or **Scratch** base images, eliminating Linux shell binaries (`/bin/sh`, `curl`, `nc`) that attackers use during post-exploitation.
- **Port & Protocol Isolation**: Block all inbound ports by default; expose only required TLS endpoints (`443`).

## Essential Security Design Diagnostic Checklist

When conducting an architectural security design review, evaluate these 6 criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Default Deny Enforcement** | Do all firewalls, IAM policies, and API routing gateways default to explicit denial (`DENY ALL`)? | Firewall rulesets &amp; IAM policy JSON configurations. |
| **Least Privilege Scoping** | Are application microservices executed using unprivileged service accounts without root/admin rights? | Pod Security Standards &amp; IAM role policy manifests. |
| **Complete Mediation Routes** | Does every API endpoint validate caller authorization without relying on unauthenticated internal routes? | API Gateway routing logic &amp; penetration test reports. |
| **Attack Surface Minimization** | Are production container images stripped of debugging tools, compilers, and interactive shells? | Container image build files (`Dockerfile`) &amp; Trivy scan outputs. |
| **Layered Defense Redundancy** | Does the architecture contain at least three independent security layers protecting sensitive data? | System architecture diagrams &amp; threat model records. |
| **Kerckhoffs' Principle** | Does system security rely entirely on secret keys rather than secret proprietary algorithms? | Cryptographic implementation review reports. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Security by design requires enforcing Saltzer and Schroeder’s principles—specifically Least Privilege, Fail-Safe Defaults, and Complete Mediation. Layer overlapping controls via Defense-in-Depth so no single component failure compromises the system.</p>
</div>

## Primary references

- **Saltzer & Schroeder (1975)**: *The Protection of Information in Computer Systems* — [IEEE Proceedings](https://www.csee.wvu.edu/~cts/Saltzer_Schroeder.pdf)
- **NIST SP 800-160 Vol. 1**: *Engineering Trustworthy Secure Systems* — [NIST CSRC](https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final)
