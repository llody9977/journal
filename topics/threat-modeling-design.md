---
title: Design-Time Architecture Threat Modeling
description: Comprehensive technical guide to design-time threat modeling methodologies (STRIDE, PASTA, OWASP 4-Question Framework, VAST, and OCTAVE Allegro) for evaluating system architecture, trust boundaries, and component security invariants.
permalink: /topics/threat-modeling-design/
last_verified: 2026-08-13
---

<span class="eyebrow">Threat Intelligence & Detection / Decision Guide</span>

# Design-Time Architecture Threat Modeling

<p class="lede">Design-time threat modeling evaluates software architecture, component trust boundaries, data flows, and security invariants during system design and continuous development iterations. Rather than reacting to post-deployment intrusions, engineering teams apply design-time frameworks—most heavily during design reviews and sprint planning—to identify misuse cases, threat vectors, and architectural refactoring requirements before code is deployed.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/design-time-threat-modeling.svg' | relative_url }}" alt="Design-Time Architecture Threat Modeling diagram showing STRIDE DFD mapping, PASTA 7-stage risk process, OWASP 4-Question engine, and VAST DevSecOps integration.">
  <p class="diagram-caption">Design-Time Architecture Threat Modeling: STRIDE DFD Mapping &leftrightarrow; PASTA 7-Stage Risk Alignment &leftrightarrow; OWASP 4-Question Engine &leftrightarrow; VAST / OCTAVE Allegro Integration</p>
</div>

## Framework Overview & Selection Criteria

Engineering teams select design-time threat modeling frameworks based on system architecture complexity, development cadence, risk governance requirements, and organizational maturity:

| Threat Framework | Primary Philosophy &amp; Scope | Execution Mechanism | Ideal Engineering Context |
|---|---|---|---|
| **STRIDE (Microsoft)** | Developer-centric threat categorization taxonomy mapping 6 threat types against Data Flow Diagrams (DFDs). | Maps Spoofing, Tampering, Repudiation, Info Disclosure, DoS, and Elevation of Privilege to DFD components. | Microservices, API endpoint design, application security reviews, and component-level code design. |
| **PASTA (Risk-Centric)** | Process for Attack Simulation and Threat Analysis; 7-stage risk-centric framework aligning security with business impact. | Integrates business objectives, asset impact, threat intel, vulnerability analysis, attack trees, and risk scoring (`Likelihood × Impact`). | Enterprise software architectures, GRC risk alignment, financial applications, and healthcare systems. |
| **[OWASP 4-Question Framework](https://owasp.org/www-project-threat-modeling/)** | Universal meta-process driving continuous threat modeling iterations across any architecture. | Iterates: 1. *What are we working on?* 2. *What can go wrong?* 3. *What are we doing about it?* 4. *Did we do a good job?* | Agile software engineering, sprint-level design reviews, and continuous DevSecOps pipelines. |
| **VAST (Agile / Scalable)** | Visual, Agile, and Simple Threat modeling dividing into Application and Operational threat models. | Uses automated storyboarding and integration directly into DevOps and CI/CD pipelines. | Fast-paced Agile development teams, automated CI/CD security pipelines, enterprise DevSecOps. |
| **OCTAVE Allegro (CMU SEI)** | Organizational asset-driven risk evaluation focusing on information assets and container boundaries. | Self-directed workshops identifying operational assets, container boundaries, threat profiles, and mitigation strategies. | Enterprise IT infrastructure, physical and digital asset governance, and organizational risk audits. |

## Deep Dive: Microsoft STRIDE Threat Taxonomy & DFD Matrix

Developed at Microsoft, **STRIDE** is a threat *categorization* taxonomy that evaluates six discrete threat categories against Data Flow Diagram (DFD) components. STRIDE itself does not mandate specific mitigations—control selection is a context-dependent engineering choice based on system constraints.

| STRIDE Category | Security Invariant | Threat Description &amp; Vector | Illustrative Mitigation (not STRIDE-mandated) |
|---|---|---|---|
| **Spoofing (S)** | **Authenticity** | Adversary impersonates a legitimate user, client, microservice, or origin server. | Phishing-resistant **WebAuthn / FIDO2 Passkeys**, mTLS client certificates, OAuth 2.1 DPoP tokens. |
| **Tampering (T)** | **Integrity** | Attacker alters payloads, database records, network packets, or code binaries. | AEAD ciphers (**AES-256-GCM / ChaCha20-Poly1305**), HMAC payload tags, digital signatures. |
| **Repudiation (R)** | **Non-Repudiation** | User executes an action and later denies involvement without verifiable system proof. | Asymmetric digital signatures (**Ed25519**), append-only SIEM log chains ([**NIST SP 800-92**](https://csrc.nist.gov/publications/detail/sp/800-92/final)). |
| **Information Disclosure (I)** | **Confidentiality** | Unauthorized party observes sensitive data in transit, in memory, or at rest. | Enforce **TLS 1.3 / mTLS**, AES-256 column encryption, DPoP proof-of-possession binding. |
| **Denial of Service (D)** | **Availability** | Adversary exhausts system CPU, memory, bandwidth, or database connection pools. | WAF rate limiting, auto-scaling failover clusters, ingress BGP scrubbing, memory limits. |
| **Elevation of Privilege (E)** | **Authorization** | Attacker bypasses access controls to execute commands with elevated permissions. | Centralized **ABAC / OPA policy checks**, container sandboxing, least-privilege execution. |

### STRIDE-per-Element DFD Applicability Matrix

When evaluating a System Data Flow Diagram (DFD), apply threat categories based on the component element type:

| DFD Element Type | Spoofing (S) | Tampering (T) | Repudiation (R) | Info Disclosure (I) | Denial of Service (D) | Elevation of Privilege (E) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **External Entity** (User, External API) | **Yes** | — | **Yes** | — | — | — |
| **Process** (Microservice, Web Server) | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| **Data Store** (SQL DB, S3 Bucket) | — | **Yes** | **Yes** | **Yes** | **Yes** | — |
| **Data Flow** (HTTPS Request, RPC) | — | **Yes** | — | **Yes** | **Yes** | — |

## Deep Dive: PASTA 7-Stage Risk-Centric Process

The **Process for Attack Simulation and Threat Analysis (PASTA)** is a 7-stage risk-centric framework designed to align technical threat modeling with enterprise business impact and threat intelligence:

1. **Stage 1: Define Objectives** — Document business objectives, compliance mandates (PCI DSS, HIPAA, SOC 2), and security SLAs.
2. **Stage 2: Define Technical Scope** — Map infrastructure components, network boundaries, software dependencies, and API endpoints.
3. **Stage 3: Application Decomposition** — Deconstruct application architecture using DFDs, identifying trust boundaries and asset locations.
4. **Stage 4: Threat Analysis** — Ingest threat intelligence, identify adversary motivations, and construct threat scenarios relevant to the architecture.
5. **Stage 5: Vulnerability & Flaw Analysis** — Review CVE/CWE databases, static code analysis (SAST) findings, and design flaws.
6. **Stage 6: Attack Modeling** — Construct attack trees and simulate exploit paths to measure attack feasibility and probability.
7. **Stage 7: Risk & Impact Analysis** — Score residual risk ($\text{Likelihood} \times \text{Impact}$) and select countermeasures to mitigate business loss.

## Deep Dive: OWASP 4-Question Practical Execution

The **OWASP 4-Question Framework** acts as a lightweight, continuous meta-process for Agile software development teams:

<div class="diagram-frame">
  <img src="{{ '/assets/img/threat-modeling-design.svg' | relative_url }}" alt="OWASP 4-Question Threat Modeling Execution diagram.">
  <p class="diagram-caption">OWASP 4-Question Framework: What are we building? &leftrightarrow; What can go wrong? &leftrightarrow; What are we doing? &leftrightarrow; Did we do a good job?</p>
</div>

- **Question 1: What are we working on?** — Deconstruct the feature or service using a visual Data Flow Diagram (DFD) or architecture diagram showing inputs, outputs, processes, stores, and trust boundaries.
- **Question 2: What can go wrong?** — Brainstorm misuse cases and vulnerabilities using STRIDE or threat modeling workshops.
- **Question 3: What are we doing about it?** — Translate identified threats into actionable security controls and track them as sprint user stories in the development backlog.
- **Question 4: Did we do a good job?** — Validate that controls are implemented through peer reviews, automated unit/integration tests, and retrospective threat model updates.

## Deep Dive: VAST & OCTAVE Allegro Frameworks

### VAST (Visual, Agile, and Simple Threat Modeling)
Designed for enterprise DevSecOps, VAST divides threat modeling into two complementary views:
- **Application Threat Models**: Focuses on architectural components, data flows, and code vulnerabilities (for developers).
- **Operational Threat Models**: Focuses on infrastructure, deployment environments, and network trust boundaries (for operations/sysadmins).
VAST integrates directly into CI/CD storyboarding to trigger automated threat model updates whenever architectural changes occur.

### OCTAVE Allegro (CMU SEI)
Developed at Carnegie Mellon University, **OCTAVE Allegro** focuses on information asset risk governance through an 8-step workflow organized into 4 phases:
- **Phase 1: Establish Risk Measurement Criteria** — Define organizational impact drivers (financial, reputational, regulatory).
- **Phase 2: Develop Asset Profile** — Identify critical information assets and map their container boundaries (technical, physical, people).
- **Phase 3: Identify Threat Targets** — Evaluate threats against asset containers.
- **Phase 4: Risk Mitigation & Strategy** — Calculate asset risk scores and define mitigation or acceptance strategies.

## Essential Design-Time Threat Modeling Diagnostic Checklist

When auditing an enterprise threat modeling program, verify these 6 core criteria:

| Diagnostic Focus Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **DFD Completeness** | Does every system component have an up-to-date Data Flow Diagram showing clear trust boundaries? | System architecture documentation &amp; DFD repositories. |
| **STRIDE Category Coverage** | Is every process, data store, data flow, and external entity evaluated against its full STRIDE applicability matrix? | Documented Threat Register listing component, vector, and risk score. |
| **Risk Scoring Calibration** | Are threats scored using an explicit risk scoring formula (e.g. PASTA $\text{Likelihood} \times \text{Impact}$)? | GRC risk assessment reports &amp; prioritized mitigation backlogs. |
| **Backlog Control Integration** | Are threat mitigations converted into tracked backlog tickets rather than isolated report PDFs? | Jira/GitHub issue tracking linking threat IDs to code pull requests. |
| **Continuous Re-Assessment** | Is threat modeling automatically re-triggered when major architectural or API changes occur? | CI/CD pipeline triggers &amp; quarterly threat model review sign-offs. |
| **Empirical Verification** | Are selected mitigations verified through automated testing before closing a threat ticket? | Automated security unit tests, SAST/DAST pipeline results, and peer code reviews. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Design-time threat modeling evaluates architecture before deployment. STRIDE categorizes threats against DFD components (with processes subject to all 6 categories), PASTA aligns security with 7 business-risk stages, and OWASP's 4 questions provide a continuous meta-process for DevSecOps sprints.</p>
</div>

## Primary references

- **OWASP Threat Modeling Project**: *Universal 4-Question Threat Modeling Framework* — [OWASP Threat Modeling](https://owasp.org/www-project-threat-modeling/)
- **Microsoft Threat Modeling**: *Shostack, A. (2014). Threat Modeling: Designing for Security* — [Adam Shostack Official](https://www.shostack.org/books/threat-modeling-book)
- **PASTA Framework**: *UcedaVelez, T., &amp; Morana, M. M. (2015). Risk Centric Threat Modeling* — [PASTA Threat Modeling](https://vikingcloud.com/resources/blog/pasta-threat-modeling-framework)
- **NIST SP 800-92**: *Guide to Computer Security Log Management* — [NIST CSRC](https://csrc.nist.gov/publications/detail/sp/800-92/final)
