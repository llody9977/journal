---
title: "Security Maturity Models"
description: Technical reference for CMMI, C2M2, OWASP SAMM, BSIMM, CIS Implementation Groups, SLSA Build track levels, and NIST CSF Tiers, and which scale answers which question.
permalink: /topics/security-maturity-models/
last_verified: 2026-08-15
---

<span class="eyebrow">Governance, Risk & Compliance / Deep Dive</span>

# Security Maturity Models

<p class="lede">Security maturity models evaluate the consistency, repeatability, governance integration, and continuous improvement of an organization's security practices. Measuring maturity requires selecting the appropriate model for the scope: broad process maturity (CMMI), domain-specific capability (C2M2), software supply chain integrity (SLSA), application security practice growth (OWASP SAMM), peer benchmarking against observed practice (BSIMM), or resource-tiered safeguard baselines (CIS Implementation Groups). NIST CSF Tiers sit alongside these without being a maturity scale at all.</p>

## The Security Maturity Model Comparison Matrix

| Model | Target Scope | Metric Base | Maturity Levels | Domain Granularity |
|---|---|---|---|---|
| **CMMI v3.0** | General Process Engineering | Process repeatability & statistical control | 1 (Initial) &rarr; 5 (Optimizing) | Program-wide generic scale |
| **C2M2 v2.1** | Enterprise Cybersecurity Program | Capability indicator levels across 10 domains | MIL1 (Initiated) &rarr; MIL3 (Managed) | Granular domain-by-domain evaluation |
| **OWASP SAMM v2** | Software Security Program | Software assurance practice maturity | Level 0 (no activity) &rarr; Level 3 (mastery at scale) | Independent scoring across 15 practices |
| **CIS Controls IGs** | Technical Control Safeguards | Resource capacity & risk exposure | IG1 (Hygiene) &rarr; IG3 (High Assurance) | Single tier assigned program-wide |
| **NIST CSF Tiers** | Risk Governance Integration | Integration of cyber risk into corporate governance | Tier 1 (Partial) &rarr; Tier 4 (Adaptive) | Program-wide governance integration |
| **SLSA v1.2** | Software Supply Chain | Tamper-resistance & build provenance | Build track L0 (None) &rarr; L3 (Hardened); a separate Source track was approved in v1.2 | Per-track, not a single program-wide score |

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
- **MIL3 (Managed)**: Practices are governed by policy, deliberately resourced and staffed, with responsibilities assigned and effectiveness evaluated — institutionalized rather than merely repeatable. Note that this is an institutionalization bar, not the statistical-control bar that CMMI Level 4 sets; the two scales are not interchangeable at the same number.

An organization can operate at MIL3 in Incident Response while remaining at MIL1 in Third-Party Risk Management. This domain-level breakdown identifies precise investment targets.

## OWASP SAMM: Software Assurance Maturity Model

**[OWASP SAMM](https://owaspsamm.org/about/)** evaluates an engineering organization's software security practices across 5 business functions comprising 15 security practices:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/owasp-samm-functions.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the owasp samm functions diagram at full size">
    <img src="{{ '/assets/img/owasp-samm-functions.svg' | relative_url }}" alt="OWASP SAMM's five business functions, each listing its three security practices. Governance: strategy and metrics, policy and compliance, education and guidance. Design: threat assessment, security requirements, security architecture. Implementation: secure build, secure deployment, defect management. Verification: architecture assessment, requirements testing, security testing. Operations: incident management, environment management, operational management.">
  </a>
  <p class="diagram-caption">Fifteen practices across five functions, each scored on its own — not a sequence</p>
</div>

Each practice is scored independently. SAMM's own [benchmark documentation](https://owaspsamm.org/benchmark/benchmark-report/) describes the four levels as **Level 0**, no activity or focus on application security for that practice; **Level 1**, initial understanding and ad-hoc implementation; **Level 2**, increased efficiency and effectiveness in executing it; and **Level 3**, comprehensive mastery and implementation of the practice at scale. SAMM does not give these levels names, so labels borrowed from CMMI — "optimizing", "unperformed" — are not SAMM's and tend to import the wrong bar: Level 3 is about coverage and effectiveness at scale, not about automation or statistical control. SAMM does not mandate Level 3 across all practices; organizations define target levels based on application risk profiles.

Building Security In Maturity Model (**[BSIMM](https://www.blackduck.com/services/security-program/bsimm-maturity-model.html)**) covers similar ground from a different direction: instead of prescribing target practices like SAMM, BSIMM is a descriptive, data-driven benchmark built by observing and aggregating the security activities actually performed at a large set of real firms. It answers "what do comparable organizations do," while SAMM answers "what should this organization do next."

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

CSF 2.0 does not present the Tiers as a maturity scale. It says they "characterize the rigor of an organization's cybersecurity risk governance and management practices" and describe "a progression from informal, ad hoc responses to approaches that are agile, risk-informed, and continuously improving." The explicit disclaimer belongs to the previous edition: **CSF 1.1** stated that Tiers "do not necessarily represent maturity levels," and that sentence was dropped in 2.0 rather than restated. Treating the Tiers as a maturity ladder remains a misreading either way, but it is worth citing the right edition for it.

Each Tier carries **two** separate descriptions: **Cybersecurity Risk Governance**, corresponding to the Govern Function, and **Cybersecurity Risk Management**, covering the other five Functions. CSF 1.1's Tiers had a third element, *External Participation*, covering how actively an organization shared information outside itself; CSF 2.0 removed it as a separate Tier dimension, so a description of the Tiers built around external threat-intelligence sharing is describing the 1.1 model. An organization operating at Tier 2 may maintain robust technical controls while deliberately keeping risk governance informal.

## SLSA: Software Supply Chain Build Integrity Levels

The **[SLSA Framework (v1.2)](https://slsa.dev/spec/v1.2/about)** defines Build track levels specifically for software supply chains:

- **Build L0**: No requirements — unmanaged build process with no provenance or integrity guarantees.
- **Build L1**: Requires provenance to exist and be distributed. The build platform is not yet required to be hosted — it may be an individual's workstation — and the provenance need not be authenticated. This level does not require the build itself to run from an automated script (that producer requirement was removed in the v1.0 specification).
- **Build L2**: Adds two requirements on top of L1: the provenance must be authentic and verifiable (SLSA recommends, but does not mandate, a digital signature as the mechanism), and all build steps must run on a hosted build platform — shared or dedicated infrastructure, not an individual's workstation.
- **Build L3**: Requires the build platform isolate build steps from unintended external influence and protect signing keys against tampering — this is narrower than a fully hermetic (network-isolated) build, which SLSA treats as a separate, future-direction property.

The **v1.x** specifications replaced the earlier v0.1 numeric 1–4 scale with this track-based scheme; v1.2 itself is the release that **approved a second track**, the Source track, covering how source revisions are authored, reviewed, and managed. Build Environment and Dependency tracks remain in development. So "SLSA level" alone is ambiguous in two directions at once — across specification versions and across tracks — and a compliance statement should name both, for example `SLSA Build L3 (v1.2)`. This page covers the Build track; see **[SLSA &amp; Build Provenance Attestations]({{ '/topics/slsa-provenance-attestation/' | relative_url }})** for the provenance schema and verification detail.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>OWASP SAMM and CMMI are prescriptive maturity scales measuring how mature a program's practices are; BSIMM is descriptive, benchmarking against what real organizations actually do rather than defining a target state. SLSA's Build track (L0–L3) is a separate, build-integrity-specific model rather than a general maturity scale, and NIST CSF Tiers are not a maturity scale at all. The same number means a different thing on each scale, so always name the model, the track where one exists, and the version.</p>
</div>

## Primary references

- **OWASP SAMM v2.0**: *Software Assurance Maturity Model* — [OWASP SAMM](https://owaspsamm.org/) — verified the 5 business functions, 15 practices, and the Level 0–3 descriptions.
- **BSIMM16**: *Building Security In Maturity Model* — [BSIMM Official](https://www.blackduck.com/services/security-program/bsimm-maturity-model.html) — the current edition, published February 2026; verified BSIMM's descriptive, observation-based construction.
- **SLSA v1.2**: *Supply-chain Levels for Software Artifacts* — [SLSA Official](https://slsa.dev/spec/v1.2/about) and [Build track requirements](https://slsa.dev/spec/v1.2/build-requirements) — verified the L0–L3 requirements, that authenticity "SHOULD" use a digital signature rather than mandating one, and that hermetic builds are a future direction rather than an L3 requirement.
- **SLSA v1.2 change summary** — [What's new](https://slsa.dev/spec/v1.2/whats-new) — verified that v1.2's headline change is the approved Source track.
- **CMMI V3.0**: *Model Quick Reference Guide* — [ISACA](https://www.isaca.org/resources/reference-guide/cmmi-model-quick-reference-guide)
- **DOE C2M2 v2.1**: *Cybersecurity Capability Maturity Model* — [C2M2](https://www.energy.gov/ceser/cybersecurity-capability-maturity-model-c2m2) — verified the 10 domains and the MIL1–MIL3 definitions.
- **NIST SP 1302**: *Quick-Start Guide for Using the CSF Tiers* — [NIST CSRC](https://csrc.nist.gov/pubs/sp/1302/final) — verified that each Tier has separate Cybersecurity Risk Governance and Cybersecurity Risk Management descriptions.
- **NIST Cybersecurity Framework 2.0**: *CSWP 29* — [NIST CSF 2.0](https://doi.org/10.6028/NIST.CSWP.29) — verified the section 3.2 wording on what the Tiers characterize.
