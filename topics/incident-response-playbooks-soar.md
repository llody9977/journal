---
title: "Incident Response Playbooks & SOAR"
description: Technical reference for incident response playbooks under NIST SP 800-61 Rev. 3 and the CSF 2.0 Functions, SOAR orchestration and its approval boundary, and the ordering constraints in a ransomware containment sequence.
permalink: /topics/incident-response-playbooks-soar/
last_verified: 2026-08-14
---

<span class="eyebrow">Digital Forensics & IR / Response Engineering</span>

# Incident Response Playbooks & SOAR

<p class="lede">Containment speed decides how much of an incident becomes a breach, and the operations that contain — isolating a host, revoking an identity, blocking a destination — are all API calls that a human typically executes through a ticket queue. Orchestration removes the queue, not the decision, which is why a playbook is mostly a statement of what may run unattended and what must wait for a person. The ordering inside a playbook matters as much as its speed: several containment steps destroy evidence or capability that a later step needed.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/incident-response-playbooks-soar.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the incident response and SOAR architecture diagram at full size">
    <img src="{{ '/assets/img/incident-response-playbooks-soar.svg' | relative_url }}" alt="Incident Response architecture diagram showing the response lifecycle, SOAR automation connecting EDR, identity, and network tooling, and ransomware containment playbooks.">
  </a>
  <p class="diagram-caption">Incident Response Architecture: response lifecycle &leftrightarrow; SOAR automated containment &amp; ransomware playbooks</p>
</div>

## The current lifecycle structure: SP 800-61 Rev. 3

**NIST withdrew SP 800-61 Rev. 2** (2012), whose four-phase model — Preparation, Detection & Analysis, Containment/Eradication/Recovery, Post-Incident Activity — is still the vocabulary most teams speak. It published **[SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)** in April 2025, *Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile*, which maps incident response activity onto the six **[CSF 2.0](https://www.nist.gov/cyberframework)** Functions instead. Use Rev. 3 as the current reference; the phase names remain useful shorthand as long as they are not attributed to a current NIST structure. [Monitoring, Incident Response & Operational Learning]({{ '/topics/incident-response-operational-learning/' | relative_url }}) covers this mapping and the declaration criteria in full.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/incident-response-csf-functions.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the CSF 2.0 Functions incident response mapping diagram at full size">
    <img src="{{ '/assets/img/incident-response-csf-functions.svg' | relative_url }}" alt="Govern is shown as a continuous band above five Functions running left to right — Identify, Protect, Detect, Respond, and Recover — with the incident response activity that sits in each. In-incident work concentrates in Detect, Respond, and Recover, while continuous improvement is captured under Identify's Improvement category. A footer states that NIST withdrew SP 800-61 Revision 2 and published Revision 3 in April 2025, replacing the four-phase lifecycle with this mapping, and that CSF 2.0 has exactly six Functions so Improve is not a seventh one.">
  </a>
  <p class="diagram-caption">Where response activity sits under the CSF 2.0 Functions, with Govern running continuously above them</p>
</div>

| Historical Rev. 2 phase | Current Rev. 3 placement | Playbook content |
|---|---|---|
| **Preparation** | Govern and Protect | IR policy and authority, playbooks, jump-bag tooling, out-of-band communications (*Signal, a secondary email domain*), immutable backups, tabletop exercises. |
| **Detection & Analysis** | Detect | Triage SIEM and EDR signals, scope the activity, and declare an incident against defined criteria. Declaration is the handover into Respond. |
| **Containment & Eradication** | Respond | Short-term isolation, then durable containment — block rules, credential and token revocation, patching the exploited path. Regulatory notification clocks generally start here, not at recovery. |
| **Recovery** | Recover | Restore from verified clean state, validate normal operation, and communicate status. Restoring before eradication completes reinfects. |
| **Post-Incident Activity** | Identify — Improvement (ID.IM) | Root cause analysis, detection rule updates, and control changes fed back through Govern. |

## SOAR Automation & Orchestration

**Security Orchestration, Automation and Response (SOAR)** platforms (*e.g. Palo Alto Cortex XSOAR, Splunk SOAR*) connect disparate security tools so a playbook can execute a response across them.

What automation removes is the **handoff latency** between tools and teams, not the decision. Each action below is a single API call; the time a human takes is spent finding the right console, raising a ticket, and waiting for another team to action it.

The durations below are **illustrative orders of magnitude to show where the latency sits — not measured benchmarks or vendor commitments.** Measure your own, since they depend entirely on staffing, tooling, and on-call structure.

| Playbook action | Where manual time goes | Orchestrated | Operation executed |
|---|---|---|---|
| **EDR host isolation** | Ticket dispatch to the endpoint team | Seconds | API call to the EDR agent (*CrowdStrike, Defender*) cutting the host's network stack while keeping the agent channel reachable. |
| **Session and token revocation** | Request queued to the identity team | Seconds | API call to the identity provider (*Okta, Entra ID*) revoking refresh and access tokens and forcing re-authentication. |
| **Malicious destination block** | Firewall change queue, often a change window | Seconds | Pushing the indicator to a perimeter or WAF dynamic blocklist. |
| **Phishing message triage** | Per-message manual analysis | Seconds | Detonating the attachment in a sandbox and purging matching messages across mailboxes. |

Two constraints belong in every playbook: an explicit **trigger condition** stating which detections may auto-execute, and an **approval boundary** above which a human decides. Automated isolation firing on a false positive is an outage the playbook caused, so the auto-execute path should be scoped to high-confidence detections and the rest left as one-click assisted actions.

## Ransomware Containment Playbook Workflow

When a high-severity ransomware detection fires, the containment sequence has ordering constraints — several steps destroy something a later step needed.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/ransomware-containment-sequence.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the ransomware containment sequence diagram at full size">
    <img src="{{ '/assets/img/ransomware-containment-sequence.svg' | relative_url }}" alt="Four ordered steps run left to right: capture volatile memory before anything changes host state, isolate the host at the endpoint agent to stop lateral movement while keeping the agent reachable, revoke the identity by disabling the account and invalidating its active tokens and Kerberos tickets, then contain the subnet with microsegmentation rules cutting the affected segment off from storage tiers. Each step carries the trade-off it makes. A footer states that ordering matters because pulling power destroys memory evidence and encryption keys, that network isolation is not the same as powering off, and that a token stays valid until it is revoked or expires so disabling the account alone is not containment.">
  </a>
  <p class="diagram-caption">Four steps, each with the trade-off it makes — and why the order is itself the control</p>
</div>

1. **Capture volatile state first, if at all.** Live memory capture and a volume snapshot must precede anything that changes host state, because memory can hold the encryption key, injected code, and network state that exist nowhere on disk. The trade-off is real: every second spent capturing is a second of continued encryption, so skipping it is sometimes the right call — make it a decision, not an oversight.
2. **Isolate the host at the agent, not by pulling power.** EDR network isolation cuts SMB and RDP lateral movement while keeping the agent channel reachable for investigation. Powering off destroys memory; disconnecting the cable also removes your own access.
3. **Revoke the identity, not just the account.** Disabling the account stops new authentication. Already-issued OAuth access tokens and Kerberos tickets remain valid until they are explicitly revoked or expire, so token invalidation is a separate action — see [OAuth & OpenID Connect]({{ '/topics/oauth-oidc/' | relative_url }}).
4. **Contain the segment.** Microsegmentation rules isolate the affected VLAN or subnet from production storage and backup tiers. This takes healthy workloads on that segment offline with it, which is why the blast radius of the containment action needs to be known before the playbook runs it unattended.

Backup integrity is what determines whether recovery is possible at all: repositories reachable with the same credentials as production are encrypted alongside it. [Operational Resilience, Business Continuity & Disaster Recovery]({{ '/topics/operational-resilience-business-continuity-disaster-recovery/' | relative_url }}) covers the recovery objectives this feeds.

## Incident response program review checklist

The checklist below is a journal working model, not a published audit standard. When auditing an incident response program and its orchestration, evaluate these six criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **IR Policy & SLA Definition** | Does the organization maintain formal IR playbooks with explicit SLA response targets for Critical incidents? | Incident Response Plan (IRP) documentation. |
| **Automated EDR Isolation** | Can the SOAR platform or EDR console isolate a compromised host from the network in < 60 seconds? | SOAR playbook code &amp; test isolation logs. |
| **Out-of-Band Communication** | Are out-of-band communication channels (*Signal, secondary email*) pre-configured for IR team usage? | Emergency communication roster &amp; accounts. |
| **Ransomware Backup Protection** | Are production backup repositories stored in immutable, air-gapped, or write-once-read-many (WORM) storage? | Backup system immutable storage configurations. |
| **Tabletop Exercise Drills** | Are executive and technical tabletop IR exercises conducted at least annually? | Tabletop exercise scenario reports &amp; action items. |
| **Post-Incident RCA Process** | Is a formal Root Cause Analysis (RCA) report and detection rule update required after every major incident? | Published post-incident RCA documentation. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>NIST withdrew SP 800-61 Rev. 2 — Rev. 3 (April 2025) maps response activity onto the six CSF 2.0 Functions, so the four-phase names are shorthand rather than a current NIST structure. Orchestration removes handoff latency, not the decision: give every playbook an explicit trigger condition and an approval boundary, because automated isolation on a false positive is an outage the playbook caused. In a ransomware sequence the order is the control — capture volatile memory before anything changes host state, isolate at the agent rather than by pulling power, and revoke tokens separately, since disabling an account leaves issued tokens valid until they expire.</p>
</div>

## Primary references

- **[NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)** — *Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile* (April 2025); verified that it supersedes Rev. 2 and maps response activity onto the CSF 2.0 Functions.
- **[NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework)** — verified the six Functions and that Improvement (ID.IM) sits under Identify rather than forming a seventh Function.
- **[CISA #StopRansomware Guide](https://www.cisa.gov/stopransomware/ransomware-guide)** — verified the containment and recovery checklist, including backup isolation requirements.
