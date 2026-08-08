---
title: Post-Quantum Cryptography (PQC) Migration
description: Architectural roadmap for migrating to NIST PQC standards (FIPS 203 ML-KEM, FIPS 204 ML-DSA, FIPS 205 SLH-DSA, FIPS 206 FN-DSA), NSA CNSA 2.0 timelines, and hybrid key exchange.
permalink: /topics/post-quantum-cryptography/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Emerging Topics</span>

# Post-Quantum Cryptography (PQC) Migration

<p class="lede">Post-Quantum Cryptography (PQC) prepares enterprise systems for the advent of Cryptographically Relevant Quantum Computers (CRQCs). Quantum computers running Shor's algorithm will break classical public-key cryptography (RSA, ECC, ECDSA, ECDH) in polynomial time. Security architects must execute a phased migration to NIST PQC standards (FIPS 203/204/205/206) and enforce NSA CNSA 2.0 migration deadlines.</p>

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

## Finalized NIST PQC Standards (FIPS 203, 204, 205, 206)

On August 13, 2024, NIST officially published the finalized Federal Information Processing Standards (FIPS) for Post-Quantum Cryptography:

| FIPS Standard | Algorithm Name | Mathematical Paradigm | Target Function | Key Characteristics |
|---|---|---|---|---|
| **FIPS 203** | **ML-KEM** (Kyber) | Module Lattice (ML-WE) | General Key Encapsulation (KEM) | Primary standard for public-key encryption and TLS 1.3 key exchange ([NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final)). |
| **FIPS 204** | **ML-DSA** (Dilithium) | Module Lattice (ML-SIS) | General Digital Signatures | Primary standard for general-purpose digital signatures and PKI ([NIST FIPS 204](https://csrc.nist.gov/pubs/fips/204/final)). |
| **FIPS 205** | **SLH-DSA** (SPHINCS+) | Stateless Hash Trees | Backup Digital Signatures | Purely hash-based signature scheme providing conservative fallback safety ([NIST FIPS 205](https://csrc.nist.gov/pubs/fips/205/final)). |
| **FIPS 206** | **FN-DSA** (Falcon) | Fast-Fourier Lattice | Compact Digital Signatures | In development; optimized signature scheme producing smaller signatures for constrained networks. |

## NSA CNSA 2.0 Timeline & Transition Strategy

The Commercial National Security Algorithm Suite 2.0 (**[NSA CNSA 2.0](https://media.defense.gov/2022/Sep/07/2003071833/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF)**) mandates strict federal transition deadlines:

1. **Software &amp; Web Browsers**: Deploy hybrid post-quantum key exchange by 2026; mandate exclusive PQC by 2030.
2. **Network Equipment &amp; VPNs**: Support PQC by 2026; mandate exclusive PQC by 2030.
3. **PKI &amp; Operating Systems**: Begin PQC transition by 2027; mandate exclusive PQC by 2033.

## Hybrid Cryptography Transition Pattern

To hedge against implementation flaws in early PQC code while protecting against classical attacks, systems deploy **Hybrid Cryptography**: combining classical primitives (**X25519** or **ECDSA**) with PQC primitives (**ML-KEM-768** or **ML-DSA-65**) in a single protocol pass.

For example, TLS 1.3 deploys the **`X25519MLKEM768`** hybrid group (IANA codepoint `0x11EC`), concatenating shared secrets from both X25519 and ML-KEM-768. The connection remains secure as long as at least one of the underlying algorithms remains unbroken.
