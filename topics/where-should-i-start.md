---
title: Where Should I Start?
description: Practical architectural roadmap for security engineering—choosing implementation pathways, establishing mission context and standards, and connecting governance and technical controls to ongoing detection, response, recovery, and learning.
permalink: /topics/where-should-i-start/
last_verified: 2026-08-15
---

<span class="eyebrow">Security / Starting Map</span>

# Where Should I Start?

<p class="lede">Security engineering requires translating threat concepts and domain boundaries into operational execution. Establishing a security program involves selecting an entry point aligned with enterprise governance requirements or system engineering responsibilities.</p>

## Security Program Implementation Architecture

The following is a practical organizing model—not a formally standardized hierarchy—for how a security program's strategy connects governance (**GOVERN**) and technical execution (**TECHNICAL**) through dual-directional feedback, then carries both into ongoing operation, incident response, recovery, and learning:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/security-program-implementation-roadmap.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the security program implementation architecture diagram at full size">
    <img src="{{ '/assets/img/security-program-implementation-roadmap.svg' | relative_url }}" alt="Security Program Implementation Architecture diagram showing SECURITY PROGRAM translating into GOVERNANCE and TECHNICAL SAFEGUARDS through top-down and bottom-up feedback, then into an OPERATE, RESPOND, RECOVER, AND LEARN layer that returns incident, exercise, and recovery evidence to governance and engineering decisions.">
  </a>
  <p class="diagram-caption">Journal working model: SECURITY PROGRAM strategy → GOVERNANCE ↔ TECHNICAL SAFEGUARDS → OPERATE, RESPOND, RECOVER &amp; LEARN, with policy flowing down and telemetry, incident findings, exercise results, and recovery evidence feeding decisions back up.</p>
</div>

## Two Operational Entry Pathways

Engineering teams select the entry point that matches their operational responsibility:

### Pathway A: Technical Entry (System Architecture & Software Engineering)

When evaluating a specific application, cloud infrastructure workload, or API service, system engineering teams apply structured threat modeling and technical control selection:

1. **Map Architecture & Boundaries**: Document data flow diagrams, system entry points, external dependencies, and trust transitions (**[Trust Boundaries & Threat Modeling]({{ '/topics/trust-boundaries-threat-modeling/' | relative_url }})**).
2. **Identify Threat Scenarios**: Analyze potential threat vectors, abuse cases, injection flaws, and authorization bypasses using a threat modeling methodology tailored to project trade-offs (*e.g., STRIDE, PASTA, VAST*) (**[Design-Time Threat Modeling]({{ '/topics/threat-modeling-design/' | relative_url }})**).
3. **Deploy Technical Safeguards**: Implement technical controls—OpenID Connect (OIDC) authentication and OAuth 2.0 delegated authorization, database encryption, rate limiting, and Web Application Firewall (WAF) rules (**[Security Controls & Defense in Depth]({{ '/topics/security-controls-defense-in-depth/' | relative_url }})**).
4. **Validate Control Enforcement**: Validate implementation efficacy using static application security testing (SAST), dynamic application security testing (DAST), automated CI/CD pipeline security scanning, and periodic manual penetration testing (manual pentesting is not itself an automatable activity).
5. **Prepare to Operate, Respond & Recover**: Define monitored incident criteria, response roles and playbooks, service recovery objectives, continuity workarounds, and tested restore and failback procedures before production operation (**[Monitoring, Incident Response & Operational Learning]({{ '/topics/incident-response-operational-learning/' | relative_url }})** / **[Operational Resilience, Business Continuity & Disaster Recovery]({{ '/topics/operational-resilience-business-continuity-disaster-recovery/' | relative_url }})**).

### Pathway B: Governance Entry (Enterprise ISMS & Compliance)

When building or auditing an organizational security program, governance teams follow a structured ISMS implementation progression:

1. **Define Scope & Governance**: Establish executive sponsorship, define organizational risk appetite, and map regulatory compliance mandates (**NIST SP 800-39**).
2. **Catalog Assets & Threats**: Inventory critical data repositories, production workloads, key personnel, and third-party vendor dependencies.
3. **Adopt Standard Frameworks**: Implement an industry standard framework (**[NIST CSF 2.0](https://www.nist.gov/cyberframework)** for outcome-driven cybersecurity, **[ISO/IEC 27001](https://www.iso.org/standard/27001)** for certifiable InfoSec governance).
4. **Audit Baseline Controls**: Assess existing safeguards against prioritized baselines such as **[CIS Controls IG1](https://www.cisecurity.org/controls/implementation-groups)**.
5. **Prioritize Remediation**: Prioritize security engineering gaps based on evaluated risk severity (likelihood and impact, per **[NIST SP 800-30 Rev. 1](https://csrc.nist.gov/pubs/sp/800/30/r1/final)**).
6. **Deploy & Assure Controls**: Implement administrative and technical controls, configure continuous monitoring (**[NIST SP 800-137](https://csrc.nist.gov/pubs/sp/800/137/final)**), and collect audit compliance evidence.
7. **Govern Operational Readiness & Learning**: Assign incident, continuity, and recovery authority; approve recovery objectives and notification criteria; require exercises; and route incidents, exercise gaps, and recovery evidence back into risk, control, and architecture decisions.

## Top-Down & Bottom-Up Operational Feedback Loops

The operational connection between **GOVERN** and **TECHNICAL** functions as a continuous bi-directional feedback loop:

### 1. Top-Down Flow: Policy Mandates & Risk Tolerances (↓)

- **Operational Action**: Governance policies, governance standards and assurance requirements (ISO 27001, SOC 2), statutory regulatory obligations (GDPR, Singapore PDPA), and organizational risk appetite established in **GOVERN** are pushed down into **TECHNICAL** execution.
- **System Impact**: Establishes the outcomes and requirements technical teams must meet; teams then translate them into specific controls—commonly threat modeling, mTLS, firewall configuration, encryption at rest, and secure build pipelines (SLSA / SSDF)—though the specific control choice is an engineering decision, not something the policy itself mandates.

### 2. Bottom-Up Flow: Safeguard Telemetry & Audit Evidence (↑)

- **Operational Action**: Automated vulnerability scan metrics, SIEM log telemetry, SAST/DAST results, and penetration test reports generated in **TECHNICAL** flow up to **GOVERN**.
- **Governance Impact**: Provides evidence toward demonstrating control effectiveness to CISOs, executive boards, external auditors, and regulatory compliance authorities—telemetry supports the case for effectiveness, it does not on its own prove it.

## Operation, Response, Recovery & Learning

The two entry pathways converge before a system can be treated as operationally ready. Control deployment and continuous monitoring establish necessary safeguards and visibility, but a complete operating model also defines what happens when those safeguards fail or a non-adversarial disruption occurs:

1. **Detect and declare**: Define monitored signals, adverse-event analysis, incident-declaration criteria, severity levels, and escalation authority.
2. **Respond without losing decision discipline**: Exercise triage, containment, eradication, evidence preservation, communications, and notification decisions under realistic constraints.
3. **Continue and recover critical outcomes**: Establish business-owned Maximum Tolerable Downtime (MTD), Recovery Time Objective (RTO), and Recovery Point Objective (RPO) values; document continuity workarounds; and test restoration, failover, and failback.
4. **Feed evidence back into design and governance**: Incidents, exercises, failed restores, control telemetry, and near misses update threat models, risk estimates, control-effectiveness assessments, priorities, and recovery plans.

This is not a third competing entry pathway. It is the operating loop that both technical and governance pathways must reach. A program that stops at control deployment covers **Protect** but remains incomplete across the **Detect, Respond,** and **Recover** outcomes in **[NIST CSF 2.0](https://www.nist.gov/cyberframework)**.

## Mission Context, Asset Inventory & Data Classification

Both pathways above eventually need the same missing input: what the organization actually does, what it holds, and what happens if that's compromised. Selecting a framework or a control before establishing this context risks over-engineering low-value systems and under-engineering the ones that actually carry the organization's risk.

- **Mission/business context**: What service or product the system supports, who depends on it (customers, other internal systems, regulators), and what legal, contractual, or regulatory obligations already apply to it (e.g., a payments feature carries potential **[PCI DSS](https://www.pcisecuritystandards.org/standards/pci-dss/)** exposure if it stores, processes, or transmits cardholder data—or could otherwise affect the security of the cardholder data environment; **[GDPR Article 3](https://eur-lex.europa.eu/eli/reg/2016/679/oj)** exposure depends on its territorial tests—for example, processing performed in the context of an EU establishment, or a non-EU organization offering goods or services to, or monitoring the behavior of, people in the EU; EU citizenship, an "EU personal data" label, or the data's storage location alone is not the applicability test). This context sets the organization's risk appetite and tolerance for the systems built on top of it—see **[Threats, Vulnerabilities & Risk]({{ '/topics/risk-fundamentals/' | relative_url }})** for how appetite and tolerance are distinguished and applied.
- **Asset inventory**: The concrete things worth protecting—data repositories, production workloads, credentials and keys, key personnel, and third-party/vendor dependencies (Pathway B step 2 above). An asset that isn't inventoried can't be scoped into a threat model, categorized, or assigned an owner.
- **Data classification**: A tiering scheme (commonly Public / Internal / Confidential / Restricted, though organizations vary this) that groups data by the harm its exposure, corruption, or loss would cause. **ISO/IEC 27001:2022** Annex A control 5.12 requires organizations to classify information by confidentiality, integrity, availability, and relevant stakeholder requirements, but does not prescribe this or any other specific tiering scheme or label set; **[FIPS 199](https://csrc.nist.gov/pubs/fips/199/final)** categorizes both federal information types and, by high-water mark across them, whole information systems—a related but distinct federal-specific model, covered in **[Security Objectives & Properties]({{ '/topics/security-objectives-properties/' | relative_url }})**, from classifying individual data records.

Classification is a key input to the rest of the pipeline, not the only one: it informs which systems need FIPS-style impact categorization, while data types, processing activities, jurisdiction, and system scope determine which regulatory obligations actually apply. Which control baseline is proportionate—CIS IG1 vs IG2/IG3, or a FIPS-200-mandated **SP 800-53B** Low/Moderate/High baseline—also depends on factors beyond data sensitivity: organizational size and complexity, available resources, and threat exposure are part of [CIS's own stated criteria for selecting an Implementation Group](https://www.cisecurity.org/controls/implementation-groups). Without classification, though, framework and control selection below has no way to even distinguish a public marketing site from a system holding regulated customer data.

## Framework Selection at a Glance

No single security catalog exhaustively covers every regional regulation or specialized technical standard worldwide. The table below is a starting-point selection, not an exhaustive catalog:

| Reference / Instrument | Type | Domain Scope | Best Used For |
|---|---|---|---|
| **[NIST CSF 2.0](https://www.nist.gov/cyberframework)** | Framework (non-prescriptive) | Cybersecurity | Organizing security capabilities into an executive-level vocabulary across six functions: **Govern, Identify, Protect, Detect, Respond, Recover**. |
| **[NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)** | Control catalog | InfoSec & Privacy Control Catalog | Selecting granular technical, operational, and managerial safeguards for high-assurance or federal environments. |
| **[ISO/IEC 27001:2022](https://www.iso.org/standard/27001)** | Certifiable standard | Information Security | Building a certifiable ISMS and proving governance to external partners and auditors. |
| **[CIS Controls v8.1](https://www.cisecurity.org/controls)** | Control catalog | Prioritized Cyber Defense | A prioritized, resource-tiered safeguard catalog (IG1/IG2/IG3) spanning technical, operational, and administrative controls. |
| **[OWASP ASVS 5.0.0](https://owasp.org/www-project-application-security-verification-standard/)** | Verifiable requirements standard | Application Security | Testable, level-based application security requirements. |
| **[GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj)** / **[Singapore PDPA](https://www.pdpc.gov.sg/overview-of-pdpa/the-legislation/personal-data-protection-act)** | Statutory law | Statutory Data Privacy | Legal obligations, not optional frameworks—applicability is jurisdictional. |

**Decision rule**: start from **NIST CSF 2.0** (or an equivalent outcome framework) to organize *what* to cover, select a control catalog (**NIST SP 800-53**, **CIS Controls**) to decide *which specific safeguards*, and layer in applicable legal, payment-card, and contractual or assurance obligations—for example GDPR, PCI DSS, or a customer-requested SOC 2 report—only where their scope tests are met.

The full catalog of NIST/FIPS publication mappings, application/supply-chain standards, and OS/cloud hardening benchmarks lives in **[Cybersecurity Standards & Frameworks]({{ '/topics/cybersecurity-standards/' | relative_url }})**. Applicable laws and regulations plus private-sector certification, compliance, and attestation mechanisms (GDPR, HIPAA, PDPA, DORA/NIS2, PCI DSS, SOC 2, ISO 27701, and the DOJ's ECCP guidance) live in **[Regulatory Mandates & Private-Sector Assurance]({{ '/topics/regulatory-compliance-mandates/' | relative_url }})**. Framework stacking strategy, governance role separation, and one illustrative implementation sequence — explicitly not a universal maturity model — live in **[GRC Strategy]({{ '/topics/grc-framework-strategy/' | relative_url }})**.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Start a system change with architecture and threat modeling; start an enterprise program with mission context, assets, obligations, ownership, and risk appetite. Both paths must continue past control deployment into exercised detection, response, continuity, recovery, and learning.</p>
</div>

## Primary references

- **NIST Cybersecurity Framework (CSF) 2.0** (NIST CSWP 29) — [NIST CSF 2.0](https://www.nist.gov/cyberframework)
- **NIST SP 800-39**: *Managing Information Security Risk* — [NIST CSRC SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final)
- **NIST SP 800-30 Rev. 1**: *Guide for Conducting Risk Assessments* — [NIST CSRC SP 800-30](https://csrc.nist.gov/pubs/sp/800/30/r1/final)
- **NIST SP 800-137**: *Information Security Continuous Monitoring (ISCM)* — [NIST CSRC SP 800-137](https://csrc.nist.gov/pubs/sp/800/137/final)
- **CIS Controls v8.1** — [CIS Controls](https://www.cisecurity.org/controls)
- **[PCI Data Security Standard](https://www.pcisecuritystandards.org/standards/pci-dss/)** — verified the cardholder-data-environment applicability boundary.
- **[GDPR Article 3](https://eur-lex.europa.eu/eli/reg/2016/679/oj)** — verified the regulation's territorial applicability tests.
