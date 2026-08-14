---
title: Privacy by Design (PbD) & Privacy-Enhancing Technologies
description: "Comprehensive technical guide to Privacy by Design (PbD), Ann Cavoukian's 7 Foundational Principles, Privacy-Enhancing Technologies (PETs: Differential Privacy, ZKP, FHE, SMPC), and Pseudonymization vs Anonymization."
permalink: /topics/privacy-by-design-pets/
last_verified: 2026-08-13
---

<span class="eyebrow">Security Architecture & Design Principles / Privacy Engineering</span>

# Privacy by Design (PbD) & Privacy-Enhancing Technologies

<p class="lede">Privacy cannot be assured solely through compliance checklists or post-hoc privacy notices; it must be built directly into systems architecture. Privacy by Design (PbD), developed by Dr. Ann Cavoukian, establishes 7 foundational principles that mandate privacy as a default operational mode. Complementing PbD, Privacy-Enhancing Technologies (PETs)—including Differential Privacy, Zero-Knowledge Proofs, Homomorphic Encryption, and Secure Multi-Party Computation—provide mathematical frameworks for processing data without compromising user confidentiality.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/privacy-by-design-pets.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the privacy by design and PETs diagram at full size">
    <img src="{{ '/assets/img/privacy-by-design-pets.svg' | relative_url }}" alt="Three panels: Ann Cavoukian's seven Privacy by Design principles as organizational design rules; privacy-enhancing technologies with the property each one bounds; and a de-identification panel separating pseudonymization, which stays in GDPR scope, from anonymization, judged against a reasonable-means test.">
  </a>
  <p class="diagram-caption">Privacy architecture: the seven design principles, the PETs that bound disclosure mathematically, and where de-identification sits in GDPR scope</p>
</div>

## Ann Cavoukian’s 7 Foundational Principles

The **7 Principles of Privacy by Design** are a design framework, not a legal instrument. GDPR Article 25 imposes a separate and binding obligation — *data protection by design and by default* — whose drafting was influenced by this thinking, but the two are not the same text and satisfying one does not automatically satisfy the other. The principles govern system architecture as follows:

1. **Proactive not Reactive; Preventive not Remedial**: Anticipate and prevent privacy-invasive events before they occur; privacy is designed into the system upfront.
2. **Privacy as the Default Setting**: Automatically protect personal data in any IT system or business practice without requiring user action.
3. **Privacy Embedded into Design**: Privacy is an essential core component of the base design and architecture, not an add-on plugin.
4. **Full Functionality — Positive-Sum, not Zero-Sum**: Avoid unnecessary trade-offs (*e.g., privacy vs security*); accommodate all legitimate goals in a win-win fashion.
5. **End-to-End Security — Full Lifecycle Protection**: Secure data throughout its entire lifecycle—from collection to storage, processing, and secure destruction.
6. **Visibility and Transparency — Keep it Open**: Assure stakeholders that business practices and technology operate according to stated promises and independent verification.
7. **Respect for User Privacy — Keep it User-Centric**: Architect systems to empower users with strong defaults, clear notices, and user-friendly privacy controls.

## Privacy-Enhancing Technologies (PETs) Comparison

PETs let an organization extract analytical value while bounding what any individual record contributes. Each bounds a different thing under a different assumption, so they are not interchangeable:

| Privacy technology | Mechanism | What it actually provides | Assumption or cost | Primary use case |
|---|---|---|---|---|
| **Differential Privacy (&epsilon;, &delta;)** | Calibrated noise added to a query result or model — Laplace for pure &epsilon;-DP, Gaussian where a &delta; is used. | A **mathematical bound**, set by &epsilon;, on how much any single record can change the output, and so on what an adversary can infer about it. It does not reduce that inference to zero. | Utility falls as &epsilon; tightens, and the budget must be accounted across every query, not per query. No standard sets a universal &epsilon;. | Aggregate telemetry (*device analytics, census releases*). |
| **Zero-Knowledge Proofs (ZKP)** | An interactive or non-interactive proof system; zk-SNARKs and zk-STARKs are two common constructions. | Proves a statement is true (*the holder is over 21*) while revealing nothing beyond its truth. | Soundness rests on the construction's assumptions, and some schemes require a trusted setup. Proving cost is non-trivial. | Decentralized identity, age assertions, privacy-preserving authentication. |
| **Fully Homomorphic Encryption (FHE)** | An encryption scheme supporting computation on ciphertext, so that decrypting the computed ciphertext yields the result of the computation on the plaintext. | Lets an untrusted party compute a function without ever seeing the inputs. | Orders of magnitude slower than plaintext computation, which is the reason it stays confined to narrow workloads. | Untrusted cloud analytics over sensitive records. |
| **Secure Multi-Party Computation (SMPC)** | Secret sharing and interactive protocols across several parties, none of which sees another's input. | Jointly computes an agreed function over distributed inputs without exposing any party's input. | Holds only while collusion stays below the protocol's threshold; adds communication rounds and bandwidth. | Inter-bank fraud detection, joint medical research. |

FHE and SMPC are **distinct primitives**, not variants of one another: FHE computes on ciphertext held by one party, while SMPC distributes the computation across parties that each hold a share. [Federated Learning & Privacy-Preserving Machine Learning](../federated-learning-privacy/) shows both distinctions in a working setting, including why differential privacy and secure aggregation solve different halves of the same problem.

## Pseudonymization vs. Anonymization

| Dimension | Pseudonymization (GDPR Art. 4(5)) | Anonymization |
|---|---|---|
| **Definition** | Identifiers are replaced with tokens, with the mapping held separately and protected. | Data is transformed so that a person is no longer identifiable. |
| **GDPR scope** | **In scope**: pseudonymized data remains personal data. | **Out of scope**: data that is genuinely anonymous falls outside the Regulation. |
| **The test that decides it** | The additional information exists somewhere, so the data stays personal regardless of how well it is separated. | Recital 26 asks whether re-identification is possible using *means reasonably likely to be used*, accounting for cost, time, and available technology. It is a risk judgment, not a proof of impossibility. |
| **Reversibility** | Reversible by a party holding the mapping or key. | Not reversible by the intended means — but published re-identification research has repeatedly recovered individuals from datasets released as anonymous, usually by linkage against an auxiliary dataset. Treat a claim of anonymity as a dated assessment. |
| **Primary techniques** | HMAC-SHA256 tokenization, format-preserving encryption (FPE). | k-anonymity, l-diversity, t-closeness, generalization, suppression. |

The practical consequence: "we anonymized it" is a claim that has to be re-examined when new auxiliary datasets become public, because the reasonableness test moves as linkage data and compute get cheaper.

## Essential Privacy Engineering Diagnostic Checklist

When auditing an application or data processing architecture for privacy compliance, evaluate these 6 criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Privacy Default Settings** | Are privacy settings set to maximum protection by default without requiring user action? | Application onboarding configuration reviews. |
| **Data Minimisation Limits** | Is PII collection strictly limited to fields essential for declared processing goals? | Data inventory schemas &amp; API payload specifications. |
| **Pseudonymization Encryption** | Are PII identifiers pseudonymized using HMAC or format-preserving encryption with isolated keys? | Encryption code review &amp; key management policies. |
| **Differential Privacy Bounding** | Do analytical queries add calibrated noise, and is the &epsilon; budget accounted across queries with its chosen value justified? | Differential privacy library configs &amp; budget accounting records. |
| **Automated Data Retention Expiry** | Do database records enforce automatic deletion or anonymization upon expiration of retention windows? | Database TTL policies &amp; automated purge scripts. |
| **Data Subject Access Automation** | Are user requests for data access or erasure (GDPR Art. 17) processed via automated workflows? | Data deletion job pipelines &amp; SAR audit logs. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Privacy by Design is a design framework; GDPR Article 25's data protection by design and by default is the separate binding obligation. PETs bound disclosure rather than eliminate it — differential privacy bounds inference at a stated &epsilon;, ZKP reveals only a statement's truth, and FHE and SMPC are distinct primitives for computing over data no single party can read. Pseudonymized data stays personal data; anonymization is judged by whether re-identification is reasonably likely, not by absolute impossibility.</p>
</div>

## Primary references

- **[Privacy by Design: The 7 Foundational Principles](https://www.ipc.on.ca/en/privacy-organizations/privacy-by-design)** — Information and Privacy Commissioner of Ontario. Verified the wording and intent of the seven principles.
- **[ISO/IEC 27701:2025](https://www.iso.org/standard/27701)** — *Information security, cybersecurity and privacy protection — Privacy information management systems — Requirements and guidance*, second edition, October 2025. Verified the standard's current edition and its stand-alone scope.
- **[NIST Privacy Framework](https://www.nist.gov/privacy-framework)** — verified the risk-management framing used for the privacy engineering checklist.
- **[NIST SP 800-226: Guidelines for Evaluating Differential Privacy Guarantees](https://doi.org/10.6028/NIST.SP.800-226)** — verified that differential privacy states a bound rather than eliminating inference, and that no universal &epsilon; threshold is specified.
