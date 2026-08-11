---
title: Digital Signatures & Non-Repudiation
description: Comprehensive guide to digital signature pipelines, RSA-PSS, ECDSA, Ed25519 (RFC 8032), FIPS 204 ML-DSA, FIPS 205 SLH-DSA, deterministic nonces (RFC 6979), and HSM key custody.
permalink: /topics/digital-signatures/
last_verified: 2026-08-12
---

<span class="eyebrow">Cryptography / Concepts</span>

# Digital Signatures & Non-Repudiation

<p class="lede">Digital signatures provide verifiable cryptographic evidence of payload integrity and key control over unauthenticated networks—verifiable evidence that a valid signature tag could only have been produced using the corresponding private key. By signing a cryptographically secure hash of a payload using a private key, the key holder creates a signature tag that any third party holding the matching public key can verify independently.</p>

## The Digital Signature Pipeline

RSA-PSS and ECDSA operate over a fixed-size digest rather than the raw payload: their signing operation is a bounded modular/algebraic transform, and feeding in variable-length or attacker-chosen data directly (without a hash-and-pad step) invites malleability and existential-forgery attacks, not just a performance hit. That hashing step is part of the algorithm's own definition, not necessarily something the caller must do externally first — RFC 8017's RSASSA-PSS-Sign interface, for example, takes the full message `M` and performs the EMSA-PSS encoding, including hashing, internally. Some lower-level or hardware APIs (HSM/PKCS#11 "sign this digest" primitives) do expose a precomputed-digest interface instead; whichever convention a given library uses, hashing the message yourself and then feeding the result into an API that also hashes internally causes accidental double hashing, a real and recurring implementation bug, not just a performance concern. Ed25519 and Ed448 (pure EdDSA per [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)) take the raw message and hash it internally as part of the algorithm itself (Ed25519 using SHA-512; Ed448 using SHAKE256) — with separate prehash variants (`Ed25519ph` / `Ed448ph`) for cases that need to hash large messages before signing. The pipeline below is a conceptual simplification of the RSA-PSS/ECDSA case; signatures generally execute across a three-stage pipeline:

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
| **FIPS 204 ML-DSA** (Dilithium) | Module Lattice Cryptography | **POST-QUANTUM APPROVED**: Primary NIST post-quantum digital signature standard. | Candidate replacement for RSA/ECDSA signatures in PKI and TLS, pending the specific protocol/profile's support — TLS 1.3 PQC signature negotiation, CA tooling, and client compatibility are all still rolling out; check actual implementation support before depending on it in a given deployment. |
| **FIPS 205 SLH-DSA** (SPHINCS+) | Stateless Hash Trees | **STATELESS HASH-BASED DESIGN**: Hedged hash tree signatures independent of lattice assumptions, with no internal state to manage between signatures (unlike stateful hash-based schemes such as XMSS/LMS). | High-assurance post-quantum fallback for firmware signing and long-term roots. |
| **RSA-PSS** ([RFC 8017](https://www.rfc-editor.org/rfc/rfc8017)) | Prime Factorization + Probabilistic Salt | Standard randomized salt | Recommended RSA signature padding scheme for new designs; PKCS#1 v1.5 is not banned outright by the relevant standards (it remains defined in RFC 8017 and widely deployed for compatibility), but new systems should default to RSA-PSS rather than PKCS#1 v1.5. |

## The ECDSA Nonce Leakage Catastrophe & RFC 6979

Legacy **ECDSA** requires generating a cryptographically random 256-bit integer **k** for every signature. If **k** is reused across two signatures under the same private key, an adversary can recover private key **d** via simple modular arithmetic:

<b>d = (s<sub>1</sub> r<sub>2</sub> - s<sub>2</sub> r<sub>1</sub>)<sup>-1</sup> (s<sub>2</sub> h<sub>1</sub> - s<sub>1</sub> h<sub>2</sub>) mod n</b>

### Mitigation: Deterministic Nonces (RFC 6979 & Ed25519)

These are two distinct constructions, not one shared formula, though both eliminate per-signature RNG failure risk.

**[RFC 6979](https://www.rfc-editor.org/rfc/rfc6979) §3.2** (ECDSA/DSA) derives **k** via an HMAC-based DRBG seeded from <b>K<sub>priv</sub></b> and **H(M)** — not a single hash call. It iterates <b>K = HMAC<sub>K</sub>(V || 0x00 || int2octets(K<sub>priv</sub>) || bits2octets(H(M)))</b> and <b>V = HMAC<sub>K</sub>(V)</b> to initialize state, then repeatedly re-hashes **V** to generate output bits until a candidate **k** in range **[1, n-1]** is produced (retrying on out-of-range values).

**[RFC 8032](https://www.rfc-editor.org/rfc/rfc8032) §5.1.6** (Ed25519) derives its nonce differently: <b>r = SHA-512(prefix || M) mod L</b>, where **prefix** is the second (upper) 32 bytes of **SHA-512(private key seed)** — the first 32 bytes become the clamped signing scalar — and **M** is the message (or, in the Ed25519ph prehash variant, **SHA-512(M)**). This is a single direct SHA-512 hash, not an HMAC-DRBG, so despite both mechanisms being called "deterministic nonce generation," they are architecturally unrelated.

## Signature Verification: A Verifier's Checklist

"The signature is valid" is a narrower statement than it sounds — a cryptographically valid signature only proves the holder of a specific private key signed a specific byte string. Everything else a verifier actually needs to trust the result is a separate check, and skipping any of them is a recurring source of real vulnerabilities:

1. **Key-to-identity binding**: A valid signature under a public key proves nothing about *whose* key it is unless that key is bound to an identity through a trusted mechanism — a CA-issued certificate chain (see Certificates), a pinned key, or an out-of-band fingerprint check. Verifying the signature without verifying this binding is exactly the gap that lets an attacker substitute their own key.
2. **Accepted algorithms and parameters**: Confirm the signature algorithm and its parameters (curve, hash function, key size) are ones your system actually intends to accept — a verifier that accepts *any* algorithm the signer claims to have used is vulnerable to algorithm-confusion attacks (e.g., an attacker relabeling an HMAC tag as an "RSA signature" against a verifier that naively trusts a client-supplied algorithm field).
3. **Canonical encoding / malleability**: Some signature schemes (notably ECDSA) have a documented malleability property — a valid signature `(r, s)` can be transformed into another valid signature `(r, n-s)` for the same message and key. Systems that use a signature's bytes as a unique identifier (transaction IDs keyed by signature hash, replay-detection caches) need to normalize or reject the malleable form, or they'll treat the same logical signature as two different ones.
4. **Context / domain separation**: Confirm the signature was produced for the context you're verifying it in, not just that it's valid *somewhere* — a signature scheme without domain separation lets a signature created for one purpose (or one protocol version) be replayed as valid for another (see Safe Protocol Composition on the Cryptography Overview page).
5. **Replay / freshness**: A valid signature over an old message is still a valid signature — nothing about signature verification itself detects replay. Protocols that need freshness bind a nonce, timestamp, or sequence number into what's signed, and the verifier must actually check it.
6. **Certificate validity (if applicable)**: If the public key arrives via a certificate, confirm the *certificate* is currently valid — not expired, not before its start date, and chaining to a trusted root — separately from confirming the signature itself is mathematically valid.
7. **Revocation status (if applicable)**: A certificate can be within its validity window and still have been revoked (key compromise, mis-issuance). See the certificate revocation discussion on the Certificates page for why this check is best-effort in practice, not a guarantee — but it's still a check a careful verifier should attempt.
8. **Key compromise / rotation awareness**: A signature valid under a key that has since been reported compromised or rotated out shouldn't necessarily be trusted going forward, depending on your system's policy — this is a systems/process concern (key lifecycle tracking) as much as a cryptographic one, but it's part of what "is this signature trustworthy" actually means in production.

## Trusted Timestamping and Long-Term Signature Validation

A timestamp included inside a signed message (item 5 above) is not independent evidence of signing time, because the signer chose that value — it provides freshness only when the surrounding protocol actually checks it against an acceptable time window, nonce, or sequence rule. That's a different guarantee from proving *when* a signature came into existence, which matters once a verifier is checking a signature well after the fact — potentially after the signer's certificate has expired, been revoked, or become unavailable (see the certificate-validity and revocation checks above).

For independent time evidence, a verifier can rely on a trusted **Time-Stamping Authority (TSA)** using the Time-Stamp Protocol defined by [RFC 3161](https://www.rfc-editor.org/info/rfc3161/). The TSA signs a cryptographic imprint (hash) of the signature or signed object and returns a `TimeStampToken`. A valid token is evidence that the submitted data existed **no later than** the TSA's recorded time — it does not prove when the data was originally created, only that it already existed by that point.

Long-term signature validation may require preserving, alongside the signature itself:
- the original signed object and signature;
- the signer's certificate chain;
- applicable certificate-revocation evidence, such as CRLs or OCSP responses (see the revocation discussion on the Certificates page);
- the TSA's timestamp token and its own certificate chain;
- the validation policy and algorithms considered acceptable at the asserted time.

A trusted timestamp lets a validation policy establish that a signature existed while the signer's certificate was still valid, even if verification itself happens after that certificate has expired. Revocation still needs careful interpretation in this scenario: the verifier may need to determine whether the signing key was reported compromised *before* or *after* the timestamped signature existed, since a timestamp predating a revocation is treated differently than one postdating it. For retention periods long enough to outlast a TSA's own certificate or the cryptographic algorithms currently in use, the timestamp and validation evidence may themselves need to be renewed (re-timestamped under newer algorithms) before that expiry or algorithmic weakening occurs — [RFC 9921](https://www.rfc-editor.org/rfc/rfc9921.html) is one current mechanism for carrying RFC 3161 timestamp tokens (in both timestamp-then-sign and sign-then-timestamp modes) within COSE-based protocols built around this same long-term-validation problem.

Trusted timestamping strengthens evidence of *existence and timing*. On its own, it does not prove the signer's real-world identity, exclusive key custody, human intent, authorization, or legal non-repudiation — those remain the separate concerns covered elsewhere in this checklist and on the Certificates page.

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
      <li><strong>Signature Pipeline</strong>: RSA-PSS and ECDSA operate over a hash digest (<code>H(M)</code>) that the algorithm's own definition computes as part of signing — not necessarily something the caller must pre-compute externally, though some lower-level APIs do accept a precomputed digest directly. Ed25519/Ed448 always hash the full message internally. Mixing conventions causes accidental double hashing; either way, verifiers check the signature tag against <code>K<sub>pub</sub></code>.</li>
      <li><strong>ECDSA Nonce Hazard</strong>: Reusing a random nonce <code>k</code> across two ECDSA signatures leaks the private key. Use RFC 6979 deterministic nonces or Ed25519.</li>
      <li><strong>Post-Quantum Signatures</strong>: FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA) are finalized post-quantum signature standards.</li>
      <li><strong>Legal vs. Cryptographic Non-Repudiation</strong>: A valid signature proves the signing key was used, not legal attribution to a person — legal non-repudiation depends on jurisdiction and evidentiary law (e.g., ESIGN Act/UETA, eIDAS), not the cryptography alone.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST FIPS 186-5**: *Digital Signature Standard (DSS)* — [NIST CSRC FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final)
- **RFC 8032**: *Edwards-Curve Digital Signature Algorithm (EdDSA / Ed25519)* — [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032) (IRTF/CFRG Informational, not IETF Standards Track)
- **RFC 6979**: *Deterministic Usage of the Digital Signature Algorithm (DSA) and ECDSA* — [IETF RFC 6979](https://www.rfc-editor.org/rfc/rfc6979)
- **RFC 3161**: *Internet X.509 Public Key Infrastructure Time-Stamp Protocol (TSP)* — [RFC Editor: RFC 3161](https://www.rfc-editor.org/info/rfc3161/)
- **RFC 9921**: *Time-Stamp Protocol (TSP) Timestamp Tokens for COSE* — [IETF RFC 9921](https://www.rfc-editor.org/rfc/rfc9921.html)
