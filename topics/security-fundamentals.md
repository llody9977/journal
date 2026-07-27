---
title: Security Fundamentals
description: My working notes on the CIA triad and the overlap between security and reliability.
permalink: /topics/security-fundamentals/
---

<span class="eyebrow">Security / Overview</span>

# Security Fundamentals

<p class="lede">My simplest security checklist is still the CIA triad: who can read the information, whether it remains accurate and complete, and whether an authorised user can get it when needed. A cipher, access rule, backup, or failover design normally protects at least one of these properties.</p>

## The CIA triad

**Confidentiality**, **Integrity**, and **Availability** — per **[ISO/IEC 27000](https://www.iso.org/standard/iso-iec-27000-family)**, the standard vocabulary for information security management:

| Property | ISO/IEC 27000 definition | The question it answers |
|---|---|---|
| **Confidentiality** | Information is not made available or disclosed to unauthorized individuals, entities, or processes | *Can someone who shouldn't, read this?* |
| **Integrity** | The property of accuracy and completeness | *Is this still correct and complete?* |
| **Availability** | The property of being accessible and usable upon demand by an authorized entity | *Can an authorized someone still reach this?* |

**[FIPS 200](https://csrc.nist.gov/pubs/fips/200/final)** — the US federal baseline these three properties are drawn from — defines availability specifically as "ensuring timely and reliable access to and use of information."

## Availability and reliability overlap

Availability covers timely and reliable access regardless of whether the cause is malicious or accidental. A DDoS attack, failed disk, bad deployment, ransomware incident, and exhausted database can all cause a loss of availability. Integrity is similar: an attacker may corrupt a record, but so can a software defect or operator mistake.

The organisational ownership can still differ. Security teams normally focus on adversarial threats and abuse cases, while SRE and operations handle broader reliability engineering. The controls overlap quite a lot: backups, redundancy, monitoring, recovery testing, capacity protection, and incident response help against both malicious and accidental failures. For my own reviews, I should classify the **property that failed** separately from the **cause of the failure**.

## Beyond the triad: authenticity and non-repudiation

ISO/IEC 27000 itself notes that **authenticity**, **accountability**, **non-repudiation**, and **reliability** "can also be involved" in information security, alongside the core triad — recognized extensions, not replacements. The **[Parkerian Hexad](https://en.wikipedia.org/wiki/Parkerian_Hexad)** (Donn Parker, 1998) goes further and formally separates authenticity out as its own property distinct from integrity, alongside possession/control and utility.

This is why the properties I use in [Cryptography]({{ '/topics/cryptography-overview/' | relative_url }}) do not map to the CIA triad one-for-one. Cryptographic tools can support confidentiality, integrity, and authenticity. Digital signatures can also support accountability and evidence, though “non-repudiation” still depends on key custody, identity proofing, procedure, and sometimes law. Cryptography does not make a service available by itself.

## Common pitfalls

- **Treating "encrypted" as a synonym for "secure"** — encryption is a confidentiality control specifically; it says nothing about integrity, availability, or whether the system enforcing it is otherwise sound.
- **Classifying the property by the cause** — a hardware failure and a DDoS attack can look identical from a dashboard. Both are availability failures even if different teams investigate and prevent them.
- **Assuming CIA is exhaustive** — ISO/IEC 27000 and the Parkerian Hexad both explicitly name properties beyond the original three; a security review scoped only to confidentiality/integrity/availability can still miss an authenticity or non-repudiation gap entirely.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.iso.org/standard/iso-iec-27000-family">ISO/IEC 27000</a></strong> defines the CIA triad and the extended properties referenced above. <strong><a href="https://csrc.nist.gov/pubs/fips/200/final">FIPS 200</a></strong> is the US federal baseline defining confidentiality, integrity, and availability for information systems. The <strong><a href="https://en.wikipedia.org/wiki/Parkerian_Hexad">Parkerian Hexad</a></strong> is Donn Parker's six-property extension separating authenticity from integrity explicitly.</p>
</div>

## How I connect this

I use this as the top-level checklist for the rest of these notes. [Cryptography]({{ '/topics/cryptography-overview/' | relative_url }}) supplies some of the confidentiality, integrity, and authenticity mechanisms; [Key Management]({{ '/topics/hsm-kms/' | relative_url }}) and [Authentication & Authorization]({{ '/topics/oauth-oidc/' | relative_url }}) depend on them; [Network Security]({{ '/topics/dns-security/' | relative_url }}) includes both adversarial resilience and availability concerns.
