---
title: Asymmetric Cryptography
description: RSA and ECC (ECDSA/ECDH/EdDSA), key pairs, and how public-key cryptography solves what symmetric crypto can't.
permalink: /topics/asymmetric-cryptography/
---

<span class="eyebrow">Cryptography / Foundations / Deep Dive</span>

# Asymmetric Cryptography

<p class="lede">Symmetric cryptography (see the <a href="{{ '/topics/symmetric-cryptography/' | relative_url }}">previous topic</a>) has one problem it cannot solve by itself: both sides need the same secret key before anything works, and getting that key across safely is exactly the problem encryption was supposed to solve in the first place. Asymmetric cryptography exists to break that circularity.</p>

## The core idea: two different keys

Instead of one shared secret, asymmetric cryptography generates a mathematically-linked **key pair**:

- A **public key** — safe to hand out to literally anyone, publish on a website, print on a business card.
- A **private key** — kept by exactly one party, never transmitted, never shared.

The relationship between them supports two distinct, and easy to confuse, operations:

<div class="diagram-frame">
  <img src="{{ '/assets/img/asymmetric-flow.svg' | relative_url }}" alt="Two diagrams. First: anyone can encrypt using the public key, but only the private key owner can decrypt. Second: only the private key owner can sign, but anyone with the public key can verify that signature.">
  <p class="diagram-caption">Same key pair, two opposite-direction guarantees</p>
</div>

1. **Encryption** — the public key locks, the private key is the only thing that unlocks. This gives confidentiality: anyone can send the owner a secret, but only the owner can read it.
2. **Signing** — the private key signs, the public key verifies. This gives authenticity and, in principle, non-repudiation: only the owner could have produced a valid signature, and anyone can check it without needing any secret at all. In practice that guarantee is only as strong as how the private key is actually protected — see [Symmetric vs Asymmetric Cryptography]({{ '/topics/symmetric-vs-asymmetric/' | relative_url }}) and [Digital Signatures]({{ '/topics/digital-signatures/' | relative_url }}#non-repudiation-what-it-actually-promises) for exactly what can go wrong.

This second use is exactly the mechanism behind the overview's "Official ID & Notary Stamp" and "Handwritten Signature" examples — a CA's signature on a certificate, or a signed software update, is this exact operation.

## Why this solves the key-distribution problem

A public key needs no protection in transit — it can travel over the most hostile network imaginable and it doesn't matter, because knowing it doesn't let anyone decrypt anything or forge a signature. That completely sidesteps symmetric crypto's original problem.

The trade-off: asymmetric operations are computationally expensive — often 100–1000× slower than symmetric ones for equivalent data sizes. In practice, almost nobody encrypts bulk data directly with RSA or ECC. Instead, systems use **hybrid encryption**: asymmetric crypto establishes or protects a short-lived symmetric key, and that symmetric key does the actual heavy lifting. This is precisely what happens during a [TLS handshake]({{ '/topics/tls-ssl-handshake/' | relative_url }}) — and, decades earlier and still running today, in PGP/OpenPGP encrypted email. [Symmetric vs Asymmetric Cryptography]({{ '/topics/symmetric-vs-asymmetric/' | relative_url }}#the-real-answer-is-both-hybrid-encryption-and-pgp-as-the-enduring-example) walks through the PGP version of this pattern in detail.

## The two main families: RSA and ECC

| | RSA | ECC (Elliptic Curve Cryptography) |
|---|---|---|
| Hard problem it relies on | Factoring the product of two large primes | The elliptic curve discrete logarithm problem |
| Typical key sizes | 2048 / 3072 / 4096 bits | 256 / 384 / 521 bits |
| Relative speed | Slower, especially key generation | Faster for equivalent security |
| Signing scheme | RSA-PSS (modern) or PKCS#1 v1.5 (legacy) | ECDSA, or EdDSA (Ed25519) |
| Key exchange scheme | Not typically used this way | ECDH (Elliptic Curve Diffie-Hellman) |
| Maturity | Older, extremely well-studied, still widely deployed | Newer, now the default for most new systems (TLS 1.3, SSH, modern certificates) |

The headline difference is size, for the same security margin:

<div class="diagram-frame">
  <img src="{{ '/assets/img/key-size-comparison.svg' | relative_url }}" alt="Bar chart comparing RSA and ECC key sizes needed for equivalent security strength: RSA-2048 vs ECC-224 for ~112-bit security, RSA-3072 vs ECC-256 for ~128-bit security, and RSA-7680 vs ECC-384 for ~192-bit security — RSA keys grow dramatically larger while ECC keys grow only modestly.">
  <p class="diagram-caption">RSA key sizes grow steeply; ECC stays compact at every security level</p>
</div>

Smaller keys mean smaller certificates, faster handshakes, and less CPU spent per connection — which is why ECC has become the default recommendation for new systems, not because RSA is broken.

## EdDSA and Ed25519: the newer signing scheme

**EdDSA** (Edwards-curve Digital Signature Algorithm), most commonly seen as **Ed25519**, is a newer signature scheme built on different curve math than ECDSA. Two practical advantages drive its growing adoption:

- **Deterministic** — ECDSA requires a fresh random number for every single signature; if that randomness is ever weak, reused, or predictable, the private key can be recovered entirely (this is exactly what happened in the Sony PS3 signing-key leak in 2010). Ed25519 removes the random number from the equation, closing off that entire failure class.
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
- **A leaked private key regenerates the public key too, deterministically.** There's no such thing as "only the private key leaked, the public key is still fine" — anyone holding the private key can trivially recompute the exact matching public key at will, so a private-key leak is a total, immediate compromise of both halves at once.

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

## Where this fits

Asymmetric cryptography is the mathematical machinery — but on its own, it only tells you "this public key can only be unlocked by whoever holds the matching private key." It says nothing about *whose* key that is. Binding a public key to a real-world identity is exactly the job of [Certificate Authorities & Certificates]({{ '/topics/certificates/' | relative_url }}), and negotiating a fresh key pair safely for every connection is the job of [Key Exchange & Key Derivation]({{ '/topics/key-exchange-derivation/' | relative_url }}).
