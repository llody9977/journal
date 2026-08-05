---
title: Security Objectives & Properties
description: My working model for CIA, authenticity, accountability, non-repudiation, privacy, safety, and resilience.
permalink: /topics/security-objectives-properties/
last_verified: 2026-08-05
---

<span class="eyebrow">Security Foundations / Concepts</span>

# Security Objectives & Properties

<p class="lede">A security objective states what must remain true. A control or technology is how I try to preserve it. I identify the objective first so I do not ask encryption, authentication, backups, or another mechanism to solve the wrong problem.</p>

## What: CIA is the starting point

The **CIA triad** gives me three core objectives. [NIST FIPS 199](https://csrc.nist.gov/pubs/fips/199/final) defines them in terms of protecting information and systems from unauthorized disclosure, improper change or destruction, and loss of timely access.

| Objective | What I need to preserve | Example failure |
|---|---|---|
| **Confidentiality** | Authorized restrictions on access and disclosure | Someone who is not allowed to view a payroll record can read it |
| **Integrity** | Accuracy, completeness, and protection from improper change or destruction | A salary account number is changed and the system accepts it |
| **Availability** | Timely and reliable access and use by an authorized party | Payroll staff are authorized, but the service is unavailable on payday |

“Authorized” matters in all three. Confidentiality does not mean nobody can read the data. Availability does not mean everybody can reach the service. Integrity does not mean the original input was true; it means the accepted state is protected from improper change and can be treated with the required confidence.

## So what: CIA does not describe every security need

Other properties become important depending on the system and possible harm:

- **[Authenticity](https://csrc.nist.gov/glossary/term/authenticity)** — confidence that a person, system, message, or data is genuine and from its claimed source.
- **[Accountability](https://csrc.nist.gov/glossary/term/accountability)** — actions can be traced to the responsible identity.
- **[Non-repudiation](https://csrc.nist.gov/glossary/term/non_repudiation)** — evidence supports determining whether a particular entity performed an action or originated data.
- **Privacy** — personal data is processed in a way that does not create unacceptable consequences for people, including when access is authorized. The [NIST Privacy Framework](https://www.nist.gov/privacy-framework) treats this as a distinct risk problem.
- **Safety** — failures do not cause unacceptable physical injury, environmental damage, or other real-world harm.
- **Resilience** — the system can withstand disruption, recover, and continue its essential purpose.

These terms are related but do not collapse into one another:

- **Integrity is not authenticity.** A message may arrive unchanged but still come from an impostor.
- **Authentication is not authorization.** Verifying an identity does not decide what it may do.
- **Confidentiality is not privacy.** Authorized collection or use of personal data can still create privacy harm.
- **Availability is not the same as reliability.** Reliability engineering helps availability, but security also considers deliberate disruption such as denial-of-service or ransomware.
- **A digital signature is not automatic legal proof.** It can support integrity, origin authentication, and non-repudiation, but the evidence still depends on identity proofing, key custody, timestamps, logs, and the surrounding process.

## Technologies support properties in combinations

| Mechanism | What it may support | What it does not establish by itself |
|---|---|---|
| Encryption | Confidentiality | Availability, authorization, or trustworthy key ownership |
| Message authentication code | Integrity and source authentication between shared-key holders | Which individual shared-key holder created the message |
| Digital signature | Integrity, source authenticity, and third-party-verifiable evidence | The signer's intent or exclusive control of a compromised key |
| Authentication | Confidence in an identity | Permission for a requested action |
| Authorization | Permitted actions and resources | Whether the identity proof was strong enough |
| Backup and failover | Availability, resilience, and recovery | Confidentiality or integrity unless those are designed separately |
| Audit logging | Accountability, detection, and investigation | Prevention, or trustworthy evidence if logs can be altered |

The same mechanism may support several objectives, and one objective normally needs several controls. I should state the required property and threat assumptions before saying a mechanism is “secure.”

## Now what: identify the required properties

For each important asset or action, I ask:

1. Who is allowed to read it?
2. Who is allowed to create, change, approve, or delete it?
3. When must it be accessible, and how long can it be unavailable?
4. How do I know the identity, system, or data is genuine?
5. Which actions must be attributable, and what evidence is required?
6. Could authorized processing still create privacy or safety harm?
7. How must the system continue or recover after disruption?
8. How will I test each required property and its failure case?

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>I name the security objective before choosing the technology. CIA gives me the base. Authenticity, accountability, non-repudiation, privacy, safety, and resilience extend the model when the system needs them.</p>
</div>

## Primary references

- **[NIST FIPS 199](https://csrc.nist.gov/pubs/fips/199/final)** — confidentiality, integrity, availability, and impact categorization.
- **[NIST security glossary](https://csrc.nist.gov/glossary/term/security)** — CIA and other relevant security properties.
- **[NIST Privacy Framework](https://www.nist.gov/privacy-framework)** — privacy risk management.
