---
title: Recommended Cryptographic Algorithms & Standards
description: Comprehensive compliance guide mapping NIST SP 800-57, NSA CNSA 2.0, NIST PQC Standards (FIPS 203/204/205/206), and Chinese ShangMi (SM2/3/4) algorithm suites.
permalink: /topics/recommended-algorithms/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Standards</span>

# Recommended Cryptographic Algorithms & Standards

<p class="lede">Selecting cryptographic algorithms requires balancing mathematical security strength, computational overhead, and international regulatory compliance. Security architects must enforce standardized, peer-reviewed primitives approved by NIST, BSI, and NSA CNSA 2.0 guidelines while deprecating legacy ciphers vulnerable to cryptanalytic or quantum attacks.</p>

## Quantum Impact on Cryptographic Strength

Quantum computing impacts symmetric and asymmetric primitives in fundamentally different ways:

<div class="diagram-frame">
  <img src="{{ '/assets/img/quantum-algorithm-impact.svg' | relative_url }}" alt="Comparison of Grover's algorithm halving symmetric key security vs Shor's algorithm breaking RSA and ECC.">
  <p class="diagram-caption">Grover's algorithm halves symmetric security (mitigated by doubling key sizes); Shor's algorithm completely breaks RSA/ECC</p>
</div>

1. **Grover's Algorithm (Symmetric Ciphers &amp; Hashes)**: Provides quadratic speedup for brute-force searches. Effective key strength is halved (**256-bit symmetric keys drop to 128-bit security**). Mitigated by deploying AES-256 and SHA-384/512.
2. **Shor's Algorithm (Asymmetric Public Key Cryptography)**: Solves prime factorization and discrete logarithms in polynomial time (**O(n^3)**). **Completely breaks RSA, ECC, ECDSA, and Diffie-Hellman**. Mitigated by transitioning to NIST Post-Quantum Cryptography (PQC) standards.

## Recommended Approved Algorithms Matrix (NIST SP 800-57)

| Security Property | Primitive / Algorithm | Minimum Key Size / Parameters | Current Status &amp; Compliance |
|---|---|---|---|
| **Bulk Symmetric Encryption** | **AES-256-GCM** / **AES-GCM-SIV** | 256-bit key, 96-bit nonce | **APPROVED**: Universal standard for data at rest and in transit ([NIST SP 800-57](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)). |
| **Digital Signatures (Classical)** | **Ed25519** (RFC 8032) / **RSA-PSS** | 256-bit curve / 3072-bit RSA | **APPROVED**: Standard for classical public-key signing. |
| **Ephemeral Key Agreement** | **ECDHE-X25519** / **NIST P-384** | 256-bit / 384-bit curve | **APPROVED**: Standard for TLS 1.3 Perfect Forward Secrecy. |
| **Hash Functions** | **SHA-256, SHA-512, SHA3-256** | 256-bit / 512-bit digest | **APPROVED**: Universal hash standard for signatures and TLS. |
| **Key Derivation Functions** | **HKDF-SHA256** / **KMAC256** | 256-bit secret key | **APPROVED**: Standard key extraction and expansion function. |

## Disallowed & Legacy Cryptographic Algorithms

| Algorithm | Legacy Specification | Status &amp; Vulnerability | Migration Action |
|---|---|---|---|
| **3DES / TDEA** | 64-bit Block Cipher | **DISALLOWED**: Vulnerable to Sweet32 birthday collisions after 2^32 blocks. | Migrate immediately to **AES-256-GCM**. |
| **MD5** | 128-bit Hash Function | **CRITICALLY BROKEN**: Practical collisions demonstrated in under 1 second. | Replace with **SHA-256** or **SHA3-256**. |
| **RC4** | Stream Cipher | **DISALLOWED**: Biased keystream bytes allow TLS plaintext recovery. | Replace with **AES-256-GCM** or **ChaCha20-Poly1305**. |
| **RSA-1024** | Public Key Cipher | **DISALLOWED**: Inadequate security strength (&lt; 80 bits). | Replace with **Ed25519** or **3072-bit RSA-PSS**. |
| **SHA-1** | 160-bit Hash Function | **BROKEN**: Practical collision demonstrated (SHAttered, 2017). Prohibited by [NIST SP 800-131A](https://csrc.nist.gov/pubs/sp/800/131/a/r2/final). | Replace with **SHA-256**. |

## NIST Post-Quantum Cryptography (PQC) Standards (FIPS 203, 204, 205, 206)

Finalized by NIST, these standards provide quantum-resistant encryption and digital signatures:

| Standard Number | Algorithm Name | Mathematical Paradigm | Target Cryptographic Function |
|---|---|---|---|
| **FIPS 203** | **ML-KEM** (Kyber) | Module Lattice (ML-WE) | General public-key encryption and key encapsulation mechanism (KEM). |
| **FIPS 204** | **ML-DSA** (Dilithium) | Module Lattice (ML-SIS) | Primary general-purpose digital signature standard for PKI and code signing. |
| **FIPS 205** | **SLH-DSA** (SPHINCS+) | Stateless Hash Trees | Backup digital signature scheme relying purely on hash function security. |
| **FIPS 206** | **FN-DSA** (Falcon) | Fast-Fourier Lattice | Compact signature standard optimized for constrained environments. |

## Regional Standards: Chinese ShangMi (SM) Algorithm Suite

Multinational corporations operating inside mainland China must support the **Commercial Code Administration Office (OSCCA)** ShangMi algorithm suite for compliance:

| SM Algorithm | Cryptographic Primitive | Equivalent Western Primitive | Compliance Requirement |
|---|---|---|---|
| **SM2** | Elliptic Curve Public Key | ECC P-256 / Ed25519 | Mandatory for public-key encryption and digital signatures in China banking. |
| **SM3** | Cryptographic Hash | SHA-256 | Mandatory 256-bit hash digest for integrity checks and signatures. |
| **SM4** | 128-bit Block Cipher | AES-128-GCM | Mandatory 128-bit block cipher for data at rest and network transit in China. |
| **SM9** | Identity-Based Encryption | IBE / Identity PKI | Identity-based public-key algorithm using user ID as public key. |
