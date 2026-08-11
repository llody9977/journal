---
title: What Is Cryptography?
description: Architectural overview of cryptographic primitives, core security properties (Confidentiality, Integrity, Authenticity, Non-Repudiation), CSPRNG/DRBG randomness architecture, implementation-level side-channel and fault attacks, and safe protocol composition.
permalink: /topics/cryptography-overview/
last_verified: 2026-08-12
---

<span class="eyebrow">Cryptography / Concepts</span>

# What Is Cryptography?

<p class="lede">Cryptography is the mathematical and architectural discipline of securing data in transit and at rest over untrusted networks and storage environments. Standard encryption does not by itself protect data actively being processed—plaintext held in memory during computation is exposed to anyone with access to that memory or execution environment; protecting data in use typically requires separate techniques such as confidential computing enclaves or hardware-isolated execution, layered on top of the primitives described here. System evaluations begin by defining the required security property—Confidentiality, Integrity, Authenticity, or Non-Repudiation—and selecting reviewed, standardized algorithms and protocols that enforce those properties under explicit threat models.</p>

## The Open Network Threat Problem

In an untrusted network environment (such as the public internet), raw data packets passing across transit routers are vulnerable to several attack classes. The three below are network-observable attacks with a direct cryptographic countermeasure; this is a simplified, journal-created grouping for orienting the properties below, not an exhaustive or standards-defined taxonomy of network threats:

<div class="diagram-frame">
  <img src="{{ '/assets/img/cryptography-threats.svg' | relative_url }}" alt="Network threats mapped to cryptographic objectives: eavesdropping to confidentiality, tampering to integrity, and impersonation to authenticity.">
  <p class="diagram-caption">A simplified, journal-created grouping of three network-observable attacks and their primary cryptographic countermeasure — not an exhaustive threat taxonomy. The three properties are independent, not sequential; the connecting arrows are a layout device, not a causal or ordering claim.</p>
</div>

1. **Eavesdropping (Passive Attack)**: An adversary intercepts and reads sensitive message payloads (*Violates Confidentiality*).
2. **Tampering (Active Attack)**: An adversary alters bit sequences within transit packets (*Violates Integrity*).
3. **Impersonation (Active Attack)**: An adversary spoofs sender identity, injecting malicious instructions under a trusted identity (*Violates Authenticity*).

A fourth concern, **repudiation** — a sender denying they originated a high-value instruction after the fact — is not a network-observable attack in the same sense as the three above; it's an operational and evidentiary problem that non-repudiation mechanisms (signatures, timestamping, custody logs) address after the communication has already happened, which is why it isn't pictured in the diagram alongside the three transit-level attacks.

Cryptography provides mathematical primitives designed to withstand these attack classes even when the network infrastructure is completely controlled by an adversary — but it does not by itself solve every threat to network communication: availability/denial-of-service, traffic analysis (an observer learning who is talking to whom, and how much, even without reading payload content), and compromise of an endpoint or its keys are all threats cryptography alone does not close. [RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html)'s security considerations discuss residual traffic-analysis and implementation risk that remain even with TLS 1.3 correctly deployed.

## The Four Core Cryptographic Security Properties

| Property | Core Operational Goal | Primary Cryptographic Primitive | Failure Scenario Without Control |
|---|---|---|---|
| **Authenticity** | Verifies that data originated from an entity controlling a specific key | **Digital Signatures** (*Ed25519, FIPS 204 ML-DSA*) &amp; **Public Key Infrastructure (PKI)** | Man-in-the-middle impersonation and payload spoofing |
| **Confidentiality** | Restricts payload reading exclusively to authorized key holders | **Symmetric Ciphers** (*AES-128-GCM / AES-256-GCM, ChaCha20-Poly1305*) encrypt the actual payload; **Key Encapsulation Mechanisms (KEMs)** (*[FIPS 203](https://csrc.nist.gov/pubs/fips/203/final) ML-KEM, hybrid X25519MLKEM768*) don't encrypt payload data themselves — they establish the shared keying material a KDF and AEAD then use to do so, the composition **[RFC 9180](https://www.rfc-editor.org/rfc/rfc9180.html) HPKE** formalizes as KEM + KDF + AEAD | Cleartext exfiltration of PII, passwords, or financial transactions |
| **Integrity** | Ensures payload modification or bit-rot is detected against a digest obtained through a trusted channel | **Cryptographic Hashes** (*SHA-256, SHA3-256*) for accidental corruption; **MACs** (*HMAC-SHA256*) when an adversary may control the data | Unauthorized alteration of database fields or transaction amounts |
| **Non-Repudiation** | Generates cryptographic evidence, computationally unforgeable under the signature scheme, tying an action to a private key—supporting but not by itself constituting legal non-repudiation | **Asymmetric Digital Signatures** (*Ed25519, FIPS 205 SLH-DSA*) with timestamping and key custody logs | Disavowal of financial commitments or administrative actions |

An unkeyed hash only detects change when the verifier compares against a digest obtained through a channel the attacker cannot also tamper with (e.g., a value published separately or embedded in a signed document). An attacker who can replace both the data and its accompanying digest simply recomputes the hash over the modified data, so the check silently passes. Detecting *unauthorized* alteration by an adversary who controls the channel requires a keyed construction—a MAC or a digital signature—not a bare hash.

### Formal Security-Notion Vocabulary

The properties above (Authenticity, Confidentiality, Integrity, Non-Repudiation) are the practitioner-level names; the cryptography literature — and the standards this section cites throughout — defines more precise formal notions for exactly what "secure" means for a given primitive, expressed as games an adversary is assumed to try to win:

- **IND-CPA (Indistinguishability under Chosen-Plaintext Attack)**: The baseline confidentiality notion. An adversary who can get arbitrary plaintexts encrypted (but never sees a decryption oracle) still can't distinguish which of two chosen plaintexts a given ciphertext encrypts, better than a coin flip. Most modern symmetric and asymmetric encryption schemes are designed to meet at least this bar.
- **IND-CCA2 (Indistinguishability under Adaptive Chosen-Ciphertext Attack)**: A strictly stronger confidentiality notion — the adversary additionally gets a decryption oracle it may query adaptively (including on ciphertexts derived from the challenge, subject to the usual exclusion of the challenge itself) and still can't win the same distinguishing game. AEAD constructions (AES-GCM, ChaCha20-Poly1305), RSA-OAEP, and HPKE are designed to provide strong confidentiality and integrity, analyzed via IND-CCA2-style confidentiality and INT-CTXT-style integrity notions respectively — [RFC 5116](https://www.rfc-editor.org/rfc/rfc5116), which defines the general AEAD interface, deliberately does not mandate one single formal security model for every AEAD algorithm, since "several different models have been used in the literature"; for nonce-based AEAD specifically, these guarantees hold under correct, non-repeating (nonce-respecting) nonce use per key — reusing a nonce steps outside the security proof entirely rather than merely weakening it (see the AEAD nonce-reuse mechanics on the Symmetric Cryptography page). Not meeting IND-CCA2 doesn't by itself create a padding-oracle vulnerability — that specific attack additionally requires a malleable ciphertext construction (like CBC's block-chained XOR, which lets an attacker predictably manipulate decrypted bytes) *and* distinguishable validation feedback from the decrypting side (an error, a status code, a timing difference). Unauthenticated CBC happens to have both, which is why it's the classic example (see the CBC padding-oracle mechanics on the Symmetric Mode Attacks page) — but lacking IND-CCA2 is a necessary precondition for that class of attack, not a sufficient one on its own.
- **Ciphertext integrity / INT-CTXT**: A separate property from confidentiality — it asks whether an adversary can produce a *new*, valid ciphertext (one that decrypts without error) that the legitimate sender never produced, even without learning anything about the plaintext. AEAD's authentication tag is what supplies this; plain IND-CPA-secure encryption alone (e.g., unauthenticated AES-CBC) provides no ciphertext integrity at all, which is what makes bit-flipping possible — and, combined with a malleable construction and distinguishable validation feedback from the decrypting side (see the IND-CCA2 entry above), is what padding-oracle attacks additionally exploit.
- **EUF-CMA (Existential Unforgeability under Chosen-Message Attack)**: The standard security notion for signature schemes. An adversary who can get the signer to sign arbitrarily many messages of its choosing still can't produce a valid signature on *any* new message (even a meaningless one) it didn't get signed. Ed25519, ECDSA, and RSA-PSS are all designed to meet this notion. EUF-CMA is narrower than "Non-Repudiation" in the table above, not its formal counterpart — it only establishes forgery resistance (that nobody who lacks the private key can produce a valid signature), while non-repudiation additionally depends on things EUF-CMA says nothing about: attribution of the key to a specific person, custody and control of that key, timestamping, organizational policy, and evidentiary context (see the signature-verification checklist on the Digital Signatures page).

These notions matter because "secure" is not a single property — a scheme can satisfy one and fail another (unauthenticated AES-CBC is IND-CPA-secure in the right mode but has no ciphertext integrity at all), and knowing which notion a given standard or RFC claims to satisfy is what lets you check whether it actually covers your threat model.

## Real-World Protocol Composition: How TLS 1.3 Combines Primitives

Production security protocols rarely rely on a single cryptographic primitive. Instead, they combine primitives into a cohesive architecture.

For example, **TLS 1.3** ([RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html), which obsoletes the original [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)) coordinates primitives across three phases in its most common configuration — a full handshake authenticated by an X.509 certificate. TLS 1.3 also supports PSK-only and PSK-plus-ephemeral-DH resumption modes, which omit the `Certificate`/`CertificateVerify` messages entirely, and separately supports raw public keys in place of certificates ([RFC 7250](https://www.rfc-editor.org/rfc/rfc7250)); the flow below is the certificate-authenticated case, not every valid TLS 1.3 handshake:

<div class="diagram-frame">
  <img src="{{ '/assets/img/tls-cryptography-layers.svg' | relative_url }}" alt="TLS cryptographic layers for server authentication, shared-secret establishment, and authenticated encryption of application data.">
  <p class="diagram-caption">The common certificate-authenticated TLS 1.3 handshake — PSK-only and PSK-plus-ephemeral-DH resumption modes skip certificate authentication, and raw public keys are also a valid alternative to certificates</p>
</div>

1. **Authentication**: In the certificate-authenticated case shown here, the server proves ownership of a public key bound to a domain via an X.509 Certificate issued by a trusted CA.
2. **Ephemeral Key Agreement**: Peer endpoints execute **X25519 / ECDHE** (or the hybrid **X25519MLKEM768** group defined in [RFC 10024](https://www.rfc-editor.org/rfc/rfc10024.html), a separate specification from the base TLS 1.3 RFC) to derive a transient shared secret without transmitting private keys.
3. **AEAD Bulk Encryption**: TLS 1.3 requires implementations to support **AES-128-GCM** (mandatory-to-implement) and commonly negotiates **AES-256-GCM** or **ChaCha20-Poly1305**; the standard also defines **AES-CCM** cipher suites for constrained environments ([RFC 9846 §9.1](https://www.rfc-editor.org/rfc/rfc9846.html#section-9.1)), so "GCM or ChaCha20-Poly1305" describes the common case, not every valid TLS 1.3 negotiation.

## Cryptographic Randomness: Pseudo-Random Number Generators (PRNG) vs. Cryptographically Secure PRNGs (CSPRNG)

Cryptographic security depends on randomness, but not every value needs the same property from it, and the requirement depends on the specific construction, not the value's category alone. A **Pseudo-Random Number Generator (PRNG)** is any deterministic algorithm that expands a seed into output that looks random; a **Cryptographically Secure PRNG (CSPRNG)** is a PRNG specifically designed so that output is unpredictable to anyone who doesn't know its internal state. **Randomly generated keys and bearer secrets (session tokens, API tokens) need unpredictability** — an adversary must not be able to guess the value in advance, which is why a value produced this way needs a CSPRNG. That's a statement about the origin of a *randomly generated* value, not a claim that every key or token must be direct CSPRNG output: a key can instead be securely derived from another key (KDF), password-derived, or established through key agreement (see [Secure Key Generation & Provisioning]({{ '/topics/secure-key-generation-provisioning/' | relative_url }})), and a token can be a self-contained signed or MACed object rather than a random opaque bearer handle — both are valid origins with their own separate security requirements. **AES-GCM's IV requirement is fundamentally uniqueness under a given key, not unpredictability**: [NIST SP 800-38D §8.2](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) defines two valid IV constructions — a **deterministic construction** (a fixed field plus an invocation counter) and an **RBG-based construction** (an IV generated by a Random Bit Generator, i.e., randomly, which needs a CSPRNG both for unpredictability and to keep the collision probability of repeating an IV acceptably low at 96 bits). Neither construction gets uniqueness for free: the deterministic construction is unique only if the design actually enforces it — correct per-key/per-device/per-context partitioning of the counter's namespace, counter state that survives restarts and snapshots instead of resetting, handling for counter exhaustion, and key rotation before that happens; the RBG-based construction remains probabilistic and is bound by [NIST SP 800-38D §8.3](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)'s per-key invocation limit (2^32 encryptions for the 96-bit random-IV construction), not an unconditional guarantee — see the AEAD Operational Limits table on the [Symmetric Cryptography]({{ '/topics/symmetric-cryptography/' | relative_url }}) page for the full numeric bounds. Either construction is valid GCM usage; a random IV is common practice, but "IVs must be unpredictable" overstates GCM's actual requirement. **Many nonces in other constructions and password-hashing salts require only uniqueness**, not unpredictability — a monotonic counter is a perfectly good nonce for constructions built to expect one, and a password-hashing salt's job is to be distinct per record, not to be unguessable; other salt-like values are a different case — an HKDF salt, for instance, may be fixed or reused, since it serves the extract stage's role rather than a per-record uniqueness one ([RFC 5869](https://www.rfc-editor.org/rfc/rfc5869)). Conflating "must be unique" with "must be random" glosses over this: use a CSPRNG when unpredictability is the actual requirement (a randomly generated key, bearer token, or a chosen random-IV construction), and don't assume every uniqueness requirement needs one.

### PRNG vs. CSPRNG Comparison

| Generator Class | Internal Mechanics | Security Properties | Target Application Use Case |
|---|---|---|---|
| **Non-Cryptographic PRNG** | Fast deterministic algorithms (*Linear Congruential Generators, Mersenne Twister*). | **INSECURE**: Observing enough outputs may permit full internal-state recovery, letting an attacker predict all future values — the number of outputs needed depends on the generator (a simple LCG can fall from just a couple of outputs; MT19937 needs 624 consecutive 32-bit outputs, as the simulator below demonstrates). | Game physics, Monte Carlo simulations, UI shuffling. (*Do NOT use for security*). |
| **CSPRNG** (Cryptographically Secure PRNG) | "CSPRNG" is used at two different levels in practice, and it's worth keeping them apart: the deterministic expansion mechanism itself — a Deterministic Random Bit Generator (**DRBG**) construction such as `Hash_DRBG`, `HMAC_DRBG`, or `CTR_DRBG` per [NIST SP 800-90A](https://csrc.nist.gov/pubs/sp/800/90/a/r1/final) — versus the complete, entropy-backed OS-level service applications actually call (`getrandom()`, `os.urandom()`). NIST's own architecture separates these further still: [SP 800-90B](https://csrc.nist.gov/pubs/sp/800/90/b/final) defines the entropy source, SP 800-90A defines the DRBG mechanism that expands it, and [SP 800-90C](https://csrc.nist.gov/pubs/sp/800/90/c/final) defines the Random Bit Generator (**RBG**) construction that combines an entropy source with a DRBG into the complete generator an application actually uses. The specific underlying primitive is implementation-dependent (e.g., Linux's kernel CSPRNG is ChaCha20-based, not necessarily SHA-256 or AES-CTR-DRBG). | **SECURE when properly seeded, constructed, and operated** — not from seeding alone: it satisfies **Next-Bit Unpredictability** provided the entropy source supplies sufficient min-entropy at initialization, but the specific DRBG construction, protection of its internal state, correctness of the implementation, per-request/per-reseed output limits, and the platform's reseed policy all factor into whether a given instance is actually secure, separate from whether it was seeded at all. **Backtracking Resistance** (state compromise cannot reveal past outputs) is a property of the specific DRBG construction—the SP 800-90A Hash_DRBG, HMAC_DRBG, and CTR_DRBG designs provide it, but it is not automatic for every CSPRNG implementation. | Generating AES keys, RSA/ECC key pairs, IVs, and randomly generated bearer tokens (see the salt discussion above for why salts aren't a blanket CSPRNG requirement). |

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Randomness Pitfalls &amp; Language API Guide</div>
  <div>
    <strong>The Math.random() Vulnerability &amp; Secure CSPRNG APIs</strong>
    <p>Using standard non-cryptographic random functions (such as JavaScript <code>Math.random()</code> or Python's <code>random</code> module) to generate API tokens or session identifiers is unsafe: an attacker who can observe enough of the generator's raw output can, for many such PRNGs, reconstruct its internal state and predict or forge subsequent values, enabling session hijacking or account takeover. The exact number and form of observations needed is generator- and API-specific — the simulator below recovers Python's MT19937 state from 624 consecutive, complete, raw 32-bit outputs with no intervening draws; a transformed value such as a bounded integer (<code>random.randint()</code>), a float (<code>random.random()</code>), or an encoded token string consumes generator output through additional steps (rejection sampling, combining multiple words) and isn't simply interchangeable with a raw 32-bit word for this specific attack, though the underlying state is no more secure for having been transformed. Cryptographic nonces are a separate case with construction-specific requirements rather than one blanket rule: GCM nonces need only be unique per key (a non-cryptographic monotonic counter can satisfy that), while CBC IVs additionally need to be unpredictable — see the Uniqueness vs. Unpredictability discussion below for which requirement applies to which construction:</p>
    <ul>
      <li><strong>Node.js / Web Browsers</strong>: Replace <code>Math.random()</code> with <code>crypto.randomBytes(32)</code> or <code>crypto.getRandomValues()</code>.</li>
      <li><strong>Python</strong>: Replace <code>random.choice()</code> with <code>secrets.token_bytes(32)</code> or <code>os.urandom()</code>.</li>
      <li><strong>Java</strong>: Replace <code>java.util.Random</code> with <code>java.security.SecureRandom</code> — the underlying provider and algorithm are implementation-specific, and automatic/explicit reseeding support varies by provider, so verify the target JDK's actual behavior rather than assuming it (see the <a href="https://docs.oracle.com/en/java/javase/26/docs/api/java.base/java/security/SecureRandom.html">Java SE <code>SecureRandom</code> documentation</a>).</li>
      <li><strong>Linux Kernel / OS Source</strong>: Use <code>getrandom()</code> system call, <code>/dev/urandom</code>, or Windows <code>BCryptGenRandom()</code>.</li>
    </ul>
  </div>
</div>

### Entropy Sources, DRBG Architecture & Reseeding

A CSPRNG is not itself a source of randomness — it's a deterministic expansion algorithm that stretches a small amount of genuinely unpredictable input (entropy) into a long stream of output bits, though not an unbounded one: SP 800-90A DRBGs specify a maximum number of bits servable per request and a maximum total output before a mandatory reseed (see Reseeding below), so "long" means long enough for practical use within those limits, not literally arbitrary. Where that entropy comes from, and how the generator's internal state is maintained over the life of a process, determines whether the "cryptographically secure" label actually holds in practice.

- **Entropy sources**: Operating systems pool unpredictability from hardware timing jitter (disk seek times, keyboard/mouse interrupt timing, network packet arrival jitter), dedicated hardware RNGs (Intel `RDRAND`/`RDSEED`, ARM's `RNDR`, TPM-based RNGs), and — where available — hardware noise sources built into the CPU. Linux's `getrandom()` syscall and `/dev/urandom` both draw from this pooled entropy, but their blocking behavior differs: `getrandom()` blocks by default until the pool has been initially seeded at boot (an explicit design choice to prevent reading before initialization); `/dev/urandom` has historically **not** blocked even before the pool was seeded — a long-standing wart that motivated `getrandom()`'s creation in the first place, since a not-yet-seeded `/dev/urandom` read could return predictable output early in boot. Behavior here is platform- and version-specific — [`random(4)`](https://man7.org/linux/man-pages/man4/urandom.4.html) documents that on Linux, `/dev/urandom` can return output before the entropy pool has been fully initialized during early boot generally, not only on a narrow set of device classes; consult it for your target kernel version rather than assuming a fixed behavior. `getrandom()` was created specifically to close this gap by blocking until the pool is seeded. **The failure case is any system reading random output before its entropy pool has accumulated enough unpredictability to seed, not containers in general**: an ordinary container shares its host kernel's already-initialized entropy pool via the same `getrandom()`/`/dev/urandom` interface, so a container started on a running, already-seeded host isn't inherently weaker. **Fresh VMs and embedded devices at first boot are the most commonly cited examples, not the only systems affected** — they tend to have fewer physical timing sources of their own to draw jitter from and haven't yet accumulated enough unpredictability to seed their pool — but any system reading random output early enough in its own boot sequence, before its pool is seeded, is exposed to the same failure mode; early-boot entropy starvation is a real, well-documented problem (cloud instances or IoT devices generating predictable keys moments after first boot are common, not exhaustive, examples).
- **DRBG architecture (NIST SP 800-90A)**: A Deterministic Random Bit Generator takes a `seed` (entropy input, optionally mixed with a nonce and personalization string), instantiates internal state, and produces output via a one-way expansion function (`Hash_DRBG`, `HMAC_DRBG`, or `CTR_DRBG`). The DRBG's output is only as unpredictable as its seed — a DRBG seeded with low-entropy or predictable input produces a fully deterministic, attacker-predictable stream no matter how "cryptographic" the expansion algorithm is.
- **Reseeding**: SP 800-90A DRBGs specify a `reseed_interval` — a maximum number of generate *requests* (not bytes) a DRBG instance may serve before it must draw fresh entropy and reseed. Reseeding and backtracking resistance protect different directions and shouldn't be conflated: backtracking resistance (above) is a property of the DRBG's own construction that keeps a compromised state from revealing *past* outputs; reseeding instead restores the generator's *future* unpredictability (what SP 800-90A calls prediction resistance) after a compromise, by injecting fresh entropy an attacker who observed the old state didn't see — rather than running indefinitely on a single initial seed. Applications that call `os.urandom()` (or `getrandom()`/`/dev/urandom` directly) get this handled transparently by the kernel — that call goes straight into the OS CSPRNG on every invocation. WebCrypto's `crypto.getRandomValues()` is not the same guarantee: the [W3C Web Cryptography specification](https://www.w3.org/TR/webcrypto/) requires a cryptographically strong PRNG seeded from a high-quality entropy source, potentially drawing from the OS, but it does not mandate a kernel call on every invocation or specify kernel-managed reseeding — the actual behavior is implementation-defined per browser/engine. Other language-level wrappers vary further — Java's `SecureRandom`, for example, is provider-specific: whether it reseeds automatically, and what its `setSeed()` call actually does (it supplements rather than replaces existing entropy under the platform's default provider), depends on the configured provider and algorithm, so verify the target JDK's documented behavior rather than assuming transparent reseeding. Applications that instantiate and hold their own long-lived DRBG object generally need to reseed it themselves on the platform's schedule.
- **Process forks**: `fork()` duplicates the entire parent process's memory, including any in-process DRBG's internal state — if both the parent and child then generate "random" output from that duplicated state without an intervening reseed, they produce **identical output streams**, silently breaking key/nonce uniqueness across the two processes. This is a real, recurring class of bug (server workers forked from a shared master process, each expected to generate independent session keys or nonces). Mitigation is **implementation-, configuration-, and version-specific**: some CSPRNG implementations detect a process-ID change or expose at-fork callbacks, while others require the application to reseed or reinstantiate userspace DRBG state explicitly. Python's `os.register_at_fork()` is one mechanism application code can use, but fork-safety must be verified for the exact random API and release in the deployed stack. Calling the OS CSPRNG (`getrandom()`, `/dev/urandom`) for each use rather than caching a userspace DRBG sidesteps duplicated userspace state because the kernel's entropy state is not copied by `fork()`.
- **VM snapshots and container checkpoint/restore**: This is a distinct hazard from an ordinary container *image* — an image is a filesystem template that produces a fresh process on every `run`, sharing the host's already-seeded kernel entropy pool (as described above), not a live memory snapshot with its own captured RNG state. The actual risk is cloning **live memory state**, and the two mechanisms differ in what they actually duplicate: a running **VM snapshot** is hypervisor-level and captures the full guest RAM, including the guest kernel's own entropy pool and CSPRNG state — cloning or restoring from that snapshot duplicates the guest kernel's RNG state, the same way `fork()` duplicates a process's memory. A container **checkpoint/restore** (e.g., CRIU) operates at the process level — it captures and restores a container's userspace memory, including any in-process DRBG state an application was holding, but it does not capture the host kernel's own entropy pool, since containers share that kernel rather than each running one. Booting multiple instances from the same live VM snapshot, or restoring multiple checkpoints that each held their own userspace DRBG state, without forcing each one to reseed from a fresh, instance-specific entropy source is a demonstrated real vulnerability class, not a theoretical one — see [research demonstrating practical TLS key-recovery exploits from VM snapshot RNG-state reuse](https://rist.tech.cornell.edu/papers/sslhedge.html). What "reseed on restore" can actually fix depends on which state was duplicated: reseeding a userspace DRBG, or making a fresh OS-CSPRNG call, repairs a duplicated *process*-level DRBG state — after `fork()`, or after CRIU restores an application's own userspace memory — because that state lives in the process the application can act on directly. It does **not** by itself repair a cloned *guest-kernel* RNG state from a VM snapshot, since that state lives inside the kernel's own entropy pool, not something an application-level reseed call touches; fixing that requires the platform itself to detect the clone and inject fresh entropy into the guest kernel. Whether that happens automatically is platform-dependent: current Linux, for instance, can automatically reseed its kernel CSPRNG after a detected VM clone via the VM Generation ID (VMGenID) mechanism, when the hypervisor supports exposing it — see the [current Linux random driver implementation](https://github.com/torvalds/linux/blob/master/drivers/char/random.c). Where the platform provides no clone-detection or fresh-entropy mechanism for the guest kernel, an application has no way to repair that specific state on its own, and the safer approach is avoiding shared live-snapshot boot in the first place. Don't treat "reseed after restore" as one uniform fix — check which state (userspace DRBG vs. guest kernel) a given restore mechanism actually duplicates, and whether the platform already handles guest-kernel reseeding automatically, per the [CRIU checkpoint/restore model](https://criu.org/Checkpoint/Restore) for the process-level case.
- **Uniqueness vs. unpredictability, revisited**: The entropy-source and DRBG-state concerns above matter most for values that need genuine unpredictability — keys, session identifiers, and any value deliberately used as an unguessable capability token. Values that only need uniqueness — many nonce constructions (including GCM's, which requires a unique nonce per key but not an unpredictable one), password-hashing salts — can be satisfied by a monotonic counter or a UUID scheme instead of leaning on a CSPRNG that might be in a compromised or duplicated state, but neither alternative removes the uniqueness burden by itself: a monotonic counter is only actually unique if its namespace is correctly partitioned per key/device/context, its state survives restarts and snapshots, and it's rotated before exhaustion (see the AES-GCM IV discussion above); a UUID or other random/pseudo-random scheme remains probabilistic and is still subject to the construction's own collision math (for GCM's 96-bit random-IV case, NIST's 2^32-invocation-per-key limit). Neither is a magic fix that "removes the failure mode entirely" — both require actually satisfying their own correctness conditions. A GCM nonce specifically should never be repurposed as a security token — its only contract is uniqueness under a given key, not unguessability.

### Client-Side Simulator: Insecure PRNG (MT19937) State Reconstruction Attack

This simulator specifically models **MT19937**, the generator behind Python's [`random` module](https://docs.python.org/3/library/random.html). Given 624 consecutive, complete, raw 32-bit outputs with no draws hidden or dropped in between, an attacker can reconstruct its internal state and predict the immediate next output — the demonstration below shows one such prediction, not an unlimited stream, though the reconstructed state does let the attacker continue predicting further outputs the same way. Browser `Math.random()` is also non-cryptographic, but its algorithm is implementation-dependent per the [ECMAScript specification](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.random) and is not necessarily MT19937 — V8 (Chrome/Node.js), for instance, uses xorshift128+, a different algorithm this specific attack does not target — see [V8's own explanation of its `Math.random()` implementation](https://v8.dev/blog/math-random):

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Exploit Simulator</span>
    <h3>Insecure PRNG (MT19937) State Reconstruction Attack</h3>
    <p>Demonstrates how an adversary observing 624 consecutive, complete, raw 32-bit outputs from a non-cryptographic PRNG (Mersenne Twister MT19937) — with no draws hidden or dropped in between — inverts the tempering operations, reconstructs the 624-word internal state, and correctly predicts the generator's next raw output. "Password-reset token" here illustrates the consequence of the underlying vulnerability (a fully reconstructable internal state), not a claim that real-world tokens are literally raw MT19937 words — the number of observations an attacker actually needs against a real token depends on how that token encodes the generator's output.</p>
  </div>

  <div class="demo-body">
    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; margin-bottom: 1rem;">
      <button id="mt-btn-generate" class="btn-primary" type="button">1. Generate Target PRNG Tokens (All 624)</button>
      <button id="mt-btn-reconstruct" class="btn-secondary" type="button" disabled>2. Untemper State &amp; Predict Token #625</button>
    </div>

    <!-- Output Logs -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-top: 1rem;">
      <!-- Left: Target Server -->
      <div style="background: var(--paper); border: 1px solid var(--rule); padding: 0.85rem; border-radius: 6px;">
        <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--muted); font-weight: 700;">Target PRNG Server (Observed Tokens 1 - 624)</div>
        <div id="mt-target-status" style="font-size: 0.88rem; font-weight: 600; color: var(--ink); margin-top: 0.35rem;">Click "Generate Target PRNG Tokens" to begin.</div>
        <div id="mt-target-tokens" style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--ink); margin-top: 0.5rem; max-height: 220px; overflow-y: auto; white-space: pre-wrap; background: var(--panel); border: 1px solid var(--rule); padding: 0.5rem; border-radius: 4px;"></div>
      </div>

      <!-- Right: Attacker Predictor -->
      <div style="background: var(--paper); border: 1px solid var(--rule); padding: 0.85rem; border-radius: 6px;">
        <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--muted); font-weight: 700;">Attacker State Predictor (Untempered Reconstruct)</div>
        <div id="mt-predictor-status" style="font-size: 0.88rem; font-weight: 600; color: var(--ink); margin-top: 0.35rem;">Awaiting 624 target tokens...</div>
        <div id="mt-predictor-result" style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--ink); margin-top: 0.5rem; max-height: 220px; overflow-y: auto; white-space: pre-wrap; background: var(--panel); border: 1px solid var(--rule); padding: 0.5rem; border-radius: 4px;"></div>
      </div>
    </div>
  </div>
</div>

{% raw %}
<script>
(function() {
  class MersenneTwister {
    constructor(seed) {
      this.mt = new Array(624);
      this.index = 624;
      this.init(seed || 5489);
    }

    init(seed) {
      this.mt[0] = seed >>> 0;
      for (let i = 1; i < 624; i++) {
        let s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
        this.mt[i] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253 + i) >>> 0;
      }
      this.index = 624;
    }

    extractNumber() {
      if (this.index >= 624) {
        this.twist();
      }
      let y = this.mt[this.index++];
      y = (y ^ (y >>> 11)) >>> 0;
      y = (y ^ ((y << 7) & 0x9d2c5680)) >>> 0;
      y = (y ^ ((y << 15) & 0xefc60000)) >>> 0;
      y = (y ^ (y >>> 18)) >>> 0;
      return y >>> 0;
    }

    twist() {
      for (let i = 0; i < 624; i++) {
        let y = ((this.mt[i] & 0x80000000) + (this.mt[(i + 1) % 624] & 0x7fffffff)) >>> 0;
        let next = (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
        this.mt[i] = (this.mt[(i + 397) % 624] ^ next) >>> 0;
      }
      this.index = 0;
    }
  }

  function unRightShift(val, shift) {
    let res = val;
    for (let i = 0; i < Math.floor(32 / shift); i++) {
      res = val ^ (res >>> shift);
    }
    return res >>> 0;
  }

  function unLeftShiftMask(val, shift, mask) {
    let res = val;
    for (let i = 0; i < Math.floor(32 / shift); i++) {
      res = val ^ ((res << shift) & mask);
    }
    return res >>> 0;
  }

  function untemper(y) {
    y = unRightShift(y, 18);
    y = unLeftShiftMask(y, 15, 0xefc60000);
    y = unLeftShiftMask(y, 7, 0x9d2c5680);
    y = unRightShift(y, 11);
    return y >>> 0;
  }

  const btnGenerate = document.getElementById('mt-btn-generate');
  const btnReconstruct = document.getElementById('mt-btn-reconstruct');
  const targetStatus = document.getElementById('mt-target-status');
  const targetTokens = document.getElementById('mt-target-tokens');
  const predictorStatus = document.getElementById('mt-predictor-status');
  const predictorResult = document.getElementById('mt-predictor-result');

  if (!btnGenerate || !btnReconstruct || !targetStatus || !targetTokens || !predictorStatus || !predictorResult) return;

  let targetRng = null;
  let observedOutputs = [];

  btnGenerate.addEventListener('click', function() {
    const seed = Math.floor(Math.random() * 100000);
    targetRng = new MersenneTwister(seed);
    observedOutputs = [];

    const lines = [];
    for (let i = 0; i < 624; i++) {
      const val = targetRng.extractNumber();
      observedOutputs.push(val);
      lines.push(`[Token #${String(i + 1).padStart(3, '0')}] ${val}`);
    }

    targetStatus.textContent = `Generated All 624 Tokens (Seed: ${seed})`;
    targetTokens.textContent = lines.join('\n');
    predictorStatus.textContent = 'All 624 tokens observed! Ready to untemper state.';
    predictorResult.textContent = 'Click "Untemper State & Predict Token #625" to clone internal MT19937 generator state.';
    btnReconstruct.disabled = false;
  });

  btnReconstruct.addEventListener('click', function() {
    if (!targetRng || observedOutputs.length < 624) return;
    btnReconstruct.disabled = true;

    // 1. Reconstruct 624-word state array
    const reconstructedState = observedOutputs.map(untemper);

    // 2. Clone state into attacker predictor
    const predictorRng = new MersenneTwister();
    predictorRng.mt = reconstructedState;
    predictorRng.index = 624;

    // 3. Target generates Token #625 (Next Secret Token)
    const targetNextSecret = targetRng.extractNumber();

    // 4. Attacker predicts Token #625
    const attackerPredicted = predictorRng.extractNumber();

    const isMatch = targetNextSecret === attackerPredicted;

    // Append Token #625 to Target side (Left)
    const currentTargetText = targetTokens.textContent;
    targetTokens.textContent = currentTargetText + '\n\n----------------------------------------\n' +
      `[Token #625 SECRET] ${targetNextSecret} (Target Server)`;
    // Scroll to bottom of target log
    targetTokens.scrollTop = targetTokens.scrollHeight;

    // Display prediction details on Attacker side (Right)
    predictorStatus.textContent = isMatch ? '✅ State Reconstructed (100% Match!)' : '❌ State Reconstruction Failed';

    const predictorLines = [
      `Untempered 624/624 observed tokens into internal state array.`,
      `Local MT19937 Generator Cloned Successfully!`,
      ``,
      `----------------------------------------`,
      `[Token #625 PREDICTED] ${attackerPredicted} (Attacker)`,
      `[Token #625 TARGET   ] ${targetNextSecret} (Server)`,
      ``,
      `Result: ${isMatch ? '✅ MATCH CONFIRMED (100% Token Parity)' : '❌ MISMATCH'}`
    ];

    predictorResult.textContent = predictorLines.join('\n');
    predictorResult.scrollTop = predictorResult.scrollHeight;
  });
})();
</script>
{% endraw %}

## Cryptographic Implementation Attacks

Correct math doesn't guarantee a correct implementation. A cipher, signature scheme, or KDF proven secure against an idealized adversary can still leak its secrets through *how* the code that implements it actually runs on real hardware — a distinct attack surface from the algorithm's mathematical design.

- **Constant-time execution**: Code that branches on secret data (`if (secret_byte == guess) { ... }`) or indexes memory using a secret value (`table[secret_index]`) takes a data-dependent amount of time or touches data-dependent memory/cache lines. An attacker who can measure that timing — even remotely, over a network, given enough samples — can recover bits of the secret without ever seeing the key itself. Constant-time implementations avoid secret-dependent branches and secret-dependent memory addressing entirely, using bitwise selection (e.g., a constant-time `select(condition, a, b)`) instead of `if`, and constant-time comparison (`crypto_verify_32`-style functions) instead of `memcmp` for anything security-sensitive like MAC or signature verification.
- **Cache-timing and power/EM side channels**: Beyond simple instruction timing, an attacker sharing a CPU cache with a victim process (a classic cloud multi-tenancy concern) can use techniques like Flush+Reload or Prime+Probe to infer which cache lines the victim touched — and from that, which table entries or code paths a "constant-time-looking" implementation actually exercised. Physical access opens further channels: Simple and Differential Power Analysis (SPA/DPA) extract key bits from a chip's power-draw fluctuations during cryptographic operations, and electromagnetic emanation analysis does the same from radiated EM signal — both are standard techniques against smart cards, HSMs, and embedded secure elements, which is why those platforms specifically engineer countermeasures (power-consumption masking, random execution delays, dual-rail logic) that general-purpose CPUs don't have.
- **Fault injection**: Deliberately inducing a hardware fault during a cryptographic operation — via voltage glitching, clock glitching, or targeted laser/EM pulses — can corrupt a single computation step in an otherwise-correct algorithm. Differential Fault Analysis (DFA) recovers key material by exploiting what a fault changed about the computation; comparing a faulted output against a correct one is one common technique, not a universal requirement — the classic RSA-CRT (Bellcore) attack needs only a single faulted signature, together with the already-known message and the signer's public key, to factor the RSA modulus and recover the full private key, with no correct signature needed for comparison ([Attacking RSA-CRT Signatures](https://eprint.iacr.org/2012/172.pdf)). DFA in various forms has also been demonstrated against AES and ECDSA. It's primarily a physical-access threat model (smart cards, secure elements, HSMs), which is why those devices include fault-detection circuitry and redundant computation as standard countermeasures.
- **Compiler behavior**: A compiler is free to "optimize" code in ways that silently break security properties that aren't expressed in the language's semantics — and the actual risk runs the opposite direction from a common assumption: code that was already branching on secret data was never constant-time to begin with, so a compiler "removing" that branch wouldn't be what introduces the vulnerability. The real danger is the reverse: a developer writes genuinely branchless, constant-time selection logic (a bitwise `select(condition, a, b)`), and the compiler recognizes the pattern and "optimizes" it back into a secret-dependent branch or a secret-dependent memory access the source code never had — silently reintroducing the timing leak the developer specifically avoided. [Empirical research documents this class of compiler-introduced regression across real toolchains and constant-time codebases](https://arxiv.org/abs/2410.13489). Separately, ordinary comparison APIs (`memcmp`, `==`) simply don't come with a constant-time guarantee at all — some short-circuit on the first mismatch and leak timing proportional to how many leading bytes matched, but exact behavior is language-, library-, and platform-dependent, so don't rely on any particular implementation's behavior either way. Writing genuinely constant-time code in a high-level language requires either compiler-specific barriers, inline assembly, or libraries designed and tested specifically for this property ([`libsodium`'s constant-time helpers](https://doc.libsodium.org/helpers), `HACL*`, BoringSSL's constant-time primitives) — hand-rolled "constant-time" code in C or similar languages routinely turns out not to be, once compiled with optimizations on.
- **Limits of memory zeroization**: Overwriting a secret's memory with `memset()` after use, so it doesn't linger for a later memory-disclosure bug to find, sounds simple — but a compiler that can prove the memory is never read again after the overwrite is free to eliminate the "dead store" entirely, defeating the zeroization silently. Secure-zeroing functions (`explicit_bzero`, `SecureZeroMemory`, `memset_s`, a `volatile`-qualified write loop) exist specifically to prevent that optimization. Even correct zeroing only clears the one buffer it targets — it doesn't reach copies made by a garbage collector relocating an object, a language runtime's string interning, OS swap having paged the secret to disk, a core dump taken while the secret was live, or leftover values sitting in CPU registers or cache after the "cleared" memory access completed. Treat memory zeroization as raising the bar against casual memory-disclosure bugs, not as a guarantee that a secret leaves no trace.

## Safe Protocol Composition

Individually secure primitives can combine into an insecure protocol if the composition doesn't account for a few recurring failure patterns:

- **Domain separation**: The same key or the same hash function used for two different purposes (e.g., signing both "protocol handshake messages" and "user-facing documents" with one Ed25519 key) can let an attacker trick a signer into producing a signature for one purpose that's also valid — or can be reinterpreted as valid — for the other. Domain separation fixes this by binding a distinct, unambiguous label or context string into every hash or signature computation, so a value computed for one purpose can never be mistaken for a value computed for another. RFC 8032's `Ed25519ctx` variant adds an explicit `context` parameter for exactly this purpose — plain Ed25519, as most commonly deployed, does not expose a non-empty context by default; HKDF's `info` parameter and TLS 1.3's `"tls13 "`-prefixed labels (see the Key Exchange & KDFs page) serve the same role for key derivation.
- **Canonical serialization**: Digital signatures and MACs authenticate the exact bytes fed into them — not the abstract "meaning" of a message. Finding a second, differently-encoded-but-equivalent serialization doesn't by itself break anything: if the verifier checks the signature against the literal bytes it received, a signature computed over the original encoding simply fails to verify against the second one. The vulnerability requires an additional step that creates a mismatch between what was verified and what gets used or reproduced — a downstream component that re-parses and re-serializes the message before acting on it (so it acts on bytes that were never actually signed), a parser that accepts multiple encodings as equivalent while a stricter one performed the signing, or a requirement to reproduce the exact signed bytes independently across different implementations or language versions. If a protocol allows the same logical message to be serialized multiple different ways (reordered JSON object keys, alternate protobuf field ordering, BER's multiple valid encodings of the same ASN.1 value versus DER's single canonical one) and is exposed to one of those additional steps, an attacker can potentially exploit the encoding difference to break the intended binding between "what was verified" and "what gets acted on." Protocols that need cross-implementation or re-serialization safety specify a genuinely canonical encoding: DER (not BER) for ASN.1, an explicit canonical JSON form ([RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html)), or the practice of authenticating raw received bytes directly rather than a re-encoded form. **Protobuf's "deterministic serialization" option is a common trap here** — [protobuf's own documentation states outright that it is not canonical](https://protobuf.dev/programming-guides/serialization-not-canonical/): it isn't guaranteed stable across builds, languages, or schema changes, so it must not be relied on for anything a signature needs to remain stably verifiable over time (cross-version or cross-implementation signing/verification). If you need canonical bytes for signing and your data model is protobuf, define an explicit application-level canonicalization scheme (e.g., serialize into a stable intermediate form and sign that) rather than trusting protobuf's deterministic mode to stay stable.
- **Context binding**: A signature or MAC computed correctly, over the correctly serialized message, can still be misused if nothing ties it to *where* and *when* it's valid — enabling replay of a legitimate value into a different session, a different protocol version, or a different deployment entirely. TLS 1.3's `CertificateVerify` (which signs the whole handshake transcript, not just an isolated key share) and its `Finished` messages, and Ethereum's chain-ID-bound transaction signatures (EIP-155, discussed on the Blockchain Cryptography page), are both context-binding mechanisms: they make a signature meaningfully invalid outside the specific context it was created for.
- **Key separation**: Using one key for multiple cryptographic roles (encryption and MAC, or signing and key exchange) risks interactions between the roles that neither role's individual security proof accounts for — a key-exchange private key and a signing private key have different usage patterns and different exposure profiles, and conflating them can leak information neither operation's own analysis anticipated. Standard practice derives distinct, purpose-labeled sub-keys from a single master secret via a KDF (see the Envelope Encryption and HKDF material elsewhere in this section) rather than reusing one key across unrelated cryptographic operations.
- **Safe chunked/streaming AEAD**: AEAD gives strong guarantees about a single, complete ciphertext — but naively splitting a large payload into chunks and encrypting each chunk independently with the same key reopens exactly the vulnerabilities AEAD was supposed to close: an attacker who can't forge a single chunk can still often **reorder**, **drop**, **duplicate**, or **truncate** chunks, none of which an independent per-chunk AEAD tag detects, since the tag only authenticates that one chunk's own contents. Safe streaming-AEAD constructions (Rogaway & Hoang's STREAM construction, used in libsodium's `secretstream` API and in tools like `age`) close this by binding a monotonic chunk counter and an explicit "is this the final chunk" flag into each chunk's nonce or associated data, so the decrypting side can detect reordering, drops, duplication, and truncation as authentication failures rather than silently accepting a tampered stream. TLS's record layer uses the same idea for reordering, dropping, and duplication — an implicit per-record sequence number folded into each record's nonce — but that alone doesn't cover **truncation at the end of the stream**: an attacker who simply terminates the underlying TCP connection early can cut a response short without violating any individual record's sequence number. TLS handles that separately, via an authenticated [`close_notify` alert](https://www.rfc-editor.org/rfc/rfc9846.html#section-6.1) that a compliant implementation must receive before treating the stream as cleanly finished — a bare connection close without one is treated as a potential truncation, not a clean end. Don't assume per-record sequence numbers alone give you end-of-stream integrity; that needs an explicit authenticated closure signal or application-level framing (e.g., a length prefix or an explicit end marker) on top.

## Practical Cryptographic Implementation Guidelines

- **Never Invent Custom Cryptography**: Always use standardized, peer-reviewed primitives and high-level libraries (*libsodium, WebCrypto, OpenSSL 3.x, Tink*).
- **Enforce Authenticated Encryption (AEAD)**: For new symmetric encryption that needs confidentiality, default to AEAD (AES-GCM, ChaCha20-Poly1305) — AEAD supplies ciphertext integrity that unauthenticated modes lack entirely, which is the actual reason it's preferred; unauthenticated CBC becomes exploitable via a padding-oracle attack specifically when an implementation also leaks distinguishable padding-validity feedback (an error, a status code, a timing difference) to the decrypting side — see the IND-CCA2/INT-CTXT discussion above for the full precondition.
- **Use a CSPRNG for Keys, Tokens, and Randomly-Generated Values**: Never generate key material, session tokens, or API tokens with a non-cryptographic PRNG. For nonces and salts specifically, follow the construction's actual requirement (see "Cryptographic Randomness" above) — some nonce constructions need CSPRNG-grade unpredictability, others only need uniqueness and are equally well served by a monotonic counter; a password-hashing salt likewise needs uniqueness, not secrecy — but that's specific to password hashing, not salts in general, since a construction like HKDF permits an omitted, fixed, reused, or even secret salt ([RFC 5869](https://www.rfc-editor.org/rfc/rfc5869)). Using a CSPRNG for a uniqueness-only requirement isn't wrong, but treating it as the only correct choice glosses over simpler, equally valid mechanisms.
- **Ensure Cryptographic Agility**: Design software protocols to support key and algorithm rotation as cryptanalytic capabilities advance.
- **Account for Long-Term Data Lifetimes**: Data encrypted today must remain secure for the duration of its confidentiality lifetime, incorporating post-quantum migration planning (**[NIST FIPS 203 ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)**, **[NIST FIPS 204 ML-DSA](https://csrc.nist.gov/pubs/fips/204/final)**; general key management guidance is provided by **[NIST SP 800-175B Rev. 1](https://csrc.nist.gov/pubs/sp/800/175/b/r1/final)**).

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Cryptographic Foundations Summary</strong>
    <ul>
      <li><strong>CSPRNG Requirement</strong>: A randomly generated key, bearer token, or any other value needing genuine unpredictability must come from a CSPRNG (<code>secrets.token_bytes()</code>, <code>crypto.randomBytes()</code>) — never a non-cryptographic PRNG (<code>Math.random()</code>). Keys and tokens aren't required to be randomly generated in the first place — a securely derived, password-derived, agreement-established key, or a self-contained signed/MACed token, is a separate valid origin with its own requirements. Nonces and password-hashing salts follow their construction's own requirement (uniqueness, unpredictability, or both) rather than defaulting to a CSPRNG by category, and a deterministic counter or UUID scheme used for a uniqueness-only requirement still needs its own correctness conditions met (partitioning, persistence, exhaustion handling, or per-key collision limits) — it isn't automatically failure-proof just for avoiding the CSPRNG.</li>
      <li><strong>Default to AEAD for New Symmetric Encryption</strong>: When confidentiality is the goal, use Authenticated Encryption with Associated Data (AES-GCM, ChaCha20-Poly1305) — AEAD supplies ciphertext integrity that unauthenticated modes lack, which closes off padding-oracle attacks (themselves conditional on a distinguishable validation-feedback oracle, not automatic from unauthenticated CBC alone) along with other malleability-based attacks.</li>
      <li><strong>Protocol Composition</strong>: TLS 1.3's common, certificate-authenticated configuration combines asymmetric signatures (authentication), ephemeral ECDH (key agreement), and symmetric AEAD (bulk data) — but this isn't the only valid composition: PSK-based modes skip certificate authentication, and raw public keys are a valid alternative to certificates.</li>
      <li><strong>DRBG State Hazards</strong>: <code>fork()</code> and process-level checkpoint/restore (CRIU) duplicate in-process userspace DRBG state — reseed explicitly after either event, or rely on a fresh OS-level CSPRNG call per use instead of a long-lived DRBG instance. A live VM snapshot is a distinct, kernel-level hazard: it duplicates the guest kernel's own RNG state, which an application-level reseed call cannot repair by itself — that requires the platform to detect the clone and inject fresh entropy into the guest kernel (some platforms, like current Linux via VMGenID, do this automatically when the hypervisor supports it; others don't). An ordinary container image start is not this hazard — it produces fresh state, not a duplicated live snapshot.</li>
      <li><strong>Implementation Attacks Are a Separate Threat Class</strong>: Timing, cache, power, and fault-injection side channels can leak keys from a mathematically sound algorithm through its concrete implementation; use vetted constant-time libraries (libsodium, HACL*, BoringSSL) rather than hand-rolled "constant-time" code, and don't rely on <code>memset()</code> alone to guarantee a secret is gone from memory.</li>
      <li><strong>Composition Failures</strong>: Domain separation and context binding prevent a value computed for one purpose or context from being replayed as valid for another; canonical serialization is a separate concern — it keeps signed/MACed bytes reproducible when a message can be re-parsed, re-serialized, or independently reconstructed across implementations, which is what creates the verify/use mismatch that breaks the signature's intended binding. Naive per-chunk AEAD over a stream doesn't detect chunk reordering, dropping, duplication, or truncation without an explicit sequence counter and final-chunk marker.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-90A Rev. 1**: *Recommendation for Random Number Generation Using Deterministic Random Bit Generators* — [NIST CSRC SP 800-90A](https://csrc.nist.gov/pubs/sp/800/90/a/r1/final)
- **NIST SP 800-90B**: *Recommendation for the Entropy Sources Used for Random Bit Generation* — [NIST CSRC SP 800-90B](https://csrc.nist.gov/pubs/sp/800/90/b/final)
- **NIST SP 800-90C**: *Recommendation for Random Bit Generator (RBG) Constructions* — [NIST CSRC SP 800-90C](https://csrc.nist.gov/pubs/sp/800/90/c/final) — verified how an entropy source (SP 800-90B) and a DRBG mechanism (SP 800-90A) combine into a complete RBG construction.
- **RFC 9846**: *The Transport Layer Security (TLS) Protocol Version 1.3* — [IETF RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html)
- **RFC 8032**: *Edwards-Curve Digital Signature Algorithm (EdDSA)* (context-string domain separation, §2 &amp; §5.1) — [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032) (IRTF/CFRG Informational, not IETF Standards Track)
