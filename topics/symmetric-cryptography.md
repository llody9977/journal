---
title: Symmetric Cryptography
description: AES, block vs stream ciphers, modes of operation, authenticated encryption, and the key-distribution problem it doesn't solve.
permalink: /topics/symmetric-cryptography/
last_verified: 2026-08-05
---

<span class="eyebrow">Cryptography / Concepts</span>

# Symmetric Cryptography

<p class="lede">My working model is simple: both sides share one secret key, and that key handles the bulk encryption. Most of the surrounding protocol work is about establishing, authenticating, deriving, storing, and rotating that key safely.</p>

## The core idea: one key, both directions

The <a href="{{ '/topics/cryptography-overview/' | relative_url }}">What Is Cryptography?</a> page uses a locked-briefcase example: Alice and the bank manager know the same combination. That shared combination is the symmetric key—the same secret protects and recovers the message.

<div class="diagram-frame">
  <video class="diagram-video" controls autoplay muted loop playsinline preload="metadata" poster="{{ '/assets/video/symmetric-flow-poster.png' | relative_url }}?v=3" aria-label="A slow, worked AES-256-GCM implementation. A 256-bit key is shared out-of-band. The sender encrypts the plaintext Meet me at 7 AM using the shared key, a 96-bit nonce and authenticated metadata, producing an exact ciphertext and 128-bit authentication tag. The receiver recomputes and verifies the tag before revealing the plaintext. A final example changes one ciphertext bit and shows authentication failing.">
    <source src="{{ '/assets/video/symmetric-flow.webm' | relative_url }}?v=3" type="video/webm">
    <source src="{{ '/assets/video/symmetric-flow.mp4' | relative_url }}?v=3" type="video/mp4">
    <img src="{{ '/assets/img/symmetric-flow.svg' | relative_url }}" alt="Diagram showing symmetric encryption: a sender encrypts plaintext into ciphertext using key K, and a receiver decrypts that ciphertext back into plaintext using the same key K.">
  </video>
  <p class="diagram-caption">Worked AES-256-GCM example: out-of-band key sharing, encryption, tag verification and tamper rejection</p>
</div>

For this animation I use a fixed key and nonce so I can show the exact reproducible ciphertext and tag. I must not copy that into a real system: production keys need a CSPRNG, and a GCM nonce must not repeat under the same key. The important authentication point is that the receiver accepts the plaintext only after the tag verifies. Because both sides know K, that proves the packet came from **a holder of K** and was not altered; it does not prove which holder sent it.

That single property is both the appeal and the limitation of symmetric crypto:

- **Suitable for bulk data** — symmetric operations are normally much cheaper than public-key operations and may be accelerated directly by the CPU. The exact difference depends on the algorithms, operation, implementation, and hardware.
- **Unsolved by itself** — both parties need the *same* key before any of this works, and the key has to arrive through some channel. If that channel is not already protected, I still have a key-distribution problem. [Asymmetric Cryptography]({{ '/topics/asymmetric-cryptography/' | relative_url }}) and [Key Exchange & Key Derivation]({{ '/topics/key-exchange-derivation/' | relative_url }}) cover the usual solution.
- **No per-party attribution from the shared key** — because both sides hold the identical key, either one could have produced a given ciphertext or MAC. See [Symmetric vs Asymmetric Cryptography]({{ '/topics/symmetric-vs-asymmetric/' | relative_url }}#attribution-what-asymmetric-signatures-make-possible) for what a signature changes and what it still cannot prove alone.

## Block ciphers vs. stream ciphers

Symmetric algorithms come in two shapes, depending on how they chew through data:

| | Block ciphers | Stream ciphers |
|---|---|---|
| Unit of operation | Fixed-size blocks (e.g. 128 bits) | One bit/byte at a time, continuously |
| How it works | Same fixed transformation applied per block | Generates a pseudorandom keystream, XORed with data |
| Examples | AES, (legacy) 3DES | ChaCha20, (legacy) RC4 |
| Needs padding? | Depends on the mode; CBC does, while CTR and GCM do not | No |
| Typical use today | AES with an authenticated mode such as GCM | ChaCha20-Poly1305 where it is supported or performs better |

In practice I choose a reviewed AEAD construction, not a bare cipher category. AES-GCM and ChaCha20-Poly1305 are widely standardized choices. CTR and the encryption part of GCM use a block cipher to generate a keystream, which is why nonce reuse is so damaging.

## Inside AES, briefly

**AES (Advanced Encryption Standard)**, standardized in **[FIPS 197](https://csrc.nist.gov/pubs/fips/197/final)**, is a block cipher operating on 128-bit blocks, with three key size options:

| Key size | Rounds | Notes |
|---|---|---|
| AES-128 | 10 | Still considered secure; smallest/fastest option |
| AES-192 | 12 | Rarely used in practice — AES-128 or AES-256 dominate |
| AES-256 | 14 | Larger classical key margin and the normal symmetric choice when planning for quantum search |

Each round runs the same four transformations over the block: **SubBytes** (a fixed substitution table, providing non-linearity), **ShiftRows** (permutes bytes across rows), **MixColumns** (linearly mixes each column), and **AddRoundKey** (XORs in that round's derived key). None of this needs to be memorized to use AES correctly — but it explains why AES is a fixed, public, heavily-scrutinized algorithm: its safety comes entirely from the *key*, not from anyone not knowing how SubBytes works.

## Modes of operation: why AES alone isn't enough

AES only defines how to scramble *one 128-bit block*. Real messages are longer than one block, so a **mode of operation** defines how to chain many blocks together — and getting this wrong is one of the most common real-world cryptography mistakes.

| Mode | How it works | Status |
|---|---|---|
| **ECB** (Electronic Codebook) | Each block encrypted independently, no chaining | **Insecure — don't use.** Identical plaintext blocks always produce identical ciphertext blocks |
| **CBC** (Cipher Block Chaining) | Each block is XORed with the previous ciphertext block before encrypting; needs an unpredictable IV | Legacy compatibility only; it has no built-in integrity and needs a correctly ordered MAC |
| **CTR** (Counter) | Encrypts counter blocks to build a keystream, then XORs it with data | No built-in integrity; the counter block must not repeat under the same key |
| **GCM** (Galois/Counter Mode) | Counter-mode encryption plus an authentication tag | Widely standardized AEAD; safe use depends on key and nonce management |

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

Plain encryption such as CBC or CTR only gives confidentiality; it does not make tampering detectable. **AEAD (Authenticated Encryption with Associated Data)** combines encryption and authentication in one construction. Successful tag verification gives ciphertext integrity and origin authentication to a holder of the shared key. It does not identify which key holder created the message.

- **AES-GCM** — widely used in protocols including TLS 1.3; often fast with hardware acceleration. Nonce uniqueness under each key is essential.
- **ChaCha20-Poly1305** — another standardized AEAD option that performs well in software and is also defined for TLS 1.3.

If I see a cipher suite or API named with a plain mode and no authentication (`AES-256-CBC` with no separate MAC step), I check where integrity is provided. If there is no separate MAC or authenticated container, the design is incomplete.

## Practical demo: encrypting a file with Node.js

`openssl enc` is not suitable for this example because its command-line interface does not support AEAD modes such as GCM. I use Node's built-in [`node:crypto` API](https://nodejs.org/api/crypto.html) here, so the authentication tag is stored and checked explicitly with `getAuthTag()` and `setAuthTag()`.

<div class="diagram-frame">
  <video class="diagram-video" controls muted loop playsinline preload="metadata" poster="{{ '/assets/video/node-aes-gcm-demo-poster.png' | relative_url }}?v=6" aria-label="A slow Node.js AES-256-GCM file walkthrough: configure the passphrase and input, review the encryption code, execute encryption, inspect the packed encrypted file, review the decryption code, then verify authentication and compare the recovered file. It displays every line of encrypt.js and decrypt.js and captures the output from an actual run.">
    <source src="{{ '/assets/video/node-aes-gcm-demo.webm' | relative_url }}?v=6" type="video/webm">
    <source src="{{ '/assets/video/node-aes-gcm-demo.mp4' | relative_url }}?v=6" type="video/mp4">
    <img src="{{ '/assets/video/node-aes-gcm-demo-poster.png' | relative_url }}?v=6" alt="The verification section of the Node.js AES-256-GCM demo, ending with a verified authentication tag and an identical recovered file.">
  </video>
  <p class="diagram-caption">One captured run: encrypt, inspect the packed file, verify the tag, decrypt and compare</p>
</div>

The walkthrough follows the complete workflow: **configure the key and input → review the encryption code → run the encryption → inspect the encrypted file → review the decryption code → verify the authentication tag and recovered file**.

The video displays every line from the two scripts below. Because the animation reads directly from these files, what I see in the walkthrough is the same code I can run myself:

- [Download `encrypt.js`]({{ '/assets/downloads/node-aes-gcm-demo/encrypt.js' | relative_url }})
- [Download `decrypt.js`]({{ '/assets/downloads/node-aes-gcm-demo/decrypt.js' | relative_url }})

### Running the same demonstration myself

These commands repeat the workflow shown in the video. I run them from the repository root because that is where the paths to `encrypt.js` and `decrypt.js` begin.

**1. Set the passphrase for this terminal session**

I keep the passphrase outside the source files. `read -rs` stores what I type in a shell variable without displaying it, while `export` makes that stored value available to both Node processes.

```
$ printf 'Passphrase: '; read -rs FILE_ENCRYPTION_PASSPHRASE; printf '\n'
$ export FILE_ENCRYPTION_PASSPHRASE
```

**2. Create the plaintext file I want to encrypt**

This creates `secret.txt` containing `private journal entry` followed by a newline.

```
$ printf 'private journal entry\n' > secret.txt
```

**3. Encrypt the file**

```
$ node assets/downloads/node-aes-gcm-demo/encrypt.js
```

The encryption script reads `secret.txt`, derives a 32-byte AES key with `scryptSync`, generates the salt and nonce, then writes everything needed for decryption to `secret.txt.enc`. The passphrase and derived AES key are not written into that file.

**4. Decrypt the file and verify its authentication tag**

```
$ node assets/downloads/node-aes-gcm-demo/decrypt.js
tag verified: yes
recovered:    "private journal entry\n"
```

`tag verified: yes` means AES-GCM accepted the ciphertext and authentication tag. The script only writes `secret-decrypted.txt` after this check succeeds.

**5. Confirm that the recovered file is identical**

```
$ diff secret.txt secret-decrypted.txt
$ echo $?
0
```

An exit code of `0` means `diff` found no difference between the original and recovered files.

The salt gives `scryptSync` a separate key-derivation input. The 96-bit nonce is an input to AES-GCM and must not repeat under the same derived key. Neither value needs to be secret, so both are stored with the ciphertext and authentication tag. In a real application I would normally obtain a data key from a KMS or protocol and use a reviewed envelope format.

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
- **Encrypting without authenticating** — plain CBC/CTR with no MAC lets an attacker flip bits in the ciphertext undetected. I use a reviewed AEAD construction such as GCM or ChaCha20-Poly1305 instead of assembling my own encrypt-then-MAC scheme.
- **Designing my own cipher or mode** — a homemade construction has not received the analysis behind standardized, reviewed designs.

## Reference: NIST standards

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/fips/197/final">FIPS 197</a></strong> defines AES itself. <strong><a href="https://csrc.nist.gov/pubs/sp/800/38/a/final">NIST SP 800-38A</a></strong> defines the classic modes (ECB, CBC, CFB, OFB, CTR). <strong><a href="https://csrc.nist.gov/pubs/sp/800/38/d/final">NIST SP 800-38D</a></strong> defines GCM specifically, including nonce-uniqueness requirements. When in doubt about which mode to use, NIST's own guidance and most modern protocol defaults (TLS 1.3, SSH) converge on the same answer: an AEAD mode, not a plain one.</p>
</div>

## Summary

| Choose | When |
|---|---|
| AES-GCM | When the protocol or platform provides a safe, reviewed API and reliable nonce management |
| ChaCha20-Poly1305 | When the protocol or platform supports it and it fits the performance and interoperability needs |
| AES-CBC + HMAC | Legacy systems that predate AEAD support — encrypt-then-MAC, never MAC-then-encrypt |
| ECB | Never |
