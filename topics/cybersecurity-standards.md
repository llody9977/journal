---
title: "Cybersecurity Standards & Frameworks"
description: Comprehensive comparative guide to NIST CSF 2.0, NIST SP 800-53, ISO 27001/27002, OWASP ASVS/SAMM, CIS Controls, CISA CPGs, and SOC 2 audits.
permalink: /topics/cybersecurity-standards/
last_verified: 2026-08-12
---

<span class="eyebrow">Governance, Risk & Compliance / Deep Dive</span>

# Cybersecurity Standards & Frameworks

<p class="lede">Cybersecurity standards, frameworks, and audit reports serve distinct operational purposes. Selecting the appropriate model requires evaluating whether an organization needs a high-level organizing vocabulary (NIST CSF 2.0), a certifiable management system (ISO/IEC 27001), a prioritized safeguard list (CIS Controls), a detailed control catalog (NIST SP 800-53), or third-party audit evidence (SOC 2 Type II).</p>

## The Cybersecurity Standards & Framework Matrix

| Standard / Framework | Type | Primary Purpose | Target Audience | Certification Status |
|---|---|---|---|---|
| **NIST CSF 2.0** | Voluntary Framework | Organizing vocabulary & outcome mapping across 6 Functions (Govern, Identify, Protect, Detect, Respond, Recover) | Enterprise leadership & security architects | Self-assessed (No formal certification) |
| **[NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)** | Control Catalog | Exhaustive catalog of ~1,000 security & privacy controls | Federal agencies, FISMA contractors, high-assurance enterprises | The catalog itself is not self-executing; FIPS 200 makes baseline selection from it mandatory for federal information systems (excluding national security systems). Voluntarily adopted elsewhere as a control reference. |
| **ISO/IEC 27001:2022** | Management Standard | Requirements for an Information Security Management System (ISMS) | Global enterprises requiring verifiable B2B security posture | Certified by accredited 3rd-party auditors |
| **ISO/IEC 27002:2022** | Implementation Guide | Detailed implementation guidance for ISO 27001 Annex A controls | Security engineers implementing ISO 27001 | Companion guidance (Non-certifiable) |
| **CIS Controls v8.1** | Prioritized Safeguard List | 153 concrete safeguards grouped into 18 Controls and 3 Implementation Groups (IG1, IG2, IG3) | Resource-constrained security teams needing prioritized actions | Self-assessed / Audit baseline |
| **CISA CPGs** | Critical Baseline Goals | Minimum high-impact practices for critical infrastructure operators | Critical infrastructure, SMBs establishing a security floor | Voluntary baseline guidance |
| **FedRAMP** | US Federal Cloud Authorization | Authorization framework for cloud service offerings sold to federal agencies, built on NIST SP 800-53 controls | Cloud service providers selling to US federal agencies | Mandatory for in-scope cloud services sold to federal agencies |
| **CMMC** | Defense Industrial Base Contractor Assessment | Assesses defense industrial base (DIB) contractors' own cybersecurity practices (built on NIST SP 800-171) as a condition of DoD contract eligibility—a contractor assessment program, not a cloud-service authorization scheme like FedRAMP | Defense industrial base contractors bidding on or holding DoD contracts | Phased rollout tied to DoD contract requirements; verify current program status against the [official DoD CMMC page](https://dodcio.defense.gov/CMMC/About/) |
| **OWASP Top 10** | Awareness Document | Consensus list of critical web application security risks | Web developers, application security engineers | Educational awareness floor |
| **OWASP ASVS 5.0.0** | Verification Standard | Testable application security requirements across 3 levels (L1, L2, L3) | AppSec engineers, penetration testers, QA auditors | Verifiable software standard |
| **OWASP SAMM v2** | Maturity Model | Assesses and matures software security practices across 5 business functions | Software engineering leadership | Organizational assessment framework |
| **SOC 2 (Type I / Type II)** | Audit Attestation | Independent CPA audit report based on AICPA Trust Services Criteria | B2B SaaS vendors proving control operation to enterprise buyers | Independent CPA Audit Attestation Report |

## NIST CSF 2.0: Strategic Organizing Framework

Restructured in 2024, **[NIST CSF 2.0](https://www.nist.gov/cyberframework)** organizes cybersecurity outcomes across six core Functions:

<div class="diagram-frame">
  <img src="{{ '/assets/img/nist-csf-functions.svg' | relative_url }}" alt="NIST Cybersecurity Framework 2.0 functions with Govern informing Identify, Protect, Detect, Respond, and Recover.">
  <p class="diagram-caption">Govern is cross-cutting; the other functions continuously exchange feedback</p>
</div>

1. **Govern**: Establishes cybersecurity strategy, governance, risk tolerance, and policy oversight.
2. **Identify**: Maps physical assets, systems, data, supply chain dependencies, and risk assessments.
3. **Protect**: Implements identity controls, access management, awareness training, and platform security.
4. **Detect**: Deploys continuous monitoring, SIEM detection rules, and anomaly detection.
5. **Respond**: Executes incident containment, communication, and mitigation playbooks.
6. **Recover**: Restores operational assets and services following security events.

NIST CSF 2.0 defines outcomes rather than prescriptive technical implementations, serving as an organizing umbrella mapped to candidate control catalogs like NIST SP 800-53 or CIS Controls.

## ISO/IEC 27001:2022 vs ISO/IEC 27002:2022

ISO 27001 and ISO 27002 operate as a certifiable pair:

- **ISO/IEC 27001:2022**: Defines requirements for establishing, operating, and continually improving an **Information Security Management System (ISMS)**. Organizations undergo a two-stage audit by an accredited Registrar to obtain a formal 3-year certificate. ISO 27001 requires publishing a **Statement of Applicability (SoA)** selecting or excluding Annex A controls.
- **ISO/IEC 27002:2022**: Provides implementation guidance for the 93 controls listed in Annex A across four themes: **Organizational**, **People**, **Physical**, and **Technological**.

<div class="diagram-frame">
  <img src="{{ '/assets/img/iso-27001-27002-relationship.svg' | relative_url }}" alt="Comparison of ISO IEC 27001 management-system requirements and ISO IEC 27002 control guidance.">
  <p class="diagram-caption">ISO 27001 defines certifiable requirements; ISO 27002 explains the controls</p>
</div>

## The OWASP AppSec Suite: Top 10, ASVS & SAMM

Application security engineering relies on three distinct OWASP frameworks:

<div class="diagram-frame">
  <img src="{{ '/assets/img/owasp-guides-compared.svg' | relative_url }}" alt="Comparison of OWASP Top 10 for awareness, ASVS for verifiable requirements, and SAMM for software assurance maturity.">
  <p class="diagram-caption">Choose the OWASP resource that matches the question</p>
</div>

- **OWASP Top 10**: High-level risk categories (e.g., A01 Broken Access Control) designed for developer awareness.
- **OWASP ASVS**: Concrete, testable verification requirements at three levels:
  - **Level 1 (Opportunistic)**: Outer perimeter verification defendable against automated attacks.
  - **Level 2 (Standard)**: Recommended baseline for applications handling sensitive business data.
  - **Level 3 (High Assurance)**: Strict verification for critical financial, medical, or government software.
- **OWASP SAMM**: Matures an organization's software delivery pipeline across 15 security practices.

## CIS Controls v8.1: Prioritized Implementation

For organizations seeking a direct, prioritized roadmap, **[CIS Controls v8.1](https://www.cisecurity.org/controls/v8)** organizes 153 Safeguards into three **Implementation Groups (IGs)**:

- **Implementation Group 1 (IG1)**: Essential cyber hygiene baseline (56 safeguards) achievable by resource-constrained organizations.
- **Implementation Group 2 (IG2)**: Intermediate baseline (74 additional safeguards) for enterprises managing moderate operational complexity.
- **Implementation Group 3 (IG3)**: High-assurance baseline (23 additional safeguards) protecting critical assets against targeted attacks.

## SOC 2: Independent Third-Party Audit Attestation

**SOC 2** is an independent CPA audit report governed by the AICPA **Trust Services Criteria**:

1. **Security** (Mandatory baseline criterion for all SOC 2 reports)
2. **Availability** (Optional)
3. **Confidentiality** (Optional)
4. **Processing Integrity** (Optional)
5. **Privacy** (Optional)

### Type I vs Type II Reports

- **SOC 2 Type I**: Evaluates whether control *design* is appropriately configured as of a single point in time.
- **SOC 2 Type II**: Evaluates whether controls operated *effectively over a continuous observation period* (typically 6 to 12 months).

Enterprise B2B SaaS buyers require SOC 2 Type II reports to verify vendor security compliance contractually.

## Taxonomy of NIST Special Publications (SPs) &amp; FIPS Standards

Engineering teams often navigate multiple NIST 800-series publications and Federal Information Processing Standards (FIPS). Below is how key NIST and FIPS publications map to specific engineering domains:

| Standard / Publication | Engineering Domain | Primary Scope &amp; Function | Operational Placement |
|---|---|---|---|
| **[NIST FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final)** | Cryptography &amp; Hardware Security | Security requirements for hardware and software cryptographic modules | Validating Hardware Security Modules (HSMs), TPMs, and cryptographic libraries. |
| **[NIST FIPS 199](https://csrc.nist.gov/pubs/fips/199/final)** / **FIPS 200** | Security Categorization | Categorizing system impact (*Low, Moderate, High*) across CIA triad properties | **Risk Assessment &amp; System Categorization**: Defining baseline security requirements based on potential harm severity. |
| **[NIST SP 800-30](https://csrc.nist.gov/pubs/sp/800/30/r1/final)** / **SP 800-37** / **SP 800-39** | Risk Management Lifecycle | Risk Assessment (800-30), Risk Management Framework (800-37), Risk Governance (800-39) | **Risk Engine**: The continuous decision process connecting threat inputs, risk responses, and control monitoring. |
| **[NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)** | Control Catalog &amp; Safeguards | Catalog of 20 control families (*Access Control, Audit, Cryptography, Incident Response*) | **Enterprise Governance &amp; Control Execution**: The primary baseline catalog for FedRAMP, DoD, and enterprise risk controls. |
| **[NIST SP 800-63-4](https://pages.nist.gov/800-63-4/)** | Digital Identity &amp; Authentication | Guidelines for Identity (IAL), Authenticator (AAL), and Federation (FAL) assurance | **Identity &amp; Access Management (IAM)**: See **[Digital Identity Assurance Levels]({{ '/topics/digital-identity-assurance-levels/' | relative_url }})**. |
| **[NIST SP 800-160 Vol. 1 &amp; 2](https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final)** | System Security Engineering | Engineering trustworthy systems, OS kernels, and resilient hardware roots of trust | **System Security Engineering**: Building hardware, software, and firmware that function predictably under hostile attack conditions. |

## Application, CI/CD &amp; Supply Chain Standards

| Standard / Framework | Focus Area | Primary Function | Best Used For |
|---|---|---|---|
| **[NIST SP 800-218 (SSDF)](https://csrc.nist.gov/pubs/sp/800/218/final)** &amp; **[SLSA v1.2](https://slsa.dev/spec/v1.2/)** | Software Supply Chain | Secure development &amp; build provenance | Hardening software supply chains, dependency integrity, and artifact provenance—see **[Software Supply Chain Security]({{ '/topics/software-supply-chain-security/' | relative_url }})** for the deep dive. |
| **OWASP ASVS 5.0.0** | Application Security | Testable application requirements | Designing, coding, and auditing secure web applications and API endpoints. |
| **[OWASP CI/CD Top 10](https://owasp.org/www-project-top-10-ci-cd-security-risks/)** | Pipeline Security | CI/CD build hardening | Mitigating build pipeline manipulation, runner compromise, and un-gated deployments. |
| **Threat Modeling** *(STRIDE / PASTA)* | Architecture | Structured threat identification | Evaluating misuse cases and trust transitions tailored to project trade-offs—see **[Trust Boundaries &amp; Threat Modeling]({{ '/topics/trust-boundaries-threat-modeling/' | relative_url }})**. |

## System Hardening Benchmarks &amp; Vendor Security Baselines

While the high-level frameworks above define *what* safeguards are required, technical hardening benchmarks define the exact *configuration settings* needed to secure operating systems, containers, database engines, and cloud platforms:

| Hardening Standard / Baseline | Focus Area | Primary Function | Operational Placement |
|---|---|---|---|
| **[CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks)** | OS, Cloud &amp; Container Hardening | Prescriptive technical configuration checklists (*Linux, Windows, Kubernetes, AWS, GCP, Azure*) | **Technical Safeguards Execution**: Concrete system-level hardening settings (*e.g., SSH daemon configurations, IAM policies, container isolation*). |
| **Cloud Vendor Baselines** *(AWS Well-Architected / Azure Security / GCP Foundations)* | Cloud Infrastructure Architecture | Cloud provider security architecture baselines | **Cloud Infrastructure Architecture**: Best-practice configuration for IAM identity perimeters, VPC Service Controls, and KMS key policies. |
| **[DISA STIGs](https://public.cyber.mil/stigs/)** | Defense &amp; Federal System Hardening | DoD mandatory security technical implementation guides | **High-Assurance Federal Infrastructure**: Mandatory technical configuration baselines for military and defense IT environments. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>ISO 27001 defines a management system, NIST SP 800-53 provides a technical control catalog, and hardening baselines like CIS Benchmarks give prescriptive per-system configuration — these operate at different altitudes and aren't interchangeable substitutes. Mapping controls to a unified framework and automating evidence collection is what makes satisfying multiple overlapping regimes tractable.</p>
</div>

## Primary references

- **NIST SP 800-53 Rev. 5**: *Security Controls for Information Systems* — [NIST CSRC SP 800-53](https://csrc.nist.gov/pubs/sp/800/53/r5/final)
- **ISO/IEC 27001:2022**: *Information security management systems requirements* — [ISO 27001 Standard](https://www.iso.org/standard/27001)
