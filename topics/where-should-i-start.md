---
title: Where Should I Start?
description: My starting map for learning security, reviewing a system, and establishing an organizational security program.
permalink: /topics/where-should-i-start/
last_verified: 2026-08-05
---

<span class="eyebrow">Security / Starting Map</span>

# Where Should I Start?

<p class="lede">Security is broad. Before I study a technology, framework, or attack, I need a common mental model: what I am protecting, which security property matters, what could cause harm, and how I will know that a control works. From there, I can follow the path for a system or for an organization.</p>

## What: build the common foundation first

I start with the [basic security model]({{ '/topics/security-fundamentals/' | relative_url }}): a threat exploits or triggers a vulnerability, causing an impact to an asset. A control reduces the likelihood, impact, or time needed to detect and recover from the event. Risk is what helps me decide which problems matter most.

The **CIA triad** gives me the first three security objectives:

- **Confidentiality** — only authorized parties can access the information.
- **Integrity** — information remains accurate, complete, and protected from improper change or destruction.
- **Availability** — authorized users can access and use the information or service when needed.

CIA is the starting point, not the whole of security. The [NIST security glossary](https://csrc.nist.gov/glossary/term/security) notes that authenticity, accountability, non-repudiation, and reliability may also matter. I keep these related terms separate:

| Term | Question it answers |
|---|---|
| **Authenticity** | Is the person, system, message, or data genuine and from the claimed source? |
| **Authentication** | How do I establish confidence in a claimed identity? |
| **Authorization** | What is that identity permitted to access or do? |
| **Accountability** | Can an action be traced to the responsible identity? |
| **Non-repudiation** | Is there evidence that supports determining who performed an action or originated data? |
| **Privacy** | Is personal information processed appropriately, including when access is authorized? |
| **Safety** | Could a failure cause unacceptable physical or environmental harm? |
| **Resilience** | Can the system withstand disruption, recover, and continue its essential purpose? |

The distinction matters. Authentication does not decide permission; authorization does. A digital signature may support authenticity, integrity, and non-repudiation, but the strength of that evidence still depends on identity proofing, control of the signing key, and the surrounding process. NIST defines [authenticity](https://csrc.nist.gov/glossary/term/authenticity), [authentication](https://csrc.nist.gov/glossary/term/authentication), [authorization](https://csrc.nist.gov/glossary/term/authorization), [accountability](https://csrc.nist.gov/glossary/term/accountability), and [non-repudiation](https://csrc.nist.gov/glossary/term/non_repudiation) separately.

## The technologies are mechanisms, not the starting objective

Once I understand the required security properties, I can see why each technology or practice exists:

| Technology or practice | Problem it mainly helps address |
|---|---|
| Identity and access management | Authentication, authorization, privileged access, and accountability |
| [Cryptography]({{ '/topics/cryptography-overview/' | relative_url }}) | Confidentiality, integrity, source authenticity, and digital-signature evidence |
| [Key management]({{ '/topics/hsm-kms/' | relative_url }}) and public key infrastructure | Trustworthy generation, distribution, storage, use, rotation, and revocation of keys and certificates |
| System, network, and application security | Safe configuration, isolation, trust boundaries, exposed interfaces, and vulnerability reduction |
| Logging, monitoring, and detection | Visibility, alerting, investigation, and accountability |
| Backups, failover, and recovery | Availability, resilience, and restoration of trustworthy data and services |
| Incident response | Preparation, containment, investigation, recovery, and learning after an event |

No item covers security by itself. Encryption cannot keep an unavailable service online, authentication does not repair an unsafe authorization rule, and a backup is useful only if I can restore it correctly.

## So what: security work covers several connected disciplines

I use this map to avoid treating every security activity as the same thing:

| Discipline | Main question |
|---|---|
| **Governance** | Who sets direction, owns decisions, accepts risk, and provides oversight? |
| **Risk management** | Which possible harms matter most, and how should I respond? |
| **Threat modeling** | What can go wrong in this system or design, and what will I do about it? |
| **Threat intelligence** | What analyzed threat information gives me useful context for a decision? |
| **Threat detection** | What evidence shows suspicious or harmful activity may be happening now? |
| **Security engineering** | How should I design, implement, and validate controls? |
| **Security operations and incident response** | How will I monitor, contain, investigate, recover, and improve? |
| **Compliance** | Which legal, regulatory, contractual, or standard requirements must I satisfy and evidence? |

These disciplines overlap, but they are not interchangeable. A threat model is specific to a system and its assumptions. [Threat intelligence](https://csrc.nist.gov/glossary/term/threat_intelligence) adds analyzed context about threats to support decisions. Detection uses telemetry and rules to find activity in an operating environment. Governance and risk management decide what the organization will prioritize and who is accountable.

## Now what: choose the path that matches my problem

Both paths use the same foundation. I do not need to learn every security domain before doing useful work.

### If I am securing a system or application

I start with one real system, feature, or data flow. The [OWASP Threat Modeling Project](https://owasp.org/www-project-threat-modeling/) provides four useful questions:

1. **What am I working on?** Identify users, components, data, dependencies, assumptions, entry points, and trust boundaries.
2. **What can go wrong?** Identify relevant threats, misuse, mistakes, failures, and the security properties that could be lost.
3. **What will I do about it?** Avoid the risky activity, reduce the risk with controls, share or transfer some consequences, or accept the remaining risk through the right owner.
4. **Did I do a good job?** Test the controls, review assumptions, record decisions, and revisit the remaining risk when the system changes.

My output should be practical: a simple system model, prioritized risks, selected controls, validation evidence, and explicit residual risk. The threat model is not finished merely because I drew a diagram.

### If I am establishing or improving an organizational security program

I use this order:

1. **Establish the mandate and scope.** Define why the program exists, who is accountable, which parts of the organization are covered, and who can accept risk.
2. **Understand the context.** Identify critical services, information, people, technologies, suppliers, obligations, and business dependencies.
3. **Choose an organizing framework.** Use it as a common structure and vocabulary, not as proof that the organization is secure.
4. **Assess the current state and risk.** Examine threats, vulnerabilities, existing controls, likelihood, impact, and the evidence behind each conclusion.
5. **Define the target and roadmap.** Prioritize outcomes and controls according to risk, obligations, dependencies, cost, and available capability.
6. **Implement and validate.** Assign owners, deliver controls, test that they operate and reduce the intended risk, and retain useful evidence.
7. **Monitor and improve.** Track changes, incidents, control performance, and residual risk instead of treating the program as a one-time project.

The **[NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework)** is a useful organizing map because its six Functions—**Govern, Identify, Protect, Detect, Respond, and Recover**—give a continuous view of cybersecurity risk. The Functions are concurrent outcomes, not six implementation steps and not a complete control checklist.

## How I choose a framework or control source

I choose based on the problem, obligation, and level of detail I need:

| Source | What I use it for |
|---|---|
| [NIST CSF 2.0](https://www.nist.gov/cyberframework) | Organizing and communicating cybersecurity outcomes across an organization |
| [CIS Controls](https://www.cisecurity.org/controls) | A prioritized set of concrete safeguards; Implementation Group 1 is the essential cyber-hygiene starting point recommended by CIS |
| [ISO/IEC 27001:2022](https://www.iso.org/standard/27001) | Requirements for establishing, maintaining, and continually improving an information security management system |
| [NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) | A detailed catalog of security and privacy controls from which applicable controls can be selected |
| [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) | Testable security requirements for designing, developing, and verifying web applications and services |

A framework organizes the work. A control catalog supplies candidate controls. A risk assessment supplies decision context. None of them removes the need to understand the system, select what applies, implement it correctly, and validate the result.

## Risk turns the map into priorities

The [NIST SP 800-30 Rev. 1](https://csrc.nist.gov/pubs/sp/800/30/r1/final) model brings together threats, vulnerabilities, likelihood, and impact. My compact sequence is:

> Identify what matters → determine what could cause harm → find the weaknesses that make it possible → assess likelihood and impact → choose a response → implement and validate controls → record the remaining risk.

I can **avoid**, **reduce**, **share or transfer**, or **accept** a risk. A mitigation is not complete because a policy was written or a product was installed. I need evidence that the control works, an owner for what remains, and a trigger for reassessment.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>I start with the security objective and the risk, not with a tool. I learn the shared concepts first, then choose the system path or the organizational path. Frameworks help me organize the work; threat modeling and risk assessment help me decide what matters; validation tells me whether the controls actually work.</p>
</div>

## Primary references

- **[NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework)** — organization-wide cybersecurity outcomes and the six Functions.
- **[NIST SP 800-30 Rev. 1](https://csrc.nist.gov/pubs/sp/800/30/r1/final)** — risk-assessment concepts and process.
- **[NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)** — security and privacy control catalog.
- **[OWASP Threat Modeling Project](https://owasp.org/www-project-threat-modeling/)** — the four-question threat-modeling starting point.
- **[CIS Controls v8.1 Implementation Groups](https://www.cisecurity.org/controls/implementation-groups)** — prioritized safeguards and the IG1 starting baseline.
- **[ISO/IEC 27001:2022](https://www.iso.org/standard/27001)** — information security management system requirements.
