---
title: "Digital Forensics & Evidence Handling"
description: Technical reference for digital forensic acquisition ordering (RFC 3227), live memory and disk imaging, Windows/Linux/cloud artifact timeline analysis, and documented chain of custody informed by NIST SP 800-86.
permalink: /topics/digital-forensics-evidence-handling/
last_verified: 2026-08-15
---

<span class="eyebrow">Digital Forensics & IR / Forensic Engineering</span>

# Digital Forensics & Evidence Handling

<p class="lede">Digital forensics is the identification, acquisition, preservation, and analysis of digital evidence after a security incident. Two constraints shape every decision in it. The first is that the most useful data is the most perishable: memory holds the injected code, the decrypted keys, and the live connections that exist nowhere on disk, and it is gone the moment the host is powered off. The second is that an investigator has to be able to show later that the data analyzed is the data acquired — which is what hashing and a custody log are for. Neither guarantees that evidence will be admitted in a proceeding; they make it possible to argue that it should be.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/digital-forensics-evidence-handling.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the digital forensics evidence handling diagram at full size">
    <img src="{{ '/assets/img/digital-forensics-evidence-handling.svg' | relative_url }}" alt="Three panels. The first covers acquisition: live RAM capture with WinPmem or LiME, bit-stream raw or E01 disk imaging behind a write-blocker, and the rule that volatile data is captured before the host is shut down. The second lists artifact sources by platform — Windows registry hives, event logs, Prefetch, Shimcache, Amcache and the USN journal; Linux journald, auth.log, shell history, auditd and cron; cloud CloudTrail, VPC flow logs, GCP audit logs and Azure activity logs — and separates evidence of execution from evidence of existence. The third covers chain of custody: hash the image on acquisition, log the acquirer, time and location, and analyze only working copies.">
  </a>
  <p class="diagram-caption">Acquisition ordering &leftrightarrow; OS and cloud artifact timeline analysis &leftrightarrow; chain of custody and hash verification</p>
</div>

## Acquisition ordering: capture the perishable first

Evidence acquisition should proceed from the most volatile data to the least, the order recommended by **[RFC 3227](https://www.rfc-editor.org/rfc/rfc3227.txt)** (BCP 55, Best Current Practice, February 2002). The RFC uses RFC 2119 keywords deliberately and states this as a *should*, not a requirement — the ordering is a default that a specific incident can justify departing from.

<p class="formula"><strong>RFC 3227 §2.1:</strong> registers and cache &rarr; routing table, ARP cache, process table, kernel statistics, memory &rarr; temporary file systems &rarr; disk &rarr; remote logging and monitoring data &rarr; physical configuration and network topology &rarr; archival media</p>

Note where memory sits: RFC 3227 groups live network state and process state *with* memory in one tier, because on a running host they are read from the same place. The practical sequence follows from that grouping:

1. **Volatile memory acquisition**: capture live memory (*WinPmem, LiME, FTK Imager*) before powering down or rebooting the host. A memory image preserves symmetric keys in use, running process structures, injected code that never touched disk, and active connections. On a machine using full-disk encryption this is often the only opportunity to recover the volume key.
2. **Disk imaging**: create a bit-stream raw (`.dd`) or Expert Witness Format (`.E01`) image, using a write-blocker so the acquisition cannot modify the source media.
3. **Cloud volume and log capture**: take a point-in-time snapshot of the affected EBS or persistent volume, restrict its permissions, hash the exported image, and copy the relevant audit logs (*AWS CloudTrail, GCP Audit Logs*) into an isolated forensic account before retention windows expire.

### Live capture is not a read-only operation

A write-blocker makes disk acquisition genuinely non-invasive; nothing equivalent exists for memory. A software memory acquisition tool loads a driver, allocates its own memory, and runs while the system keeps running, so the resulting image is a smear across a short interval rather than an instant, and the acquisition itself changes the state being acquired. That is an accepted cost, not a defect — but it has to be recorded in the custody log as an action taken on the host, and it means two memory images of the same machine will never hash identically.

The containment side of this trade-off — how long a capture can be allowed to run while an attacker is still active — belongs to the response playbook rather than the forensic procedure; see [Incident Response Playbooks & SOAR]({{ '/topics/incident-response-playbooks-soar/' | relative_url }}).

## OS and cloud artifact timeline analysis

Reconstructing what an adversary did means correlating artifacts that each answer a different question. The distinction that matters most is between artifacts that show a file **existed** and artifacts that show it **ran** — conflating the two produces a timeline that confidently attributes activity to a binary that never executed.

| OS / cloud platform | Key forensic artifacts | What it establishes | Reliability caveat |
|---|---|---|---|
| **Windows** | **Registry hives** (`NTUSER.DAT`, `SYSTEM`, `SOFTWARE`) | User activity, USB device connection history (`USBSTOR`), autostart persistence keys (`Run`/`RunOnce`). | Key last-write times are per key, not per value, so a single timestamp can cover several changes. |
| **Windows** | **Prefetch** (`C:\Windows\Prefetch`) | **Evidence of execution**: run count, up to the last eight execution times, and files the binary loaded. | Disabled by default on Windows Server, so absence is not evidence of non-execution. |
| **Windows** | **Shimcache (AppCompatCache) & Amcache** | **Evidence of existence** — that a file was present at a path, with its metadata. | Not execution evidence. Shimcache entries can be created by folder enumeration alone, and the execution flag is absent on Windows 10 and 11. Corroborate with Prefetch, Sysmon Event ID 1, or Security Event ID 4688 before claiming a binary ran. |
| **Windows** | **Event logs (`.evtx`) & USN journal** | Logon events (Event ID 4624), process creation (Event ID 4688 or Sysmon Event ID 1), file creation, rename, and deletion. | 4688 records a command line only when that audit setting is enabled; the USN journal is a fixed-size circular log that wraps under load. |
| **Linux** | **`journald` / `auth.log`, shell history, `auditd`** | SSH authentication attempts, `sudo` escalation, executed commands, cron persistence. | `.bash_history` is written on shell exit, is trivially disabled or truncated, and carries no timestamps unless `HISTTIMEFORMAT` was set. |
| **Cloud** | **CloudTrail / cloud audit logs & VPC flow logs** | Compromised access key usage, API calls, unauthorized resource creation, egress destinations. | Retention windows expire during slow investigations, and management-plane logging does not capture data-plane object access unless separately enabled. |

Two further caveats apply across the table. `$STANDARD_INFORMATION` timestamps are directly settable by an attacker (timestomping), so a filesystem timeline should be corroborated against `$FILE_NAME` attributes or a second artifact source. And an adversary operating through signed native binaries leaves no malicious file to hash at all — for that case the execution artifacts above, particularly 4688 command lines and Sysmon Event ID 1, carry the investigation.

## Chain of custody and evidentiary integrity

A documented chain of custody is what lets an investigator show that an image is the same data acquired, and that nobody could have altered it unnoticed in between. It **supports** admissibility; it does not guarantee it. Whether evidence is actually admitted depends on the jurisdiction, the applicable rules of evidence, and how the evidence is presented — the same boundary stated in [Monitoring, Incident Response & Operational Learning]({{ '/topics/incident-response-operational-learning/' | relative_url }}).

**[NIST SP 800-86](https://csrc.nist.gov/pubs/sp/800/86/final)** (August 2006) recommends the following practices rather than mandating them; it states explicitly that it is not legal advice and not a step-by-step guide to executing an investigation.

1. **Hash on acquisition**: compute a hash over the image as soon as it is acquired and record it in the custody log. SP 800-86 predates the SHA-2 transition and names MD5 and SHA-1; use SHA-256 or stronger today, since MD5 and SHA-1 are no longer collision-resistant and should not back a new evidence integrity record.
2. **Work on copies**: never analyze the master image. Create a working copy and verify `hash(master) == hash(working copy)` before and after analysis.
3. **Log custody continuously**: record the unique evidence ID and description; the date, time, and UTC offset of acquisition; the name, title, and signature of the acquiring investigator; every subsequent transfer; and the secure storage location with its verification hashes.

### What the hash proves and what it does not

A matching hash proves the working copy is byte-identical to what was acquired **at the moment of acquisition**. It proves nothing about whether the source was already tampered with before the investigator arrived, and nothing about who performed the acquisition or under what authority. Those are exactly the questions the custody log answers, which is why the two controls are only useful together: the hash establishes integrity from acquisition onward, and the log establishes provenance and handling.

## Forensic readiness review checklist

The checklist below is a journal working model, not a published audit standard. When auditing forensic readiness and evidence handling, evaluate these six criteria:

| Diagnostic area | Architectural evaluation question | Verification &amp; audit evidence |
|---|---|---|
| **Live RAM capture tooling** | Are responders equipped with memory acquisition tooling (*WinPmem, LiME*) and a documented decision rule for when to capture? | Forensic toolkit inventory &amp; IR runbooks. |
| **Write-blocked imaging** | Are write-blockers used for physical media acquisition, and is their use recorded per acquisition? | Write-blocker equipment logs &amp; acquisition records. |
| **Hash-on-acquisition** | Are SHA-256 or stronger hashes generated at capture time and recorded in the custody log rather than computed later? | Evidence intake sheets &amp; hash verification output. |
| **Process creation logging** | Are endpoints configured to log process creation (Sysmon Event ID 1 or Security Event ID 4688) *with command lines*? | Group Policy audit configuration &amp; sample events. |
| **Isolated analysis environment** | Is analysis performed on dedicated workstations separated from corporate networks? | Forensic lab network isolation rules. |
| **Cloud log preservation** | Are cloud audit logs immutable, retained beyond the expected investigation window, and protected from deletion by a compromised administrator? | Object Lock, retention policy &amp; KMS key policy settings. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Capture volatile memory before the host changes state — RFC 3227's ordering is a recommended default, and live capture perturbs the system it reads. When building the timeline, keep evidence of execution (Prefetch, Sysmon 1, 4688) separate from evidence of existence (Shimcache, Amcache). Hash on acquisition with SHA-256 or stronger and log custody continuously: the hash proves integrity from acquisition onward, the log proves provenance, and together they support admissibility without guaranteeing it.</p>
</div>

## Primary references

- **[NIST SP 800-86](https://csrc.nist.gov/pubs/sp/800/86/final)** (August 2006): *Guide to Integrating Forensic Techniques into Incident Response* — verified that it recommends rather than mandates chain-of-custody practice, disclaims use as legal advice, and names MD5 and SHA-1 rather than SHA-2 for message digests.
- **[RFC 3227](https://www.rfc-editor.org/rfc/rfc3227.txt)** (BCP 55, Best Current Practice, February 2002): *Guidelines for Evidence Collection and Archiving* — verified the order of volatility in §2.1 and its use of "should" under RFC 2119 keywords.
