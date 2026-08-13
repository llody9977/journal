---
title: Privacy by Design (PbD) & Privacy-Enhancing Technologies
description: Comprehensive technical guide to Privacy by Design (PbD), Ann Cavoukian's 7 Foundational Principles, Privacy-Enhancing Technologies (PETs: Differential Privacy, ZKP, FHE, SMPC), and Pseudonymization vs Anonymization.
permalink: /topics/privacy-by-design-pets/
last_verified: 2026-08-13
---

<span class="eyebrow">Security Architecture & Design Principles / Privacy Engineering</span>

# Privacy by Design (PbD) & Privacy-Enhancing Technologies

<p class="lede">Privacy cannot be assured solely through compliance checklists or post-hoc privacy notices; it must be built directly into systems architecture. Privacy by Design (PbD), developed by Dr. Ann Cavoukian, establishes 7 foundational principles that mandate privacy as a default operational mode. Complementing PbD, Privacy-Enhancing Technologies (PETs)—including Differential Privacy, Zero-Knowledge Proofs, Homomorphic Encryption, and Secure Multi-Party Computation—provide mathematical frameworks for processing data without compromising user confidentiality.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/privacy-by-design-pets.svg' | relative_url }}" alt="Privacy by Design diagram showing Ann Cavoukian's 7 principles, Differential Privacy, ZKP, FHE, SMPC, and Pseudonymization.">
  <p class="diagram-caption">Privacy Architecture: Ann Cavoukian's 7 Principles &leftrightarrow; Pseudonymization &amp; Anonymization &leftrightarrow; Privacy-Enhancing Technologies (PETs)</p>
</div>

## Ann Cavoukian’s 7 Foundational Principles

Adopted globally and embedded into regulations like GDPR Article 25, the **7 Principles of Privacy by Design** govern system architecture:

1. **Proactive not Reactive; Preventive not Remedial**: Anticipate and prevent privacy-invasive events before they occur; privacy is designed into the system upfront.
2. **Privacy as the Default Setting**: Automatically protect personal data in any IT system or business practice without requiring user action.
3. **Privacy Embedded into Design**: Privacy is an essential core component of the base design and architecture, not an add-on plugin.
4. **Full Functionality — Positive-Sum, not Zero-Sum**: Avoid unnecessary trade-offs (*e.g., privacy vs security*); accommodate all legitimate goals in a win-win fashion.
5. **End-to-End Security — Full Lifecycle Protection**: Secure data throughout its entire lifecycle—from collection to storage, processing, and secure destruction.
6. **Visibility and Transparency — Keep it Open**: Assure stakeholders that business practices and technology operate according to stated promises and independent verification.
7. **Respect for User Privacy — Keep it User-Centric**: Architect systems to empower users with strong defaults, clear notices, and user-friendly privacy controls.

## Privacy-Enhancing Technologies (PETs) Comparison

Mathematical PETs enable organizations to extract analytical insights while mathematically bounding privacy risks:

| Privacy Technology | Mathematical Mechanism | Operational Capability | Primary Use Case |
|---|---|---|---|
| **Differential Privacy ($\varepsilon, \delta$)** | Injects bounded noise (Laplacian or Gaussian) into query results. | Guarantees that query outputs reveal no information about any single individual. | Aggregate telemetry collection (*Apple/Google device analytics, US Census*). |
| **Zero-Knowledge Proofs (ZKP)** | Cryptographic proof ($zk-SNARKs / zk-STARKs$) of statement truth. | Proves a statement is true (*e.g. user is over 21*) without revealing underlying PII (*DOB*). | Decentralized identity, age verification, privacy-preserving authentication. |
| **Fully Homomorphic Encryption (FHE)** | Algebraic encryption scheme permitting arbitrary math operations on ciphertext. | Computes functions over encrypted data without decrypting it first ($\text{Dec}(f(E(x))) = f(x)$). | Untrusted cloud analytics processing sensitive medical or financial data. |
| **Secure Multi-Party Computation (SMPC)** | Secret-sharing protocol across multiple non-colluding servers. | Jointly computes functions over distributed inputs without exposing private inputs to any party. | Inter-bank fraud detection, joint medical research across hospitals. |

## Pseudonymization vs. Anonymization

| Dimension | Pseudonymization (GDPR Art. 4(5)) | Anonymization |
|---|---|---|
| **Legal Definition** | Replaces PII identifiers with artificial tokens (*pseudonyms*); reversible using separate secret keys. | Permanent, irreversible data transformation removing all re-identification capability. |
| **GDPR Scope** | **In-Scope**: Pseudonymized data remains personal data under GDPR. | **Out-of-Scope**: Truly anonymized data falls outside GDPR statutory requirements. |
| **Reversibility** | Reversible by authorized parties holding the mapping table/secret key. | Irreversible by any party under any circumstances. |
| **Primary Techniques** | HMAC-SHA256 tokenization, format-preserving encryption (FPE). | $k$-Anonymity, $l$-Diversity, $t$-Closeness, data suppression. |

## Essential Privacy Engineering Diagnostic Checklist

When auditing an application or data processing architecture for privacy compliance, evaluate these 6 criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Privacy Default Settings** | Are privacy settings set to maximum protection by default without requiring user action? | Application onboarding configuration reviews. |
| **Data Minimisation Limits** | Is PII collection strictly limited to fields essential for declared processing goals? | Data inventory schemas &amp; API payload specifications. |
| **Pseudonymization Encryption** | Are PII identifiers pseudonymized using HMAC or format-preserving encryption with isolated keys? | Encryption code review &amp; key management policies. |
| **Differential Privacy Bounding** | Do analytical telemetry queries enforce calibrated noise injection ($\varepsilon, \delta$ privacy budget)? | Differential privacy library configs (e.g. Google Differential Privacy). |
| **Automated Data Retention Expiry** | Do database records enforce automatic deletion or anonymization upon expiration of retention windows? | Database TTL policies &amp; automated purge scripts. |
| **Data Subject Access Automation** | Are user requests for data access or erasure (GDPR Art. 17) processed via automated workflows? | Data deletion job pipelines &amp; SAR audit logs. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Privacy by Design (PbD) embeds privacy into system architecture as the default mode. Pseudonymization tokenizes PII reversibly, while anonymization is permanent. Privacy-Enhancing Technologies (PETs)—Differential Privacy, ZKP, and FHE—enable mathematical processing without exposing underlying PII.</p>
</div>

## Primary references

- **Privacy by Design**: *The 7 Foundational Principles* — [Ann Cavoukian / IPC](https://www.ipc.on.ca/en/privacy-organizations/privacy-by-design)
- **ISO/IEC 27701:2025**: *Privacy Information Management System (PIMS)* — [ISO 27701 Standard](https://www.iso.org/standard/27701)
- **NIST Privacy Framework**: *A Tool for Improving Privacy Through Risk Management* — [NIST CSRC](https://www.nist.gov/privacy-framework)
