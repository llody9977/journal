---
title: What Is Security?
description: Core security engineering discipline—defining security domains (Security, InfoSec, Cybersecurity), core objectives (CIA triad), and a journal working model of the risk management lifecycle.
permalink: /topics/security-fundamentals/
last_verified: 2026-08-13
---

<span class="eyebrow">Security / Overview</span>

# What Is Security?

<p class="lede">Security is the continuous engineering discipline of protecting people, information, services, and valuable assets from unacceptable harm. It is neither a single product nor a static state of zero risk; rather, it is the systematic process of identifying threat scenarios, assessing risk, executing strategic responses via security controls, and governing residual risk.</p>

## Defining Security Domains: Security vs InfoSec vs Cybersecurity

While the term "Security" is used casually as a general heading, technical engineering standards provide useful distinctions between these domains, each defined within its own standard's specific scope rather than as one universally enforced boundary:

| Security Domain | Representative Standard / Law | Primary Scope & Focus |
|---|---|---|
| **Security** (Generic) | No single standard defines generic "Security" universally; **[CNSSI 4009](https://csrc.nist.gov/glossary)** and **[NIST SP 800-37](https://csrc.nist.gov/pubs/sp/800/37/r2/final)** (an RMF-specific publication) each use working definitions within their own scope, used here as a practical starting point. | The general condition resulting from protective measures ensuring freedom from hostile harm across physical, operational, human, and digital assets. |
| **Information Security** (InfoSec) | **[FISMA (44 U.S.C. § 3552)](https://uscode.house.gov/view.xhtml?edition=prelim&num=0&req=granuleid%3AUSC-prelim-title44-section3552)** / **ISO/IEC 27001** | Protecting information and information systems from unauthorized access, use, disclosure, disruption, modification, or destruction to preserve **Confidentiality, Integrity, and Availability (CIA)**. |
| **Cybersecurity** | **[NIST CSF 2.0](https://www.nist.gov/cyberframework)** / **[ISO/IEC TS 27100:2020](https://www.iso.org/standard/72434.html)** | Protecting digital infrastructure, software applications, cloud services, and network data streams connected to cyberspace against cyber threats. ISO/IEC 27032:2023 is narrower guidance for Internet security rather than the broad definition used here. |
| **System Security Engineering** | **[NIST SP 800-160 Vol. 1 Rev. 1](https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final)** | The engineering discipline of building trustworthy secure systems across the full system lifecycle—requirements, architecture, hardware, software, and cryptographic design—so they function predictably under hostile conditions. |

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/security-domains-overlap.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the security domains overlap diagram at full size">
    <img src="{{ '/assets/img/security-domains-overlap.svg' | relative_url }}" alt="Journal working model showing a directional relationship rather than nested containment: core security objectives inform overlapping information security, cybersecurity, and system security engineering scopes; risk management selects responses; security controls implement them; and monitoring evidence and residual risk feed reassessment.">
  </a>
  <p class="diagram-caption">Conceptual relationship model (journal working model, not a normative standard diagram): Core Security Objectives → Overlapping Domain Scopes → Risk Decisions → Administrative, Physical, and Technical Control Execution → Monitoring Evidence and Residual-Risk Feedback. The arrows show an engineering relationship, not containment.</p>
</div>

## Core Security Objectives: The CIA Triad & System Properties

Evaluating harm to an asset requires testing it against fundamental security properties defined in **[NIST FIPS 199](https://csrc.nist.gov/pubs/fips/199/final)**:

### 1. The CIA Triad

- **Confidentiality**: Preserves authorized restrictions on information access and disclosure, preventing unauthorized observation (*e.g., encrypting PII at rest via AES-256-GCM*).
- **Integrity**: Guards against improper information modification or destruction, ensuring non-repudiation and authenticity (*e.g., cryptographic signatures on API payloads and database records*).
- **Availability**: Ensures timely and reliable access to and use of information and services (*e.g., redundant load balancers, rate limiting, and auto-scaling failover clusters*).

### 2. Beyond the CIA Triad

Comprehensive security engineering expands beyond the CIA triad to address additional critical properties across systems:

- **Authenticity**: Verifying that a user, process, system, or payload is genuine (**[NIST SP 800-63-4](https://pages.nist.gov/800-63-4/sp800-63.html)**).
- **Accountability**: Producing evidence—via audit logging (**[NIST SP 800-92](https://csrc.nist.gov/pubs/sp/800/92/final)**)—that supports tracing system actions to an authenticated identity; the strength of that attribution still depends on identity binding, log integrity, access controls to the logs, time synchronization, and investigative context, not the logging mechanism alone.
- **Privacy**: Ensuring data processing respects individual rights and regulatory boundaries (**[NIST Privacy Framework](https://www.nist.gov/privacy-framework)**).
- **Safety**: Ensuring system operational failures do not cause physical injury, environmental damage, or loss of life (**[ISO 26262](https://www.iso.org/standard/68383.html) / NIST SP 800-160**).
- **Resilience**: The capacity of a system to withstand, adapt to, and recover from adverse conditions or attacks (**[NIST SP 800-160 Vol. 2 Rev. 1](https://csrc.nist.gov/pubs/sp/800/160/v2/r1/final)**).

## A Common Decision Engine: Continuous Risk Management

Whether protecting a physical paper archive (**Information Security**) or a cloud-native microservice (**Cybersecurity**), security protection is never arbitrary. Both domains aim to preserve the core **CIA Triad**, and both commonly rely on **Risk Management ([NIST SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final) / [ISO/IEC 27005](https://www.iso.org/standard/75281.html))** to connect objectives, threats, and controls—though the specific process each domain follows can differ in detail.

The five-stage breakdown below is a practical synthesis for this journal, informed by NIST SP 800-39 and SP 800-37 rather than a direct restatement of either publication's formal process steps. It connects abstract security objectives to concrete technical controls across five continuous operational stages:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/risk-management-lifecycle.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the continuous risk management lifecycle diagram at full size">
    <img src="{{ '/assets/img/risk-management-lifecycle.svg' | relative_url }}" alt="The Continuous Risk Management Lifecycle diagram showing Stage 1 Problem Inputs, Stage 2 Risk Assessment, Stage 3 Risk Responses, Stage 4 Security Controls Execution, and Stage 5 Continuous Monitoring Feedback Loop.">
  </a>
  <p class="diagram-caption">A practical risk-management workflow informed by NIST SP 800-39 / SP 800-37, not a literal reproduction of either lifecycle: Inputs → Assessment → Strategic Response Selection (Avoid, Mitigate, Share, Transfer, or Accept) → Controls Execution → Continuous Monitoring Feedback Loop</p>
</div>

### Operational Lifecycle Breakdown

| Lifecycle Stage | Primary Operational Actions & Mechanics | System Scenario Example |
|---|---|---|
| **Stage 1: Inputs**<br>*(Problem Domain)* | Gathers inputs from **Threat Modeling**, **vulnerability scan findings scored with CVSS**, **Threat Intel**, Asset Inventories, and Gap Audits to construct scenario components (*Asset, Threat, Vulnerability, Impact*)—CVSS itself scores a vulnerability's severity, it does not perform the scan that discovers it. | Unauthenticated public API route exposing customer database queries without rate limiting. |
| **Stage 2: Evaluation**<br>*(Risk Assessment)* | Calculates exposure severity per **[NIST SP 800-30 Rev. 1](https://csrc.nist.gov/pubs/sp/800/30/r1/final)** by rating threat plausibility and harm consequence—commonly approximated as a simplified working model, `Risk ≈ Likelihood × Impact`, though SP 800-30 itself does not mandate multiplication. | Rating data exfiltration likelihood as **High** and financial harm as **Critical**. |
| **Stage 3: Strategy**<br>*(Response Selection)* | Selects a response type; **[NIST SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final)** names five: **Accept**, **Avoid** (redesign feature), **Mitigate** (deploy controls), **Share**, and **Transfer** (insurance/SLAs)—share and transfer are distinct but often grouped together informally. | Selecting **Mitigate** to deploy technical security controls. |
| **Stage 4: Execution**<br>*(Control Mechanics)* | Implements safeguards drawn from the **[NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)** control catalog, which is organized into 20 control families. For defense-in-depth analysis, this journal additionally applies overlapping labels: **Preventive, Detective, Corrective / Recovery, Compensating,** and **Deterrent**. The first group describes operational role or timing, Compensating describes an approved substitute that provides equivalent or comparable protection when a required or recommended control cannot be used, and Deterrent describes intended behavioral effect; these are not five mutually exclusive stages or one official NIST taxonomy. Full breakdown in **[Security Controls & Defense in Depth]({{ '/topics/security-controls-defense-in-depth/' | relative_url }})**. | Deploying OIDC/OAuth token verification, Web Application Firewall (WAF), and mTLS. |
| **Stage 5: Loop**<br>*(Continuous Audit)* | Continuously monitors control efficacy (**[NIST SP 800-137](https://csrc.nist.gov/pubs/sp/800/137/final)**), tracks new threats, and feeds metrics back into Stage 1 Inputs for re-assessment. | Automated SIEM alerting on brute-force spikes and feeding log metrics into annual audits. |

A vulnerability alone does not constitute a risk. Risk assessment requires determining whether a plausible threat can reach the vulnerability, the magnitude of the resulting impact, and how existing controls alter overall probability. Risk management is never a static, one-time activity—it operates as a continuous feedback loop (**NIST SP 800-37**).

## Essential System Security Diagnostic Checklist

When evaluating the security posture of any new feature or system architecture, audit these 6 diagnostic questions:

| Diagnostic Focus Area | Key Architectural Evaluation Question | Target Verification &amp; Audit Evidence |
|---|---|---|
| **Asset Categorization** | What sensitive data, critical services, or business operations require protection? | Data classification inventories, CMDB registers &amp; asset catalogues. |
| **Control Verification** | Which preventive, detective, and corrective/recovery controls execute the reduction strategy; where a required or recommended control is replaced, does the approved compensating control provide equivalent or comparable protection; and where deterrence is claimed, what behavior is expected to change? | Security controls baseline mapping (**NIST SP 800-53 Rev. 5**), compensating-control assessment records &amp; continuous monitoring logs. |
| **Domain Boundary Identification** | Which information-security, cybersecurity, physical-security, and system-engineering scopes overlap for this asset and threat scenario? | Scope boundary documents &amp; system security plan (SSP) architecture bounds. |
| **Exposure Assessment** | What is the risk severity based on threat likelihood and consequential impact? | Risk assessment reports (**NIST SP 800-30 Rev. 1**). |
| **Objective Testing** | Which CIA triad properties, safety, or privacy limits would be breached if compromised? | FIPS 199 impact categorization &amp; privacy impact assessments (PIA). |
| **Strategic Response Selection** | Which response strategy—Accept, Avoid, Mitigate, Share, or Transfer—is authorized by the risk owner? | Risk treatment decision record signed off by the policy-defined acceptance authority (**NIST SP 800-39**). |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Security architecture begins by identifying assets, required security properties, plausible threat scenarios, and unacceptable harm before selecting controls. Controls should be risk-driven, independently verified, and layered so that one failure does not automatically become systemic compromise.</p>
</div>

## Primary references

- **NIST SP 800-53 Rev. 5**: *Security and Privacy Controls for Information Systems and Organizations* — [NIST CSRC SP 800-53](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
- **ISO/IEC 27001:2022**: *Information security, cybersecurity and privacy protection — Information security management systems* — [ISO 27001 Overview](https://www.iso.org/standard/27001)
- **NIST SP 800-39**: *Managing Information Security Risk* — [NIST CSRC SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final)
- **NIST SP 800-30 Rev. 1**: *Guide for Conducting Risk Assessments* — [NIST CSRC SP 800-30](https://csrc.nist.gov/pubs/sp/800/30/r1/final)
- **NIST FIPS 199**: *Standards for Security Categorization of Federal Information and Information Systems* — [NIST CSRC FIPS 199](https://csrc.nist.gov/pubs/fips/199/final)
- **NIST Cybersecurity Framework 2.0** — [NIST CSF 2.0](https://www.nist.gov/cyberframework)
- **NIST SP 800-37 Rev. 2**: *Risk Management Framework for Information Systems and Organizations* — [NIST CSRC SP 800-37](https://csrc.nist.gov/pubs/sp/800/37/r2/final)
- **ISO 26262:2018**: *Road vehicles — Functional safety* — [ISO 26262](https://www.iso.org/standard/68383.html)
- **ISO/IEC TS 27100:2020**: *Information technology — Cybersecurity — Overview and concepts* — [ISO/IEC TS 27100](https://www.iso.org/standard/72434.html)
- **NIST SP 800-160 Vol. 2 Rev. 1**: *Developing Cyber-Resilient Systems* — [NIST CSRC SP 800-160 Vol. 2](https://csrc.nist.gov/pubs/sp/800/160/v2/r1/final)
