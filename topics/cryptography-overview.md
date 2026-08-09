---
title: What Is Cryptography?
description: Architectural overview of cryptographic primitives, core security properties (Confidentiality, Integrity, Authenticity, Non-Repudiation), and protocol composition.
permalink: /topics/cryptography-overview/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Concepts</span>

# What Is Cryptography?

<p class="lede">Cryptography is the mathematical and architectural discipline of securing data in transit, at rest, and in execution over untrusted channels. System evaluations begin by defining the required security property—Confidentiality, Integrity, Authenticity, or Non-Repudiation—and selecting reviewed, standardized algorithms and protocols that enforce those properties under explicit threat models.</p>

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
| **Confidentiality** | Restricts payload reading exclusively to authorized key holders | **Symmetric Ciphers** (*AES-256-GCM, ChaCha20-Poly1305*) &amp; **Hybrid KEMs** (*FIPS 203 ML-KEM, HPKE*) | Cleartext exfiltration of PII, passwords, or financial transactions |
| **Integrity** | Ensures payload modification or bit-rot is detected and rejected | **Cryptographic Hashes** (*SHA-256, SHA3-256*) &amp; **MACs** (*HMAC-SHA256*) | Unauthorized alteration of database fields or transaction amounts |
| **Non-Repudiation** | Generates unforgeable cryptographic evidence tying an action to a private key | **Asymmetric Digital Signatures** (*Ed25519, FIPS 205 SLH-DSA*) with timestamping and key custody logs | Disavowal of financial commitments or administrative actions |

## Real-World Protocol Composition: How TLS 1.3 Combines Primitives

Production security protocols rarely rely on a single cryptographic primitive. Instead, they combine primitives into a cohesive architecture.

For example, **TLS 1.3** ([RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)) coordinates primitives across four phases:

<div class="diagram-frame">
  <img src="{{ '/assets/img/tls-cryptography-layers.svg' | relative_url }}" alt="TLS cryptographic layers for server authentication, shared-secret establishment, and authenticated encryption of application data.">
  <p class="diagram-caption">TLS composes several cryptographic mechanisms rather than relying on one algorithm</p>
</div>

1. **Authentication**: The server proves ownership of a public key bound to a domain via an X.509 Certificate issued by a trusted CA.
2. **Ephemeral Key Agreement**: Peer endpoints execute **X25519 / ECDHE** (or hybrid **X25519MLKEM768**) to derive a transient shared secret without transmitting private keys.
3. **AEAD Bulk Encryption**: All application data is encrypted and authenticated using **AES-256-GCM** or **ChaCha20-Poly1305**.

## Cryptographic Randomness: PRNG vs. CSPRNG

All cryptographic security ultimately depends on unpredictable randomness. Keys, nonces, Initialization Vectors (IVs), salts, and session tokens must be generated using high-entropy random sources.

### PRNG vs. CSPRNG Comparison

| Generator Class | Internal Mechanics | Security Properties | Target Application Use Case |
|---|---|---|---|
| **Non-Cryptographic PRNG** | Fast deterministic algorithms (*Linear Congruential Generators, Mersenne Twister*). | **INSECURE**: Observing a few outputs exposes internal state, allowing attackers to predict all future values. | Game physics, Monte Carlo simulations, UI shuffling. (*Do NOT use for security*). |
| **CSPRNG** (Cryptographically Secure PRNG) | OS entropy pool expanded via SHA-256 / AES-CTR-DRBG ([NIST SP 800-90A](https://csrc.nist.gov/pubs/sp/800/90/a/r1/final)). | **SECURE**: Satisfies **Next-Bit Unpredictability** and **Backtracking Resistance** (state compromise cannot reveal past keys). | Generating AES keys, RSA/ECC key pairs, IVs, salts, and API tokens. |

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

### Executable Proof: Insecure PRNG (MT19937) State Reconstruction Attack

The Python script below demonstrates how an adversary observing 624 outputs from a non-cryptographic PRNG (Mersenne Twister `MT19937` used in standard `random`) can invert the tempering operations, reconstruct the internal state, and predict **100% of all future tokens**:

```python
# prng_exploit.py: Reconstructing non-cryptographic PRNG internal state
import random

def un_right_shift(val, shift):
    res = val
    for _ in range(32 // shift):
        res = val ^ (res >> shift)
    return res

def un_left_shift_mask(val, shift, mask):
    res = val
    for _ in range(32 // shift):
        res = val ^ ((res << shift) & mask)
    return res

def untemper(y):
    y = un_right_shift(y, 18)
    y = un_left_shift_mask(y, 15, 0xefc60000)
    y = un_left_shift_mask(y, 7, 0x9d2c5680)
    y = un_right_shift(y, 11)
    return y

# 1. Target server generates tokens using standard Python random (MT19937 PRNG)
target_server_rng = random.Random(42)

# 2. Attacker observes 624 32-bit outputs from public reset requests
observed_tokens = [target_server_rng.getrandbits(32) for _ in range(624)]

# 3. Attacker untempers outputs to reconstruct internal 624-word state array
reconstructed_state = [untemper(x) for x in observed_tokens]

# 4. Attacker clones state into their own local predictor instance
attacker_predictor_rng = random.Random()
attacker_predictor_rng.setstate((3, tuple(reconstructed_state + [624]), None))

# 5. Target server generates the NEXT secret password-reset token for a victim
target_secret_token = target_server_rng.getrandbits(32)

# 6. Attacker predicts the EXACT secret token!
predicted_token = attacker_predictor_rng.getrandbits(32)

print("Target Next Secret Token :", target_secret_token)
print("Attacker Predicted Token :", predicted_token)
print("State Reconstruction    :", "SUCCESS (100% Match!)" if target_secret_token == predicted_token else "FAILED")
# Output: Target Next Secret Token : 1071722055
#         Attacker Predicted Token : 1071722055
#         State Reconstruction    : SUCCESS (100% Match!)
```

## Practical Cryptographic Implementation Guidelines

- **Never Invent Custom Cryptography**: Always use standardized, peer-reviewed primitives and high-level libraries (*libsodium, WebCrypto, OpenSSL 3.x, Tink*).
- **Enforce Authenticated Encryption (AEAD)**: Unauthenticated symmetric ciphers (e.g., AES-CBC without MAC) are vulnerable to padding oracle attacks.
- **Enforce CSPRNG for Key Material**: Generate all keys, nonces, and salts using OS CSPRNG APIs. Never use PRNG functions.
- **Ensure Cryptographic Agility**: Design software protocols to support key and algorithm rotation as cryptanalytic capabilities advance.
- **Account for Long-Term Data Lifetimes**: Data encrypted today must remain secure for the duration of its confidentiality lifetime, incorporating post-quantum migration planning (**[NIST FIPS 203 ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)**, **[NIST FIPS 204 ML-DSA](https://csrc.nist.gov/pubs/fips/204/final)** per **[NIST SP 800-175B Rev. 1](https://csrc.nist.gov/pubs/sp/800/175/b/r1/final)**).

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
