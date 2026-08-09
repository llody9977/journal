---
title: What Is Security?
description: Core security engineering discipline—defining security domains (Security, InfoSec, Cybersecurity), core objectives (CIA triad), and the universal risk management lifecycle.
permalink: /topics/security-fundamentals/
last_verified: 2026-08-07
---

<span class="eyebrow">Security / Overview</span>

# What Is Security?

<p class="lede">Security is the continuous engineering discipline of protecting people, information, services, and valuable assets from unacceptable harm. It is neither a single product nor a static state of zero risk; rather, it is the systematic process of identifying threat scenarios, assessing risk, executing strategic responses via security controls, and governing residual risk.</p>

## Defining Security Domains: Security vs InfoSec vs Cybersecurity

While the term "Security" is used casually as a general heading, technical engineering standards enforce explicit domain boundaries:

| Security Domain | Governing Standard / Law | Primary Scope & Focus |
|---|---|---|
| **Security** (Generic) | **NIST SP 800-37** / **CNSSI 4009** | The universal condition resulting from protective measures ensuring freedom from hostile harm across physical, operational, human, and digital assets. |
| **Information Security** (InfoSec) | **FISMA (44 U.S.C. § 3542)** / **ISO/IEC 27001** | Protecting information and information systems from unauthorized access, use, disclosure, disruption, modification, or destruction to preserve **Confidentiality, Integrity, and Availability (CIA)**. |
| **Cybersecurity** | **NIST CSF 2.0** / **ISO/IEC 27032** | Protecting digital infrastructure, software applications, cloud services, and network data streams connected to cyberspace against cyber threats. |
| **System Security Engineering** | **NIST SP 800-160 Vol. 1** | The engineering discipline of building resilient hardware, kernel, software, and cryptographic architectures that function predictably under hostile conditions. |

<div class="diagram-frame">
  <img src="{{ '/assets/img/security-domains-overlap.svg' | relative_url }}" alt="Security Architecture and Domain Scopes showing Core Security Objectives, Information Security and Cybersecurity Scopes, Universal Risk Management Engine, and Security Controls Execution.">
  <p class="diagram-caption">Security domain architecture: Core CIA Objectives → Information Security & Cybersecurity Scopes → Universal Risk Engine → Technical Controls Execution</p>
</div>

## Core Security Objectives: The CIA Triad & System Properties

Evaluating harm to an asset requires testing it against fundamental security properties defined in **[NIST FIPS 199](https://csrc.nist.gov/pubs/fips/199/final)**:

### 1. The CIA Triad

- **Confidentiality**: Preserves authorized restrictions on information access and disclosure, preventing unauthorized observation (*e.g., encrypting PII at rest via AES-256-GCM*).
- **Integrity**: Guards against improper information modification or destruction, ensuring non-repudiation and authenticity (*e.g., cryptographic signatures on API payloads and database records*).
- **Availability**: Ensures timely and reliable access to and use of information and services (*e.g., redundant load balancers, rate limiting, and auto-scaling failover clusters*).

### 2. Beyond the CIA Triad

Comprehensive security engineering expands beyond the CIA triad to address additional critical properties across systems:

- **Authenticity**: Verifying that a user, process, system, or payload is genuine (**NIST SP 800-63**).
- **Accountability**: Ensuring system actions can be traced unequivocally to an authenticated identity via tamper-evident audit logging (**NIST SP 800-92**).
- **Privacy**: Ensuring data processing respects individual rights and regulatory boundaries (**[NIST Privacy Framework](https://www.nist.gov/privacy-framework)**).
- **Safety**: Ensuring system operational failures do not cause physical injury, environmental damage, or loss of life (**ISO 26262 / NIST SP 800-160**).
- **Resilience**: The capacity of a system to withstand, adapt to, and recover from adverse conditions or attacks (**NIST SP 800-160 Vol. 2**).

## The Universal Engine: Continuous Risk Management

Whether protecting a physical paper archive (**Information Security**) or a cloud-native microservice (**Cybersecurity**), security protection is never arbitrary. Both domains fall back to preserving the core **CIA Triad**, and both rely on the exact same decision engine: **Risk Management ([NIST SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final) / [ISO/IEC 27005](https://www.iso.org/standard/75281.html))**.

Risk Management provides the structural engine connecting abstract security objectives to concrete technical controls across five continuous operational stages:

<div class="diagram-frame">
  <img src="{{ '/assets/img/risk-management-lifecycle.svg' | relative_url }}" alt="The Continuous Risk Management Lifecycle diagram showing Stage 1 Problem Inputs, Stage 2 Risk Assessment, Stage 3 Risk Responses, Stage 4 Security Controls Execution, and Stage 5 Continuous Monitoring Feedback Loop.">
  <p class="diagram-caption">The Continuous Risk Management Lifecycle (NIST SP 800-39 / SP 800-37): Inputs → Assessment → Strategic Response Selection → Controls Execution → Continuous Monitoring Feedback Loop</p>
</div>

### Operational Lifecycle Breakdown

| Lifecycle Stage | Primary Operational Actions & Mechanics | System Scenario Example |
|---|---|---|
| **Stage 1: Inputs**<br>*(Problem Domain)* | Gathers inputs from **Threat Modeling**, **CVSS Vulnerability Scans**, **Threat Intel**, Asset Inventories, and Gap Audits to construct scenario components (*Asset, Threat, Vulnerability, Impact*). | Unauthenticated public API route exposing customer database queries without rate limiting. |
| **Stage 2: Evaluation**<br>*(Risk Assessment)* | Calculates exposure severity (**Risk = Likelihood × Impact**) per **[NIST SP 800-30 Rev. 1](https://csrc.nist.gov/pubs/sp/800/30/r1/final)** by rating threat plausibility and harm consequence. | Rating data exfiltration likelihood as **High** and financial harm as **Critical**. |
| **Stage 3: Strategy**<br>*(Response Selection)* | Selects one of four formal responses per **[NIST SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final)**: **Avoid** (redesign feature), **Reduce** (deploy controls), **Transfer** (insurance/SLAs), or **Accept** (authorize exposure). | Selecting **Reduce (Mitigate)** to deploy technical security controls. |
| **Stage 4: Execution**<br>*(Control Mechanics)* | Implements safeguards per **[NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/final)** across 4 functions: **Preventive** (*mTLS/WAF*), **Detective** (*SIEM*), **Responsive** (*Revocation*), and **Recovery** (*Backups*). | Deploying OAuth 2.0 JWT verification, Web Application Firewall (WAF), and mTLS. |
| **Stage 5: Loop**<br>*(Continuous Audit)* | Continuously monitors control efficacy (**[NIST SP 800-137](https://csrc.nist.gov/pubs/sp/800/137/final)**), tracks new threats, and feeds metrics back into Stage 1 Inputs for re-assessment. | Automated SIEM alerting on brute-force spikes and feeding log metrics into annual audits. |

A vulnerability alone does not constitute a risk. Risk assessment requires determining whether a plausible threat can reach the vulnerability, the magnitude of the resulting impact, and how existing controls alter overall probability. Risk management is never a static, one-time activity—it operates as a continuous feedback loop (**NIST SP 800-37**).

## Essential System Security Diagnostic Checklist

When evaluating the security posture of any new feature or system architecture, audit these 6 diagnostic questions:

| Diagnostic Focus Area | Key Architectural Evaluation Question | Target Verification &amp; Audit Evidence |
|---|---|---|
| **Asset Categorization** | What sensitive data, critical services, or business operations require protection? | Data classification inventories, CMDB registers &amp; asset catalogues. |
| **Control Verification** | Which preventive, detective, responsive, and recovery controls execute the reduction strategy? | Security controls baseline mapping (**NIST SP 800-53 Rev. 5**) &amp; continuous monitoring logs. |
| **Domain Boundary Identification** | Are you managing paper records (InfoSec), digital endpoints (Cybersecurity), or hardware roots of trust? | Scope boundary documents &amp; system security plan (SSP) architecture bounds. |
| **Exposure Assessment** | What is the risk severity based on threat likelihood and consequential impact? | Risk assessment reports (**NIST SP 800-30 Rev. 1**). |
| **Objective Testing** | Which CIA triad properties, safety, or privacy limits would be breached if compromised? | FIPS 199 impact categorization &amp; privacy impact assessments (PIA). |
| **Strategic Response Selection** | Which response strategy—Avoid, Reduce, Transfer, or Accept—is authorized by the risk owner? | Signed executive risk treatment plan (**NIST SP 800-39**). |

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Security Fundamentals Summary</strong>
    <ul>
      <li><strong>Security Objectives</strong>: Core goals are Confidentiality, Integrity, Authenticity, Non-Repudiation, and Availability.</li>
      <li><strong>Risk-Driven Architecture</strong>: Security controls must be selected based on threat modeling and risk assessments, not checkbox compliance.</li>
      <li><strong>Defense in Depth</strong>: Layer controls across physical, network, identity, application, and data layers so no single point of failure exists.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-53 Rev. 5**: *Security and Privacy Controls for Information Systems and Organizations* — [NIST CSRC SP 800-53](https://csrc.nist.gov/pubs/sp/800/53/r5/final)
- **ISO/IEC 27001:2022**: *Information security, cybersecurity and privacy protection — Information security management systems* — [ISO 27001 Overview](https://www.iso.org/standard/27001)
