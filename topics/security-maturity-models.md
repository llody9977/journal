---
title: "Security Maturity Models"
description: Comprehensive analysis of CMMI, C2M2, OWASP SAMM, CIS Implementation Groups, SLSA levels, and NIST CSF Tiers.
permalink: /topics/security-maturity-models/
last_verified: 2026-08-06
---

<span class="eyebrow">Governance, Risk & Compliance / Deep Dive</span>

# Security Maturity Models

<p class="lede">Security maturity models evaluate the consistency, repeatability, governance integration, and continuous improvement of an organization's security practices. Measuring maturity requires selecting the appropriate model for the scope: broad process maturity (CMMI), domain-specific capability (C2M2), software supply chain integrity (SLSA), application security practice growth (OWASP SAMM), or resource-tiered safeguard baselines (CIS Implementation Groups).</p>

## The Security Maturity Model Comparison Matrix

| Model | Target Scope | Metric Base | Maturity Levels | Domain Granularity |
|---|---|---|---|---|
| **CMMI v3.0** | General Process Engineering | Process repeatability & statistical control | 1 (Initial) $\rightarrow$ 5 (Optimizing) | Program-wide generic scale |
| **C2M2 v2.1** | Enterprise Cybersecurity Program | Capability indicator levels across 10 domains | MIL1 (Initiated) $\rightarrow$ MIL3 (Managed) | Granular domain-by-domain evaluation |
| **OWASP SAMM v2** | Software Security Program | Software assurance practice maturity | Level 0 (Unperformed) $\rightarrow$ Level 3 (Optimized) | Independent scoring across 15 practices |
| **CIS Controls IGs** | Technical Control Safeguards | Resource capacity & risk exposure | IG1 (Hygiene) $\rightarrow$ IG3 (High Assurance) | Single tier assigned program-wide |
| **NIST CSF Tiers** | Risk Governance Integration | Integration of cyber risk into corporate governance | Tier 1 (Partial) $\rightarrow$ Tier 4 (Adaptive) | Program-wide governance integration |
| **SLSA v1.0** | Software Supply Chain Build Pipeline | Tamper-resistance & build provenance | Build Level 0 (None) $\rightarrow$ Level 3 (Hardened) | Specific to build & release pipelines |

## CMMI: The Foundational 5-Level Maturity Archetype

The 5-level maturity scale derived from the **Capability Maturity Model Integration (CMMI)** forms the foundational architecture for domain-specific security maturity models:

<div class="diagram-frame">
  <img src="{{ '/assets/img/cmmi-maturity-levels.svg' | relative_url }}" alt="Five maturity levels from Initial through Managed, Defined, Quantitatively Managed, and Optimizing.">
  <p class="diagram-caption">Maturity moves from ad hoc practice to measured continuous improvement</p>
</div>

1. **Level 1 (Initial)**: Practices are ad hoc, undocumented, and dependent on individual heroism.
2. **Level 2 (Managed)**: Basic project-level discipline exists; processes are planned and tracked.
3. **Level 3 (Defined)**: Processes are documented, standardized, and integrated across the enterprise.
4. **Level 4 (Quantitatively Managed)**: Process performance is measured statistically against quantitative quality goals.
5. **Level 5 (Optimizing)**: Continuous process improvement is driven by statistical feedback and root-cause analysis.

## C2M2: Department of Energy Capability Model

Developed by the U.S. Department of Energy, the **[Cybersecurity Capability Maturity Model (C2M2)](https://www.energy.gov/ceser/cybersecurity-capability-maturity-model-c2m2)** evaluates practices across 10 security domains using three **Maturity Indicator Levels (MILs)**:

- **MIL1 (Initiated)**: Initial practices are performed, but remain ad hoc or inconsistently documented.
- **MIL2 (Performed)**: Practices are executed consistently according to documented procedures and policies.
- **MIL3 (Managed)**: Practices are actively monitored, measured, and continuously improved using quantitative metrics.

An organization can operate at MIL3 in Incident Response while remaining at MIL1 in Third-Party Risk Management. This domain-level breakdown identifies precise investment targets.

## OWASP SAMM: Software Assurance Maturity Model

**[OWASP SAMM](https://owaspsamm.org/about/)** evaluates an engineering organization's software security practices across 5 business functions comprising 15 security practices:

<div class="diagram-frame">
  <img src="{{ '/assets/img/owasp-samm-functions.svg' | relative_url }}" alt="OWASP SAMM business functions: Governance, Design, Implementation, Verification, and Operations.">
  <p class="diagram-caption">SAMM covers software assurance practices across the product lifecycle</p>
</div>

Each practice is scored independently from **Level 0** (unperformed) to **Level 3** (fully automated & optimized). SAMM does not mandate Level 3 maturity across all practices; organizations define target levels based on application risk profiles.

## CIS Implementation Groups: Resource-Tiered Baselines

Unlike C2M2 or SAMM, **[CIS Implementation Groups](https://www.cisecurity.org/controls/implementation-groups)** index safeguards according to organizational resources and threat exposure:

<div class="diagram-frame">
  <img src="{{ '/assets/img/cis-implementation-groups.svg' | relative_url }}" alt="CIS Controls implementation groups IG1, IG2, and IG3 as cumulative safeguard baselines.">
  <p class="diagram-caption">Each implementation group builds on the safeguards below it</p>
</div>

- **IG1**: Essential cyber hygiene required for all organizations regardless of size.
- **IG2**: Expanded safeguard coverage for enterprise environments managing sensitive customer data.
- **IG3**: Full 153-safeguard baseline protecting critical infrastructure against advanced persistent threats (APTs).

## NIST CSF Tiers: Governance Integration, Not Maturity

NIST CSF 2.0 defines four **Implementation Tiers**: **Tier 1 (Partial)**, **Tier 2 (Risk Informed)**, **Tier 3 (Repeatable)**, and **Tier 4 (Adaptive)**.

NIST explicitly clarifies that CSF Tiers are **not** a maturity level. Tiers measure how deeply cybersecurity risk management is integrated into broader corporate governance and how actively threat intelligence is shared externally. An organization operating at Tier 2 may maintain robust technical controls while deliberately keeping risk governance informal.

## SLSA: Software Supply Chain Build Integrity Levels

The **[SLSA Framework](https://slsa.dev/spec/v1.0/levels)** defines four build integrity levels specifically for software supply chains:

- **Build Level 0**: Unmanaged build process with no provenance or integrity guarantees.
- **Build Level 1**: Automated build script generates provenance data detailing build sources.
- **Build Level 2**: Build runs on an isolated, hosted platform generating cryptographically signed provenance.
- **Build Level 3**: Build platform enforces hermetic build isolation and protects signing keys against tampering.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Security Maturity Summary</strong>
    <ul>
      <li><strong>OWASP SAMM 2.0</strong>: Evaluates software security across Governance, Design, Implementation, Verification, and Operations (Levels 1–3).</li>
      <li><strong>BSIMM Framework</strong>: Descriptive model benchmarking software security practices against real-world industry observations.</li>
      <li><strong>CMMI Levels</strong>: Level 1 (Initial/Ad-hoc) to Level 5 (Optimizing/Continuous Improvement).</li>
    </ul>
  </div>
</div>

## Primary References

- **OWASP SAMM v2.0**: *Software Assurance Maturity Model* — [OWASP SAMM](https://owaspsamm.org/)
- **BSIMM14**: *Building Security In Maturity Model* — [BSIMM Official](https://www.bsimm.com/)
