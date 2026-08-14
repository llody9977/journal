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
    <img src="{{ '/assets/img/sbom-vulnerability-management.svg' | relative_url }}" alt="Three panels. Minimum elements and formats: NTIA 2021 covers seven data fields plus automation support and practices across three areas; the CISA 2026 elements supersede that baseline with 17 data fields across two areas, adding component hash, algorithm and license, and are stated as what an SBOM should carry rather than must; the two formats are SPDX (ISO) and CycloneDX (Ecma ECMA-424). VEX: four statuses, five defined justifications for a not-affected assertion, carried by CSAF VEX, OpenVEX, or CycloneDX VEX. Package URLs and automation: purl syntax, per-build generation, and continuous correlation against OSV and NVD.">
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

On 29 July 2026, CISA, the NSA, the FBI, and sixteen international partner agencies published the **2026 Minimum Elements for a Software Bill of Materials**. Its own version history records the NTIA 2021 document as version 1.0 of the same lineage and this as version 2.1, so it supersedes rather than supplements the 2021 baseline — while stating that it preserves that document's core principles.

**Read the strength correctly.** The document is written in recommendation voice: "should" appears roughly 150 times, "shall" not at all, and the two uses of "must" are descriptive rather than normative. These are elements an SBOM *should* meet, published as joint guidance. A binding obligation to produce them comes from a contract or a regulation — the EU Cyber Resilience Act, for example — not from this document.

The structure changed. The 2026 elements define **two** areas rather than NTIA's three:

- **Data fields** — the data making up the SBOM document. Appendix A lists **17**, up from NTIA's seven.
- **Practices and processes** — how an entity engages with and documents the SBOM data.

Automation support is no longer a top-level area: it became **machine-processable data** and moved under practices and processes, and SWID tags were dropped from the list of data formats. The standalone **access control** element was removed, absorbed into distribution and delivery.

Ten data fields are new: **component hash value**, **component hash algorithm**, **component license**, and seven describing the SBOM document itself — **SBOM author signature**, **SBOM tool name**, **SBOM tool version**, **SBOM data format name**, **SBOM data format version**, **SBOM version**, and **SBOM generation context** (the lifecycle phase and data available when the SBOM was generated).

Four renames matter when mapping older tooling:

| 2021 NTIA | 2026 |
|---|---|
| Supplier name | **Component producer** |
| Version of the component | **Component version** |
| Author of SBOM data | **SBOM author** |
| Depth | **Coverage** |

Two further changes affect how gaps are read. **Known unknowns** became **explicitly identifying unknown information**: where a data field is not populated, the SBOM author should state whether the value is unknown to them or is being deliberately withheld — the two now mean different things to a recipient. And timestamps should follow **RFC 9557**.

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

purl was standardized by Ecma International as **[ECMA-427](https://ecma-international.org/publications-and-standards/standards/ecma-427/)** in December 2025, and the CISA 2026 elements cite that standard rather than the original repository. Treat ECMA-427 as the authority where a specification reference is needed.

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
| **Minimum-element coverage** | Does the generated SBOM carry the 17 CISA 2026 data fields, including component hash value, hash algorithm, and license? | Sample SBOM validated field-by-field against Appendix A of the 2026 elements. |
| **Continuous generation** | Is a fresh, build-specific SBOM generated automatically during every CI/CD pipeline run? | CI/CD build scripts &amp; SBOM storage repository logs. |
| **Package URL standard** | Are all software components identified using standardized Package URLs (`purl`)? | SBOM inspection for `purl` fields, plus the unmatched-component rate. |
| **VEX processing** | Is an automated VEX ingestion pipeline deployed, and does it validate status and justification strings against the defined sets? | VEX document integration &amp; SIEM/AppSec alert logs. |
| **Format standardization** | Is the SBOM exported in a standardized machine-readable schema (SPDX 2.3/3.0.1 or CycloneDX 1.6/1.7)? | CI/CD tool flags (`syft -o cyclonedx-json`). |
| **Transitive graph coverage** | Does the SBOM capture full transitive dependency graphs rather than direct dependencies alone, and is its coverage limit recorded? | Dependency graph verification tests &amp; recorded generation context. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>An SBOM is a machine-readable component inventory; the CISA 2026 minimum elements supersede the NTIA 2021 baseline, moving to 17 data fields across two areas — and they say what an SBOM <em>should</em> carry, not what it must. SPDX (ISO) leans to license compliance, CycloneDX (ECMA-424) to AppSec. Pair SBOMs with VEX assertions — four statuses, five exact justification strings — to remove non-exploitable CVE matches from the queue.</p>
</div>

## Primary references

- **[2026 Minimum Elements for a Software Bill of Materials (SBOM)](https://www.cisa.gov/resources-tools/resources/2026-minimum-elements-software-bill-materials-sbom)** — read in full (v2.1, 29 July 2026, 23pp). Verified against the source document: the publication date and version history, the two-area structure, the 17 data fields in Appendix A Table 1, the ten new elements, the four renames, the removal of Access Control, the move of automation support to machine-processable data, RFC 9557 for timestamps, and the document's use of "should" rather than mandatory language throughout.
- **[NTIA Minimum Elements for an SBOM (2021)](https://www.ntia.gov/report/2021/minimum-elements-software-bill-materials-sbom)** — verified the seven data fields and the three-element structure of the original baseline.
- **[OpenVEX specification](https://github.com/openvex/spec/blob/main/OPENVEX-SPEC.md)** — verified the four status values and the five `not_affected` justification identifiers exactly as spelled.
- **[ECMA-424: CycloneDX Bill of Materials Specification](https://ecma-international.org/publications-and-standards/standards/ecma-424/)** — verified CycloneDX's standardization status and the December 2025 edition.
- **[ECMA-427: Package URL (PURL) Specification](https://ecma-international.org/publications-and-standards/standards/ecma-427/)** — verified that purl is now an Ecma standard, as cited by the CISA 2026 elements.
