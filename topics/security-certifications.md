---
title: Security Certifications
description: FIPS 140, Common Criteria, PCI PTS HSM, and eIDAS — what each certification actually claims, who requires it, and where to verify one.
permalink: /topics/security-certifications/
last_verified: 2026-07-26
---

<span class="eyebrow">Key Management / Deep Dive</span>

# Security Certifications

<p class="lede">This page is my checklist for reading certification claims without accepting the marketing shorthand. I need the exact product/module, version, certificate number, scope, assurance level, Security Target or Protection Profile, status, and the programme that issued it.</p>

## Why independent certification exists at all

A vendor saying "our product is secure" is unverifiable on its face — there's no way for a buyer to check that claim without redoing the vendor's own testing. Certification schemes exist to break that deadlock: an accredited, independent lab tests the product against a fixed, public specification, and the result — pass, fail, or a graded level — is published by a neutral body, not the vendor. The original driver was government procurement (a federal agency buying cryptographic equipment needs a standardized way to specify "secure enough" in a contract), and each scheme below still traces back to that same root need, even where it's since become a broader industry norm.

## FIPS 140-2 / 140-3 — the US/Canada cryptographic module standard

Covered in full under [HSM & KMS]({{ '/topics/hsm-kms/' | relative_url }}#fips-140-the-assurance-standard-behind-hsm-grade): a joint NIST/Canadian Centre for Cyber Security program testing a specific cryptographic module (hardware or software) against four increasing assurance levels, from "approved algorithms, no physical security" (Level 1) to "resists environmental attacks like voltage/temperature manipulation" (Level 4). It's scoped narrowly to the cryptographic module itself — key generation, storage, and use — not the whole product built around it.

## Common Criteria (ISO/IEC 15408) — the international, any-product standard

Where FIPS 140 covers cryptographic modules, **Common Criteria** can evaluate many categories of IT product. Every evaluation is based on a product-specific **Security Target (ST)**. The ST may claim conformance to one or more **Protection Profiles (PPs)**, but PP conformance is not mandatory in every Common Criteria scheme. The PP defines reusable requirements for a product class; the EAL or assurance package describes evaluation rigour.

| EAL | Rigor |
|---|---|
| EAL1 | Functionally tested |
| EAL2 | Structurally tested |
| EAL3 | Methodically tested and checked |
| EAL4 | Methodically designed, tested, and reviewed — where most commercial products (including most HSMs) sit |
| EAL5 | Semiformally designed and tested |
| EAL6 | Semiformally verified design and tested |
| EAL7 | Formally verified design and tested — reserved for the highest-assurance, highest-cost evaluations |

A higher EAL is not automatically “more secure” in an absolute sense. It says more about evaluation depth than whether the Security Target covers the threat or feature I care about. I should read the ST, claimed PP conformance, assumptions, exclusions, and evaluated configuration.

**[NIAP](https://www.niap-ccevs.org/)** operates the US Common Criteria evaluation scheme and publishes approved Protection Profiles and a Product Compliant List. NIAP requirements are especially relevant to National Security Systems and procurements governed by CNSS policies; it is too broad to say every US federal purchase generally requires NIAP certification. The **[Common Criteria portal](https://www.commoncriteriaportal.org/)** is the international registry across participating schemes.

## PCI PTS HSM — the payments industry's own standard

The **Payment Card Industry PIN Transaction Security (PTS) HSM** requirements are a separate certification specific to hardware handling payment-card cryptography (PIN blocks, card data encryption keys). It borrows some requirements from FIPS 140 but goes further: PCI PTS HSM covers the device's entire lifecycle — manufacturing floor controls, secure shipping and delivery, field servicing, and decommissioning — not just the cryptographic module's design and construction. A payment HSM can be FIPS 140-3 Level 3 validated and still need a separate PCI PTS HSM approval before a card network will accept it in a payment flow.

Worth keeping distinct: **PCI PTS HSM** certifies a physical device; **PCI DSS** (Payment Card Industry Data Security Standard) is a much broader organizational compliance program covering how a whole business handles cardholder data — network segmentation, access controls, logging, and more. The two get conflated constantly; a business can be fully PCI DSS compliant while using hardware that was never PCI PTS HSM tested at all (though most acquirers and card networks will require it in practice for HSMs specifically handling card PINs).

## EN 419 221-5 — one EU trust-service protection profile

The **eIDAS** ecosystem uses several standards and certification routes for qualified signature/seal creation devices and trust-service cryptographic modules. **[EN 419 221-5](https://www.enisa.europa.eu/sites/default/files/publications/WP2018%20O.2.2.1%20-%20Assessment%20of%20standards%20related%20to%20eIDAS.pdf)** is a Common Criteria Protection Profile for cryptographic modules used by trust service providers. It is not the one universal PP for every QSCD: local signing devices, remote signing services, and TSP modules can fall under different EN 419 2xx standards and implementing decisions.

## Comparing them side by side

| Certification | What's actually tested | Who typically requires it |
|---|---|---|
| FIPS 140-2 / 140-3 | A specific cryptographic module's design and implementation | US/Canadian federal procurement; widely used as a general baseline elsewhere |
| Common Criteria | An IT product against its Security Target, optionally conforming to PPs | International; NIAP profiles for applicable US government/NSS procurement |
| PCI PTS HSM | A physical HSM's full lifecycle, scoped to payment cryptography | Card networks, payment processors, acquiring banks |
| EN 419 221-5 | A TSP cryptographic module against a specific Common Criteria PP | Relevant EU trust-service/eIDAS deployments where that PP is the selected route |

## Verifying a real certificate

NIST's **[CMVP validated modules search](https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search)** is free, public, and authoritative for FIPS 140—searchable by vendor, exact module name, standard, and level. Examples I checked on **26 July 2026** included:

```
Certificate #4962 — Thales Luna G7 Cryptographic Module (Thales)
Certificate #5302 — YubiHSM 2 Cryptographic Module (Yubico, Inc.)
```

These examples are snapshots, not permanent status claims. Each certificate is tied to an exact module and version and may later move to a historical or revoked list. The database entry is the verification point.

## Common pitfalls

- **"FIPS compliant" vs. "FIPS validated"** — vendors sometimes use softer language ("FIPS compliant," "FIPS inspired," "uses FIPS-approved algorithms") to imply a status they don't actually hold. Only a real CMVP certificate number is a validated claim.
- **Quoting a bare EAL number without the Security Target** — the ST defines the evaluated security functions, assumptions, and configuration. If PP conformance is claimed, I should read that PP too.
- **Treating PCI PTS HSM approval as general-purpose security assurance** — it's scoped tightly to payment/PIN cryptography, not a broad endorsement of the device for unrelated uses.
- **Assuming a certificate is permanent** — certifications are tied to a specific hardware/firmware revision and typically have a defined validity window; a firmware update can require re-certification under a new certificate number, exactly what happened when AWS CloudHSM's `hsm1.medium` certificate moved to NIST's historical list in favor of `hsm2.medium`'s newer one.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/fips/140-3/final">FIPS 140-3</a></strong> is the current cryptographic module standard; <strong><a href="https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search">CMVP's validated modules search</a></strong> is where to verify a claim against it. The <strong><a href="https://www.commoncriteriaportal.org/">Common Criteria portal</a></strong> lists internationally certified products; <strong><a href="https://www.niap-ccevs.org/">NIAP</a></strong> covers the US government's Protection Profiles specifically. The <strong><a href="https://listings.pcisecuritystandards.org/documents/PCI_HSM_Security_Requirements_v4.pdf">PCI PTS HSM Security Requirements</a></strong> define the payments-industry standard. <strong>EN 419 221-5</strong> (CEN) is the eIDAS Protection Profile for qualified signature devices.</p>
</div>

## How I connect this

This is the "how do I actually check that claim" companion to [HSM & KMS]({{ '/topics/hsm-kms/' | relative_url }}) — that page covers what an HSM does and why custody matters; this one covers how the industry independently verifies that a specific product actually does what its vendor says, and which of several overlapping schemes applies to a given use case (general-purpose key custody, US federal procurement, payment processing, or EU-qualified signatures).
