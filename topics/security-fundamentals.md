---
title: Security Fundamentals
description: The CIA triad, precisely — and why availability is a narrower security concern than "keeping the system up."
permalink: /topics/security-fundamentals/
---

<span class="eyebrow">Security / Overview</span>

# Security Fundamentals

<p class="lede">Three properties sit underneath almost every security decision, in any domain: can this be read by someone who shouldn't, can this be changed by someone who shouldn't, and can it still be reached by someone who should. Everything else — a cipher, a firewall rule, a backup schedule — exists to protect one of those three.</p>

## The CIA triad

**Confidentiality**, **Integrity**, and **Availability** — per **[ISO/IEC 27000](https://www.iso.org/standard/iso-iec-27000-family)**, the standard vocabulary for information security management:

| Property | ISO/IEC 27000 definition | The question it answers |
|---|---|---|
| **Confidentiality** | Information is not made available or disclosed to unauthorized individuals, entities, or processes | *Can someone who shouldn't, read this?* |
| **Integrity** | The property of accuracy and completeness | *Can someone who shouldn't, change this?* |
| **Availability** | The property of being accessible and usable upon demand by an authorized entity | *Can an authorized someone still reach this?* |

**[FIPS 200](https://csrc.nist.gov/pubs/fips/200/final)** — the US federal baseline these three properties are drawn from — defines availability specifically as "ensuring timely and reliable access to and use of information."

## Availability: what's actually in scope

Availability is the one that looks, on the surface, like a much bigger problem than it is. Keeping a system reachable involves redundant power, capacity planning, failover, backups, patch cadence, on-call response — most of which has nothing to do with an adversary at all. A disk failing, a bad deploy, an under-provisioned database: all genuine availability incidents, none of them a *security* incident in the sense the other two properties are.

The security-specific slice of availability is narrower: defending access against someone *trying* to deny it — a DDoS flood, a ransomware operator deliberately encrypting production data, an attacker exhausting a rate limiter's backing store on purpose. That's a real, distinct discipline (much of what [Network Security]({{ '/topics/dns-security/' | relative_url }}) and DDoS-mitigation infrastructure exists for). But it's a slice of general reliability engineering, not the whole of it — most uptime work sits in site reliability and operations, brought into "security" scope only where the cause is adversarial rather than accidental.

## Beyond the triad: authenticity and non-repudiation

ISO/IEC 27000 itself notes that **authenticity**, **accountability**, **non-repudiation**, and **reliability** "can also be involved" in information security, alongside the core triad — recognized extensions, not replacements. The **[Parkerian Hexad](https://en.wikipedia.org/wiki/Parkerian_Hexad)** (Donn Parker, 1998) goes further and formally separates authenticity out as its own property distinct from integrity, alongside possession/control and utility.

This is exactly why [Cryptography]({{ '/topics/cryptography-overview/' | relative_url }})'s own four pillars — confidentiality, integrity, authenticity, non-repudiation — don't map onto the CIA triad one-for-one. Cryptographic tools address confidentiality and integrity directly, and are the primary mechanism for the two extended properties (authenticity, non-repudiation) that matter most once identity and accountability enter the picture. Availability is the deliberate gap: a cipher, a hash, a signature — none of them keep a server reachable. That property is addressed by an entirely different set of tools, mostly outside cryptography altogether.

## Common pitfalls

- **Treating "encrypted" as a synonym for "secure"** — encryption is a confidentiality control specifically; it says nothing about integrity, availability, or whether the system enforcing it is otherwise sound.
- **Folding every uptime concern into "security"** — a hardware failure and a DDoS attack can look identical from a dashboard, but only one of them is a security incident; conflating the two blurs where security responsibility actually starts and ends.
- **Assuming CIA is exhaustive** — ISO/IEC 27000 and the Parkerian Hexad both explicitly name properties beyond the original three; a security review scoped only to confidentiality/integrity/availability can still miss an authenticity or non-repudiation gap entirely.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.iso.org/standard/iso-iec-27000-family">ISO/IEC 27000</a></strong> defines the CIA triad and the extended properties referenced above. <strong><a href="https://csrc.nist.gov/pubs/fips/200/final">FIPS 200</a></strong> is the US federal baseline defining confidentiality, integrity, and availability for information systems. The <strong><a href="https://en.wikipedia.org/wiki/Parkerian_Hexad">Parkerian Hexad</a></strong> is Donn Parker's six-property extension separating authenticity from integrity explicitly.</p>
</div>

## Where this fits

This is the frame everything else in Security sits inside. [Cryptography]({{ '/topics/cryptography-overview/' | relative_url }}) is the toolset for confidentiality, integrity, authenticity, and non-repudiation; [Key Management]({{ '/topics/hsm-kms/' | relative_url }}) and [Authentication & Authorization]({{ '/topics/oauth-oidc/' | relative_url }}) both lean on that toolset directly. [Network Security]({{ '/topics/dns-security/' | relative_url }}) is where availability's adversarial slice — denial of service, resilience against active interference — actually lives.
