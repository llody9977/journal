---
title: Key Exchange & Key Derivation
description: Diffie-Hellman/ECDH, forward secrecy, and turning a shared secret into usable keys with HKDF.
permalink: /topics/key-exchange-derivation/
last_verified: 2026-08-05
---

<span class="eyebrow">Cryptography / Concepts</span>

# Key Exchange & Key Derivation

<p class="lede">I keep two steps separate in my head: first establish a shared secret over an observed network, then derive the actual protocol keys from that secret. Mixing these steps is where explanations become too hand-wavy.</p>

## Key exchange: Diffie-Hellman

**Diffie-Hellman (DH)** solves a problem that looks paradoxical at first: let two parties, watched the entire time by an eavesdropper, agree on a secret that the eavesdropper cannot feasibly compute — without either party ever sending that secret, or enough to reconstruct it.

<div class="diagram-frame">
  <img src="{{ '/assets/img/diffie-hellman.svg' | relative_url }}" alt="Diagram of Diffie-Hellman key exchange: Alice and Bob each combine a shared public value with their own private secret, exchange the results in the open, then each combines the received value with their own secret again, arriving at the same shared secret that an eavesdropper — who only saw the public value and both exchanged values — cannot compute." >
  <p class="diagram-caption">An eavesdropper sees everything sent — and still can't compute the shared secret</p>
</div>

The classical version (as pictured) relies on modular exponentiation: both parties agree publicly on a generator `g` and a prime `p`, each picks a private exponent, and the math (`g^a mod p`, then raised to the other party's exponent) happens to land on the same value from both directions — while reversing it (recovering `a` from `g^a mod p`) is the **discrete logarithm problem**, believed to be computationally infeasible for large enough parameters.

**ECDH (Elliptic Curve Diffie-Hellman)** is the same idea, using point multiplication on an elliptic curve instead of modular exponentiation. It is common in modern protocols because it provides compact keys at a given classical security strength. The selected curve, authentication method, protocol, and implementation still matter.

## Forward secrecy: why "ephemeral" matters

| | Static key agreement | Ephemeral DH (DHE / ECDHE) |
|---|---|---|
| Key pair used | Same long-term key pair, every session | Fresh, temporary key pair, generated per session |
| If the long-term private agreement key leaks later | Recorded sessions that derived secrets directly from that static key may be exposed | Properly erased ephemeral secrets prevent a later authentication-key compromise from recovering completed session keys |
| Operational requirement | Protect one long-lived agreement key | Generate fresh ephemeral keys and erase them after use |
| Used by | Protocol-specific and legacy designs | Certificate-authenticated TLS 1.3 and many modern secure-channel protocols |

That “past sessions stay safe after a later long-term-key compromise” property is **forward secrecy**. TLS 1.3 removed static RSA and static DH key exchange. A normal certificate-authenticated handshake uses ephemeral (EC)DHE. One exception matters: TLS 1.3 also permits PSK-only `psk_ke`, which does not provide forward secrecy for the resumption secret. [RFC 8446 §2.2](https://www.rfc-editor.org/rfc/rfc8446.html#section-2.2) explicitly distinguishes PSK-only from PSK with (EC)DHE.

## From shared secret to usable keys: KDFs

I do not use the raw output of a DH or ECDH exchange directly as an AES key. A key derivation function gives the output the required form and context separation, while real protocols normally need several independent keys from one exchange—for example, separate traffic keys for each direction.

**HKDF (HMAC-based Key Derivation Function)**, defined in **[RFC 5869](https://www.rfc-editor.org/rfc/rfc5869)**, solves this in two steps:

1. **Extract** — condense the (possibly imperfect) shared secret into a pseudorandom key under HKDF's assumptions. This is not a claim of true uniform randomness for arbitrary low-entropy input.
2. **Expand** — stretch that into as many independent, purpose-labeled keys as the protocol needs (e.g. "client write key", "server write key", "client MAC key" all derived from one exchange, each cryptographically independent of the others).

<div class="callout warn" id="a-different-problem-password-based-kdfs">
  <span class="callout-title">A different problem: password-based KDFs</span>
  <p>HKDF assumes the input already has sufficient entropy, such as an approved DH output. Human-chosen password entropy is difficult to estimate and is normally low enough for offline guessing to matter. Turning a password into a key needs a deliberately expensive password KDF such as PBKDF2, scrypt, or Argon2. That's a different problem, covered under <a href="{{ '/topics/password-storage/' | relative_url }}">Password Storage</a>.</p>
</div>

## Practical demo: ECDH with OpenSSL (X25519)

```
$ openssl genpkey -algorithm x25519 -out alice.pem
$ openssl genpkey -algorithm x25519 -out bob.pem
$ openssl pkey -in alice.pem -pubout -out alice_pub.pem
$ openssl pkey -in bob.pem -pubout -out bob_pub.pem

$ openssl pkeyutl -derive -inkey alice.pem -peerkey bob_pub.pem -out alice_shared.bin
$ openssl pkeyutl -derive -inkey bob.pem -peerkey alice_pub.pem -out bob_shared.bin

$ diff alice_shared.bin bob_shared.bin && echo IDENTICAL
IDENTICAL

$ wc -c < alice_shared.bin
32
```

Alice derives her copy using her private key and Bob's public key; Bob does the reverse. The generated private keys and the 32 output bytes change on every run, but `diff` should still print `IDENTICAL`. This only demonstrates agreement. A real protocol must authenticate the exchanged public keys and feed the shared secret through a suitable KDF.

## Real-world case: Logjam (2015)

**Logjam** ([CVE-2015-4000](https://nvd.nist.gov/vuln/detail/CVE-2015-4000), disclosed May 2015) exploited support for 512-bit export-grade Diffie-Hellman in TLS. An active attacker could rewrite the offered cipher suites so a vulnerable server selected export DHE. The server's signed key-exchange structure did not cover the original client offer, so the client could accept the downgraded exchange. After computing the weak 512-bit secret, the attacker could read or modify the protected traffic. The [researchers' site](https://weakdh.org/) also explains why reuse of common primes made precomputation valuable.

Logjam is mainly a lesson about weak shared DH groups and downgrade resistance, not a failure of forward secrecy itself. The practical fix was to remove export-grade suites, use appropriately sized or standardized groups, and bind negotiation to the authenticated transcript. TLS 1.3 removes the export and static key-exchange choices involved here.

## Common pitfalls

- **Using static instead of ephemeral DH** — silently forfeits forward secrecy; a future key compromise retroactively decrypts everything.
- **Using the raw shared secret as an encryption key directly** — skips HKDF (or an equivalent), risking subtle structure in the key material.
- **Deriving multiple keys by simple truncation** (e.g. "first 16 bytes = key 1, next 16 = key 2") instead of a proper labeled KDF expand step — can introduce unexpected correlations between the "independent" keys.
- **Confusing this with password-based key derivation** — HKDF is not a substitute for PBKDF2/scrypt/Argon2, and vice versa; they solve different entropy problems.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/sp/800/56/a/r3/final">NIST SP 800-56A Rev. 3</a></strong> covers DH/ECDH key-establishment schemes. <strong><a href="https://www.rfc-editor.org/rfc/rfc7748">RFC 7748</a></strong> specifies the X25519 and X448 curves used above. <strong><a href="https://www.rfc-editor.org/rfc/rfc5869">RFC 5869</a></strong> defines HKDF.</p>
</div>
