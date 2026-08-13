---
title: Detection Engineering & SIEM Analytics
description: Comprehensive technical guide to Detection Engineering, Detection-as-Code (DaC) CI/CD workflows, standardized rule formats (Sigma, YARA, KQL, SPL, YARA-L), telemetry normalization (ECS, OCSF), and detection metrics (MTTD, precision vs recall).
permalink: /topics/detection-engineering/
last_verified: 2026-08-13
---

<span class="eyebrow">Threat Intelligence & Detection / Decision Guide</span>

# Detection Engineering & SIEM Analytics

<p class="lede">Detection Engineering is the disciplined software engineering practice of designing, building, testing, deploying, and maintaining automated detection logic across SIEM, EDR, and log analytics platforms. Rather than relying on static out-of-the-box vendor rules, modern detection engineering applies Detection-as-Code (DaC) workflows—using vendor-neutral formats like Sigma and YARA—to convert threat intelligence into reliable, continuously tested detections with low false-positive rates.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/detection-engineering-pipeline.svg' | relative_url }}" alt="Detection Engineering &amp; SIEM Analytics Architecture diagram showing Detection-as-Code pipeline, Sigma/YARA/KQL rule compilation, telemetry normalization, and detection metrics.">
  <p class="diagram-caption">Detection Engineering Pipeline: Detection-as-Code Git CI/CD &leftrightarrow; Sigma YAML Rule Transpilation &leftrightarrow; ECS/OCSF Telemetry Normalization &leftrightarrow; SIEM Analytics Engine</p>
</div>

## Detection-as-Code (DaC) Methodology

**Detection-as-Code (DaC)** applies modern software engineering principles to the lifecycle of security detection rules:

```
[1. Rule Authoring] ──> [2. Git PR] ──> [3. CI Unit Tests] ──> [4. Event Replay] ──> [5. Transpilation] ──> [6. Auto Deploy]
```

1. **Rule Authoring (Sigma / YARA)**: Engineers write rules in declarative, vendor-neutral formats (Sigma YAML or YARA) stored in a version-controlled Git repository.
2. **Git Pull Request & Peer Review**: Code reviews enforce naming conventions, ATT&CK tagging, and logic correctness before merging.
3. **CI Automated Unit & Syntax Testing**: Automated CI runners validate YAML schema syntax, check for missing fields, and lint rule logic.
4. **Test Event Replay**: CI pipelines replay historical or synthetic attack log events against candidate rules to verify trigger accuracy.
5. **Rule Transpilation (`sigmac` / `pySigma`)**: Transpilers automatically convert generic Sigma rules into target SIEM languages (KQL, SPL, YARA-L).
6. **Automated SIEM/EDR Deployment**: CD pipelines push compiled detection queries directly to SIEM REST APIs without manual console editing.

## Standardized Detection Rule Languages

### 1. Sigma (Vendor-Neutral Log Signatures)
Sigma is an open, vendor-neutral YAML specification for writing log detection logic that transpiles into native SIEM queries:

```yaml
title: LSASS Memory Dumping via Process Access
id: a104ef95-502a-43d9-95e2-63806f477011
status: test
description: Detects process access requests targeting LSASS with dangerous access masks (0x1010 or 0x1400) indicative of credential theft.
references:
    - https://attack.mitre.org/techniques/T1003/001/
author: Antigravity Detection Engineering
date: 2026-08-13
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

### 2. YARA (Binary, File, & Memory Pattern Matching)
YARA is the standard rule engine for identifying malicious patterns within files, memory dumps, and binary streams:

```yara
rule Detect_Suspicious_Dump_Strings {
    meta:
        description = "Detects strings associated with unencrypted credential dump artifacts"
        author = "Antigravity Detection Engineering"
        date = "2026-08-13"
        reference = "https://attack.mitre.org/techniques/T1003/001/"
    strings:
        $s1 = "sekurlsa::logonpasswords" ascii wide nocase
        $s2 = "lsass.dmp" ascii wide nocase
        $s3 = "lsadump::sam" ascii wide nocase
    condition:
        uint16(0) == 0x5A4D and 2 of ($s*)
}
```

### 3. Native SIEM Analytics Query Languages

| Query Language | Target Platform | Primary Operational Characteristics |
|---|---|---|
| **KQL (Kusto Query Language)** | Microsoft Sentinel, Defender XDR | High-performance pipe-based analytics query language designed for structured log filtering, joining, and aggregation. |
| **SPL (Search Processing Language)** | Splunk Enterprise / Cloud | Pipe-delimited search language supporting statistical transforms, lookup tables, and complex subsearches. |
| **YARA-L 2.0** | Google Chronicle / SecOps | Event- and entity-centric rule language supporting single-event conditions and multi-event correlation windows. |

## Telemetry Normalization: ECS & OCSF

Siem engines ingest logs from disparate vendors (EDR, Cloud, Identity, Network). Effective detection logic requires mapping raw vendor schemas to normalized data models:

- **Elastic Common Schema (ECS)**: Standardized field taxonomy (`process.name`, `user.name`, `source.ip`, `destination.port`) enabling reusable detection signatures across diverse log sources.
- **Open Cybersecurity Schema Framework (OCSF)**: An open-source, vendor-agnostic cyber telemetry taxonomy providing standardized event categories (*System Activity*, *Identity & Access Management*, *Network Activity*) and standardized class attributes.

```
Raw Vendor Log (Sysmon / AuditD / CloudTrail) ──> Ingestion Pipeline ──> OCSF / ECS Normalization ──> Transpiled Detection Query
```

## Detection Performance Metrics & Tuning

Detection engineers evaluate rule health using 4 core quantitative metrics:

| Metric | Definition &amp; Formula | Target Operational Goal |
|---|---|---|
| **Precision** | $\frac{\text{True Positives}}{\text{True Positives} + \text{False Positives}}$ | Maintain high precision ($>85\%$) to minimize alert fatigue. |
| **Recall (Sensitivity)** | $\frac{\text{True Positives}}{\text{True Positives} + \text{False Negatives}}$ | Maximize recall ($>90\%$) to capture target adversary TTPs. |
| **Mean Time to Detect (MTTD)** | Average time elapsed between adversary activity and SIEM alert generation. | Reduce MTTD to $<15\text{ minutes}$ for critical TTP alerts. |
| **Rule Fatigue Index** | $\frac{\text{Total Alerts Triggered}}{\text{Actionable Incident Escalations}}$ | Suppress noisy rules generating high alerts with zero escalations. |

### Precision vs. Recall Trade-Off Matrix

```
                      Adversary Activity Present
                     Present            Absent
                 ┌───────────────┬──────────────────┐
        Triggered│ True Positive │  False Positive  │  <-- Precision = TP / (TP + FP)
Detection        │ (Successful)  │ (Alert Fatigue)  │
  Status         ├───────────────┼──────────────────┤
            Quiet│ False Negative│  True Negative   │
                 │ (Breach Leak) │ (Normal Ops)     │
                 └───────────────┴──────────────────┘
                         ▲
                   Recall = TP / (TP + FN)
```

## Essential Detection Engineering Diagnostic Checklist

When evaluating an enterprise Detection Engineering program, audit these 6 operational criteria:

| Diagnostic Focus Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Detection-as-Code (DaC)** | Are all SIEM and EDR detection rules version-controlled in Git and deployed via automated CI/CD pipelines? | Git repository commit logs &amp; GitHub Actions deployment workflows. |
| **Vendor-Neutral Authoring** | Are rules written in vendor-neutral formats (Sigma/YARA) and auto-transpiled rather than hand-coded into SIEM consoles? | Sigma rule repository &amp; `sigmac` build pipeline configuration. |
| **Automated Unit Testing** | Does CI execute automated syntax validation and log-replay unit tests before deploying candidate rules to production? | CI build test logs &amp; synthetic test event replay repositories. |
| **Schema Normalization** | Is incoming telemetry normalized to a standard schema (ECS or OCSF) before running detection queries? | SIEM log parser pipeline configs &amp; OCSF field mapping schemas. |
| **Precision Monitoring** | Are detection rules continuously tracked for precision, recall, and false-positive escalation rates? | SIEM detection health dashboards &amp; SOC alert escalation reports. |
| **ATT&CK Tagging** | Is every detection rule tagged with specific ATT&CK Tactic, Technique, and Sub-technique metadata IDs? | Rule metadata YAML blocks &amp; automated ATT&CK coverage maps. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Detection Engineering applies Detection-as-Code (DaC) software practices to rule management. Rules authored in vendor-neutral Sigma or YARA formats are unit-tested in CI/CD pipelines, transpiled to native SIEM queries (KQL/SPL), and evaluated against precision, recall, and MTTD metrics.</p>
</div>

## Primary references

- **Sigma Specification**: *Generic Signature Format for SIEM Systems* — [Sigma Official Repository](https://github.com/SigmaHQ/sigma)
- **YARA Documentation**: *The Pattern Matching Swiss Knife for Malware Researchers* — [YARA Official](https://virustotal.github.io/yara/)
- **OCSF Schema**: *Open Cybersecurity Schema Framework Specification* — [OCSF Official](https://ocsf.io/)
- **Elastic Common Schema (ECS)**: *ECS Reference and Field Definitions* — [Elastic Docs](https://www.elastic.co/guide/en/ecs/current/index.html)
