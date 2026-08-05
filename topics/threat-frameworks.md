---
title: "Threat Frameworks: Kill Chain, Diamond Model, ATT&CK, D3FEND & STRIDE"
description: The difference between design-time threat modeling and after-the-fact intrusion analysis, and the concrete frameworks used for each — Cyber Kill Chain, the Diamond Model, MITRE ATT&CK/D3FEND, and STRIDE.
permalink: /topics/threat-frameworks/
last_verified: 2026-08-05
---

<span class="eyebrow">Threat Intelligence & Detection / Decision Guide</span>

# Threat Frameworks: Kill Chain, Diamond Model, ATT&CK, D3FEND & STRIDE

<p class="lede">I first decide which question I am answering. Kill Chain, the Diamond Model, and ATT&amp;CK help describe adversary activity and investigations. D3FEND maps defensive techniques. STRIDE is a design-time threat-category checklist. They can complement one another, but their outputs are not interchangeable.</p>

## Cyber Kill Chain: the original linear model

Lockheed Martin introduced the Cyber Kill Chain in 2011, adapting a military targeting concept into seven sequential phases: **Reconnaissance, Weaponization, Delivery, Exploitation, Installation, Command and Control, and Actions on Objectives.** It helps me locate prevention and detection opportunities, but disrupting one observed step does not guarantee the intrusion is over; an attacker may retry, change paths, or already hold access.

Its own limitation is right there in the "chain" metaphor: it assumes a linear path, which sophisticated intrusions don't reliably follow, and it has little to say about an insider who already holds legitimate access — someone who never has to pass through reconnaissance or delivery at all, because they started with a badge and a login.

## The Diamond Model: four features, one event

Published in 2013 by Caltagirone, Pendergast, and Betz, the Diamond Model takes a different shape entirely — not a sequence, but a single event with four connected features: **adversary, capability, infrastructure,** and **victim**, arranged at the corners of a diamond. Its core axiom: "for every intrusion event, there exists an adversary taking a step toward an intended goal by using a capability over infrastructure against a victim to produce a result."

Where the Kill Chain asks "which stage are we at," the Diamond Model asks "who is doing this, with what, from where, against whom" — a shape built specifically for pivoting during analysis (this infrastructure was also used in that other incident → likely the same adversary) rather than for tracking progress through a single attack.

## MITRE ATT&CK: a shared vocabulary for adversary behavior

[ATT&CK](https://attack.mitre.org/) reframes the same territory as "a globally-accessible knowledge base of adversary tactics and techniques based on real-world observations," organized as a matrix rather than a chain:

- **Tactics** — the *why*: the live Enterprise matrix currently has 15 tactical goals, from Reconnaissance and Resource Development through Initial Access, Execution, Persistence, Stealth, Defense Impairment, Credential Access, Discovery, Lateral Movement, Collection, Command and Control, Exfiltration, and Impact. The names and count can change between ATT&amp;CK releases, so I check the live matrix instead of memorizing an old list.
- **Techniques** — the *how*: a specific method under a tactic, e.g. Phishing under Initial Access.
- **Sub-techniques** — a more specific variant, e.g. Spearphishing Attachment and Spearphishing Link under Phishing.
- **Matrices** — Enterprise, Mobile, and ICS, each scoped to a different kind of target environment.

The practical advantage over a linear chain: real intrusions jump around, skip stages, and revisit earlier tactics (credential access after lateral movement, more discovery after persistence is established), and a matrix represents that non-linearity natively where a seven-step chain can't. ATT&CK has also grown a sibling for a newer target class: [MITRE ATLAS](https://atlas.mitre.org/), which adapts the same tactics/techniques matrix format specifically to attacks against AI/ML systems (prompt injection, training-data poisoning, model extraction) — the [AI & LLM Security]({{ '/topics/ai-llm-security/' | relative_url }}) page covers those techniques directly.

## MITRE D3FEND: the defensive counterpart

Where ATT&CK catalogs what attackers do, [D3FEND](https://d3fend.mitre.org/) catalogs defensive techniques under **Model, Harden, Detect, Isolate, Deceive, Evict,** and **Restore**. Its knowledge graph includes inferred relationships between offensive and defensive techniques. I use those mappings to find candidate countermeasures, then validate whether the chosen control works in my environment; a mapping is not proof of effectiveness.

## STRIDE: threat modeling before anything ships

Everything above analyzes intrusions that already happened, or catalogs techniques attackers are known to use. STRIDE, developed by Microsoft engineers Loren Kohnfelder and Praerit Garg in the late 1990s, runs in the opposite direction — at design time, before an application exists, walking a system's data-flow diagram and asking "what can go wrong here" through six threat categories:

| Letter | Threat | Violates |
|---|---|---|
| **S** | Spoofing | Authentication |
| **T** | Tampering | Integrity |
| **R** | Repudiation | Non-repudiation |
| **I** | Information Disclosure | Confidentiality |
| **D** | Denial of Service | Availability |
| **E** | Elevation of Privilege | Authorization |

Each category points at a standard class of mitigation — spoofing gets countered with strong authentication (see [Step-Up Authentication & MFA]({{ '/topics/step-up-authentication/' | relative_url }})), tampering with integrity checks (the [CBC bit-flipping]({{ '/topics/symmetric-mode-attacks/' | relative_url }}#2-cbc-a-missing-integrity-check-that-can-lead-to-privilege-escalation) page is a working demonstration of exactly this threat category left unmitigated), repudiation with signed audit logs, disclosure with encryption, denial of service with resource limits, and elevation of privilege with proper [authorization models]({{ '/topics/authorization-models/' | relative_url }}) rather than trusting client-supplied role claims.

## Comparing the five

| | When it's used | Shape | Answers |
|---|---|---|---|
| Cyber Kill Chain | During/after an intrusion | Linear, 7 stages | Which stage is this attack at? |
| Diamond Model | During/after an intrusion | Four connected features | Who, with what, from where, against whom? |
| MITRE ATT&CK | During/after an intrusion, and for detection coverage planning | Matrix (tactics × techniques) | What specific technique is this, and what else does this adversary typically do? |
| MITRE D3FEND | Detection/mitigation planning | Defensive-technique knowledge graph | Which countermeasures should I evaluate for this ATT&CK technique? |
| STRIDE | Before the system is built | Six threat categories per component | What can go wrong with this specific design, before it ships? |

## Common pitfalls

- **Using STRIDE to analyze an intrusion after the fact** — it's a design-time tool; ATT&CK or the Diamond Model fit that job far better.
- **Forcing a real intrusion into the Kill Chain's strict linear order** — most real attacks don't proceed cleanly stage-by-stage, and ATT&CK's matrix shape exists specifically to represent that non-linearity.
- **Treating a D3FEND mapping as a tested control** — it gives me a candidate relationship, not evidence that my implementation prevents or detects the technique.
- **Applying the Kill Chain to insider threats** — it structurally assumes an external attacker working through reconnaissance and delivery, stages an insider with existing access never has to pass through.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p>Lockheed Martin's original <a href="https://www.lockheedmartin.com/content/dam/lockheed-martin/rms/documents/cyber/LM-White-Paper-Intel-Driven-Defense.pdf">Cyber Kill Chain paper</a>; Caltagirone, Pendergast, and Betz's <a href="https://threatconnect.com/wp-content/uploads/The_Diamond_Model_of_Intrusion_Analysis.pdf">2013 Diamond Model paper</a>; the live <a href="https://attack.mitre.org/tactics/">MITRE ATT&amp;CK Enterprise tactics</a>; <a href="https://d3fend.mitre.org/">MITRE D3FEND</a>; and Microsoft's <a href="https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats">STRIDE guidance</a>.</p>
</div>
