---
title: Cyber Threat Intelligence & Threat Actor Profiling
description: Technical reference for Cyber Threat Intelligence (CTI) operations, the 6-stage intelligence lifecycle, David Bianco's Pyramid of Pain, STIX 2.1 / TAXII 2.1 data standards, TLP handling markings, Threat Intelligence Platforms (OpenCTI / MISP), and threat actor campaign profiling.
permalink: /topics/cyber-threat-intelligence/
last_verified: 2026-08-14
---

<span class="eyebrow">Threat Intelligence & Detection / Decision Guide</span>

# Cyber Threat Intelligence & Threat Actor Profiling

<p class="lede">Cyber Threat Intelligence (CTI) collects, processes, analyzes, and disseminates actionable information regarding threat actors, adversary capabilities, infrastructure, and malicious intent. Rather than consuming raw indicator feeds passively, mature CTI operations apply a structured intelligence lifecycle—leveraging STIX 2.1 graph standards and TAXII 2.1 transport—to elevate enterprise defense from reactive IOC blocking to proactive TTP disruption along David Bianco's Pyramid of Pain.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/cyber-threat-intelligence-lifecycle.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the cyber threat intelligence operations architecture diagram at full size">
    <img src="{{ '/assets/img/cyber-threat-intelligence-lifecycle.svg' | relative_url }}" alt="Cyber Threat Intelligence Operations & Data Pipeline Architecture diagram showing the 6-stage CTI lifecycle, Pyramid of Pain, STIX 2.1 JSON data model, TLP handling markings, and TAXII 2.1 dissemination.">
  </a>
  <p class="diagram-caption">Cyber Threat Intelligence Operations: 6-Stage CTI Lifecycle &leftrightarrow; Pyramid of Pain Elevation &leftrightarrow; STIX 2.1 / TAXII 2.1 Data Pipeline &leftrightarrow; TIP Graph Correlation</p>
</div>

## The 6-Stage CTI Operational Lifecycle

Published intelligence cycles vary between five and six stages depending on whether planning and direction are treated as one step or two. This journal uses the six-stage formulation below, driven by explicit organizational requirements:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/cyber-threat-intelligence.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the six-stage CTI lifecycle diagram at full size">
    <img src="{{ '/assets/img/cyber-threat-intelligence.svg' | relative_url }}" alt="Cyber Threat Intelligence six-stage lifecycle: planning and direction driven by priority intelligence requirements, collection, processing and parsing, analysis and production, dissemination, and feedback and evaluation.">
  </a>
  <p class="diagram-caption">CTI Lifecycle: Planning &amp; Direction &rarr; Collection &rarr; Processing &rarr; Analysis &rarr; Dissemination &rarr; Feedback</p>
</div>

1. **Planning & Direction (Priority Intelligence Requirements - PIRs)**: Define explicit intelligence questions based on business risk, critical assets, geographic footprint, and threat landscape (*e.g., "Which ransomware groups are targeting financial services in Q3?"*).
2. **Collection**: Ingestion of raw threat data from diverse internal and external sources (OSINT repositories, commercial feeds, darkweb forums, telemetry logs, honeytokens, and malware sandbox outputs).
3. **Processing & Parsing**: Normalizing raw data into structured formats, deduplicating IOCs, parsing log headers, and extracting technical indicators.
4. **Analysis & Production**: Converting processed data into structured intelligence by correlating indicators against threat actor profiles, grading confidence, and analyzing campaign intent.
5. **Dissemination**: Delivering tailored intelligence to target audiences (automated TAXII feeds to SIEM/EDR, tactical alerts to SOC analysts, strategic briefs to C-suite leadership), with handling markings attached.
6. **Feedback & Evaluation**: Assessing intelligence utility against initial PIRs, refining collection sources, and tuning threat scoring.

## The Four Intelligence Tiers

Intelligence is commonly tiered by consumer audience, update cadence, and strategic depth. Some published models use three tiers and fold *technical* into *tactical*; this journal separates them because the two have different consumers and very different lifespans:

| Intelligence Tier | Consumer Audience | Focus &amp; Scope | Primary Content / Artifacts | Lifespan &amp; Cadence |
|---|---|---|---|---|
| **Strategic** | Board of Directors, CISO, Executive Leadership | High-level risk trends, geopolitical threats, adversary motivations, and business impact. | Executive briefings, industry threat assessments, geopolitical risk reports. | Months to Years (Strategic planning) |
| **Operational** | Incident Response Leads, SOC Managers, Threat Hunters | Threat actor groups, active campaigns, adversary capabilities, and targeted industries. | Threat actor profiles, campaign tracking graphs, TTP playbooks. | Weeks to Months (Campaign tracking) |
| **Tactical** | SOC Analysts, Detection Engineers, System Admins | Specific adversary TTPs, attack vectors, and execution procedures. | ATT&CK technique mappings, Sigma rules, YARA signatures. | Days to Weeks (Detection tuning) |
| **Technical** | SIEM Ingestion Pipelines, Firewalls, EDR/XDR | Immediate, short-lived indicators of compromise (IOCs). | IP addresses, domain names, file hashes (SHA-256), URL endpoints. | Hours to Days (Automated blocking) |

## The Pyramid of Pain (David Bianco)

David Bianco's **Pyramid of Pain** illustrates the relative difficulty and operational disruption inflicted on an adversary when defensive security controls successfully detect and block indicators at each layer:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/pyramid-of-pain.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the Pyramid of Pain diagram at full size">
    <img src="{{ '/assets/img/pyramid-of-pain.svg' | relative_url }}" alt="Pyramid of Pain: hash values (trivial) at the base, then IP addresses (easy), domain names (simple), host and network artifacts (annoying), tools (challenging), and TTPs (tough) at the apex. Each level names the work a defender forces on the adversary by detecting there.">
  </a>
  <p class="diagram-caption">David Bianco's Pyramid of Pain: Hash Values (Trivial) to TTPs (Tough)</p>
</div>

- **Hash Values (Trivial)**: MD5/SHA-256 file hashes. Trivial for attackers to bypass by mutating single bytes or recompiling binaries.
- **IP Addresses (Easy)**: C2 server IP addresses. Simple for adversaries to rotate using cloud proxies or fast-flux infrastructure.
- **Domain Names (Simple)**: Malicious domain names. Disrupted by sinkholing DNS or blocklists, though adversaries automate registration via DGAs (Domain Generation Algorithms).
- **Host & Network Artifacts (Annoying)**: Registry keys, user-agent strings, HTTP URI patterns, or file paths. Disrupting artifacts forces attackers to modify weaponization scripts.
- **Tools (Challenging)**: Adversary software, Cobalt Strike profiles, or custom malware frameworks. Blocking tools forces attackers to invest heavy resources in developing new exploit kits.
- **TTPs (Tough)**: Core adversary tactics, techniques, and procedures (*e.g., Spearphishing Attachment, LSASS Credential Dumping*). Disrupting TTPs forces the adversary to learn new attack methodologies.

### Indicator Decay & False Positive Management
The operational value of an Indicator of Compromise (IOC) degrades over time. **Indicator Decay** models the rate at which intelligence loses its reliability as adversaries rotate infrastructure, recompile malware, and acquire new domains.
- **High-Decay IOCs (IPs, Hashes)**: Must be aggressively aged out (an illustrative working window is 7–14 days) to prevent widespread false positives (Alert Fatigue) on reallocated IP space or accidental benign matches.
- **Low-Decay Artifacts (TTPs, Custom Tools)**: Can persist in detection logic for years, as the adversary cost of re-engineering them remains high.

Effective CTI programs utilize Threat Intelligence Platforms (TIPs) with automated feed decay configurations to gracefully expire stale IOCs and manage the false-positive lifecycle dynamically.

### Grading Confidence

"High confidence" is not a measurement unless the scale is stated. The Admiralty (NATO) system remains the most widely reused grading scheme in CTI because it separates two independent judgements that analysts routinely conflate:

- **Source reliability, A–F**: A = completely reliable, through E = unreliable, F = reliability cannot be judged. This grades the *provider* — its track record, collection method, and access.
- **Information credibility, 1–6**: 1 = confirmed by other sources, through 5 = improbable, 6 = truth cannot be judged. This grades the *claim* — corroboration and internal consistency.

A rating is written as a pair, so `B2` means a usually reliable source reporting probably true information. A feed can be highly reliable while carrying a low-credibility item, and a first-time source can report something already corroborated elsewhere; collapsing both axes into one "confidence: high" field destroys that distinction and makes downstream scoring unreproducible.

## Data Standards: STIX 2.1 & TAXII 2.1

To automate threat intelligence sharing across enterprise security tools, OASIS publishes **STIX 2.1** (data representation standard) and **TAXII 2.1** (transport protocol). Both originated at MITRE under US DHS funding and transitioned to the OASIS CTI Technical Committee, which now maintains them.

### STIX 2.1 Core Object Types
STIX 2.1 models threat intelligence as a graph consisting of three primary object classes:
- **STIX Domain Objects (SDOs)**: Conceptual intelligence entities (`Threat-Actor`, `Campaign`, `Indicator`, `Malware`, `Attack-Pattern`, `Vulnerability`, `Identity`).
- **STIX Relationship Objects (SROs)**: Graph edges connecting SDOs (`relationship` objects specifying *indicates*, *uses*, *targets*, or *attributed-to*).
- **STIX Cyber-observable Objects (SCOs)**: Ground-truth technical artifacts (`ipv4-addr`, `domain-name`, `file`, `process`, `user-account`).

### STIX 2.1 JSON Bundle Example

The bundle below links an `Indicator` (file hash) to an `Attack-Pattern` (ATT&CK T1003.001, LSASS Memory) and to the `Threat-Actor` the activity is attributed to. **All identifiers, timestamps, and the hash value are illustrative placeholders, not observed indicators** — do not load them into a TIP.

```json
{
  "type": "bundle",
  "id": "bundle--3d00062c-0e78-43d9-952a-9e6659c25381",
  "objects": [
    {
      "type": "threat-actor",
      "spec_version": "2.1",
      "id": "threat-actor--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f",
      "created": "2026-08-14T02:00:00.000Z",
      "modified": "2026-08-14T02:00:00.000Z",
      "name": "APT29 (Cozy Bear)",
      "threat_actor_types": ["nation-state"],
      "sophistication": "advanced"
    },
    {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--0f20e3cb-245b-4a61-8a91-2d93f7021b73",
      "created": "2026-08-14T02:00:00.000Z",
      "modified": "2026-08-14T02:00:00.000Z",
      "name": "OS Credential Dumping: LSASS Memory",
      "external_references": [
        {
          "source_name": "mitre-attack",
          "external_id": "T1003.001",
          "url": "https://attack.mitre.org/techniques/T1003/001/"
        }
      ]
    },
    {
      "type": "indicator",
      "spec_version": "2.1",
      "id": "indicator--d81f86b9-975b-4c0b-bb81-30d069ad7f5e",
      "created": "2026-08-14T02:00:00.000Z",
      "modified": "2026-08-14T02:00:00.000Z",
      "name": "Illustrative placeholder hash (not a real IOC)",
      "pattern": "[file:hashes.'SHA-256' = '0000000000000000000000000000000000000000000000000000000000000001']",
      "pattern_type": "stix",
      "valid_from": "2026-08-14T02:00:00.000Z"
    },
    {
      "type": "relationship",
      "spec_version": "2.1",
      "id": "relationship--7a18b1c4-118e-4a6c-8e42-7a71676d758f",
      "created": "2026-08-14T02:00:00.000Z",
      "modified": "2026-08-14T02:00:00.000Z",
      "relationship_type": "indicates",
      "source_ref": "indicator--d81f86b9-975b-4c0b-bb81-30d069ad7f5e",
      "target_ref": "attack-pattern--0f20e3cb-245b-4a61-8a91-2d93f7021b73"
    },
    {
      "type": "relationship",
      "spec_version": "2.1",
      "id": "relationship--c5f0a1d2-3b6e-4f19-9c47-2ad6b5e70c88",
      "created": "2026-08-14T02:00:00.000Z",
      "modified": "2026-08-14T02:00:00.000Z",
      "relationship_type": "indicates",
      "source_ref": "indicator--d81f86b9-975b-4c0b-bb81-30d069ad7f5e",
      "target_ref": "threat-actor--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f"
    }
  ]
}
```

### TAXII 2.1 Transport Protocol
**TAXII 2.1** (Trusted Automated eXchange of Intelligence Information) is an application-layer protocol operating over HTTPS REST APIs:

- **TAXII Collections**: Repositories of STIX 2.1 bundles served via REST endpoints (`/{api-root}/collections/{id}/objects/`), enabling SIEMs and EDRs to poll threat intelligence automatically. Collections are the only data-exchange mechanism actually defined in TAXII 2.1.
- **Channels (reserved, not specified)**: TAXII's long-term design includes a publish/subscribe channel model, but version 2.1 reserves the keywords without specifying Channel services; they are deferred to a future version of the specification. Near-real-time delivery in a TAXII 2.1 deployment is therefore built on frequent Collection polling, not on a push channel — a distinction worth confirming before designing an integration around streaming.

### Handling Markings: TLP

Every disseminated product carries a handling marking, and dissemination without one is the most common CTI governance failure. [FIRST TLP 2.0](https://www.first.org/tlp/) defines five markings:

| Marking | Permitted redistribution |
|---|---|
| **TLP:CLEAR** | Unlimited; public disclosure permitted. |
| **TLP:GREEN** | Community-wide, but not via publicly accessible channels. |
| **TLP:AMBER** | The recipient's organization and its clients, on a need-to-know basis. |
| **TLP:AMBER+STRICT** | The recipient's organization only. |
| **TLP:RED** | Named individual recipients only; no onward sharing. |

STIX carries these as `marking-definition` objects referenced from each object's `object_marking_refs`, and TIPs enforce them on export. Two rules matter operationally: a marking travels with the object, so re-sharing an enriched indicator inherits the strictest marking in its lineage; and victim-identifying context (hostnames, user accounts, internal IP ranges) is frequently subject to privacy obligations independent of TLP, so it should be stripped or generalized before an indicator leaves the organization.

## Threat Intelligence Platforms (TIPs): OpenCTI vs. MISP

Enterprise CTI operations utilize Threat Intelligence Platforms (TIPs) to aggregate, correlate, and disseminate intelligence:

| Dimension | OpenCTI (Open Cyber Threat Intelligence) | MISP (Malware Information Sharing Platform) |
|---|---|---|
| **Data Architecture** | Native **GraphQL &amp; STIX 2.1 Graph Database** architecture natively representing entities and relationships. | Attribute- and event-centric relational database format utilizing MISP Taxonomies and Galaxy clusters. |
| **Primary Strength** | Deep analytical graph visualization, complex threat actor relationship tracking, and ATT&CK mapping. | Rapid community IOC sharing, automated threat feed ingestion, and malware attribute exchange. |
| **Integration Model** | Connectors for SIEM, EDR, TAXII 2.1, Python SDK, and automated enrichment engines. | RESTful API, PyMISP integration, and native TAXII export modules. |
| **Best Suited For** | Strategic &amp; Operational threat intelligence teams building complex campaign attribution graphs. | Tactical &amp; Technical SOC teams sharing high-volume IOC feeds across ISACs and CERTs. |

## Essential CTI Diagnostic Checklist

The checklist below is a journal working model, not a published audit standard. It converts the lifecycle and standards above into a repeatable review of a CTI program.

| Diagnostic Focus Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **PIR Alignment** | Is intelligence collection driven by documented Priority Intelligence Requirements (PIRs) linked to business risk? | Formal CTI PIR charter &amp; executive intelligence request logs. |
| **Pyramid of Pain Elevation** | Does the CTI program produce TTP- and tool-level intelligence rather than relying strictly on IP/hash blocklists? | Sigma/YARA rule repository &amp; ATT&CK technique detection maps. |
| **STIX/TAXII Standards** | Are threat intelligence feeds ingested and exported using STIX 2.1 JSON and TAXII 2.1 Collection endpoints? | TAXII server configuration logs &amp; STIX bundle validation tests. |
| **Handling Markings** | Does every product carry a TLP marking, and does the TIP enforce it on export and re-share? | TLP marking coverage report &amp; blocked-export audit logs. |
| **Confidence Grading** | Are source reliability and information credibility graded separately on a stated scale rather than a single "confidence" field? | Admiralty-graded reports &amp; TIP scoring rule configuration. |
| **Automated SIEM Ingestion** | Are validated indicators automatically pushed to SIEM/EDR detection engines within minutes of production? | Automated TAXII-to-SIEM pipeline logs &amp; ingestion metrics. |
| **Feedback Loop Integration** | Does the SOC provide structured feedback on CTI alerts to refine confidence scores and retire stale IOCs? | Incident response feedback tickets &amp; IOC expiration logs. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Cyber Threat Intelligence operates across a 6-stage lifecycle. Effective CTI elevates defense along David Bianco's Pyramid of Pain from trivial hash blocking to resilient TTP disruption, using STIX 2.1 graph data models and TAXII 2.1 Collection polling — Channels are reserved but unspecified in 2.1. Every disseminated product carries a TLP marking, and source reliability is graded separately from information credibility.</p>
</div>

## Primary references

- **NIST SP 800-150**: *Guide to Cyber Threat Information Sharing* — [NIST CSRC](https://csrc.nist.gov/pubs/sp/800/150/final)
- **OASIS STIX 2.1 Standard**: *Structured Threat Information Expression Version 2.1* — [OASIS Open](https://docs.oasis-open.org/cti/stix/v2.1/os/stix-v2.1-os.html)
- **OASIS TAXII 2.1 Standard**: *Trusted Automated eXchange of Intelligence Information Version 2.1* — [OASIS Open](https://docs.oasis-open.org/cti/taxii/v2.1/os/taxii-v2.1-os.html) — source for the statement that TAXII 2.1 reserves but does not specify Channel services.
- **FIRST Traffic Light Protocol 2.0**: *TLP Standard Definitions and Usage Guidance* — [FIRST](https://www.first.org/tlp/)
- **David Bianco's Pyramid of Pain**: *The Pyramid of Pain Concept* — [Enterprise Detection &amp; Response](https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html)
- **OpenCTI Documentation**: *Open Cyber Threat Intelligence Platform* — [OpenCTI Official](https://docs.opencti.io/)
- **MISP Project**: *Threat Intelligence Sharing Platform documentation* — [MISP Project](https://www.misp-project.org/documentation/)
