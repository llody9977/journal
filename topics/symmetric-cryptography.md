---
title: Symmetric Cryptography
description: Comprehensive guide to AES block ciphers, stream ciphers (ChaCha20), modes of operation (ECB, CBC, CTR, GCM, AES-GCM-SIV), and Grover's quantum search.
permalink: /topics/symmetric-cryptography/
last_verified: 2026-08-13
---

<span class="eyebrow">Cryptography / Concepts</span>

# Symmetric Cryptography

<p class="lede">In symmetric cryptography, both communicating parties share an identical secret key used for both encryption and decryption. Symmetric ciphers provide high-throughput bulk encryption, but rely on external mechanisms (such as asymmetric key exchange or Key Management Services) to solve the initial key-distribution problem.</p>

## Core Principles: One Key, Both Directions

Symmetric encryption transforms readable plaintext into unreadable ciphertext using a secret key **K**. The identical key **K** is required to decrypt the ciphertext back into plaintext.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/symmetric-flow.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the symmetric flow diagram at full size">
    <img src="{{ '/assets/img/symmetric-flow.svg' | relative_url }}" alt="Diagram showing AES-256-GCM symmetric encryption: the sender encrypts plaintext under a pre-established shared key K with a CSPRNG-generated IV, producing ciphertext plus an authentication tag that crosses an untrusted network; the receiver decrypts under the same key K and verifies the tag before releasing the plaintext.">
  </a>
  <p class="diagram-caption">AES-256-GCM authenticated encryption workflow: pre-established shared key K, CSPRNG IV generation, AEAD tag generation, and tamper rejection</p>
</div>

### Advantages & Limitations

- **High Speed & Low Overhead**: Hardware-accelerated CPU instructions (Intel/AMD AES-NI, ARMv8 Cryptography Extensions) make symmetric ciphers substantially faster than asymmetric operations of comparable security strength.
- **Key Distribution Problem**: Peer endpoints must securely share key **K** prior to communication. Over an untrusted channel, this is commonly solved with asymmetric key exchange (**[ECDHE]({{ '/topics/key-exchange-derivation/' | relative_url }})**), but it is not the only mechanism — pre-shared keys (PSKs), a trusted key distribution center (KDC, as in Kerberos), or secure out-of-band distribution are also used, particularly where asymmetric infrastructure is unavailable or undesirable.
- **No Per-Party Non-Repudiation**: Because both parties hold key **K**, either party could have generated a specific MAC tag. Symmetric MACs provide integrity and authentication by some holder of the shared key, but cannot uniquely attribute one party or provide legal non-repudiation.

## Block Ciphers vs Stream Ciphers

Symmetric ciphers operate under two distinct mathematical paradigms:

1. **Block Ciphers (*e.g., AES*)**: Process plaintext in fixed-size blocks (128 bits / 16 bytes). Data is transformed through multiple rounds of substitution and permutation. Unauthenticated block modes (such as CBC) require padding to align input data to 16-byte boundaries.
2. **Stream Ciphers (*e.g., ChaCha20*)**: Process plaintext as a continuous stream of arbitrary length. The cipher generates a pseudo-random keystream of bytes that is XORed directly with plaintext. No block alignment or padding is required.

| Dimension | Block Ciphers (*e.g., AES*) | Stream Ciphers (*e.g., ChaCha20*) | Engineering Trade-off & Guidance |
|---|---|---|---|
| **Execution Mechanics** | Permutation-Substitution network per 128-bit block | Generates pseudo-random keystream XORed with plaintext | Block ciphers require complex S-Box substitutions; stream ciphers perform fast bitwise XOR. |
| **Modern Standards** | **AES-256-GCM** ([FIPS 197](https://csrc.nist.gov/pubs/fips/197/final) / [NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final)) | **ChaCha20-Poly1305** ([RFC 8439](https://www.rfc-editor.org/rfc/rfc8439)) | AES-256-GCM is a NIST FIPS-approved AEAD construction. ChaCha20-Poly1305 is an IRTF/CFRG-defined AEAD ([RFC 8439](https://www.rfc-editor.org/rfc/rfc8439), an Informational RFC — not IETF Standards Track) that is not itself a NIST-approved algorithm under FIPS 140, though it is widely permitted and deployed, e.g., as a TLS 1.3 cipher suite. |
| **Operational Unit** | Fixed-size data blocks (128 bits / 16 bytes) | Continuous byte/bit stream | Stream ciphers accept arbitrary payload lengths without block alignment overhead. |
| **Padding Requirements** | Required for block modes like CBC; not required for GCM/CTR | None required | Padding oracle attacks occur when unauthenticated block padding is parsed. |
| **Primary Real-World Use Cases** | Database field encryption, cloud storage volumes (EBS/LUKS2 via AES-XTS), high-throughput server TLS 1.3 with hardware AES acceleration (AES-NI / ARMv8 Crypto Extensions). | Real-time video/audio streaming, low-latency mobile apps, VPN tunnels (WireGuard), embedded IoT microcontrollers lacking hardware AES acceleration. | Select AES-256-GCM on hardware with AES acceleration (Intel/AMD AES-NI or ARMv8 Cryptography Extensions — present in most modern server and mobile CPUs, including Apple Silicon and AWS Graviton); select ChaCha20-Poly1305 for CPUs without hardware AES support (e.g., budget or embedded cores). |

## AES Architecture & Round Transformation Pipeline (FIPS 197)

Standardized by NIST in **[FIPS 197](https://csrc.nist.gov/pubs/fips/197/final)**, the **Advanced Encryption Standard (AES)** encrypts 128-bit (16-byte) plaintext blocks by loading data into a 4×4 byte state matrix **S** and processing it through repeated transformation rounds:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/aes-round-operations.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the aes round operations diagram at full size">
    <img src="{{ '/assets/img/aes-round-operations.svg' | relative_url }}" alt="AES encryption sequence showing an initial AddRoundKey, repeated main rounds containing SubBytes, ShiftRows, MixColumns, and AddRoundKey, and a final round that omits MixColumns.">
  </a>
  <p class="diagram-caption">AES encryption sequence: initial key addition, N−1 complete transformation rounds, then a final round without MixColumns</p>
</div>

### Detailed Round Execution Steps

1. **State Matrix Loading & Initial Round**: The 16-byte plaintext block is loaded into a 4×4 byte matrix. An initial `AddRoundKey` operation XORs the state matrix directly with the first round key (<b>K<sub>0</sub></b>).
2. **Main Iterative Loop (Rounds 1 to N-1)**:
   - **SubBytes**: Non-linear byte substitution using a lookup table (S-Box) to destroy linear relationships between key and ciphertext bits.
   - **ShiftRows**: Cyclically shifts the bytes in rows 1, 2, and 3 of the state matrix by 1, 2, and 3 byte positions to diffuse bits across columns.
   - **MixColumns**: Performs matrix multiplication over Galois Field **GF(2^8)** to mix all 4 bytes in each column, ensuring single-bit plaintext changes diffuse across the entire state.
   - **AddRoundKey**: XORs the state matrix with the unique round key (<b>K<sub>i</sub></b>) derived from the key schedule.
3. **Final Round (Round N)**:
   - Executes **SubBytes** → **ShiftRows** → **AddRoundKey** (*the MixColumns step is explicitly omitted in the final round*).
4. **Ciphertext Output**: Emits the transformed 4×4 state matrix as a 128-bit ciphertext block.

| AES Variation | Key Length | Processing Rounds (N) | Total Round Keys Required | Idealized Grover Query Complexity |
|---|---|---|---|---|
| **AES-128** | 128 bits | 10 rounds | 11 round keys (176 bytes) | ~2^64 ideal sequential queries; not a concrete practical security-strength rating. AES-128 remains NIST's Category 1 comparison baseline. |
| **AES-192** | 192 bits | 12 rounds | 13 round keys (208 bytes) | ~2^96 ideal sequential queries; concrete cost also depends on the quantum implementation and available resources. |
| **AES-256** | 256 bits | 14 rounds | 15 round keys (240 bytes) | ~2^128 ideal sequential queries; provides additional margin where a profile, threat model, or long protection lifetime justifies it. |

## Grover's Quantum Algorithm Impact: Query Bounds vs. Practical Strength

A common shorthand says that Grover's algorithm "halves" the security bits of a symmetric key. That describes the exponent in an ideal sequential query model; it is not a concrete estimate of the time, hardware, or fault-tolerant quantum resources needed to attack AES.

### Classical Brute-Force vs Grover's Quantum Search

1. **Classical Brute-Force Complexity**: To guess a secret key of length **n** bits, a classical computer must test keys one by one. Finding a 128-bit key takes **2^128** operations in the worst case, which is computationally infeasible (**2^128 ≈ 3.4 × 10^38** attempts).
2. **Grover's Quantum Acceleration**: Grover's algorithm running on a Cryptographically Relevant Quantum Computer (CRQC) performs an unstructured search over **N** possibilities in **O(sqrt(N))** sequential oracle queries. Turning those queries into an AES attack additionally requires a reversible AES oracle, sufficient circuit depth, error correction, qubits, and wall-clock time. Parallelization trades hardware against depth and does not preserve the simple one-processor headline unchanged.
3. **Impact on Symmetric Keys**:
   - Taking the square root of **2^n** key combinations yields **sqrt(2^n) = 2^(n/2)**.
   - **AES-128**: The ideal query exponent falls from 128 to 64. This does not make AES-128 equivalent to a practical classical 64-bit primitive. NIST continues to use the work needed to attack AES-128 as its Category 1 PQC comparison baseline because concrete quantum cost includes substantially more than the query count.
   - **AES-256**: The ideal query exponent falls from 256 to 128. AES-256 therefore supplies a larger asymptotic margin, but even this value is a query bound rather than a promise that a practical attack costs exactly **2^128** ordinary operations.

Select AES key size from the applicable protocol, compliance profile, protection lifetime, and threat model. AES-128 remains an approved and meaningful post-quantum comparison baseline; AES-256 is appropriate when the design needs additional margin and the protocol and implementation support it. Grover's algorithm does not by itself require replacing AES with a different symmetric cipher.

## Cipher Modes of Operation: ECB vs CBC vs CTR vs GCM

AES alone only encrypts a single 128-bit block. Modes of operation chain multiple blocks together:

| Mode | Operational Mechanics | Security Status & Failure Mode | Target Engineering Recommendation |
|---|---|---|---|
| **CBC (Cipher Block Chaining)** | XORs plaintext block with previous ciphertext block | **LEGACY / HIGH RISK**: Requires unpredictable IV. Vulnerable to padding-oracle attacks unless composed as genuine **Encrypt-then-MAC** — a separate MAC key, computed over the IV and ciphertext (not the plaintext), verified before any decryption is attempted. Pairing CBC with an HMAC in the wrong order (**MAC-then-encrypt**) does not fix this: [RFC 7366](https://www.rfc-editor.org/rfc/rfc7366.html) documents MAC-then-encrypt CBC ciphersuites as vulnerable to exactly this class of attack, which is why it specifies Encrypt-then-MAC as the remedy. | Replace with AES-GCM or AES-GCM-SIV. |
| **CTR (Counter Mode)** | Encrypts incrementing counter to generate keystream | **STREAM MODE**: Fast, parallelizable. Nonce reuse completely breaks confidentiality. | Do not use plain CTR without an authentication tag (HMAC). |
| **ECB (Electronic Codebook)** | Encrypts each block independently | **CRITICAL FAILURE FOR GENERAL DATA**: Identical plaintext blocks produce identical ciphertext blocks, leaking structural patterns whenever a payload spans more than one block with repeating or predictable content — the overwhelmingly common case. | **AVOID FOR GENERAL-PURPOSE ENCRYPTION**: Do not use ECB to encrypt structured, multi-block, or patterned data; prefer AES-GCM or AES-GCM-SIV. Narrow exceptions exist in specialist constructions (e.g., single-block encryption of already-random/high-entropy values, certain key-wrapping schemes), but these are not general-purpose use and should not be treated as license to use ECB elsewhere. |
| **GCM (Galois/Counter Mode)** | CTR encryption + GHASH Galois authentication tag | **RECOMMENDED AEAD**: Provides confidentiality, integrity, and authenticity in one pass. | AES-128-GCM is TLS 1.3's mandatory-to-implement cipher suite ([RFC 9846 §9.1](https://www.rfc-editor.org/rfc/rfc9846.html#section-9.1)) and AES-256-GCM is commonly negotiated alongside it — but TLS 1.3 also defines ChaCha20-Poly1305 and AES-CCM suites, so "GCM" isn't the protocol's single fixed default. Standard choice for cloud database encryption. Widely supported and commonly negotiated in SSH ([RFC 5647](https://www.rfc-editor.org/rfc/rfc5647)), but not universally SSH's default — e.g., OpenSSH's own default cipher preference list places `chacha20-poly1305@openssh.com` ahead of the AES-GCM variants, and the effective default varies by implementation, version, and negotiated order. |

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/ecb-pattern-leak.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the ecb pattern leak diagram at full size">
    <img src="{{ '/assets/img/ecb-pattern-leak.svg' | relative_url }}" alt="ECB pattern leak comparison showing how ECB mode leaks image structure while CTR/GCM output appears completely random.">
  </a>
  <p class="diagram-caption">ECB mode pattern leak vs CTR/GCM randomized output</p>
</div>

## Authenticated Encryption with Associated Data (AEAD)

Unauthenticated encryption (such as plain AES-CBC) provides confidentiality but leaves payload bytes vulnerable to bit-flipping and padding oracle attacks. **AEAD constructions** generate a cryptographic authentication tag over both the ciphertext and unencrypted header metadata (Associated Data); the permitted tag length depends on the specific construction and protocol profile (see the tag-length table below) rather than being fixed at 128 bits universally.

### Associated Data (AAD): Authenticated, Not Encrypted

The "AD" in AEAD is easy to gloss over, but it's doing real work. **Additional Authenticated Data (AAD)** — also called Associated Data — is data the tag authenticates without encrypting — it travels alongside the ciphertext in plaintext, readable by anyone, but any change to it (by even one bit) makes tag verification fail on decryption, exactly like tampering with the ciphertext itself would. This is the mechanism protocols use to bind unencrypted framing to an encrypted payload: a TLS record's header (content type, version, length), a packet's sequence number, a protocol version tag, or a routing header that a middlebox needs to read can all ride as AAD — visible where they need to be, but not silently swappable without breaking authentication.

Two engineering details matter in practice:
- **AAD must be reproduced byte-for-byte at decryption time.** The decrypting side doesn't receive the AAD "inside" the ciphertext — it must independently supply the exact same AAD bytes it expects to have been authenticated, and the AEAD primitive checks that they match what was used at encryption time. Any mismatch (including a subtly different serialization of logically identical data — see canonical serialization) fails the tag check.
- **AAD belongs in your envelope design, not as an afterthought.** A well-formed encrypted envelope generally needs, at minimum: the nonce/IV, the ciphertext, the authentication tag, and enough metadata to know how to decrypt correctly later — a format/algorithm identifier and a version number are the common ones, and either travel as AAD (authenticated, catching a downgrade or misinterpretation attempt) or are otherwise cryptographically bound to the ciphertext. Storing that metadata unauthenticated alongside the ciphertext (not as AAD, just as loose accompanying data) reopens exactly the kind of tampering AEAD exists to prevent — an attacker could flip the algorithm identifier and trick a decrypter into misinterpreting the ciphertext.

### Critical AEAD Rules & Nonce Safety

1. **Never Reuse Nonces**: Reusing a 96-bit GCM nonce with the same key destroys authenticity — it allows adversaries to recover the GHASH authentication key and forge authentication tags — and separately destroys confidentiality the same way CTR-mode nonce reuse does: because GCM's encryption core is CTR mode, two ciphertexts under the repeated nonce reveal the XOR of their plaintexts (**P<sub>1</sub> &oplus; P<sub>2</sub>**). Recovering either full plaintext from that XOR still requires the attacker to know or correctly guess predictable content in the other message, not just observe the reused nonce.
2. **Deploy Synthetic IV (AES-GCM-SIV / RFC 8452) for Misuse Resistance**: When unique nonces cannot be guaranteed (*e.g., distributed stateless microservices*), deploy **AES-GCM-SIV ([RFC 8452](https://www.rfc-editor.org/rfc/rfc8452))**. If the same **(key, nonce)** pair is accidentally reused across two encryptions, AES-GCM-SIV's degraded failure mode leaks only whether the **(plaintext, AAD)** pair was also identical between those two encryptions — matching ciphertext reveals a repeat, without exposing the authentication key or any plaintext content beyond that equality signal.
3. **Never Release Unauthenticated Plaintext**: An implementation may decrypt internally before checking the tag — that ordering is an implementation detail — but it must not release or act on that plaintext (return it to the caller, write it to disk, parse it) until tag verification succeeds. What matters is the release/action gate, not literally sequencing "verify" before "decrypt" at the instruction level.

### AEAD Operational Limits in Production

Nonce uniqueness is necessary but not sufficient — deploying AEAD at scale means respecting several numeric limits baked into the security proof, not just the algorithm's basic correctness:

| Limit | Bound & Rationale | Engineering Consequence |
|---|---|---|
| **Per-invocation plaintext size** | AES-GCM: **2^39-256 bits (~64 GiB)** per single encryption call — this is a defined security/usage bound specified directly by [NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final), not a description of some internal structure degrading past that point; the standard simply doesn't specify or guarantee GCM's security properties beyond it. | Chunk very large payloads (multi-GB backups, disk images) into multiple AEAD-encrypted segments rather than one call. |
| **Invocations per key (random nonces)** | [NIST SP 800-38D §8.3](https://csrc.nist.gov/pubs/sp/800/38/d/final) specifies, for the RBG-based (random) 96-bit IV construction, that the total number of invocations across all instances using a given key **shall not exceed 2^32** — an exact stated requirement bounding nonce-collision probability, not an approximation or merely a suggestion. | Rotate keys on a volume- or count-based schedule, not just a calendar schedule, for high-throughput services. |
| **Tag length** | SP 800-38D's Table 1 lists **128, 120, 112, 104, or 96 bits** as the normal recommended range; 128 bits is the safe default for most applications. **64- and 32-bit tags are permitted only under Appendix C**, which imposes strict additional constraints — e.g., a hard limit on the number of invalid-tag (forgery) attempts an attacker gets per key before the key must be retired — and are not a general-purpose substitute for the standard range. | Use 128-bit tags unless you have a specific bandwidth-constrained protocol with an Appendix C-compliant invalid-tag budget already designed in; truncating below 96 bits without that budget makes forgery by guessing measurably easier. |
| **Counter/nonce space exhaustion** | Deterministic (counter-based) nonce constructions have a fixed number of usable values before the counter wraps and repeats. | Monitor counter state and force key rotation before exhaustion — don't rely solely on a time-based rotation policy if traffic volume can outpace it. |

**Nonce allocation across distributed systems**: A single AEAD key shared across many stateless service instances or replicated writers reintroduces collision risk if each instance independently picks random nonces. The fixed-size nonce space itself doesn't shrink — what changes is the *total number of random draws* made against that one key (per the birthday-bound math in [NIST SP 800-38D §8.3](https://csrc.nist.gov/pubs/sp/800/38/d/final)), and more independent writers drawing concurrently means more total draws accumulate in a given window. The standard fix is deterministic partitioning: reserve high-order nonce bits for a fixed per-instance or per-shard identifier and use a monotonic counter in the low-order bits, or have a coordinator hand out non-overlapping counter ranges — both guarantee uniqueness by construction rather than relying on random draws staying collision-free. This is a different problem from TLS 1.3's own per-record nonce construction, which isn't a comparable example: TLS assigns the client and server *separate* independent traffic keys and IVs rather than sharing one key, so each direction only needs its own monotonic 64-bit record sequence number XORed into its own connection-specific IV to guarantee uniqueness for that single writer — it isn't partitioning one shared key's nonce space across multiple senders the way the distributed-systems fix above does. Purely random, uncoordinated nonces from many writers under one *shared* key is the failure mode to avoid.

**Separate directional keys**: Protocols like TLS derive distinct "write keys" for client&rarr;server and server&rarr;client traffic specifically so ciphertext produced by one direction can never land in the same (key, nonce) space as the other direction. Reusing a single shared key bidirectionally both halves the effective nonce budget (both directions draw from the same space) and can open reflection-style attacks where a ciphertext captured from one direction is replayed back along the other.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Select the AEAD construction and key size from the protocol, compliance profile, workload, and implementation support: TLS 1.3 requires AES-128-GCM support and also defines AES-256-GCM, ChaCha20-Poly1305, and AES-CCM suites. For any GCM deployment, reusing a 96-bit nonce under the same key destroys both authenticity and confidentiality.</p>
</div>

## Primary references

- **NIST SP 800-38D**: *Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM)* — [NIST CSRC SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final)
- **RFC 8439**: *ChaCha20 and Poly1305 for IETF Protocols* — [RFC 8439](https://www.rfc-editor.org/rfc/rfc8439) (IRTF/CFRG Informational)
