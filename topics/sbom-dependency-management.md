---
title: Software Bill of Materials (SBOM) & VEX
description: Technical reference for Software Bill of Materials standards, the NTIA 2021 and CISA 2026 minimum elements, SPDX vs CycloneDX schemas, Package URLs (purl), and Vulnerability Exploitability eXchange (VEX).
permalink: /topics/sbom-dependency-management/
last_verified: 2026-08-14
---

<span class="eyebrow">Software Supply Chain Security / Component Assurance</span>

# Software Bill of Materials (SBOM) & VEX

<p class="lede">A modern software artifact rarely consists solely of proprietary code; it is an assembly of open-source libraries, third-party frameworks, and transitively inherited dependencies. A Software Bill of Materials (SBOM) provides a machine-readable inventory of software components and their supply-chain relationships. However, possession of an SBOM alone does not equal vulnerability management—actionable remediation requires continuous vulnerability correlation and Vulnerability Exploitability eXchange (VEX) status assertions.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/sbom-vulnerability-management.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the SBOM and VEX architecture diagram at full size">
    <img src="{{ '/assets/img/sbom-vulnerability-management.svg' | relative_url }}" alt="Three panels. Minimum elements and formats: NTIA 2021 covers seven data fields plus automation support and practices, the CISA 2026 elements update and replace that baseline, and the two formats are SPDX (ISO) and CycloneDX (Ecma ECMA-424). VEX: four statuses, five defined justifications for a not-affected assertion, carried by CSAF VEX, OpenVEX, or CycloneDX VEX. Package URLs and automation: purl syntax, per-build generation, and continuous correlation against OSV and NVD.">
  </a>
  <p class="diagram-caption">SBOM and VEX architecture: minimum-element baselines, SPDX and CycloneDX formats, purl identifiers, and exploitability assertions</p>
</div>

## Minimum elements: the NTIA 2021 baseline and its CISA 2026 replacement

In response to Executive Order 14028, the National Telecommunications and Information Administration (NTIA) published the **2021 Minimum Elements for an SBOM**. Its seven **data fields** are the part most often quoted:

1. **Supplier name**: organization or author creating the software component.
2. **Component name**: standardized title of the library or module.
3. **Component version**: precise build or semantic version tag.
4. **Other unique identifiers**: Package URL (`purl`), CPE (Common Platform Enumeration), or cryptographic hash.
5. **Dependency relationship**: explicit graph mapping showing direct and transitive relationships (*e.g. component A depends on component B*).
6. **SBOM author**: entity or tool generating the SBOM metadata record.
7. **Timestamp**: date and time of SBOM generation.

Those seven fields are one of **three** NTIA elements, not the whole baseline. The other two are **automation support** (expressing the data in predictable, machine-readable formats so it scales across organizational boundaries) and **practices and processes** (how SBOMs are requested, generated, distributed, and updated). Shipping all seven fields satisfies one element of three.

In July 2026, CISA, the NSA, the FBI, and international partners published the **2026 Minimum Elements for a Software Bill of Materials**, which updates and replaces the NTIA 2021 baseline. The material changes:

- **Component hash value** and **hash algorithm** move from recommended to required.
- **Component license** is promoted from optional to a core field.
- **"Supplier name" becomes "component producer"**, and **"depth" becomes "coverage."**
- New document-level fields describe the SBOM itself: author signature, tool name and version, data format name and version, and the lifecycle phase at which it was generated (**generation context**).
- Missing data must be **explicitly marked** as unknown, redacted, or not applicable rather than silently omitted.

Both CycloneDX and SPDX provide native fields for nearly all of these, though the mapping differs by format.

## SPDX vs. CycloneDX format comparison

Two open standards dominate industry adoption, originating from distinct engineering requirements. Both are now published international standards, through different bodies:

| Dimension | SPDX (Linux Foundation / ISO) | CycloneDX (OWASP / Ecma) |
|---|---|---|
| **Origin & governance** | Linux Foundation project (2010). SPDX 2.2.1 was standardized as ISO/IEC 5962:2021; the current specification is 3.0.1, which is not yet the ISO-published version (ISO/IEC DIS 5962 is in progress). | OWASP Foundation project (2017). CycloneDX 1.6 was standardized as **ECMA-424** (2024), with a 2nd edition adopted in December 2025. Maintained jointly by OWASP and Ecma TC54. |
| **Primary design goal** | License compliance, provenance, and IP legal tracking. | Security assurance, vulnerability management, and SBOM/VEX integration. |
| **Vulnerability native support** | Added in SPDX 3.0 via profile extensions (security profile). | Native vulnerability, VEX, and cryptography (CBOM) fields built in. |
| **Primary industry use** | Legal IP compliance, Linux kernel distributions, enterprise IT. | Application security (AppSec), DevSecOps CI/CD pipelines, container scanning. |

Note the version boundary: a requirement that cites "ISO/IEC 5962:2021" is naming SPDX 2.2.1 specifically, not the 3.x line.

## Package URLs (purl) & universal identification

To eliminate ambiguity across ecosystem package managers (*e.g. distinguishing a Python `requests` package from an npm `requests` package*), SBOMs rely on **Package URLs (purl)**:

<p class="formula"><code>pkg:type/namespace/name@version?qualifiers#subpath</code></p>

<p class="formula">Example: <code>pkg:npm/%40angular/core@16.2.0</code></p>

The npm scope `@` prefix is always percent-encoded as `%40`, which leaves exactly one literal `@` in the string — unambiguously the version separator. Package URLs provide a standardized string scheme for identifying software packages across heterogeneous ecosystems (npm, PyPI, Maven, Cargo, Go, Debian, RPM).

## Vulnerability Exploitability eXchange (VEX)

Scanning an SBOM against vulnerability databases (NVD, OSV) often yields dozens of CVE matches, leading to false-positive noise. A component may be present in the binary but its vulnerable code paths are never called or reachable.

**VEX (Vulnerability Exploitability eXchange)** is a class of machine-readable assertion that lets a software producer publish an authoritative exploitability status for a specific CVE in a specific product. It is not a single file format: the same statuses and justifications are carried by **CSAF VEX**, **OpenVEX**, and **CycloneDX VEX**. Choose the format your consumers' tooling already ingests.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/vex-triage-flow.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the VEX triage flow diagram at full size">
    <img src="{{ '/assets/img/vex-triage-flow.svg' | relative_url }}" alt="A pipeline runs left to right: an SBOM component identified by a Package URL is correlated against OSV and NVD, producing a CVE candidate, which is looked up in the supplier's VEX statement. Four outcome rows follow: NOT_AFFECTED suppresses the finding and must carry one of five justifications; AFFECTED requires remediation; FIXED requires checking the deployed version; UNDER_INVESTIGATION is a temporary hold. A footer notes VEX is carried by CSAF VEX, OpenVEX, and CycloneDX VEX, and that a suppression is only as good as the supplier's analysis.">
  </a>
  <p class="diagram-caption">One CVE match against one SBOM component, and how each VEX status resolves it</p>
</div>

### The four VEX statuses

1. `NOT_AFFECTED`: the vulnerability is present in a component, but the product is **not affected**. A statement carrying this status must supply one of five defined justifications:
   - `component_not_present`
   - `vulnerable_code_not_present`
   - `vulnerable_code_not_in_execute_path`
   - `vulnerable_code_cannot_be_controlled_by_adversary`
   - `inline_mitigations_already_exist`
2. `AFFECTED`: the product is exploitable; the statement should carry an action statement describing the required remediation.
3. `FIXED`: a patched release exists. Confirm the version actually deployed is at or above it before closing the finding.
4. `UNDER_INVESTIGATION`: the producer is still analyzing. This is a temporary state, not an outcome — re-query it, and treat a stale one as unresolved rather than benign.

These status values and justification identifiers are consumed programmatically by deployment policy, so they must be written exactly as spelled above; a near-miss string silently matches nothing.

## What an SBOM does not tell you

An SBOM is an inventory produced at one moment by one tool, and its limitations matter as much as its contents:

- **Generation phase changes the answer.** A build-time SBOM sees the dependency resolver's view; a binary-analysis SBOM sees what actually shipped, including vendored and statically linked code the manifest never listed. The two disagree routinely. This is why the CISA 2026 elements record generation context and renamed "depth" to "coverage."
- **Transitive depth varies by ecosystem.** Lock-file ecosystems yield near-complete graphs; C and C++ builds frequently do not, and system libraries pulled from a base image are often absent entirely.
- **An identifier is not a match.** Correlation quality depends on whether components carry a `purl` or CPE that the vulnerability database recognizes. Unmatched components produce silent false negatives, which are invisible in a way false positives are not.
- **A VEX suppression is only as good as the producer's analysis.** An incorrect `NOT_AFFECTED` hides a real exposure indefinitely, and consumers have no independent way to check the reasoning behind it.
- **An SBOM is a snapshot.** It describes the artifact as built. It says nothing about what has been discovered since, which is why the correlation step belongs on a schedule rather than only at release time.

## SBOM & VEX diagnostic checklist

The checklist below is a journal working model, not a published audit standard. When implementing an SBOM and component management program, evaluate these six criteria:

| Diagnostic area | Architectural evaluation question | Verification &amp; audit evidence |
|---|---|---|
| **Minimum-element coverage** | Does the generated SBOM carry the current CISA 2026 field set, including component hash, hash algorithm, and license? | Sample SBOM validated field-by-field against the 2026 element list. |
| **Continuous generation** | Is a fresh, build-specific SBOM generated automatically during every CI/CD pipeline run? | CI/CD build scripts &amp; SBOM storage repository logs. |
| **Package URL standard** | Are all software components identified using standardized Package URLs (`purl`)? | SBOM inspection for `purl` fields, plus the unmatched-component rate. |
| **VEX processing** | Is an automated VEX ingestion pipeline deployed, and does it validate status and justification strings against the defined sets? | VEX document integration &amp; SIEM/AppSec alert logs. |
| **Format standardization** | Is the SBOM exported in a standardized machine-readable schema (SPDX 2.3/3.0.1 or CycloneDX 1.6/1.7)? | CI/CD tool flags (`syft -o cyclonedx-json`). |
| **Transitive graph coverage** | Does the SBOM capture full transitive dependency graphs rather than direct dependencies alone, and is its coverage limit recorded? | Dependency graph verification tests &amp; recorded generation context. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>An SBOM is a machine-readable component inventory; the CISA 2026 minimum elements now replace the NTIA 2021 baseline and require hashes and licenses. SPDX (ISO) leans to license compliance, CycloneDX (ECMA-424) to AppSec. Pair SBOMs with VEX assertions — four statuses, five exact justification strings — to remove non-exploitable CVE matches from the queue.</p>
</div>

## Primary references

- **[2026 Minimum Elements for a Software Bill of Materials (SBOM)](https://www.cisa.gov/resources-tools/resources/2026-minimum-elements-software-bill-materials-sbom)** — CISA/NSA/FBI joint guidance that updates and replaces the NTIA 2021 baseline; verified the new and revised data fields.
- **[NTIA Minimum Elements for an SBOM (2021)](https://www.ntia.gov/report/2021/minimum-elements-software-bill-materials-sbom)** — verified the seven data fields and the three-element structure of the original baseline.
- **[OpenVEX specification](https://github.com/openvex/spec/blob/main/OPENVEX-SPEC.md)** — verified the four status values and the five `not_affected` justification identifiers exactly as spelled.
- **[CycloneDX specification](https://cyclonedx.org/)** — verified format capabilities and ECMA-424 standardization status.
- **[Package URL specification](https://github.com/package-url/purl-spec)** — verified purl syntax and the npm scoped-package encoding.
