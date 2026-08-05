---
title: "Security Maturity Models"
description: C2M2, OWASP SAMM, CIS Controls Implementation Groups, and why NIST is explicit that CSF Tiers are not a maturity scale — what "maturity" actually means per framework.
permalink: /topics/security-maturity-models/
last_verified: 2026-07-28
---

<span class="eyebrow">Governance, Risk & Compliance / Deep Dive</span>

# Security Maturity Models

<p class="lede">"What's our security maturity level?" gets asked a lot, and it's rarely clear which of several genuinely different scoring systems the question means — a program-wide capability score, an AppSec-practice score, a resource-tiering system, or a governance-rigor scale that NIST specifically warns people not to read as maturity at all. The <a href="{{ '/topics/cybersecurity-standards/' | relative_url }}">Cybersecurity Standards</a> page covers what each framework is; this page covers how — or whether — each one actually measures maturity.</p>

## CMMI: the generic ancestor every domain-specific model borrows from

The 5-level pattern that shows up, in some rephrased form, across nearly every maturity model in this space traces back to the **Capability Maturity Model** lineage — originally a software-process model, now maintained by ISACA after its 2016 acquisition of the CMMI Institute:

1. **Initial** — practices are ad hoc, undocumented, and depend on specific individuals rather than a repeatable process.
2. **Managed** — basic project-level discipline exists; practices are planned and tracked, but not standardized across the organization.
3. **Defined** — practices are documented, standardized, and applied consistently across the organization, not just within individual teams.
4. **Quantitatively Managed** — practices are measured with actual metrics, and performance is managed statistically against those measurements.
5. **Optimizing** — the organization actively improves practices based on quantitative feedback, treating the process itself as something to keep refining.

CMMI itself is general-purpose (it started in software engineering process improvement, not security specifically), which is exactly why it's the ancestor rather than a direct competitor to the domain-specific models below: C2M2's three MILs and SAMM's three levels are both narrower, security-specific descendants of this same underlying idea — score a practice by how *consistent, documented, measured,* and *actively improved* it is, independent of which specific controls it happens to implement.

## C2M2: maturity indicator levels across ten domains

The Department of Energy's [Cybersecurity Capability Maturity Model](https://www.energy.gov/ceser/cybersecurity-capability-maturity-model-c2m2) is the clearest example of a genuine maturity model in this space: it scores practices across ten domains (Asset Management, Cybersecurity Architecture, Program Management, Incident Response, Identity and Access Management, Risk Management, Situational Awareness, Third-Party Risk, Threat and Vulnerability Management, Workforce Management) against three **Maturity Indicator Levels**:

- **MIL1 (Initiated)** — practices are performed, but ad hoc, not yet consistent or documented.
- **MIL2 (Performed)** — practices are executed consistently, with documented procedures.
- **MIL3 (Managed)** — practices are actively monitored, measured, and continuously improved.

An organization can sit at different MILs in different domains simultaneously — strong incident response, immature third-party risk management — and that unevenness is itself the useful signal, not a flaw in the model. Originally built with electricity, oil, and gas operators, C2M2 is explicitly usable by any sector and is now applied well beyond energy.

## OWASP SAMM: maturity of the *practice*, not the *product*

[SAMM](https://owaspsamm.org/about/) scores 15 security practices, grouped into 5 business functions, each independently on a 3-level maturity scale — "the activities on a lower maturity level are typically easier to execute and require less formalization than the ones on a higher maturity level." Critically, SAMM is scoring the organization's *software security program* (does secure design review happen, is there a threat-modeling practice, is dependency management systematic), not any one application's code — that's [ASVS's]({{ '/topics/cybersecurity-standards/' | relative_url }}#owasps-three-and-how-theyre-not-the-same-thing) job. And SAMM deliberately doesn't push every organization toward maximum maturity everywhere: "each organization can determine the target maturity level for each Security Practice that is the best fit" — a startup shipping fast may reasonably target SAMM level 1 in some practices and level 3 in others, rather than uniformly maxing out the model.

## CIS Controls Implementation Groups: maturity by proxy, tiered by resources

[IG1/IG2/IG3](https://www.cisecurity.org/controls/implementation-groups) aren't labeled a maturity model, but they function as one in practice: IG1 is "essential cyber hygiene... every enterprise should apply," IG2 layers on more safeguards for organizations with greater resources or risk exposure, and IG3 is the complete 153-safeguard set. The difference from C2M2/SAMM is what the tiers are indexed to — C2M2 and SAMM measure *how well* a practice is executed; CIS Implementation Groups are explicitly framed around *how much an organization can reasonably take on*, based on "the risk profile and resources an enterprise has available." IG1 is frequently used as exactly the concrete floor a resource-constrained team needs, independent of any broader maturity claim.

## NIST CSF Tiers: not a maturity model, on purpose

CSF's four Tiers — Partial, Risk Informed, Repeatable, Adaptive — describe "the degree to which an organization's cybersecurity risk management practices exhibit the characteristics defined in the Framework," and specifically how well cybersecurity risk decisions are integrated into the organization's *broader* risk management, and how much it shares/receives threat information externally. NIST is explicit that this is not the same thing as a maturity level: Tiers describe the rigor and integration of governance and risk-management *practices*, not how completely any given Function or Category has been implemented. An organization can be "Adaptive" (Tier 4) — highly integrated, continuously improving risk governance — while still choosing, deliberately and appropriately for its risk appetite, not to implement every possible Protect/Detect control. Conflating "Tier" with "maturity score" is the single most common misreading of CSF, and it leads organizations to chase a higher Tier number as if it were a completeness percentage, which is not what the Tier is measuring.

## SLSA: a maturity model for the software supply chain

[SLSA](https://slsa.dev/spec/v1.0/levels) (Supply-chain Levels for Software Artifacts) applies the exact same "levels of rigor" idea to a much narrower question: can a specific build artifact be trusted, and can its origin be verified? Its Build track runs L0 → L3:

- **L0 (no guarantees)** — an unmanaged, single-machine build; nothing about how the artifact was produced is recorded.
- **L1 (provenance exists)** — the build process is at least consistent and produces provenance documentation, though it's "trivial to bypass or forge."
- **L2 (hosted build platform)** — builds run on a hosted platform that generates and signs the provenance itself, so the record can't just be hand-edited after the fact.
- **L3 (hardened builds)** — the build platform isolates each run and protects its own signing secrets, preventing tampering *during* the build, not just detecting it afterward.

This is the piece that directly answers "what does maturity even mean for SBOM/package/CI-CD security" — SLSA is that model, purpose-built for one narrow slice of the program (build integrity) rather than the whole security posture. The full picture — SBOMs, dependency risk, and CI/CD pipeline security more broadly — is covered on the [Software Supply Chain Security]({{ '/topics/software-supply-chain-security/' | relative_url }}#slsa-levels-of-build-integrity) page.

## Comparing the five

| | What it measures | Levels | Applies per-domain/practice? |
|---|---|---|---|
| CMMI | General process discipline (any domain) | Initial → Optimizing | No — one scale, applied generically |
| C2M2 | How well a security domain's practices are executed | MIL1 → MIL3 | Yes, per domain |
| OWASP SAMM | How mature the organization's *software security program* is | 0 → 3, per practice | Yes, per practice |
| CIS Controls IGs | How much of the prioritized control set is implemented, tiered by resources | IG1 → IG3 | No — one tier for the whole program |
| NIST CSF Tiers | Rigor/integration of risk *governance*, not completeness | Partial → Adaptive | No — one tier for the whole program |
| SLSA | Whether a build's provenance can be trusted | L0 → L3 | Applies to build/release pipelines specifically, not the whole program |

## Common pitfalls

- **Reporting a single "our maturity is 3.2" number without saying against which model** — the number is meaningless without naming C2M2, SAMM, or whichever scale produced it; they measure different things entirely.
- **Chasing a higher NIST CSF Tier as if it were a completion percentage** — it isn't one, and a Tier upgrade with no matching change in actual risk-informed decision-making is exactly the mistake NIST is warning against.
- **Assuming CIS Implementation Groups measure execution quality** — IG level says "how much of the list applies to you," not "how well you're doing the parts you've adopted"; a team can be fully IG1-compliant and still be executing IG1 controls poorly.
- **Applying one target maturity level uniformly across every SAMM practice** — SAMM is explicitly designed to allow uneven, prioritized targets; forcing uniformity wastes effort on low-priority practices.
- **Treating SLSA L3 as "our whole supply chain is secure"** — SLSA levels a build pipeline's tamper-resistance specifically; they say nothing about whether the dependencies going into that build are themselves trustworthy, which is a separate SBOM/dependency-risk question.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><a href="https://cmmiinstitute.com/">CMMI</a> (ISACA). <a href="https://www.energy.gov/ceser/cybersecurity-capability-maturity-model-c2m2">C2M2</a> (U.S. Department of Energy). <a href="https://owaspsamm.org/about/">OWASP SAMM</a>. <a href="https://www.cisecurity.org/controls/implementation-groups">CIS Controls Implementation Groups</a>. <a href="https://www.nist.gov/cyberframework">NIST CSF 2.0</a> Tiers. <a href="https://slsa.dev/spec/v1.0/levels">SLSA v1.0</a>.</p>
</div>
