---
title: What Is Security?
description: My recall-first model for security—assets, threats, vulnerabilities, risk, controls, the CIA triad, and validation.
permalink: /topics/security-fundamentals/
last_verified: 2026-08-05
---

<span class="eyebrow">Security / Overview</span>

# What Is Security?

<p class="lede">Security is how I protect people, information, services, and other things I value from unacceptable harm. It is not one product or a permanent state of zero risk. It is an ongoing process of understanding risk, choosing controls, checking whether they work, and deciding what risk remains.</p>

## What: protect something valuable from harm

My shortest useful model is:

> A **threat** exploits or triggers a **vulnerability**, causing an **impact** to an **asset**. A **security control** reduces the likelihood, impact, or time taken to detect and recover from that event.

The terms matter because they describe different parts of the problem:

- **[Asset](https://csrc.nist.gov/glossary/term/asset)** — something valuable, such as a person, business process, service, device, dataset, reputation, or physical facility. NIST's definition includes both tangible and intangible value.
- **[Threat](https://csrc.nist.gov/glossary/term/threat)** — an event, condition, or actor with the potential to cause harm. It may be malicious, accidental, or environmental.
- **[Vulnerability](https://csrc.nist.gov/topics/security-and-privacy/risk-management/vulnerabilities)** — a weakness in a system, procedure, control, or implementation that a threat could exploit or trigger.
- **Impact** — the harm that follows, such as financial loss, unsafe conditions, service disruption, privacy harm, legal exposure, or damaged trust.
- **[Risk](https://csrc.nist.gov/glossary/term/risk)** — how much the possible event matters, considering both its likelihood and its impact. `Likelihood × impact` is a useful reminder, not a universal mathematical formula.
- **[Security control](https://csrc.nist.gov/glossary/term/security_control)** — a safeguard or countermeasure used to change the risk. A control may prevent, detect, contain, respond to, or help recover from an event.

For example, in a clinic appointment system:

- the appointment data and booking service are **assets**;
- a denial-of-service attack is a **threat event**;
- relying on one undersized server is a **vulnerability**;
- patients being unable to retrieve appointments is the **impact**;
- rate limits, extra capacity, monitoring, and failover are **controls**.

The vulnerability alone is not the whole risk. I still need to ask whether a relevant threat can reach it, what the resulting harm would be, and what existing controls already change the likelihood or impact. This is the basic reasoning used by **[NIST SP 800-30 Rev. 1](https://csrc.nist.gov/pubs/sp/800/30/r1/final)** for risk assessment.

Security is the broadest term here. **Information security** protects information in any form, while **cybersecurity** focuses on risks involving digital and connected systems. Real security work spans people, process, physical safeguards, and technology—not only software or encryption.

## So what: security is risk management, not perfect prevention

Calling a system “secure” without naming the asset, threat, impact, and acceptable risk does not tell me much. No practical system removes every possible failure. I need to prioritize the risks that could cause unacceptable harm and choose a proportionate response:

- **Avoid** the risk by stopping the risky activity.
- **Reduce** it with controls that lower likelihood or impact.
- **Transfer or share** some consequences through contracts or insurance, without pretending responsibility disappears.
- **Accept** the remaining risk when the right owner understands and approves it.

That remaining exposure is **residual risk**. A control does not make it vanish; it changes the risk to a level I may or may not accept.

I also should not rely on prevention alone. A sound design combines:

- **Preventive controls** to stop or limit an event.
- **Detective controls** to reveal that something happened.
- **Responsive controls** to contain and investigate it.
- **Recovery controls** to restore trustworthy operations and data.

The **[NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework)** gives me a broader recall map: **Govern, Identify, Protect, Detect, Respond, and Recover**. These functions describe connected cybersecurity outcomes, not six isolated teams or a one-time sequence.

## The CIA triad: the three core security objectives

The CIA triad helps me categorize what kind of security property could be lost. I use one appointment record to test the three objectives separately:

<div class="diagram-frame">
  <video class="diagram-video" controls autoplay muted loop playsinline preload="metadata" poster="{{ '/assets/video/cia-triad-poster.png' | relative_url }}?v=4" aria-label="A slow CIA triad walkthrough using one appointment record. Confidentiality blocks an unauthorized reader while allowing the authorized user. Integrity detects and rejects a change from 10:00 to 16:00. Availability uses failover so the authorized user can still access the record when the primary service is unavailable. The ending compares the three failures and provides a review checklist.">
    <source src="{{ '/assets/video/cia-triad.webm' | relative_url }}?v=4" type="video/webm">
    <source src="{{ '/assets/video/cia-triad.mp4' | relative_url }}?v=4" type="video/mp4">
    <img src="{{ '/assets/video/cia-triad-poster.png' | relative_url }}?v=4" alt="CIA triad checklist: confidentiality limits reading to authorized parties, integrity keeps data accurate and unaltered, and availability keeps it accessible to authorized users when needed.">
  </video>
  <p class="diagram-caption">One appointment record, three separate tests: disclosure, improper change, and access when needed</p>
</div>

- **Confidentiality — only authorized parties can read the information.** If Mallory can see Mei's appointment record, confidentiality has failed.
- **Integrity — the information remains accurate, complete, and protected from improper change or destruction.** If `10:00` becomes `16:00` and the system accepts it silently, integrity has failed.
- **Availability — authorized users can access and use the information or service when needed.** If Mei is allowed to read the record but the service cannot return it, availability has failed.

Integrity does not prove that information was true when it was first entered. It protects an accepted state from improper change and helps me detect when data should no longer be trusted.

Availability overlaps heavily with reliability. A distributed denial-of-service attack, failed disk, bad deployment, ransomware incident, or exhausted database can all stop an authorized user from reaching a service. The causes differ, but the failed security objective is still availability.

These definitions follow **[NIST FIPS 199](https://csrc.nist.gov/pubs/fips/199/final)** and the related NIST definitions of **[integrity](https://csrc.nist.gov/glossary/term/integrity)** and **[availability](https://csrc.nist.gov/glossary/term/availability)**.

## What the CIA triad does not cover by itself

CIA is a strong starting point, not a complete security model. I may also need to examine:

- **Authenticity** — whether a person, system, message, or record is genuine and what it claims to be.
- **Accountability** — whether actions can be traced to the responsible actor through trustworthy identity, authorization, and audit evidence.
- **Privacy** — whether data processing creates unacceptable consequences for people, even when access is authorized and the system remains secure. The **[NIST Privacy Framework](https://www.nist.gov/privacy-framework)** treats privacy as its own risk-management problem.
- **Safety** — whether failures can cause physical injury, environmental damage, or other unacceptable real-world harm.
- **Compliance** — whether required laws, regulations, contracts, and standards are satisfied. Passing an audit is evidence about defined requirements, not proof that every material risk is controlled.

The boundaries are important. Encryption can support confidentiality, and authenticated encryption can detect tampering, but neither keeps a service available. Authentication can establish who is present, but authorization still decides what that identity may do. A backup server can keep a service available when hardware fails, but redundancy alone may not stop an attacker from compromising both servers. Security depends on how these pieces work together.

## Now what: my quick security review

When I review a system, I start with these questions:

1. **What do I value?** Identify the people, data, services, operations, and trust that need protection.
2. **Where is the boundary?** Mark users, administrators, services, devices, networks, vendors, and trust transitions.
3. **What could cause harm?** Consider malicious actions, mistakes, component failures, supply-chain events, and environmental conditions.
4. **Which weaknesses make that possible?** Look for vulnerable code, unsafe defaults, excessive privilege, weak processes, missing capacity, and untested assumptions.
5. **What would the impact be?** Categorize loss of confidentiality, integrity, availability, privacy, safety, financial value, or reputation.
6. **Which controls change the risk?** Cover prevention, detection, response, and recovery instead of relying on one barrier.
7. **How do I validate them?** Test denied and allowed access, tamper with data, simulate failure, restore backups, inspect alerts, and exercise incident procedures.
8. **What risk remains?** Record the residual risk, its owner, the decision, and what change should trigger another review.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Security starts with value and harm, not with a tool. I identify assets, threats, vulnerabilities, and impact; choose controls; validate the result; and make the remaining risk explicit.</p>
</div>

## Primary references

- **[NIST FIPS 199](https://csrc.nist.gov/pubs/fips/199/final)** — confidentiality, integrity, availability, and impact categorization.
- **[NIST SP 800-30 Rev. 1](https://csrc.nist.gov/pubs/sp/800/30/r1/final)** — risk assessment concepts and process.
- **[NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework)** — Govern, Identify, Protect, Detect, Respond, and Recover outcomes.
- **[NIST security-control glossary](https://csrc.nist.gov/glossary/term/security_control)** — control definitions sourced from NIST publications.
- **[ISO/IEC 27000 family](https://www.iso.org/standard/iso-iec-27000-family)** — information-security management vocabulary and standards.
