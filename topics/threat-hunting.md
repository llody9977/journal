---
title: Threat Hunting & Behavioral Analytics
description: Technical reference for Threat Hunting methodologies, the PEAK framework (Prepare, Execute, and Act with Knowledge), hypothesis-driven, baseline and model-assisted hunts, the Hunting Maturity Model, User and Entity Behavior Analytics (UEBA), and post-hunt rule operationalization.
permalink: /topics/threat-hunting/
last_verified: 2026-08-14
---

<span class="eyebrow">Threat Intelligence & Detection / Decision Guide</span>

# Threat Hunting & Behavioral Analytics

<p class="lede">Threat hunting is the proactive, human-driven search through enterprise telemetry to discover malicious adversary activity that has evaded automated SIEM and EDR detections. Rather than waiting for automated alerts to trigger, threat hunters leverage the PEAK framework, User and Entity Behavior Analytics (UEBA), and statistical outlier baselining to uncover hidden persistence, living-off-the-land (LotL) execution, and unauthorized lateral movement.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/threat-hunting-methodology.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the threat hunting methodology architecture diagram at full size">
    <img src="{{ '/assets/img/threat-hunting-methodology.svg' | relative_url }}" alt="Threat Hunting &amp; Behavioral Analytics Architecture diagram showing the PEAK hunting framework, UEBA behavioral baselining, hypothesis generation, and post-hunt rule operationalization.">
  </a>
  <p class="diagram-caption">Threat Hunting Methodology: CTI Hypothesis Generation &leftrightarrow; PEAK Framework Execution &leftrightarrow; UEBA Behavioral Analytics &leftrightarrow; Post-Hunt Detection-as-Code Operationalization</p>
</div>

## Threat Hunting Methodologies & Taxonomy

Hunts can be sorted by what triggered them. The three-way split below is a journal working taxonomy for triage and scheduling; it overlaps with, but is not identical to, PEAK's three hunt types described in the next section — the two agree on hypothesis-driven and baseline hunting and differ on the third category.

| Hunting Type | Triggering Input | Analytical Execution Method | Primary Focus &amp; Objective |
|---|---|---|---|
| **Hypothesis-Driven** | Threat Intelligence, CTI PIRs, new ATT&CK TTPs. | Formulates testable statements (*e.g., "An adversary is using WMI to execute living-off-the-land scripts"*). | Uncovering specific adversary TTPs across enterprise telemetry logs. |
| **Baseline / Outlier-Driven** | Statistical anomaly detection, EDR telemetry query. | Queries telemetry for rare process executions, unusual parent-child relationships, or long-tail stacks. | Identifying stealthy, unknown malware or custom scripts without prior IOCs. |
| **Entity / Anomaly-Driven** | UEBA risk scores, high-risk user profiles. | Investigates accounts or endpoints exhibiting statistical deviations from peer baseline behavior. | Uncovering compromised credentials, insider threats, or privilege abuse. |

## The PEAK Hunting Framework

**PEAK** — *Prepare, Execute, and Act with Knowledge* — was published by David Bianco and the SURGe team at Splunk in 2023. The acronym names the three phases of a single hunt: preparing the scope, hypothesis, and data sources; executing the analysis; and acting on the knowledge produced, whether or not anything malicious was found. Within that structure, PEAK defines three hunt types:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/peak-hunting-framework.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the PEAK hunting framework diagram at full size">
    <img src="{{ '/assets/img/peak-hunting-framework.svg' | relative_url }}" alt="The PEAK hunting framework — Prepare, Execute, and Act with Knowledge — branching into three hunt types: hypothesis-driven, baseline using exploratory data analysis, and model-assisted threat hunts (M-ATH).">
  </a>
  <p class="diagram-caption">PEAK Hunting Framework: Hypothesis-Driven, Baseline (EDA), and Model-Assisted (M-ATH)</p>
</div>

### 1. Hypothesis-Driven Threat Hunting
- **Step 1: Formulate Hypothesis**: State a specific, falsifiable statement based on CTI or architectural risk (*e.g., "Adversaries are dumping LSASS memory using legitimate Windows utilities like `rundll32.exe comsvcs.dll`"*).
- **Step 2: Collect & Query Telemetry**: Execute telemetry queries filtering Sysmon Event ID 10 (Process Access) or EDR process creation logs.
- **Step 3: Analyze & Validate**: Inspect process command-line arguments, parent process lineage, and user context to distinguish malicious execution from security agent scans.
- **Step 4: Document & Operationalize**: Record findings in a hunt playbook and convert validated hunting queries into automated Sigma detection rules.

### 2. Baseline Threat Hunting (Exploratory Data Analysis)
- **Long-Tail Stacking**: Group process execution names, hashes, or DLL loads across all enterprise endpoints and sort by frequency. Inspect items occurring in the bottom 1% (rare executables).
- **Parent-Child Lineage Analysis**: Search for anomalous process trees (*e.g., `cmd.exe` or `powershell.exe` spawned by `w3wp.exe` or `sqlserver.exe`*).
- **Rare Network Destination Stacking**: Filter outbound HTTP/S connections originating from rare non-browser binaries (*e.g., `rundll32.exe` communicating to external IPs*).

### 3. Model-Assisted Threat Hunts (M-ATH)
- Uses unsupervised machine learning algorithms (K-Means clustering, Isolation Forests) to group multi-dimensional telemetry features and flag isolated data points.
- Enables hunters to process millions of log events by focusing manual inspection on top-ranked anomaly clusters.

### Hunt Maturity and Prerequisites

PEAK assumes telemetry that a hunt can actually search. Bianco's earlier **Hunting Maturity Model (HMM)** is the useful self-assessment for whether that assumption holds, running from **HMM0** (no routine collection; alerting only) through **HMM1** (routine collection, threat-intel-driven searches), **HMM2** (following procedures published by others), **HMM3** (creating new hunting procedures), to **HMM4** (automating the procedures that succeed, freeing hunters for new ones). A program without centralized retention and command-line-level process telemetry sits at HMM0–HMM1 regardless of how the hunting function is staffed; closing that gap precedes framework selection.

Continuous monitoring is the substrate hunting runs on, not a substitute for it: [NIST SP 800-137](https://csrc.nist.gov/pubs/sp/800/137/final) governs the automated, control-focused monitoring that keeps the telemetry flowing, while hunting is the human-driven search *through* that telemetry for what the automation did not flag.

## User & Entity Behavior Analytics (UEBA)

**UEBA** establishes statistical baselines for users, service accounts, and host entities to detect behavioral deviations:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/threat-hunting.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the UEBA analytics pipeline diagram at full size">
    <img src="{{ '/assets/img/threat-hunting.svg' | relative_url }}" alt="UEBA analytics pipeline: raw event ingestion, peer group comparison, Z-score calculation against the peer baseline, and entity risk score update.">
  </a>
  <p class="diagram-caption">UEBA Analytics Pipeline: Raw Event Ingestion &rarr; Peer Group Comparison &rarr; Z-Score Calculation &rarr; Risk Score Update</p>
</div>

### Core UEBA Analytics Techniques
1. **Peer Group Analytics**: Compares an individual user's behavior against their organizational cohort (*e.g., comparing a Finance Analyst's database query volume against other Finance Analysts*).
2. **Time-Series Anomaly Detection**: Detects off-hours authentication spikes, impossible travel between geographic locations, or sudden increases in data access volume.
3. **First-Seen Binary Execution**: Flags when an endpoint executes a binary hash not previously observed across the enterprise network.
4. **Z-Score Anomaly Calculation**: Calculates the statistical distance of an observed metric *x* from the mean *μ* scaled by the standard deviation *σ*:

   <p class="formula"><strong>Z = (x &minus; μ) / σ</strong></p>

   An absolute Z-score above 3.0 is a common triage cutoff for manual review. It is a convention, not a law: the interpretation assumes the metric is approximately normally distributed, and most security telemetry — process counts, authentication volumes, bytes transferred — is heavy-tailed and right-skewed. Applied raw, the cutoff over-flags busy accounts and under-flags quiet ones. Log-transform the metric first, or use robust statistics (median and median absolute deviation) in place of mean and standard deviation, before treating the threshold as meaningful.

## Post-Hunt Operationalization Lifecycle

A threat hunt is incomplete until its findings are operationalized to permanently improve enterprise security posture:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/post-hunt-operationalization.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the post-hunt operationalization feedback loop diagram at full size">
    <img src="{{ '/assets/img/post-hunt-operationalization.svg' | relative_url }}" alt="Post-hunt operationalization feedback loop: conduct hunt, remediate host, write Sigma rule, update playbook, with the published playbook and logged telemetry gaps feeding back to scope the next hunt.">
  </a>
  <p class="diagram-caption">Threat Hunting Feedback Loop: Conduct Hunt &rarr; Remediate Host &rarr; Write Sigma Rule &rarr; Update Playbook</p>
</div>

1. **Host Remediation**: Terminate malicious processes, revoke compromised credentials, and initiate incident response playbooks for confirmed compromise.
2. **Detection Rule Creation**: Convert the successful hunting query into a durable Detection-as-Code rule (Sigma YAML) to automate future alerts.
3. **Telemetry Gap Reporting**: Document missing log fields or unmonitored endpoints discovered during the hunt to improve logging infrastructure.
4. **Hunt Playbook Publication**: Archive the hunt hypothesis, queries, baseline results, and validation steps in the team's threat hunting repository.

### When a hunt becomes an incident

The moment a hunt confirms adversary activity, it stops being a hunt. Define the handoff before it is needed: the hunter declares an incident, hands the evidence and query set to incident response, and stops touching the affected hosts. Continuing to pivot on a live compromise from a hunting console tips the adversary, contaminates volatile evidence, and leaves no chain of custody. The hunt resumes afterwards with a narrower question — how far the same technique spread — while [Monitoring, Incident Response & Operational Learning]({{ '/topics/incident-response-operational-learning/' | relative_url }}) owns containment and recovery.

### A hunt that finds nothing is not a failed hunt

Most hunts return no adversary. Those hunts still produce value that must be recorded, or the program cannot justify its cost: the telemetry gaps discovered, the queries proven and reusable, the hypothesis now excluded for a defined window and data scope, and the negative result itself. Record what was searched, over what period, across which hosts — an unrecorded negative result cannot be distinguished later from a hunt that was never run.

## Essential Threat Hunting Diagnostic Checklist

The checklist below is a journal working model, not a published audit standard.

| Diagnostic Focus Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Structured Hunting Framework** | Does the hunting team follow a structured framework (PEAK) rather than unguided log browsing? | Documented Threat Hunting charters &amp; PEAK hunt plans. |
| **Telemetry Depth** | Does hunting telemetry include command-line arguments, process parentage, network flows, and API calls, with retention long enough to cover the hunt window? | SIEM log retention specs &amp; Sysmon/EDR telemetry configs. |
| **Hypothesis Generation** | Are hunting hypotheses driven by current CTI, threat actor TTPs, and high-risk architectural assets? | Threat hunt hypothesis registers &amp; CTI PIR mapping tables. |
| **UEBA Baselining** | Does the hunting team leverage UEBA anomaly scores and peer group stacking to identify compromised credentials? | UEBA platform risk dashboards &amp; anomaly investigation logs. |
| **Rule Operationalization** | Are successful hunts systematically converted into automated Sigma/YARA detection rules? | Git pull requests linking threat hunts to new Detection-as-Code rules. |
| **Incident Handoff** | Is there a defined trigger and procedure for converting a confirmed hunt finding into an incident, with the hunter standing down from the affected hosts? | Hunt-to-IR escalation procedure &amp; incident tickets originating from hunts. |
| **Negative Result Capture** | Are hunts that find nothing recorded with their scope, period, and telemetry gaps rather than discarded? | Hunt register including closed no-finding hunts. |
| **Hunt Cadence & Metrics** | Are hunts conducted on a regular cadence and measured by telemetry coverage and new detection outputs? | Quarterly threat hunt metrics reports &amp; hunt outcome logs. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Threat hunting proactively searches telemetry for undetected adversary activity. PEAK stands for Prepare, Execute, and Act with Knowledge, and defines hypothesis-driven, baseline (EDA), and model-assisted (M-ATH) hunts. UEBA Z-score baselining assumes a roughly normal distribution that security telemetry rarely has — use robust statistics. Validated discoveries become Detection-as-Code rules; a confirmed finding becomes an incident and leaves the hunter's hands.</p>
</div>

## Primary references

- **PEAK Threat Hunting Framework**: *Prepare, Execute, and Act with Knowledge — David Bianco, SURGe by Splunk (2023)* — [Splunk](https://www.splunk.com/en_us/blog/security/peak-threat-hunting-framework.html) — source for the acronym expansion and the three hunt types including M-ATH.
- **The Hunting Maturity Model**: *David Bianco, HMM0 through HMM4* — [Enterprise Detection &amp; Response](https://detect-respond.blogspot.com/2015/10/a-simple-hunting-maturity-model.html)
- **MITRE ATT&CK**: *Adversary tactics and techniques used to source hunting hypotheses* — [MITRE ATT&CK Official](https://attack.mitre.org/)
- **NIST SP 800-137**: *Information Security Continuous Monitoring (ISCM) for Federal Information Systems and Organizations* — [NIST CSRC](https://csrc.nist.gov/pubs/sp/800/137/final) — cited for the continuous monitoring substrate hunting depends on, not for hunting methodology itself.
