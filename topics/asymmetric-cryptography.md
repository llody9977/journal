---
title: Asymmetric Cryptography
description: RSA and ECC (ECDSA/ECDH/EdDSA), key pairs, and how public-key cryptography solves what symmetric crypto can't.
permalink: /topics/asymmetric-cryptography/
last_verified: 2026-08-05
---

<span class="eyebrow">Cryptography / Concepts</span>

# Asymmetric Cryptography

<p class="lede">The reason I need asymmetric cryptography is the key-distribution problem: symmetric encryption is excellent once both sides already share a secret, but it does not tell me how strangers should establish or authenticate that secret in the first place.</p>

## The core idea: two different keys

Instead of one shared secret, asymmetric cryptography generates a mathematically-linked **key pair**:

- A **public key** — designed to be distributed. Its owner or purpose still needs to be authenticated.
- A **private key** — kept secret and restricted to authorized operations. It may be held by one device, an HSM, or a threshold system rather than one person.

The relationship between them supports two distinct, and easy to confuse, operations:

<div class="diagram-frame">
  <img src="{{ '/assets/img/asymmetric-flow.svg' | relative_url }}" alt="Two diagrams. First: anyone can encrypt using the public key, but only the private key owner can decrypt. Second: only the private key owner can sign, but anyone with the public key can verify that signature.">
  <p class="diagram-caption">The public/private relationship, used by schemes with different purposes</p>
</div>

1. **Public-key encryption** — in a scheme designed for encryption, the public key protects a small value and the private key decrypts it. Real systems normally use this inside hybrid encryption rather than for bulk data.
2. **Signing** — in a signature scheme, the private key signs and the public key verifies. This provides evidence that someone controlling the private key produced the signature. Attribution to a person or organization still depends on how the public key was authenticated and how the private key was protected.
3. **Key agreement** — schemes such as ECDH let two parties derive a shared secret. ECDH is neither encryption nor a signature and must be authenticated by the surrounding protocol.

This second use is exactly the mechanism behind the overview's "Official ID & Notary Stamp" and "Handwritten Signature" examples — a CA's signature on a certificate, or a signed software update, is this exact operation.

## Why this solves the key-distribution problem

A public key does not need confidentiality in transit, but it does need **authenticity**. If an attacker can replace Alice's public key with their own, the victim may encrypt to or verify signatures from the attacker instead. Certificates, authenticated directories, fingerprints checked over another channel, and trust-on-first-use are different ways of solving that binding problem.

The trade-off is performance and payload size: public-key operations are much more expensive than symmetric encryption, but the ratio varies heavily by algorithm, operation, hardware, and message size. In practice I should use **hybrid encryption**: public-key cryptography or key agreement establishes/protects a short-lived symmetric key, and that key handles the bulk data.

## The two main families: RSA and ECC

| | RSA | ECC (Elliptic Curve Cryptography) |
|---|---|---|
| Hard problem it relies on | Factoring the product of two large primes | The elliptic curve discrete logarithm problem |
| Typical key sizes | 2048 / 3072 / 4096 bits | 256 / 384 / 521 bits |
| Performance | Depends on operation, parameter size, hardware, and implementation | Often smaller keys and signatures; performance still depends on the selected operation and curve |
| Signing scheme | RSA-PSS (modern) or PKCS#1 v1.5 (legacy) | ECDSA, or EdDSA (Ed25519) |
| Key exchange scheme | Not typically used this way | ECDH (Elliptic Curve Diffie-Hellman) |
| Maturity | Older, extremely well-studied, still widely deployed | Well-established and common in new systems; TLS key exchange, SSH keys, and certificate signing algorithms are separate choices |

The headline difference is size, for the same security margin:

<div class="diagram-frame">
  <img src="{{ '/assets/img/key-size-comparison.svg' | relative_url }}" alt="Bar chart comparing RSA and ECC key sizes needed for equivalent security strength: RSA-2048 vs ECC-224 for ~112-bit security, RSA-3072 vs ECC-256 for ~128-bit security, and RSA-7680 vs ECC-384 for ~192-bit security — RSA keys grow dramatically larger while ECC keys grow only modestly.">
  <p class="diagram-caption">RSA key sizes grow steeply; ECC stays compact at every security level</p>
</div>

Smaller keys and signatures can reduce certificate size and computation, which is why elliptic-curve schemes are common in new systems. RSA is still widely deployed and is not “broken” at approved key sizes.

## EdDSA and Ed25519: the newer signing scheme

**EdDSA** (Edwards-curve Digital Signature Algorithm), most commonly seen as **Ed25519**, is a newer signature scheme built on different curve math than ECDSA. Two practical advantages drive its growing adoption:

- **Deterministic nonce derivation** — ECDSA needs a unique, unpredictable per-signature nonce; weak or reused nonces can expose the private key. Ed25519 derives its per-message nonce deterministically, avoiding dependence on fresh randomness for every signature. It does not remove the need for secure key generation or protection against implementation and side-channel faults.
- **Fast, and simple to implement correctly** — fewer edge cases than ECDSA, which has made it popular for SSH keys, new certificate types, and systems like Signal's protocol.

## Practical demo: generating and using key pairs with OpenSSL

Generate an EC (P-256) key pair and sign a file:

```
$ openssl ecparam -name prime256v1 -genkey -noout -out private.pem
$ openssl ec -in private.pem -pubout -out public.pem
read EC key
writing EC key

$ openssl dgst -sha256 -sign private.pem -out message.sig message.txt

$ openssl dgst -sha256 -verify public.pem -signature message.sig message.txt
Verified OK
```

The same shape with Ed25519 instead:

```
$ openssl genpkey -algorithm ed25519 -out ed_private.pem
$ openssl pkey -in ed_private.pem -pubout -out ed_public.pem

$ openssl pkeyutl -sign -inkey ed_private.pem -out message.sig -rawin -in message.txt
$ openssl pkeyutl -verify -pubin -inkey ed_public.pem -sigfile message.sig -rawin -in message.txt
Signature Verified Successfully
```

Note there's no explicit `-sha256` step for Ed25519 — the hashing is built into the algorithm itself, one less decision (and one less way to misconfigure it).

## Why exposing a public key is safe, but exposing a private key never is

The public and private key aren't two independent secrets that happen to work together — the public key is *mathematically derived from* the private key, in one direction only. For ECC, deriving the public key is a single scalar point multiplication (`public = private × G`, where `G` is the curve's fixed base point) — fast, deterministic, and something anyone can redo as many times as they like, given the private key. Going the other way — recovering the private key from the public one — means solving the elliptic curve discrete logarithm problem, the actual hard problem the entire scheme's security rests on. For RSA it's the same shape with different math: the public key (modulus and exponent) falls directly out of the private key's prime factors, while going backward means factoring the modulus.

That asymmetry is the entire reason a public key is safe to publish anywhere and a private key never is:

- **A leaked public key costs nothing.** It was already meant to be public. Nothing about having it gets an attacker any closer to the private key, because that direction is exactly the hard problem.
- **A leaked private key compromises the security purpose of the key pair.** The public key was never secret, so “compromising both halves” is not the useful description. The problem is that the attacker can now decrypt, sign, or impersonate wherever that private key is trusted, depending on the scheme.

A real demonstration — derive the public key from the same private key twice, independently, and compare:

```
$ openssl ecparam -name prime256v1 -genkey -noout -out private.pem

$ openssl ec -in private.pem -pubout -out public_attempt1.pem
read EC key
writing EC key

$ openssl ec -in private.pem -pubout -out public_attempt2.pem
read EC key
writing EC key

$ diff public_attempt1.pem public_attempt2.pem && echo IDENTICAL
IDENTICAL
```

Byte-for-byte identical, every time, forever — because it isn't really "regeneration" in the sense of creating something new, it's the same deterministic computation over the same input. Compare that to trying the reverse: there is no `openssl` command that derives a private key from a public key, for the same reason there's no command that factors a 2048-bit RSA modulus in reasonable time — it isn't a missing feature, it's the entire security guarantee of the algorithm.

## Common pitfalls

- **Using raw/"textbook" RSA** — RSA without proper padding (OAEP for encryption, PSS for signing) is insecure and malleable. Always use a library's high-level API, never raw modular exponentiation.
- **Weak randomness during key generation** — the 2008 Debian OpenSSL bug reduced the effective entropy of generated keys to a tiny, guessable set, retroactively breaking huge numbers of already-issued keys. Key generation must use a properly seeded CSPRNG.
- **Reusing a key pair across purposes** — a key used for both encryption and signing can, in some schemes, let an attacker abuse one operation to forge the other. Use separate key pairs per purpose.
- **Not validating curve points** — accepting an EC public key without checking it's actually a valid point on the expected curve opens the door to invalid-curve attacks that can leak private key material.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/fips/186-5/final">FIPS 186-5</a></strong> is the current Digital Signature Standard, approving RSA, ECDSA, and EdDSA. <strong><a href="https://csrc.nist.gov/pubs/sp/800/56/a/r3/final">NIST SP 800-56A Rev. 3</a></strong> covers key-establishment schemes (including ECDH). <strong><a href="https://csrc.nist.gov/pubs/sp/800/186/final">NIST SP 800-186</a></strong> specifies the approved elliptic curves (P-256, P-384, P-521, and Edwards curves).</p>
</div>
