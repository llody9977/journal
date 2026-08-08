---
title: Threat Frameworks & Modeling Methodologies
description: Comprehensive technical framework for design-time threat modeling (STRIDE, PASTA, VAST, OCTAVE, OWASP 4-Question) and operational threat intelligence models (Cyber Kill Chain, Diamond Model, MITRE ATT&CK/D3FEND).
permalink: /topics/threat-frameworks/
last_verified: 2026-08-07
---

<span class="eyebrow">Threat Intelligence & Detection / Decision Guide</span>

# Threat Frameworks & Modeling Methodologies

<p class="lede">Threat frameworks address distinct operational questions across the software lifecycle. Design-time threat modeling methodologies evaluate system architecture prior to deployment to identify misuse cases, trust boundary transitions, and attack vectors. Operational threat intelligence models analyze live intrusions, adversary techniques, and defensive countermeasures post-deployment.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/threat-frameworks-architecture.svg' | relative_url }}" alt="Threat Frameworks Architecture diagram showing Design-Time Threat Modeling (STRIDE, PASTA, VAST, OCTAVE, OWASP 4-Question) and Operational Intrusion Intelligence (Cyber Kill Chain, Diamond Model, MITRE ATT&CK & D3FEND).">
  <p class="diagram-caption">Threat Frameworks Architecture: Design-Time Threat Modeling (STRIDE, PASTA, VAST, OCTAVE, OWASP) $\longleftrightarrow$ Operational Intrusion Intelligence (Cyber Kill Chain, Diamond Model, MITRE ATT&amp;CK / D3FEND)</p>
</div>

## Design-Time Threat Modeling Methodologies

Engineering teams adopt design-time threat modeling frameworks based on system complexity, development cadence, and organizational risk governance:

| Threat Framework | Governing Philosophy &amp; Scope | Core Execution Mechanism | Primary Engineering Applicability |
|---|---|---|---|
| **OCTAVE (Carnegie Mellon)** | Organizational asset-driven risk evaluation focusing on operational risks, assets, and vulnerabilities. | Self-directed workshops identifying operational assets, organizational threats, and defense posture. | Enterprise IT infrastructure, physical/digital asset governance, organizational risk audits. |
| **[OWASP 4-Question Framework](https://owasp.org/www-project-threat-modeling/)** | Universal meta-process for driving continuous threat modeling iterations across any architecture. | Iterates: 1. *What are we working on?* 2. *What can go wrong?* 3. *What are we doing about it?* 4. *Did we do a good job?* | Agile software engineering, sprint-level threat modeling, and team design reviews. |
| **PASTA (Risk-Centric)** | Process for Attack Structure and Threat Analysis; 7-stage risk-centric framework aligning security with business impact. | Integrates business objectives, asset impact, threat intel, vulnerability analysis, and risk scoring (**Risk = Likelihood × Impact**). | Enterprise threat modeling, GRC risk alignment, and high-value financial/healthcare architectures. |
| **STRIDE (Microsoft)** | Developer-centric threat taxonomy categorizing 6 threat types (*Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation*). | Maps specific STRIDE categories to each component in a Data Flow Diagram (DFD). | Application security, microservices, API route design, and code-level threat modeling. |
| **VAST (Agile / Scalable)** | Visual, Agile, and Software Threat modeling; divides into Application Threat Models and Operational Threat Models. | Uses automated storyboarding and integration directly into DevOps / CI/CD pipelines. | Fast-paced Agile development teams, automated CI/CD security pipelines, enterprise DevSecOps. |

## Deep Dive: Microsoft STRIDE Threat Taxonomy

Developed at Microsoft, **STRIDE** evaluates six discrete threat categories against Data Flow Diagram (DFD) components to enforce core security invariants:

| STRIDE Category | Target Security Invariant | Threat Description &amp; Vector | Mandatory Engineering Mitigation |
|---|---|---|---|
| **Spoofing (S)** | **Authenticity** | Adversary impersonates a legitimate user, client, microservice, or origin server. | Phishing-resistant **WebAuthn / FIDO2 Passkeys**, mTLS client certificates, OAuth 2.1 tokens. |
| **Tampering (T)** | **Integrity** | Attacker alters payloads, database records, network packets, or code binaries. | AEAD ciphers (**AES-256-GCM / ChaCha20-Poly1305**), HMAC payload tags, digital signatures. |
| **Repudiation (R)** | **Non-Repudiation** | User executes an action and later denies involvement without verifiable system proof. | Asymmetric digital signatures (**Ed25519**), append-only SIEM log chains (**NIST SP 800-92**). |
| **Information Disclosure (I)** | **Confidentiality** | Unauthorized party observes sensitive data in transit, in memory, or at rest. | Enforce **TLS 1.3 / mTLS**, AES-256 column encryption, DPoP proof-of-possession binding. |
| **Denial of Service (D)** | **Availability** | Adversary exhausts system CPU, memory, bandwidth, or database connection pools. | WAF rate limiting, auto-scaling failover clusters, ingress BGP scrubbing, memory limits. |
| **Elevation of Privilege (E)** | **Authorization** | Attacker bypasses access controls to execute commands with elevated permissions. | Centralized **ABAC / OPA policy checks**, container sandboxing, least-privilege execution. |

## Operational Threat Intelligence & Intrusion Models

Post-deployment, incident response and threat intelligence teams leverage operational frameworks to analyze live intrusions and adversary techniques:

| Framework Name | Operational Focus &amp; Scope | Structural Execution Model | Primary Incident Application |
|---|---|---|---|
| **Cyber Kill Chain (Lockheed Martin)** | Linear intrusion lifecycle tracing external adversary progression. | 7 Sequential Stages: *Recon, Weaponize, Deliver, Exploit, Install, C2, Actions on Objectives*. | Perimeter intrusion tracking, SOC alert escalation, linear breach progression analysis. |
| **Diamond Model (Caltagirone et al.)** | Adversary attribution and event pivot relationship tracking. | Graph mapping 4 vertices: **Adversary**, **Capability**, **Infrastructure**, and **Victim**. | Incident pivoting, threat actor campaign tracking, threat intelligence attribution. |
| **[MITRE ATT&CK](https://attack.mitre.org/)** | Globally accessible knowledge base of adversary tactics, techniques, and procedures (TTPs). | Matrix of 15 Tactical Goals × 600+ Techniques/Sub-techniques (*Enterprise, Mobile, ICS, ATLAS*). | SOC detection engineering, adversary emulation, SIEM alert mapping &amp; coverage audits. |
| **[MITRE D3FEND](https://d3fend.mitre.org/)** | Defensive countermeasure knowledge graph mapped directly against ATT&CK TTPs. | Defensive Hierarchy: *Model, Harden, Detect, Isolate, Deceive, Evict, Restore*. | Security engineering control selection, countermeasure mapping &amp; gap validation. |

## Design-Time Threat Modeling vs Operational Intrusion Analysis

Selecting the wrong threat framework for an operational goal creates strategic misalignment. The matrix below contrasts design-time vs runtime frameworks:

| Operational Dimension | Design-Time Threat Modeling (STRIDE / PASTA) | Operational Intrusion Intelligence (ATT&amp;CK / Kill Chain) | Key Engineering Distinction |
|---|---|---|---|
| **Operational Timing** | Executed **prior to deployment** during architecture and design reviews. | Executed **during or post-deployment** during live SOC operations and incident response. | Proactive neutralization vs Reactive detection/mitigation. |
| **Primary Input** | Data Flow Diagrams (DFDs), API specs, software blueprints, threat models. | Live SIEM logs, EDR telemetry, PCAP network captures, memory dumps. | Structural architecture vs Observed runtime telemetry. |
| **Primary Output** | Required security controls, architectural refactors, threat registers. | Detection rules (YARA/Sigma), IOC indicators, attribution reports. | Control specification vs Detection rule engineering. |
| **Insider Threat Scope** | Native capability to model insider misuse and privilege escalation vectors. | Cyber Kill Chain assumes external origin; ATT&amp;CK covers insider TTPs natively. | Kill Chain fails on insider threats; STRIDE/ATT&amp;CK handle them natively. |

## Essential Threat Framework Diagnostic Checklist

When evaluating an enterprise threat modeling program or threat intelligence pipeline, evaluate these 6 diagnostic questions:

| Diagnostic Focus Area | Key Architectural Evaluation Question | Target Verification &amp; Audit Evidence |
|---|---|---|
| **Framework Timing Alignment** | Is design-time threat modeling (STRIDE/PASTA) performed *before* code deployment, and ATT&amp;CK used *after*? | Architecture review sign-offs &amp; SOC detection engineering roadmaps. |
| **Non-Linear Intrusion Handling** | Are incident response teams leveraging MITRE ATT&CK matrices rather than relying on linear Kill Chain models? | Incident response playbooks &amp; threat hunting query repositories. |
| **STRIDE Category Completeness** | Is every component in a System DFD evaluated against all applicable STRIDE threat categories? | Documented Threat Register listing component, threat vector, risk score &amp; owner. |
| **Threat Intelligence Integration** | Are threat intelligence feeds and real-world adversary TTPs used to score threat likelihood (**PASTA / FAIR**)? | GRC risk assessment reports &amp; threat intelligence ingestion logs. |
| **Defensive Countermeasure Mapping** | Are MITRE ATT&CK techniques paired with verified MITRE D3FEND countermeasures in production? | SIEM detection rule mappings &amp; D3FEND defensive coverage matrices. |
| **Continuous Model Re-assessment** | Is threat modeling re-triggered automatically whenever major architectural changes or new TTPs occur? | CI/CD pipeline triggers, quarterly threat model reviews &amp; post-incident audits. |
