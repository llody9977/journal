---
title: Adversary Emulation & Continuous Security Validation
description: Technical reference for Adversary Emulation, Purple Teaming, Breach & Attack Simulation (BAS), Atomic Red Team, MITRE CALDERA, rules of engagement, and empirical ATT&CK detection coverage validation.
permalink: /topics/adversary-emulation/
last_verified: 2026-08-14
---

<span class="eyebrow">Threat Intelligence & Detection / Decision Guide</span>

# Adversary Emulation & Continuous Security Validation

<p class="lede">Adversary Emulation and Continuous Security Validation empirically test an organization's defense posture by executing real-world TTP payloads in target environments. Rather than assuming security controls work based on vendor claims or theoretical ATT&CK mapping, adversary emulation—leveraging Purple Teaming, Atomic Red Team, MITRE CALDERA, and Breach & Attack Simulation (BAS)—shows whether telemetry was captured, SIEM rules fired, and SOC teams responded.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/adversary-emulation-validation.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the adversary emulation architecture diagram at full size">
    <img src="{{ '/assets/img/adversary-emulation-validation.svg' | relative_url }}" alt="Adversary Emulation &amp; Continuous Security Validation Architecture diagram showing Purple Teaming workflows, Atomic Red Team execution, Breach &amp; Attack Simulation (BAS), and empirical ATT&amp;CK coverage scoring.">
  </a>
  <p class="diagram-caption">Adversary Emulation Pipeline: TTP Selection &leftrightarrow; Atomic Red Team Payload Execution &leftrightarrow; Telemetry &amp; SIEM Alert Verification &leftrightarrow; Empirical ATT&amp;CK Coverage Heatmap Scoring</p>
</div>

## Authorization and Rules of Engagement

Adversary emulation executes real attack techniques against production systems. The technique below dumps credential material from live process memory; it is not a simulation, and running it without authorization is indistinguishable from an intrusion. Settle the following before any execution:

- **Written authorization** naming the systems in scope, the techniques permitted, the execution window, and the person who signed it. Verbal approval from a manager is not a scope document.
- **Explicit exclusions**: systems, data classes, and accounts that are out of scope regardless of what a test plan says — production payment paths, systems holding regulated personal data, third-party-operated infrastructure, and anything subject to a separate contractual restriction.
- **Deconfliction and a stop condition**: a live channel to the SOC, an agreed way to prove "that alert was us," and a defined trigger for aborting. Without it, a successful test consumes a real incident response.
- **Artifact handling**: memory dumps and recovered credential material are real secrets. Define up front who collects them, where they are stored, how they are destroyed, and by when. Rotate any credential that was actually exposed.
- **Standing authorization for automated runs**: a BAS agent firing on a CI/CD trigger inherits its authorization only if the trigger's scope is bounded by that authorization. Automation does not extend a one-off approval.

Red team activity may also engage legal and regulatory obligations that differ by jurisdiction and by contract, particularly where third-party or cloud-hosted infrastructure is in scope. Confirm those constraints with the accountable owner rather than inferring them.

## Alignment Models: Red Teaming vs. Purple Teaming vs. BAS

Enterprise security testing operates across 3 execution models based on operational goals and transparency:

| Testing Model | Primary Purpose &amp; Scope | Operational Execution | Primary Outcome / Deliverable |
|---|---|---|---|
| **Red Teaming** | Objective-based, stealthy adversarial simulation testing overall defense posture. | Zero-notice attack simulation executing covert multi-stage intrusion paths. | Assessment of SOC detection capabilities, response bottlenecks, and path to breach. |
| **Purple Teaming** | Transparent, collaborative exercise pairing offensive red operators directly with SOC defenders. | Real-time joint execution: Red executes TTP &rarr; Blue inspects SIEM telemetry &rarr; Detection rule tuned immediately. | Immediate detection gap closure, telemetry parser fixes, and optimized Sigma rules. |
| **Breach &amp; Attack Simulation (BAS)** | Continuous, automated testing of defensive controls across enterprise endpoints and networks. | Automated agents execute atomic TTP payloads on a scheduled or CI/CD trigger — some safely simulated, others performing the real technique. | Continuous empirical ATT&CK detection scoring and automated drift detection. |

## Open Emulation Frameworks: Atomic Red Team & CALDERA

### 1. Atomic Red Team (Red Canary)
**Atomic Red Team** is an open-source library of small, portable, vendor-neutral TTP tests mapped directly to MITRE ATT&CK. Each technique lives in its own file at `atomics/<technique-id>/<technique-id>.yaml`, and every test within that file covers only that technique. The excerpt below is abridged from the T1003.001 file:

```yaml
attack_technique: T1003.001
display_name: 'OS Credential Dumping: LSASS Memory'
atomic_tests:
  - name: Dump LSASS.exe Memory using comsvcs.dll
    auto_generated_guid: 2536dee2-12fb-459a-8c37-971844fa73be
    description: |
      Executes comsvcs.dll via rundll32.exe to dump LSASS process memory into a minidump file.
      Requires Administrative privileges. The resulting dump contains live credential material.
    supported_platforms:
      - windows
    input_arguments:
      output_file:
        description: Location to save the LSASS dump file
        type: Path
        default: C:\Windows\Temp\lsass.dmp
    executor:
      command: |
        $lsass_pid = (Get-Process lsass).Id
        rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump $lsass_pid #{output_file} full
      cleanup_command: |
        Remove-Item #{output_file} -ErrorAction SilentlyContinue
      name: powershell
      elevation_required: true
```

A test for a different technique belongs in a different file. PowerShell execution is `T1059.001`, so it lives under `atomics/T1059.001/`:

```yaml
attack_technique: T1059.001
display_name: 'Command and Scripting Interpreter: PowerShell'
atomic_tests:
  # auto_generated_guid omitted: use the GUID from the upstream repository, do not invent one.
  - name: PowerShell Encoded Command Execution
    description: Executes an encoded PowerShell command string to emulate adversary obfuscated execution.
    supported_platforms:
      - windows
    input_arguments:
      encoded_command:
        description: >
          Base64 of the UTF-16LE (Unicode) encoding of the command. PowerShell's
          -EncodedCommand requires UTF-16LE; base64 of UTF-8 bytes will not decode.
          Produced by:
            [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes("Write-Host 'Atomic Test'"))
        type: string
        default: "VwByAGkAdABlAC0ASABvAHMAdAAgACcAQQB0AG8AbQBpAGMAIABUAGUAcwB0ACcA"
    executor:
      command: |
        powershell.exe -NoProfile -EncodedCommand #{encoded_command}
      name: powershell
      elevation_required: false
```

### 2. MITRE CALDERA
**MITRE CALDERA** is an automated adversary emulation platform built on an agent-server architecture:
- **Abilities**: Atomic commands representing specific ATT&CK TTPs.
- **Adversary Profiles**: Sequenced collections of abilities mimicking real-world threat actors (*e.g., APT29 profile*).
- **Plugins**: Modules for automated triage, network discovery, and automated purple teaming.

### 3. Emulation Plans: the CTID Adversary Emulation Library
Single atomics test one technique in isolation. A full **emulation plan** chains techniques in the order and with the tooling a specific actor actually used, which exposes detection gaps that appear only in sequence — for example, a rule that fires on credential dumping but not when the same dump follows a successful defense-impairment step. The [Center for Threat-Informed Defense Adversary Emulation Library](https://github.com/center-for-threat-informed-defense/adversary_emulation_library) publishes open, intelligence-derived plans for named actors, and is the natural next step once atomic coverage is established.

> Prelude Operator, an open desktop emulation platform previously listed here, is no longer offered: Prelude Security has rebranded to Origin and its remaining product line is Prelude Monitor. Treat older references to Operator and its Pneuma agent as historical.

## Continuous Security Validation Workflow

Continuous security validation transitions security testing from sporadic annual penetration tests to continuous, automated empirical measurement:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/adversary-emulation.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the continuous security validation sequence diagram at full size">
    <img src="{{ '/assets/img/adversary-emulation.svg' | relative_url }}" alt="Continuous security validation sequence: select target TTP, execute atomic payload, verify telemetry ingestion, check alert generation, then score coverage and remediate.">
  </a>
  <p class="diagram-caption">Continuous Validation Sequence: Select Target TTP &rarr; Execute Atomic Payload &rarr; Verify Telemetry Ingestion &rarr; Check Alert Generation &rarr; Score &amp; Remediate</p>
</div>

1. **Select Target TTP**: Choose a specific ATT&CK technique (*e.g., T1059.001 PowerShell Execution*).
2. **Execute Atomic Payload**: Trigger the corresponding Atomic Red Team script via an automated BAS agent or CI/CD runner, within the authorized scope.
3. **Verify Telemetry Ingestion**: Query the SIEM/EDR log repository to confirm raw process creation logs were captured.
4. **Check Alert Generation**: Validate whether the active SIEM detection rule generated an actionable alert ticket.
5. **Score & Remediate**: Update the empirical ATT&CK coverage score. If un-alerted, initiate detection tuning to patch the gap.

Verify ingestion separately from alerting. The two failures look identical on a dashboard and have completely different fixes: a missing log is a pipeline or agent problem, while a present log with no alert is a rule problem.

## Theoretical Mapping vs. Empirical Coverage Scoring

A critical weakness in enterprise security governance is mistaking **theoretical ATT&CK mapping** (vendor claims) for **empirical coverage** (proven test evidence):

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/coverage-theoretical-vs-empirical.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the theoretical versus empirical coverage comparison diagram at full size">
    <img src="{{ '/assets/img/coverage-theoretical-vs-empirical.svg' | relative_url }}" alt="Theoretical mapping, sourced from vendor documentation and static rule tags, is blind to ingestion outages, broken parsers, EDR exclusions and un-tuned filters. Empirical coverage, sourced from executed atomic tests and verified alerts, closes those gaps but remains blind to agent-only execution paths, benign-payload divergence and test-versus-production drift.">
  </a>
  <p class="diagram-caption">ATT&CK Coverage Discrepancy: Theoretical Documentation Mapping vs. Tested Empirical Detections</p>
</div>

| Coverage Dimension | Theoretical Mapping | Empirical Measured Coverage |
|---|---|---|
| **Data Source** | Vendor documentation &amp; static rule tags. | Executed Atomic Red Team test logs &amp; verified SIEM alerts. |
| **What it establishes** | Only that a detection is claimed to exist. | That the alert actually fired, for that payload, on that date. |
| **Failure Drivers Missed** | Ingestion pipeline outages, broken parsers, EDR exclusions, un-tuned filters. | Reduced, not eliminated — still misses agent-only execution paths, benign-payload telemetry divergence, test-vs-production drift, and detections over-fitted to the specific atomic. |
| **Governance Trust** | Low (high risk of false confidence). | Higher — evidence is dated and scoped to what was actually executed. |
| **Update Mechanism** | Static documentation reviews. | Automated CI/CD execution runs &amp; BAS dashboards. |

Empirical testing reduces unverified assumptions; it does not eliminate them. A passing atomic proves that one payload, on one host build, produced one alert on the day it ran. Techniques with no safe atomic remain untested, and a detection tuned until the atomic passes may be matching the test harness rather than the adversary behavior.

## Essential Adversary Emulation Diagnostic Checklist

The checklist below is a journal working model, not a published audit standard.

| Diagnostic Focus Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Authorization & Scope** | Does every exercise, including automated BAS runs, execute under a current written authorization naming systems, techniques, and exclusions? | Signed rules of engagement &amp; scope documents referenced by the BAS job config. |
| **Purple Teaming Cadence** | Are collaborative Purple Teaming exercises conducted regularly between red operators and SOC defenders? | Purple team exercise logs, delta reports, &amp; fixed rule commits. |
| **Automated BAS Testing** | Are Atomic Red Team or CALDERA tests executed automatically on a scheduled or CI/CD pipeline trigger? | BAS platform execution logs &amp; CI validation pipeline reports. |
| **Production Safety** | Are atomic test payloads reviewed for blast radius and paired with cleanup commands, with recovered secrets rotated afterwards? | Atomic YAML cleanup validation, change approvals, &amp; credential rotation records. |
| **Telemetry Ingestion Check** | Does emulation testing verify raw log ingestion separately from SIEM alert rule triggering? | SIEM search queries confirming raw log arrival vs. alert generation. |
| **MTTD / MTTR Measurement** | Is Mean Time to Detect (MTTD) and Respond (MTTR) measured during adversary emulation exercises? | Exercise timing logs &amp; SOC escalation ticket timestamps. |
| **Chained Emulation** | Does testing go beyond isolated atomics to sequenced actor emulation plans that expose gaps appearing only in combination? | CTID emulation plan run reports &amp; multi-stage exercise timelines. |
| **Empirical Heatmaps** | Are ATT&CK coverage heatmaps generated strictly from verified test execution data, with the test date and ATT&CK version recorded? | Automated ATT&CK Navigator heatmaps backed by test execution IDs. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Adversary Emulation replaces theoretical vendor mapping with test-backed coverage. Execute Atomic Red Team tests and CALDERA profiles through Purple Teaming and BAS — always under written authorization, since the payloads are real. A passing atomic proves one payload produced one alert on one host on one day; it is evidence, not a guarantee.</p>
</div>

## Primary references

- **Atomic Red Team**: *Library of small, portable, vendor-neutral TTP tests* — [Atomic Red Team Official](https://www.atomicredteam.io/) · [T1003.001 atomics](https://github.com/redcanaryco/atomic-red-team/blob/master/atomics/T1003.001/T1003.001.yaml) — source for the test name and GUID quoted above.
- **MITRE CALDERA**: *Automated Adversary Emulation Platform* — [MITRE CALDERA Official](https://caldera.mitre.org/)
- **CTID Adversary Emulation Library**: *Open, intelligence-derived emulation plans for named threat actors* — [Center for Threat-Informed Defense](https://github.com/center-for-threat-informed-defense/adversary_emulation_library)
- **MITRE ATT&CK Evaluations**: *Independent evaluations of security products against adversary emulation plans* — [MITRE ATT&CK Evaluations](https://evals.mitre.org/)
