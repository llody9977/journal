---
title: Design-Time Architecture Threat Modeling
description: Technical reference for design-time threat modeling methodologies (STRIDE, PASTA, OWASP 4-Question Framework, VAST, and OCTAVE Allegro) for evaluating system architecture, trust boundaries, and component security invariants.
permalink: /topics/threat-modeling-design/
last_verified: 2026-08-15
---

<span class="eyebrow">Threat Intelligence & Detection / Decision Guide</span>

# Design-Time Architecture Threat Modeling

<p class="lede">Design-time threat modeling evaluates software architecture, component trust boundaries, data flows, and security invariants during system design and continuous development iterations. Rather than reacting to post-deployment intrusions, engineering teams apply design-time frameworks—most heavily during design reviews and sprint planning—to identify misuse cases, threat vectors, and architectural refactoring requirements before code is deployed.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/design-time-threat-modeling.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the design-time threat modeling framework diagram at full size">
    <img src="{{ '/assets/img/design-time-threat-modeling.svg' | relative_url }}" alt="Design-Time Architecture Threat Modeling diagram showing STRIDE DFD mapping, PASTA 7-stage risk process, OWASP 4-Question engine, and VAST DevSecOps integration.">
  </a>
  <p class="diagram-caption">Design-Time Architecture Threat Modeling: STRIDE DFD Mapping &leftrightarrow; PASTA 7-Stage Risk Alignment &leftrightarrow; OWASP 4-Question Engine &leftrightarrow; VAST / OCTAVE Allegro Integration</p>
</div>

## Framework Overview & Selection Criteria

Engineering teams select design-time threat modeling frameworks based on system architecture complexity, development cadence, risk governance requirements, and organizational maturity.

The five entries below do not all operate at the same altitude. STRIDE, PASTA, the OWASP questions, and VAST evaluate a *system* — components, data flows, and trust boundaries on a Data Flow Diagram. OCTAVE Allegro evaluates an *organization's information assets* and the containers that hold them; it is normally paired with a system-level method rather than used instead of one. [Trust Boundaries & Threat Modeling]({{ '/topics/trust-boundaries-threat-modeling/' | relative_url }}) covers DFD construction and boundary identification, which every method in this table assumes as an input.

| Threat Framework | Primary Philosophy &amp; Scope | Execution Mechanism | Ideal Engineering Context |
|---|---|---|---|
| **STRIDE (Microsoft)** | Developer-centric threat categorization taxonomy mapping 6 threat types against Data Flow Diagrams (DFDs). | Maps Spoofing, Tampering, Repudiation, Info Disclosure, DoS, and Elevation of Privilege to DFD components. | Microservices, API endpoint design, application security reviews, and component-level code design. |
| **PASTA (Risk-Centric)** | Process for Attack Simulation and Threat Analysis; 7-stage risk-centric framework aligning security with business impact. | Integrates business objectives, asset impact, threat intel, vulnerability analysis, attack trees, and a risk scoring stage (commonly a simplified `Likelihood × Impact` model, which PASTA does not itself mandate). | Enterprise software architectures, GRC risk alignment, financial applications, and healthcare systems. |
| **[OWASP 4-Question Framework](https://owasp.org/www-project-threat-modeling/)** | Universal meta-process driving continuous threat modeling iterations across any architecture. | Iterates: 1. *What are we working on?* 2. *What can go wrong?* 3. *What are we going to do about it?* 4. *Did we do a good job?* | Agile software engineering, sprint-level design reviews, and continuous DevSecOps pipelines. |
| **VAST (vendor-originated)** | Visual, Agile, and Simple Threat modeling dividing into Application and Operational threat models. | Uses automated storyboarding and integration into DevOps and CI/CD pipelines. | Fast-paced Agile development teams, automated CI/CD security pipelines, enterprise DevSecOps. |
| **[OCTAVE Allegro (CMU SEI)](https://www.sei.cmu.edu/library/introducing-octave-allegro-improving-the-information-security-risk-assessment-process/)** | Organizational asset-driven risk evaluation focusing on information assets and container boundaries. Operates above the component level. | Self-directed workshops identifying operational assets, container boundaries, threat profiles, and mitigation strategies. | Enterprise IT infrastructure, physical and digital asset governance, and organizational risk audits. |

## Deep Dive: Microsoft STRIDE Threat Taxonomy & DFD Matrix

Developed at Microsoft, **STRIDE** is a threat *categorization* taxonomy that evaluates six discrete threat categories against Data Flow Diagram (DFD) components. STRIDE itself does not mandate specific mitigations—control selection is a context-dependent engineering choice based on system constraints.

| STRIDE Category | Security Invariant | Threat Description &amp; Vector | Illustrative Mitigation (not STRIDE-mandated) |
|---|---|---|---|
| **Spoofing (S)** | **Authenticity** | Adversary impersonates a legitimate user, client, microservice, or origin server. | Phishing-resistant **WebAuthn / FIDO2 Passkeys**, mTLS client certificates, DPoP sender-constrained tokens ([**RFC 9449**](https://www.rfc-editor.org/rfc/rfc9449.html)). |
| **Tampering (T)** | **Integrity** | Attacker alters payloads, database records, network packets, or code binaries. | AEAD ciphers (**AES-256-GCM / ChaCha20-Poly1305**), HMAC payload tags, digital signatures. |
| **Repudiation (R)** | **Non-Repudiation** | User executes an action and later denies involvement without verifiable system proof. | Asymmetric digital signatures (**Ed25519**), append-only, integrity-protected audit logs (log management planning: [**NIST SP 800-92**](https://csrc.nist.gov/pubs/sp/800/92/final), 2006; Rev. 1 remains in draft). |
| **Information Disclosure (I)** | **Confidentiality** | Unauthorized party observes sensitive data in transit, in memory, or at rest. | Enforce **TLS 1.3 / mTLS**, AES-256 column encryption, field-level tokenization. |
| **Denial of Service (D)** | **Availability** | Adversary exhausts system CPU, memory, bandwidth, or database connection pools. | WAF rate limiting, auto-scaling failover clusters, ingress BGP scrubbing, memory limits. |
| **Elevation of Privilege (E)** | **Authorization** | Attacker bypasses access controls to execute commands with elevated permissions. | Centralized **ABAC / OPA policy checks**, container sandboxing, least-privilege execution. |

### STRIDE-per-Element DFD Applicability Matrix

When evaluating a System Data Flow Diagram (DFD), apply threat categories based on the component element type:

| DFD Element Type | Spoofing (S) | Tampering (T) | Repudiation (R) | Info Disclosure (I) | Denial of Service (D) | Elevation of Privilege (E) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **External Entity** (User, External API) | **Yes** | — | **Yes** | — | — | — |
| **Process** (Microservice, Web Server) | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| **Data Store** (SQL DB, S3 Bucket) | — | **Yes** | **Yes\*** | **Yes** | **Yes** | — |
| **Data Flow** (HTTPS Request, RPC) | — | **Yes** | — | **Yes** | **Yes** | — |

\* Repudiation applies to a data store when that store holds the audit or log records that would otherwise establish accountability. A store holding only business data is not itself a repudiation target.

## Deep Dive: PASTA 7-Stage Risk-Centric Process

The **Process for Attack Simulation and Threat Analysis (PASTA)** is a 7-stage risk-centric framework designed to align technical threat modeling with enterprise business impact and threat intelligence:

1. **Stage 1: Define Objectives** — Document business objectives, compliance mandates (PCI DSS, HIPAA, SOC 2), and security SLAs.
2. **Stage 2: Define Technical Scope** — Map infrastructure components, network boundaries, software dependencies, and API endpoints.
3. **Stage 3: Application Decomposition** — Deconstruct application architecture using DFDs, identifying trust boundaries and asset locations.
4. **Stage 4: Threat Analysis** — Ingest threat intelligence, identify adversary motivations, and construct threat scenarios relevant to the architecture.
5. **Stage 5: Vulnerability & Flaw Analysis** — Review CVE/CWE databases, static code analysis (SAST) findings, and design flaws.
6. **Stage 6: Attack Modeling** — Construct attack trees and simulate exploit paths to measure attack feasibility and probability.
7. **Stage 7: Risk & Impact Analysis** — Score residual risk — commonly using a simplified `Likelihood × Impact` model, which is a widespread practitioner convention rather than a formula PASTA mandates — and select countermeasures to mitigate business loss.

## Deep Dive: OWASP 4-Question Practical Execution

The **OWASP 4-Question Framework** acts as a lightweight, continuous meta-process for Agile software development teams:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/threat-modeling-questions.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the four-question threat modeling cycle diagram at full size">
    <img src="{{ '/assets/img/threat-modeling-questions.svg' | relative_url }}" alt="Four questions in a threat-modeling cycle: scope (what are we working on), analyze (what can go wrong), respond (what are we going to do about it), and validate (did we do a good job), connected by model, mitigate, and verify transitions.">
  </a>
  <p class="diagram-caption">OWASP 4-Question Framework: What are we working on? &rarr; What can go wrong? &rarr; What are we going to do about it? &rarr; Did we do a good job?</p>
</div>

- **Question 1: What are we working on?** — Deconstruct the feature or service using a visual Data Flow Diagram (DFD) or architecture diagram showing inputs, outputs, processes, stores, and trust boundaries.
- **Question 2: What can go wrong?** — Brainstorm misuse cases and vulnerabilities using STRIDE or threat modeling workshops.
- **Question 3: What are we going to do about it?** — Translate identified threats into actionable security controls and track them as sprint user stories in the development backlog.
- **Question 4: Did we do a good job?** — Validate that controls are implemented through peer reviews, automated unit/integration tests, and retrospective threat model updates.

## Deep Dive: VAST & OCTAVE Allegro Frameworks

### VAST (Visual, Agile, and Simple Threat Modeling)

VAST is a vendor-originated methodology associated with ThreatModeler Inc. It has no open published specification, so the description below reflects its documented positioning rather than a standard that can be independently verified clause by clause. VAST divides threat modeling into two complementary views:

- **Application Threat Models**: Focuses on architectural components, data flows, and code vulnerabilities (for developers).
- **Operational Threat Models**: Focuses on infrastructure, deployment environments, and network trust boundaries (for operations/sysadmins).

It is designed to integrate with CI/CD storyboarding so that threat model updates are triggered when architectural changes occur, rather than only at scheduled review points.

### OCTAVE Allegro (CMU SEI)

Developed at Carnegie Mellon University, **OCTAVE Allegro** ([CMU/SEI-2007-TR-012](https://www.sei.cmu.edu/library/introducing-octave-allegro-improving-the-information-security-risk-assessment-process/)) focuses on information asset risk governance through 8 steps organized into 4 phases:

- **Phase 1: Establish Drivers** — Step 1 establishes the risk measurement criteria and maps them to organizational impact drivers (financial, reputational, regulatory).
- **Phase 2: Profile Assets** — Steps 2–3 develop the information asset profile and identify the technical, physical, and people containers where each asset lives.
- **Phase 3: Identify Threats** — Steps 4–5 identify areas of concern and expand them into threat scenarios against those containers.
- **Phase 4: Identify and Mitigate Risks** — Steps 6–8 identify and analyze risks, then select a mitigation, acceptance, deferral, or transfer approach.

## Where Design-Time Threat Modeling Falls Short

A threat model is a point-in-time artifact about a system that keeps changing. Three failure modes recur:

- **Model staleness**: The model describes the architecture as designed, not as deployed. After a refactor, a new integration, or an emergency change, the DFD and the running system diverge silently. Nothing in STRIDE or PASTA detects that drift; only a re-trigger discipline does.
- **Abstraction blindness**: Threats below the DFD's granularity are invisible to it. A single "Auth Service" box hides the token-signing key handling, the session cache, and the library that parses the JWT — each a real attack surface the diagram cannot express.
- **Participant bias**: Workshop output reflects who was in the room. A model built without the team that operates the database will under-represent operational and insider paths, and a model built without a security engineer will under-represent chained exploitation.

Design-time modeling also cannot establish that a selected control works. It produces a hypothesis about what should stop an attack; proving it requires the runtime evidence covered in [Adversary Emulation & Continuous Security Validation]({{ '/topics/adversary-emulation/' | relative_url }}), and the intrusion frameworks in [Operational Intrusion Frameworks]({{ '/topics/operational-intrusion-frameworks/' | relative_url }}) describe the attacker behavior the model is trying to anticipate.

## Essential Design-Time Threat Modeling Diagnostic Checklist

The checklist below is a journal working model, not a published audit standard. It operationalizes the framework criteria above into a repeatable review; calibrate the evidence expectations to the size and regulatory context of the program being assessed.

| Diagnostic Focus Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **DFD Completeness** | Does every system component have an up-to-date Data Flow Diagram showing clear trust boundaries? | System architecture documentation &amp; DFD repositories. |
| **STRIDE Category Coverage** | Is every process, data store, data flow, and external entity evaluated against its full STRIDE applicability matrix? | Documented Threat Register listing component, vector, and risk score. |
| **Risk Scoring Calibration** | Are threats scored using an explicit, documented risk-scoring model (e.g. a simplified `Likelihood × Impact` rating), with the model's provenance stated rather than presented as a standard's requirement? | GRC risk assessment reports &amp; prioritized mitigation backlogs. |
| **Backlog Control Integration** | Are threat mitigations converted into tracked backlog tickets rather than isolated report PDFs? | Jira/GitHub issue tracking linking threat IDs to code pull requests. |
| **Continuous Re-Assessment** | Is threat modeling automatically re-triggered when major architectural or API changes occur? | CI/CD pipeline triggers &amp; quarterly threat model review sign-offs. |
| **Empirical Verification** | Are selected mitigations verified through automated testing before closing a threat ticket? | Automated security unit tests, SAST/DAST pipeline results, and peer code reviews. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Design-time threat modeling evaluates architecture before deployment. STRIDE categorizes threats against DFD components (with processes subject to all 6 categories), PASTA aligns security with 7 business-risk stages, and OWASP's 4 questions provide a continuous meta-process for DevSecOps sprints. The model is a hypothesis about the design as drawn — it goes stale on refactor and proves nothing about the running system.</p>
</div>

## Primary references

- **OWASP Threat Modeling Project**: *Universal 4-Question Threat Modeling Framework* — [OWASP Threat Modeling](https://owasp.org/www-project-threat-modeling/)
- **Microsoft Threat Modeling**: *Shostack, A. (2014). Threat Modeling: Designing for Security* — [Adam Shostack Official](https://shostack.org/books/threat-modeling-book) — source for the STRIDE-per-element applicability matrix.
- **PASTA Framework**: *UcedaVelez, T., &amp; Morana, M. M. (2015). Risk Centric Threat Modeling: Process for Attack Simulation and Threat Analysis.* Wiley. ISBN 978-0-470-50096-5 — source for the 7-stage sequence.
- **OCTAVE Allegro (CMU/SEI-2007-TR-012)**: *Introducing OCTAVE Allegro: Improving the Information Security Risk Assessment Process* — [CMU SEI](https://www.sei.cmu.edu/library/introducing-octave-allegro-improving-the-information-security-risk-assessment-process/)
- **NIST SP 800-92**: *Guide to Computer Security Log Management* — [NIST CSRC](https://csrc.nist.gov/pubs/sp/800/92/final)
