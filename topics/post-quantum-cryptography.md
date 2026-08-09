---
title: Post-Quantum Cryptography (PQC) Migration
description: Architectural roadmap for migrating to NIST PQC standards (finalized FIPS 203 ML-KEM, FIPS 204 ML-DSA, FIPS 205 SLH-DSA, and draft FIPS 206 FN-DSA), NSA CNSA 2.0 timelines, and hybrid key exchange.
permalink: /topics/post-quantum-cryptography/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Emerging Topics</span>

# Post-Quantum Cryptography (PQC) Migration

<p class="lede">Post-Quantum Cryptography (PQC) prepares enterprise systems for the advent of Cryptographically Relevant Quantum Computers (CRQCs). Quantum computers running Shor's algorithm will break classical public-key cryptography (RSA, ECC, ECDSA, ECDH) in polynomial time. Security architects must execute a phased migration to finalized NIST PQC standards FIPS 203, 204 and 205, with FN-DSA/FIPS 206 under development and enforce NSA CNSA 2.0 migration deadlines.</p>

## Quantum Threat Horizon: Shor's vs Grover's Algorithm

Quantum computing impacts symmetric and asymmetric primitives in fundamentally different ways:

<div class="diagram-frame">
  <img src="{{ '/assets/img/quantum-algorithm-impact.svg' | relative_url }}" alt="Comparison of Grover's algorithm halving symmetric key security vs Shor's algorithm breaking RSA and ECC.">
  <p class="diagram-caption">Grover's algorithm halves symmetric security (mitigated by doubling key sizes); Shor's algorithm completely breaks RSA/ECC</p>
</div>

1. **Asymmetric Cryptography (RSA, ECC, ECDSA, ECDH)**: **Completely broken** by **Shor's Algorithm** running on a CRQC. Shor's algorithm solves prime factorization and discrete logarithms in polynomial time (**O(n^3)**).
2. **Symmetric Cryptography (AES-256, SHA-384/512)**: Effective security bits are **halved** by **Grover's Algorithm**. **AES-256 retains 128-bit quantum security**, rendering it quantum-resistant without requiring algorithm replacement.

### Symmetric vs. Asymmetric Post-Quantum Migration Strategy

Understanding the difference between symmetric and asymmetric post-quantum security is critical for engineering roadmaps:

| Cryptographic Realm | Quantum Threat Algorithm | Quantum Attack Impact | Post-Quantum Mitigation Action |
|---|---|---|---|
| **Asymmetric Cryptography** (*RSA, ECC, ECDSA, ECDHE*) | **Shor's Algorithm** | Exponential speedup (**O(n^3)**); **completely breaks** factorization and discrete logs. | **Must migrate to new PQC algorithms** (**FIPS 203 ML-KEM** for key exchange, **FIPS 204 ML-DSA** for signatures). |
| **Symmetric Cryptography** (*AES-256, ChaCha20, SHA-256/512*) | **Grover's Algorithm** | Quadratic speedup (**O(sqrt(N))**); **halves** key security bits. | **Increase key size to 256 bits**. AES-256 itself does NOT need to be replaced with a new algorithm. |

<div class="security-layer security-layer-protect">
  <div class="security-layer-label">PQC Migration Context</div>
  <div>
    <strong>Why PQC Migration is Required for Network Protocols</strong>
    <p>While AES-256 bulk payload encryption is quantum-safe, network protocols (<em>such as TLS 1.3</em>) rely on asymmetric key exchange (<em>classical ECDHE</em>) to establish and distribute the symmetric AES-256 session key. An adversary harvesting encrypted traffic today can use Shor's algorithm in the future to break the classical ECDHE key exchange, exposing the AES-256 key. Therefore, systems must deploy <strong>Post-Quantum Key Encapsulation (FIPS 203 ML-KEM)</strong> to protect the AES-256 key exchange.</p>
  </div>
</div>

## The "Harvest Now, Decrypt Later" Attack Threat

Adversaries are actively intercepting and storing encrypted high-value enterprise traffic today (<strong>"Harvest Now, Decrypt Later"</strong>). When a CRQC becomes operational in the future, recorded traffic encrypted under classical RSA or ECDHE key exchanges will be decrypted retroactively.

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Harvest Now, Decrypt Later Mitigation</div>
  <div>
    <strong>Immediate Action Required for Data with Long Lifespans</strong>
    <p>Systems protecting data with confidentiality lifetimes exceeding 5–10 years must deploy <strong>hybrid post-quantum key exchange (X25519MLKEM768)</strong> immediately to prevent retroactive decryption of harvested traffic.</p>
  </div>
</div>

## Finalized NIST PQC Standards (FIPS 203, 204, 205) & Draft FIPS 206

On August 13, 2024, NIST officially published the **finalized Federal Information Processing Standards (FIPS)** for Post-Quantum Cryptography: **FIPS 203 (ML-KEM)**, **FIPS 204 (ML-DSA)**, and **FIPS 205 (SLH-DSA)**. A fourth algorithm, **FN-DSA (Falcon)**, is currently under development as draft **FIPS 206**:

### Finalized PQC Standards (August 2024)

| FIPS Standard | Algorithm Name | Mathematical Paradigm | Target Function | Status & Primary Engineering Role |
|---|---|---|---|---|
| **FIPS 203** | **ML-KEM** (Kyber) | Module Lattice (ML-WE) | General Key Encapsulation (KEM) | **FINALIZED (Aug 2024)**: Primary standard for public-key encryption and TLS 1.3 key exchange ([NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final)). |
| **FIPS 204** | **ML-DSA** (Dilithium) | Module Lattice (ML-SIS) | General Digital Signatures | **FINALIZED (Aug 2024)**: Primary standard for general-purpose digital signatures and PKI ([NIST FIPS 204](https://csrc.nist.gov/pubs/fips/204/final)). |
| **FIPS 205** | **SLH-DSA** (SPHINCS+) | Stateless Hash Trees | Backup Digital Signatures | **FINALIZED (Aug 2024)**: Purely hash-based signature scheme providing conservative fallback safety ([NIST FIPS 205](https://csrc.nist.gov/pubs/fips/205/final)). |

### Standards Under Development (Draft)

| Draft Standard | Algorithm Name | Mathematical Paradigm | Target Function | Status & Primary Engineering Role |
|---|---|---|---|---|
| **Draft FIPS 206** | **FN-DSA** (Falcon) | Fast-Fourier Lattice | Compact Digital Signatures | **UNDER DEVELOPMENT**: Draft standard optimized for compact signatures in constrained memory environments. |

## NSA CNSA 2.0 Timeline & Transition Strategy (National Security Systems)

For U.S. **National Security Systems (NSS)** subject to Commercial National Security Algorithm Suite 2.0 (**[NSA CNSA 2.0](https://media.defense.gov/2022/Sep/07/2003071833/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF)**) guidance, the NSA outlines target adoption timelines and Commercial Solutions for Classified (CSfC) capability package milestones:

1. **Software &amp; Web Browsers (NSS)**: Prefer hybrid post-quantum key exchange (X25519MLKEM768) starting in 2025/2026; transition to exclusive PQC by 2030.
2. **Network Equipment &amp; Enterprise VPNs (NSS)**: Deploy PQC capabilities starting in 2026; mandate exclusive PQC by 2030.
3. **PKI, Operating Systems &amp; Firmware (NSS)**: Begin initial PQC deployment by 2027; enforce full exclusive PQC across NSS by 2033.

## Hybrid Cryptography Transition Pattern

To hedge against implementation bugs in new lattice-based algorithms, production protocols (*TLS 1.3, SSHv2, Signal*) deploy **Hybrid Key Exchange**:

`Shared Secret S = KDF(Classical_ECDH_Secret || PostQuantum_KEM_Secret)`

In TLS 1.3, the IETF standardized the **`X25519MLKEM768`** hybrid group (IANA codepoint `0x11EC`), combining classical Curve25519 ECDH with FIPS 203 ML-KEM-768.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Post-Quantum Cryptography Summary</strong>
    <ul>
      <li><strong>Finalized vs. Draft</strong>: FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA) are <strong>finalized NIST standards (Aug 2024)</strong>. FIPS 206 (FN-DSA) is a <strong>draft standard under development</strong>.</li>
      <li><strong>Shor's vs. Grover's</strong>: Shor's algorithm completely breaks RSA/ECC. Grover's algorithm only halves symmetric key strength (AES-256 remains secure with 128-bit quantum security).</li>
      <li><strong>Harvest Now, Decrypt Later</strong>: Adversaries record encrypted traffic today to decrypt years later. Long-lived data requires immediate deployment of hybrid key exchange (X25519MLKEM768).</li>
      <li><strong>CNSA 2.0 Scope</strong>: Applies specifically to U.S. National Security Systems (NSS), Software and firmware signing target 2030; traditional networking equipment targets 2030; web browsers, web servers, cloud services, and operating systems target exclusive CNSA 2.0 deployment by **2033** per [NSA CNSA 2.0 Advisory](https://media.defense.gov/2025/May/30/2003728741/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS.PDF).</li>
    </ul>
  </div>
</div>

## Primary References


- **NIST FIPS 203**: *Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM)* — [NIST CSRC FIPS 203 Final](https://csrc.nist.gov/pubs/fips/203/final)
- **NIST FIPS 204**: *Module-Lattice-Based Digital Signature Standard (ML-DSA)* — [NIST CSRC FIPS 204 Final](https://csrc.nist.gov/pubs/fips/204/final)
- **NIST FIPS 205**: *Stateless Hash-Based Digital Signature Standard (SLH-DSA)* — [NIST CSRC FIPS 205 Final](https://csrc.nist.gov/pubs/fips/205/final)
- **NSA CNSA 2.0**: *Commercial National Security Algorithm Suite 2.0 Cybersecurity Advisory* — [NSA CNSA 2.0 Advisory PDF](https://media.defense.gov/2022/Sep/07/2003071833/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF)
- **IETF TLS 1.3 Hybrid Group**: *X25519MLKEM768 Key Exchange for TLS 1.3* — [RFC 10024](https://auth48-transition.rfc-editor.org/authors/rfc10024.html)
