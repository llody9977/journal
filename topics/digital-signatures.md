---
title: Digital Signatures & Non-Repudiation
description: Comprehensive guide to digital signature pipelines, RSA-PSS, ECDSA, Ed25519 (RFC 8032), FIPS 204 ML-DSA, FIPS 205 SLH-DSA, deterministic nonces (RFC 6979), and HSM key custody.
permalink: /topics/digital-signatures/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Concepts</span>

# Digital Signatures & Non-Repudiation

<p class="lede">Digital signatures provide mathematical proof of payload integrity, origin authenticity, and legal non-repudiation over unauthenticated networks. By signing a cryptographically secure hash of a payload using a private key, the key holder creates an unforgeable signature tag that any third party holding the matching public key can verify independently.</p>

## The Digital Signature Pipeline

Digital signatures never sign large raw message payloads directly due to computational performance constraints. Instead, signatures execute across a three-stage pipeline:

<div class="diagram-frame">
  <img src="{{ '/assets/img/signature-pipeline.svg' | relative_url }}" alt="Digital signature pipeline: message hashing, private key signing of digest, public key verification of signature.">
  <p class="diagram-caption">Digital signature pipeline: payload hashing, private key signature computation, and public key verification</p>
</div>

1. **Hashing Phase**: Compute a cryptographic hash digest **H(M)** over message **M** using SHA-256 or SHA3-256.
2. **Signing Phase**: Compute signature tag **S** over digest **H(M)** using private key <b>K<sub>priv</sub></b>.
3. **Verification Phase**: The verifier computes **H(M')** over received message **M'** and verifies **S** against public key <b>K<sub>pub</sub></b>. If the signature matches, origin identity and payload integrity are proven.

## Signature Scheme Comparison Matrix

| Algorithm | Mathematical Foundation | Per-Signature Nonce Safety | Target Engineering Guidance |
|---|---|---|---|
| **ECDSA** ([FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final)) | Elliptic Curve Discrete Logarithms | **HIGH RISK**: Random **k** reuse leaks private key **d**. | Use **RFC 6979** deterministic nonces or migrate to Ed25519 / ML-DSA. |
| **Ed25519 / Ed448** ([RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)) | Edwards-curve Digital Signatures | **SECURE BY DESIGN**: Nonce derived deterministically from private key. | Standard default for modern APIs, SSH keys, WebAuthn, and software signing. |
| **FIPS 204 ML-DSA** (Dilithium) | Module Lattice Cryptography | **POST-QUANTUM APPROVED**: Primary NIST post-quantum digital signature standard. | Target replacement for RSA/ECDSA signatures across PKI and TLS certificates. |
| **FIPS 205 SLH-DSA** (SPHINCS+) | Stateless Hash Trees | **STATE-PROOF RESILIENCE**: Hedged hash tree signatures independent of lattice assumptions. | High-assurance post-quantum fallback for firmware signing and long-term roots. |
| **RSA-PSS** ([RFC 8017](https://www.rfc-editor.org/rfc/rfc8017)) | Prime Factorization + Probabilistic Salt | Standard randomized salt | Recommended RSA signature padding scheme; deprecate PKCS#1 v1.5. |

## The ECDSA Nonce Leakage Catastrophe & RFC 6979

Legacy **ECDSA** requires generating a cryptographically random 256-bit integer **k** for every signature. If **k** is reused across two signatures under the same private key, an adversary can recover private key **d** via simple modular arithmetic:

<b>d = (s<sub>1</sub> r<sub>2</sub> - s<sub>2</sub> r<sub>1</sub>)<sup>-1</sup> (s<sub>2</sub> h<sub>1</sub> - s<sub>1</sub> h<sub>2</sub>) mod n</b>

### Mitigation: Deterministic Nonces (RFC 6979 & Ed25519)

Specified in **[RFC 6979](https://www.rfc-editor.org/rfc/rfc6979)** and **[RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)** (Ed25519), modern signature implementations generate per-signature nonces deterministically by computing `HMAC-SHA256(`<b>K<sub>priv</sub></b>`, H(M))`, completely eliminating RNG failure risks.

## Hardware Key Custody: HSMs & Secure Enclaves

Non-repudiation requires guaranteeing that private keys cannot be exported or cloned. Production architectures store signing keys inside **Hardware Security Modules (HSMs)**, **AWS KMS**, or **TPM 2.0 / Secure Enclaves**. Applications request cryptographic sign operations over secure APIs without ever exposing private key bytes in application memory.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Digital Signatures Summary</strong>
    <ul>
      <li><strong>Signature Pipeline</strong>: Signatures sign a cryptographic hash digest (<code>H(M)</code>) using <code>K<sub>priv</sub></code>; verifiers check the signature tag against <code>K<sub>pub</sub></code>.</li>
      <li><strong>ECDSA Nonce Hazard</strong>: Reusing a random nonce <code>k</code> across two ECDSA signatures leaks the private key. Use RFC 6979 deterministic nonces or Ed25519.</li>
      <li><strong>Post-Quantum Signatures</strong>: FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA) are finalized post-quantum signature standards.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST FIPS 186-5**: *Digital Signature Standard (DSS)* — [NIST CSRC FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final)
- **RFC 8032**: *Edwards-Curve Digital Signature Algorithm (EdDSA / Ed25519)* — [IETF RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)
- **RFC 6979**: *Deterministic Usage of the Digital Signature Algorithm (DSA) and ECDSA* — [IETF RFC 6979](https://www.rfc-editor.org/rfc/rfc6979)
