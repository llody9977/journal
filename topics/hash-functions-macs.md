---
title: Hash Functions & MACs
description: SHA-2/3, collision resistance, HMAC, length-extension attacks, and where plain hashing gets misused.
permalink: /topics/hash-functions-macs/
last_verified: 2026-08-05
---

<span class="eyebrow">Cryptography / Concepts</span>

# Hash Functions & MACs

<p class="lede">I use hashes for compact fingerprints and integrity checks, but only when the expected digest comes from somewhere I trust. If an attacker can replace both a file and its digest, an unkeyed hash proves nothing. A MAC adds a shared secret when I also need origin authentication.</p>

## What a cryptographic hash function is designed to provide

A cryptographic hash function maps an input to a fixed-size output called a **digest**. It is deterministic and is designed around the three resistance properties in the next section. A well-designed hash also shows strong diffusion, often called the avalanche effect.

- **Deterministic** — the same bytes produce the same digest.
- **One-way in practice** — preimage resistance should make finding an input for a given digest computationally infeasible.
- **Strong diffusion** — a small input change should affect the digest unpredictably. This is useful behavior, but it is not a substitute for the formal security properties below.

<div class="diagram-frame">
  <img src="{{ '/assets/img/hash-avalanche.svg' | relative_url }}" alt="Diagram showing SHA-256 applied to two nearly identical strings — 'The quick brown fox' and 'The quick brown fox.' with one added period — producing two completely unrelated hash outputs, illustrating the avalanche effect." >
  <p class="diagram-caption">Real SHA-256 output — one character changes everything downstream</p>
</div>

## The three properties, formally

| Property | What it means | What breaks without it |
|---|---|---|
| **Preimage resistance** | Given digest `H(x)`, finding any matching `x` is computationally infeasible | An attacker could recover a matching input from its hash |
| **Second-preimage resistance** | Given a specific `x`, finding a different `x'` with the same hash is computationally infeasible | An attacker could substitute a different file/message with the same digest |
| **Collision resistance** | You can't find *any* two different inputs `x` and `x'` that hash the same, without a specific target in mind | An attacker could forge a malicious document that hashes identically to a legitimately-signed one |

## SHA-2, SHA-3, and the broken ones

| Algorithm | Digest size | Status |
|---|---|---|
| MD5 | 128 bits | **Broken.** Practical collisions since 2004; still used non-cryptographically (checksums) but never for security |
| SHA-1 | 160 bits | **Broken.** Google and CWI Amsterdam published a practical collision ("SHAttered") in 2017 — two different PDFs sharing one SHA-1 hash |
| SHA-256 / SHA-384 / SHA-512 (SHA-2) | 256 / 384 / 512 bits | **Approved and widely used.** Select the member required by the protocol and security strength |
| SHA3-256 / SHA3-512 (SHA-3) | 256 / 512 bits | **Approved alternative.** Different internal construction (Keccak, sponge-based) to SHA-2 — useful as a hedge if SHA-2's construction were ever weakened |

<div class="callout warn">
  <span class="callout-title">"Broken" means practically demonstrated, not theoretical</span>
  <p>The SHA-1 collision required substantial computation, but it moved collision attacks from theory into practice. Migration timing depends on the use, protocol, and standards process; I should follow the current standard rather than infer a universal cutoff from the demonstration date.</p>
</div>

## Hashing is not encryption

A common mix-up worth stating plainly: hashing is **one-way** and has no decryption operation. If I need to recover the original data, I need encryption (see [Symmetric]({{ '/topics/symmetric-cryptography/' | relative_url }}) or [Asymmetric Cryptography]({{ '/topics/asymmetric-cryptography/' | relative_url }})), not a hash function.

## MACs: adding a key to prove who sent it

A plain hash can detect accidental corruption when I already have a trusted reference digest. Anyone can compute `SHA-256(message)`, including an attacker who replaces both the message and digest, so a hash alone cannot prove authenticity or adversarial integrity.

A **MAC (Message Authentication Code)** fixes this by mixing in a secret key, so only someone holding that key could have produced a valid tag:

<div class="diagram-frame">
  <img src="{{ '/assets/img/hmac-flow.svg' | relative_url }}" alt="Diagram showing HMAC: a sender computes HMAC-SHA256 over a message using a shared secret key K to produce a tag, and sends both. The receiver recomputes HMAC-SHA256 with the same key and message, and if the tags match, the message is trusted as authentic and untampered." >
  <p class="diagram-caption">Same key on both sides — anyone without K can't produce a matching tag</p>
</div>

**HMAC (Hash-based MAC)** is the standard construction, defined in **[FIPS 198-1](https://csrc.nist.gov/pubs/fips/198-1/final)**. It's deliberately *not* as simple as `H(key + message)` — see below for why.

## Why naive `H(key + message)` is broken: length-extension attacks

SHA-256, SHA-1, and MD5 use a **Merkle–Damgård** construction internally. If I know `H(secret || message)` and can determine or guess the secret length, I can continue from that internal state and compute a valid digest for `secret || message || glue_padding || attacker_data` without learning the secret. The glue padding is part of the forged message; it cannot simply be omitted from the formula. This is a **length-extension attack**.

HMAC avoids this entirely with a nested construction — roughly `H((key XOR opad) + H((key XOR ipad) + message))` — that hashes twice with the key mixed in at both layers, so the internal-state leak that breaks the naive approach no longer helps an attacker. (SHA-3's sponge construction isn't vulnerable to this specific attack in the first place, which is one of its advantages — though HMAC is still the standard, well-analyzed choice regardless of the underlying hash.)

<div class="callout">
  <span class="callout-title">See it work</span>
  <p><a href="{{ '/topics/hash-collisions-length-extension/' | relative_url }}">Hash Collisions & Length-Extension Attacks</a> has a complete, runnable Python implementation of this exact attack — forging a valid MAC without ever seeing the secret key — plus real downloadable MD5 and SHA-1 collision files to verify the "broken" claims above yourself.</p>
</div>

## Where hashing gets misused

- **Hashing passwords with plain SHA-256** — a fast hash lets an attacker who steals a password database try billions of guesses per second on commodity hardware. Password storage needs a deliberately *slow*, memory-hard function instead — see [Password Storage]({{ '/topics/password-storage/' | relative_url }}).
- **Using MD5 or SHA-1 for anything security-critical** — both are broken; only acceptable use left is non-adversarial checksums (e.g. detecting accidental file corruption, not attacker-controlled data).
- **Treating an unkeyed hash as proof of authenticity** — `SHA-256(message)` next to a message proves nothing if an attacker can alter both together. Only a MAC (or a signature — see [Digital Signatures]({{ '/topics/digital-signatures/' | relative_url }})) proves who produced it.

## Practical demo

```
$ echo -n "The quick brown fox" | shasum -a 256
5cac4f980fedc3d3f1f99b4be3472c9b30d56523e632d151237ec9309048bda9  -

$ echo -n "The quick brown fox" | openssl dgst -sha256 -hmac "shared-secret-key"
SHA2-256(stdin)= e8076ef407b3f9ca99b234733a2114bd63bd9e8bbd9bf842ef69ed64fc339fa8
```

Change one character in the input, or the key, and re-run — the output has no visible relationship to the previous one, every time.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/fips/180-4/final">FIPS 180-4</a></strong> defines the SHA-2 family. <strong><a href="https://csrc.nist.gov/pubs/fips/202/final">FIPS 202</a></strong> defines SHA-3 and SHAKE. <strong><a href="https://csrc.nist.gov/pubs/fips/198-1/final">FIPS 198-1</a></strong> remains the final HMAC standard; NIST proposed withdrawing it and moving the material to <a href="https://csrc.nist.gov/pubs/sp/800/224/ipd">draft SP 800-224</a>, which was still an initial public draft when I checked this page. <strong><a href="https://csrc.nist.gov/pubs/sp/800/131/a/r2/final">NIST SP 800-131A Rev. 2</a></strong> is the final transition guidance and disallows SHA-1 for digital-signature generation.</p>
</div>
