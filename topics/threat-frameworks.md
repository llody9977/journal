---
title: Threat Frameworks & Modeling Methodologies
description: Comprehensive technical framework for design-time threat modeling (STRIDE, PASTA, VAST, OCTAVE, OWASP 4-Question) and operational threat intelligence models (Cyber Kill Chain, Diamond Model, MITRE ATT&CK/D3FEND).
permalink: /topics/threat-frameworks/
last_verified: 2026-08-12
---

<span class="eyebrow">Threat Intelligence & Detection / Decision Guide</span>

# Threat Frameworks & Modeling Methodologies

<p class="lede">Threat frameworks address distinct operational questions across the software lifecycle. Design-time threat modeling methodologies evaluate system architecture — most heavily during design reviews, though teams can and should revisit them as a deployed system evolves — to identify misuse cases, trust boundary transitions, and attack vectors. Operational threat intelligence models analyze live intrusions, adversary techniques, and defensive countermeasures, primarily using post-deployment telemetry.</p>

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
| **PASTA (Risk-Centric)** | Process for Attack Simulation and Threat Analysis; 7-stage risk-centric framework aligning security with business impact. | Integrates business objectives, asset impact, threat intel, vulnerability analysis, and a risk scoring stage (commonly a simplified `Likelihood × Impact` model). | Enterprise threat modeling, GRC risk alignment, and high-value financial/healthcare architectures. |
| **STRIDE (Microsoft)** | Developer-centric threat taxonomy categorizing 6 threat types (*Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation*). | Maps specific STRIDE categories to each component in a Data Flow Diagram (DFD). | Application security, microservices, API route design, and code-level threat modeling. |
| **VAST (Agile / Scalable)** | Visual, Agile, and Simple Threat modeling; divides into Application Threat Models and Operational Threat Models. | Uses automated storyboarding and integration directly into DevOps / CI/CD pipelines. | Fast-paced Agile development teams, automated CI/CD security pipelines, enterprise DevSecOps. |

## Deep Dive: Microsoft STRIDE Threat Taxonomy

Developed at Microsoft, **STRIDE** is a threat *categorization* taxonomy: it identifies six discrete threat categories to evaluate against Data Flow Diagram (DFD) components. STRIDE itself does not mandate a specific control for each category — control selection is a separate, context-dependent engineering decision. The mitigations below are this journal's own illustrative pairings for reasoning about each category, not part of the STRIDE specification; real systems may reasonably select different controls for the same threat category depending on their architecture and constraints.

| STRIDE Category | Target Security Invariant | Threat Description &amp; Vector | Illustrative Mitigation (not STRIDE-mandated) |
|---|---|---|---|
| **Spoofing (S)** | **Authenticity** | Adversary impersonates a legitimate user, client, microservice, or origin server. | Phishing-resistant **WebAuthn / FIDO2 Passkeys**, mTLS client certificates, OAuth 2.1 tokens. |
| **Tampering (T)** | **Integrity** | Attacker alters payloads, database records, network packets, or code binaries. | AEAD ciphers (**AES-256-GCM / ChaCha20-Poly1305**), HMAC payload tags, digital signatures. |
| **Repudiation (R)** | **Non-Repudiation** | User executes an action and later denies involvement without verifiable system proof. | Asymmetric digital signatures (**Ed25519**), append-only SIEM log chains (**NIST SP 800-92**). |
| **Information Disclosure (I)** | **Confidentiality** | Unauthorized party observes sensitive data in transit, in memory, or at rest. | Enforce **TLS 1.3 / mTLS**, AES-256 column encryption, DPoP proof-of-possession binding. |
| **Denial of Service (D)** | **Availability** | Adversary exhausts system CPU, memory, bandwidth, or database connection pools. | WAF rate limiting, auto-scaling failover clusters, ingress BGP scrubbing, memory limits. |
| **Elevation of Privilege (E)** | **Authorization** | Attacker bypasses access controls to execute commands with elevated permissions. | Centralized **ABAC / OPA policy checks**, container sandboxing, least-privilege execution. |

## Operational Threat Intelligence & Intrusion Models

Incident response and threat intelligence teams use behavior-oriented frameworks to analyze intrusions and adversary techniques. The same knowledge bases also support design reviews, adversary emulation, control assessment, and detection planning before an incident occurs:

| Framework Name | Operational Focus &amp; Scope | Structural Execution Model | Primary Incident Application |
|---|---|---|---|
| **Cyber Kill Chain (Lockheed Martin)** | Linear intrusion lifecycle tracing external adversary progression. | 7 Sequential Stages: *Recon, Weaponize, Deliver, Exploit, Install, C2, Actions on Objectives*. | Perimeter intrusion tracking, SOC alert escalation, linear breach progression analysis. |
| **Diamond Model (Caltagirone et al.)** | Adversary attribution and event pivot relationship tracking. | Graph mapping 4 vertices: **Adversary**, **Capability**, **Infrastructure**, and **Victim**. | Incident pivoting, threat actor campaign tracking, threat intelligence attribution. |
| **[MITRE ATT&CK](https://attack.mitre.org/)** | Globally accessible knowledge base of adversary tactics, techniques, and procedures (TTPs). | Three platform matrices — Enterprise, Mobile, and ICS — each mapping tactics to techniques and sub-techniques; the exact counts grow with every ATT&amp;CK release, so treat any fixed number as approximate and check [attack.mitre.org](https://attack.mitre.org/) for the current figure. | Threat-informed defense, adversary emulation, detection engineering, assessment planning, and SIEM alert mapping. |
| **[MITRE D3FEND](https://d3fend.mitre.org/)** | Defensive countermeasure knowledge graph mapped directly against ATT&CK TTPs. | Defensive Hierarchy: *Model, Harden, Detect, Isolate, Deceive, Evict, Restore*. | Security engineering control selection, countermeasure mapping &amp; gap validation. |
| **[MITRE ATLAS](https://atlas.mitre.org/)** | Standalone knowledge base of adversary tactics and techniques against AI/ML systems, drawn from real-world attack observations and red-team findings. | Modeled after ATT&amp;CK's structure and methodology and designed to be complementary to it, but maintained as its own separate matrix rather than an ATT&amp;CK matrix. | AI/ML system threat modeling, adversarial ML red-teaming, and AI-specific detection engineering. |

## Design-Time Threat Modeling vs Operational Intrusion Analysis

Selecting a framework poorly matched to the task at hand creates strategic misalignment. Neither column below is confined to a single lifecycle phase — STRIDE and PASTA can be re-run incrementally as a deployed system evolves, and ATT&amp;CK/Kill Chain analysis can inform design-time hardening — but each framework has a different primary emphasis:

| Operational Dimension | Design-Time Threat Modeling (STRIDE / PASTA) | Operational Intrusion Intelligence (ATT&amp;CK / Kill Chain) | Key Engineering Distinction |
|---|---|---|---|
| **Primary Emphasis** | Most naturally suited to **architecture and design-time analysis**, though teams can and should re-apply it as a system changes post-deployment. | Most naturally suited to **live SOC operations and incident response**, though its TTP catalog also informs design-time hardening decisions. | Design-oriented analysis vs detection/response-oriented analysis, not a strict before/after split. |
| **Primary Input** | Data Flow Diagrams (DFDs), API specs, software blueprints, threat models. | Threat intelligence, adversary-emulation plans, and—during operations or incidents—SIEM logs, EDR telemetry, packet captures, and memory evidence. | Structural architecture vs behavior and evidence, with lifecycle overlap. |
| **Primary Output** | Required security controls, architectural refactors, threat registers. | Detection hypotheses and rules, emulation plans, investigation pivots, and coverage maps that still require testing. | Design decisions vs threat-informed operational and assessment artifacts. |
| **Insider Threat Scope** | Native capability to model insider misuse and privilege escalation vectors. | The Cyber Kill Chain is widely criticized as a weaker fit for insider-threat scenarios, since its stages assume an external intruder progressing through discrete access stages that an already-privileged insider skips; ATT&amp;CK covers insider TTPs more directly. | STRIDE/ATT&amp;CK model insiders more directly than the Kill Chain's external-intrusion narrative. |

## Essential Threat Framework Diagnostic Checklist

When evaluating an enterprise threat modeling program or threat intelligence pipeline, evaluate these 6 diagnostic questions:

| Diagnostic Focus Area | Key Architectural Evaluation Question | Target Verification &amp; Audit Evidence |
|---|---|---|
| **Framework Emphasis Alignment** | Is design-time threat modeling (STRIDE/PASTA) applied during architecture and design reviews — and re-applied as the system evolves — while ATT&amp;CK informs live SOC operations? | Architecture review sign-offs &amp; SOC detection engineering roadmaps. |
| **Non-Linear Intrusion Handling** | Are incident response teams leveraging MITRE ATT&CK matrices rather than relying on linear Kill Chain models? | Incident response playbooks &amp; threat hunting query repositories. |
| **STRIDE Category Completeness** | Is every component in a System DFD evaluated against all applicable STRIDE threat categories? | Documented Threat Register listing component, threat vector, risk score &amp; owner. |
| **Threat Intelligence Integration** | Are threat intelligence feeds and real-world adversary TTPs used to score threat likelihood (**PASTA / FAIR**)? | GRC risk assessment reports &amp; threat intelligence ingestion logs. |
| **Defensive Countermeasure Mapping** | Are relevant ATT&amp;CK techniques mapped to candidate defensive measures, then validated through testing rather than treated as covered from mapping alone? | Tested SIEM/EDR detections, adversary-emulation results, and supporting D3FEND mappings where applicable. |
| **Continuous Model Re-assessment** | Is threat modeling re-triggered automatically whenever major architectural changes or new TTPs occur? | CI/CD pipeline triggers, quarterly threat model reviews &amp; post-incident audits. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Threat-modeling methods such as STRIDE, PASTA, and VAST primarily analyze architecture, while ATT&amp;CK and the Cyber Kill Chain organize observed or expected adversary behavior; both can inform design and operations. ATT&amp;CK technique mapping inventories intended coverage, but measured coverage requires relevant telemetry plus tested detections or adversary-emulation evidence.</p>
</div>

## Primary references

- **MITRE ATT&amp;CK**: *Adversary Tactics, Techniques, and Knowledge Base* — [MITRE ATT&amp;CK Official](https://attack.mitre.org/)
- **Lockheed Martin Cyber Kill Chain**: *Seven Steps of Cyber Kill Chain* — [Lockheed Martin](https://www.lockheedmartin.com/en-us/capabilities/cyber/cyber-kill-chain.html)
