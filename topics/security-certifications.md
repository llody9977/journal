---
title: Security Certifications
description: Technical reference for FIPS 140-3 cryptographic module validation, Common Criteria (ISO/IEC 15408) product evaluation, PCI PTS HSM approval, and the eIDAS EN 419 221-5 protection profile — and how to check a vendor's certificate claim.
permalink: /topics/security-certifications/
last_verified: 2026-08-15
---

<span class="eyebrow">Governance, Risk & Compliance / Assurance</span>

# Security Certifications

<p class="lede">Independent hardware and software security certifications verify vendor security claims through accredited laboratory testing. Evaluating certification claims requires distinguishing between cryptographic module validation (FIPS 140-3), general product evaluation (Common Criteria EAL levels), payment hardware mandates (PCI PTS HSM), and qualified electronic signature profiles (eIDAS EN 419 221-5).</p>

## The Security Certification Landscape

| Certification Standard | Governing Body | Evaluated Subject | Assurance Levels | Target Domain |
|---|---|---|---|---|
| **FIPS 140-3** | NIST / CCCS (CMVP) | Cryptographic module design, key storage, & physical security | Level 1 (Lowest) &rarr; Level 4 (Highest) | US/Canadian Federal procurement & global baseline |
| **Common Criteria (ISO/IEC 15408)** | National schemes under the [CCRA](https://www.commoncriteriaportal.org/ccra/index.cfm); NIAP in the US, SOG-IS members in Europe | IT product against a Security Target (ST) & Protection Profile (PP) | EAL1 (Tested) &rarr; EAL7 (Formally Verified) — but see the recognition limits below | International government, defense & national security systems |
| **[PCI PTS HSM](https://www.pcisecuritystandards.org/document_library/?category=pts)** | PCI Security Standards Council (PCI SSC) | Full hardware lifecycle & payment PIN cryptography | Pass/Fail against Payment Hardware Requirements | Payment card networks, acquirers & financial switches |
| **[EN 419 221-5](https://www.sogis.eu/uk/pp_en.html)** | CEN (technical committee CEN/TC 224), used under the [eIDAS Regulation](https://eur-lex.europa.eu/eli/reg/2014/910/oj) | Trust Service Provider (TSP) cryptographic module | Common Criteria conformance to the protection profile, typically at EAL4+ | European Union eIDAS Trust Services & Digital ID |

## FIPS 140-3: Cryptographic Module Validation

Operated jointly by NIST and the Canadian Centre for Cyber Security through the **Cryptographic Module Validation Program (CMVP)**, **[FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final)** defines four qualitative security levels across eleven separate requirement areas (module interfaces, roles and authentication, physical security, sensitive security parameter management, self-tests, and others). A certificate's headline overall level is derived as the minimum across those areas—a module can validate higher in some individual areas than its overall rating shows, so the single overall number does not mean every dimension was tested to that same depth. In broad terms, a higher overall level typically adds:

- **Level 1**: Basic security; requires approved algorithms but no physical tamper protection (*e.g., software cryptographic libraries like OpenSSL FIPS provider*).
- **Level 2**: Adds tamper-evident coatings or seals and role-based authentication.
- **Level 3**: Adds tamper response (zeroizing keys upon physical casing breach), identity-based authentication, and logical key separation (*e.g., cloud KMS HSMs, AWS CloudHSM, YubiHSM 2*).
- **Level 4**: Highest physical assurance; protects against environmental attacks (voltage fluctuation, extreme temperature manipulation, side-channel analysis).

Treat these as the typical overall-level profile, not a guarantee that every one of the eleven requirement areas on a specific certificate was validated at that same level—check the certificate and security policy for the area-by-area detail. FIPS 140 validation applies strictly to the **cryptographic module boundary** (key generation, derivation, storage, and execution), not the surrounding application logic.

**FIPS 140-2 and the transition.** CMVP stopped accepting new FIPS 140-2 submissions in September 2021, and FIPS 140-3 is the only standard against which new modules are validated. Existing FIPS 140-2 certificates were not revoked when that window closed — they remain listed until their own sunset, at which point they move to the CMVP *Historical List*. A module on the Historical List has not been shown to be broken, but it is no longer an active validation and most procurement language treats it as expired, so a vendor citing a FIPS 140-2 certificate today is making a claim with a shelf life. Check which list the certificate is on, not merely that a number exists.

## Common Criteria (ISO/IEC 15408): Product Evaluation

**Common Criteria** evaluates broad IT products (operating systems, firewalls, smart cards, HSMs) against two critical documents:

1. **Protection Profile (PP)**: Industry-standard specification of security requirements for a category of products (*e.g., Stateful Traffic Filter Firewall PP*).
2. **Security Target (ST)**: A vendor's specific document claiming compliance with a PP and detailing target security functions.

### Evaluation Assurance Levels (EAL1 - EAL7)

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/common-criteria-eal.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the common criteria eal diagram at full size">
    <img src="{{ '/assets/img/common-criteria-eal.svg' | relative_url }}" alt="Common Criteria evaluation assurance levels EAL1 through EAL7 with progressively stronger evidence and evaluation rigor.">
  </a>
  <p class="diagram-caption">A higher EAL means more evaluation rigor, not automatic protection against every threat</p>
</div>

A higher EAL rating indicates **greater evaluation depth**, not necessarily superior security features. EAL4+ (Methodically Designed, Tested, and Reviewed) represents the practical ceiling for commercial enterprise products.

### Recognition scope matters as much as the level

An EAL number says how deeply a product was evaluated. It does not say who will accept that evaluation, and the two are commonly conflated when reading a vendor claim.

- Under the **[CCRA as revised in 2014](https://www.commoncriteriaportal.org/ccra/index.cfm)**, mutual recognition between member schemes extends only to assurance components **up to EAL2**, plus the flaw-remediation family ALC_FLR, or to conformance with a **collaborative Protection Profile (cPP)**. A vendor may still evaluate to EAL5; the certificate is simply not mutually recognized above EAL2 through the CCRA.
- **SOG-IS**, the European arrangement, recognizes up to **EAL4** outside its technical domains and higher within them, but does not recognize cPP evaluations. So a European EAL4 certificate and a CCRA cPP certificate are recognized by different sets of countries.
- **NIAP**, the US scheme, no longer performs EAL-based evaluations at all. US evaluations are conducted against NIAP-approved Protection Profiles, so a current NIAP certificate carries **no EAL rating** — a vendor advertising "NIAP EAL4" is describing something that does not exist.

The practical question when reading a certificate is therefore not "how high is the EAL" but "which scheme issued it, against what PP or Security Target, and is that recognized by the authority I have to satisfy."

## PCI PTS HSM: Payment Hardware Lifecycle Certification

While FIPS 140 tests core cryptography, **PCI PTS HSM** certifies physical Hardware Security Modules handling payment card data (PIN blocks, EMV key derivation, cardholder data encryption).

PCI PTS HSM extends beyond cryptographic math to inspect the **entire manufacturing and delivery lifecycle**:
- Secure factory production and component supply chain controls.
- Tamper-evident transport and secure courier delivery procedures.
- Physical anti-tamper mesh enclosing the cryptographic core.
- Secure field maintenance, firmware signing, and decommissioning zeroization.

The **[PCI PIN Security Requirements](https://www.pcisecuritystandards.org/standards/pin-security/)** govern which devices may process PIN transactions, and they accept two routes: an HSM approved under **PCI PTS HSM**, or one validated to **FIPS 140-2 Level 3 or higher**. PCI PTS HSM is the stricter of the two because it covers manufacturing, shipment, deployment, field maintenance, and decommissioning — the lifecycle around the module — which FIPS 140 does not assess at all. Treat "PCI PTS approved" as the stronger claim rather than the only permissible one, and check the acquirer's or scheme's own contract, which may narrow the choice further than PCI PIN does.

## EN 419 221-5: The eIDAS Trust Service Provider Module Profile

The three schemes above are general. **EN 419 221-5**, *Protection Profiles for TSP Cryptographic Modules — Part 5: Cryptographic Module for Trust Services*, is narrower: it is a **Common Criteria Protection Profile**, published by **CEN** (technical committee CEN/TC 224), for the cryptographic module a trust service provider uses to create electronic signatures and seals, issue and revoke certificates, and produce time stamps under the EU **[eIDAS Regulation](https://eur-lex.europa.eu/eli/reg/2014/910/oj)**.

Two things about it are easy to get wrong.

**It is a Protection Profile, not a scheme of its own.** A module "certified to EN 419 221-5" has been evaluated under Common Criteria against that PP by a national scheme, typically at EAL4 augmented. The assurance machinery is Common Criteria's; EN 419 221-5 supplies the requirements the module is measured against. CEN publishes it; ENISA, the EU cybersecurity agency, has no role in issuing or certifying against it.

**Conformance alone does not make a Qualified Signature Creation Device.** QSCD status is a legal designation under eIDAS Annex II. For a *remote* or server-side signing service — the common deployment — the QSCD is the combination of a signature activation module conforming to **EN 419 241-2** and a cryptographic module conforming to EN 419 221-5. A vendor presenting an EN 419 221-5 certificate has shown one necessary component, not a QSCD. Confirm the actual QSCD designation against the member state's notified list rather than inferring it from the module certificate.

## Verification Checklist: Validating Vendor Claims

When auditing vendor certification claims:

1. **Verify Certificate Numbers**: Search the official **[NIST CMVP Database](https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search)** for FIPS 140 claims or the **[Common Criteria Portal](https://www.commoncriteriaportal.org/)** for EAL ratings.
2. **Distinguish "FIPS Compliant" vs "FIPS Validated"**: Reject marketing phrases like *"FIPS compliant"* or *"FIPS-approved algorithms"*. A listed NIST CMVP certificate number is a pointer to an audited module, not a guarantee by itself—it must be checked against the exact module name, version or part number, operational environment, approved mode, and any certificate caveats before it supports the claim (see the equivalent FIPS 140-3 validation framing in **[HSM & KMS]({{ '/topics/hsm-kms/' | relative_url }})**).
3. **Inspect the Physical/Software Boundary**: Confirm whether validation covers the entire physical hardware unit or merely an underlying software library module.
4. **Check Certificate Sunset Dates**: Verify that hardware modules have not moved to NIST's *Historical List* following firmware or hardware updates, or on expiry of the FIPS 140-2 transition.
5. **Check Who Recognizes It**: For Common Criteria, establish which scheme issued the certificate and whether the authority you must satisfy recognizes it — CCRA mutual recognition stops at EAL2 or cPP conformance, and NIAP certificates carry no EAL at all.
6. **Separate the Component From the Legal Status**: An EN 419 221-5 certificate is one input to a QSCD determination, not the determination itself. Confirm QSCD status on the relevant member state's notified list.

### Certificate lifecycle: a certificate is a snapshot, not a standing property

Every scheme here validates a specific configuration at a specific time, and all of them have a mechanism by which a valid certificate stops describing what you deploy:

- **Firmware and software updates** typically take the module outside its validated boundary. Both CMVP and Common Criteria have maintenance and re-evaluation paths for this, but the update is out of scope until that process completes. "We ship monthly updates and we are FIPS validated" is two claims that need reconciling.
- **Algorithm transitions** retire certificates independently of the vendor. Modules whose approved mode depends on algorithms NIST has since disallowed move to the Historical List even if the hardware never changed — the post-quantum migration will move a further tranche.
- **Scheme changes** retire whole classes of certificate, as the FIPS 140-2 to 140-3 transition and NIAP's move away from EALs both did.

So a certificate check has a validity period. Re-verify at renewal and after any vendor update rather than filing the certificate once and treating the claim as settled.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>A vendor's marketing claim ("FIPS compliant") is not a verified certificate — check the NIST CMVP database against the exact module name, version, operational environment, and approved mode before trusting it. Then check who recognizes it: an EAL number describes evaluation depth, not acceptance, and a certificate describes one configuration at one moment rather than a standing property of the product.</p>
</div>

## Primary references

- **NIST FIPS 140-3**: *Security Requirements for Cryptographic Modules* — [FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final) — verified the eleven requirement areas and the four security levels.
- **NIST CMVP**: *Validated Modules Search* — [CMVP database](https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search) — the authoritative check for any FIPS 140 claim.
- **Common Criteria Recognition Arrangement (2014)** — [CCRA](https://www.commoncriteriaportal.org/ccra/index.cfm) — verified that mutual recognition is limited to EAL2 with ALC_FLR, or to collaborative Protection Profile conformance.
- **PCI SSC**: *PIN Security Requirements* — [PCI PIN Security](https://www.pcisecuritystandards.org/standards/pin-security/) — verified that PIN-processing HSMs may be PCI PTS HSM approved or FIPS 140-2 Level 3 validated.
- **CEN EN 419 221-5** *Cryptographic Module for Trust Services*, with the SOG-IS protection profile listing — [SOG-IS protection profiles](https://www.sogis.eu/uk/pp_en.html) — verified the publisher and the EN 419 241-2 pairing required for a remote-signing QSCD.
