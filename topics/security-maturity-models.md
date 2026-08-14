---
title: "Security Maturity Models"
description: Comprehensive analysis of CMMI, C2M2, OWASP SAMM, CIS Implementation Groups, SLSA levels, and NIST CSF Tiers.
permalink: /topics/security-maturity-models/
last_verified: 2026-08-12
---

<span class="eyebrow">Governance, Risk & Compliance / Deep Dive</span>

# Security Maturity Models

<p class="lede">Security maturity models evaluate the consistency, repeatability, governance integration, and continuous improvement of an organization's security practices. Measuring maturity requires selecting the appropriate model for the scope: broad process maturity (CMMI), domain-specific capability (C2M2), software supply chain integrity (SLSA), application security practice growth (OWASP SAMM), or resource-tiered safeguard baselines (CIS Implementation Groups).</p>

## The Security Maturity Model Comparison Matrix

| Model | Target Scope | Metric Base | Maturity Levels | Domain Granularity |
|---|---|---|---|---|
| **CMMI v3.0** | General Process Engineering | Process repeatability & statistical control | 1 (Initial) &rarr; 5 (Optimizing) | Program-wide generic scale |
| **C2M2 v2.1** | Enterprise Cybersecurity Program | Capability indicator levels across 10 domains | MIL1 (Initiated) &rarr; MIL3 (Managed) | Granular domain-by-domain evaluation |
| **OWASP SAMM v2** | Software Security Program | Software assurance practice maturity | Level 0 (Unperformed) &rarr; Level 3 (Optimized) | Independent scoring across 15 practices |
| **CIS Controls IGs** | Technical Control Safeguards | Resource capacity & risk exposure | IG1 (Hygiene) &rarr; IG3 (High Assurance) | Single tier assigned program-wide |
| **NIST CSF Tiers** | Risk Governance Integration | Integration of cyber risk into corporate governance | Tier 1 (Partial) &rarr; Tier 4 (Adaptive) | Program-wide governance integration |
| **SLSA v1.2** | Software Supply Chain Build Pipeline | Tamper-resistance & build provenance | Build Level L0 (None) &rarr; L3 (Hardened) | Specific to build & release pipelines |

## CMMI: The Foundational 5-Level Maturity Archetype

The 5-level maturity scale derived from the **Capability Maturity Model Integration (CMMI)** forms the foundational architecture for domain-specific security maturity models:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/cmmi-maturity-levels.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the cmmi maturity levels diagram at full size">
    <img src="{{ '/assets/img/cmmi-maturity-levels.svg' | relative_url }}" alt="Five maturity levels from Initial through Managed, Defined, Quantitatively Managed, and Optimizing.">
  </a>
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

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/owasp-samm-functions.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the owasp samm functions diagram at full size">
    <img src="{{ '/assets/img/owasp-samm-functions.svg' | relative_url }}" alt="OWASP SAMM business functions: Governance, Design, Implementation, Verification, and Operations.">
  </a>
  <p class="diagram-caption">SAMM covers software assurance practices across the product lifecycle</p>
</div>

Each practice is scored independently from **Level 0** (unperformed) to **Level 3**. SAMM's own [benchmark documentation](https://owaspsamm.org/benchmark/benchmark-report/) describes Level 3 as comprehensive mastery and implementation of the practice at scale, aimed at maximizing effectiveness through continuous improvement driven by feedback — a broader bar than automation alone. SAMM does not mandate Level 3 maturity across all practices; organizations define target levels based on application risk profiles.

Building Security In Maturity Model (**[BSIMM](https://www.bsimm.com/)**) covers similar ground from a different direction: instead of prescribing target practices like SAMM, BSIMM is a descriptive, data-driven benchmark built by observing and aggregating the security activities actually performed at a large set of real firms. It answers "what do comparable organizations do," while SAMM answers "what should this organization do next."

## CIS Implementation Groups: Resource-Tiered Baselines

Unlike C2M2 or SAMM, **[CIS Implementation Groups](https://www.cisecurity.org/controls/implementation-groups)** index safeguards according to organizational resources and threat exposure:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/cis-implementation-groups.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the cis implementation groups diagram at full size">
    <img src="{{ '/assets/img/cis-implementation-groups.svg' | relative_url }}" alt="CIS Controls implementation groups IG1, IG2, and IG3 as cumulative safeguard baselines.">
  </a>
  <p class="diagram-caption">Each implementation group builds on the safeguards below it</p>
</div>

- **IG1**: Essential cyber hygiene required for all organizations regardless of size.
- **IG2**: Expanded safeguard coverage for enterprise environments managing sensitive customer data.
- **IG3**: Full 153-safeguard baseline protecting critical infrastructure against advanced persistent threats (APTs).

## NIST CSF Tiers: Governance Integration, Not Maturity

NIST CSF 2.0 defines four **Implementation Tiers**: **Tier 1 (Partial)**, **Tier 2 (Risk Informed)**, **Tier 3 (Repeatable)**, and **Tier 4 (Adaptive)**.

NIST explicitly clarifies that CSF Tiers are **not** a maturity level. Tiers measure how deeply cybersecurity risk management is integrated into broader corporate governance and how actively threat intelligence is shared externally. An organization operating at Tier 2 may maintain robust technical controls while deliberately keeping risk governance informal.

## SLSA: Software Supply Chain Build Integrity Levels

The **[SLSA Framework (v1.2)](https://slsa.dev/spec/v1.2/about)** defines Build track levels specifically for software supply chains:

- **Build L0**: No requirements — unmanaged build process with no provenance or integrity guarantees.
- **Build L1**: Requires provenance to exist and be distributed. The build platform is not yet required to be hosted — it may be an individual's workstation — and the provenance need not be authenticated. This level does not require the build itself to run from an automated script (that producer requirement was removed in the v1.0 specification).
- **Build L2**: Adds two requirements on top of L1: the provenance must be authentic and verifiable (SLSA recommends, but does not mandate, a digital signature as the mechanism), and all build steps must run on a hosted build platform — shared or dedicated infrastructure, not an individual's workstation.
- **Build L3**: Requires the build platform isolate build steps from unintended external influence and protect signing keys against tampering — this is narrower than a fully hermetic (network-isolated) build, which SLSA treats as a separate, future-direction property.

SLSA v1.2 replaced the earlier v0.1 numeric 1–4 scale with this track-based L0–L3 Build track scheme; pages that reference SLSA levels should name both the track and version (for example, `SLSA Build L3 (v1.2)`) since "SLSA level" alone is ambiguous across specification versions.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>OWASP SAMM and CMMI are prescriptive maturity scales measuring how mature a program's practices are; BSIMM is descriptive, benchmarking against what real organizations actually do rather than defining a target state. SLSA's Build track (L0–L3, v1.2) is a separate, build-integrity-specific model — not a general maturity scale — and superseded the old numeric 1–4 scheme.</p>
</div>

## Primary references

- **OWASP SAMM v2.0**: *Software Assurance Maturity Model* — [OWASP SAMM](https://owaspsamm.org/)
- **BSIMM14**: *Building Security In Maturity Model* — [BSIMM Official](https://www.bsimm.com/)
- **SLSA v1.2**: *Supply-chain Levels for Software Artifacts* — [SLSA Official](https://slsa.dev/spec/v1.2/about)
- **CMMI V3.0**: *Model Quick Reference Guide* — [ISACA](https://www.isaca.org/resources/reference-guide/cmmi-model-quick-reference-guide)
- **NIST SP 1302**: *Quick-Start Guide for Using the CSF Tiers* — [NIST CSRC](https://csrc.nist.gov/pubs/sp/1302/final)
