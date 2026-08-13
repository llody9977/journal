---
title: Operational Intrusion Frameworks & Intrusion Analysis
description: Comprehensive technical guide to operational intrusion frameworks (Lockheed Martin Cyber Kill Chain, Diamond Model of Intrusion Analysis, MITRE ATT&CK, MITRE D3FEND, and MITRE ATLAS) for post-deployment intrusion tracking, adversary campaign attribution, and defensive countermeasure mapping.
permalink: /topics/operational-intrusion-frameworks/
last_verified: 2026-08-13
---

<span class="eyebrow">Threat Intelligence & Detection / Decision Guide</span>

# Operational Intrusion Frameworks & Intrusion Analysis

<p class="lede">Operational intrusion frameworks analyze live attacks, adversary behaviors, threat actor campaigns, and defensive countermeasures post-deployment. While design-time threat modeling evaluates system architecture before code runs, operational frameworks ingest runtime telemetry—SIEM alerts, EDR events, network flow data, and memory forensics—to track breach progression, attribute threat campaigns, and map defensive coverage against real-world tactics, techniques, and procedures (TTPs).</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/operational-intrusion-frameworks.svg' | relative_url }}" alt="Operational Intrusion Frameworks Architecture diagram showing Lockheed Martin Cyber Kill Chain, Diamond Model of Intrusion Analysis, MITRE ATT&CK Enterprise Matrix, D3FEND, and ATLAS.">
  <p class="diagram-caption">Operational Intrusion Frameworks: Cyber Kill Chain (7 Stages) &leftrightarrow; Diamond Model Attribution &leftrightarrow; MITRE ATT&amp;CK Matrix &leftrightarrow; MITRE D3FEND Countermeasures &leftrightarrow; ATLAS AI Threat Matrix</p>
</div>

## Framework Overview & Primary Applications

Security Operations Centers (SOC), Incident Response (IR) teams, and Threat Intelligence analysts leverage distinct operational frameworks depending on the analytical task:

| Framework Name | Primary Focus &amp; Scope | Structural Execution Model | Primary Engineering Application |
|---|---|---|---|
| **Cyber Kill Chain (Lockheed Martin)** | Linear intrusion lifecycle tracing external adversary progression. | 7 Sequential Stages: *Recon, Weaponize, Deliver, Exploit, Install, C2, Actions on Objectives*. | Perimeter intrusion tracking, SOC alert escalation, linear breach progression analysis. |
| **Diamond Model (Caltagirone et al.)** | Adversary attribution, event relationship mapping, and threat actor campaign pivoting. | Graph mapping 4 vertices: **Adversary**, **Capability**, **Infrastructure**, and **Victim**. | Incident pivoting, threat actor campaign tracking, threat intelligence attribution. |
| **[MITRE ATT&CK](https://attack.mitre.org/)** | Globally accessible knowledge base of adversary tactics, techniques, and procedures (TTPs). | Three platform matrices—Enterprise (14 Tactics), Mobile, and ICS—mapping goals to technical methods. | Threat-informed defense, adversary emulation, detection engineering, and SIEM alert mapping. |
| **[MITRE D3FEND](https://d3fend.mitre.org/)** | Defensive countermeasure knowledge graph mapped directly against ATT&CK TTPs. | Defensive Hierarchy: *Model, Harden, Detect, Isolate, Deceive, Evict, Restore*. | Security engineering control selection, countermeasure mapping, and gap validation. |
| **[MITRE ATLAS](https://atlas.mitre.org/)** | Standalone knowledge base of adversary tactics and techniques against AI/ML systems. | Modeled after ATT&CK's methodology for AI/ML pipelines and LLM deployments. | AI/ML system threat modeling, adversarial ML red-teaming, and AI-specific detection engineering. |

## Deep Dive: Lockheed Martin Cyber Kill Chain

Developed by Lockheed Martin, the **Cyber Kill Chain** models an external intrusion as a 7-stage sequential chain. Disrupting the adversary at any single stage breaks the intrusion:

<div class="diagram-frame">
  <img src="{{ '/assets/img/operational-intrusion-frameworks.svg' | relative_url }}" alt="Lockheed Martin Cyber Kill Chain 7-stage intrusion lifecycle diagram.">
  <p class="diagram-caption">Cyber Kill Chain: Recon &leftrightarrow; Weaponize &leftrightarrow; Deliver &leftrightarrow; Exploit &leftrightarrow; Install &leftrightarrow; C2 &leftrightarrow; Actions on Objectives</p>
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

```
                  [ ADVERSARY ]
                       │
                       │  Socio-Political Axis
                       │
  [ CAPABILITY ] ──────┼────── [ INFRASTRUCTURE ]
                       │
                       │  Technology Axis
                       │
                   [ VICTIM ]
```

### Core Vertices & Structural Axes
- **Adversary**: The threat actor or group executing the intrusion (*e.g., APT29, FIN7*).
- **Capability**: The specific exploit, tool, malware, or TTP executed (*e.g., Mimikatz, Cobalt Strike, Custom Shellcode*).
- **Infrastructure**: The physical or virtual assets facilitating the attack (*e.g., C2 IPs, compromised domain names, SOCKS proxies*).
- **Victim**: The target asset, user, email address, or organization (*e.g., Enterprise Domain Controller, Finance User*).
- **Technology Axis**: Connects *Capability* $\longleftrightarrow$ *Infrastructure*, representing the technical execution mechanism.
- **Socio-Political Axis**: Connects *Adversary* $\longleftrightarrow$ *Victim*, representing threat actor motivation, intent, and relationship.

### Meta-Features & Campaign Pivoting
Every Diamond event records key **meta-features**: *Timestamp*, *Phase* (Kill Chain stage), *Result* (Success/Failure), *Direction* (Inbound/Outbound), *Methodology*, and *Resources*.

Analysts use **pivoting** across Diamond vertices to discover unknown indicators during incident response:
- *Pivot on Infrastructure*: Query passive DNS for all domains resolving to a C2 IP address $\rightarrow$ discover new C2 infrastructure.
- *Pivot on Capability*: Hash a custom malware binary and search YARA rules across threat telemetry $\rightarrow$ discover additional victims.
- *Activity Threads*: Connect multiple sequential Diamond events into a graph representing an entire multi-stage campaign.

## Deep Dive: MITRE ATT&CK Matrix & Conceptual Hierarchy

**MITRE ATT&CK** (Adversary Tactics, Techniques, and Knowledge Base) is the globally authoritative knowledge base of real-world adversary behaviors based on empirical incident observations.

### ATT&CK Structural Hierarchy Taxonomy

Understanding ATT&CK requires distinguishing the four structural tiers of adversary behavior:

- **Tactic**: The adversary's tactical goal (the *why*, e.g., *Credential Access*).
- **Technique**: The technical method used to achieve a tactic (the *how*, e.g., *OS Credential Dumping*).
- **Sub-technique**: A granular variation of a technique (e.g., *LSASS Memory*).
- **Procedure**: The specific implementation or execution details used by an adversary (e.g., executing `mimikatz.exe sekurlsa::logonpasswords`).

### The 14 Enterprise ATT&CK Tactics
Enterprise ATT&CK defines 14 tactical categories covering the end-to-end intrusion lifecycle:

1. **Reconnaissance**: Gathering target information before attack initiation.
2. **Resource Development**: Establishing C2 infrastructure, acquiring domains, and buying accounts.
3. **Initial Access**: Gaining an initial foothold in the victim network (*e.g., Phishing, Exploit Public-Facing App*).
4. **Execution**: Running malicious code on local or remote systems (*e.g., PowerShell, Command Shell*).
5. **Persistence**: Maintaining access across system restarts and credential changes (*e.g., Scheduled Tasks, Web Shells*).
6. **Privilege Escalation**: Gaining higher-level permissions (*e.g., Process Injection, Sudo Abuse*).
7. **Defense Evasion**: Avoiding detection mechanisms (*e.g., Masquerading, Obfuscated Files*).
8. **Credential Access**: Stealing credentials (*e.g., LSASS Memory Dumping, Kerberoasting*).
9. **Discovery**: Exploring the victim environment (*e.g., Network Service Discovery, Account Discovery*).
10. **Lateral Movement**: Moving through the network to access high-value targets (*e.g., Pass the Hash, SSH Hijacking*).
11. **Collection**: Gathering target data of interest (*e.g., Screen Capture, Clipboard Data*).
12. **Command and Control**: Communicating with controlled systems (*e.g., Application Layer Protocol, Ingress Tool Transfer*).
13. **Exfiltration**: Stealing data out of the target environment (*e.g., Exfiltration Over C2 Channel, Cloud Storage*).
14. **Impact**: Disrupting, corrupting, or destroying systems and data (*e.g., Data Encrypted for Impact, Wiper Malware*).

## Deep Dive: MITRE D3FEND & MITRE ATLAS

### MITRE D3FEND Countermeasure Mapping
While ATT&CK maps offensive adversary techniques, **MITRE D3FEND** is a defensive countermeasure knowledge graph. D3FEND organizes defensive capabilities into 7 core functions:

- **Model**: System mapping &amp; inventory (*e.g., Network Mapping, Asset Inventory*).
- **Harden**: Reducing attack surface (*e.g., Application Isolation, Memory Encryption*).
- **Detect**: Identifying active attacks (*e.g., Process Lineage Analysis, File Integrity Monitoring*).
- **Isolate**: Containing malicious activity (*e.g., Executable Sandboxing, Network Microsegmentation*).
- **Deceive**: Deploying traps (*e.g., Honeytokens, Decoy Accounts*).
- **Evict**: Removing adversary access (*e.g., Process Termination, Credential Revocation*).
- **Restore**: Recovering system state (*e.g., Backup Restoration, System Re-imaging*).

D3FEND links directly to ATT&CK techniques, allowing security engineers to select countermeasures designed to disrupt specific TTPs.

### MITRE ATLAS AI/ML Threat Matrix
**MITRE ATLAS** (Adversarial Threat Landscape for Artificial-Intelligence Systems) is a standalone matrix specifically modeling adversary TTPs targeting AI and Machine Learning systems:
- **Data Poisoning**: Manipulating training datasets to introduce backdoor triggers or degrade model accuracy.
- **Model Inversion & Exfiltration**: Extracting proprietary model weights or training data through inference queries.
- **Prompt Injection**: Overriding LLM system prompts to bypass safety guardrails or execute unauthorized function calls.
- **Evasion Attacks**: Modifying adversarial inputs (*e.g., perturbed images or malware binaries*) to bypass ML classifiers.

## Design-Time Threat Modeling vs. Operational Intrusion Analysis

| Operational Dimension | Design-Time Threat Modeling (STRIDE / PASTA) | Operational Intrusion Intelligence (ATT&amp;CK / Kill Chain) | Key Engineering Distinction |
|---|---|---|---|
| **Primary Emphasis** | Architecture and system design-time analysis. | Live SOC operations, incident response, and threat hunting. | Design-oriented vs. detection/response-oriented emphasis. |
| **Primary Input** | Data Flow Diagrams (DFDs), API specs, software blueprints. | EDR telemetry, SIEM logs, packet captures, threat intel feeds. | Structural architecture vs. behavioral telemetry. |
| **Primary Output** | Security control requirements, architectural refactoring. | Detection rules, investigation pivots, emulation plans. | Design decisions vs. operational detection &amp; response. |
| **Insider Threat Scope** | Native capability to model insider privilege escalation. | Kill Chain is poor for insiders; ATT&amp;CK covers insider TTPs directly. | STRIDE/ATT&amp;CK model insiders better than linear Kill Chain. |

## Essential Operational Intrusion Diagnostic Checklist

When evaluating an operational threat intelligence pipeline or SOC incident analysis capability, audit these 6 diagnostic criteria:

| Diagnostic Focus Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Non-Linear Analysis** | Does incident response leverage ATT&CK matrices rather than relying strictly on linear Kill Chain models? | IR playbooks, threat hunting queries, &amp; incident timelines. |
| **Pivoting Capabilities** | Do threat intelligence analysts use Diamond Model pivoting across Infrastructure, Capability, and Victim vertices? | Threat intelligence reports &amp; OpenCTI/MISP event graphs. |
| **Countermeasure Validation** | Are ATT&CK techniques mapped to candidate D3FEND measures, then validated empirically through testing? | Tested SIEM/EDR detections &amp; adversary emulation results. |
| **Tactics vs Procedures** | Are SOC alerts categorized by ATT&CK Tactics/Techniques while procedures capture specific execution payloads? | SIEM alert rule metadata &amp; EDR detection tagging. |
| **AI/ML Security Coverage** | Are AI/ML systems evaluated against MITRE ATLAS for prompt injection, data poisoning, and model inversion threats? | AI red-team reports &amp; LLM guardrail validation test logs. |
| **Empirical Coverage Heatmap** | Is ATT&CK coverage reported based on verified detection tests rather than theoretical mapping alone? | Automated BAS test results &amp; EDR coverage scoring reports. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Operational intrusion frameworks analyze live attack telemetry. The Cyber Kill Chain models 7 linear external stages, the Diamond Model maps 4 vertices (Adversary, Capability, Infrastructure, Victim) for campaign pivoting, ATT&CK details 14 adversary tactics, D3FEND maps defensive countermeasures, and ATLAS addresses AI/ML system threats.</p>
</div>

## Primary references

- **MITRE ATT&amp;CK**: *Adversary Tactics, Techniques, and Knowledge Base* — [MITRE ATT&amp;CK Official](https://attack.mitre.org/)
- **MITRE D3FEND**: *A Knowledge Graph of Cybersecurity Countermeasures* — [MITRE D3FEND Official](https://d3fend.mitre.org/)
- **MITRE ATLAS**: *Adversarial Threat Landscape for Artificial-Intelligence Systems* — [MITRE ATLAS Official](https://atlas.mitre.org/)
- **Lockheed Martin Cyber Kill Chain**: *Seven Steps of Cyber Kill Chain* — [Lockheed Martin](https://www.lockheedmartin.com/en-us/capabilities/cyber/cyber-kill-chain.html)
- **Diamond Model of Intrusion Analysis**: *Caltagirone, S., Pendergast, A., &amp; Betz, C. (2013)* — [Center for Cyber Intelligence Analysis and Research](https://www.threatintel.academy/diamond-model/)
