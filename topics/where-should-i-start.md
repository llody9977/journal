---
title: Where Should I Start?
description: Practical architectural roadmap for security engineering, choosing implementation pathways (system threat modeling vs enterprise ISMS governance), and selecting standards.
permalink: /topics/where-should-i-start/
last_verified: 2026-08-07
---

<span class="eyebrow">Security / Starting Map</span>

# Where Should I Start?

<p class="lede">Security engineering requires translating threat concepts and domain boundaries into operational execution. Establishing a security program involves selecting an entry point aligned with enterprise governance requirements or system engineering responsibilities.</p>

## Security Program Implementation Architecture

Security engineering operates across a 3-tier vertical hierarchy (**SECURITY PROGRAM → GOVERN → TECHNICAL**) connected by dual-directional operational feedback loops:

<div class="diagram-frame">
  <img src="{{ '/assets/img/security-program-implementation-roadmap.svg' | relative_url }}" alt="Security Program Implementation Architecture diagram showing SECURITY PROGRAM translating into GOVERNANCE (GOVERN) and TECHNICAL SAFEGUARDS (TECHNICAL) with Top-Down and Bottom-Up operational feedback arrows.">
  <p class="diagram-caption">Security Program Implementation Architecture: SECURITY PROGRAM strategy leading to GOVERNANCE (GOVERN) and TECHNICAL SAFEGUARDS (TECHNICAL) connected by Top-Down Policy Mandates (↓) and Bottom-Up Telemetry Proof (↑)</p>
</div>

## Two Operational Entry Pathways

Engineering teams select the entry point that matches their operational responsibility:

### Pathway A: Technical Entry (System Architecture & Software Engineering)

When evaluating a specific application, cloud infrastructure workload, or API service, system engineering teams apply structured threat modeling and technical control selection:

1. **Map Architecture & Boundaries**: Document data flow diagrams, system entry points, external dependencies, and trust transitions (**[Trust Boundaries & Threat Modeling]({{ '/topics/trust-boundaries-threat-modeling/' | relative_url }})**).
2. **Identify Threat Scenarios**: Analyze potential threat vectors, abuse cases, injection flaws, and authorization bypasses using a threat modeling methodology tailored to project trade-offs (*e.g., STRIDE, PASTA, VAST*) (**[Threat Frameworks]({{ '/topics/threat-frameworks/' | relative_url }})**).
3. **Deploy Technical Safeguards**: Implement technical controls—OAuth 2.0 authentication, database encryption, rate limiting, and Web Application Firewall (WAF) rules (**[Security Controls & Defense in Depth]({{ '/topics/security-controls-defense-in-depth/' | relative_url }})**).
4. **Validate Control Enforcement**: Validate implementation efficacy using static application security testing (SAST), dynamic application security testing (DAST), CI/CD pipeline scanning, and automated penetration testing.

### Pathway B: Governance Entry (Enterprise ISMS & Compliance)

When building or auditing an organizational security program, governance teams follow a structured ISMS implementation progression:

1. **Define Scope & Governance**: Establish executive sponsorship, define organizational risk appetite, and map regulatory compliance mandates (**NIST SP 800-39**).
2. **Catalog Assets & Threats**: Inventory critical data repositories, production workloads, key personnel, and third-party vendor dependencies.
3. **Adopt Standard Frameworks**: Implement an industry standard framework (**[NIST CSF 2.0](https://www.nist.gov/cyberframework)** for outcome-driven cybersecurity, **[ISO/IEC 27001](https://www.iso.org/standard/27001)** for certifiable InfoSec governance).
4. **Audit Baseline Controls**: Assess existing safeguards against prioritized baselines such as **[CIS Controls IG1](https://www.cisecurity.org/controls/implementation-groups)**.
5. **Prioritize Remediation**: Prioritize security engineering gaps based on evaluated risk severity (**Risk = Likelihood × Impact**) per **NIST SP 800-30 Rev. 1**.
6. **Deploy & Assure Controls**: Implement administrative and technical controls, configure continuous monitoring (**NIST SP 800-137**), and collect audit compliance evidence.

## Top-Down & Bottom-Up Operational Feedback Loops

The operational connection between **GOVERN** and **TECHNICAL** functions as a continuous bi-directional feedback loop:

### 1. Top-Down Flow: Policy Mandates & Risk Tolerances (↓)

- **Operational Action**: Governance policies, regulatory compliance requirements (ISO 27001, SOC 2, GDPR, Singapore PDPA), and organizational risk appetite established in **GOVERN** are pushed down into **TECHNICAL** execution.
- **System Impact**: Forces technical engineering teams to execute threat modeling, enforce mTLS, configure firewalls, implement encryption at rest, and maintain secure build pipelines (SLSA / SSDF).

### 2. Bottom-Up Flow: Safeguard Telemetry & Audit Evidence (↑)

- **Operational Action**: Automated vulnerability scan metrics, SIEM log telemetry, SAST/DAST results, and penetration test reports generated in **TECHNICAL** flow up to **GOVERN**.
- **Governance Impact**: Provides objective evidence proving control effectiveness to CISOs, executive boards, external auditors, and regulatory compliance authorities.

## Standard Framework & Compliance Selection Guide

No single security catalog exhaustively covers every regional regulation or specialized technical standard worldwide. The following curated selection highlights the most widely adopted foundational frameworks, supply chain standards, statutory mandates, and commercial compliance attestations across security engineering:

### Enterprise Governance & Safeguard Frameworks

| Standard / Framework | Domain Scope | Primary Function | Best Used For |
|---|---|---|---|
| **[CIS Controls v8.1](https://www.cisecurity.org/controls)** | Technical Safeguards | Prioritized technical hygiene checklist | Establishing Implementation Group 1 (IG1) baseline defense against common cyber attacks. |
| **[FedRAMP](https://www.fedramp.gov/)** / **CMMC 2.0** | US Federal & Defense Cloud | Federal & defense cloud authorization | Mandatory security baselines for cloud services (FedRAMP) and defense industrial base contractors (NIST SP 800-171). |
| **[ISO/IEC 27001:2022](https://www.iso.org/standard/27001)** | Information Security | Certifiable ISMS management standard | Building an enterprise security program and proving compliance to external partners and auditors. |
| **[NIST CSF 2.0](https://www.nist.gov/cyberframework)** | Cybersecurity | Outcome-based strategic framework | Organizing security capabilities across six continuous functions: **Govern, Identify, Protect, Detect, Respond, Recover**. |
| **[NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)** | InfoSec & Privacy | Comprehensive control catalog | Selecting granular technical, operational, and managerial safeguards for high-assurance environments. |

### Taxonomy of NIST Special Publications (SPs) & FIPS Standards

Engineering teams often navigate multiple NIST 800-series publications and Federal Information Processing Standards (FIPS). Below is how key NIST and FIPS publications map to specific engineering domains:

| Standard / Publication | Engineering Domain | Primary Scope & Function | Operational Placement |
|---|---|---|---|
| **[NIST FIPS 140-3](https://csrc.nist.gov/pubs/fips/140/3/final)** | Cryptography & Hardware Security | Security requirements for hardware and software cryptographic modules | Validating Hardware Security Modules (HSMs), TPMs, and cryptographic libraries. |
| **[NIST FIPS 199](https://csrc.nist.gov/pubs/fips/199/final)** / **FIPS 200** | Security Categorization | Categorizing system impact (*Low, Moderate, High*) across CIA triad properties | **Risk Assessment & System Categorization**: Defining baseline security requirements based on potential harm severity. |
| **[NIST SP 800-30](https://csrc.nist.gov/pubs/sp/800/30/r1/final)** / **SP 800-37** / **SP 800-39** | Risk Management Lifecycle | Risk Assessment (800-30), Risk Management Framework (800-37), Risk Governance (800-39) | **Universal Risk Engine**: The continuous decision engine connecting threat inputs, risk responses, and control monitoring. |
| **[NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)** | Control Catalog & Safeguards | Catalog of 20 control families (*Access Control, Audit, Cryptography, Incident Response*) | **Enterprise Governance & Control Execution**: The primary baseline catalog for FedRAMP, DoD, and enterprise risk controls. |
| **[NIST SP 800-63-3 / 4](https://csrc.nist.gov/pubs/sp/800/63/3/final)** | Digital Identity & Authentication | Guidelines for Identity (IAL), Authenticator (AAL), and Federation (FAL) assurance | **Identity & Access Management (IAM)**: Standardizing WebAuthn, FIDO2 passkeys, MFA, and OAuth 2.0 / OIDC federation. |
| **[NIST SP 800-160 Vol. 1 & 2](https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final)** | System Security Engineering | Engineering trustworthy systems, OS kernels, and resilient hardware roots of trust | **System Security Engineering**: Building hardware, software, and firmware that function predictably under hostile attack conditions. |

### Application, CI/CD & Supply Chain Standards

| Standard / Framework | Focus Area | Primary Function | Best Used For |
|---|---|---|---|
| **[NIST SP 800-218 (SSDF)](https://csrc.nist.gov/pubs/sp/800/218/final)** & **SLSA v1.0** | Software Supply Chain | Secure development & build provenance | Hardening software supply chains, dependency integrity, and artifact provenance. |
| **[OWASP ASVS 4.0](https://owasp.org/www-project-application-security-verification-standard/)** | Application Security | Testable application requirements | Designing, coding, and auditing secure web applications and API endpoints. |
| **[OWASP CI/CD Top 10](https://owasp.org/www-project-top-10-ci-cd-security-risks/)** | Pipeline Security | CI/CD build hardening | Mitigating build pipeline manipulation, runner compromise, and un-gated deployments. |
| **Threat Modeling** *(STRIDE / PASTA)* | Architecture | Structured threat identification | Evaluating misuse cases and trust transitions tailored to project trade-offs. |

### System Hardening Benchmarks & Vendor Security Baselines

While high-level frameworks (NIST SP 800-53, ISO 27001, CIS Controls) define *what* safeguards are required, technical hardening benchmarks define the exact *configuration settings* needed to secure operating systems, containers, database engines, and cloud platforms:

| Hardening Standard / Baseline | Focus Area | Primary Function | Operational Placement |
|---|---|---|---|
| **[CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks)** | OS, Cloud & Container Hardening | Prescriptive technical configuration checklists (*Linux, Windows, Kubernetes, AWS, GCP, Azure*) | **Technical Safeguards Execution**: Concrete system-level hardening settings (*e.g., SSH daemon configurations, IAM policies, container isolation*). |
| **Cloud Vendor Baselines** *(AWS Well-Architected / Azure Security / GCP Foundations)* | Cloud Infrastructure Architecture | Cloud provider security architecture baselines | **Cloud Infrastructure Architecture**: Best-practice configuration for IAM identity perimeters, VPC Service Controls, and KMS key policies. |
| **[DISA STIGs](https://public.cyber.mil/stigs/)** | Defense & Federal System Hardening | DoD mandatory security technical implementation guides | **High-Assurance Federal Infrastructure**: Mandatory technical configuration baselines for military and defense IT environments. |

### Statutory Regulatory Mandates (REGULATORY)

Mandatory legal laws enacted by legislative bodies that enforce statutory data protection rules and financial/legal penalties:

| Regulatory Law / Mandate | Jurisdiction | Statutory Scope | Primary Legal Focus |
|---|---|---|---|
| **[DOJ ECCP](https://www.justice.gov/criminal-fraud/page/file/937501/dl)** / **Civil Cyber-Fraud** | United States (Federal Prosecutorial) | Corporate Compliance & Cyber Fraud Enforcement | Prosecutorial criteria evaluating corporate compliance program efficacy and penalizing federal contractors concealing security breaches. |
| **[EU DORA](https://www.eiopa.europa.eu/digital-operational-resilience-act-dora_en)** / **NIS 2 Directive** | European Union | Financial & Critical Infrastructure Law | Mandatory digital operational resilience, ICT risk management, and incident reporting for financial institutions and critical infrastructure. |
| **[GDPR](https://gdpr.eu/) / CCPA** | European Union / California | Statutory Data Privacy Law | Mandatory legal rules governing personal data collection, user consent, processing limits, and data subject access rights. |
| **[HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)** | United States (Federal) | Statutory Healthcare Law | Mandatory administrative, physical, and technical safeguards for protecting electronic Protected Health Information (ePHI). |
| **[Singapore PDPA](https://www.pdpc.gov.sg/Overview-of-PDPA/The-American-and-European-Context/Personal-Data-Protection-Act)** | Singapore | Statutory Data Protection Act | Mandatory rules for collecting, processing, storing, and protecting personal data in Singapore (enforced by PDPC). |

### Commercial & Industry Compliance Standards (COMPLIANCE)

Contractual, certifiable, and industry audit frameworks required for enterprise business operations, SaaS sales, and customer trust:

| Compliance Standard | Focus & Scope | Audit / Attestation Mechanism | Primary Business Purpose |
|---|---|---|---|
| **[ISO/IEC 27001:2022](https://www.iso.org/standard/27001)** | Enterprise Information Security | Accredited Third-Party Certification | Certifiable Information Security Management System (ISMS) proving enterprise security governance to partners. |
| **[ISO/IEC 27701](https://www.iso.org/standard/71670.html)** & **NIST Privacy** | Privacy Management Systems | ISMS Privacy Extension | Operationalizing data minimization, PII governance, and privacy risk management. |
| **[PCI-DSS v4.0](https://www.pcisecuritystandards.org/)** | Payment Card Security | Annual QSA Audit / Report on Compliance | Contractual technical requirements for processing, storing, or transmitting credit card data. |
| **[SOC 2 Type II (AICPA)](https://www.aicpa-cima.com/resources/landing/aicpa-soc-for-service-organizations)** | B2B SaaS & Cloud Security | Independent CPA Audit Attestation | Proving operational control effectiveness (*Security, Availability, Confidentiality*) to enterprise customers. |
