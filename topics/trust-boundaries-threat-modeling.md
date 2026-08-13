---
title: Trust Boundaries & Threat Modeling
description: Technical framework for Data Flow Diagrams (DFDs), trust boundary identification, attack surface mapping, threat modeling methodologies (STRIDE, PASTA, VAST, OCTAVE, OWASP 4-Question), and a practical 4-stage execution workflow.
permalink: /topics/trust-boundaries-threat-modeling/
last_verified: 2026-08-13
---

<span class="eyebrow">Security Foundations / Concepts</span>

# Trust Boundaries & Threat Modeling

<p class="lede">Threat modeling is the structured engineering discipline of decomposing a system architecture to identify assets, data flows, trust boundaries, and plausible failure and attack scenarios. It is most valuable early, before a design ships, but OWASP treats it as a living artifact that should be revisited after significant architectural changes, new features, or incidents—not a one-time pre-deployment gate. Scenarios worth modeling extend beyond deliberate adversarial action to misuse, human error, system or dependency failure, environmental events, and unsafe component interactions. By systematically evaluating how trust transitions can be exploited or can fail, engineering teams select targeted safeguards and validate control efficacy on an ongoing basis.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/trust-boundaries-threat-modeling.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the trust boundaries and threat modeling diagram at full size">
    <img src="{{ '/assets/img/trust-boundaries-threat-modeling.svg' | relative_url }}" alt="Data Flow Diagram showing an untrusted public client, a DMZ and application-processing zone, a high-assurance payroll-data enclave, and an external third-party bank API. Data crosses Trust Boundary 1 at public ingress, Trust Boundary 2 when the payroll service accesses the database, and Trust Boundary 3 when the service calls the external bank API.">
  </a>
  <p class="diagram-caption">Trust Boundaries &amp; Threat Modeling DFD Architecture: Public client → API gateway → payroll service → protected payroll database, with a separate outbound flow to an external bank API across Trust Boundary 3. The diagram distinguishes the public zone, application zone, data enclave, and third-party trust domain.</p>
</div>

## The System Architecture & Trust Component Model

Evaluating a system requires mapping eight architectural elements relevant to threat modeling. A classic Data Flow Diagram (DFD) natively models four element types—**External Entities, Processes, Data Stores,** and **Data Flows**; the remaining four (*Attack Surface, Third-Party Dependencies, Trust Boundaries, Trust Domains*) are broader threat-modeling concepts commonly layered on top of a DFD rather than native DFD notation:

| Threat Modeling Element | Architectural Function | Security Boundary Role | Target Engineering Safeguard |
|---|---|---|---|
| **Attack Surface** | Sum total of reachable network ports, API endpoints, file uploaders, identities and credentials, administrative interfaces, outbound/egress flows, local or physical interfaces, and third-party dependencies. | Total exposure area available to adversaries and, for some elements (e.g., admin interfaces, dependency supply chains), to misuse or accidental exposure as well. | Port minimization, WAF rate limiting, ingress IP filtering, admin-interface network isolation &amp; dependency/SBOM scanning. |
| **Data Flows** | Network requests, IPC channels, gRPC streams, message queues. | Transport pathways moving data between components. | Mutual TLS (mTLS) encryption, HMAC payload tags &amp; DPoP binding. |
| **Data Stores** | Relational databases, NoSQL clusters, cache stores, object storage. | Passive repositories holding sensitive enterprise or customer data. | AES-256-GCM encryption at rest &amp; KMS IAM policies for general confidential columns; one-way hashing (e.g., Argon2id) is appropriate specifically for values like passwords or verification tokens that must be checked but never recovered, not a general-purpose confidentiality control for other sensitive columns. |
| **External Entities** | End users, web browsers, mobile apps, third-party webhooks—any actor that sends or receives data but sits outside the boundary of the *system being modeled*, not necessarily outside the organization (an internal team's own upstream service, called from this system's DFD, is still an "external entity" on this diagram). | Origin of inputs that must be validated at the boundary; not every external entity is adversarial—some are trusted internal callers modeled as external simply because they're outside this DFD's scope. | WebAuthn passkeys, FIDO2 MFA, schema/type/range validation &amp; TLS 1.3. |
| **Processes &amp; Processing Nodes** | Web servers, microservices, background workers, serverless functions. | Execution points that transform data and evaluate policies. | Least-privilege execution, container sandboxing &amp; SAST/DAST audits. |
| **Third-Party Dependencies** | Cloud IdPs, managed DBs, external SaaS APIs, open-source libraries. | Exogenous risk vectors outside direct code control. | Dependency scanning, SLSA v1.2 build provenance &amp; SSDF audits. |
| **Trust Boundaries** | Transitions where data or control passes between trust levels. | Enforcement points requiring explicit verification. | API Gateway Policy Enforcement Points (PEPs) &amp; mTLS sidecars. |
| **Trust Domains** | Perimeters sharing uniform security policies and administrative control. | Compartmentalized security zones that constrain lateral movement when segmentation is correctly designed and enforced—not an automatic guarantee. | Subnet microsegmentation, Kubernetes network policies &amp; IAM roles. |

## Attack Surface vs Trust Boundary vs Trust Domain

To avoid architectural flaws, security engineering distinguishes between three distinct perimeter concepts:

| Architectural Concept | Structural Definition & Scope | Primary Security Focus | Engineering Validation Mechanism |
|---|---|---|---|
| **Attack Surface** | The aggregate set of reachable endpoints, open ports, public APIs, user inputs, identities and credentials, administrative interfaces, outbound flows, local/physical interfaces, and dependencies where an adversary can attempt entry or a failure can propagate. | Minimizing total attack surface area across network, identity, and supply-chain vectors—not network reachability alone. | External vulnerability scanning, port audits, attack surface management (ASM) &amp; software supply-chain (SBOM) review. |
| **Trust Boundary** | An explicit architectural line where data or execution control transitions between different privilege levels or administrative perimeters. | Enforcing non-implicit verification on incoming payloads. | API Gateway input validation, mTLS certificate verification &amp; OAuth token inspection (per current finalized OAuth 2.0 RFCs; **OAuth 2.1** remains an active IETF Internet-Draft, not yet a finalized RFC, as of this writing). |
| **Trust Domain** | A logical or physical security zone within which all components share uniform administrative trust and policy governance. | Constraining blast radius and lateral movement when enforcement is correctly designed—segmentation reduces, not eliminates, cross-zone movement. | Subnet VPC microsegmentation, Zero Trust network policies &amp; IAM boundary policies. |

## Threat Modeling Methodologies Comparison Matrix

Engineering teams select threat modeling frameworks based on system complexity, development cadence, and risk governance requirements:

| Threat Modeling Framework | Focus Area &amp; Philosophy | Core Execution Mechanism | Primary Engineering Applicability |
|---|---|---|---|
| **[OCTAVE (Carnegie Mellon SEI)](https://resources.sei.cmu.edu/library/asset-view.cfm?assetid=13473)** | Primarily an organizational risk-assessment approach—evaluating operational risk across assets, people, and processes—rather than a system-level threat-modeling method like STRIDE; it operates at a different altitude than the DFD/component-level methods in this table. | Self-directed workshops identifying operational assets, organizational threats, and defense posture. | Enterprise-wide risk audits and organizational asset governance, typically paired with a system-level method (e.g., STRIDE) for individual architectures. |
| **[OWASP 4-Question Framework](https://owasp.org/www-project-threat-modeling/)** | Broadly applicable meta-process for driving continuous threat modeling iterations across any architecture. | Iterates: 1. *What are we working on?* 2. *What can go wrong?* 3. *What are we doing about it?* 4. *Did we do a good job?* | Agile software engineering, sprint-level threat modeling, and team design reviews. |
| **[PASTA (Risk-Centric)](https://versprite.com/security-offerings/appsec/pasta-threat-modeling/)** | **Process for Attack Simulation and Threat Analysis**; 7-stage risk-centric framework aligning security with business impact. | Integrates business objectives, asset impact, threat intel, vulnerability analysis, and a risk scoring stage (commonly a simplified `Likelihood × Impact` model). | Enterprise threat modeling, GRC risk alignment, and high-value financial/healthcare architectures. |
| **STRIDE (Microsoft)** | Developer-centric threat taxonomy categorizing 6 threat types (*Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation*). | Maps specific STRIDE categories to each component in a Data Flow Diagram (DFD). | Application security, microservices, API route design, and code-level threat modeling. |
| **[VAST (Agile / Scalable)](https://threatmodeler.com/innovation-lab/vast/)** | **Visual, Agile, and Simple Threat modeling**; divides into Application Threat Models and Operational Threat Models. | Uses automated storyboarding and integration directly into DevOps / CI/CD pipelines. | Fast-paced Agile development teams, automated CI/CD security pipelines, enterprise DevSecOps. |

## A Practical 4-Stage Threat Modeling Workflow

**[OWASP](https://owasp.org/www-project-threat-modeling/)** does not mandate one official threat modeling methodology or pipeline. The following 4-stage workflow is a journal working model that operationalizes the ideas above (DFD decomposition, STRIDE/PASTA-style identification, control selection, and OWASP's own 4-question retrospective) into a repeatable sequence:

| Execution Pipeline Stage | Primary Operational Actions | Governing Methodology | Target Engineering Deliverable |
|---|---|---|---|
| **Stage 1: Architecture Decomposition** | Deconstruct system into Data Flow Diagrams (DFDs), mapping external entities, processes, data stores, and trust boundaries. Static structure diagrams such as the **[C4 model](https://c4model.com/)** describe software components and their relationships and can usefully complement this step, but C4 is not itself a DFD and does not model data flows or trust boundaries. | DFD Modeling (optionally complemented by C4 Model Architecture) | System Data Flow Diagram &amp; Entry Point Inventory. |
| **Stage 2: Threat Identification** | Evaluate misuse, human error, system or dependency failure, environmental events, and adversarial attack vectors against system components—not adversarial threats alone. | STRIDE / PASTA / OWASP Question 2 | Threat Register listing component vulnerabilities &amp; vectors. |
| **Stage 3: Mitigation & Control Selection** | Select and implement appropriate controls or design changes—technical, administrative, physical, or architectural, depending on the threat—that reduce the likelihood or impact of identified high-risk threats; a non-adversarial threat like structural or environmental failure may call for redundancy or process changes rather than a technical control. Controls lower risk, they do not universally neutralize it. | [NIST SP 800-53](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) / OWASP ASVS 5.0.0 | Applied security controls (WAF, mTLS, WebAuthn, AES-256). |
| **Stage 4: Retrospective & Verification** | Validate coverage of scope, assumptions, and scenarios; confirm controls are actually implemented as designed; and record residual risk—automated testing (SAST/DAST) checks implementation but does not by itself confirm scope or assumption completeness. | OWASP Question 4 &amp; [NIST SP 800-137](https://csrc.nist.gov/pubs/sp/800/137/final) | Verification record covering scope/assumption review, automated SAST/DAST regression tests, and threat model sign-off with documented residual risk. |

## What a Complete Threat Model Records, Beyond the Diagram

The DFD and threat register above are the analytical core, but **[OWASP's Threat Modeling project](https://owasp.org/www-project-threat-modeling/)** identifies several accompanying inputs that a diagram alone does not capture—omitting them is a common reason a threat model goes stale or gets misapplied outside the situation it was built for:

| Artifact Component | What It Records | Why Its Absence Causes Problems |
|---|---|---|
| **Scope Statement** | Which systems, components, and data flows are in scope, and which are explicitly excluded (e.g., "excludes the third-party payment processor's internal systems"). | Without an explicit boundary, reviewers cannot tell whether a missing threat was out of scope or simply missed. |
| **Assumptions Log** | Conditions the model treats as given—e.g., "the cloud provider's physical security is assumed adequate," "all internal traffic already runs over mTLS." | An unstated assumption that later becomes false (e.g., mTLS gets disabled for a debugging session) silently invalidates every threat rated against it. |
| **Abuse & Misuse Cases** | Concrete scenarios of intentional misuse and unintentional error—not just the STRIDE category, but a specific narrative (e.g., "a support engineer with legitimate DB access exports the full customer table to a personal laptop"). | STRIDE categories alone describe threat *classes*; without a concrete scenario, reviewers can't judge whether a proposed control actually stops the realistic case. |
| **Owner** | The accountable individual or team responsible for keeping the model current and coordinating its review. | An unowned threat model has no one to trigger a review when the architecture changes, and decays silently. |
| **Review Triggers** | The specific events that require re-evaluation—new external dependency, authentication mechanism change, incident, or a fixed calendar cadence as a backstop. | Without explicit triggers, "revisit after significant change" (as this page's lede recommends) has no enforcement mechanism. |
| **Residual Risk** | What remains unaddressed after the selected mitigations, and the risk owner's decision on it (accept, mitigate further, avoid, share, or transfer)—see **[Threats, Vulnerabilities & Risk]({{ '/topics/risk-fundamentals/' | relative_url }})**. | Without a recorded residual-risk decision, a partially-mitigated threat can be mistaken for a fully-closed one. |

## Essential Threat Modeling Diagnostic Checklist

When evaluating a threat model for a new architecture or system refactor, evaluate these 7 diagnostic questions:

| Diagnostic Focus Area | Key Architectural Evaluation Question | Target Verification &amp; Audit Evidence |
|---|---|---|
| **Data Flow Completeness** | Does the System DFD map all external entities, processes, data stores, data flows, and trust boundaries? | Architecture DFD diagrams, API route manifests &amp; network mesh topology maps. |
| **Mitigation Efficacy** | Are identified high-risk threats paired with appropriate risk treatments (technical, administrative, physical, or operational) and proportionate verification? | Appropriate safeguard implementation records, SAST/DAST scanning scripts, security unit tests, operational procedure sign-offs &amp; PR approval gates. |
| **Reassessment Triggers** | Are there defined triggers—such as major architectural changes, new dependencies, security incidents, or a regular review schedule—to re-evaluate the threat model? | CI/CD pipeline triggers, architecture change logs, quarterly threat model review logs &amp; post-incident review records. |
| **Scope, Assumptions &amp; Residual Risk** | Does the threat model record its own scope, explicit assumptions, an accountable owner, and the residual risk left after selected mitigations—not only the mitigations themselves? | Documented scope statement, assumptions log, named owner &amp; residual-risk sign-off. |
| **STRIDE Coverage** | Has every DFD element type been evaluated against its applicable STRIDE threat categories? | Documented Threat Register listing component, threat vector, risk score &amp; owner. |
| **Third-Party Risk** | Are external cloud APIs, IdP dependencies, and open-source packages integrated into the threat model? | Software Bill of Materials (SBOM), dependency vulnerability reports &amp; SLSA provenance. |
| **Trust Boundary Rigor** | Is every trust boundary crossing evaluated, with explicit input verification and authentication applied where the risk of that crossing warrants it? | API Gateway policy rules, mTLS sidecar configs, schema/type/range validation tests &amp; contextual output-encoding tests. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Threat modeling maps assets, actors, flows, dependencies, trust boundaries, and plausible failure scenarios so controls can target real exposure. Revisit the model after material change or incidents, and record assumptions, ownership, and residual risk.</p>
</div>

## Primary references

- **OWASP Threat Modeling Project**: *Threat Modeling Process, STRIDE Framework, the 4-Question Framework, and the scope/assumptions/dependencies inputs a complete threat model should record* — [OWASP Threat Modeling](https://owasp.org/www-project-threat-modeling/)
- **OWASP ASVS 5.0.0**: *Application Security Verification Standard* — [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- **SLSA v1.2**: *Supply-chain Levels for Software Artifacts* — [SLSA Specification](https://slsa.dev/spec/v1.2/)
- **NIST SP 800-53 Rev. 5**: *Security and Privacy Controls for Information Systems and Organizations* — [NIST CSRC SP 800-53](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
- **IETF OAuth 2.1 Internet-Draft**: *Current draft status (not yet a finalized RFC)* — [OAuth 2.1 Draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1)
