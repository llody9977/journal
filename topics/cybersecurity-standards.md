---
title: "Cybersecurity Standards & Frameworks"
description: Comprehensive comparative guide to NIST CSF 2.0, NIST SP 800-53, ISO 27001/27002, OWASP ASVS/SAMM, CIS Controls, CISA CPGs, and SOC 2 audits.
permalink: /topics/cybersecurity-standards/
last_verified: 2026-08-06
---

<span class="eyebrow">Governance, Risk & Compliance / Deep Dive</span>

# Cybersecurity Standards & Frameworks

<p class="lede">Cybersecurity standards, frameworks, and audit reports serve distinct operational purposes. Selecting the appropriate model requires evaluating whether an organization needs a high-level organizing vocabulary (NIST CSF 2.0), a certifiable management system (ISO/IEC 27001), a prioritized safeguard list (CIS Controls), a detailed control catalog (NIST SP 800-53), or third-party audit evidence (SOC 2 Type II).</p>

## The Cybersecurity Standards & Framework Matrix

| Standard / Framework | Type | Primary Purpose | Target Audience | Certification Status |
|---|---|---|---|---|
| **NIST CSF 2.0** | Voluntary Framework | Organizing vocabulary & outcome mapping across 6 Functions (Govern, Identify, Protect, Detect, Respond, Recover) | Enterprise leadership & security architects | Self-assessed (No formal certification) |
| **NIST SP 800-53 Rev. 5** | Control Catalog | Exhaustive catalog of ~1,000 security & privacy controls | Federal agencies, FISMA contractors, high-assurance enterprises | Mandatory for US federal systems |
| **ISO/IEC 27001:2022** | Management Standard | Requirements for an Information Security Management System (ISMS) | Global enterprises requiring verifiable B2B security posture | Certified by accredited 3rd-party auditors |
| **ISO/IEC 27002:2022** | Implementation Guide | Detailed implementation guidance for ISO 27001 Annex A controls | Security engineers implementing ISO 27001 | Companion guidance (Non-certifiable) |
| **CIS Controls v8.1** | Prioritized Safeguard List | 153 concrete safeguards grouped into 18 Controls and 3 Implementation Groups (IG1, IG2, IG3) | Resource-constrained security teams needing prioritized actions | Self-assessed / Audit baseline |
| **CISA CPGs** | Critical Baseline Goals | Minimum high-impact practices for critical infrastructure operators | Critical infrastructure, SMBs establishing a security floor | Voluntary baseline guidance |
| **OWASP Top 10** | Awareness Document | Consensus list of critical web application security risks | Web developers, application security engineers | Educational awareness floor |
| **OWASP ASVS 4.0** | Verification Standard | Testable application security requirements across 3 levels (L1, L2, L3) | AppSec engineers, penetration testers, QA auditors | Verifiable software standard |
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
