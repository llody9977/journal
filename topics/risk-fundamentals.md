---
title: Threats, Vulnerabilities & Risk
description: Technical framework for evaluating threat sources, vulnerability prioritization signals (CVSS v4.0, EPSS, CISA KEV), risk states (inherent/current/target/residual), appetite vs tolerance, risk ownership roles, and treatment strategies (NIST SP 800-39).
permalink: /topics/risk-fundamentals/
last_verified: 2026-08-11
---

<span class="eyebrow">Security Foundations / Concepts</span>

# Threats, Vulnerabilities & Risk

<p class="lede">Risk connects high-value enterprise assets to plausible threat scenarios—adversarial and non-adversarial alike. Engineering effective defenses requires distinguishing software vulnerabilities from actual risk exposure: evaluating threat-source conditions, reachability, potential magnitude of impact, existing control efficacy, and residual risk governance approved by whichever acceptance authority organizational policy and severity thresholds assign.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/risk-fundamentals-engine.svg' | relative_url }}" alt="Threats, Vulnerabilities & Risk Engine diagram showing Threat Event Evaluation (NIST SP 800-30), CVSS/EPSS Vulnerability Scoring, Risk Response Options (NIST SP 800-39), and Residual Risk Governance.">
  <p class="diagram-caption">Threats, Vulnerabilities &amp; Risk Engine: Threat Scenario &amp; CVSS/EPSS Evaluation → Risk Treatment Options (Avoid, Mitigate, Share/Transfer, Accept — Share and Transfer are grouped here only for compact presentation) → Residual Risk Governance (NIST SP 800-30 / SP 800-39)</p>
</div>

## The NIST SP 800-30 & SP 800-39 Risk Taxonomy

The table below is a journal working model informed by **[NIST SP 800-30 Rev. 1](https://csrc.nist.gov/pubs/sp/800/30/r1/final)** (Risk Assessment) and **[NIST SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final)** (Risk Response & Governance)—it decomposes risk evaluation into ten factors for engineering clarity, but SP 800-30/39 do not themselves define this exact ten-factor taxonomy:

| Risk Factor | Working Definition (Informed by Cited Sources) | Technical Realization Example | Primary Risk Role |
|---|---|---|---|
| **Asset** | An entity of value to the organization requiring security protection. | Customer PII database, payment ledger, core API gateway. | Target of security objectives (*CIA invariants*). |
| **Threat Source** | Intent and capability (adversarial), or the mere potential to cause harm (non-adversarial), per **NIST SP 800-30's** four threat source types: **adversarial**, **accidental**, **structural**, and **environmental**. | Cybercriminal syndicate or insider threat (adversarial); a misconfiguration typo (accidental); aging hardware failure (structural); a flood or power outage (environmental). | Originator of a harmful event—not limited to attackers. |
| **Threat Event** | Specific harmful action or occurrence, whether deliberate or not. | SQL injection attack, ransomware encryption, DDoS payload, accidental data deletion, regional power outage. | Actionable event driving the risk scenario. |
| **Vulnerability** | A weakness in design, code, configuration, or operational process. | Un-sanitized API parameter, unpatched library CVE, weak IAM rule. | Weakness exploited or triggered by a threat event. |
| **Predisposing Condition** | Architectural, operational, environmental, or configuration factor increasing the likelihood or severity of exploitation. | Public internet exposure, flat network topology, missing mTLS. | Exposure multiplier. |
| **Likelihood** | Plausibility that a threat event occurs and succeeds (**NIST SP 800-30**). | Rated High if exploit code is public and endpoint is routable. | Exploitation probability factor. |
| **Impact** | Extent of harm resulting from a threat event—successful vulnerability exploitation is one cause, alongside operational failure, human error, dependency loss, or an environmental event with no software vulnerability involved. | Financial loss, regulatory fine, operational downtime, breach notification. | Magnitude of potential harm. |
| **Risk Exposure** | Overall significance of potential harm. **NIST SP 800-30** describes risk as a function of threat likelihood and impact without mandating a specific formula; `Risk ≈ Likelihood × Impact` used below is a simplified journal working model, not a normative NIST equation. | Qualitative rating (*Low/Med/High*) or quantitative FAIR financial loss (USD). | Decision metric for risk treatment. |
| **Security Control** | A technical, physical, or administrative/managerial safeguard deployed to alter risk likelihood or impact (**[NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)**). | Web Application Firewall (WAF), WebAuthn MFA, AES-256 encryption (technical); badge access (physical); separation-of-duties policy (administrative). | Mitigating countermeasure. |
| **Residual Risk** | Exposure remaining after security controls operate (**NIST SP 800-39**). Residual risk is simply what's left—it still requires an explicit response (accept, further mitigate, avoid, or share/transfer); it is not already accepted by default. | Exposure formally reviewed and, where accepted, formally approved by the acceptance authority defined in organizational policy and severity thresholds. | Net organization risk posture. |

Where the qualitative `Likelihood × Impact` model above is too coarse for financial decision-making, **[Open FAIR (Factor Analysis of Information Risk)](https://www.opengroup.org/certifications/openfair)**—maintained by The Open Group under the O-RA (Risk Analysis) and O-RT (Risk Taxonomy) standards—offers a quantitative alternative: it decomposes risk into loss event frequency and loss magnitude distributions to produce a probable financial loss range (e.g., USD), rather than a Low/Medium/High label.

### Risk States: Inherent, Current, Target & Residual

The same risk scenario carries a different exposure level depending on which point in the mitigation timeline is being described. These four terms are common practitioner usage, not a single named standard's formal taxonomy—use them to keep a risk conversation anchored to a specific point in time:

| Risk State | What It Measures | Relationship to Controls |
|---|---|---|
| **Inherent Risk** | Exposure assuming no controls exist at all—the raw combination of asset value, threat source/event, and—where applicable—vulnerability or predisposing condition. | An estimated uncontrolled baseline, not a floor—typically the higher end of the exposure range, though not strictly guaranteed to be the maximum possible (a poorly implemented control can occasionally introduce its own new exposure). Rarely the actual state of a running system, but useful for showing how much a control program is worth by comparison against Current Risk. |
| **Current Risk** | Exposure given the controls actually operating today. | A snapshot—this is what "residual risk" (below) usually refers to at the present moment, before any further planned mitigation. |
| **Target Risk** | The exposure level the organization intends to reach, set by its risk appetite and tolerance (below). | The gap between Current and Target risk defines the mitigation backlog and its priority. |
| **Residual Risk** | Exposure remaining after a defined set of controls—existing or newly deployed—operate, evaluated at a stated point in time (**NIST SP 800-39**). | Functionally the same measurement as Current Risk, but the term specifically frames it as the input to an explicit response decision—not a closed, permanent state; further treatment may still follow. |

### Risk Appetite, Tolerance & Time Horizon

- **Risk appetite**: The amount and type of risk an organization is willing to pursue or retain in aggregate, in pursuit of its objectives—broad, strategic, and typically set by executive leadership or the board.
- **Risk tolerance**: The acceptable variation around a specific risk or objective, within the broader appetite—narrower and more operational (e.g., "no single vendor may hold more than X% of critical customer data unencrypted," inside an overall appetite statement about vendor risk).
- **Uncertainty and confidence**: A risk rating is an estimate, not a measurement—it inherits the uncertainty of its inputs (asset value, threat intelligence quality, control-effectiveness assumptions). Stating a confidence level or range alongside a rating (e.g., "High, based on limited telemetry—confidence: low") preserves that uncertainty instead of presenting a guess as a precise fact.
- **Time horizon**: A risk accepted for one quarter is a different decision than the same risk accepted indefinitely. A treatment decision should state the horizon it was evaluated under and a revisit date—an unpatched dependency accepted "temporarily" with no revisit date tends to become a permanent, undocumented exception.

### Risk Owner vs Control Owner vs Acceptance Authority

Three distinct roles are often collapsed into one person on a small team, but conflating them becomes a governance gap as an organization scales:

| Role | Accountable For | Typical Holder |
|---|---|---|
| **Risk Owner** | The overall business outcome of the risk scenario—whether it materializes and what happens if it does. | A business, product, or system owner with authority over the asset at risk. |
| **Control Owner** | Implementing and operating a specific control that mitigates part of the risk. | An engineering or platform team responsible for that control's design and operating effectiveness. |
| **Acceptance Authority** | Formally authorizing residual risk to be carried, often gated by severity (e.g., a team lead can accept Low risk; Critical risk requires executive or board sign-off). | Defined by the organization's risk governance policy—may or may not be the same person as the risk owner. |

## Vulnerability Metrics & Exploit Scoring Frameworks

Evaluating a vulnerability in isolation does not equal assessing risk. Engineering teams combine three complementary prioritization signals to prioritize remediations—KEV is a catalog/status signal (is this being actively exploited?), not a numeric metric like CVSS or EPSS:

| Prioritization Signal | Scoring Philosophy &amp; Scale | Core Evaluation Vector | Primary Engineering Application |
|---|---|---|---|
| **CISA Known Exploited Vulnerabilities (KEV)** | Authoritative catalog of vulnerabilities confirmed to be exploited in active attacks (**[CISA KEV Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)**). | Validated real-world exploitation in active threat actor campaigns. | Mandatory remediation deadlines for **US Federal Civilian Executive Branch (FCEB)** agencies under **[BOD 22-01](https://www.cisa.gov/news-events/directives/bod-22-01-reducing-significant-risk-known-exploited-vulnerabilities)**; CISA strongly urges—but cannot mandate—all other organizations to prioritize KEV remediation. |
| **Common Vulnerability Scoring System (CVSS v4.0)** | Standardized severity rating (0.0 to 10.0) based on intrinsic flaw characteristics (**[FIRST CVSS v4.0](https://www.first.org/cvss/v4.0/specification-document)**). | Evaluates Exploitability metrics—Attack Vector (AV), Attack Complexity (AC), Attack Requirements (AT, new in CVSS v4), Privileges Required (PR), User Interaction (UI)—and distinguishes Vulnerable System Impact metrics (VC, VI, VA) from Subsequent System Impact metrics (SC, SI, SA). | Base technical severity triage, SAST/DAST scanner prioritization, SLA patch windows. |
| **Exploit Prediction Scoring System (EPSS)** | Data-driven probability score (0.0 to 1.0 / 0% to 100%) predicting exploitation in the wild over 30 days (**[FIRST EPSS](https://www.first.org/epss/)**). | Analyzes threat intelligence feeds, public exploit code availability, and real-world attack activity. | Dynamic patch prioritization, filtering low-probability CVSS Critical flaws. |

## Vulnerability Reachability Analysis & Derivation Framework

For a code- or component-level vulnerability, determining whether it creates actionable risk typically warrants conducting **Reachability Analysis**—this applies to vulnerabilities in software the organization controls or can trace; it is not a universal step for every risk scenario (e.g., a structural or environmental risk with no vulnerable code path has nothing to trace). Security engineering derives reachability across four technical evaluation layers. The numeric weights below are an **illustrative, locally defined scoring model**—not a value drawn from a NIST or FIRST specification—useful for reasoning about relative confidence, not a precise probability:

| Reachability Derivation Layer | Derivation Mechanism &amp; Tooling | Technical Verification Target | Illustrative Impact on Risk Exposure |
|---|---|---|---|
| **Dynamic Execution Tracing (IAST / eBPF)** | Monitored via Interactive Application Security Testing (IAST) agents or eBPF kernel probes during staging/production runtime. | Verifies whether the vulnerable code path or library function is loaded into memory and executed under real workloads. | **Confirmed Runtime Execution**: Observing the path execute confirms it is reachable (illustrative weight **1.0**). The converse does not hold—*not* observing execution only proves unreachability if trace coverage is comprehensive across all realistic inputs and code paths; otherwise it is inconclusive. |
| **Identity &amp; Authorization Boundaries (RBAC / ABAC)** | Audited via Policy Decision Points (PDPs), OPA policies, and API Gateway Policy Enforcement Points (PEPs). | Verifies whether unauthenticated external callers can trigger the route or if fine-grained authorization gates block access prior to execution. | **Gated Auth Access**: Illustrative weight reduced to reflect exposure narrowed to authenticated, authorized identities (**0.2 to 0.5**)—not eliminated, since a compromised or malicious authenticated identity can still reach the path. |
| **Network Perimeter Exposure (VPC / Ingress / mTLS)** | Evaluated via network topology maps, ingress Security Groups, VPC routing tables, and mTLS sidecar policies. | Verifies whether the vulnerable service endpoint is directly routable from the public internet or isolated within private internal subnets. | **Isolated VPC Subnet**: Removes *public internet* reachability, illustrative weight **0.0** for that specific vector only—it does not remove reachability via lateral movement from an already-compromised internal workload or a malicious insider, which must be scored separately. |
| **Static Call-Graph Analysis (SAST / AST Tracing)** | Traced via Static Application Security Testing (SAST) and Software Composition Analysis (SCA) call-graph generators. | Analyzes the application Abstract Syntax Tree (AST) to verify if public entry points transitively invoke the vulnerable third-party method. | **No Reachable Path Found**: No path was found from mapped public API entry points to the vulnerable code within the analyzed model and coverage, illustrative weight **0.0**—this is not the same as confirmed unreachability, since it is subject to the completeness of the call-graph model (e.g., dynamic dispatch, reflection, or code paths outside the analyzed scope). |

## Composite Vulnerability Risk Scoring Models & Standards

Relying solely on CVSS severity leads to patch fatigue. Modern vulnerability-management programs commonly combine **CVSS**, **EPSS**, **CISA KEV**, **Reachability**, and **Asset Criticality** into multi-parameter decision models—this is common practice, not a single mandated standard:

| Composite Scoring Framework | Governing Body / Origin | Core Decision Input Vectors | Actionable Output &amp; Remediation SLA |
|---|---|---|---|
| **CISA SSVC — Vulnerability Response Decision Tree (Stakeholder-Specific Vulnerability Categorization)** | Originally academic work by Carnegie Mellon University SEI; CISA publishes and operationalizes its own deployer-facing decision tree (**[CISA SSVC Guide](https://www.cisa.gov/stakeholder-specific-vulnerability-categorization-ssvc)**). | CISA's tree uses four decision points, not the broader set from the original CMU model: **Exploitation** (*None / Public PoC / Active*, informed by KEV status and exploit intelligence), **Automatable** (*No / Yes*—can an attacker's exploitation steps be scripted at scale), **Technical Impact** (*Partial / Total* control gained), and **Mission &amp; Well-Being Impact** (combining mission prevalence and public well-being consequence). | Decision Categories: **Track** (De-prioritized), **Track\***, **Attend**, or **Act**. SSVC's own documentation does not attach a fixed 24–72 hour SLA to "Act"—remediation timing is set by the adopting organization's own policy on top of the SSVC decision. |
| **CVSS v4.0 BTE (Base + Threat + Environmental)** | FIRST.org (**[CVSS v4.0 Spec](https://www.first.org/cvss/v4.0/specification-document)**). | Combines Base Flaw Severity + the **Threat metric group** (CVSS v4.0 defines a single Threat metric, **Exploit Maturity (E)**, with defined values including *Attacked (A)*; a CISA KEV listing is direct evidence supporting an Attacked assessment, while EPSS's 30-day exploitation-probability forecast is a related but distinct predictive signal best treated as a separate prioritization input rather than folded into E—neither KEV nor EPSS is itself a CVSS metric) + the **Environmental metric group** (Base metrics re-scored for the local environment, plus Confidentiality/Integrity/Availability Requirements; a compensating control such as mTLS can *inform* how an assessor re-scores a Modified metric, but "mTLS" is not itself a CVSS metric). | Composite score (0.0 to 10.0) reflecting real-world environment risk rather than theoretical severity. |
| **EPSS + CVSS Triage Matrix** *(journal working model)* | Not an official FIRST or CISA-published matrix—this is a locally defined triage heuristic built from EPSS and CVSS, useful for illustration only. | Dual-axis matrix mapping **CVSS Base Score** (≥ 7.0) against **EPSS Exploit Probability** (> 10%) and **CISA KEV** active attack status. | Illustrative categorization into **Emergency Patch** (CVSS ≥ 7 + EPSS > 10% + KEV), **Scheduled Patch**, or **Monitor**—thresholds are locally chosen, not standardized. |
| **Risk-Based Vulnerability Management (RBVM)** | Gartner analyst category describing this class of tooling. | Dynamic, vendor-specific algorithm combining **CVE Flaw Severity**, **Exploit Threat Telemetry**, **Asset Criticality**, and **Network Reachability**—the exact weighting is proprietary per vendor, not a disclosed or standardized formula. | Dynamic, vendor-specific risk score driving automated ticket escalation in CI/CD and ITSM workflows—see specific vendor scales below. |
| ↳ **[Tenable Vulnerability Priority Rating (VPR)](https://docs.tenable.com/vulnerability-management/Content/Lumin/LuminMetrics.htm)** | Tenable proprietary scoring model. | Combines a CVSS-like technical severity component with Tenable's own threat intelligence feed. | Score range **0.1 to 10.0** (distinct scale from Base CVSS despite the similar range). |
| ↳ **[Qualys TruRisk](https://www.qualys.com/trurisk/)** | Qualys proprietary scoring model. | Combines vulnerability severity, threat intelligence, and asset criticality into a single index. | Score range **0 to 1000**—not directly comparable to Tenable VPR's 0.1–10.0 scale. |

## Vulnerability vs Actual Risk Exposure Matrix

A software vulnerability score (CVSS) does not equal total risk exposure. Actual risk depends on reachability, threat capability, and existing control coverage. The CVSS scores below are **hypothetical, illustrative values** for the scenario described—not scores computed from an actual CVSS vector string for a real CVE—and remediation timelines are illustrative organizational choices, not a cited SLA:

| System Scenario &amp; Architectural Context | Illustrative Base Vulnerability Score (CVSS) | Reachability &amp; Exposure Offset | Illustrative Contextual Risk Judgment |
|---|---|---|---|
| **Internal Microservice RCE behind mTLS** | **CVSS ~9.8** (Critical, hypothetical) | Non-routable internal VPC subnet requiring valid SPIFFE mTLS certs. | Compensating network controls plausibly reduce likelihood enough to support a scheduled (not emergency) patch window—an illustrative judgment, not a computed score. |
| **Legacy TLS 1.0 Support on Public Web Endpoint** | **CVSS ~5.3** (Medium, hypothetical) | Internet-exposed endpoint storing, processing, or transmitting cardholder data, or affecting the security of the cardholder-data environment (CDE). | Likely violates **[PCI DSS 4.0.1](https://www.pcisecuritystandards.org/standards/pci-dss/)** requirements prohibiting early TLS for cardholder data (see **[PCI SSC TLS FAQ](https://www.pcisecuritystandards.org/faqs/1491/)**), making regulatory and compliance exposure far higher than the Medium CVSS Base score alone suggests. |
| **Public API Gateway SQL Injection** | **CVSS ~9.8** (Critical, hypothetical) | Internet-routable, unauthenticated public endpoint. | Combination of Critical severity and unauthenticated public reachability plausibly warrants emergency, out-of-cycle patch deployment per the organization's own incident response policy. |
| **Single-Zone Cloud Database Dependency** | **No CVE Score** (N/A) | No software bug present; reliance on single cloud availability zone. | A structural availability failure mode with no CVSS score at all—illustrates that reachability/impact reasoning applies beyond CVE-numbered vulnerabilities; mitigated via multi-region replication. |

## Risk Response Strategies (NIST SP 800-39 / ISO 31000)

When a risk assessment identifies exposure exceeding organizational risk appetite, security leadership selects a risk treatment. **[NIST SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final)** names five response types: **accept, avoid, mitigate, share,** and **transfer**—"share" and "transfer" are distinct (share distributes part of the loss, transfer shifts it, e.g., to an insurer), though they are often grouped together informally as below:

| Risk Treatment Strategy | Strategic Objective | Governing Mechanism | Technical Realization Example |
|---|---|---|---|
| **Accept** | Formally acknowledge and record residual risk as an authorized decision within the organization's risk appetite/tolerance, made after considering available alternatives—not limited to cases where mitigation cost exceeds impact. | Formal approval by the acceptance authority defined in organizational policy and severity thresholds &amp; risk register tracking. | CISO / VP of Engineering sign-off on accepted legacy software risk with 90-day review triggers (as one possible organizational implementation). |
| **Avoid** | Discontinue or withdraw the risk-generating activity, feature, or asset (eliminating exposure to that specific vector, though residual or transition risks may remain). | Architecture deprecation &amp; protocol removal. | Disabling legacy TLS 1.0/1.1 support or removing un-maintained third-party webhooks. |
| **Mitigate (Reduce)** | Lower likelihood or magnitude of impact using technical, administrative, physical, contractual, or process measures—not technical safeguards alone. | Implementing **NIST SP 800-53 Rev. 5** security controls, alongside administrative/procedural measures where applicable. | Enforcing WebAuthn FIDO2 MFA (AAL2), mTLS, WAF rate limits &amp; AES-256 database encryption (technical); mandatory dual-approval change procedures or updated vendor contract terms (administrative/contractual). |
| **Share / Transfer** | Shift or distribute financial or operational loss exposure to external third parties. | Contractual SLAs &amp; financial coverage policies. | Procuring cybersecurity insurance policies, or contracting a managed cloud provider under a shared-responsibility model. Outsourcing infrastructure shifts *operational* burden and often shares *financial* loss exposure via SLAs, but it does not transfer the organization's own accountability for the data or regulatory obligations. |

## Essential Risk Assessment Diagnostic Checklist

When evaluating an enterprise risk assessment or vulnerability management pipeline, evaluate these 6 diagnostic questions:

| Diagnostic Focus Area | Key Architectural Evaluation Question | Target Verification &amp; Audit Evidence |
|---|---|---|
| **Contextual Reachability** | Is network reachability, identity boundaries, and compensating-control context captured via CVSS Threat/Environmental metrics or a separate contextual risk score—preserving the Base score rather than informally overwriting it? | Network topology maps, mTLS sidecar configs, SAST reachability audits &amp; documented CVSS Environmental/Threat scoring. |
| **Continuous Monitoring** | Is there an automated trigger to re-evaluate risk when major architectural changes or new CVEs occur? | Continuous Monitoring reports (**[NIST SP 800-137](https://csrc.nist.gov/pubs/sp/800/137/final)**) &amp; CI/CD security triggers. |
| **Control Efficacy** | Are existing security controls verified as actively operating before calculating residual risk? | Automated SIEM telemetry logs, penetration test reports &amp; SAST/DAST evidence. |
| **Acceptance Governance** | Is all accepted residual risk formally signed off by the acceptance authority defined in organizational policy and severity thresholds—not assumed to always be an executive (**NIST SP 800-39**)? | Risk sign-off records at the appropriate authority level &amp; GRC risk register approval trails. |
| **Exploit Intelligence** | Are vulnerability patch priorities driven by real-world exploitation telemetry (**EPSS &amp; CISA KEV**)? | Vulnerability management SLA reports &amp; EPSS prioritization dashboards. |
| **Scenario Completeness** | Does the risk assessment evaluate the applicable components (*Asset, Threat Source, Event, Vulnerability or predisposing condition where applicable, Likelihood, Impact*)? | Documented Risk Register matrices (**NIST SP 800-30 Rev. 1**). |

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
- **NIST SP 800-39**: *Managing Information Security Risk* — [NIST CSRC SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final)
- **FIRST CVSS v4.0 Specification** — [FIRST CVSS v4.0](https://www.first.org/cvss/v4.0/specification-document)
- **FIRST EPSS** — [FIRST EPSS](https://www.first.org/epss/)
- **CISA Known Exploited Vulnerabilities Catalog** — [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- **CISA / CMU SEI SSVC Guide** — [CISA SSVC](https://www.cisa.gov/stakeholder-specific-vulnerability-categorization-ssvc)
- **NIST SP 800-53 Rev. 5**: *Security and Privacy Controls for Information Systems and Organizations* — [NIST CSRC SP 800-53](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
- **NIST SP 800-137**: *Information Security Continuous Monitoring (ISCM)* — [NIST CSRC SP 800-137](https://csrc.nist.gov/pubs/sp/800/137/final)
