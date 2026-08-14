---
title: Software Bill of Materials (SBOM) & VEX
description: Comprehensive technical guide to Software Bill of Materials (SBOM) standards, NTIA 2021 minimum elements, CISA 2025 updates, SPDX vs CycloneDX schemas, Package URLs (purl), and Vulnerability Exploitability eXchange (VEX).
permalink: /topics/sbom-dependency-management/
last_verified: 2026-08-13
---

<span class="eyebrow">Software Supply Chain Security / Component Assurance</span>

# Software Bill of Materials (SBOM) & VEX

<p class="lede">A modern software artifact rarely consists solely of proprietary code; it is an assembly of open-source libraries, third-party frameworks, and transitively inherited dependencies. A Software Bill of Materials (SBOM) provides a machine-readable inventory of software components and their supply-chain relationships. However, possession of an SBOM alone does not equal vulnerability management—actionable remediation requires continuous vulnerability correlation and Vulnerability Exploitability eXchange (VEX) status assertions.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/sbom-vulnerability-management.svg' | relative_url }}" alt="SBOM diagram showing SPDX vs CycloneDX schemas, NTIA 2021 baseline, Package URLs (purl), and Vulnerability Exploitability eXchange (VEX).">
  <p class="diagram-caption">Software Bill of Materials (SBOM) &amp; VEX Architecture: NTIA 2021 Minimum Elements &leftrightarrow; SPDX / CycloneDX Formats &leftrightarrow; OSV Vulnerability Correlation &leftrightarrow; VEX Exploitability Assertions</p>
</div>

## NTIA 2021 Minimum Elements & CISA Updates

In response to Executive Order 14028, the National Telecommunications and Information Administration (NTIA) established the **2021 Minimum Elements for an SBOM**:

1. **Supplier Name**: Organization or author creating the software component.
2. **Component Name**: Standardized title of the library or module.
3. **Component Version**: Precise build or semantic version tag.
4. **Other Unique Identifiers**: Package URL (`purl`), CPE (Common Platform Enumeration), or cryptographic hash.
5. **Dependency Relationship**: Explicit graph mapping showing direct and transitive relationships (*e.g. Component A depends on Component B*).
6. **SBOM Author**: Entity or tool generating the SBOM metadata record.
7. **Timestamp**: Exact UTC timestamp of SBOM generation.

CISA published an updated **2025 draft guidance** that expands these baseline elements to include explicit component hashes, license details, generator tool context, and continuous generation requirements.

## SPDX vs. CycloneDX Format Comparison

Two open standards dominate industry adoption, originating from distinct engineering requirements:

| Dimension | SPDX (ISO/IEC 5962:2021) | CycloneDX (OWASP) |
|---|---|---|
| **Origin & Governance** | Linux Foundation project (2010), ISO standard. | OWASP Foundation project (2017). |
| **Primary Design Goal** | License compliance, provenance, and IP legal tracking. | Security assurance, vulnerability management, and SBOM/VEX integration. |
| **Vulnerability Native Support** | Added in SPDX 3.0 via profile extensions. | Native vulnerability, VEX, and cryptography (CBOM) fields built-in. |
| **Primary Industry Use** | Legal IP compliance, Linux kernel distributions, enterprise IT. | Application security (AppSec), DevSecOps CI/CD pipelines, container scanning. |

## Package URLs (purl) & Universal Identification

To eliminate ambiguity across ecosystem package managers (*e.g. distinguishing a Python `requests` package from an npm `requests` package*), SBOMs rely on **Package URLs (purl)**:

<p class="formula"><code>pkg:type/namespace/name@version?qualifiers#subpath</code></p>

<p class="formula">Example: <code>pkg:npm/%40angular/core@16.2.0</code></p>

Package URLs provide a standardized string scheme for identifying software packages across heterogeneous ecosystems (npm, PyPI, Maven, Cargo, Go, Debian, RPM).

## Vulnerability Exploitability eXchange (VEX)

Scanning an SBOM against vulnerability databases (NVD, OSV) often yields dozens of CVE matches, leading to false-positive noise. A component may be present in the binary but its vulnerable code paths are never called or reachable.

**VEX (Vulnerability Exploitability eXchange)** is a machine-readable format that allows software vendors to publish authoritative status assertions regarding specific CVEs:

<div class="diagram-frame">
  <img src="{{ '/assets/img/sbom-vulnerability-management.svg' | relative_url }}" alt="Vulnerability Exploitability eXchange (VEX) alert suppression workflow diagram.">
  <p class="diagram-caption">VEX Alert Suppression Workflow: SBOM Inventory CVE Match &leftrightarrow; VEX Status Query &leftrightarrow; Reachability Justification</p>
</div>

### The 4 Standard VEX Statuses
1. `NOT_AFFECTED`: The vulnerability is present in a component, but the product is **not affected** due to a specific justification:
   - `component_not_present`
   - `inline_mitigations_already_exist`
   - `vulnerable_code_cannot_be_in_executed_code_path` (Non-reachable code)
   - `vulnerable_code_not_in_execute_range`
2. `AFFECTED`: The product is vulnerable; actions must be taken to remediate.
3. `FIXED`: Represents that the product has been patched and is no longer vulnerable.
4. `UNDER_INVESTIGATION`: The vendor is actively analyzing whether the product is affected.

## Essential SBOM & VEX Diagnostic Checklist

When implementing an SBOM and component management program, evaluate these 6 criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **NTIA 2021 Compliance** | Does the generated SBOM contain all 7 NTIA minimum baseline data fields? | Sample SBOM JSON file validation against NTIA schema. |
| **Continuous Generation** | Is a fresh, build-specific SBOM generated automatically during every CI/CD pipeline run? | CI/CD build scripts &amp; SBOM storage repository logs. |
| **Package URL Standard** | Are all software components identified using standardized Package URLs (`purl`)? | SBOM JSON inspect results for `purl` fields. |
| **VEX Processing** | Is an automated VEX ingestion pipeline deployed to suppress non-reachable false-positive CVE alerts? | VEX JSON file integration &amp; SIEM/AppSec alert logs. |
| **Format Standardization** | Is the SBOM exported in a standardized machine-readable schema (SPDX v2.3/3.0 or CycloneDX v1.5/1.6)? | CI/CD tool flags (`syft -o cyclonedx-json`). |
| **Transitive Graph Scope** | Does the SBOM capture full transitive dependency graphs rather than direct dependencies alone? | Dependency graph verification tests. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>An SBOM provides a machine-readable inventory of software components (NTIA 7 fields). SPDX excels at legal license compliance, while CycloneDX is built for AppSec security. Pair SBOMs with VEX assertions to filter out non-reachable false-positive CVE alerts.</p>
</div>

## Primary references

- **NTIA Minimum Elements**: *Minimum Elements for a Software Bill of Materials (SBOM)* — [NTIA Report](https://www.ntia.gov/report/2021/minimum-elements-software-bill-materials-sbom)
- **CycloneDX Specification**: *OWASP CycloneDX Bill of Materials Standard* — [CycloneDX Official](https://cyclonedx.org/)
- **CISA VEX Framework**: *Vulnerability Exploitability eXchange (VEX) Overview* — [CISA VEX](https://www.cisa.gov/sbom)
