---
title: Recommended Algorithms & Regional Standards
description: My dated cryptographic-algorithm selection notes, including NIST transitions, post-quantum standards, and jurisdiction-specific requirements.
permalink: /topics/recommended-algorithms/
last_verified: 2026-08-05
---

<span class="eyebrow">Cryptography / Reference</span>

# Recommended Algorithms & Regional Standards

<p class="lede">This is a dated lookup page, not a timeless recommendation. Before I choose an algorithm I need the security strength, the exact operation, protocol interoperability, data lifetime, implementation support, and any regulator or customer profile that applies.</p>

## By use case

- [Current NIST-oriented selection table](#nist-recommended-algorithms-and-how-long-theyre-good-for)
- [Legacy algorithms and the actual failure reason](#legacy-and-broken-algorithms-whats-actually-wrong-with-each)
- [Post-quantum and CNSA transition notes](#the-post-quantum-clock-why-what-nist-approved-and-what-to-actually-do-with-it)
- [China-specific SM algorithm notes](#china-the-shangmi-sm-algorithm-suite)

## NIST-recommended algorithms, and how long they're good for

Per **[NIST SP 800-57 Part 1 Rev. 5](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)** and **[SP 800-131A Rev. 2](https://csrc.nist.gov/publications/detail/sp/800-131a/rev-2/final)**:

| Algorithm | Recommended parameters | Security strength | Guidance |
|---|---|---|---|
| **AES** | AES-128 or AES-256 | 128-bit / 256-bit | [FIPS 197](https://csrc.nist.gov/pubs/fips/197/final) defines both; select the size through the protocol profile, security strength, and data lifetime |
| **RSA** | At least 2048 bits | 112-bit at 2048, 128-bit at 3072 | RSA-2048 remains acceptable in final SP 800-131A Rev. 2; use the final guidance and required protection period to plan migration |
| **ECDSA / ECDH** | P-224 | 112-bit | Accepted by current final guidance for some uses, but provides less margin than P-256 |
| **ECDSA / ECDH** | **P-256** | 128-bit | Common approved choice—see [Asymmetric Cryptography]({{ '/topics/asymmetric-cryptography/' | relative_url }}) |
| **ECDSA / ECDH** | P-384 | 192-bit | Higher-strength approved option; choose it when the protocol, lifetime, and interoperability justify it |
| **SHA-2** | SHA-256 / 384 / 512 | Collision: 128 / 192 / 256-bit; preimage: up to digest length | [FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/final) — current standard, no known practical attacks |

SHA-1 and 3DES/TDEA are deliberately left out of this table — both are disallowed rather than recommended; see [Legacy and broken algorithms](#legacy-and-broken-algorithms-whats-actually-wrong-with-each) directly below for why.

The 2030 transition language around 112-bit strength is a planning horizon, not a mathematical expiry date. I must distinguish final SP 800-131A Rev. 2 from the Rev. 3 draft, then check the final rule in force for the system's deployment and data lifetime.

## Legacy and broken algorithms: what's actually wrong with each

The table above is what to use; this is why the alternatives are gone. Every entry here was a real, deployed default at some point — none of them failed because someone picked a bad algorithm carelessly, they failed because time, cheaper compute, or better cryptanalysis caught up with a design that was reasonable when it shipped.

| Algorithm | Type | Status | Why |
|---|---|---|---|
| **ROT13** | Substitution cipher | Never secure | A fixed 13-letter rotation — reversible by definition, with no key at all. Never intended as real encryption, only as casual obfuscation (spoiler text, puzzle answers) |
| **DES** | Block cipher, 56-bit key | Broken | The EFF's [Deep Crack](https://w2.eff.org/Privacy/Crypto/Crypto_misc/DESCracker/) brute-forced a DES key in 56 hours in 1998, then in 22 hours in 1999 with distributed.net's help — a 56-bit keyspace is small enough for dedicated hardware from *1998* |
| **3DES / TDEA** | Block cipher, 64-bit blocks | Disallowed for applying cryptographic protection; legacy processing may have narrower allowances | A 64-bit block reaches the birthday region after roughly \(2^{32}\) blocks (about 32 GiB). [Sweet32](https://sweet32.info/) demonstrated a practical browser attack after collecting hundreds of gigabytes; 785 GB is an attack-data figure, not the mathematical collision threshold |
| **Blowfish** | Block cipher, 64-bit blocks | Not recommended for new use | Same 64-bit block-size exposure as 3DES (Sweet32 names it directly); superseded by its own successor Twofish, and by AES |
| **RC4** | Stream cipher | Broken, formally prohibited in TLS | Statistical keystream biases known since 1995; the 2013 Royal Holloway and 2015 Bar Mitzvah attacks made them practically exploitable against real HTTPS traffic — [RFC 7465](https://www.rfc-editor.org/rfc/rfc7465) (2015) bans RC4 in TLS outright |
| **MD5** | Hash | Broken | Practical collisions since 2004 — see [Hash Functions & MACs]({{ '/topics/hash-functions-macs/' | relative_url }}#sha-2-sha-3-and-the-broken-ones) for the mechanism and a real collision demo |
| **SHA-1** | Hash | Broken | The 2017 "SHAttered" collision — see [Hash Functions & MACs]({{ '/topics/hash-functions-macs/' | relative_url }}#sha-2-sha-3-and-the-broken-ones) |

These algorithms failed for different reasons. DES mainly lost its key-size margin; 64-bit block ciphers ran into birthday-bound limits at modern traffic volumes; MD5 and SHA-1 suffered collision cryptanalysis; RC4 has structural keystream biases. I should not reduce all of them to “time and compute caught up”.

## The post-quantum clock: why, what NIST approved, and what to actually do with it

Quantum computers threaten cryptography through two specific algorithms, not through some general "quantum magic":

- **Shor's algorithm** efficiently factors large integers and solves the discrete logarithm problem — the exact hard problems [RSA and ECC/ECDSA/ECDH]({{ '/topics/asymmetric-cryptography/' | relative_url }}#the-two-main-families-rsa-and-ecc) rely on. A sufficiently large, stable quantum computer running Shor's algorithm doesn't weaken RSA or ECC gradually — it breaks them outright, in roughly the time it takes to run the algorithm.
- **Grover's algorithm** gives a quadratic speedup on brute-force search, which cuts a symmetric key's *effective* security strength in half rather than breaking it completely — AES-256 degrades to roughly AES-128-equivalent strength under a quantum attacker, not to nothing. This is exactly why AES-256 (not AES-128) is the recommended quantum hedge in the table above.

NIST has already standardized the replacements for the Shor's-algorithm-vulnerable half of the problem:

| Standard | Algorithm | Role |
|---|---|---|
| **[FIPS 203](https://csrc.nist.gov/pubs/fips/203/final)** | ML-KEM (based on CRYSTALS-Kyber) | Standardized post-quantum key-encapsulation mechanism |
| **[FIPS 204](https://csrc.nist.gov/pubs/fips/204/final)** | ML-DSA (based on CRYSTALS-Dilithium) | Standardized post-quantum digital-signature scheme |
| **[FIPS 205](https://csrc.nist.gov/pubs/fips/205/final)** | SLH-DSA (based on SPHINCS+) | Stateless hash-based signature scheme whose security analysis relies on several properties of the underlying hash functions, including preimage, second-preimage, and collision resistance—not collision resistance alone |

The NSA's **[CNSA 2.0 advisory](https://media.defense.gov/2025/May/30/2003728741/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS.PDF)** sets technology-specific transition expectations for US National Security Systems. The advisory originally used the pre-standardization Kyber/Dilithium names; later profiles map these to selected high-security ML-KEM/ML-DSA parameters. The dates are not one four-step schedule for every system:

| Technology class | Advisory timing |
|---|---|
| Software/firmware signing | Support and prefer CNSA 2.0 by 2025; exclusive use by 2030 |
| Networking equipment | Support and prefer by 2026; exclusive use by 2030 |
| Operating systems, web/browser/server and cloud services | Support/prefer between 2025–2027; exclusive use by 2033 |
| Niche equipment, custom applications, and legacy equipment | Support/replace according to the class, generally completing by 2033 |
| Overall NSS objective | Complete the quantum-resistant transition by 2035 |

This is a defense-specific timeline, stricter than general civilian guidance — but the underlying reason applies to any long-lived signing key or long-retained encrypted archive regardless of sector: data encrypted today with classical algorithms can be recorded now and decrypted later once a sufficiently capable quantum computer exists ("harvest now, decrypt later"), which is exactly why the deadline that matters is when the *data* needs to stay confidential, not when quantum computers arrive.

**Where this is already happening, not just planned**: the real `X25519MLKEM768` TLS 1.3 handshake captured on the [TLS/SSL Handshake]({{ '/topics/tls-ssl-handshake/' | relative_url }}#practical-demo-inspecting-a-real-handshake) page — a hybrid classical-plus-post-quantum key exchange already live in production traffic — is the same FIPS 203 algorithm referenced above, combined with classical X25519 so that breaking either half alone isn't enough to compromise the session. Beyond TLS, the same urgency applies to long-lived code-signing keys, firmware signatures meant to remain trusted for a decade or more, and any government or financial system already covered by CNSA 2.0.

## China: the ShangMi (SM) algorithm suite

China standardizes a distinct set of domestically designed commercial cryptographic algorithms. Whether support or certification is mandatory depends on the product, sector, procurement, data classification, and regulation; I should not describe the whole country or every service as having one blanket mandate.

| Algorithm | Type | International equivalent |
|---|---|---|
| **SM2** | Elliptic-curve public-key (signatures, key exchange) | ECDSA / ECDH |
| **SM3** | Cryptographic hash | SHA-256 |
| **SM4** | Symmetric block cipher | AES |
| **SM9** | Identity-based cryptography (keys derived from identity, no certificate needed) | No direct NIST equivalent |
| **ZUC** | Stream cipher | Used in mobile/LTE encryption, comparable role to ChaCha20 in that context |

Products in regulated or government procurement contexts may need the relevant SM algorithms and Chinese commercial-cryptography certification. The [Institute of Commercial Cryptography Standards notice](https://niccs.org.cn/niccs/Notice/pc/content/content_1937429502295019520.html) is a starting point, but the exact obligation must be checked against the applicable Chinese law, sector rule, and procurement profile. I should avoid forecasting a national PQC completion date from a secondary news report.

## Common pitfalls

- **Treating "NIST-approved" as a universal global mandate** — it's the US federal baseline, widely adopted elsewhere by convention, but not a legal requirement everywhere; China's Cryptography Law is a direct counterexample.
- **Treating "acceptable through 2030" as a hard cliff** — it's a re-evaluated planning horizon, not an expiration date built into the math itself.
- **Deferring post-quantum planning because "quantum computers aren't here yet"** — irrelevant for harvest-now-decrypt-later risk on any data that must stay confidential past the point a capable quantum computer plausibly exists.
- **Assuming a single global algorithm choice satisfies every regulator** — a product sold into both US federal and Chinese regulated markets may need to support two entirely separate approved suites simultaneously.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final">NIST SP 800-57 Part 1 Rev. 5</a></strong> and final <strong><a href="https://csrc.nist.gov/pubs/sp/800/131/a/r2/final">SP 800-131A Rev. 2</a></strong> define the current key-size and transition guidance; Rev. 3 remains a draft as of this update. <strong><a href="https://csrc.nist.gov/pubs/fips/203/final">FIPS 203</a></strong>, <strong><a href="https://csrc.nist.gov/pubs/fips/204/final">FIPS 204</a></strong>, and <strong><a href="https://csrc.nist.gov/pubs/fips/205/final">FIPS 205</a></strong> define ML-KEM, ML-DSA, and SLH-DSA. <a href="https://sweet32.info/">Sweet32</a>, <a href="https://www.rfc-editor.org/rfc/rfc7465">RFC 7465</a>, and the <a href="https://media.defense.gov/2025/May/30/2003728741/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS.PDF">NSA CNSA 2.0 advisory</a> support the transition notes above.</p>
</div>
