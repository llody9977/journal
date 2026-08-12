---
title: Post-Quantum Cryptography (PQC) Migration
description: Architectural roadmap for migrating to NIST PQC standards (finalized FIPS 203 ML-KEM, FIPS 204 ML-DSA, FIPS 205 SLH-DSA, and draft FIPS 206 FN-DSA), NSA CNSA 2.0 timelines, and hybrid key exchange.
permalink: /topics/post-quantum-cryptography/
last_verified: 2026-08-11
---

<span class="eyebrow">Cryptography / Emerging Topics</span>

# Post-Quantum Cryptography (PQC) Migration

<p class="lede">Post-Quantum Cryptography (PQC) prepares enterprise systems for the advent of Cryptographically Relevant Quantum Computers (CRQCs). No such machine exists yet, but a sufficiently large, fault-tolerant quantum computer running Shor's algorithm would break classical public-key cryptography (RSA, ECC, ECDSA, ECDH) in polynomial time — and given multi-year migration timelines, security architects must plan now. Execute a phased migration to finalized NIST PQC standards FIPS 203, 204 and 205, with FN-DSA/FIPS 206 under development, and track NSA CNSA 2.0 migration deadlines.</p>

## Quantum Threat Horizon: Shor's vs Grover's Algorithm

Quantum computing impacts symmetric and asymmetric primitives in fundamentally different ways:

<div class="diagram-frame">
  <img src="{{ '/assets/img/quantum-algorithm-impact.svg' | relative_url }}" alt="Comparison of Grover's algorithm halving symmetric key security vs Shor's algorithm breaking RSA and ECC.">
  <p class="diagram-caption">Grover's algorithm halves symmetric security (mitigated by doubling key sizes); Shor's algorithm reduces RSA/ECC to a polynomial-time problem, once a sufficiently capable quantum computer exists</p>
</div>

1. **Asymmetric Cryptography (RSA, ECC, ECDSA, ECDH)**: **[Shor's Algorithm](https://doi.org/10.1137/S0097539795293172)** solves prime factorization and discrete logarithms in polynomial time — a genuine asymptotic break relative to the best-known classical attacks. Quoting one fixed exponent without defining the circuit and arithmetic model gives false precision because concrete resource estimates depend on that model. This is a **contingent, not a present-tense, threat**: it requires a sufficiently capable, fault-tolerant Cryptographically Relevant Quantum Computer (CRQC), and no such machine exists today. Once one does exist at sufficient scale, it would render RSA/ECC/ECDSA/ECDH's underlying hard problems tractable.
2. **Symmetric Ciphers (AES-256)**: Effective key-search security is **halved** by **Grover's Algorithm**. **AES-256 retains 128-bit quantum security**, rendering it quantum-resistant without requiring algorithm replacement.
3. **Hash Functions (SHA-384/512)**: Grover's Algorithm halves **preimage resistance** (an n-bit hash drops from ~n bits to **~n/2 bits**, e.g., SHA-256's 256-bit preimage resistance falls to ~128 bits). **Collision resistance** degrades differently: it is already ~n/2 bits classically (the birthday bound), and the best known quantum collision attack (the **BHT algorithm**) brings it down further to roughly **~n/3 bits** — a smaller reduction than a naive halving, and one whose practicality is limited by BHT's very large quantum-memory (QRAM) requirements.

### Symmetric vs. Asymmetric Post-Quantum Migration Strategy

Understanding the difference between symmetric and asymmetric post-quantum security is critical for engineering roadmaps:

| Cryptographic Realm | Quantum Threat Algorithm | Quantum Attack Impact | Post-Quantum Mitigation Action |
|---|---|---|---|
| **Asymmetric Cryptography** (*RSA, ECC, ECDSA, ECDHE*) | **Shor's Algorithm** | Solves factorization and discrete logarithms in polynomial time — a superpolynomial asymptotic improvement over the best-known classical attacks, with concrete cost depending on the quantum circuit and arithmetic model. This is only realized on a sufficiently capable, fault-tolerant CRQC, which does not exist yet, and [NIST cautions](https://csrc.nist.gov/Projects/Post-Quantum-Cryptography/Post-Quantum-Cryptography-Standardization/Evaluation-Criteria/Security-%28Evaluation-Criteria%29) that concrete quantum security estimates are more nuanced than a simple asymptotic comparison. | **Must migrate to new PQC algorithms** (**FIPS 203 ML-KEM** for key exchange, **FIPS 204 ML-DSA** for signatures), prioritized by each system's confidentiality lifetime and risk (see above). |
| **Symmetric Ciphers** (*AES-256, ChaCha20*) | **Grover's Algorithm** | Quadratic speedup (**O(sqrt(N))**); **halves** key-search security bits. | **Use 256-bit keys**. AES-256 itself does NOT need to be replaced with a new algorithm. |
| **Hash Functions** (*SHA-256/384/512 — no key, so "key size" doesn't apply*) | **Grover's Algorithm** (preimage); **BHT** (collision) | Halves preimage resistance (n bits &rarr; ~n/2); collision resistance drops less sharply, from the classical ~n/2-bit birthday bound to roughly ~n/3 bits under BHT. | Match the digest size to the idealized post-quantum preimage target you actually need, using the ~n/2 rule directly: **SHA-384** yields only **~192-bit** idealized post-quantum preimage resistance, not 256-bit — a full **256-bit** post-quantum preimage margin needs a **512-bit digest** (SHA-512, SHA3-512). SHA-256 (~128-bit post-quantum preimage resistance) remains fine for uses that don't need that margin. |

<div class="security-layer security-layer-protect">
  <div class="security-layer-label">PQC Migration Context</div>
  <div>
    <strong>Why PQC Migration is Required for Network Protocols</strong>
    <p>While AES-256 bulk payload encryption is quantum-safe, network protocols (<em>such as TLS 1.3</em>) rely on asymmetric key exchange (<em>classical ECDHE</em>) to establish and distribute the symmetric AES-256 session key. An adversary harvesting encrypted traffic today can use Shor's algorithm in the future to break the classical ECDHE key exchange, exposing the AES-256 key. Deploying <strong>Post-Quantum Key Encapsulation (FIPS 203 ML-KEM)</strong>, typically as a hybrid alongside classical ECDHE rather than a wholesale replacement, protects against that specific harvest-now-decrypt-later exposure — how quickly a given system needs to do so depends on its confidentiality-lifetime, threat horizon, protocol/library support, and any applicable regulatory profile, not a blanket "must deploy" for every system (see the risk-based framing above).</p>
  </div>
</div>

## The "Harvest Now, Decrypt Later" Attack Threat

Adversaries may be collecting and storing encrypted high-value enterprise traffic today (<strong>"Harvest Now, Decrypt Later"</strong>). If a suitable CRQC becomes available in the future, recorded traffic encrypted under classical RSA or ECDHE key exchanges could be decrypted retroactively.

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Harvest Now, Decrypt Later Mitigation</div>
  <div>
    <strong>Migration Urgency Scales With Data Confidentiality Lifetime</strong>
    <p>This is a risk-based, not a one-size-fits-all, decision: compare your data's required confidentiality lifetime against your organization's CRQC-arrival estimate and remaining migration lead time. Systems protecting data with long confidentiality lifetimes (commonly cited as 5+ years, though the right threshold depends on which CRQC-timeline estimate you plan against) should prioritize deploying <strong>hybrid post-quantum key exchange (X25519MLKEM768)</strong> soonest to reduce exposure to retroactive decryption of harvested traffic; systems handling only short-lived data can migrate on a longer timeline without immediate risk from harvest-now-decrypt-later.</p>
  </div>
</div>

## Finalized NIST PQC Standards (FIPS 203, 204, 205) & Draft FIPS 206

On August 13, 2024, NIST officially published the **finalized Federal Information Processing Standards (FIPS)** for Post-Quantum Cryptography: **FIPS 203 (ML-KEM)**, **FIPS 204 (ML-DSA)**, and **FIPS 205 (SLH-DSA)**. A fourth algorithm, **FN-DSA (Falcon)**, is currently under development as draft **FIPS 206**:

### Finalized PQC Standards (August 2024)

| FIPS Standard | Algorithm Name | Mathematical Paradigm | Target Function | Status & Primary Engineering Role |
|---|---|---|---|---|
| **FIPS 203** | **ML-KEM** (Kyber) | Module Lattice (ML-WE) | Key Encapsulation Mechanism (KEM) | **FINALIZED (Aug 2024)**: Primary standard for establishing a shared symmetric secret — the basis for TLS 1.3 key exchange and, wrapped in a KEM/DEM hybrid construction, general-purpose public-key encryption ([NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final)). ML-KEM is a KEM, not a drop-in replacement for RSA-OAEP-style direct message encryption — it only encapsulates/decapsulates a symmetric key. |
| **FIPS 204** | **ML-DSA** (Dilithium) | Module Lattice (ML-SIS) | General Digital Signatures | **FINALIZED (Aug 2024)**: Primary standard for general-purpose digital signatures and PKI ([NIST FIPS 204](https://csrc.nist.gov/pubs/fips/204/final)). |
| **FIPS 205** | **SLH-DSA** (SPHINCS+) | Stateless Hash Trees | Backup Digital Signatures | **FINALIZED (Aug 2024)**: Purely hash-based signature scheme providing conservative fallback safety ([NIST FIPS 205](https://csrc.nist.gov/pubs/fips/205/final)). |

### Standards Under Development (Draft)

| Draft Standard | Algorithm Name | Mathematical Paradigm | Target Function | Status & Primary Engineering Role |
|---|---|---|---|---|
| **Draft FIPS 206** | **FN-DSA** (Falcon) | Fast-Fourier Lattice | Compact Digital Signatures | **UNDER DEVELOPMENT**: Draft standard optimized for compact signatures in constrained memory environments. |

### Backup KEM: HQC

In March 2025, NIST [selected **HQC** (Hamming Quasi-Cyclic)](https://www.nist.gov/news-events/news/2025/03/nist-selects-hqc-fifth-algorithm-post-quantum-encryption) as a fifth PQC algorithm, intended as a structurally independent backup to ML-KEM. Where ML-KEM's security rests on module-lattice problems, HQC is code-based — built on error-correcting codes rather than lattices — so a future cryptanalytic advance against lattice problems would not automatically compromise HQC as well. NIST has not yet finalized an HQC FIPS standard; a draft is expected to work through the standard NIST public-review process. Treat HQC as a diversification hedge for the KEM layer rather than a near-term deployment target until a finalized standard exists.

## NSA CNSA 2.0 Timeline & Transition Strategy (National Security Systems)

For U.S. **National Security Systems (NSS)** subject to Commercial National Security Algorithm Suite 2.0 (**[NSA CNSA 2.0](https://media.defense.gov/2025/May/30/2003728741/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS.PDF)**) guidance, the NSA outlines target adoption timelines and Commercial Solutions for Classified (CSfC) capability package milestones:

- **Software &amp; Firmware Signing**: Preference starting 2025; exclusive PQC use by **2030**.
- **Traditional Networking Equipment**: Preference starting 2026; exclusive PQC use by **2030**.
- **Web Browsers, Servers &amp; Cloud Services**: Preference starting 2025; exclusive PQC use by **2033**.
- **Operating Systems**: Preference starting 2027; exclusive PQC use by **2033**.
- **Niche Equipment &amp; Large PKI**: Preference starting 2030; exclusive PQC use by **2033**.
- **Custom &amp; Legacy Equipment**: Update or replace by **2033** per [NSA CNSA 2.0 Advisory](https://media.defense.gov/2025/May/30/2003728741/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS.PDF).

## Hybrid Cryptography Transition Pattern

To hedge against implementation bugs in new lattice-based algorithms, production protocols (*TLS 1.3, SSHv2, Signal*) deploy **Hybrid Key Exchange**:

`Shared Secret S = KDF(Classical_ECDH_Secret || PostQuantum_KEM_Secret)`

In TLS 1.3, the IETF has defined the **`X25519MLKEM768`** hybrid group (IANA codepoint `0x11EC`, combining classical Curve25519 ECDH with FIPS 203 ML-KEM-768) in **[RFC 10024](https://www.rfc-editor.org/info/rfc10024)**, *"Post-Quantum Traditional (PQ/T) Hybrid Key Agreement Mechanisms for TLS 1.3"* — published as a Proposed Standard on August 10, 2026. The same document also defines `SecP256r1MLKEM768` and `SecP384r1MLKEM1024` as related hybrid groups; `X25519MLKEM768` is the one marked "Recommended."

The hybrid formula above is intentionally simplified: production hybrid combiners bind more than the two raw secrets. `X25519MLKEM768`'s actual construction concatenates the ML-KEM shared secret and the X25519 shared secret in a fixed order (PQC secret first) as input to TLS 1.3's existing HKDF pipeline. This fixed ordering is protocol-defined and matters for interoperability and for matching the applicable compliance construction — implementations on both ends must agree on the exact byte layout being fed into HKDF, or the derived keys won't match at all. These two properties are separate and shouldn't be conflated: the *shared secrets* (ML-KEM's and X25519's raw outputs) are inputs to the TLS key schedule, concatenated and fed through HKDF — they aren't themselves transcript messages. The *transmitted key shares* (the client's ML-KEM encapsulation key and X25519 share, and the server's ML-KEM ciphertext and X25519 share) are what actually appear in the handshake messages, and those messages are what's covered and authenticated by the handshake transcript (per the mechanics described on the TLS Handshake page).

## Crypto Agility & PQC Migration: Engineering Practicalities

Migrating a real system is a program of work, not a library upgrade. Several practical constraints determine how long that program actually takes:

- **Cryptographic inventory first**: Before scheduling any migration, an organization needs a current inventory of *where* classical algorithms are used — TLS termination points, VPN concentrators, code-signing pipelines, embedded device firmware, archived long-term backups, hardware tokens — because PQC readiness varies wildly across these categories and a migration plan without an inventory tends to discover the hardest cases (firmware that can't be updated, HSMs without PQC firmware) last, not first.
- **Downgrade prevention**: A hybrid deployment that negotiates PQC when both sides support it but silently falls back to classical-only key exchange when either side doesn't is only as strong as its downgrade resistance — an active attacker who can manipulate the handshake to make both sides believe the peer lacks PQC support forces the classical-only path, reintroducing harvest-now-decrypt-later exposure. TLS 1.3's transcript-hash-covered `ServerHello`/`HelloRetryRequest` mechanics are what make such downgrades detectable; ad hoc hybrid retrofits onto older protocols may not have an equivalent binding and need explicit design attention.
- **Hybrid-combiner semantics**: As shown above, *how* two shared secrets are combined is itself a security-relevant design decision, not an implementation detail — a hybrid combiner needs to guarantee security if *either* input secret is strong (so a break in ML-KEM alone, or in X25519 alone via a future classical advance, doesn't compromise the session). Rolling a custom combiner instead of using a standardized one (like TLS 1.3's HKDF-based construction) risks losing that guarantee.
- **Certificate and message-size impact**: PQC public keys and signatures are substantially larger than their classical counterparts — an ML-DSA-65 public key is roughly 2 KB versus ~32 bytes for an Ed25519 key, and ML-DSA signatures run several KB versus Ed25519's 64 bytes. Composite or dual-algorithm certificates compound this further. This inflates TLS handshake sizes, certificate chain sizes, and any protocol that embeds public keys or signatures inline (DNSSEC records, code-signing manifests, blockchain transactions).
- **MTU fragmentation**: The larger handshake messages above matter differently depending on the transport. Over plain TCP, a bigger `ClientHello`/`ServerHello` flight can trigger TCP segmentation that some middleboxes handle poorly. Over QUIC specifically, [RFC 9001](https://www.rfc-editor.org/rfc/rfc9001.html) already divides the TLS handshake into `CRYPTO` frames that QUIC packetizes independently of any single IP MTU, and [RFC 9000 §14](https://www.rfc-editor.org/rfc/rfc9000.html#section-14) directs QUIC implementations to avoid IP-layer fragmentation in the first place (via Datagram Packetization Layer PMTU Discovery) — so larger PQC handshakes don't inherently "force fragmentation at the UDP/QUIC layer" the way they can over raw TCP; they do mean more packets/frames and a larger overall handshake byte count, which is its own capacity-planning concern. Networks and load balancers tuned for classical-sized handshakes may still need buffer-size or packet-count adjustments as PQC and hybrid key exchange roll out.
- **Validation-module readiness**: Regulated environments requiring FIPS 140-3 validated cryptographic modules are gated by NIST's validation program timeline for PQC implementations specifically — an algorithm being a finalized FIPS standard (203/204/205) does not mean every vendor's *module* implementing it has completed FIPS validation yet. Procurement and compliance timelines should track module-level validation status, not just algorithm standardization status.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>FIPS 203/204/205 are finalized post-quantum standards; a cryptographically relevant quantum computer capable of running Shor's algorithm against RSA/ECC doesn't exist yet, but harvest-now-decrypt-later risk means long-lived confidential data needs hybrid PQC migration planning now. CNSA 2.0's stricter timeline applies specifically to U.S. National Security Systems, not systems generally.</p>
</div>

## Primary references

- **NIST FIPS 203**: *Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM)* — [NIST CSRC FIPS 203 Final](https://csrc.nist.gov/pubs/fips/203/final)
- **NIST FIPS 204**: *Module-Lattice-Based Digital Signature Standard (ML-DSA)* — [NIST CSRC FIPS 204 Final](https://csrc.nist.gov/pubs/fips/204/final)
- **NIST FIPS 205**: *Stateless Hash-Based Digital Signature Standard (SLH-DSA)* — [NIST CSRC FIPS 205 Final](https://csrc.nist.gov/pubs/fips/205/final)
- **NSA CNSA 2.0**: *Commercial National Security Algorithm Suite 2.0 Cybersecurity Advisory (Version 1.0, September 2022; current hosted copy)* — [NSA CNSA 2.0 Advisory PDF](https://media.defense.gov/2025/May/30/2003728741/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS.PDF)
- **RFC 10024**: *Post-Quantum Traditional (PQ/T) Hybrid Key Agreement Mechanisms for TLS 1.3 (X25519MLKEM768 and related groups)* — [RFC Editor: RFC 10024](https://www.rfc-editor.org/info/rfc10024)
