---
title: Security Certifications
description: Deep technical analysis of FIPS 140-3, Common Criteria (ISO 15408), PCI PTS HSM, and eIDAS EN 419 221-5 hardware certifications.
permalink: /topics/security-certifications/
last_verified: 2026-08-06
---

<span class="eyebrow">Governance, Risk & Compliance / Assurance</span>

# Security Certifications

<p class="lede">Independent hardware and software security certifications verify vendor security claims through accredited laboratory testing. Evaluating certification claims requires distinguishing between cryptographic module validation (FIPS 140-3), general product evaluation (Common Criteria EAL levels), payment hardware mandates (PCI PTS HSM), and qualified electronic signature profiles (eIDAS EN 419 221-5).</p>

## The Security Certification Landscape

| Certification Standard | Governing Body | Evaluated Subject | Assurance Levels | Target Domain |
|---|---|---|---|---|
| **FIPS 140-3** | NIST / CCCS (CMVP) | Cryptographic module design, key storage, & physical security | Level 1 (Lowest) $\rightarrow$ Level 4 (Highest) | US/Canadian Federal procurement & global baseline |
| **Common Criteria (ISO/IEC 15408)** | International Mutual Recognition (CCRA) / NIAP | IT product against a Security Target (ST) & Protection Profile (PP) | EAL1 (Tested) $\rightarrow$ EAL7 (Formally Verified) | International government, defense & national security systems |
| **PCI PTS HSM** | PCI Security Standards Council (PCI SSC) | Full hardware lifecycle & payment PIN cryptography | Pass/Fail against Payment Hardware Requirements | Payment card networks, acquirers & financial switches |
| **EN 419 221-5** | CEN / ENISA (eIDAS) | Trust Service Provider (TSP) cryptographic module | Qualified Signature Creation Device (QSCD) | European Union eIDAS Trust Services & Digital ID |

## FIPS 140-2 / FIPS 140-3: Cryptographic Module Validation

Operated jointly by NIST and the Canadian Centre for Cyber Security through the **Cryptographic Module Validation Program (CMVP)**, **[FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final)** tests cryptographic modules across four security levels:

- **Level 1**: Basic security; requires approved algorithms but no physical tamper protection (*e.g., software cryptographic libraries like OpenSSL FIPS provider*).
- **Level 2**: Adds tamper-evident coatings or seals and role-based authentication.
- **Level 3**: Adds tamper response (zeroizing keys upon physical casing breach), identity-based authentication, and logical key separation (*e.g., cloud KMS HSMs, AWS CloudHSM, YubiHSM 2*).
- **Level 4**: Highest physical assurance; protects against environmental attacks (voltage fluctuation, extreme temperature manipulation, side-channel analysis).

FIPS 140 validation applies strictly to the **cryptographic module boundary** (key generation, derivation, storage, and execution), not the surrounding application logic.

## Common Criteria (ISO/IEC 15408): Product Evaluation

**Common Criteria** evaluates broad IT products (operating systems, firewalls, smart cards, HSMs) against two critical documents:

1. **Protection Profile (PP)**: Industry-standard specification of security requirements for a category of products (*e.g., Stateful Traffic Filter Firewall PP*).
2. **Security Target (ST)**: A vendor's specific document claiming compliance with a PP and detailing target security functions.

### Evaluation Assurance Levels (EAL1 - EAL7)

<div class="diagram-frame">
  <img src="{{ '/assets/img/common-criteria-eal.svg' | relative_url }}" alt="Common Criteria evaluation assurance levels EAL1 through EAL7 with progressively stronger evidence and evaluation rigor.">
  <p class="diagram-caption">A higher EAL means more evaluation rigor, not automatic protection against every threat</p>
</div>

A higher EAL rating indicates **greater evaluation depth**, not necessarily superior security features. EAL4+ (Methodically Designed, Tested, and Reviewed) represents the practical ceiling for commercial enterprise products.

## PCI PTS HSM: Payment Hardware Lifecycle Certification

While FIPS 140 tests core cryptography, **PCI PTS HSM** certifies physical Hardware Security Modules handling payment card data (PIN blocks, EMV key derivation, cardholder data encryption).

PCI PTS HSM extends beyond cryptographic math to inspect the **entire manufacturing and delivery lifecycle**:
- Secure factory production and component supply chain controls.
- Tamper-evident transport and secure courier delivery procedures.
- Physical anti-tamper mesh enclosing the cryptographic core.
- Secure field maintenance, firmware signing, and decommissioning zeroization.

A payment HSM must hold PCI PTS HSM approval before major payment networks (Visa, Mastercard, AMEX) permit it to process PIN transactions.

## Verification Checklist: Validating Vendor Claims

When auditing vendor certification claims:

1. **Verify Certificate Numbers**: Search the official **[NIST CMVP Database](https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search)** for FIPS 140 claims or the **[Common Criteria Portal](https://www.commoncriteriaportal.org/)** for EAL ratings.
2. **Distinguish "FIPS Compliant" vs "FIPS Validated"**: Reject marketing phrases like *"FIPS compliant"* or *"FIPS-approved algorithms"*. Only a listed NIST CMVP certificate number guarantees an audited module.
3. **Inspect the Physical/Software Boundary**: Confirm whether validation covers the entire physical hardware unit or merely an underlying software library module.
4. **Check Certificate Sunset Dates**: Verify that hardware modules have not moved to NIST's *Historical List* following firmware or hardware updates.
