---
title: Security Objectives & Properties
description: Architectural framework for security objectives, FIPS 199 impact categorization, extended properties, safeguard mechanics, and the objective-to-verified-control traceability chain.
permalink: /topics/security-objectives-properties/
last_verified: 2026-08-09
---

<span class="eyebrow">Security Foundations / Concepts</span>

# Security Objectives & Properties

<p class="lede">A security objective defines a target property—such as confidentiality, integrity, or availability—that a system is engineered to preserve. Some objectives (confidentiality, integrity) are best understood as invariants a system tries to hold continuously; others (resilience, recovery) are explicitly about how the system behaves and recovers *after* that invariant is broken, whether the cause is a hostile attacker, an accident, a structural failure, or an environmental event. Technical controls and architectural safeguards are deployed specifically to enforce these objectives. Defining required security properties upfront prevents misapplying cryptographic algorithms, authentication schemes, or backups to solve the wrong failure mode.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/security-objectives-properties-matrix.svg' | relative_url }}" alt="Security Objectives & System Properties Matrix diagram showing the CIA Triad (FIPS 199), Extended Security Properties (Authenticity, Accountability, Privacy, Safety, Resilience), and Technical Safeguard Alignment. The diagram does not depict FIPS 199 Low/Moderate/High impact severity, which is covered separately in the impact categorization table below.">
  <p class="diagram-caption">Security Objectives &amp; System Properties Matrix: CIA Triad (FIPS 199) → Extended System Properties → Technical Safeguard Alignment (NIST SP 800-53 Rev. 5). Impact-severity categorization (Low/Moderate/High) is covered in the table below, not in this diagram.</p>
</div>

## System Criticality & FIPS 199 / FIPS 200 Impact Categorization

Rather than treating security objectives as arbitrary choices, system architectures evaluate **system criticality** based on potential magnitude of harm. **[NIST FIPS 199](https://csrc.nist.gov/pubs/fips/199/final)** and **[NIST SP 800-60 Rev. 1](https://csrc.nist.gov/pubs/sp/800/60/r1/final)** are U.S. federal standards—mandatory for federal information systems, not a universal classification scheme—but the Low/Moderate/High impact model they define is a useful, widely borrowed structure for reasoning about system criticality in any organization. Under that model, system categorization follows a 4-step progression:

1. **Inventory Information Types & System Functions**: Identify all data types (*e.g., PII, medical records, financial transactions, system credentials*) processed or stored by the system.
2. **Assess Potential Impact Severity**: Evaluate potential harm magnitude across Confidentiality (**SC Confidentiality**), Integrity (**SC Integrity**), and Availability (**SC Availability**) if compromised.
3. **Apply the High-Water Mark Principle**: Establish the overall system security category (**System Security Category**) by taking the maximum potential impact level across all three CIA objectives:
   - **System Security Category = Maximum (Confidentiality Impact, Integrity Impact, Availability Impact)**
4. **Select Minimum Security Controls**: **[NIST FIPS 200](https://csrc.nist.gov/pubs/fips/200/final)** requires selecting the minimum security control baseline matching the category; **[NIST SP 800-53B](https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final)** is the publication that enumerates the actual Low/Moderate/High control baselines drawn from the **SP 800-53 Rev. 5** catalog.

### FIPS 199 Impact Severity & Magnitude Matrix

| FIPS 199 Impact Level | Harm Potential & Magnitude of Impact | Illustrative System Scenario (not automatic—depends on actual harms & context) | Mandatory Control Baseline (Federal Model) |
|---|---|---|---|
| **Low Impact** | **Limited adverse effect**: Minor degradation in operational capability, minor asset damage, or minor financial loss. | A public marketing website *could* land here, but only after evaluating what a compromise would actually harm—a defaced site tied to brand trust or containing hidden lead-gen forms may not be Low. | **NIST SP 800-53B Low baseline** (FIPS 200 selects the baseline; SP 800-53B enumerates its controls). CIS Controls IG1 is a separate, non-federal hygiene baseline that is loosely comparable in scope, not a FIPS Low equivalent. |
| **Moderate Impact** | **Serious adverse effect**: Significant degradation in operational capability, significant asset damage, or non-fatal injuries. | A B2B SaaS database workload is *often* rated here, but the actual category depends on what the data is and who is harmed if it's breached—not the "B2B SaaS" label itself. | **NIST SP 800-53B Moderate baseline** (referenced by FedRAMP Moderate, which layers its own additional parameters and requirements on top; FedRAMP is [transitioning from Low/Moderate/High impact-level terminology toward certification Classes A–D](https://www.fedramp.gov/marketplace/products/)). SOC 2 is an independent attestation framework with its own control criteria—not a NIST Moderate baseline. |
| **High Impact** | **Severe or catastrophic adverse effect**: Complete loss of critical operational capability, major financial destruction, severe injury, or loss of life. | Power grid SCADA control or autonomous vehicle control plausibly reach High on safety grounds; healthcare ePHI or a core banking ledger are not automatically High—the category still depends on the specific harm (e.g., scale, reversibility) the organization assesses. | **NIST SP 800-53B High baseline** (referenced by FedRAMP High, which layers its own additional parameters and requirements on top; FedRAMP is transitioning from Low/Moderate/High impact-level terminology toward certification Classes A–D). ISO 26262 is an unrelated automotive functional-safety standard, not a generic FIPS High equivalent—it is cited here only because autonomous vehicle control also falls in the High category by consequence, not because the standards align. |

The High-Water Mark principle illustrates how FIPS 199 combines per-objective ratings: if a system processes data with Low Confidentiality needs but **High Integrity** requirements (*e.g., flight control software or financial ledgers*), the overall system category is governed by the highest individual rating, not an average—so it would be treated as a **High-Impact System** requiring the high-assurance FIPS 200 baseline—which spans management, operational, and technical controls, not technical safeguards alone—under the federal FIPS 199/200 scheme this section describes.

System impact categorization establishes the minimum security baseline required for technical implementation. The architecture is designed to preserve these invariants under the assessed threat model—no control set eliminates residual risk entirely:
- **Confidentiality Invariant**: Restricts disclosure to authenticated, authorized identities across the evaluated impact baseline.
- **Integrity Invariant**: Detects and rejects impermissible modification, deletion, or corruption of the accepted state.
- **Availability Invariant**: Preserves reliable operational access for authorized callers under the adverse conditions the baseline was designed for.

## Extended System Security Properties

Comprehensive security engineering across all systems—whether cloud-native microservices or legacy enterprise infrastructure—may require enforcing operational security properties beyond the core CIA invariants, depending on what the system actually does: a system with no personal data has no meaningful Privacy property to enforce, and one with no life-safety implications has no Safety property to enforce.

| Extended Property | Target System Invariant | Governing Specification | Primary Engineering Application |
|---|---|---|---|
| **[Accountability](https://csrc.nist.gov/glossary/term/accountability)** | Producing evidence that supports tracing system actions to an authenticated identity—strength of attribution depends on log integrity and identity binding, not the logging mechanism alone. | **[NIST SP 800-92](https://csrc.nist.gov/pubs/sp/800/92/final)** | SIEM audit trails, made tamper-evident via added cryptographic chaining or WORM storage, & attributable identity context. |
| **[Authenticity](https://csrc.nist.gov/glossary/term/authenticity)** | Verifying identity, message, or payload origin is genuine. | **[NIST SP 800-63-4](https://pages.nist.gov/800-63-4/)** / **FIDO2** | Mutual TLS (mTLS) microservice identity & WebAuthn passkey authentication. |
| **[Non-Repudiation](https://csrc.nist.gov/glossary/term/non_repudiation)** | Cryptographic evidence that supports attributing an action to an entity, making it harder for that entity to credibly deny it. | **[RFC 8032 (Ed25519)](https://datatracker.ietf.org/doc/html/rfc8032)** | Asymmetric digital signatures on transaction ledgers & code commits. |
| **Privacy** | Processing personal data in compliance with individual rights & limits. | **[NIST Privacy Framework](https://www.nist.gov/privacy-framework)** / **[ISO/IEC 27701](https://www.iso.org/standard/85819.html)** | Data minimization, pseudonymization, consent management & GDPR/PDPA compliance. |
| **Resilience** | Withstanding active attack, adapting, and recovering core state. | **NIST SP 800-160 Vol. 2** | Automated failover, graceful degradation, and chaos engineering drills. |
| **Safety** | Ensuring failure modes cannot cause physical harm or loss of life. | **[ISO 26262](https://www.iso.org/standard/68383.html)** / **IEC 61508** | Fail-safe fault isolation, interlocks, and hazard containment circuits. |

## Crucial Security Boundaries & Cryptographic Distinctions

Failing to distinguish between related security properties leads to fundamental architectural vulnerabilities. The matrix below contrasts key security boundary pairs, common misconceptions, and their correct engineering realizations:

| Security Boundary / Property Pair | Key Distinctions & Architectural Trade-Offs | Common Architectural Misconception | Correct Engineering Realization |
|---|---|---|---|
| **Authentication vs Authorization** | • **Authentication**: Verifying *who* an entity is.<br>• **Authorization**: Deciding *what actions* an identity may execute. | Treating identity proofing as permission grant.<br>*(Valid login ≠ access to admin routes).* | Authenticate via **WebAuthn / OIDC**; authorize per-request via **Zero Trust Policy Enforcement (RBAC / ABAC)**. |
| **Availability vs Reliability** | • **Reliability**: The system operates without failure over a given period, under its stated design conditions—those stated conditions are a design/testing choice and do not inherently exclude hostile inputs, though they commonly assume normal operating load unless adversarial conditions were explicitly designed and tested for.<br>• **Availability**: The system is accessible and usable by authorized users when needed—hostile activity (e.g., DDoS) is one cause of unavailability, not its defining characteristic; hardware failure or a bad deploy can equally cause an outage. | Assuming 99.999% uptime under normal load guarantees resilience against attack traffic.<br>*(A highly reliable system can still be knocked offline by a DDoS it was never tested against).* | Build auto-scaling clusters and rigorous change management for Reliability; layer WAF rate limiting and BGP scrubbing specifically for Availability under hostile conditions. mTLS's principal properties are endpoint authentication and confidentiality/integrity of the channel—it is not itself an availability control, and the extra handshake and certificate-validation work it adds is an availability *dependency* to account for, not a mitigation. |
| **Confidentiality vs Privacy** | • **Confidentiality**: Preventing unauthorized observation.<br>• **Privacy**: Respecting individual rights, minimization, and legal consent. | Assuming encrypting PII satisfies privacy laws.<br>*(Encrypting unauthorized PII still breaches GDPR/PDPA).* | Encrypt database columns for Confidentiality; enforce data minimization, retention caps, and consent management for Privacy. |
| **Integrity vs Authenticity vs Non-Repudiation** | • **Integrity**: Data unchanged in transit or storage.<br>• **Authenticity**: Verified origin—achievable under a shared key (e.g., HMAC) or an asymmetric key pair (e.g., digital signature); not limited to shared-key schemes.<br>• **Non-Repudiation**: Cryptographic evidence that constrains an entity's ability to deny an action, strongest under an asymmetric private key an entity alone controls. | Assuming HMAC-SHA256 provides Non-Repudiation.<br>*(Either party holding the shared key can forge a valid tag, so a third party cannot distinguish who produced it).* | Use **HMAC-SHA256** for symmetric service-to-service authenticity where both parties are mutually trusted; use **Ed25519** digital signatures where non-repudiation towards a third party is required, such as audit logs. |
| **Unauthenticated vs Authenticated Encryption (AEAD)** | • **Unauthenticated (AES-CBC)**: Encrypts payload without integrity checks.<br>• **AEAD (AES-GCM)**: Encrypts and appends an authentication tag simultaneously. | Assuming AES-CBC provides Integrity.<br>*(Attackers can flip bits; a padding-oracle attack additionally requires an implementation that leaks padding-validity information back to the attacker).* | For new application-level authenticated encryption, prefer an appropriately selected **AEAD mode (AES-256-GCM / ChaCha20-Poly1305)** to enforce Confidentiality, Integrity, and data-origin authentication under the shared key in one pass—recognizing that not every valid cryptographic use case (e.g., deterministic encryption for lookups, or protocols with their own framing/MAC layer) maps cleanly onto general-purpose AEAD. |

## Security Mechanisms vs Supported Properties

Security mechanisms enforce specific properties. No single mechanism satisfies all objectives in isolation:

| Security Mechanism | Primary Enforced Properties | Secondary Supported Properties | Structural Limitations & Unsupported Objectives |
|---|---|---|---|
| **Access Control Lists** *(RBAC / ABAC)* | **Authorization Enforcement** | Resource Isolation | Assumes presented identity token was authentic and untampered. |
| **Authenticated Encryption** *(AES-256-GCM)* | **Confidentiality, Integrity, Authenticity (under possession of the shared symmetric key)** | Data Origin Verification among key holders | Does not enforce Authorization permissions or Service Availability; does not identify *which* symmetric-key holder produced the ciphertext, so it does not provide non-repudiation. |
| **Digital Signatures** *(Ed25519 / ECDSA)* | **Integrity, Authenticity, evidence supporting Non-Repudiation** | Payload Proof of Origin | Does not provide Confidentiality (plaintext visible) or legal intent proof; the signature is evidence toward non-repudiation, not a legal guarantee of it on its own. |
| **Audit Logging** *(NIST SP 800-92)* | **Accountability** | Forensic Attribution | Does not block initial exploit execution; provides post-incident attribution. SP 800-92 covers log management generally—tamper-evidence or immutability requires additional mechanisms (e.g., cryptographic hash chaining, WORM storage, restricted write access), not something the standard mandates by itself. |
| **Multi-Factor Authentication** *(WebAuthn / FIDO2)* | **High-Assurance Authentication** | Phishing Resistance (WebAuthn origin binding) | Does not grant Authorization privileges, perform Identity Proofing (a separate enrollment-time process, see IAL), or prevent post-login session hijacking. |
| **Redundant Load Balancers & Auto-Scaling** | **Availability, System Resilience** | Failover Recovery | Does not prevent data exfiltration, injection attacks, or unauthorized reads. |

## From Objective to Verified Control: The Traceability Chain

A security objective by itself is not actionable—"Confidentiality" does not tell an engineer what to build or an auditor what to check. Closing that gap requires an explicit chain connecting the abstract objective to a verified engineering outcome. The five links below are a journal working model, not a named standard's formal process, though each link maps to concepts covered elsewhere in this journal:

| Chain Link | What It Establishes | Concrete Example | Where It's Covered |
|---|---|---|---|
| **1. Security Objective** | The property being protected—CIA triad or an extended property from this page. | Confidentiality of customer payment data. | This page. |
| **2. Testable Security Requirement** | A specific, falsifiable statement scoped to this system—not the objective restated in different words. | "PII fields in the `customers` table must be encrypted at rest with AES-256-GCM; plaintext must never appear in application logs." | Derived per-system; not a separate journal page. |
| **3. Selected Control** | The concrete technical, administrative, or physical safeguard chosen to satisfy the requirement. | Column-level AES-256-GCM encryption with KMS-managed keys; log redaction middleware. | **[Security Controls & Defense in Depth]({{ '/topics/security-controls-defense-in-depth/' | relative_url }})**. |
| **4. Verification Evidence** | The artifact that demonstrates the control is actually implemented and operating, not merely designed. | Passing unit test asserting ciphertext-only storage; SAST rule confirming no plaintext PII in log statements; periodic access-log review. | Control-specific test/audit tooling; see the validation pipeline in **[Security Controls & Defense in Depth]({{ '/topics/security-controls-defense-in-depth/' | relative_url }})**. |
| **5. Residual-Risk Decision** | What remains unaddressed after the verified control, and who is accountable for accepting, further mitigating, avoiding, or transferring it. | Key-management compromise is not addressed by column encryption alone; the risk owner accepts this with a documented KMS access-audit compensating control. | **[Threats, Vulnerabilities & Risk]({{ '/topics/risk-fundamentals/' | relative_url }})**. |

Skipping link 4 is the most common failure: a control that was designed and deployed but never verified provides insufficient assurance that it operates as intended—the control may well be working, but nothing confirms it behaves as intended under real conditions, so it cannot be relied on for a risk decision.

## Essential Security Property Diagnostic Checklist

When auditing a system architecture or API endpoint, evaluate these 8 diagnostic questions against target verification evidence:

| Diagnostic Focus Area | Key Architectural Evaluation Question | Target Verification & Audit Evidence |
|---|---|---|
| **Accountability** | Are state-changing administrative actions logged with attributable identity context, and is that log made tamper-evident through added controls (cryptographic chaining, WORM storage)—not assumed from **NIST SP 800-92** alone? | Tamper-evident SIEM audit trails & log hash chains. |
| **Authenticity** | How is the identity of calling microservices, clients, and API callers verified cryptographically? | mTLS certificate validation & FIDO2 WebAuthn logs. |
| **Availability** | What is the system's Recovery Time Objective (RTO) for restoring service after a DDoS-driven outage, and separately, what data-loss tolerance (Recovery Point Objective, RPO) applies when an incident—DDoS or otherwise—forces a restore from backup? | Automated DDoS load testing & failover drill logs; backup/restore drill logs against the stated RPO. |
| **Confidentiality** | Which authenticated identities are explicitly authorized to observe this data field? | Column-level encryption audit & RBAC permission matrix. |
| **Integrity** | How is payload ciphertext tampering or database corruption cryptographically detected and rejected? | AEAD tag verification logs & SAST cipher suite audits. |
| **Privacy** | Is personal data processing minimized, pseudonymized, or restricted by explicit legal consent boundaries? | Data flow inventory, DPIA reports & GDPR/PDPA audits. |
| **Resilience** | How does the system degrade gracefully when downstream database or identity dependencies fail? | Chaos engineering test suite & circuit breaker metrics. |
| **Safety** | Could an unauthorized state change trigger physical, operational, or safety hazards (**ISO 26262**)? | ISO 26262 hazard analysis & fail-safe circuit checks. |

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Security Objectives Summary</strong>
    <ul>
      <li><strong>CIA Triad + Extensions</strong>: Confidentiality (restricting disclosure to authorized identities), Integrity (protection from unauthorized modification), Availability (timely, reliable access), plus Authenticity and Non-Repudiation.</li>
      <li><strong>Authenticity vs. Non-Repudiation</strong>: Authenticity verifies who sent the message; Non-repudiation provides cryptographic evidence that makes it harder for the sender to credibly deny the action to third parties.</li>
      <li><strong>Privacy as a Distinct Objective</strong>: Privacy enforces data minimization, consent, and access restrictions over personal data (PII).</li>
    </ul>
  </div>
</div>

## Primary References

- **ISO/IEC 27000:2026**: *Overview and vocabulary for Information Security Management Systems* — [ISO 27000](https://www.iso.org/standard/27000)
- **NIST FIPS 199**: *Standards for Security Categorization* — [NIST CSRC FIPS 199](https://csrc.nist.gov/pubs/fips/199/final)
- **NIST SP 800-53B**: *Control Baselines for Information Systems and Organizations* — [NIST CSRC SP 800-53B](https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final)
