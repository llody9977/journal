---
title: Threats, Vulnerabilities & Risk
description: Technical framework for evaluating threat sources, vulnerability metrics (CVSS v4.0, EPSS, CISA KEV), risk response strategies (NIST SP 800-39), and residual risk governance.
permalink: /topics/risk-fundamentals/
last_verified: 2026-08-09
---

<span class="eyebrow">Security Foundations / Concepts</span>

# Threats, Vulnerabilities & Risk

<p class="lede">Risk connects high-value enterprise assets to plausible threat scenarios. Engineering effective defenses requires distinguishing software vulnerabilities from actual risk exposure: evaluating adversary capability, reachability, potential magnitude of impact, existing control efficacy, and residual risk governance approved by authorized executive risk owners.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/risk-fundamentals-engine.svg' | relative_url }}" alt="Threats, Vulnerabilities & Risk Engine diagram showing Threat Event Evaluation (NIST SP 800-30), CVSS/EPSS Vulnerability Scoring, Risk Response Options (NIST SP 800-39), and Residual Risk Governance.">
  <p class="diagram-caption">Threats, Vulnerabilities &amp; Risk Engine: Threat Scenario &amp; CVSS/EPSS Evaluation → Risk Treatment Options (Avoid, Reduce, Transfer, Accept) → Residual Risk Governance (NIST SP 800-30 / SP 800-39)</p>
</div>

## The NIST SP 800-30 & SP 800-39 Risk Taxonomy

Under **[NIST SP 800-30 Rev. 1](https://csrc.nist.gov/pubs/sp/800/30/r1/final)** (Risk Assessment) and **[NIST SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final)** (Risk Response & Governance), formal risk evaluation breaks down into ten discrete architectural factors:

| Risk Factor | Formal NIST Standard Definition | Technical Realization Example | Primary Risk Role |
|---|---|---|---|
| **Asset** | An entity of value to the organization requiring security protection. | Customer PII database, payment ledger, core API gateway. | Target of security objectives (*CIA invariants*). |
| **Threat Source** | Intent and capability (adversarial), or the mere potential to cause harm (non-adversarial), per **NIST SP 800-30's** four threat source types: **adversarial**, **accidental**, **structural**, and **environmental**. | Cybercriminal syndicate or insider threat (adversarial); a misconfiguration typo (accidental); aging hardware failure (structural); a flood or power outage (environmental). | Originator of a harmful event—not limited to attackers. |
| **Threat Event** | Specific harmful action or occurrence, whether deliberate or not. | SQL injection attack, ransomware encryption, DDoS payload, accidental data deletion, regional power outage. | Actionable event driving the risk scenario. |
| **Vulnerability** | A weakness in design, code, configuration, or operational process. | Un-sanitized API parameter, unpatched library CVE, weak IAM rule. | Weakness exploited or triggered by a threat event. |
| **Predisposing Condition** | Environmental factor increasing the likelihood of exploitation. | Public internet exposure, flat network topology, missing mTLS. | Exposure multiplier. |
| **Likelihood** | Plausibility that a threat event occurs and succeeds (**NIST SP 800-30**). | Rated High if exploit code is public and endpoint is routable. | Exploitation probability factor. |
| **Impact** | Extent of harm resulting from successful vulnerability exploitation. | Financial loss, regulatory fine, operational downtime, breach notification. | Magnitude of potential harm. |
| **Risk Exposure** | Overall significance of potential harm. **NIST SP 800-30** describes risk as a function of threat likelihood and impact without mandating a specific formula; `Risk ≈ Likelihood × Impact` used below is a simplified journal working model, not a normative NIST equation. | Qualitative rating (*Low/Med/High*) or quantitative FAIR financial loss (USD). | Decision metric for risk treatment. |
| **Security Control** | A technical, physical, or administrative/managerial safeguard deployed to alter risk likelihood or impact (**NIST SP 800-53**). | Web Application Firewall (WAF), WebAuthn MFA, AES-256 encryption (technical); badge access (physical); separation-of-duties policy (administrative). | Mitigating countermeasure. |
| **Residual Risk** | Exposure remaining after security controls operate (**NIST SP 800-39**). | Exposure approved and accepted by executive asset owners. | Net organization risk posture. |

Where the qualitative `Likelihood × Impact` model above is too coarse for financial decision-making, **FAIR (Factor Analysis of Information Risk)**—an Open Group standard—offers a quantitative alternative: it decomposes risk into loss event frequency and loss magnitude distributions to produce a probable financial loss range (e.g., USD), rather than a Low/Medium/High label.

## Vulnerability Metrics & Exploit Scoring Frameworks

Evaluating a vulnerability in isolation does not equal assessing risk. Engineering teams combine three complementary vulnerability metrics to prioritize remediations:

| Vulnerability Metric | Scoring Philosophy &amp; Scale | Core Evaluation Vector | Primary Engineering Application |
|---|---|---|---|
| **CISA Known Exploited Vulnerabilities (KEV)** | Authoritative catalog of vulnerabilities confirmed to be exploited in active attacks (**[CISA KEV Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)**). | Validated real-world exploitation in active threat actor campaigns. | Mandatory remediation deadlines for **US Federal Civilian Executive Branch (FCEB)** agencies under **[BOD 22-01](https://www.cisa.gov/news-events/directives/bod-22-01-reducing-significant-risk-known-exploited-vulnerabilities)**; CISA strongly urges—but cannot mandate—all other organizations to prioritize KEV remediation. |
| **Common Vulnerability Scoring System (CVSS v4.0)** | Standardized severity rating (0.0 to 10.0) based on intrinsic flaw characteristics (**[FIRST CVSS v4.0](https://www.first.org/cvss/v4.0/specification-document)**). | Evaluates Attack Vector (AV), Complexity (AC), Privileges Required (PR), User Interaction (UI), and Impact Metrics. | Base technical severity triage, SAST/DAST scanner prioritization, SLA patch windows. |
| **Exploit Prediction Scoring System (EPSS)** | Data-driven probability score (0.0 to 1.0 / 0% to 100%) predicting exploitation in the wild over 30 days (**[FIRST EPSS](https://www.first.org/epss/)**). | Analyzes threat intelligence feeds, public exploit code availability, and real-world attack activity. | Dynamic patch prioritization, filtering low-probability CVSS Critical flaws. |

## Vulnerability Reachability Analysis & Derivation Framework

Determining whether a vulnerability creates actionable risk requires conducting **Reachability Analysis**. Security engineering derives reachability across four technical evaluation layers. The numeric weights below are an **illustrative, locally defined scoring model**—not a value drawn from a NIST or FIRST specification—useful for reasoning about relative confidence, not a precise probability:

| Reachability Derivation Layer | Derivation Mechanism &amp; Tooling | Technical Verification Target | Illustrative Impact on Risk Exposure |
|---|---|---|---|
| **Dynamic Execution Tracing (IAST / eBPF)** | Monitored via Interactive Application Security Testing (IAST) agents or eBPF kernel probes during staging/production runtime. | Verifies whether the vulnerable code path or library function is loaded into memory and executed under real workloads. | **Confirmed Runtime Execution**: Observing the path execute confirms it is reachable (illustrative weight **1.0**). The converse does not hold—*not* observing execution only proves unreachability if trace coverage is comprehensive across all realistic inputs and code paths; otherwise it is inconclusive. |
| **Identity &amp; Authorization Boundaries (RBAC / ABAC)** | Audited via Policy Decision Points (PDPs), OPA policies, and API Gateway Policy Enforcement Points (PEPs). | Verifies whether unauthenticated external callers can trigger the route or if fine-grained authorization gates block access prior to execution. | **Gated Auth Access**: Illustrative weight reduced to reflect exposure narrowed to authenticated, authorized identities (**0.2 to 0.5**)—not eliminated, since a compromised or malicious authenticated identity can still reach the path. |
| **Network Perimeter Exposure (VPC / Ingress / mTLS)** | Evaluated via network topology maps, ingress Security Groups, VPC routing tables, and mTLS sidecar policies. | Verifies whether the vulnerable service endpoint is directly routable from the public internet or isolated within private internal subnets. | **Isolated VPC Subnet**: Removes *public internet* reachability, illustrative weight **0.0** for that specific vector only—it does not remove reachability via lateral movement from an already-compromised internal workload or a malicious insider, which must be scored separately. |
| **Static Call-Graph Analysis (SAST / AST Tracing)** | Traced via Static Application Security Testing (SAST) and Software Composition Analysis (SCA) call-graph generators. | Analyzes the application Abstract Syntax Tree (AST) to verify if public entry points transitively invoke the vulnerable third-party method. | **Dead / Un-called Code**: Confirms the flaw is unreachable from mapped public API entry points at the time of analysis, illustrative weight **0.0**—subject to the completeness of the call-graph model (e.g., dynamic dispatch, reflection). |

## Composite Vulnerability Risk Scoring Models & Standards

Relying solely on CVSS severity leads to patch fatigue. Modern security standards combine **CVSS**, **EPSS**, **CISA KEV**, **Reachability**, and **Asset Criticality** into multi-parameter decision models:

| Composite Scoring Framework | Governing Body / Origin | Core Decision Input Vectors | Actionable Output &amp; Remediation SLA |
|---|---|---|---|
| **CISA &amp; CMU SSVC (Stakeholder-Specific Vulnerability Categorization)** | Carnegie Mellon University SEI &amp; CISA (**[CISA SSVC Guide](https://www.cisa.gov/stakeholder-specific-vulnerability-categorization-ssvc)**). | Decision tree evaluating **Exploitation** (*KEV/EPSS*), **Exposure** (*Reachability*), **Automatable** (*Wormable*), and **Mission &amp; Well-Being Impact**. | Decision Categories: **Track** (De-prioritized), **Track\***, **Attend**, or **Act**. SSVC's own documentation does not attach a fixed 24–72 hour SLA to "Act"—remediation timing is set by the adopting organization's own policy on top of the SSVC decision. |
| **CVSS v4.0 BTE (Base + Threat + Environmental)** | FIRST.org (**[CVSS v4.0 Spec](https://www.first.org/cvss/v4.0/specification-document)**). | Combines Base Flaw Severity + the **Threat metric group** (CVSS v4.0 defines a single Threat metric, **Exploit Maturity (E)**; EPSS and CISA KEV are external threat-intelligence sources that can *inform* how an assessor sets E, but are not themselves CVSS metrics) + **Environmental Metrics** (*Modified reachability &amp; mTLS controls*). | Composite score (0.0 to 10.0) reflecting real-world environment risk rather than theoretical severity. |
| **EPSS + CVSS Triage Matrix** *(journal working model)* | Not an official FIRST or CISA-published matrix—this is a locally defined triage heuristic built from EPSS and CVSS, useful for illustration only. | Dual-axis matrix mapping **CVSS Base Score** (≥ 7.0) against **EPSS Exploit Probability** (> 10%) and **CISA KEV** active attack status. | Illustrative categorization into **Emergency Patch** (CVSS ≥ 7 + EPSS > 10% + KEV), **Scheduled Patch**, or **Monitor**—thresholds are locally chosen, not standardized. |
| **Risk-Based Vulnerability Management (RBVM / VPR)** | Gartner &amp; Enterprise Vulnerability Vendors (*Tenable VPR / Qualys TruRisk*). | Dynamic algorithm weighting **CVE Flaw Severity** × **Exploit Threat Telemetry** × **Asset Criticality** × **Network Reachability**. | Dynamic Risk Score (1 to 1000) driving automated ticket escalation in CI/CD and ITSM workflows. |

## Vulnerability vs Actual Risk Exposure Matrix

A software vulnerability score (CVSS) does not equal total risk exposure. Actual risk depends on reachability, threat capability, and existing control coverage. The CVSS scores below are **hypothetical, illustrative values** for the scenario described—not scores computed from an actual CVSS vector string for a real CVE—and remediation timelines are illustrative organizational choices, not a cited SLA:

| System Scenario &amp; Architectural Context | Illustrative Base Vulnerability Score (CVSS) | Reachability &amp; Exposure Offset | True Risk Significance |
|---|---|---|---|
| **Internal Microservice RCE behind mTLS** | **CVSS ~9.8** (Critical, hypothetical) | Non-routable internal VPC subnet requiring valid SPIFFE mTLS certs. | **MODERATE RISK**: Compensating network controls reduce likelihood; scheduled patch window. |
| **Legacy TLS 1.0 Support on Public Web Endpoint** | **CVSS ~5.3** (Medium, hypothetical) | Internet-exposed public endpoint storing financial PII. | **HIGH REGULATORY RISK**: Likely violates PCI-DSS 4.0 requirements around strong cryptography for cardholder data. |
| **Public API Gateway SQL Injection** | **CVSS ~9.8** (Critical, hypothetical) | Internet-routable, unauthenticated public endpoint. | **CRITICAL IMMEDIATE RISK**: Warrants emergency, out-of-cycle patch deployment per the organization's own incident response policy. |
| **Single-Zone Cloud Database Dependency** | **No CVE Score** (N/A) | No software bug present; reliance on single cloud availability zone. | **HIGH AVAILABILITY RISK**: Structural failure mode mitigated via multi-region replication. |

## Risk Response Strategies (NIST SP 800-39 / ISO 31000)

When a risk assessment identifies exposure exceeding organizational risk appetite, security leadership selects a risk treatment. **[NIST SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final)** names five response types: **accept, avoid, mitigate, share,** and **transfer**—"share" and "transfer" are distinct (share distributes part of the loss, transfer shifts it entirely, e.g., to an insurer), though they are often grouped together informally as below:

| Risk Treatment Strategy | Strategic Objective | Governing Mechanism | Technical Realization Example |
|---|---|---|---|
| **Accept** | Formally acknowledge and record residual risk when mitigation cost exceeds impact. | Executive risk sign-off &amp; risk register tracking. | CISO / VP of Engineering sign-off on accepted legacy software risk with 90-day review triggers. |
| **Avoid** | Eliminate the risk vector completely by terminating the vulnerable feature. | Architecture deprecation &amp; protocol removal. | Disabling legacy TLS 1.0/1.1 support or removing un-maintained third-party webhooks. |
| **Mitigate (Reduce)** | Lower likelihood or magnitude of impact by deploying technical safeguards. | Implementing **NIST SP 800-53 Rev. 5** security controls. | Enforcing WebAuthn FIDO2 MFA (AAL2), mTLS, WAF rate limits &amp; AES-256 database encryption. |
| **Share / Transfer** | Shift or distribute financial or operational loss exposure to external third parties. | Contractual SLAs &amp; financial coverage policies. | Procuring cybersecurity insurance policies, or contracting a managed cloud provider under a shared-responsibility model. Outsourcing infrastructure shifts *operational* burden and often shares *financial* loss exposure via SLAs, but it does not transfer the organization's own accountability for the data or regulatory obligations. |

## Essential Risk Assessment Diagnostic Checklist

When evaluating an enterprise risk assessment or vulnerability management pipeline, evaluate these 6 diagnostic questions:

| Diagnostic Focus Area | Key Architectural Evaluation Question | Target Verification &amp; Audit Evidence |
|---|---|---|
| **Contextual Reachability** | Are CVSS severity scores adjusted based on network reachability, identity boundaries, and compensating controls? | Network topology maps, mTLS sidecar configs &amp; SAST reachability audits. |
| **Continuous Monitoring** | Is there an automated trigger to re-evaluate risk when major architectural changes or new CVEs occur? | Continuous Monitoring reports (**NIST SP 800-137**) &amp; CI/CD security triggers. |
| **Control Efficacy** | Are existing security controls verified as actively operating before calculating residual risk? | Automated SIEM telemetry logs, penetration test reports &amp; SAST/DAST evidence. |
| **Executive Governance** | Is all accepted residual risk formally signed off by an authorized executive asset owner (**NIST SP 800-39**)? | Executive risk sign-off records &amp; GRC risk register approval trails. |
| **Exploit Intelligence** | Are vulnerability patch priorities driven by real-world exploitation telemetry (**EPSS &amp; CISA KEV**)? | Vulnerability management SLA reports &amp; EPSS prioritization dashboards. |
| **Scenario Completeness** | Does the risk assessment evaluate all six components (*Asset, Threat Source, Event, Vulnerability, Likelihood, Impact*)? | Documented Risk Register matrices (**NIST SP 800-30 Rev. 1**). |

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Risk Fundamentals Summary</strong>
    <ul>
      <li><strong>Risk Model</strong>: `Risk ≈ Likelihood × Impact` is a simplified working model, not a normative NIST formula; NIST SP 800-30 defines risk as a function of likelihood and impact without mandating multiplication.</li>
      <li><strong>Risk Treatment Strategies</strong>: NIST SP 800-39 names five: Accept, Avoid, Mitigate, Share, and Transfer (share and transfer are distinct, often grouped together informally).</li>
      <li><strong>FAIR Methodology</strong>: Quantitative alternative decomposing risk into loss event frequency and magnitude for financial modeling.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-30 Rev. 1**: *Guide for Conducting Risk Assessments* — [NIST CSRC SP 800-30](https://csrc.nist.gov/pubs/sp/800/30/r1/final)
- **ISO 31000:2018**: *Risk management — Guidelines* — [ISO 31000](https://www.iso.org/standard/65694.html)
