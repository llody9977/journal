---
title: Recommended Cryptographic Algorithms & Standards
description: Comprehensive compliance guide mapping NIST SP 800-57, NSA CNSA 2.0, NIST PQC Standards (FIPS 203/204/205/206), and Chinese ShangMi (SM2/3/4) algorithm suites.
permalink: /topics/recommended-algorithms/
last_verified: 2026-08-09
---

<span class="eyebrow">Cryptography / Standards</span>

# Recommended Cryptographic Algorithms & Standards

<p class="lede">Selecting cryptographic algorithms requires balancing mathematical security strength, computational overhead, and international regulatory compliance. Security architects must enforce standardized, peer-reviewed primitives that satisfy the applicable governing body's own criteria — NIST FIPS/SP validation, Germany's BSI TR-02102 recommendations, or NSA CNSA 2.0 requirements — since these bodies do not always converge on the same algorithm, key size, or curve choice, while deprecating legacy ciphers vulnerable to cryptanalytic or quantum attacks.</p>

## Quantum Impact on Cryptographic Strength

Quantum computing impacts symmetric and asymmetric primitives in fundamentally different ways:

<div class="diagram-frame">
  <img src="{{ '/assets/img/quantum-algorithm-impact.svg' | relative_url }}" alt="Comparison of Grover's algorithm halving symmetric key security vs Shor's algorithm breaking RSA and ECC.">
  <p class="diagram-caption">Grover's algorithm halves symmetric security (mitigated by doubling key sizes); Shor's algorithm completely breaks RSA/ECC</p>
</div>

1. **Grover's Algorithm (Symmetric Ciphers &amp; Hashes)**: Provides quadratic speedup for brute-force searches. Effective key strength is halved (**256-bit symmetric keys drop to 128-bit security**). Mitigated by deploying AES-256 and SHA-384/512.
2. **Shor's Algorithm (Asymmetric Public Key Cryptography)**: Solves prime factorization and discrete logarithms in polynomial time (**O(n^3)**). **Completely breaks RSA, ECC, ECDSA, and Diffie-Hellman**. Mitigated by transitioning to NIST Post-Quantum Cryptography (PQC) standards.

## Cryptographic Standards Matrix: IETF Standards vs. NIST/FIPS Compliance

A critical discipline in security architecture is distinguishing between **IETF Deployed Standards** (industry-wide web encryption), **FIPS/NIST Approved Primitives** (U.S. Federal & FedRAMP compliance), and **Post-Quantum Standards**:

| Primitive / Algorithm | IETF / Industry Specification | NIST / FIPS Compliance Status | Target Engineering Guidance & Use Case |
|---|---|---|---|
| **AES-256-GCM** | [RFC 5288](https://www.rfc-editor.org/rfc/rfc5288) | **NIST APPROVED** ([NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final)) | Universal AEAD standard for TLS 1.3, IPsec, and cloud data at rest. |
| **AES-GCM-SIV** | [RFC 8452](https://www.rfc-editor.org/rfc/rfc8452) | **NOT FIPS/NIST APPROVED** (IETF Standard) | Nonce-misuse-resistant AEAD mode preventing catastrophic plaintext leak on IV reuse. |
| **ECDHE-X25519** | [RFC 7748](https://www.rfc-editor.org/rfc/rfc7748) / [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446) | **NOT SP 800-56A APPROVED** (IETF Standard) | Modern, high-speed Ephemeral ECDH key agreement used across TLS 1.3 and SSHv2. |
| **ECDHE (NIST P-384 / P-256)** | [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446) | **NIST APPROVED** ([NIST SP 800-56A R3](https://csrc.nist.gov/pubs/sp/800/56/a/r3/final)) | Mandatory Ephemeral ECDH key agreement for strict FIPS 140-3 and FedRAMP boundaries. |
| **Ed25519 / Ed448** | [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032) | **NIST APPROVED** ([FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final)) | Modern fast digital signature scheme for SSH, WebAuthn, and software signing. |
| **RSA-PSS (3072-bit+)** | [RFC 8017](https://www.rfc-editor.org/rfc/rfc8017) | **NIST APPROVED** ([FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final)) | Recommended classical RSA signature padding scheme; deprecate PKCS#1 v1.5. |
| **SHA-256 / SHA-512 / SHA3-256** | [RFC 6234](https://www.rfc-editor.org/rfc/rfc6234) | **NIST APPROVED** ([FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/final) / [FIPS 202](https://csrc.nist.gov/pubs/fips/202/final)) | Standard cryptographic hash digest algorithms for digital signatures and TLS. |
| **HKDF-SHA256 / KMAC256** | [RFC 5869](https://www.rfc-editor.org/rfc/rfc5869) | **NIST APPROVED** ([SP 800-56C R2](https://csrc.nist.gov/pubs/sp/800/56/c/r2/final) / [SP 800-185](https://csrc.nist.gov/pubs/sp/800/185/final)) | Standard key derivation function for key extraction and expansion. |

## Disallowed & Legacy Cryptographic Algorithms

| Algorithm | Legacy Specification | Status &amp; Vulnerability | Migration Action |
|---|---|---|---|
| **3DES / TDEA** | 64-bit Block Cipher | **DISALLOWED**: Vulnerable to Sweet32 birthday collisions after 2^32 blocks. | Migrate immediately to **AES-256-GCM**. |
| **MD5** | 128-bit Hash Function | **CRITICALLY BROKEN**: Practical collisions demonstrated in under 1 second. | Replace with **SHA-256** or **SHA3-256**. |
| **RC4** | Stream Cipher | **DISALLOWED**: Biased keystream bytes allow TLS plaintext recovery. | Replace with **AES-256-GCM** or **ChaCha20-Poly1305**. |
| **RSA-1024** | Public Key Cipher | **DISALLOWED**: Inadequate security strength (&lt; 80 bits). | Replace with **Ed25519** or **3072-bit RSA-PSS**. |
| **SHA-1** | 160-bit Hash Function | **BROKEN**: Practical collision demonstrated (SHAttered, 2017). Prohibited by [NIST SP 800-131A](https://csrc.nist.gov/pubs/sp/800/131/a/r2/final). | Replace with **SHA-256**. |

## NIST Post-Quantum Cryptography (PQC) Standards (FIPS 203, 204, 205 & Draft 206)

NIST finalized three quantum-resistant FIPS standards in August 2024, with a fourth draft standard under development:

| Standard Number | Algorithm Name | Mathematical Paradigm | Target Cryptographic Function | NIST Status |
|---|---|---|---|---|
| **FIPS 203** | **ML-KEM** (Kyber) | Module Lattice (ML-WE) | Key Encapsulation (KEM) | **FINALIZED (Aug 2024)** |
| **FIPS 204** | **ML-DSA** (Dilithium) | Module Lattice (ML-SIS) | General Digital Signatures | **FINALIZED (Aug 2024)** |
| **FIPS 205** | **SLH-DSA** (SPHINCS+) | Stateless Hash Trees | Backup Fallback Signatures | **FINALIZED (Aug 2024)** |
| **Draft FIPS 206** | **FN-DSA** (Falcon) | Fast-Fourier Lattice | Compact Digital Signatures | **UNDER DEVELOPMENT (Draft)** |

## Regional Standards: Chinese ShangMi (SM) Algorithm Suite

Under China's Cryptography Law (2020) and the **State Cryptography Administration (SCA)**'s commercial cryptography regime (the regulator formerly known as OSCCA, the Office of State Commercial Cryptography Administration), the ShangMi suite is mandatory only in specific regulated contexts — critical information infrastructure (CII) operators, government procurement, sector rules such as the People's Bank of China's requirements for banking/payment systems, and commercial cryptography products on China's certification catalogue. It is **not** a blanket requirement for all software or every multinational corporation operating in China; general commercial products outside these regulated categories may continue using AES/RSA/ECC.

| SM Algorithm | Cryptographic Primitive | Equivalent Western Primitive | Compliance Requirement |
|---|---|---|---|
| **SM2** | Elliptic Curve Public Key | ECC P-256 / Ed25519 | Mandatory for public-key encryption and digital signatures within CII, government, and PBOC-regulated banking systems; not required for general commercial software. |
| **SM3** | Cryptographic Hash | SHA-256 | Mandatory 256-bit hash digest for integrity checks and signatures within the same regulated sectors. |
| **SM4** | 128-bit Block Cipher | AES-128-GCM | Mandatory 128-bit block cipher for data at rest and network transit within the same regulated sectors; general deployments are not required to replace AES. |
| **SM9** | Identity-Based Encryption | IBE / Identity PKI | Identity-based public-key algorithm using user ID as public key. |

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Algorithm Selection &amp; Compliance Takeaways</strong>
    <ul>
      <li><strong>IETF Standard vs. FIPS Approved</strong>: Algorithms can be cryptographically sound and IETF-standardized (X25519, AES-GCM-SIV) while <em>not</em> being FIPS 140-3 / NIST SP 800-56A approved. Always check regulatory context: FedRAMP requires a FIPS 140-validated module per <a href="https://csrc.nist.gov/pubs/sp/800/52/r2/final">NIST SP 800-52 Rev. 2</a>, which accepts <strong>either P-256 or P-384</strong> for TLS — P-384 is only mandatory for National Security Systems under NSA CNSA 2.0, not as a blanket FedRAMP-wide rule.</li>
      <li><strong>NIST Approval &amp; BSI Recommendation Are Not Interchangeable</strong>: A "NIST APPROVED" status in the matrix above is a U.S. federal (FIPS/SP 800-series) designation only. Germany's BSI sets independent criteria in TR-02102-1 and has historically favored Brainpool curves (brainpoolP256r1/P384r1) over the NIST P-curves for German government and critical-infrastructure use. Don't treat NIST approval as proof of BSI endorsement, or vice versa — verify each body's guidance separately for the relevant jurisdiction.</li>
      <li><strong>PQC Finalization</strong>: FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA) were <strong>finalized in August 2024</strong>. Draft FIPS 206 (FN-DSA) remains under development.</li>
      <li><strong>Symmetric vs Asymmetric Quantum Impact</strong>: AES-256 and SHA-384/512 are quantum-safe today (Grover's algorithm only halves key bits). RSA/ECC must be replaced with PQC (Shor's algorithm breaks them).</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-57 Part 1 Rev. 5**: *Recommendation for Key Management: General* — [NIST CSRC SP 800-57](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)
- **NIST FIPS 140-3 IG**: *Implementation Guidance for FIPS 140-3* — [NIST CSRC FIPS 140-3 IG](https://csrc.nist.gov/projects/cryptographic-module-validation-program/fips-140-3-ig)
- **NIST SP 800-56A Rev. 3**: *Recommendation for Pair-Wise Key-Establishment Schemes Using Discrete Logarithm Cryptography* — [NIST CSRC SP 800-56A R3](https://csrc.nist.gov/pubs/sp/800/56/a/r3/final)
- **RFC 8452**: *AES-GCM-SIV: Nonce-Misuse-Resistant Authenticated Encryption* — [IETF RFC 8452](https://www.rfc-editor.org/rfc/rfc8452)
- **RFC 7748**: *Elliptic Curves for Security (Curve25519 / Curve448)* — [IETF RFC 7748](https://www.rfc-editor.org/rfc/rfc7748)
