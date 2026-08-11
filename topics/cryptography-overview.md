---
title: What Is Cryptography?
description: Architectural overview of cryptographic primitives, core security properties (Confidentiality, Integrity, Authenticity, Non-Repudiation), CSPRNG/DRBG randomness architecture, implementation-level side-channel and fault attacks, and safe protocol composition.
permalink: /topics/cryptography-overview/
last_verified: 2026-08-10
---

<span class="eyebrow">Cryptography / Concepts</span>

# What Is Cryptography?

<p class="lede">Cryptography is the mathematical and architectural discipline of securing data in transit and at rest over untrusted networks and storage environments. Standard encryption does not by itself protect data actively being processed—plaintext held in memory during computation is exposed to anyone with access to that memory or execution environment; protecting data in use typically requires separate techniques such as confidential computing enclaves or hardware-isolated execution, layered on top of the primitives described here. System evaluations begin by defining the required security property—Confidentiality, Integrity, Authenticity, or Non-Repudiation—and selecting reviewed, standardized algorithms and protocols that enforce those properties under explicit threat models.</p>

## The Open Network Threat Problem

In an untrusted network environment (such as the public internet), raw data packets passing across transit routers are vulnerable to four primary attack classes:

<div class="diagram-frame">
  <img src="{{ '/assets/img/cryptography-threats.svg' | relative_url }}" alt="Network threats mapped to cryptographic objectives: eavesdropping to confidentiality, tampering to integrity, and impersonation to authenticity.">
  <p class="diagram-caption">Different cryptographic controls protect different properties of one communication</p>
</div>

1. **Eavesdropping (Passive Attack)**: An adversary intercepts and reads sensitive message payloads (*Violates Confidentiality*).
2. **Tampering (Active Attack)**: An adversary alters bit sequences within transit packets (*Violates Integrity*).
3. **Impersonation (Active Attack)**: An adversary spoofs sender identity, injecting malicious instructions under a trusted identity (*Violates Authenticity*).
4. **Repudiation (Operational Threat)**: A sender denies originating a high-value instruction after execution (*Requires Non-Repudiation evidence*).

Cryptography provides mathematical primitives designed to withstand these attack classes even when the network infrastructure is completely controlled by an adversary.

## The Four Core Cryptographic Security Properties

| Property | Core Operational Goal | Primary Cryptographic Primitive | Failure Scenario Without Control |
|---|---|---|---|
| **Authenticity** | Verifies that data originated from an entity controlling a specific key | **Digital Signatures** (*Ed25519, FIPS 204 ML-DSA*) &amp; **Public Key Infrastructure (PKI)** | Man-in-the-middle impersonation and payload spoofing |
| **Confidentiality** | Restricts payload reading exclusively to authorized key holders | **Symmetric Ciphers** (*AES-128-GCM / AES-256-GCM, ChaCha20-Poly1305*), **Key Encapsulation Mechanisms (KEMs)** (*FIPS 203 ML-KEM, hybrid X25519MLKEM768*), &amp; **Hybrid Frameworks** (*RFC 9180 HPKE combining KEM, KDF, and AEAD*) | Cleartext exfiltration of PII, passwords, or financial transactions |
| **Integrity** | Ensures payload modification or bit-rot is detected against a digest obtained through a trusted channel | **Cryptographic Hashes** (*SHA-256, SHA3-256*) for accidental corruption; **MACs** (*HMAC-SHA256*) when an adversary may control the data | Unauthorized alteration of database fields or transaction amounts |
| **Non-Repudiation** | Generates cryptographic evidence, computationally unforgeable under the signature scheme, tying an action to a private key—supporting but not by itself constituting legal non-repudiation | **Asymmetric Digital Signatures** (*Ed25519, FIPS 205 SLH-DSA*) with timestamping and key custody logs | Disavowal of financial commitments or administrative actions |

An unkeyed hash only detects change when the verifier compares against a digest obtained through a channel the attacker cannot also tamper with (e.g., a value published separately or embedded in a signed document). An attacker who can replace both the data and its accompanying digest simply recomputes the hash over the modified data, so the check silently passes. Detecting *unauthorized* alteration by an adversary who controls the channel requires a keyed construction—a MAC or a digital signature—not a bare hash.

## Real-World Protocol Composition: How TLS 1.3 Combines Primitives

Production security protocols rarely rely on a single cryptographic primitive. Instead, they combine primitives into a cohesive architecture.

For example, **TLS 1.3** ([RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)) coordinates primitives across three phases:

<div class="diagram-frame">
  <img src="{{ '/assets/img/tls-cryptography-layers.svg' | relative_url }}" alt="TLS cryptographic layers for server authentication, shared-secret establishment, and authenticated encryption of application data.">
  <p class="diagram-caption">TLS composes several cryptographic mechanisms rather than relying on one algorithm</p>
</div>

1. **Authentication**: The server proves ownership of a public key bound to a domain via an X.509 Certificate issued by a trusted CA.
2. **Ephemeral Key Agreement**: Peer endpoints execute **X25519 / ECDHE** (or hybrid **X25519MLKEM768**) to derive a transient shared secret without transmitting private keys.
3. **AEAD Bulk Encryption**: All application data is encrypted and authenticated using **AES-128-GCM / AES-256-GCM** or **ChaCha20-Poly1305**.

## Cryptographic Randomness: PRNG vs. CSPRNG

Cryptographic security depends on randomness, but not every value needs the same property from it, and the requirement depends on the specific construction, not the value's category alone. **Keys and tokens (session tokens, API tokens) need unpredictability** — an adversary must not be able to guess the value in advance, which is why they need a CSPRNG. **AES-GCM's IV requirement is fundamentally uniqueness under a given key, not unpredictability**: [NIST SP 800-38D §8.2](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) defines two valid IV constructions — a **deterministic construction** (a fixed field plus an invocation counter, which is entirely predictable but guaranteed unique) and an **RBG-based construction** (randomly generated, which needs a CSPRNG both for unpredictability and to keep the collision probability of repeating an IV acceptably low at 96 bits). Either construction is valid GCM usage; a random IV is common practice, but "IVs must be unpredictable" overstates GCM's actual requirement. **Many nonces in other constructions and salts require only uniqueness**, not unpredictability — a monotonic counter is a perfectly good nonce for constructions built to expect one, and a salt's job is to be distinct per record, not to be unguessable. Conflating "must be unique" with "must be random" glosses over this: use a CSPRNG when unpredictability is the actual requirement (keys, tokens, or a chosen random-IV construction), and don't assume every uniqueness requirement needs one.

### PRNG vs. CSPRNG Comparison

| Generator Class | Internal Mechanics | Security Properties | Target Application Use Case |
|---|---|---|---|
| **Non-Cryptographic PRNG** | Fast deterministic algorithms (*Linear Congruential Generators, Mersenne Twister*). | **INSECURE**: Observing enough outputs may permit full internal-state recovery, letting an attacker predict all future values — the number of outputs needed depends on the generator (a simple LCG can fall from just a couple of outputs; MT19937 needs 624 consecutive 32-bit outputs, as the simulator below demonstrates). | Game physics, Monte Carlo simulations, UI shuffling. (*Do NOT use for security*). |
| **CSPRNG** (Cryptographically Secure PRNG) | OS entropy pool expanded via SHA-256 / AES-CTR-DRBG ([NIST SP 800-90A](https://csrc.nist.gov/pubs/sp/800/90/a/r1/final)). | **SECURE when properly seeded**: Satisfies **Next-Bit Unpredictability**, provided the entropy source supplies sufficient min-entropy at initialization. **Backtracking Resistance** (state compromise cannot reveal past outputs) is a property of the specific DRBG construction—the SP 800-90A Hash_DRBG, HMAC_DRBG, and CTR_DRBG designs provide it, but it is not automatic for every CSPRNG implementation. | Generating AES keys, RSA/ECC key pairs, IVs, salts, and API tokens. |

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Randomness Pitfalls &amp; Language API Guide</div>
  <div>
    <strong>The Math.random() Vulnerability &amp; Secure CSPRNG APIs</strong>
    <p>Using standard non-cryptographic random functions (such as JavaScript <code>Math.random()</code> or Python <code>random.randint()</code>) to generate API tokens or nonces allows adversaries to reconstruct the generator state and hijack user sessions:</p>
    <ul>
      <li><strong>Node.js / Web Browsers</strong>: Replace <code>Math.random()</code> with <code>crypto.randomBytes(32)</code> or <code>crypto.getRandomValues()</code>.</li>
      <li><strong>Python</strong>: Replace <code>random.choice()</code> with <code>secrets.token_bytes(32)</code> or <code>os.urandom()</code>.</li>
      <li><strong>Java</strong>: Replace <code>java.util.Random</code> with <code>java.security.SecureRandom</code>.</li>
      <li><strong>Linux Kernel / OS Source</strong>: Use <code>getrandom()</code> system call, <code>/dev/urandom</code>, or Windows <code>BCryptGenRandom()</code>.</li>
    </ul>
  </div>
</div>

### Entropy Sources, DRBG Architecture & Reseeding

A CSPRNG is not itself a source of randomness — it's a deterministic expansion algorithm that stretches a small amount of genuinely unpredictable input (entropy) into an arbitrarily long stream of output bits. Where that entropy comes from, and how the generator's internal state is maintained over the life of a process, determines whether the "cryptographically secure" label actually holds in practice.

- **Entropy sources**: Operating systems pool unpredictability from hardware timing jitter (disk seek times, keyboard/mouse interrupt timing, network packet arrival jitter), dedicated hardware RNGs (Intel `RDRAND`/`RDSEED`, ARM's `RNDR`, TPM-based RNGs), and — where available — hardware noise sources built into the CPU. Linux's `getrandom()` syscall and `/dev/urandom` both draw from this pooled entropy, but their blocking behavior differs: `getrandom()` blocks by default until the pool has been initially seeded at boot (an explicit design choice to prevent reading before initialization); `/dev/urandom` has historically **not** blocked even before the pool was seeded — a long-standing wart that motivated `getrandom()`'s creation in the first place, since a not-yet-seeded `/dev/urandom` read could return predictable output early in boot. Modern kernels have narrowed this gap, but don't assume the two are interchangeable in blocking behavior; consult [`random(4)`](https://man7.org/linux/man-pages/man4/urandom.4.html) for your target kernel version. **The weak case is early boot on VMs and embedded devices specifically, not containers in general**: an ordinary container shares its host kernel's already-initialized entropy pool via the same `getrandom()`/`/dev/urandom` interface, so a container started on a running, already-seeded host isn't inherently weaker. The real risk is a **fresh VM or embedded device at first boot**, which has fewer physical timing sources of its own to draw jitter from and hasn't yet accumulated enough unpredictability to seed its pool — early-boot entropy starvation there is a real, well-documented failure mode (cloud instances or IoT devices generating predictable keys moments after first boot).
- **DRBG architecture (NIST SP 800-90A)**: A Deterministic Random Bit Generator takes a `seed` (entropy input, optionally mixed with a nonce and personalization string), instantiates internal state, and produces output via a one-way expansion function (`Hash_DRBG`, `HMAC_DRBG`, or `CTR_DRBG`). The DRBG's output is only as unpredictable as its seed — a DRBG seeded with low-entropy or predictable input produces a fully deterministic, attacker-predictable stream no matter how "cryptographic" the expansion algorithm is.
- **Reseeding**: SP 800-90A DRBGs specify a `reseed_interval` — a maximum number of requests (or bytes) a DRBG instance may serve before it must draw fresh entropy and reseed. This bounds the damage from an eventual internal-state compromise (see Backtracking Resistance, above), giving the generator fresh, independent entropy on a schedule rather than running indefinitely on a single initial seed. Applications using a platform CSPRNG (`crypto.getRandomValues()`, `os.urandom()`, `SecureRandom`) get this handled transparently by the OS; applications that instantiate and hold their own long-lived DRBG object need to reseed it themselves on the platform's schedule.
- **Process forks**: `fork()` duplicates the entire parent process's memory, including any in-process DRBG's internal state — if both the parent and child then generate "random" output from that duplicated state without an intervening reseed, they produce **identical output streams**, silently breaking key/nonce uniqueness across the two processes. This is a real, recurring class of bug (server workers forked from a shared master process, each expected to generate independent session keys or nonces). Mitigation is **implementation-, configuration-, and version-specific**: some CSPRNG implementations detect a process-ID change or expose at-fork callbacks, while others require the application to reseed or reinstantiate userspace DRBG state explicitly. Python's `os.register_at_fork()` is one mechanism application code can use, but fork-safety must be verified for the exact random API and release in the deployed stack. Calling the OS CSPRNG (`getrandom()`, `/dev/urandom`) for each use rather than caching a userspace DRBG sidesteps duplicated userspace state because the kernel's entropy state is not copied by `fork()`.
- **VM snapshots and container checkpoint/restore**: This is a distinct hazard from an ordinary container *image* — an image is a filesystem template that produces a fresh process (and fresh kernel entropy pool state) on every `run`, not a live memory snapshot. The actual risk is cloning **live memory state**: a running VM snapshot (hypervisor-level, capturing full guest RAM including its entropy pool) or a container **checkpoint/restore** (e.g., CRIU) both duplicate in-process and kernel-level CSPRNG state at the instant of the snapshot, the same way `fork()` duplicates a process's memory — but at a coarser granularity and often with a much longer gap before anyone notices. Booting multiple instances from the same live snapshot without forcing each one to reseed from a fresh, instance-specific entropy source has caused real-world key-reuse incidents; platforms that support VM cloning or checkpoint/restore generally provide (and application images should invoke) an explicit "reseed on clone/restore" mechanism rather than assuming the guest detects the clone on its own.
- **Uniqueness vs. unpredictability, revisited**: The entropy-source and DRBG-state concerns above matter most for values that need genuine unpredictability (keys, GCM nonces used as tokens, session identifiers). Values that only need uniqueness — many nonce constructions, salts — can be satisfied more cheaply and more robustly by a monotonic counter or a UUID scheme than by leaning on a CSPRNG that might be in a compromised or duplicated state; don't reach for "more randomness" as a fix for a uniqueness requirement when a simpler, deterministic mechanism removes the failure mode entirely.

### Client-Side Simulator: Insecure PRNG (MT19937) State Reconstruction Attack

This simulator specifically models **MT19937**, as used by Python’s `random`. Given 624 consecutive 32-bit outputs, an attacker can reconstruct its internal state and predict subsequent outputs. Browser `Math.random()` is also non-cryptographic, but its algorithm is implementation-dependent per [ECMAScript specification](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.random) and is not necessarily MT19937:

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Exploit Simulator</span>
    <h3>Insecure PRNG (MT19937) State Reconstruction Attack</h3>
    <p>Demonstrates how an adversary observing 624 32-bit outputs from a non-cryptographic PRNG (Mersenne Twister MT19937) inverts the tempering operations, reconstructs the 624-word internal state, and predicts 100% of future password-reset tokens.</p>
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
- **Fault injection**: Deliberately inducing a hardware fault during a cryptographic operation — via voltage glitching, clock glitching, or targeted laser/EM pulses — can corrupt a single computation step in an otherwise-correct algorithm. Differential Fault Analysis (DFA) compares a faulted signature or ciphertext against a correct one to recover key material; this has been demonstrated against RSA-CRT (a single faulted exponentiation can reveal a full private key), AES, and ECDSA. It's primarily a physical-access threat model (smart cards, secure elements, HSMs), which is why those devices include fault-detection circuitry and redundant computation as standard countermeasures.
- **Compiler behavior**: A compiler is free to "optimize" code in ways that silently break security properties that aren't expressed in the language's semantics. Undefined-behavior-based optimizations can remove a data-dependent branch a developer carefully wrote to be constant-time (if the compiler decides it can prove an equivalent, faster — and no longer constant-time — form), and short-circuiting comparison functions (`memcmp`, `==`) return as soon as they find a mismatch, leaking timing information proportional to how many leading bytes matched. Writing genuinely constant-time code in a high-level language requires either compiler-specific barriers, inline assembly, or libraries designed and tested specifically for this property (`libsodium`, `HACL*`, BoringSSL's constant-time primitives) — hand-rolled "constant-time" code in C or similar languages routinely turns out not to be, once compiled with optimizations on.
- **Limits of memory zeroization**: Overwriting a secret's memory with `memset()` after use, so it doesn't linger for a later memory-disclosure bug to find, sounds simple — but a compiler that can prove the memory is never read again after the overwrite is free to eliminate the "dead store" entirely, defeating the zeroization silently. Secure-zeroing functions (`explicit_bzero`, `SecureZeroMemory`, `memset_s`, a `volatile`-qualified write loop) exist specifically to prevent that optimization. Even correct zeroing only clears the one buffer it targets — it doesn't reach copies made by a garbage collector relocating an object, a language runtime's string interning, OS swap having paged the secret to disk, a core dump taken while the secret was live, or leftover values sitting in CPU registers or cache after the "cleared" memory access completed. Treat memory zeroization as raising the bar against casual memory-disclosure bugs, not as a guarantee that a secret leaves no trace.

## Safe Protocol Composition

Individually secure primitives can combine into an insecure protocol if the composition doesn't account for a few recurring failure patterns:

- **Domain separation**: The same key or the same hash function used for two different purposes (e.g., signing both "protocol handshake messages" and "user-facing documents" with one Ed25519 key) can let an attacker trick a signer into producing a signature for one purpose that's also valid — or can be reinterpreted as valid — for the other. Domain separation fixes this by binding a distinct, unambiguous label or context string into every hash or signature computation, so a value computed for one purpose can never be mistaken for a value computed for another. RFC 8032 gives Ed25519 an explicit `context` parameter for exactly this; HKDF's `info` parameter and TLS 1.3's `"tls13 "`-prefixed labels (see the Key Exchange & KDFs page) serve the same role for key derivation.
- **Canonical serialization**: Digital signatures and MACs authenticate the exact bytes fed into them — not the abstract "meaning" of a message. If a protocol allows the same logical message to be serialized multiple different ways (reordered JSON object keys, alternate protobuf field ordering, BER's multiple valid encodings of the same ASN.1 value versus DER's single canonical one), an attacker can potentially find a second encoding that a downstream parser accepts as equivalent while producing a different byte string than the one that was actually signed — breaking the intended binding between "what was verified" and "what gets acted on." Protocols that need this property specify a genuinely canonical encoding: DER (not BER) for ASN.1, or an explicit canonical JSON form. **Protobuf's "deterministic serialization" option is a common trap here** — [protobuf's own documentation states outright that it is not canonical](https://protobuf.dev/programming-guides/serialization-not-canonical/): it isn't guaranteed stable across builds, languages, or schema changes, so it must not be relied on for anything a signature needs to remain stably verifiable over time (cross-version or cross-implementation signing/verification). If you need canonical bytes for signing and your data model is protobuf, define an explicit application-level canonicalization scheme (e.g., serialize into a stable intermediate form and sign that) rather than trusting protobuf's deterministic mode to stay stable.
- **Context binding**: A signature or MAC computed correctly, over the correctly serialized message, can still be misused if nothing ties it to *where* and *when* it's valid — enabling replay of a legitimate value into a different session, a different protocol version, or a different deployment entirely. TLS 1.3's `CertificateVerify` (which signs the whole handshake transcript, not just an isolated key share) and its `Finished` messages, and Ethereum's chain-ID-bound transaction signatures (EIP-155, discussed on the Blockchain Cryptography page), are both context-binding mechanisms: they make a signature meaningfully invalid outside the specific context it was created for.
- **Key separation**: Using one key for multiple cryptographic roles (encryption and MAC, or signing and key exchange) risks interactions between the roles that neither role's individual security proof accounts for — a key-exchange private key and a signing private key have different usage patterns and different exposure profiles, and conflating them can leak information neither operation's own analysis anticipated. Standard practice derives distinct, purpose-labeled sub-keys from a single master secret via a KDF (see the Envelope Encryption and HKDF material elsewhere in this section) rather than reusing one key across unrelated cryptographic operations.
- **Safe chunked/streaming AEAD**: AEAD gives strong guarantees about a single, complete ciphertext — but naively splitting a large payload into chunks and encrypting each chunk independently with the same key reopens exactly the vulnerabilities AEAD was supposed to close: an attacker who can't forge a single chunk can still often **reorder**, **drop**, **duplicate**, or **truncate** chunks, none of which an independent per-chunk AEAD tag detects, since the tag only authenticates that one chunk's own contents. Safe streaming-AEAD constructions (Rogaway & Hoang's STREAM construction, used in libsodium's `secretstream` API and in tools like `age`) close this by binding a monotonic chunk counter and an explicit "is this the final chunk" flag into each chunk's nonce or associated data, so the decrypting side can detect reordering, drops, duplication, and truncation as authentication failures rather than silently accepting a tampered stream. TLS's record layer uses the same idea for reordering, dropping, and duplication — an implicit per-record sequence number folded into each record's nonce — but that alone doesn't cover **truncation at the end of the stream**: an attacker who simply terminates the underlying TCP connection early can cut a response short without violating any individual record's sequence number. TLS handles that separately, via an authenticated [`close_notify` alert](https://www.rfc-editor.org/rfc/rfc8446#section-6.1) that a compliant implementation must receive before treating the stream as cleanly finished — a bare connection close without one is treated as a potential truncation, not a clean end. Don't assume per-record sequence numbers alone give you end-of-stream integrity; that needs an explicit authenticated closure signal or application-level framing (e.g., a length prefix or an explicit end marker) on top.

## Practical Cryptographic Implementation Guidelines

- **Never Invent Custom Cryptography**: Always use standardized, peer-reviewed primitives and high-level libraries (*libsodium, WebCrypto, OpenSSL 3.x, Tink*).
- **Enforce Authenticated Encryption (AEAD)**: For new symmetric encryption that needs confidentiality, default to AEAD (AES-GCM, ChaCha20-Poly1305) — unauthenticated modes (e.g., AES-CBC without a MAC) are vulnerable to padding oracle attacks.
- **Use a CSPRNG for Keys, Tokens, and Randomly-Generated Values**: Never generate key material, session tokens, or API tokens with a non-cryptographic PRNG. For nonces and salts specifically, follow the construction's actual requirement (see "Cryptographic Randomness" above) — some nonce constructions need CSPRNG-grade unpredictability, others only need uniqueness and are equally well served by a monotonic counter; a salt likewise needs uniqueness, not secrecy. Using a CSPRNG for a uniqueness-only requirement isn't wrong, but treating it as the only correct choice glosses over simpler, equally valid mechanisms.
- **Ensure Cryptographic Agility**: Design software protocols to support key and algorithm rotation as cryptanalytic capabilities advance.
- **Account for Long-Term Data Lifetimes**: Data encrypted today must remain secure for the duration of its confidentiality lifetime, incorporating post-quantum migration planning (**[NIST FIPS 203 ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)**, **[NIST FIPS 204 ML-DSA](https://csrc.nist.gov/pubs/fips/204/final)**; general key management guidance is provided by **[NIST SP 800-175B Rev. 1](https://csrc.nist.gov/pubs/sp/800/175/b/r1/final)**).

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Cryptographic Foundations Summary</strong>
    <ul>
      <li><strong>CSPRNG Requirement</strong>: Keys, tokens, and any value needing genuine unpredictability must use OS CSPRNG APIs (<code>secrets.token_bytes()</code>, <code>crypto.randomBytes()</code>) — never a non-cryptographic PRNG (<code>Math.random()</code>). Nonces and salts follow their construction's own requirement (uniqueness, unpredictability, or both) rather than defaulting to a CSPRNG by category.</li>
      <li><strong>Default to AEAD for New Symmetric Encryption</strong>: When confidentiality is the goal, use Authenticated Encryption with Associated Data (AES-GCM, ChaCha20-Poly1305) to prevent padding oracle attacks.</li>
      <li><strong>Protocol Composition</strong>: Production protocols combine asymmetric signatures (authentication), ephemeral ECDH (key agreement), and symmetric AEAD (bulk data).</li>
      <li><strong>DRBG State Hazards</strong>: <code>fork()</code>, live VM snapshots, and container checkpoint/restore all duplicate in-process (and sometimes kernel-level) CSPRNG state — reseed explicitly after any of these events, or rely on a fresh OS-level CSPRNG call per use instead of a long-lived DRBG instance. An ordinary container image start is not this hazard — it produces fresh state, not a duplicated live snapshot.</li>
      <li><strong>Implementation Attacks Are a Separate Threat Class</strong>: Timing, cache, power, and fault-injection side channels can leak keys from a mathematically sound algorithm through its concrete implementation; use vetted constant-time libraries (libsodium, HACL*, BoringSSL) rather than hand-rolled "constant-time" code, and don't rely on <code>memset()</code> alone to guarantee a secret is gone from memory.</li>
      <li><strong>Composition Failures</strong>: Domain separation, canonical serialization, and context binding prevent a value computed for one purpose from being replayed as valid for another; naive per-chunk AEAD over a stream doesn't detect chunk reordering, dropping, duplication, or truncation without an explicit sequence counter and final-chunk marker.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-90A Rev. 1**: *Recommendation for Random Number Generation Using Deterministic Random Bit Generators* — [NIST CSRC SP 800-90A](https://csrc.nist.gov/pubs/sp/800/90/a/r1/final)
- **NIST SP 800-90B**: *Recommendation for the Entropy Sources Used for Random Bit Generation* — [NIST CSRC SP 800-90B](https://csrc.nist.gov/pubs/sp/800/90/b/final)
- **RFC 8446**: *The Transport Layer Security (TLS) Protocol Version 1.3* — [IETF RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)
- **RFC 8032**: *Edwards-Curve Digital Signature Algorithm (EdDSA)* (context-string domain separation, §2 &amp; §5.1) — [IETF RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)
