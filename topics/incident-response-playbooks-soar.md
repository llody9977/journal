---
title: "Incident Response Playbooks & SOAR"
description: Comprehensive technical guide to Incident Response (IR) playbooks, NIST SP 800-61 Rev 2 lifecycle phases, Security Orchestration Automation and Response (SOAR), and Ransomware containment workflows.
permalink: /topics/incident-response-playbooks-soar/
last_verified: 2026-08-13
---

<span class="eyebrow">Digital Forensics & IR / Response Engineering</span>

# Incident Response Playbooks & SOAR

<p class="lede">When a security breach occurs, rapid containment is critical to minimizing operational business impact and preventing data exfiltration. Incident Response (IR) operates across the 4-phase lifecycle defined by NIST SP 800-61 Rev 2. Modern Security Operations Centers (SOCs) automate containment playbooks using Security Orchestration, Automation and Response (SOAR) technologies—executing automated EDR network isolation, credential revocation, and firewall block commands within seconds of alert escalation.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/incident-response-playbooks-soar.svg' | relative_url }}" alt="Incident Response diagram showing NIST SP 800-61 Rev 2 IR lifecycle (Preparation, Detection, Containment, Recovery), SOAR automation, and Ransomware containment playbooks.">
  <p class="diagram-caption">Incident Response Architecture: NIST SP 800-61 Rev 2 4-Phase Lifecycle &leftrightarrow; SOAR Automated Containment &amp; Ransomware Playbooks</p>
</div>

## NIST SP 800-61 Rev 2 Incident Response Lifecycle

The **NIST SP 800-61 Rev 2** framework structures incident response into four continuous phases:

```
[ 1. Preparation ] ──> [ 2. Detection & Analysis ] ──> [ 3. Containment, Eradication & Recovery ] ──> [ 4. Post-Incident Activity ]
```

1. **Preparation**: Establishing IR policies, communication playbooks, jump-bag forensic tools, out-of-band communication channels (*Signal, secure emergency email*), and baseline monitoring.
2. **Detection & Analysis**: Triage incoming SIEM/EDR alerts, determine incident scope, analyze attack vectors, and assign severity ratings (*Low, Medium, High, Critical*).
3. **Containment, Eradication & Recovery**:
   - **Containment**: Short-term mitigation (*isolate host from network*) and long-term containment (*issue firewall block rules, rotate compromise tokens*).
   - **Eradication**: Purge malware artifacts, disable compromised user accounts, and patch exploited vulnerabilities.
   - **Recovery**: Restore systems from verified clean backups, validate normal operations, and return services to production.
4. **Post-Incident Activity**: Conduct formal Lessons Learned meetings, publish Root Cause Analysis (RCA) reports, and update SIEM detection rules.

## SOAR Automation & Orchestration

**Security Orchestration, Automation and Response (SOAR)** platforms (*e.g. Palo Alto Cortex XSOAR, Splunk SOAR*) connect disparate security tools to execute automated response playbooks:

| SOAR Capability | Manual Operation Time | Automated SOAR Execution Time | Operational Action Executed |
|---|---|---|---|
| **EDR Host Isolation** | 15–45 minutes (Manual ticket dispatch) | **< 5 seconds** | API call to EDR agent (*CrowdStrike / Defender*) isolating compromised host network stack. |
| **User Session Revocation** | 10–30 minutes (Identity team request) | **< 3 seconds** | API call to Identity Provider (*Okta / Entra ID*) revoking active OAuth tokens &amp; forcing password reset. |
| **Malicious IP / Domain Block** | 20–60 minutes (Firewall ticket queue) | **< 2 seconds** | Pushing malicious C2 IP address to perimeter WAF / Palo Alto Firewall dynamic blocklists. |
| **Phishing Email Triage** | 15 minutes per reported email | **< 10 seconds** | Extracting attachment, scanning in sandbox, and purging matching emails from all user inboxes. |

## Ransomware Containment Playbook Workflow

When a High-Severity Ransomware alert triggers, the automated response playbook follows a strict containment sequence:

```
[ Ransomware Alert ] ──> 1. Automated EDR Host Isolation ──> 2. Revoke AD/IdP Tokens ──> 3. Block C2 Subnet ──> 4. Trigger RAM Snapshot
```

1. **Immediate Host Isolation**: Issue EDR network isolation command to prevent lateral movement via SMB/RDP.
2. **Identity Lockout**: Disable the compromised user account in Active Directory / Okta and invalidate all Kerberos/OAuth tokens.
3. **Subnet Containment**: Apply microsegmentation rules to isolate the affected VLAN or cloud subnet from production storage tiers.
4. **Forensic Snapshot**: Trigger automated live memory capture and volume snapshot before host power-off.

## Essential Incident Response Diagnostic Checklist

When auditing an enterprise Incident Response program and SOAR implementation, evaluate these 6 criteria:

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
  <p>Incident Response follows the NIST SP 800-61 Rev 2 4-phase lifecycle (Preparation, Detection, Containment, Lessons Learned). Deploy SOAR playbooks to automate EDR network isolation, token revocation, and C2 IP blocking in seconds.</p>
</div>

## Primary references

- **NIST SP 800-61 Rev 2**: *Computer Security Incident Handling Guide* — [NIST CSRC](https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final)
- **CISA Ransomware Guide**: *Comprehensive Ransomware Response Checklist* — [CISA Advisory](https://www.cisa.gov/stopransomware/ransomware-guide)
