---
title: Detection Engineering & SIEM Analytics
description: Technical reference for Detection Engineering, Detection-as-Code (DaC) CI/CD workflows, standardized rule formats (Sigma, YARA, KQL, SPL, YARA-L), telemetry normalization (ECS, OCSF), rule lifecycle and retirement, and detection metrics (MTTD, precision vs recall).
permalink: /topics/detection-engineering/
last_verified: 2026-08-14
---

<span class="eyebrow">Threat Intelligence & Detection / Decision Guide</span>

# Detection Engineering & SIEM Analytics

<p class="lede">Detection Engineering is the disciplined software engineering practice of designing, building, testing, deploying, and maintaining automated detection logic across SIEM, EDR, and log analytics platforms. Rather than relying on static out-of-the-box vendor rules, modern detection engineering applies Detection-as-Code (DaC) workflows—using vendor-neutral formats like Sigma and YARA—to convert threat intelligence into reliable, continuously tested detections with low false-positive rates.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/detection-engineering-pipeline.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the detection engineering architecture diagram at full size">
    <img src="{{ '/assets/img/detection-engineering-pipeline.svg' | relative_url }}" alt="Detection Engineering &amp; SIEM Analytics Architecture diagram showing Detection-as-Code pipeline, Sigma/YARA/KQL rule compilation, telemetry normalization, and detection metrics.">
  </a>
  <p class="diagram-caption">Detection Engineering Pipeline: Detection-as-Code Git CI/CD &leftrightarrow; Sigma YAML Rule Transpilation &leftrightarrow; ECS/OCSF Telemetry Normalization &leftrightarrow; SIEM Analytics Engine</p>
</div>

## Detection-as-Code (DaC) Methodology

**Detection-as-Code (DaC)** applies modern software engineering principles to the lifecycle of security detection rules:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/detection-engineering.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the Detection-as-Code pipeline diagram at full size">
    <img src="{{ '/assets/img/detection-engineering.svg' | relative_url }}" alt="Detection-as-Code pipeline: rule authoring in Sigma or YARA, Git pull request review, CI unit and syntax tests, test event replay, transpilation with sigma-cli, and automated deployment to the SIEM or EDR API.">
  </a>
  <p class="diagram-caption">Detection-as-Code (DaC) Pipeline: Authoring &rarr; Git PR &rarr; Unit Testing &rarr; Event Replay &rarr; Transpilation &rarr; Auto Deploy</p>
</div>

1. **Rule Authoring (Sigma / YARA)**: Engineers write rules in declarative, vendor-neutral formats (Sigma YAML or YARA) stored in a version-controlled Git repository.
2. **Git Pull Request & Peer Review**: Code reviews enforce naming conventions, ATT&CK tagging, and logic correctness before merging.
3. **CI Automated Unit & Syntax Testing**: Automated CI runners validate YAML schema syntax, check for missing fields, and lint rule logic.
4. **Test Event Replay**: CI pipelines replay historical or synthetic attack log events against candidate rules to verify trigger accuracy.
5. **Rule Transpilation (`sigma-cli` / pySigma)**: Transpilers convert generic Sigma rules into target SIEM languages (KQL, SPL, YARA-L). The legacy `sigmac` converter has been retired; SigmaHQ now directs users to Sigma CLI for command-line conversion and to pySigma for toolchain integration.
6. **Automated SIEM/EDR Deployment**: CD pipelines push compiled detection queries directly to SIEM REST APIs without manual console editing.

## Standardized Detection Rule Languages

### 1. Sigma (Vendor-Neutral Log Signatures)
Sigma is an open, vendor-neutral YAML specification for writing log detection logic that transpiles into native SIEM queries:

```yaml
title: LSASS Memory Dumping via Process Access
id: a104ef95-502a-43d9-95e2-63806f477011
status: test
description: Detects process access requests targeting LSASS with dangerous access masks (0x1010, 0x1400, or 0x1f0fff) indicative of credential theft.
references:
    - https://attack.mitre.org/techniques/T1003/001/
author: Antigravity Detection Engineering
date: 2026-08-14
tags:
    - attack.credential_access
    - attack.t1003.001
logsource:
    category: process_access
    product: windows
detection:
    selection:
        TargetImage|endswith: '\lsass.exe'
        GrantedAccess:
            - '0x1010'
            - '0x1400'
            - '0x1f0fff'
    filter_system:
        SourceImage|endswith:
            - '\svchost.exe'
            - '\csrss.exe'
    condition: selection and not filter_system
falsepositives:
    - Legitimate security agents monitoring LSASS
level: high
```

Sigma also supports **correlation rules**, which express multi-event logic — event counts over a time window, value counts, and temporal ordering — that a single-event rule cannot. Detections such as "twenty failed authentications followed by one success from the same source" belong in a correlation rule rather than in downstream SIEM-specific glue.

### 2. YARA (Binary, File, & Memory Pattern Matching)
YARA is the standard rule engine for identifying malicious patterns within files, memory dumps, and binary streams:

```yara
rule Detect_Mimikatz_Strings_In_PE {
    meta:
        description = "Detects mimikatz-family credential-dumping command strings inside PE executables"
        author = "Antigravity Detection Engineering"
        date = "2026-08-14"
        reference = "https://attack.mitre.org/techniques/T1003/001/"
    strings:
        $s1 = "sekurlsa::logonpasswords" ascii wide nocase
        $s2 = "lsadump::sam" ascii wide nocase
        $s3 = "privilege::debug" ascii wide nocase
    condition:
        uint16(0) == 0x5A4D and 2 of ($s*)
}
```

The `uint16(0) == 0x5A4D` condition restricts matching to files beginning with the `MZ` header — that is, PE executables. It deliberately does **not** match minidump artifacts such as `lsass.dmp`, which begin with the `MDMP` signature; scanning dump files requires a separate rule without the PE header check. **YARA-X** is the maintained Rust rewrite from VirusTotal and is the direction of travel for new deployments; rule syntax is largely compatible, but validate before migrating a large ruleset.

### 3. Native SIEM Analytics Query Languages & pySigma Transpilation

| Query Language | Target Platform | Primary Operational Characteristics |
|---|---|---|
| **KQL (Kusto Query Language)** | Microsoft Sentinel, Defender XDR | High-performance pipe-based analytics query language designed for structured log filtering, joining, and aggregation. |
| **SPL (Search Processing Language)** | Splunk Enterprise / Cloud | Pipe-delimited search language supporting statistical transforms, lookup tables, and complex subsearches. |
| **YARA-L 2.0** | Google Security Operations (formerly Chronicle) | Event- and entity-centric rule language supporting single-event conditions and multi-event correlation windows. |

### Automating Rule Transpilation via pySigma Pipeline

In a modern Detection-as-Code pipeline, **`pySigma`** programmatically transpiles vendor-neutral Sigma rules into target SIEM query formats. Backends are distributed as separate packages — `pysigma-backend-kusto` for Microsoft Sentinel, Defender XDR, and Azure Monitor; `pysigma-backend-splunk` for Splunk:

```python
#!/usr/bin/env python3
"""pySigma automated rule transpilation.

Requires: pip install pysigma pysigma-backend-kusto pysigma-backend-splunk
"""

from sigma.collection import SigmaCollection
from sigma.backends.kusto import KustoBackend
from sigma.pipelines.kusto import sentinelasim_pipeline
from sigma.backends.splunk import SplunkBackend
from sigma.pipelines.splunk import splunk_windows_pipeline

# 1. Load the vendor-neutral Sigma rule.
sigma_yaml = """
title: LSASS Memory Dumping via Process Access
logsource:
    category: process_access
    product: windows
detection:
    selection:
        TargetImage|endswith: '\\lsass.exe'
        GrantedAccess:
            - '0x1010'
            - '0x1400'
    condition: selection
"""
rule_collection = SigmaCollection.from_yaml(sigma_yaml)

# 2. Transpile to Microsoft Sentinel (ASIM) KQL.
kusto_backend = KustoBackend(processing_pipeline=sentinelasim_pipeline())
kql_query = kusto_backend.convert(rule_collection)[0]
print(f"[*] Generated KQL: {kql_query}")

# 3. Transpile to Splunk SPL.
splunk_backend = SplunkBackend(processing_pipeline=splunk_windows_pipeline())
spl_query = splunk_backend.convert(rule_collection)[0]
print(f"[*] Generated SPL: {spl_query}")
```

The exact query text each backend emits depends on the backend and pipeline versions installed — the pipeline controls table selection, field renaming, and log-source conditions. Treat the output as something to inspect and diff in CI, not as a fixed string to assert against.

## Telemetry Normalization: ECS & OCSF

SIEM engines ingest logs from disparate vendors (EDR, Cloud, Identity, Network). Effective detection logic requires mapping raw vendor schemas to normalized data models:

- **Elastic Common Schema (ECS)**: Standardized field taxonomy (`process.name`, `user.name`, `source.ip`, `destination.port`) enabling reusable detection signatures across diverse log sources.
- **Open Cybersecurity Schema Framework (OCSF)**: An open-source, vendor-agnostic cyber telemetry taxonomy providing standardized event categories (*System Activity*, *Identity & Access Management*, *Network Activity*) and standardized class attributes.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/telemetry-normalization.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the telemetry normalization pipeline diagram at full size">
    <img src="{{ '/assets/img/telemetry-normalization.svg' | relative_url }}" alt="Telemetry normalization pipeline: raw vendor logs from EDR, cloud and identity providers, parsed into fields, mapped onto the ECS or OCSF schema, and then queried by detection logic.">
  </a>
  <p class="diagram-caption">Telemetry Pipeline: Raw Vendor Log Ingestion &rarr; Parse &amp; Extract &rarr; ECS/OCSF Normalization &rarr; Detection Query Execution</p>
</div>

Normalization is a prerequisite, not a nicety: a rule written against `process.name` silently returns nothing if the ingesting parser never populated that field. Confirm field coverage per log source before attributing a quiet rule to an absent adversary.

## Detection Performance Metrics & Tuning

Detection engineers evaluate rule health using 4 core quantitative metrics.

The target column below records locally defined working thresholds for this journal, not published benchmarks — calibrate them to actual alert volume and analyst capacity. **Rule Fatigue Index** is likewise a locally defined ratio, not a standard SIEM metric.

| Metric | Definition &amp; Formula | Target Operational Goal (journal working values) |
|---|---|---|
| **Precision** | `True Positives / (True Positives + False Positives)` | Maintain high precision (above 85%) to minimize alert fatigue. |
| **Recall (Sensitivity)** | `True Positives / (True Positives + False Negatives)` | Maximize recall (above 90%) to capture target adversary TTPs. |
| **Mean Time to Detect (MTTD)** | Average time elapsed between adversary activity and SIEM alert generation. | Reduce MTTD to under 15 minutes for critical TTP alerts. |
| **Rule Fatigue Index** *(journal metric)* | `Total Alerts Triggered / Actionable Incident Escalations` | Suppress noisy rules generating high alert volume with zero escalations. |

### Precision vs. Recall Trade-Off Matrix

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/precision-vs-recall.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the precision versus recall matrix diagram at full size">
    <img src="{{ '/assets/img/precision-vs-recall.svg' | relative_url }}" alt="Detection outcome matrix. Columns are ground truth — adversary activity present or absent. Rows are detection status — triggered or quiet. Cells are true positive, false positive, false negative and true negative. Precision is measured across the triggered row; recall down the activity-present column.">
  </a>
  <p class="diagram-caption">Detection Performance Trade-Off: Precision vs. Recall Matrix</p>
</div>

## Rule Lifecycle: Deprecation and Retirement

A detection repository that only ever grows becomes its own reliability problem. Rules accumulate against log sources that were decommissioned, techniques that were patched out, and vendor fields that were renamed — each one either firing noise or, worse, sitting permanently silent and counting toward a coverage figure it no longer earns.

Sigma encodes this in the rule's own `status` field, and treating it as a real state machine is what keeps a repository honest:

- **`experimental`** — newly authored, not yet trusted for escalation. Route to a triage queue, not to on-call.
- **`test`** — validated against replayed events, running in production under observation while precision is measured.
- **`stable`** — meets the precision target and is trusted for escalation.
- **`deprecated`** — superseded by a better rule or made redundant by a control change. Keep it in the repository with the superseding rule ID recorded, but stop deploying it.
- **`unsupported`** — cannot run as written, typically because its log source or a required field no longer exists.

Three operational rules follow from that. First, deprecate in Git rather than deleting, so the history explaining why a detection existed survives the person who wrote it. Second, alert on rules that have not fired in a defined window — a stable rule silent for a quarter is either a dead log source or an obsolete detection, and both need a decision. Third, exclude anything not `stable` or `test` from ATT&CK coverage reporting, or the heatmap will count retired rules as live coverage.

## Essential Detection Engineering Diagnostic Checklist

The checklist below is a journal working model, not a published audit standard.

| Diagnostic Focus Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Detection-as-Code (DaC)** | Are all SIEM and EDR detection rules version-controlled in Git and deployed via automated CI/CD pipelines? | Git repository commit logs &amp; GitHub Actions deployment workflows. |
| **Vendor-Neutral Authoring** | Are rules written in vendor-neutral formats (Sigma/YARA) and auto-transpiled rather than hand-coded into SIEM consoles? | Sigma rule repository &amp; `sigma-cli` build pipeline configuration. |
| **Automated Unit Testing** | Does CI execute automated syntax validation and log-replay unit tests before deploying candidate rules to production? | CI build test logs &amp; synthetic test event replay repositories. |
| **Schema Normalization** | Is incoming telemetry normalized to a standard schema (ECS or OCSF) before running detection queries, and is field coverage confirmed per log source? | SIEM log parser pipeline configs &amp; OCSF field mapping schemas. |
| **Precision Monitoring** | Are detection rules continuously tracked for precision, recall, and false-positive escalation rates? | SIEM detection health dashboards &amp; SOC alert escalation reports. |
| **Rule Retirement** | Are stale and superseded rules deprecated with a recorded reason, and are long-silent rules investigated rather than ignored? | Rule `status` field audit &amp; zero-fire rule review tickets. |
| **ATT&CK Tagging** | Is every detection rule tagged with specific ATT&CK Tactic, Technique, and Sub-technique metadata IDs, pinned to an ATT&CK version? | Rule metadata YAML blocks &amp; automated ATT&CK coverage maps. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Detection Engineering applies Detection-as-Code (DaC) software practices to rule management. Rules authored in vendor-neutral Sigma or YARA formats are unit-tested in CI/CD pipelines, transpiled to native SIEM queries (KQL/SPL) with <code>sigma-cli</code>, and evaluated against precision, recall, and MTTD metrics. A rule that never fires is a decision waiting to happen, not proven coverage.</p>
</div>

## Primary references

- **Sigma Specification**: *Sigma rule specification, including rule status values and correlation rules* — [SigmaHQ/sigma-specification](https://github.com/SigmaHQ/sigma-specification)
- **Sigma Rule Repository & Tooling**: *Generic Signature Format for SIEM Systems* — [Sigma Official Repository](https://github.com/SigmaHQ/sigma)
- **pySigma**: *Sigma rule processing and transpilation library* — [SigmaHQ/pySigma](https://github.com/SigmaHQ/pySigma) — source for the backend package and module names used in the transpilation script.
- **YARA Documentation**: *The Pattern Matching Swiss Knife for Malware Researchers* — [YARA Official](https://yara.readthedocs.io/en/latest/)
- **OCSF Schema**: *Open Cybersecurity Schema Framework Specification* — [OCSF Official](https://ocsf.io/)
- **Elastic Common Schema (ECS)**: *ECS Reference and Field Definitions* — [Elastic Docs](https://www.elastic.co/docs/reference/ecs)
