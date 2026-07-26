---
title: Security Certifications
description: FIPS 140, Common Criteria, PCI PTS HSM, and eIDAS — what each certification actually claims, who requires it, and where to verify one.
permalink: /topics/security-certifications/
---

<span class="eyebrow">Key Management / Deep Dive</span>

# Security Certifications

<p class="lede">A product claiming "FIPS 140-3 Level 3" or "Common Criteria EAL4+" is making a specific, checkable claim against a specific published standard — not a generic security endorsement. Four schemes cover almost everything that shows up in procurement requirements, vendor spec sheets, and compliance checklists for cryptographic hardware and software.</p>

## Why independent certification exists at all

A vendor saying "our product is secure" is unverifiable on its face — there's no way for a buyer to check that claim without redoing the vendor's own testing. Certification schemes exist to break that deadlock: an accredited, independent lab tests the product against a fixed, public specification, and the result — pass, fail, or a graded level — is published by a neutral body, not the vendor. The original driver was government procurement (a federal agency buying cryptographic equipment needs a standardized way to specify "secure enough" in a contract), and each scheme below still traces back to that same root need, even where it's since become a broader industry norm.

## FIPS 140-2 / 140-3 — the US/Canada cryptographic module standard

Covered in full under [HSM & KMS]({{ '/topics/hsm-kms/' | relative_url }}#fips-140-the-assurance-standard-behind-hsm-grade): a joint NIST/Canadian Centre for Cyber Security program testing a specific cryptographic module (hardware or software) against four increasing assurance levels, from "approved algorithms, no physical security" (Level 1) to "resists environmental attacks like voltage/temperature manipulation" (Level 4). It's scoped narrowly to the cryptographic module itself — key generation, storage, and use — not the whole product built around it.

## Common Criteria (ISO/IEC 15408) — the international, any-product standard

Where FIPS 140 only covers cryptographic modules, **Common Criteria** evaluates any category of IT product — firewalls, operating systems, smart cards, HSMs, mobile device management software — against a **Protection Profile (PP)**: an implementation-independent document defining what "secure" means for that specific product category. A vendor's certification is always "evaluated at assurance level X against Protection Profile Y" — the PP is what was actually tested for; the level below just states how rigorously.

| EAL | Rigor |
|---|---|
| EAL1 | Functionally tested |
| EAL2 | Structurally tested |
| EAL3 | Methodically tested and checked |
| EAL4 | Methodically designed, tested, and reviewed — where most commercial products (including most HSMs) sit |
| EAL5 | Semiformally designed and tested |
| EAL6 | Semiformally verified design and tested |
| EAL7 | Formally verified design and tested — reserved for the highest-assurance, highest-cost evaluations |

A higher EAL is not automatically "more secure" in an absolute sense — it only means the evaluation itself was more rigorous, against whatever Protection Profile was chosen. An EAL4+ certification against a narrow, dated PP proves less than an EAL2 certification against a demanding, current one for the property that actually matters.

**[NIAP](https://www.niap-ccevs.org/)** (the National Information Assurance Partnership, operating under the NSA) is the US government's own arm of this scheme: US federal agencies generally require products they procure to be Common Criteria–certified against a specific NIAP-approved Protection Profile, not just "Common Criteria certified" in the abstract. The **[Common Criteria portal](https://www.commoncriteriaportal.org/)** is the international certified-products registry across all participating countries.

## PCI PTS HSM — the payments industry's own standard

The **Payment Card Industry PIN Transaction Security (PTS) HSM** requirements are a separate certification specific to hardware handling payment-card cryptography (PIN blocks, card data encryption keys). It borrows some requirements from FIPS 140 but goes further: PCI PTS HSM covers the device's entire lifecycle — manufacturing floor controls, secure shipping and delivery, field servicing, and decommissioning — not just the cryptographic module's design and construction. A payment HSM can be FIPS 140-3 Level 3 validated and still need a separate PCI PTS HSM approval before a card network will accept it in a payment flow.

Worth keeping distinct: **PCI PTS HSM** certifies a physical device; **PCI DSS** (Payment Card Industry Data Security Standard) is a much broader organizational compliance program covering how a whole business handles cardholder data — network segmentation, access controls, logging, and more. The two get conflated constantly; a business can be fully PCI DSS compliant while using hardware that was never PCI PTS HSM tested at all (though most acquirers and card networks will require it in practice for HSMs specifically handling card PINs).

## EN 419 221-5 — the EU eIDAS trust-service protection profile

The EU's **eIDAS Regulation** requires a **Qualified Signature Creation Device (QSCD)** — the hardware backing a legally-recognized "qualified" electronic signature — to be Common Criteria certified against a specific Protection Profile, **[EN 419 221-5](https://www.enisa.europa.eu/sites/default/files/publications/WP2018%20O.2.2.1%20-%20Assessment%20of%20standards%20related%20to%20eIDAS.pdf)**, typically at EAL4+. This is Common Criteria applied to one narrow, specific case: an HSM that a Qualified Trust Service Provider uses to hold the signing keys behind legally-binding EU digital signatures. Several commercial HSM vendors (Thales, Utimaco, Entrust) hold this specific certification alongside their more general FIPS 140 and Common Criteria credentials — it's an additional, distinct claim, not implied by the others.

## Comparing them side by side

| Certification | What's actually tested | Who typically requires it |
|---|---|---|
| FIPS 140-2 / 140-3 | A specific cryptographic module's design and implementation | US/Canadian federal procurement; widely used as a general baseline elsewhere |
| Common Criteria | Any IT product, against a category-specific Protection Profile | International; NIAP-approved PPs specifically for US federal procurement |
| PCI PTS HSM | A physical HSM's full lifecycle, scoped to payment cryptography | Card networks, payment processors, acquiring banks |
| EN 419 221-5 | An HSM backing EU-qualified electronic signatures, via Common Criteria | EU Qualified Trust Service Providers, under eIDAS |

## Verifying a real certificate

NIST's **[CMVP validated modules search](https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search)** is free, public, and authoritative for FIPS 140 — searchable by vendor, exact module name, standard, and level. Two real, current entries as of this writing:

```
Certificate #4962 — Thales Luna G7 Cryptographic Module (Thales)
Certificate #5302 — YubiHSM 2 Cryptographic Module (Yubico, Inc.) — validated 2026-06-03
```

Each certificate is tied to an *exact* module and firmware version — not just a product line. A vendor's marketing page saying "FIPS 140-3 Level 3" is a claim; the certificate number, checked against this search, is the verification. If a specific vendor/module combination doesn't turn up, the claim can't be confirmed as it stands, whatever the spec sheet says.

## Common pitfalls

- **"FIPS compliant" vs. "FIPS validated"** — vendors sometimes use softer language ("FIPS compliant," "FIPS inspired," "uses FIPS-approved algorithms") to imply a status they don't actually hold. Only a real CMVP certificate number is a validated claim.
- **Quoting a bare EAL number with no Protection Profile named** — "EAL4+ certified" means nothing on its own; the Protection Profile it was evaluated against is the part that defines what was actually tested for.
- **Treating PCI PTS HSM approval as general-purpose security assurance** — it's scoped tightly to payment/PIN cryptography, not a broad endorsement of the device for unrelated uses.
- **Assuming a certificate is permanent** — certifications are tied to a specific hardware/firmware revision and typically have a defined validity window; a firmware update can require re-certification under a new certificate number, exactly what happened when AWS CloudHSM's `hsm1.medium` certificate moved to NIST's historical list in favor of `hsm2.medium`'s newer one.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/fips/140-3/final">FIPS 140-3</a></strong> is the current cryptographic module standard; <strong><a href="https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search">CMVP's validated modules search</a></strong> is where to verify a claim against it. The <strong><a href="https://www.commoncriteriaportal.org/">Common Criteria portal</a></strong> lists internationally certified products; <strong><a href="https://www.niap-ccevs.org/">NIAP</a></strong> covers the US government's Protection Profiles specifically. The <strong><a href="https://listings.pcisecuritystandards.org/documents/PCI_HSM_Security_Requirements_v4.pdf">PCI PTS HSM Security Requirements</a></strong> define the payments-industry standard. <strong>EN 419 221-5</strong> (CEN) is the eIDAS Protection Profile for qualified signature devices.</p>
</div>

## Where this fits

This is the "how do I actually check that claim" companion to [HSM & KMS]({{ '/topics/hsm-kms/' | relative_url }}) — that page covers what an HSM does and why custody matters; this one covers how the industry independently verifies that a specific product actually does what its vendor says, and which of several overlapping schemes applies to a given use case (general-purpose key custody, US federal procurement, payment processing, or EU-qualified signatures).
