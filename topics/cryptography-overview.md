---
title: What Is Cryptography?
description: Architectural overview of cryptographic primitives, core security properties (Confidentiality, Integrity, Authenticity, Non-Repudiation), and protocol composition.
permalink: /topics/cryptography-overview/
last_verified: 2026-08-09
---

<span class="eyebrow">Cryptography / Concepts</span>

# What Is Cryptography?

<p class="lede">Cryptography is the mathematical and architectural discipline of securing data in transit, at rest, and in processing or storage over untrusted networks and storage environments. System evaluations begin by defining the required security property—Confidentiality, Integrity, Authenticity, or Non-Repudiation—and selecting reviewed, standardized algorithms and protocols that enforce those properties under explicit threat models.</p>

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
| **Integrity** | Ensures payload modification or bit-rot is detected and rejected | **Cryptographic Hashes** (*SHA-256, SHA3-256*) &amp; **MACs** (*HMAC-SHA256*) | Unauthorized alteration of database fields or transaction amounts |
| **Non-Repudiation** | Generates cryptographic evidence, computationally unforgeable under the signature scheme, tying an action to a private key—supporting but not by itself constituting legal non-repudiation | **Asymmetric Digital Signatures** (*Ed25519, FIPS 205 SLH-DSA*) with timestamping and key custody logs | Disavowal of financial commitments or administrative actions |

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

All cryptographic security ultimately depends on unpredictable randomness. Keys, nonces, Initialization Vectors (IVs), salts, and session tokens must be generated using high-entropy random sources.

### PRNG vs. CSPRNG Comparison

| Generator Class | Internal Mechanics | Security Properties | Target Application Use Case |
|---|---|---|---|
| **Non-Cryptographic PRNG** | Fast deterministic algorithms (*Linear Congruential Generators, Mersenne Twister*). | **INSECURE**: Observing a few outputs exposes internal state, allowing attackers to predict all future values. | Game physics, Monte Carlo simulations, UI shuffling. (*Do NOT use for security*). |
| **CSPRNG** (Cryptographically Secure PRNG) | OS entropy pool expanded via SHA-256 / AES-CTR-DRBG ([NIST SP 800-90A](https://csrc.nist.gov/pubs/sp/800/90/a/r1/final)). | **SECURE when properly seeded**: Satisfies **Next-Bit Unpredictability** and **Backtracking Resistance** (state compromise cannot reveal past keys), provided the entropy source supplies sufficient min-entropy at initialization. | Generating AES keys, RSA/ECC key pairs, IVs, salts, and API tokens. |

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

## Practical Cryptographic Implementation Guidelines

- **Never Invent Custom Cryptography**: Always use standardized, peer-reviewed primitives and high-level libraries (*libsodium, WebCrypto, OpenSSL 3.x, Tink*).
- **Enforce Authenticated Encryption (AEAD)**: Unauthenticated symmetric ciphers (e.g., AES-CBC without MAC) are vulnerable to padding oracle attacks.
- **Enforce CSPRNG for Key Material**: Generate all keys, nonces, and salts using OS CSPRNG APIs. Never use PRNG functions.
- **Ensure Cryptographic Agility**: Design software protocols to support key and algorithm rotation as cryptanalytic capabilities advance.
- **Account for Long-Term Data Lifetimes**: Data encrypted today must remain secure for the duration of its confidentiality lifetime, incorporating post-quantum migration planning (**[NIST FIPS 203 ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)**, **[NIST FIPS 204 ML-DSA](https://csrc.nist.gov/pubs/fips/204/final)**; general key management guidance is provided by **[NIST SP 800-175B Rev. 1](https://csrc.nist.gov/pubs/sp/800/175/b/r1/final)**).

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Cryptographic Foundations Summary</strong>
    <ul>
      <li><strong>CSPRNG Requirement</strong>: Cryptographic keys, nonces, and tokens must use OS CSPRNG APIs (<code>secrets.token_bytes()</code>, <code>crypto.randomBytes()</code>). Never use non-cryptographic PRNGs (<code>Math.random()</code>).</li>
      <li><strong>Enforce AEAD</strong>: Always use Authenticated Encryption with Associated Data (AES-GCM, ChaCha20-Poly1305) to prevent padding oracle attacks.</li>
      <li><strong>Protocol Composition</strong>: Production protocols combine asymmetric signatures (authentication), ephemeral ECDH (key agreement), and symmetric AEAD (bulk data).</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-90A Rev. 1**: *Recommendation for Random Number Generation Using Deterministic Random Bit Generators* — [NIST CSRC SP 800-90A](https://csrc.nist.gov/pubs/sp/800/90/a/r1/final)
- **RFC 8446**: *The Transport Layer Security (TLS) Protocol Version 1.3* — [IETF RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)
