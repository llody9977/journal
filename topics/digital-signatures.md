---
title: Digital Signatures & Non-Repudiation
description: Comprehensive guide to digital signature pipelines, RSA-PSS, ECDSA, Ed25519 (RFC 8032), FIPS 204 ML-DSA, FIPS 205 SLH-DSA, deterministic nonces (RFC 6979), and HSM key custody.
permalink: /topics/digital-signatures/
last_verified: 2026-08-09
---

<span class="eyebrow">Cryptography / Concepts</span>

# Digital Signatures & Non-Repudiation

<p class="lede">Digital signatures provide verifiable cryptographic evidence of payload integrity and key control over unauthenticated networks—verifiable evidence that a valid signature tag could only have been produced using the corresponding private key. By signing a cryptographically secure hash of a payload using a private key, the key holder creates a signature tag that any third party holding the matching public key can verify independently.</p>

## The Digital Signature Pipeline

RSA-PSS and ECDSA sign a fixed-size digest rather than the raw payload: their signing operation is a bounded modular/algebraic transform, and feeding in variable-length or attacker-chosen data directly (without a hash-and-pad step) invites malleability and existential-forgery attacks, not just a performance hit. Ed25519 and Ed448 (pure EdDSA per [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)) instead take the raw message and hash it internally as part of the algorithm itself (Ed25519 using SHA-512; Ed448 using SHAKE256) — the caller does not pre-hash — with separate prehash variants (`Ed25519ph` / `Ed448ph`) for cases that need to hash large messages before signing. The pipeline below describes the RSA-PSS/ECDSA case; signatures generally execute across a three-stage pipeline:

<div class="diagram-frame">
  <img src="{{ '/assets/img/signature-pipeline.svg' | relative_url }}" alt="Digital signature pipeline: message hashing, private key signing of digest, public key verification of signature.">
  <p class="diagram-caption">Digital signature pipeline: payload hashing, private key signature computation, and public key verification</p>
</div>

1. **Hashing Phase**: Compute a cryptographic hash digest **H(M)** over message **M** using SHA-256 or SHA3-256.
2. **Signing Phase**: Compute signature tag **S** over digest **H(M)** using private key <b>K<sub>priv</sub></b>.
3. **Verification Phase**: The verifier computes **H(M')** over received message **M'** and verifies **S** against public key <b>K<sub>pub</sub></b>. If the signature matches, key possession and payload integrity are verified.

## Signature Scheme Comparison Matrix

| Algorithm | Mathematical Foundation | Per-Signature Nonce Safety | Target Engineering Guidance |
|---|---|---|---|
| **ECDSA** ([FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final)) | Elliptic Curve Discrete Logarithms | **HIGH RISK**: Random **k** reuse leaks private key **d**. | Use **RFC 6979** deterministic nonces or migrate to Ed25519 / ML-DSA. |
| **Ed25519** ([RFC 8032](https://www.rfc-editor.org/rfc/rfc8032) §5.1) | Edwards-curve Digital Signatures | **NO PER-SIGNATURE RNG DEPENDENCY**: Nonce derived deterministically via SHA-512(private key half \|\| message), eliminating the ECDSA-style catastrophic key leak from a reused or weak random **k** — this addresses that specific failure mode, not every signature-security concern (e.g., fault-injection attacks against deterministic schemes remain a separate consideration). | Widely used in modern APIs, SSH keys, and software signing; one of several algorithms [WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/) supports, not its universal default (ECDSA P-256 is also common in authenticators). |
| **Ed448** ([RFC 8032](https://www.rfc-editor.org/rfc/rfc8032) §5.2) | Edwards-curve Digital Signatures | **NO PER-SIGNATURE RNG DEPENDENCY**: Nonce derived deterministically via SHAKE256(private key half \|\| message), eliminating the ECDSA-style catastrophic key leak from a reused or weak random **k**. | Higher security-level alternative to Ed25519; less common support in SSH/WebAuthn tooling, useful for long-term high-assurance roots. |
| **FIPS 204 ML-DSA** (Dilithium) | Module Lattice Cryptography | **POST-QUANTUM APPROVED**: Primary NIST post-quantum digital signature standard. | Target replacement for RSA/ECDSA signatures across PKI and TLS certificates. |
| **FIPS 205 SLH-DSA** (SPHINCS+) | Stateless Hash Trees | **STATE-PROOF RESILIENCE**: Hedged hash tree signatures independent of lattice assumptions. | High-assurance post-quantum fallback for firmware signing and long-term roots. |
| **RSA-PSS** ([RFC 8017](https://www.rfc-editor.org/rfc/rfc8017)) | Prime Factorization + Probabilistic Salt | Standard randomized salt | Recommended RSA signature padding scheme; deprecate PKCS#1 v1.5. |

## The ECDSA Nonce Leakage Catastrophe & RFC 6979

Legacy **ECDSA** requires generating a cryptographically random 256-bit integer **k** for every signature. If **k** is reused across two signatures under the same private key, an adversary can recover private key **d** via simple modular arithmetic:

<b>d = (s<sub>1</sub> r<sub>2</sub> - s<sub>2</sub> r<sub>1</sub>)<sup>-1</sup> (s<sub>2</sub> h<sub>1</sub> - s<sub>1</sub> h<sub>2</sub>) mod n</b>

### Mitigation: Deterministic Nonces (RFC 6979 & Ed25519)

These are two distinct constructions, not one shared formula, though both eliminate per-signature RNG failure risk.

**[RFC 6979](https://www.rfc-editor.org/rfc/rfc6979) §3.2** (ECDSA/DSA) derives **k** via an HMAC-based DRBG seeded from <b>K<sub>priv</sub></b> and **H(M)** — not a single hash call. It iterates <b>K = HMAC<sub>K</sub>(V || 0x00 || int2octets(K<sub>priv</sub>) || bits2octets(H(M)))</b> and <b>V = HMAC<sub>K</sub>(V)</b> to initialize state, then repeatedly re-hashes **V** to generate output bits until a candidate **k** in range **[1, n-1]** is produced (retrying on out-of-range values).

**[RFC 8032](https://www.rfc-editor.org/rfc/rfc8032) §5.1.6** (Ed25519) derives its nonce differently: <b>r = SHA-512(prefix || M) mod L</b>, where **prefix** is the second (upper) 32 bytes of **SHA-512(private key seed)** — the first 32 bytes become the clamped signing scalar — and **M** is the message (or, in the Ed25519ph prehash variant, **SHA-512(M)**). This is a single direct SHA-512 hash, not an HMAC-DRBG, so despite both mechanisms being called "deterministic nonce generation," they are architecturally unrelated.

## Hardware Key Custody: HSMs & Secure Enclaves

Cryptographic key custody relies on reducing private key extraction and cloning risks. Production architectures can store signing keys inside **Hardware Security Modules (HSMs)**, **AWS KMS**, or **TPM 2.0 / Secure Enclaves** and configure them as non-exportable, so applications request cryptographic sign operations over secure APIs without private key bytes ever entering application memory. Non-exportability is a configuration choice these platforms *support*, though — a key created or imported with export permitted remains exportable despite living in an HSM, so verify the actual key policy rather than assuming HSM-backed implies non-exportable.

<div class="callout warn">
  <span class="callout-title">Cryptographic Non-Repudiation Is Not Automatically Legal Non-Repudiation</span>
  <p>A verifiable signature only proves the signing key produced the tag — it does not, by itself, establish legal non-repudiation. Whether a signature holds up as evidence that a specific person cannot deny having signed depends on jurisdiction, evidentiary rules, and proof tying the key to that person (e.g., the US ESIGN Act and UETA, or the EU eIDAS Regulation), not on the cryptography alone.</p>
</div>

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Digital Signatures Summary</strong>
    <ul>
      <li><strong>Signature Pipeline</strong>: RSA-PSS and ECDSA sign an externally computed hash digest (<code>H(M)</code>) using <code>K<sub>priv</sub></code>; Ed25519/Ed448 hash the message internally as part of signing rather than taking a pre-computed digest. Either way, verifiers check the signature tag against <code>K<sub>pub</sub></code>.</li>
      <li><strong>ECDSA Nonce Hazard</strong>: Reusing a random nonce <code>k</code> across two ECDSA signatures leaks the private key. Use RFC 6979 deterministic nonces or Ed25519.</li>
      <li><strong>Post-Quantum Signatures</strong>: FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA) are finalized post-quantum signature standards.</li>
      <li><strong>Legal vs. Cryptographic Non-Repudiation</strong>: A valid signature proves the signing key was used, not legal attribution to a person — legal non-repudiation depends on jurisdiction and evidentiary law (e.g., ESIGN Act/UETA, eIDAS), not the cryptography alone.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST FIPS 186-5**: *Digital Signature Standard (DSS)* — [NIST CSRC FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final)
- **RFC 8032**: *Edwards-Curve Digital Signature Algorithm (EdDSA / Ed25519)* — [IETF RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)
- **RFC 6979**: *Deterministic Usage of the Digital Signature Algorithm (DSA) and ECDSA* — [IETF RFC 6979](https://www.rfc-editor.org/rfc/rfc6979)
