---
title: Hash Functions & MACs
description: Cryptographic hash properties (Preimage, 2nd-Preimage, Collision resistance), SHA-2/SHA-3 standards, HMAC-SHA256, KMAC, BLAKE3, and length-extension mitigation.
permalink: /topics/hash-functions-macs/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Concepts</span>

# Hash Functions & MACs

<p class="lede">Cryptographic hash functions map arbitrary-length data streams into fixed-size digest values, providing integrity verification and avalanche diffusion. Unkeyed hashes prove payload integrity against accidental corruption, whereas Hash-based Message Authentication Codes (HMAC) incorporate a shared secret key to provide origin authentication and protect against active tampering.</p>

## The Three Formal Security Properties

Standardized in **[FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/final)** and **[FIPS 202](https://csrc.nist.gov/pubs/fips/202/final)**, a secure cryptographic hash function **H(x)** must satisfy three formal mathematical properties:

<div class="diagram-frame">
  <img src="{{ '/assets/img/hash-security-properties.svg' | relative_url }}" alt="Comparison of preimage, second-preimage, and collision resistance in cryptographic hash functions.">
  <p class="diagram-caption">The three hash properties describe different attacker search problems</p>
</div>

| Security Property | Mathematical &amp; Search Definition | Failure Consequence | Target Engineering Mitigation |
|---|---|---|---|
| **Collision Resistance** | Infeasible to find *any* pair **x ≠ x'** such that **H(x) = H(x')**. | Attacker generates two distinct documents (one benign, one malicious) sharing an identical hash. | Migrate from MD5 / SHA-1 to SHA-256 or SHA3-256. |
| **Preimage Resistance** (One-Way) | Given **y = H(x)**, infeasible to compute original **x**. | Attacker reverses a stored password digest or token hash to recover the secret plaintext. | Deploy salted password hashes (**Argon2id**) or CSPRNG secret tokens. |
| **Second-Preimage Resistance** | Given **x**, infeasible to find **x' ≠ x** such that **H(x) = H(x')**. | Attacker substitutes a malicious software binary for a target release while matching its published hash. | Verify cryptographic signatures over releases rather than plain unkeyed hashes. |

### The Avalanche Effect

A secure cryptographic hash exhibits strong **avalanche diffusion**: modifying a single bit in the input alters approximately 50% of the output bits in an unpredictable pattern.

<div class="diagram-frame">
  <img src="{{ '/assets/img/hash-avalanche.svg' | relative_url }}" alt="SHA-256 avalanche effect showing how changing a single character flips half the digest bits.">
  <p class="diagram-caption">SHA-256 avalanche effect: altering one character produces an unrelated digest</p>
</div>

## Hash Algorithm Status Matrix

| Algorithm | Digest Size | Current Security Status | Target Applications |
|---|---|---|---|
| **BLAKE3** | Variable (256-bit default) | **HIGH-SPEED APPROVED**: Tree-hashing design with extreme multi-core parallelism. | High-throughput file deduplication, supply chain hashing, tree proofs. |
| **KMAC128 / KMAC256** | Variable ([NIST SP 800-185](https://csrc.nist.gov/pubs/sp/800/185/final)) | **APPROVED NIST MAC**: Keccak-based PRF/MAC natively immune to length extension. | High-assurance message authentication without HMAC nested overhead. |
| **MD5** | 128 bits | **CRITICALLY BROKEN**: Practical collisions demonstrated (Flame malware, 2004). | Legacy non-security checksums (*Do not use for security*). |
| **SHA-1** | 160 bits | **BROKEN**: Practical collision demonstrated ("SHAttered" attack, 2017). Prohibited by NIST SP 800-131A. | Deprecated (*Do not use for signatures or security*). |
| **SHA-256 / SHA-512** (SHA-2) | 256 / 512 bits | **APPROVED &amp; STANDARD**: Primary federal and commercial hash standard. | Digital signatures, TLS 1.3, WebAuthn, block headers. |
| **SHA3-256 / SHA3-512** (SHA-3) | 256 / 512 bits | **APPROVED ALTERNATIVE**: Based on Keccak sponge construction (FIPS 202). | High-assurance alternative hedging against SHA-2 cryptanalysis. |

## Hash-based Message Authentication Codes (HMAC) & KMAC

Unkeyed hashes like `SHA-256(message)` do not prove origin authenticity; an attacker in the middle can alter both the message payload and the digest.

Standardized in **[FIPS 198-1](https://csrc.nist.gov/pubs/fips/198-1/final)**, **HMAC** binds a secret key **K** to the message:

**HMAC(K, M) = H((K ⊕ opad) || H((K ⊕ ipad) || M))**

<div class="diagram-frame">
  <img src="{{ '/assets/img/hmac-flow.svg' | relative_url }}" alt="HMAC nested hash flow diagram showing inner and outer key padding blocks.">
  <p class="diagram-caption">HMAC-SHA256 nested construction: double-hashing with inner (ipad) and outer (opad) key padding</p>
</div>

### Why Naive `H(Key || Message)` Fails: Length-Extension Attacks

Naive concatenation `H(key || message)` using Merkle–Damgård hashes (MD5, SHA-1, SHA-256) is vulnerable to **length-extension attacks**. An adversary observing `H(key || message)` can compute a valid digest for `key || message || padding || attacker_data` without learning `key`.

HMAC's nested construction prevents length-extension attacks by wrapping the inner hash output inside an outer hash layer protected by `opad`. Modern sponge-based constructions (**SHA-3 / FIPS 202**, **KMAC / SP 800-185**, **BLAKE3**) are inherently immune to length extension by design.

## Command-Line Validation & Demo

```bash
# 1. Compute plain SHA-256 hash digest
echo -n "The quick brown fox" | shasum -a 256
# Output: 5cac4f980fedc3d3f1f99b4be3472c9b30d56523e632d151237ec9309048bda9  -

# 2. Compute HMAC-SHA256 authenticated tag using shared key
echo -n "The quick brown fox" | openssl dgst -sha256 -hmac "secret-key-32-bytes"
# Output: e8076ef407b3f9ca99b234733a2114bd63bd9e8bbd9bf842ef69ed64fc339fa8
```
