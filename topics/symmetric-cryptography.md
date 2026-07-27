---
title: Symmetric Cryptography
description: AES, block vs stream ciphers, modes of operation, authenticated encryption, and the key-distribution problem it doesn't solve.
permalink: /topics/symmetric-cryptography/
---

<span class="eyebrow">Cryptography / Foundations / Deep Dive</span>

# Symmetric Cryptography

<p class="lede">My working model is simple: both sides share one secret key, and that key handles the bulk encryption. Most of the surrounding protocol work is about establishing, authenticating, deriving, storing, and rotating that key safely.</p>

## The core idea: one key, both directions

The <a href="{{ '/topics/cryptography-overview/' | relative_url }}">Cryptography Overview</a>'s locked-briefcase example already described this without naming it: Alice locks her instruction in a steel briefcase "using a lock combination known only to her and the bank manager." That shared combination *is* a symmetric key — the same secret both locks the briefcase and opens it.

<div class="diagram-frame">
  <img src="{{ '/assets/img/symmetric-flow.svg' | relative_url }}" alt="Diagram showing symmetric encryption: a sender encrypts plaintext into ciphertext using key K, and a receiver decrypts that ciphertext back into plaintext using the same key K.">
  <p class="diagram-caption">Whoever holds K can both encrypt and decrypt — there's no separate "public" half</p>
</div>

That single property is both the appeal and the limitation of symmetric crypto:

- **Fast** — symmetric algorithms are typically orders of magnitude faster than asymmetric ones, and often accelerated directly in CPU hardware (AES-NI on x86, dedicated instructions on ARM).
- **Unsolved by itself** — both parties need the *same* key before any of this works, and the key has to get there over some channel. If that channel isn't already secure, you're back to the original problem cryptography exists to solve. This is exactly the gap [Asymmetric Cryptography]({{ '/topics/asymmetric-cryptography/' | relative_url }}) and [Key Exchange & Key Derivation]({{ '/topics/key-exchange-derivation/' | relative_url }}) close.
- **No per-party attribution from the shared key** — because both sides hold the identical key, either one could have produced a given ciphertext or MAC. See [Symmetric vs Asymmetric Cryptography]({{ '/topics/symmetric-vs-asymmetric/' | relative_url }}#attribution-what-asymmetric-signatures-make-possible) for what a signature changes and what it still cannot prove alone.

## Block ciphers vs. stream ciphers

Symmetric algorithms come in two shapes, depending on how they chew through data:

| | Block ciphers | Stream ciphers |
|---|---|---|
| Unit of operation | Fixed-size blocks (e.g. 128 bits) | One bit/byte at a time, continuously |
| How it works | Same fixed transformation applied per block | Generates a pseudorandom keystream, XORed with data |
| Examples | AES, (legacy) 3DES | ChaCha20, (legacy) RC4 |
| Needs padding? | Yes, for partial final blocks (or a mode that avoids it) | No — it's a continuous stream |
| Typical use today | The default choice; combined with a mode of operation | Mobile/low-power contexts, or where AES-NI hardware isn't available |

In practice today, this distinction matters less than it used to — AES is nearly universal, and certain *modes* of running a block cipher (CTR, GCM) effectively turn it into a stream cipher anyway. ChaCha20 remains popular where hardware AES acceleration isn't guaranteed, since it's fast in pure software.

## Inside AES, briefly

**AES (Advanced Encryption Standard)**, standardized in **[FIPS 197](https://csrc.nist.gov/pubs/fips/197/final)**, is a block cipher operating on 128-bit blocks, with three key size options:

| Key size | Rounds | Notes |
|---|---|---|
| AES-128 | 10 | Still considered secure; smallest/fastest option |
| AES-192 | 12 | Rarely used in practice — AES-128 or AES-256 dominate |
| AES-256 | 14 | Preferred for long-term or high-sensitivity data; the extra rounds add margin against future attacks |

Each round runs the same four transformations over the block: **SubBytes** (a fixed substitution table, providing non-linearity), **ShiftRows** (permutes bytes across rows), **MixColumns** (linearly mixes each column), and **AddRoundKey** (XORs in that round's derived key). None of this needs to be memorized to use AES correctly — but it explains why AES is a fixed, public, heavily-scrutinized algorithm: its safety comes entirely from the *key*, not from anyone not knowing how SubBytes works.

## Modes of operation: why AES alone isn't enough

AES only defines how to scramble *one 128-bit block*. Real messages are longer than one block, so a **mode of operation** defines how to chain many blocks together — and getting this wrong is one of the most common real-world cryptography mistakes.

| Mode | How it works | Status |
|---|---|---|
| **ECB** (Electronic Codebook) | Each block encrypted independently, no chaining | **Insecure — don't use.** Identical plaintext blocks always produce identical ciphertext blocks |
| **CBC** (Cipher Block Chaining) | Each block is XORed with the previous ciphertext block before encrypting; needs a random IV | Usable, but no built-in integrity check — must be paired with a separate MAC |
| **CTR** (Counter) | Encrypts an incrementing counter to build a keystream, then XORs it with data (turns AES into a stream cipher) | Usable, but also has no built-in integrity — nonce reuse is catastrophic |
| **GCM** (Galois/Counter Mode) | CTR-mode encryption plus a built-in authentication tag in one pass | **Recommended default** — this is authenticated encryption (AEAD), covered below |

The reason ECB is singled out as broken, visually:

<div class="diagram-frame">
  <img src="{{ '/assets/img/ecb-pattern-leak.svg' | relative_url }}" alt="Three grids showing the same cross-shaped pattern: the plaintext grid, an ECB-encrypted version where the cross shape is still clearly visible because identical blocks encrypt identically, and a CTR/GCM-encrypted version that looks like random noise with no visible pattern.">
  <p class="diagram-caption">Same key, same algorithm — the mode alone is the difference between "broken" and "fine"</p>
</div>

ECB doesn't fail because AES is weak — it fails because encrypting the same input always gives the same output, so any structure or repetition in the original data (like large blocks of the same color, or repeated headers) survives straight through into the ciphertext.

<div class="callout">
  <span class="callout-title">See it work</span>
  <p><a href="{{ '/topics/symmetric-mode-attacks/' | relative_url }}">Symmetric Mode Attacks: ECB, CBC & CTR</a> reproduces this pattern leak with real AES ciphertext, then goes further — a working CBC bit-flipping attack that forges a privilege change without the key, and a CTR nonce-reuse break that recovers plaintext with nothing but XOR.</p>
</div>

<div class="callout warn">
  <span class="callout-title">Nonce reuse is not a minor bug</span>
  <p>CTR and GCM depend on a nonce that must not repeat under the same key. CTR reuse repeats the keystream and exposes the XOR relationship between plaintexts. GCM reuse also undermines authentication and, depending on the available nonce/ciphertext/tag pairs, can enable tag forgery or recovery of authentication state. The exact damage depends on what the attacker observes, but the operational rule is straightforward: do not reuse the nonce with the same key.</p>
</div>

## Authenticated encryption (AEAD)

Plain encryption (CBC, CTR) only gives confidentiality — it says nothing about whether the ciphertext was tampered with in transit. **AEAD (Authenticated Encryption with Associated Data)** algorithms bundle a MAC (see [Hash Functions & MACs]({{ '/topics/hash-functions-macs/' | relative_url }})) into the same operation, so one pass gives you both confidentiality *and* integrity/authenticity — directly satisfying two of the [Cryptography Overview]({{ '/topics/cryptography-overview/' | relative_url }})'s four pillars at once.

- **AES-GCM** — the current default virtually everywhere (TLS 1.3, most modern systems); fast, especially with AES-NI hardware.
- **ChaCha20-Poly1305** — the software-friendly alternative, popular on mobile and in TLS as a fallback where AES hardware acceleration isn't available.

If you see a cipher suite or API named with a plain mode and no authentication (`AES-256-CBC` with no separate MAC step), that's a signal to double-check whether integrity is actually being handled somewhere else — it's a common gap.

## Practical demo: encrypting a file with Node.js

`openssl enc` is not suitable for this example because its command-line interface does not support AEAD modes such as GCM. I use Node's built-in `crypto` module here, so the authentication tag is stored and checked explicitly.

```
$ printf 'private journal entry\\n' > secret.txt

$ node <<'NODE'
const fs = require('node:fs');
const crypto = require('node:crypto');

const passphrase = 'correct-horse-battery-staple';
const salt = crypto.randomBytes(16);
const nonce = crypto.randomBytes(12);
const key = crypto.scryptSync(passphrase, salt, 32);
const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
const ciphertext = Buffer.concat([
  cipher.update(fs.readFileSync('secret.txt')),
  cipher.final()
]);
const tag = cipher.getAuthTag();

fs.writeFileSync('secret.txt.enc', Buffer.concat([salt, nonce, tag, ciphertext]));
NODE
```

Decrypting back:

```
$ node <<'NODE'
const fs = require('node:fs');
const crypto = require('node:crypto');

const packed = fs.readFileSync('secret.txt.enc');
const salt = packed.subarray(0, 16);
const nonce = packed.subarray(16, 28);
const tag = packed.subarray(28, 44);
const ciphertext = packed.subarray(44);
const key = crypto.scryptSync('correct-horse-battery-staple', salt, 32);
const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
decipher.setAuthTag(tag);

fs.writeFileSync('secret-decrypted.txt', Buffer.concat([
  decipher.update(ciphertext),
  decipher.final()
]));
NODE

$ diff secret.txt secret-decrypted.txt
# (no output — files are identical)
```

`scryptSync` derives the AES key from the passphrase and a random salt. The 96-bit nonce is also random and stored with the ciphertext; it is not secret, but it must not repeat for the same key. In a real application I would normally obtain a data key from a KMS or protocol, use a reviewed envelope format, and avoid hardcoding the passphrase.

## Protecting the one thing that matters: the key itself

Everything above assumes the key is secret. Unlike asymmetric crypto — where only *half* the key pair needs protecting, and the other half is meant to be handed out freely (see [Asymmetric Cryptography]({{ '/topics/asymmetric-cryptography/' | relative_url }}#why-exposing-a-public-key-is-safe-but-exposing-a-private-key-never-is)) — a symmetric key has no safe-to-expose half at all. Leak it, and the scheme is completely broken for anyone who now has it; there's no asymmetry to fall back on.

Mitigating brute force against the key itself comes down to a short, concrete list:

- **Use the full recommended key length, not a shortened one.** AES-128 is currently fine; AES-256 is the recommended choice for data that needs to stay confidential for a long time, partly as a hedge against [Grover's algorithm]({{ '/topics/recommended-algorithms/' | relative_url }}#the-post-quantum-clock-why-what-nist-approved-and-what-to-actually-do-with-it) halving effective symmetric security under a future quantum attacker. See [Recommended Algorithms & Regional Standards]({{ '/topics/recommended-algorithms/' | relative_url }}) for the current guidance and how long each key size is expected to hold.
- **Generate the key from a real CSPRNG, never a predictable source.** A 256-bit key generated from a weak or predictable seed doesn't actually have 256 bits of real entropy, no matter what the key size says on paper — see the [2008 Debian OpenSSL bug]({{ '/topics/asymmetric-cryptography/' | relative_url }}#common-pitfalls) for what happens when this goes wrong.
- **Never use a raw human passphrase as the key directly.** A passphrase has far less real entropy than its character length suggests, and is brute-forceable at the *passphrase* level even when AES itself isn't remotely threatened. This is why the Node demo above derives a key with `scrypt` and a random salt rather than using the passphrase bytes directly — see [Key Exchange & Key Derivation]({{ '/topics/key-exchange-derivation/' | relative_url }}#a-different-problem-password-based-kdfs) and [Password Storage]({{ '/topics/password-storage/' | relative_url }}) for the full reasoning.
- **Rotate keys to limit the blast radius, not to make brute force harder.** A single key's strength doesn't degrade with age or use. Rotation changes which key/version protects new material; migration of existing data depends on the service and design. [HSM & KMS]({{ '/topics/hsm-kms/' | relative_url }}#key-rotation-distinguish-version-rotation-from-data-migration) separates those cases.

## Common pitfalls

- **Using ECB** — still shows up in default settings of older libraries and misconfigured tools. Always check the mode explicitly.
- **Reusing a nonce/IV** under the same key — catastrophic for CTR/GCM. CBC IVs must be unpredictable for encryption; repeating one leaks whether the first plaintext blocks are equal, but it is not the same failure mode as CTR/GCM nonce reuse.
- **Encrypting without authenticating** — plain CBC/CTR with no MAC lets an attacker flip bits in the ciphertext undetected. Use GCM or ChaCha20-Poly1305 instead of assembling your own encrypt-then-MAC.
- **Rolling your own cipher or mode** — symmetric primitives are public and heavily reviewed for a reason; a homemade scheme has had approximately zero of that scrutiny.

## Reference: NIST standards

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/fips/197/final">FIPS 197</a></strong> defines AES itself. <strong><a href="https://csrc.nist.gov/pubs/sp/800/38/a/final">NIST SP 800-38A</a></strong> defines the classic modes (ECB, CBC, CFB, OFB, CTR). <strong><a href="https://csrc.nist.gov/pubs/sp/800/38/d/final">NIST SP 800-38D</a></strong> defines GCM specifically, including nonce-uniqueness requirements. When in doubt about which mode to use, NIST's own guidance and most modern protocol defaults (TLS 1.3, SSH) converge on the same answer: an AEAD mode, not a plain one.</p>
</div>

## Summary

| Choose | When |
|---|---|
| AES-256-GCM | Default choice for new systems; hardware AES acceleration available |
| ChaCha20-Poly1305 | Software-only environments, mobile, or as a TLS fallback cipher |
| AES-CBC + HMAC | Legacy systems that predate AEAD support — encrypt-then-MAC, never MAC-then-encrypt |
| ECB | Never |
