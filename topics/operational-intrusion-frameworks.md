---
title: Operational Intrusion Frameworks & Intrusion Analysis
description: Technical reference for operational intrusion frameworks (Lockheed Martin Cyber Kill Chain, Diamond Model of Intrusion Analysis, MITRE ATT&CK, MITRE D3FEND, and MITRE ATLAS) for post-deployment intrusion tracking, adversary campaign attribution, and defensive countermeasure mapping.
permalink: /topics/operational-intrusion-frameworks/
last_verified: 2026-08-14
---

<span class="eyebrow">Threat Intelligence & Detection / Decision Guide</span>

# Operational Intrusion Frameworks & Intrusion Analysis

<p class="lede">Operational intrusion frameworks analyze live attacks, adversary behaviors, threat actor campaigns, and defensive countermeasures post-deployment. While design-time threat modeling evaluates system architecture before code runs, operational frameworks ingest runtime telemetry—SIEM alerts, EDR events, network flow data, and memory forensics—to track breach progression, attribute threat campaigns, and map defensive coverage against real-world tactics, techniques, and procedures (TTPs).</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/operational-intrusion-frameworks.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the operational intrusion frameworks architecture diagram at full size">
    <img src="{{ '/assets/img/operational-intrusion-frameworks.svg' | relative_url }}" alt="Operational Intrusion Frameworks Architecture diagram showing Lockheed Martin Cyber Kill Chain, Diamond Model of Intrusion Analysis, MITRE ATT&CK Enterprise Matrix, D3FEND, and ATLAS.">
  </a>
  <p class="diagram-caption">Operational Intrusion Frameworks: Cyber Kill Chain (7 Stages) &leftrightarrow; Diamond Model Attribution &leftrightarrow; MITRE ATT&amp;CK Matrix &leftrightarrow; MITRE D3FEND Countermeasures &leftrightarrow; ATLAS AI Threat Matrix</p>
</div>

## Framework Overview & Primary Applications

Security Operations Centers (SOC), Incident Response (IR) teams, and Threat Intelligence analysts leverage distinct operational frameworks depending on the analytical task:

| Framework Name | Primary Focus &amp; Scope | Structural Execution Model | Primary Engineering Application |
|---|---|---|---|
| **Cyber Kill Chain (Lockheed Martin)** | Linear intrusion lifecycle tracing external adversary progression. | 7 Sequential Stages: *Recon, Weaponize, Deliver, Exploit, Install, C2, Actions on Objectives*. | Perimeter intrusion tracking, SOC alert escalation, linear breach progression analysis. |
| **Diamond Model (Caltagirone et al.)** | Adversary attribution, event relationship mapping, and threat actor campaign pivoting. | Graph mapping 4 vertices: **Adversary**, **Capability**, **Infrastructure**, and **Victim**. | Incident pivoting, threat actor campaign tracking, threat intelligence attribution. |
| **[MITRE ATT&CK](https://attack.mitre.org/)** | Globally accessible knowledge base of adversary tactics, techniques, and procedures (TTPs). | Three platform matrices—Enterprise (15 Tactics as of v19), Mobile, and ICS—mapping goals to technical methods. | Threat-informed defense, adversary emulation, detection engineering, and SIEM alert mapping. |
| **[MITRE D3FEND](https://d3fend.mitre.org/)** | Defensive countermeasure knowledge graph mapped directly against ATT&CK TTPs. | Defensive Hierarchy: *Model, Harden, Detect, Isolate, Deceive, Evict, Restore*. | Security engineering control selection, countermeasure mapping, and gap validation. |
| **[MITRE ATLAS](https://atlas.mitre.org/)** | Standalone knowledge base of adversary tactics and techniques against AI/ML systems. | Modeled after ATT&CK's methodology for AI/ML pipelines and LLM deployments. | AI/ML system threat modeling, adversarial ML red-teaming, and AI-specific detection engineering. |

## Deep Dive: Lockheed Martin Cyber Kill Chain

Developed by Lockheed Martin, the **Cyber Kill Chain** models an external intrusion as a 7-stage sequential chain. In the model's own premise the adversary must complete every stage in order, so disrupting any single stage is intended to break the intrusion — a claim that holds only to the extent the linearity assumption holds (see the scope limitations below):

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/cyber-kill-chain.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the Cyber Kill Chain seven-stage diagram at full size">
    <img src="{{ '/assets/img/cyber-kill-chain.svg' | relative_url }}" alt="Lockheed Martin Cyber Kill Chain showing seven sequential stages: reconnaissance, weaponization, delivery, exploitation, installation, command and control, and actions on objectives.">
  </a>
  <p class="diagram-caption">Cyber Kill Chain: Recon &rarr; Weaponize &rarr; Deliver &rarr; Exploit &rarr; Install &rarr; C2 &rarr; Actions on Objectives</p>
</div>

1. **Reconnaissance**: Adversary harvests target information (harvesting emails, scanning IP ranges, social engineering).
2. **Weaponization**: Coupling malware exploit payloads with a deliverable document or file (*e.g., weaponized PDF or macro*).
3. **Delivery**: Transmitting the weaponized payload to the target environment (*e.g., spearphishing email, web drive-by*).
4. **Exploitation**: Triggering the payload code execution by exploiting a software vulnerability or user action.
5. **Installation**: Establishing persistent access on the victim endpoint (*e.g., registry run keys, scheduled tasks, web shells*).
6. **Command & Control (C2)**: Establishing a bi-directional communication channel back to adversary infrastructure.
7. **Actions on Objectives**: Executing the ultimate breach goal (*e.g., data exfiltration, ransomware encryption, wiper execution*).

### Kill Chain Scope Limitations
- **External Intruder Focus**: Assumes an external adversary progressing sequentially through perimeter defenses.
- **Insider Threat Weakness**: Poorly models insider threats or compromised credentials, where an insider skips Recon, Weaponization, and Delivery to execute Actions on Objectives directly.
- **Non-Linear Attacks**: Modern multi-stage intrusions move fluidly between lateral movement, credential harvesting, and execution loops rather than following a strict 1-to-7 sequence.

## Deep Dive: Diamond Model of Intrusion Analysis

Developed by Caltagirone, Pendergast, and Betz (2013), the **Diamond Model** represents malicious activity as an atomic **event** defined by four core vertices connected by two structural axes:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/diamond-model.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the Diamond Model of Intrusion Analysis diagram at full size">
    <img src="{{ '/assets/img/diamond-model.svg' | relative_url }}" alt="Diamond Model of Intrusion Analysis: Adversary at top, Victim at bottom, Capability at left, Infrastructure at right. The vertical Adversary-to-Victim diagonal is the socio-political axis; the horizontal Capability-to-Infrastructure diagonal is the technology axis.">
  </a>
  <p class="diagram-caption">Diamond Model: Adversary &leftrightarrow; Victim on the socio-political axis; Capability &leftrightarrow; Infrastructure on the technology axis</p>
</div>

### Core Vertices & Structural Axes
- **Adversary**: The threat actor or group executing the intrusion (*e.g., APT29, FIN7*).
- **Capability**: The specific exploit, tool, malware, or TTP executed (*e.g., Mimikatz, Cobalt Strike, Custom Shellcode*).
- **Infrastructure**: The physical or virtual assets facilitating the attack (*e.g., C2 IPs, compromised domain names, SOCKS proxies*).
- **Victim**: The target asset, user, email address, or organization (*e.g., Enterprise Domain Controller, Finance User*).
- **Technology Axis**: Connects *Capability* &harr; *Infrastructure*, representing the technical execution mechanism.
- **Socio-Political Axis**: Connects *Adversary* &harr; *Victim*, representing threat actor motivation, intent, and relationship.

### Meta-Features & Campaign Pivoting
Every Diamond event records key **meta-features**: *Timestamp*, *Phase* (Kill Chain stage), *Result* (Success/Failure), *Direction* (Inbound/Outbound), *Methodology*, and *Resources*.

Analysts use **pivoting** across Diamond vertices to discover unknown indicators during incident response:
- *Pivot on Infrastructure*: Query passive DNS for all domains resolving to a C2 IP address &rarr; discover new C2 infrastructure.
- *Pivot on Capability*: Hash a custom malware binary and search YARA rules across threat telemetry &rarr; discover additional victims.
- *Activity Threads*: Connect multiple sequential Diamond events into a graph representing an entire multi-stage campaign.

## Deep Dive: MITRE ATT&CK Matrix & Conceptual Hierarchy

**MITRE ATT&CK** (Adversarial Tactics, Techniques, and Common Knowledge) is a globally accessible knowledge base of real-world adversary behaviors compiled from observed incident reporting.

### ATT&CK Structural Hierarchy Taxonomy

Understanding ATT&CK requires distinguishing the four structural tiers of adversary behavior:

- **Tactic**: The adversary's tactical goal (the *why*, e.g., *Credential Access*).
- **Technique**: The technical method used to achieve a tactic (the *how*, e.g., *OS Credential Dumping*).
- **Sub-technique**: A granular variation of a technique (e.g., *LSASS Memory*).
- **Procedure**: The specific implementation or execution details used by an adversary (e.g., executing `mimikatz.exe sekurlsa::logonpasswords`).

### The 15 Enterprise ATT&CK Tactics

Enterprise ATT&CK currently defines 15 tactical categories covering the end-to-end intrusion lifecycle:

1. **Reconnaissance**: Gathering target information before attack initiation.
2. **Resource Development**: Establishing C2 infrastructure, acquiring domains, and buying accounts.
3. **Initial Access**: Gaining an initial foothold in the victim network (*e.g., Phishing, Exploit Public-Facing App*).
4. **Execution**: Running malicious code on local or remote systems (*e.g., PowerShell, Command Shell*).
5. **Persistence**: Maintaining access across system restarts and credential changes (*e.g., Scheduled Tasks, Web Shells*).
6. **Privilege Escalation**: Gaining higher-level permissions (*e.g., Process Injection, Sudo Abuse*).
7. **Stealth**: Hiding and concealing adversary actions so they appear as normal behavior (*e.g., Masquerading, Obfuscated Files or Information*).
8. **Defense Impairment**: Degrading, disabling, or undermining the effectiveness and trustworthiness of security controls and monitoring (*e.g., Impair Defenses, Indicator Removal*).
9. **Credential Access**: Stealing credentials (*e.g., LSASS Memory Dumping, Kerberoasting*).
10. **Discovery**: Exploring the victim environment (*e.g., Network Service Discovery, Account Discovery*).
11. **Lateral Movement**: Moving through the network to access high-value targets (*e.g., Pass the Hash, SSH Hijacking*).
12. **Collection**: Gathering target data of interest (*e.g., Screen Capture, Clipboard Data*).
13. **Command and Control**: Communicating with controlled systems (*e.g., Application Layer Protocol, Ingress Tool Transfer*).
14. **Exfiltration**: Stealing data out of the target environment (*e.g., Exfiltration Over C2 Channel, Cloud Storage*).
15. **Impact**: Disrupting, corrupting, or destroying systems and data (*e.g., Data Encrypted for Impact, Wiper Malware*).

> **Tactic sets change between releases.** The 2026 releases restructured the mid-chain: `TA0005` was renamed from *Defense Evasion* to **Stealth**, and **Defense Impairment** (`TA0112`) was added as a separate tactic on 14 April 2026, taking Enterprise from 14 tactics to 15. Treat any fixed count — including this one — as a snapshot, and verify against the [current Enterprise matrix](https://attack.mitre.org/matrices/enterprise/) before using it in coverage reporting or an audit artifact. Detection content tagged against retired tactic names will not map cleanly after an upgrade.

## Deep Dive: MITRE D3FEND & MITRE ATLAS

### MITRE D3FEND Countermeasure Mapping
While ATT&CK maps offensive adversary techniques, **MITRE D3FEND** is a defensive countermeasure knowledge graph. It is an NSA-funded research artifact rather than a settled standard, and its ontology continues to evolve across releases (currently v1.5.0). D3FEND organizes defensive capabilities into 7 core functions:

- **Model**: System mapping &amp; inventory (*e.g., Network Mapping, Asset Inventory*).
- **Harden**: Reducing attack surface (*e.g., Application Isolation, Memory Encryption*).
- **Detect**: Identifying active attacks (*e.g., Process Lineage Analysis, File Integrity Monitoring*).
- **Isolate**: Containing malicious activity (*e.g., Executable Sandboxing, Network Microsegmentation*).
- **Deceive**: Deploying traps (*e.g., Honeytokens, Decoy Accounts*).
- **Evict**: Removing adversary access (*e.g., Process Termination, Credential Revocation*).
- **Restore**: Recovering system state (*e.g., Backup Restoration, System Re-imaging*).

D3FEND links directly to ATT&CK techniques, allowing security engineers to select countermeasures designed to disrupt specific TTPs.

### MITRE ATLAS AI/ML Threat Matrix
**MITRE ATLAS** (Adversarial Threat Landscape for Artificial-Intelligence Systems) is a standalone matrix specifically modeling adversary TTPs targeting AI and Machine Learning systems. Representative threat classes include:

- **Data Poisoning**: Manipulating training datasets to introduce backdoor triggers or degrade model accuracy.
- **Model Inversion & Exfiltration**: Extracting proprietary model weights or training data through inference queries.
- **Prompt Injection**: Overriding LLM system prompts to bypass safety guardrails or execute unauthorized function calls.
- **Evasion Attacks**: Modifying adversarial inputs (*e.g., perturbed images or malware binaries*) to bypass ML classifiers.

[AI & LLM Threat Frameworks & Risk Management](../ai-risk-management/) covers ATLAS alongside the NIST AI RMF and the OWASP Top 10 for LLM Applications, where the governance framing matters more than the intrusion-analysis framing used here.

## Design-Time Threat Modeling vs. Operational Intrusion Analysis

| Operational Dimension | Design-Time Threat Modeling (STRIDE / PASTA) | Operational Intrusion Intelligence (ATT&amp;CK / Kill Chain) | Key Engineering Distinction |
|---|---|---|---|
| **Primary Emphasis** | Architecture and system design-time analysis. | Live SOC operations, incident response, and threat hunting. | Design-oriented vs. detection/response-oriented emphasis. |
| **Primary Input** | Data Flow Diagrams (DFDs), API specs, software blueprints. | EDR telemetry, SIEM logs, packet captures, threat intel feeds. | Structural architecture vs. behavioral telemetry. |
| **Primary Output** | Security control requirements, architectural refactoring. | Detection rules, investigation pivots, emulation plans. | Design decisions vs. operational detection &amp; response. |
| **Insider Threat Scope** | STRIDE's Elevation of Privilege category models insider privilege abuse directly. | Kill Chain is poor for insiders; ATT&amp;CK contains many techniques an insider would use, but insider-specific coverage is maintained separately in the CTID Insider Threat TTP Knowledge Base. | Neither operational framework is an insider-threat model on its own. |

## Essential Operational Intrusion Diagnostic Checklist

The checklist below is a journal working model, not a published audit standard. It converts the framework distinctions above into a repeatable review of a SOC or threat intelligence pipeline.

| Diagnostic Focus Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Non-Linear Analysis** | Does incident response leverage ATT&CK matrices rather than relying strictly on linear Kill Chain models? | IR playbooks, threat hunting queries, &amp; incident timelines. |
| **Pivoting Capabilities** | Do threat intelligence analysts use Diamond Model pivoting across Infrastructure, Capability, and Victim vertices? | Threat intelligence reports &amp; OpenCTI/MISP event graphs. |
| **Countermeasure Validation** | Are ATT&CK techniques mapped to candidate D3FEND measures, then validated empirically through testing? | Tested SIEM/EDR detections &amp; adversary emulation results. |
| **Tactics vs Procedures** | Are SOC alerts categorized by ATT&CK Tactics/Techniques while procedures capture specific execution payloads? | SIEM alert rule metadata &amp; EDR detection tagging. |
| **Framework Version Currency** | Is detection content re-mapped after each ATT&CK release, so renamed or newly split tactics do not silently break coverage reporting? | ATT&CK version pinned in rule metadata &amp; upgrade diff reviews. |
| **AI/ML Security Coverage** | Are AI/ML systems evaluated against MITRE ATLAS for prompt injection, data poisoning, and model inversion threats? | AI red-team reports &amp; LLM guardrail validation test logs. |
| **Empirical Coverage Heatmap** | Is ATT&CK coverage reported based on verified detection tests rather than theoretical mapping alone? | Automated BAS test results &amp; EDR coverage scoring reports. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Operational intrusion frameworks analyze live attack telemetry. The Cyber Kill Chain models 7 linear external stages, the Diamond Model maps 4 vertices (Adversary, Capability, Infrastructure, Victim) for campaign pivoting, ATT&CK details 15 Enterprise tactics as of v19, D3FEND maps defensive countermeasures, and ATLAS addresses AI/ML system threats. Never hardcode an ATT&CK tactic count or name without re-checking the current matrix.</p>
</div>

## Primary references

- **MITRE ATT&amp;CK**: *Adversarial Tactics, Techniques, and Common Knowledge* — [MITRE ATT&amp;CK Official](https://attack.mitre.org/) · [Current Enterprise matrix](https://attack.mitre.org/matrices/enterprise/) — source for the 15-tactic set, the Stealth rename (`TA0005`), and Defense Impairment (`TA0112`).
- **MITRE D3FEND**: *A Knowledge Graph of Cybersecurity Countermeasures* — [MITRE D3FEND Official](https://d3fend.mitre.org/)
- **MITRE ATLAS**: *Adversarial Threat Landscape for Artificial-Intelligence Systems* — [MITRE ATLAS Official](https://atlas.mitre.org/)
- **Lockheed Martin Cyber Kill Chain**: *Seven Steps of Cyber Kill Chain* — [Lockheed Martin](https://www.lockheedmartin.com/en-us/capabilities/cyber/cyber-kill-chain.html)
- **Diamond Model of Intrusion Analysis**: *Caltagirone, S., Pendergast, A., &amp; Betz, C. (2013), Center for Cyber Intelligence Analysis and Threat Research* — [Original paper (PDF)](https://www.activeresponse.org/wp-content/uploads/2013/07/diamond.pdf)
