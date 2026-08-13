---
title: Cyber Threat Intelligence & Threat Actor Profiling
description: Comprehensive technical guide to Cyber Threat Intelligence (CTI) operations, the 6-stage intelligence lifecycle, David Bianco's Pyramid of Pain, STIX 2.1 / TAXII 2.1 data standards, Threat Intelligence Platforms (OpenCTI / MISP), and threat actor campaign profiling.
permalink: /topics/cyber-threat-intelligence/
last_verified: 2026-08-13
---

<span class="eyebrow">Threat Intelligence & Detection / Decision Guide</span>

# Cyber Threat Intelligence & Threat Actor Profiling

<p class="lede">Cyber Threat Intelligence (CTI) collects, processes, analyzes, and disseminates actionable information regarding threat actors, adversary capabilities, infrastructure, and malicious intent. Rather than consuming raw indicator feeds passively, mature CTI operations apply a structured 6-stage intelligence lifecycle—leveraging STIX 2.1 graph standards and TAXII 2.1 transport—to elevate enterprise defense from reactive IOC blocking to proactive TTP disruption along David Bianco's Pyramid of Pain.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/cyber-threat-intelligence-lifecycle.svg' | relative_url }}" alt="Cyber Threat Intelligence Operations & Data Pipeline Architecture diagram showing CTI 6-stage lifecycle, Pyramid of Pain, STIX 2.1 JSON data model, and TAXII 2.1 dissemination.">
  <p class="diagram-caption">Cyber Threat Intelligence Operations: 6-Stage CTI Lifecycle &leftrightarrow; Pyramid of Pain Elevation &leftrightarrow; STIX 2.1 / TAXII 2.1 Data Pipeline &leftrightarrow; TIP Graph Correlation</p>
</div>

## The 6-Stage CTI Operational Lifecycle

Mature threat intelligence operations follow a continuous 6-stage intelligence lifecycle driven by explicit organizational requirements:

<div class="diagram-frame">
  <img src="{{ '/assets/img/cyber-threat-intelligence.svg' | relative_url }}" alt="Cyber Threat Intelligence 6-stage lifecycle diagram.">
  <p class="diagram-caption">CTI Lifecycle: Requirements &leftrightarrow; Collection &leftrightarrow; Processing &leftrightarrow; Analysis &leftrightarrow; Dissemination &leftrightarrow; Feedback</p>
</div>

1. **Planning & Direction (Priority Intelligence Requirements - PIRs)**: Define explicit intelligence questions based on business risk, critical assets, geographic footprint, and threat landscape (*e.g., "Which ransomware groups are targeting financial services in Q3?"*).
2. **Collection**: Ingestion of raw threat data from diverse internal and external sources (OSINT repositories, commercial feeds, darkweb forums, telemetry logs, honeytokens, and malware sandbox outputs).
3. **Processing & Parsing**: Normalizing raw data into structured formats, deduplicating IOCs, parsing log headers, and extracting technical indicators.
4. **Analysis & Production**: Converting processed data into structured intelligence by correlating indicators against threat actor profiles, verifying confidence scores, and analyzing campaign intent.
5. **Dissemination**: Delivering tailored intelligence to target audiences (automated TAXII feeds to SIEM/EDR, tactical alerts to SOC analysts, strategic briefs to C-suite leadership).
6. **Feedback & Evaluation**: Assessing intelligence utility against initial PIRs, refining collection sources, and tuning threat scoring algorithms.

## The Four Intelligence Tiers

Intelligence is categorized into 4 operational tiers based on consumer audience, update cadence, and strategic depth:

| Intelligence Tier | Consumer Audience | Focus &amp; Scope | Primary Content / Artifacts | Lifespan &amp; Cadence |
|---|---|---|---|---|
| **Strategic** | Board of Directors, CISO, Executive Leadership | High-level risk trends, geopolitical threats, adversary motivations, and business impact. | Executive briefings, industry threat assessments, geopolitical risk reports. | Months to Years (Strategic planning) |
| **Operational** | Incident Response Leads, SOC Managers, Threat Hunters | Threat actor groups, active campaigns, adversary capabilities, and targeted industries. | Threat actor profiles, campaign tracking graphs, TTP playbooks. | Weeks to Months (Campaign tracking) |
| **Tactical** | SOC Analysts, Detection Engineers, System Admins | Specific adversary TTPs, attack vectors, and execution procedures. | ATT&CK technique mappings, Sigma rules, YARA signatures. | Days to Weeks (Detection tuning) |
| **Technical** | SIEM Ingestion Pipelines, Firewalls, EDR/XDR | Immediate, short-lived indicators of compromise (IOCs). | IP addresses, domain names, file hashes (SHA-256), URL endpoints. | Hours to Days (Automated blocking) |

## The Pyramid of Pain (David Bianco)

David Bianco's **Pyramid of Pain** illustrates the relative difficulty and operational disruption inflicted on an adversary when defensive security controls successfully detect and block indicators at each layer:

<div class="diagram-frame">
  <img src="{{ '/assets/img/pyramid-of-pain.svg' | relative_url }}" alt="Pyramid of Pain diagram.">
  <p class="diagram-caption">David Bianco's Pyramid of Pain: Hash Values to TTPs</p>
</div>

- **Hash Values (Trivial)**: MD5/SHA-256 file hashes. Trivial for attackers to bypass by mutating single bytes or recompiling binaries.
- **IP Addresses (Easy)**: C2 server IP addresses. Simple for adversaries to rotate using cloud proxies or fast-flux infrastructure.
- **Domain Names (Simple)**: Malicious domain names. Disrupted by sinkholing DNS or blocklists, though adversaries automate registration via DGAs (Domain Generation Algorithms).
- **Host & Network Artifacts (Annoying)**: Registry keys, user-agent strings, HTTP URI patterns, or file paths. Disrupting artifacts forces attackers to modify weaponization scripts.
- **Tools (Challenging)**: Adversary software, Cobalt Strike profiles, or custom malware frameworks. Blocking tools forces attackers to invest heavy resources in developing new exploit kits.
- **TTPs (Toughest)**: Core adversary tactics, techniques, and procedures (*e.g., Spearphishing Attachment, LSASS Credential Dumping*). Disrupting TTPs forces the adversary to completely learn new attack methodologies.

### Indicator Decay & False Positive Management
The operational value of an Indicator of Compromise (IOC) degrades over time. **Indicator Decay** models the rate at which intelligence loses its reliability as adversaries rotate infrastructure, recompile malware, and acquire new domains.
- **High-Decay IOCs (IPs, Hashes)**: Must be aggressively aged out (e.g., 7-14 days) to prevent widespread false positives (Alert Fatigue) on reallocated IP space or accidental benign matches.
- **Low-Decay Artifacts (TTPs, Custom Tools)**: Can persist in detection logic for years, as the adversary cost of re-engineering them remains high.
Effective CTI programs utilize Threat Intelligence Platforms (TIPs) with automated feed decay configurations to gracefully expire stale IOCs and manage the false-positive lifecycle dynamically.

## Data Standards: STIX 2.1 & TAXII 2.1

To automate threat intelligence sharing across enterprise security tools, OASIS developed **STIX 2.1** (data representation standard) and **TAXII 2.1** (transport protocol).

### STIX 2.1 Core Object Types
STIX 2.1 models threat intelligence as a graph consisting of three primary object classes:
- **STIX Domain Objects (SDOs)**: Conceptual intelligence entities (`Threat-Actor`, `Campaign`, `Indicator`, `Malware`, `Attack-Pattern`, `Vulnerability`, `Identity`).
- **STIX Relationship Objects (SROs)**: Graph edges connecting SDOs (`relationship` objects specifying *indicates*, *uses*, *targets*, or *attributed-to*).
- **STIX Cyber-observable Objects (SCOs)**: Ground-truth technical artifacts (`ipv4-addr`, `domain-name`, `file`, `process`, `user-account`).

### Valid STIX 2.1 JSON Schema Example

The following STIX 2.1 JSON bundle demonstrates linking an `Indicator` (file hash) to an `Attack-Pattern` (ATT&CK LSASS Dumping) and attributing it to a `Threat-Actor`:

```json
{
  "type": "bundle",
  "id": "bundle--3d00062c-0e78-43d9-952a-9e6659c25381",
  "objects": [
    {
      "type": "threat-actor",
      "spec_version": "2.1",
      "id": "threat-actor--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f",
      "created": "2026-08-13T20:00:00.000Z",
      "modified": "2026-08-13T20:00:00.000Z",
      "name": "APT29 (Cozy Bear)",
      "threat_actor_types": ["nation-state"],
      "sophistication": "advanced"
    },
    {
      "type": "indicator",
      "spec_version": "2.1",
      "id": "indicator--d81f86b9-975b-4c0b-bb81-30d069ad7f5e",
      "created": "2026-08-13T20:00:00.000Z",
      "modified": "2026-08-13T20:00:00.000Z",
      "name": "LSASS Memory Dump Binary Hash",
      "pattern": "[file:hashes.'SHA-256' = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855']",
      "pattern_type": "stix",
      "valid_from": "2026-08-13T20:00:00.000Z"
    },
    {
      "type": "relationship",
      "spec_version": "2.1",
      "id": "relationship--7a18b1c4-118e-4a6c-8e42-7a71676d758f",
      "created": "2026-08-13T20:00:00.000Z",
      "modified": "2026-08-13T20:00:00.000Z",
      "relationship_type": "indicates",
      "source_ref": "indicator--d81f86b9-975b-4c0b-bb81-30d069ad7f5e",
      "target_ref": "threat-actor--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f"
    }
  ]
}
```

### TAXII 2.1 Transport Protocol
**TAXII 2.1** (Trusted Automated eXchange of Intelligence Information) is an application-layer protocol operating over HTTPS REST APIs:
- **TAXII Channels**: Publish/subscribe messaging channels for real-time threat alert streaming.
- **TAXII Collections**: Repositories of STIX 2.1 bundles served via REST endpoints (`/collections/{id}/objects/`) enabling SIEMs and EDRs to pull threat intelligence automatically.

## Threat Intelligence Platforms (TIPs): OpenCTI vs. MISP

Enterprise CTI operations utilize Threat Intelligence Platforms (TIPs) to aggregate, correlate, and disseminate intelligence:

| Dimension | OpenCTI (Open Cyber Threat Intelligence) | MISP (Malware Information Sharing Platform) |
|---|---|---|
| **Data Architecture** | Native **GraphQL &amp; STIX 2.1 Graph Database** architecture natively representing entities and relationships. | Attribute- and event-centric relational database format utilizing MISP Taxonomies and Galaxy clusters. |
| **Primary Strength** | Deep analytical graph visualization, complex threat actor relationship tracking, and ATT&CK mapping. | Rapid community IOC sharing, automated threat feed ingestion, and malware attribute exchange. |
| **Integration Model** | Connectors for SIEM, EDR, TAXII 2.1, Python SDK, and automated enrichment engines. | RESTful API, PyMISP integration, and native TAXII export modules. |
| **Best Suited For** | Strategic &amp; Operational threat intelligence teams building complex campaign attribution graphs. | Tactical &amp; Technical SOC teams sharing high-volume IOC feeds across ISACs and CERTs. |

## Essential CTI Diagnostic Checklist

When evaluating an enterprise CTI program, audit these 6 operational criteria:

| Diagnostic Focus Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **PIR Alignment** | Is intelligence collection driven by documented Priority Intelligence Requirements (PIRs) linked to business risk? | Formal CTI PIR charter &amp; executive intelligence request logs. |
| **Pyramid of Pain Elevation** | Does the CTI program produce TTP- and tool-level intelligence rather than relying strictly on IP/hash blocklists? | Sigma/YARA rule repository &amp; ATT&CK technique detection maps. |
| **STIX/TAXII Standards** | Are threat intelligence feeds ingested and exported using STIX 2.1 JSON and TAXII 2.1 REST endpoints? | TAXII server configuration logs &amp; STIX bundle validation tests. |
| **Feed Confidence Scoring** | Are external threat feeds dynamically scored based on source reliability, age, and false-positive rates? | TIP confidence scoring rules &amp; feed decay configuration files. |
| **Automated SIEM Ingestion** | Are validated indicators automatically pushed to SIEM/EDR detection engines within minutes of production? | Automated TAXII-to-SIEM pipeline logs &amp; ingestion metrics. |
| **Feedback Loop Integration** | Does the SOC provide structured feedback on CTI alerts to refine confidence scores and retire stale IOCs? | Incident response feedback tickets &amp; IOC expiration logs. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Cyber Threat Intelligence operates across a 6-stage lifecycle. Effective CTI elevates defense along David Bianco's Pyramid of Pain from trivial hash blocking to resilient TTP disruption, using STIX 2.1 graph data models and TAXII 2.1 REST transport APIs.</p>
</div>

## Primary references

- **NIST SP 800-150**: *Guide to Cyber Threat Information Sharing* — [NIST CSRC](https://csrc.nist.gov/publications/detail/sp/800-150/final)
- **OASIS STIX 2.1 Standard**: *Structured Threat Information Expression Version 2.1* — [OASIS Open](https://docs.oasis-open.org/cti/stix/v2.1/stix-v2.1.html)
- **OASIS TAXII 2.1 Standard**: *Trusted Automated eXchange of Intelligence Information Version 2.1* — [OASIS Open](https://docs.oasis-open.org/cti/taxii/v2.1/taxii-v2.1.html)
- **David Bianco's Pyramid of Pain**: *The Pyramid of Pain Concept* — [Enterprise Detection &amp; Response](https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html)
- **OpenCTI Documentation**: *Open Cyber Threat Intelligence Platform* — [OpenCTI Official](https://docs.opencti.io/)
