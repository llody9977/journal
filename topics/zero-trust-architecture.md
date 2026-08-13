---
title: Zero Trust Architecture (ZTA) & NIST SP 800-207
description: Comprehensive technical guide to Zero Trust Architecture (ZTA), NIST SP 800-207 core tenets, Policy Engine, Policy Administrator, Policy Enforcement Points (PEP), and CARTA continuous adaptive evaluation.
permalink: /topics/zero-trust-architecture/
last_verified: 2026-08-13
---

<span class="eyebrow">Security Architecture & Design Principles / Zero Trust</span>

# Zero Trust Architecture (ZTA) & NIST SP 800-207

<p class="lede">Traditional perimeter-based security models rely on an implicit trust boundary: once a user or device successfully authenticates onto the internal network, it is granted broad access. Zero Trust Architecture (ZTA) eliminates implicit trust. Governed by NIST SP 800-207, Zero Trust operates on a fundamental principle: **Assume Breach**. Every access request—regardless of network location—must be explicitly authenticated, authorized, and continuously evaluated before access is granted.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/zero-trust-architecture.svg' | relative_url }}" alt="Zero Trust Architecture diagram showing NIST SP 800-207 Policy Engine, Policy Administrator, Policy Enforcement Point, and CARTA continuous adaptive evaluation.">
  <p class="diagram-caption">Zero Trust Architecture (NIST SP 800-207): Control Plane Policy Decision Point (PE &amp; PA) &leftrightarrow; Data Plane Policy Enforcement Point (PEP)</p>
</div>

## The Three Core Tenets of Zero Trust

Zero Trust architecture shifts security focus from network location to resource protection based on three core tenets:

1. **Assume Breach**: Operate under the assumption that adversaries already reside within internal corporate networks. Internal network segments are treated as un-trusted public networks.
2. **Explicit Verification**: Always authenticate and authorize based on all available data points—including user identity, device health posture, geographic location, firmware integrity, and threat intelligence.
3. **Least Privilege Access**: Limit user and workload access with Just-In-Time (JIT) and Just-Enough-Access (JEA) policies, Risk-based Adaptive Policies, and data protection controls.

## NIST SP 800-207 Logical Architecture

**NIST SP 800-207** defines the authoritative logical architecture for Zero Trust deployments, separating the **Control Plane** (Policy Decision Point) from the **Data Plane** (Policy Enforcement Point):

```
                               CONTROL PLANE (Policy Decision Point - PDP)
  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │                                                                                  │
  │   [ Policy Engine (PE) ]  <───> [ Threat Intel / IdP / EDR Context ]             │
  │             │                                                                    │
  │             ▼                                                                    │
  │   [ Policy Administrator (PA) ] ──( Issue Token / Command )──┐                   │
  └─────────────────────────────────────────────────────────────┼────────────────────┘
                                                                │
                               DATA PLANE                       │
  ┌─────────────────────────────────────────────────────────────┼────────────────────┐
  │                                                             ▼                    │
  │  Subject / Device ──( Request )──> [ Policy Enforcement Point (PEP) ] ──> Resource│
  └──────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Control Plane: Policy Decision Point (PDP)
- **Policy Engine (PE)**: The brain of Zero Trust. Consumes policy rules, threat intelligence, identity attributes (IdP), and device health metrics (EDR) to make ultimate access decisions (*Grant, Deny, Require Step-Up MFA*).
- **Policy Administrator (PA)**: Communicates with the Policy Engine and issues commands to the Policy Enforcement Point to establish or terminate encrypted data paths.

### 2. Data Plane: Policy Enforcement Point (PEP)
- **Policy Enforcement Point (PEP)**: Gatekeeper component (*e.g. API Gateway, mTLS sidecar proxy, SASE agent*) that intercepts, inspects, and terminates data connections between subjects and enterprise resources based on PDP decisions.

## Continuous Adaptive Trust (CARTA Framework)

Static, point-in-time authentication (*evaluating security only during initial login*) is insufficient. Zero Trust incorporates **Continuous Adaptive Risk and Trust Assessment (CARTA)**:

- **Dynamic Session Re-Evaluation**: Access decisions are re-evaluated continuously during active user sessions.
- **Risk-Triggered Revocation**: If a device's EDR agent detects malware or a user's risk score spikes (*e.g. impossible travel anomaly*), the Policy Engine revokes the active session token immediately via short-lived JWTs or OAuth Token Revocation (RFC 7009).

## Essential Zero Trust Diagnostic Checklist

When evaluating an enterprise Zero Trust implementation, audit these 6 criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Elimination of Implicit Trust** | Is access denied to internal network users unless explicitly authenticated via ZTA PDP policy? | Network routing rules &amp; PEP proxy logs. |
| **Control / Data Plane Separation** | Are Policy Decision Points (PDP) logically isolated from data plane traffic processing? | NIST 800-207 architecture review documentation. |
| **Device Posture Integration** | Does the Policy Engine require real-time EDR health verification before authorizing access? | EDR integration configs &amp; Policy Engine rule files. |
| **Microsegmentation Rules** | Are network workloads isolated using default-deny per-workload microsegmentation rules? | Kubernetes NetworkPolicies &amp; VPC security groups. |
| **Continuous Session Re-Eval** | Are session tokens short-lived (<= 15 minutes) or backed by automated risk-triggered revocation? | IdP token lifetime settings &amp; CARTA revocation logs. |
| **Encrypted Transit Default** | Is all internal data-plane traffic encrypted using mTLS with mutual identity validation? | Service mesh mTLS configs (Istio/Linkerd). |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Zero Trust Architecture (NIST SP 800-207) eliminates implicit network trust under the principle of 'Assume Breach'. Control Plane Policy Decision Points (PE/PA) evaluate identity, device health, and risk dynamically to enforce policy via Data Plane Policy Enforcement Points (PEP).</p>
</div>

## Primary references

- **NIST SP 800-207**: *Zero Trust Architecture* — [NIST CSRC](https://csrc.nist.gov/publications/detail/sp/800-207/final)
- **CISA Zero Trust Maturity Model**: *CISA ZTMM Version 2.0* — [CISA Official](https://www.cisa.gov/zero-trust-maturity-model)
