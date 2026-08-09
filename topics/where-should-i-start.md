---
title: Where Should I Start?
description: Practical architectural roadmap for security engineering, choosing implementation pathways (system threat modeling vs enterprise ISMS governance), and selecting standards.
permalink: /topics/where-should-i-start/
last_verified: 2026-08-09
---

<span class="eyebrow">Security / Starting Map</span>

# Where Should I Start?

<p class="lede">Security engineering requires translating threat concepts and domain boundaries into operational execution. Establishing a security program involves selecting an entry point aligned with enterprise governance requirements or system engineering responsibilities.</p>

## Security Program Implementation Architecture

The following is a practical organizing model—not a formally standardized hierarchy—for how a security program's strategy connects governance (**GOVERN**) and technical execution (**TECHNICAL**) through dual-directional operational feedback loops:

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
3. **Deploy Technical Safeguards**: Implement technical controls—OpenID Connect (OIDC) authentication and OAuth 2.0 delegated authorization, database encryption, rate limiting, and Web Application Firewall (WAF) rules (**[Security Controls & Defense in Depth]({{ '/topics/security-controls-defense-in-depth/' | relative_url }})**).
4. **Validate Control Enforcement**: Validate implementation efficacy using static application security testing (SAST), dynamic application security testing (DAST), automated CI/CD pipeline security scanning, and periodic manual penetration testing (manual pentesting is not itself an automatable activity).

### Pathway B: Governance Entry (Enterprise ISMS & Compliance)

When building or auditing an organizational security program, governance teams follow a structured ISMS implementation progression:

1. **Define Scope & Governance**: Establish executive sponsorship, define organizational risk appetite, and map regulatory compliance mandates (**NIST SP 800-39**).
2. **Catalog Assets & Threats**: Inventory critical data repositories, production workloads, key personnel, and third-party vendor dependencies.
3. **Adopt Standard Frameworks**: Implement an industry standard framework (**[NIST CSF 2.0](https://www.nist.gov/cyberframework)** for outcome-driven cybersecurity, **[ISO/IEC 27001](https://www.iso.org/standard/27001)** for certifiable InfoSec governance).
4. **Audit Baseline Controls**: Assess existing safeguards against prioritized baselines such as **[CIS Controls IG1](https://www.cisecurity.org/controls/implementation-groups)**.
5. **Prioritize Remediation**: Prioritize security engineering gaps based on evaluated risk severity (likelihood and impact, per **NIST SP 800-30 Rev. 1**).
6. **Deploy & Assure Controls**: Implement administrative and technical controls, configure continuous monitoring (**NIST SP 800-137**), and collect audit compliance evidence.

## Top-Down & Bottom-Up Operational Feedback Loops

The operational connection between **GOVERN** and **TECHNICAL** functions as a continuous bi-directional feedback loop:

### 1. Top-Down Flow: Policy Mandates & Risk Tolerances (↓)

- **Operational Action**: Governance policies, regulatory compliance requirements (ISO 27001, SOC 2, GDPR, Singapore PDPA), and organizational risk appetite established in **GOVERN** are pushed down into **TECHNICAL** execution.
- **System Impact**: Establishes the outcomes and requirements technical teams must meet; teams then translate them into specific controls—commonly threat modeling, mTLS, firewall configuration, encryption at rest, and secure build pipelines (SLSA / SSDF)—though the specific control choice is an engineering decision, not something the policy itself mandates.

### 2. Bottom-Up Flow: Safeguard Telemetry & Audit Evidence (↑)

- **Operational Action**: Automated vulnerability scan metrics, SIEM log telemetry, SAST/DAST results, and penetration test reports generated in **TECHNICAL** flow up to **GOVERN**.
- **Governance Impact**: Provides evidence toward demonstrating control effectiveness to CISOs, executive boards, external auditors, and regulatory compliance authorities—telemetry supports the case for effectiveness, it does not on its own prove it.

## Framework Selection at a Glance

No single security catalog exhaustively covers every regional regulation or specialized technical standard worldwide. The table below is a starting-point selection, not an exhaustive catalog:

| Standard / Framework | Domain Scope | Best Used For |
|---|---|---|
| **[NIST CSF 2.0](https://www.nist.gov/cyberframework)** | Cybersecurity | Organizing security capabilities into an executive-level vocabulary across six functions: **Govern, Identify, Protect, Detect, Respond, Recover**. |
| **[NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)** | InfoSec & Privacy Control Catalog | Selecting granular technical, operational, and managerial safeguards for high-assurance or federal environments. |
| **[ISO/IEC 27001:2022](https://www.iso.org/standard/27001)** | Information Security | Building a certifiable ISMS and proving governance to external partners and auditors. |
| **[CIS Controls v8.1](https://www.cisecurity.org/controls)** | Technical Safeguards | A prioritized, resource-tiered technical hygiene checklist (IG1/IG2/IG3). |
| **[OWASP ASVS 5.0.0](https://owasp.org/www-project-application-security-verification-standard/)** | Application Security | Testable, level-based application security requirements. |
| **[GDPR](https://gdpr.eu/) / Singapore PDPA** | Statutory Data Privacy | Legal obligations, not optional frameworks—applicability is jurisdictional. |

**Decision rule**: start from **NIST CSF 2.0** (or an equivalent outcome framework) to organize *what* to cover, select a control catalog (**NIST SP 800-53**, **CIS Controls**) to decide *which specific safeguards*, and layer in statutory or contractual requirements (GDPR, PCI-DSS, SOC 2) only where they actually apply to the system's jurisdiction and data.

The full catalog of NIST/FIPS publication mappings, application/supply-chain standards, and OS/cloud hardening benchmarks lives in **[Cybersecurity Standards & Frameworks]({{ '/topics/cybersecurity-standards/' | relative_url }})**. Statutory regulations and commercial compliance attestations (GDPR, HIPAA, PDPA, DORA/NIS 2, PCI-DSS, SOC 2, ISO 27701, and the DOJ's ECCP guidance) live in **[Regulatory Mandates & Compliance Attestations]({{ '/topics/regulatory-compliance-mandates/' | relative_url }})**. Framework stacking strategy and a maturity-based implementation roadmap live in **[GRC Strategy]({{ '/topics/grc-framework-strategy/' | relative_url }})**.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Practitioner Roadmap Summary</strong>
    <ul>
      <li><strong>Start with Threat Modeling</strong>: Map assets, data flows, and trust boundaries before choosing security controls.</li>
      <li><strong>Use Frameworks to Set Requirements, Not to Replace Engineering</strong>: Peer-reviewed frameworks (NIST CSF 2.0, OWASP Top 10) define required outcomes and known risk categories; engineering teams still design and select the specific controls that satisfy them.</li>
      <li><strong>Measure Security Maturity</strong>: Track progress using established maturity models (CMMI, OWASP SAMM, CIS Implementation Groups).</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST Cybersecurity Framework 2.0**: *Framework for Improving Critical Infrastructure Cybersecurity* — [NIST CSF 2.0](https://www.nist.gov/cyberframework)
- **OWASP Top 10:2021**: *The Ten Most Critical Web Application Security Risks* — [OWASP Top 10](https://owasp.org/www-project-top-ten/)
