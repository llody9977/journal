---
title: Recommended Cryptographic Algorithms & Standards
description: A selected comparison of NIST SP 800-57, NSA CNSA 2.0, NIST PQC Standards (finalized FIPS 203/204/205 and draft FIPS 206), BSI, and Chinese ShangMi (SM2/3/4) guidance — not a comprehensive survey of every jurisdiction's cryptographic compliance regime.
permalink: /topics/recommended-algorithms/
last_verified: 2026-08-11
---

<span class="eyebrow">Cryptography / Standards</span>

# Recommended Cryptographic Algorithms & Standards

<p class="lede">Selecting cryptographic algorithms requires balancing mathematical security strength, computational overhead, and international regulatory compliance. Security architects must enforce standardized, peer-reviewed primitives that satisfy the applicable governing body's own criteria — NIST FIPS/SP validation, Germany's BSI TR-02102 recommendations, or NSA CNSA 2.0 requirements — since these bodies do not always converge on the same algorithm, key size, or curve choice, while deprecating legacy ciphers vulnerable to cryptanalytic or quantum attacks.</p>

## Quantum Impact on Cryptographic Strength

Quantum computing impacts symmetric and asymmetric primitives in fundamentally different ways:

<div class="diagram-frame">
  <img src="{{ '/assets/img/quantum-algorithm-impact.svg' | relative_url }}" alt="Comparison of Grover's algorithm halving symmetric key security vs Shor's algorithm breaking RSA and ECC.">
  <p class="diagram-caption">Grover's algorithm halves symmetric security (mitigated by doubling key sizes); Shor's algorithm reduces RSA/ECC to a polynomial-time problem, once a sufficiently capable quantum computer exists</p>
</div>

1. **Grover's Algorithm & Quantum Collision Bounds**: Provides a quadratic speedup for unstructured brute-force search ($O(2^n) \to O(2^{n/2})$). For symmetric ciphers, 256-bit keys drop to 128-bit quantum security strength. For unkeyed cryptographic hash functions, Grover's algorithm provides a quadratic speedup against preimage search ($O(2^n) \to O(2^{n/2})$), while generic quantum collision algorithms (such as the BHT algorithm, [Brassard et al., 1997](https://arxiv.org/abs/quant-ph/9705002)) can theoretically reduce collision search to $O(2^{n/3})$ under ideal quantum memory assumptions. Deploying SHA-384 and SHA-512 maintains large security margins against both preimage and collision attacks.
2. **[Shor's Algorithm](https://doi.org/10.1137/S0097539795293172) (Asymmetric Public Key Cryptography)**: Solves prime factorization and discrete logarithms in polynomial time — a superpolynomial asymptotic improvement over the best-known classical attacks. Concrete resource costs depend on the quantum circuit and arithmetic model, so one fixed exponent would give false precision. A sufficiently capable, fault-tolerant quantum computer running it would render RSA, ECC, ECDSA, and Diffie-Hellman tractable to break, but no such computer exists today; [NIST's PQC evaluation criteria](https://csrc.nist.gov/Projects/Post-Quantum-Cryptography/Post-Quantum-Cryptography-Standardization/Evaluation-Criteria/Security-%28Evaluation-Criteria%29) likewise caution that concrete quantum security estimates are more nuanced than headline asymptotic figures. Mitigate the future risk by transitioning to NIST Post-Quantum Cryptography (PQC) standards ahead of that threshold.

## Cryptographic Standards Matrix: RFC / Industry Specifications vs. NIST/FIPS Compliance

A critical discipline in security architecture is distinguishing between **RFC-Defined, Widely-Deployed Specifications** (industry-wide web encryption — not all of which are IETF Standards Track; some, like X25519 and AES-GCM-SIV, are IRTF/CFRG Informational RFCs), **FIPS/NIST Approved Primitives** (U.S. Federal & FedRAMP compliance), and **Post-Quantum Standards**:

| Primitive / Algorithm | IETF / Industry Specification | NIST / FIPS Compliance Status | Target Engineering Guidance & Use Case |
|---|---|---|---|
| **AES-256-GCM** | [RFC 5288](https://www.rfc-editor.org/rfc/rfc5288) (TLS 1.2 GCM cipher suites) / [RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html) (TLS 1.3 AEAD negotiation) | **NIST APPROVED** ([NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final) defines the underlying GCM construction) | Widely deployed NIST-approved AEAD standard for TLS 1.3, IPsec, and cloud data at rest. |
| **AES-GCM-SIV** | [RFC 8452](https://www.rfc-editor.org/rfc/rfc8452) | **NOT FIPS/NIST APPROVED** (IRTF/CFRG Informational RFC, not IETF Standards Track) | Nonce-misuse-resistant AEAD mode that avoids GCM's catastrophic full-plaintext-recovery failure on nonce reuse; repeated encryption of the identical (key, plaintext, AAD) tuple still reveals ciphertext equality to an observer. |
| **ECDHE-X25519** | [RFC 7748](https://www.rfc-editor.org/rfc/rfc7748) / [RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html) | **NOT SP 800-56A APPROVED** (RFC 7748 is IRTF/CFRG Informational; incorporated into IETF Standards-Track RFC 9846, which obsoletes the original RFC 8446) | Modern, high-speed Ephemeral ECDH key agreement used across TLS 1.3 and SSHv2. |
| **ECDHE (NIST P-384 / P-256)** | [RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html) | **NIST APPROVED** ([NIST SP 800-56A R3](https://csrc.nist.gov/pubs/sp/800/56/a/r3/final)) | NIST-approved options for FIPS 140-3 and FedRAMP boundaries, subject to the applicable profile (SP 800-52 Rev. 2 accepts either P-256 or P-384; CNSA 2.0 requires P-384). |
| **Ed25519 / Ed448** | [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032) | **NIST APPROVED** ([FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final)) | Modern fast digital signature scheme for SSH, WebAuthn, and software signing. |
| **RSA-PSS (3072-bit+)** | [RFC 8017](https://www.rfc-editor.org/rfc/rfc8017) | **NIST APPROVED** ([FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final)) | Preferred RSA signature padding for new designs; continued PKCS#1 v1.5 use is protocol- and profile-dependent rather than universally prohibited. |
| **SHA-256 / SHA-512 / SHA3-256** | [RFC 6234](https://www.rfc-editor.org/rfc/rfc6234) (SHA-256/SHA-512 only — RFC 6234 predates SHA-3) / [FIPS 202](https://csrc.nist.gov/pubs/fips/202/final) (SHA3-256) | **NIST APPROVED** ([FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/final) / [FIPS 202](https://csrc.nist.gov/pubs/fips/202/final)) | Standard cryptographic hash digest algorithms for digital signatures and TLS. |
| **HKDF-SHA256** | [RFC 5869](https://www.rfc-editor.org/rfc/rfc5869) | **NIST APPROVED** ([NIST SP 800-56C R2](https://csrc.nist.gov/pubs/sp/800/56/c/r2/final)) | Standard Extract-and-Expand key derivation function for key extraction and expansion. |
| **KMAC256 / KMAC128** | [SP 800-185](https://csrc.nist.gov/pubs/sp/800/185/final) | **NIST APPROVED** ([SP 800-185](https://csrc.nist.gov/pubs/sp/800/185/final)) | KMAC itself is a keyed hash function / MAC-and-PRF built on cSHAKE — use it directly for message authentication. [SP 800-108 Rev. 1](https://csrc.nist.gov/pubs/sp/800/108/r1/final) separately defines KDF-in-Counter-Mode and similar constructions that can use KMAC as their underlying PRF; that KDF role is a distinct, composed use, not what KMAC does on its own. |

## Disallowed & Legacy Cryptographic Algorithms

| Algorithm | Legacy Specification | Status &amp; Vulnerability | Migration Action |
|---|---|---|---|
| **3DES / TDEA** | 64-bit Block Cipher | **DISALLOWED**: Disallowed by [NIST SP 800-131A Rev. 2](https://csrc.nist.gov/pubs/sp/800/131/a/r2/final) for encryption after Dec 31, 2023; vulnerable to Sweet32 birthday collisions after 2^32 blocks. | Migrate immediately to **AES-256-GCM**. |
| **MD5** | 128-bit Hash Function | **DISALLOWED**: Disallowed by NIST SP 800-131A Rev. 2 for digital signatures &amp; certificates; practical chosen-prefix collisions have been demonstrated. | Replace with **SHA-256** or **SHA3-256**. |
| **RC4** | Stream Cipher | **DISALLOWED**: Prohibited by IETF RFC 7465 and NIST SP 800-52 Rev. 2 for TLS; biased keystream bytes allow plaintext recovery. | Replace with **AES-256-GCM** or **ChaCha20-Poly1305**. |
| **RSA-1024** | Public Key Cipher | **DISALLOWED FOR GENERATION**: Disallowed by [NIST SP 800-131A Rev. 2](https://csrc.nist.gov/pubs/sp/800/131/a/r2/final) for key transport and generating new digital signatures after Dec 31, 2013 (&lt; 112 bits security strength). 1024–2047-bit RSA remains permitted for legacy signature *verification* — this is not a blanket ban on accepting existing RSA-1024 signatures. | Replace with **Ed25519** or **3072-bit RSA-PSS** for anything generating new keys or signatures. |
| **SHA-1** | 160-bit Hash Function | **DISALLOWED FOR NEW SIGNATURE GENERATION**: Disallowed by NIST SP 800-131A Rev. 2 for generating new digital signatures &amp; certificates after Dec 31, 2013, and for other collision-dependent uses; practical collision demonstrated (SHAttered, 2017). Limited legacy signature verification and non-collision-dependent uses (e.g., HMAC-SHA1) remain permitted — this is not a blanket ban on SHA-1 in every context. | Replace with **SHA-256** for anything generating new signatures or requiring collision resistance. |

## NIST Post-Quantum Cryptography (PQC) Standards (FIPS 203, 204, 205 & Draft 206)

NIST finalized three quantum-resistant FIPS standards in August 2024 — [FIPS 203](https://csrc.nist.gov/pubs/fips/203/final), [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final), and [FIPS 205](https://csrc.nist.gov/pubs/fips/205/final) — with a fourth draft standard (FIPS 206, tracked on [NIST's PQC project page](https://csrc.nist.gov/projects/post-quantum-cryptography)) under development:

| Standard Number | Algorithm Name | Mathematical Paradigm | Target Cryptographic Function | NIST Status |
|---|---|---|---|---|
| **FIPS 203** | **ML-KEM** (Kyber) | Module Lattice (ML-WE) | Key Encapsulation (KEM) | **FINALIZED (Aug 2024)** |
| **FIPS 204** | **ML-DSA** (Dilithium) | Module Lattice (ML-SIS) | General Digital Signatures | **FINALIZED (Aug 2024)** |
| **FIPS 205** | **SLH-DSA** (SPHINCS+) | Stateless Hash Trees | Backup Fallback Signatures | **FINALIZED (Aug 2024)** |
| **Draft FIPS 206** | **FN-DSA** (Falcon) | Fast-Fourier Lattice | Compact Digital Signatures | **UNDER DEVELOPMENT (Draft)** |

## Regional Standards: Chinese ShangMi (SM) Algorithm Suite

Under China's Cryptography Law (2020) and technical standards such as **[GB/T 39786-2021](https://std.samr.gov.cn/gb/search/gbDetailed?id=BD89DE8E07393D08E05397BE0A0A4FAD)** (*Baseline for Cryptographic Application in Information Systems*), commercial cryptography evaluation is overseen by the State Cryptography Administration (SCA) and sector regulators. Requirements to adopt the ShangMi algorithm suite depend on the specific system classification level, certification regime, and applicable sector rules (such as for Critical Information Infrastructure, government systems, or financial infrastructure). General commercial software operating outside designated regulatory scopes is not mandated to replace AES, RSA, or ECC.

| SM Algorithm | Cryptographic Primitive | Comparable Role (Western) | Regulatory Context &amp; Scope |
|---|---|---|---|
| **SM2** | Elliptic Curve Public Key | Fills the role ECDSA/ECDH/ECIES fill in Western stacks — an ECC-based signature and key-exchange scheme; it is a distinct algorithm design (not interchangeable at the wire-format or math level) and not simply equivalent to Ed25519. | Elliptic-curve public-key algorithm (GB/T 32918); adoption depends on system security classification, regulatory regime, and sector-specific commercial cryptography rules. |
| **SM3** | Cryptographic Hash | Fills the role SHA-256 fills — comparable digest size and general-purpose use, distinct internal design. | 256-bit cryptographic hash function (GB/T 32905); used for integrity verification and digital signatures within applicable regulatory scopes. |
| **SM4** | 128-bit Block Cipher | Fills the role the **AES block cipher** fills (128-bit block, 128-bit key) — SM4 is a block cipher, not itself an AEAD mode; it is commonly deployed with GCM (analogous to AES-128-GCM), but "SM4" and "AES-128-GCM" are not the same category of thing. | 128-bit block cipher (GB/T 32907); used for bulk payload and transmission encryption within applicable regulatory scopes. |
| **SM9** | Identity-Based Encryption | IBE / Identity PKI | Identity-based public-key algorithm (GM/T 0044) using identifier strings as public keys in supported PKI architectures. |

## Algorithm-Selection Workflow

The tables above are a reference, not a decision procedure — picking an algorithm for a specific system means working through several independent constraints, roughly in this order, since an earlier answer can eliminate options a later one would otherwise allow:

1. **Jurisdiction and regulatory regime**: Which compliance framework actually governs this system? U.S. federal or FedRAMP work is bound by NIST FIPS/SP validation; work touching National Security Systems adds NSA CNSA 2.0's stricter timeline and curve requirements (P-384 over P-256, for instance); Chinese Critical Information Infrastructure or government/financial systems may mandate the ShangMi suite depending on classification level; EU or other regional regimes may reference BSI TR-02102 or their own national guidance. A system spanning jurisdictions may need to satisfy more than one regime simultaneously, which can rule out an otherwise-fine algorithm outright.
2. **Protocol and interoperability constraints**: The algorithm has to be one the *protocol* actually negotiates — TLS 1.3's cipher suite list, SSH's `KexAlgorithms`, or a target library's supported set — not just one that's individually secure. An excellent algorithm nobody on the other end of the connection implements is not a usable choice.
3. **Required security strength**: Match key/output size to the actual sensitivity and exposure window of what's being protected (see NIST SP 800-57's security-strength categories) — this is also where post-quantum posture enters: does this data need to resist harvest-now-decrypt-later, and if so, over what timeline (see the Post-Quantum Cryptography page)?
4. **FIPS-module (validation) requirements**: A cryptographically sound, standards-track algorithm can still fail a compliance requirement if the specific software module implementing it hasn't completed FIPS 140-3 validation — algorithm approval and module validation are tracked separately (see the FIPS 140-3 IG reference below), and a procurement or audit requirement often means the *validated module*, not just the algorithm choice.
5. **Data-protection lifetime**: How long does this data need to stay confidential or tamper-evident after it's created? A short-lived session key has different quantum-readiness and rotation requirements than an archival signature that must remain verifiable for decades — the longer the required protection window, the more conservative the margin (larger keys, PQC readiness, avoiding algorithms already showing cryptanalytic erosion) needs to be.

Treat this as a checklist to work through per system, not a one-time global choice — a payment-processing service, an internal build-signing pipeline, and a public website's TLS termination can legitimately land on different answers even within the same organization.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Algorithm Selection &amp; Compliance Takeaways</strong>
    <ul>
      <li><strong>RFC-Defined vs. FIPS Approved</strong>: Algorithms can be cryptographically sound and RFC-defined and widely deployed (X25519, AES-GCM-SIV — both defined by IRTF/CFRG Informational RFCs, not IETF Standards Track) while <em>not</em> being FIPS 140-3 / NIST SP 800-56A approved. Always check regulatory context: FedRAMP's requirement for a FIPS 140-validated cryptographic module traces to the <strong>SC-13</strong> control in the NIST SP 800-53 baselines FedRAMP inherits, not to SP 800-52 itself. Once FIPS-mode is required, <a href="https://csrc.nist.gov/pubs/sp/800/52/r2/final">NIST SP 800-52 Rev. 2</a> separately governs which TLS configuration is acceptable and accepts <strong>either P-256 or P-384</strong> — P-384 is only mandatory for National Security Systems under NSA CNSA 2.0, not as a blanket FedRAMP-wide rule.</li>
      <li><strong>NIST Approval &amp; BSI Recommendation Are Not Interchangeable</strong>: A "NIST APPROVED" status in the matrix above is a U.S. federal (FIPS/SP 800-series) designation only. Germany's BSI sets independent criteria in TR-02102-1 and has historically favored Brainpool curves (brainpoolP256r1/P384r1) over the NIST P-curves for German government and critical-infrastructure use. Don't treat NIST approval as proof of BSI endorsement, or vice versa — verify each body's guidance separately for the relevant jurisdiction.</li>
      <li><strong>PQC Finalization</strong>: FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA) were <strong>finalized in August 2024</strong>. Draft FIPS 206 (FN-DSA) remains under development.</li>
      <li><strong>Symmetric vs Asymmetric Quantum Impact</strong>: AES-256 and SHA-384/512 maintain robust quantum-resistant margins today (Grover's algorithm halves symmetric key strength and provides a quadratic speedup for preimages, while BHT quantum collision bounds are O(2^(n/3))). RSA/ECC must be replaced with PQC (Shor's algorithm breaks them).</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-57 Part 1 Rev. 5**: *Recommendation for Key Management: General* — [NIST CSRC SP 800-57](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)
- **NIST FIPS 140-3 IG**: *Implementation Guidance for FIPS 140-3* — [NIST CMVP FIPS 140-3 IG Announcements](https://csrc.nist.gov/projects/cryptographic-module-validation-program/fips-140-3-ig-announcements)
- **NIST SP 800-56A Rev. 3**: *Recommendation for Pair-Wise Key-Establishment Schemes Using Discrete Logarithm Cryptography* — [NIST CSRC SP 800-56A R3](https://csrc.nist.gov/pubs/sp/800/56/a/r3/final)
- **NIST SP 800-108 Rev. 1**: *Recommendation for Key Derivation Using Pseudorandom Functions* — [NIST CSRC SP 800-108 R1](https://csrc.nist.gov/pubs/sp/800/108/r1/final)
- **BSI TR-02102-1**: *Cryptographic Mechanisms: Recommendations and Key Lengths* — [BSI Technical Guideline TR-02102-1 (PDF)](https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-1.pdf?__blob=publicationFile)
- **Chinese GB/T 39786-2021 Standard Record**: *Baseline for Cryptographic Application in Information Systems* — [SAMR GB/T 39786-2021 Record](https://std.samr.gov.cn/gb/search/gbDetailed?id=BD89DE8E07393D08E05397BE0A0A4FAD)
- **Quantum Collision Bounds (BHT Algorithm)**: *Quantum Cryptanalysis of Hash Functions (Brassard, Høyer, Tapp)* — [arXiv:quant-ph/9705002](https://arxiv.org/abs/quant-ph/9705002)
- **RFC 8452**: *AES-GCM-SIV: Nonce-Misuse-Resistant Authenticated Encryption* — [RFC 8452](https://www.rfc-editor.org/rfc/rfc8452) (IRTF/CFRG Informational)
- **RFC 7748**: *Elliptic Curves for Security (Curve25519 / Curve448)* — [RFC 7748](https://www.rfc-editor.org/rfc/rfc7748) (IRTF/CFRG Informational)
