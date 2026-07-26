---
title: Symmetric vs Asymmetric Cryptography
description: Why only asymmetric crypto can offer non-repudiation, why asymmetric key handling is inherently safer than a shared secret, and why real systems use both at once — PGP as the enduring example.
permalink: /topics/symmetric-vs-asymmetric/
---

<span class="eyebrow">Cryptography / Foundations / Deep Dive</span>

# Symmetric vs Asymmetric Cryptography

<p class="lede">[Symmetric]({{ '/topics/symmetric-cryptography/' | relative_url }}) and [asymmetric]({{ '/topics/asymmetric-cryptography/' | relative_url }}) cryptography solve overlapping problems with very different guarantees — one structural difference (one key vs. two) cascades into who can repudiate what, how much a compromised channel actually costs, and why almost every real system quietly uses both at once.</p>

## Non-repudiation: the one guarantee only asymmetric crypto can offer

With symmetric crypto, both parties hold the *identical* key. Given a valid ciphertext or MAC, there is no way to prove which of the two parties actually produced it — either one could have, using the same shared secret. Non-repudiation isn't just hard to achieve with symmetric crypto; it's structurally impossible, regardless of implementation quality. A bank can't use a symmetric MAC to prove in court that *you* authorized a transfer rather than the bank itself — the same key that verifies the MAC could have created it.

Asymmetric crypto changes this because the private key is (in principle) held by exactly one party. A valid signature proves *someone holding that private key* produced it — and if only one person ever held it, that's non-repudiation. But this guarantee is conditional, not automatic:

- It depends entirely on private-key custody — a stolen key, a compromised signing server, or a coerced signature all produce a cryptographically perfect, valid signature that proves nothing about who *actually* chose to sign.
- Key escrow, shared signing infrastructure, or a poorly-secured HSM all quietly undermine the same guarantee the algorithm itself provides.

[Digital Signatures]({{ '/topics/digital-signatures/' | relative_url }}#non-repudiation-what-it-actually-promises) covers this dependency in full — the short version is that asymmetric crypto makes non-repudiation *possible*, but the actual guarantee lives in how the private key is protected, not in the math alone.

## The security tradeoff: a shared secret vs. a secret that never travels

A symmetric key is, functionally, a passphrase both sides must already possess before anything works. That has a real consequence: the key has to get from one party to the other over *some* channel, and whatever that channel is becomes the entire security of the system. Compromise either copy of the key and the whole scheme is broken — there's no distinction between "the sender's copy leaked" and "the receiver's copy leaked."

Asymmetric crypto's public/private split removes that exposure entirely on one side: the public key can travel over the most hostile network imaginable, get posted publicly, sit in a phonebook — none of it matters, because possessing the public key alone lets you do nothing except encrypt *to* the owner or verify a signature *from* them. The private key never has to be transmitted, ever, to anyone, for the system to work. That's a meaningfully higher security posture than symmetric crypto can offer by itself, precisely because there's no "the secret leaked in transit" failure mode to begin with.

The cost is speed: asymmetric operations run roughly 100–1000× slower than symmetric ones for equivalent data sizes, which is exactly why almost nothing encrypts bulk data directly with RSA or ECC.

## The real answer is both: hybrid encryption, and PGP as the enduring example

Nearly every real system that needs both properties — the security posture of asymmetric crypto, and the speed of symmetric crypto — combines them in the same pattern: use asymmetric crypto for the *one small thing* that must never be transmitted in the clear (a symmetric key), and let that symmetric key handle the actual bulk of the data, fast.

**PGP / OpenPGP** ([RFC 4880](https://www.rfc-editor.org/rfc/rfc4880)) is the clearest, longest-running example of this pattern in practice, and it's still in active use today (GnuPG remains actively maintained, and PGP-encrypted email and file encryption are still standard in security-conscious organizations):

1. A random **session key** is generated for this message only.
2. The actual message is encrypted with that session key using a fast symmetric cipher (AES, in modern OpenPGP implementations).
3. The session key itself — small, and the only thing that actually needs asymmetric-grade protection — is encrypted with the recipient's **public key**.
4. Both pieces travel together: the symmetric-encrypted message, and the asymmetric-encrypted session key.
5. The recipient uses their **private key** to unwrap the session key, then uses that session key to decrypt the actual message.

This is exactly the same shape as the [TLS handshake]({{ '/topics/tls-ssl-handshake/' | relative_url }}) — asymmetric crypto (or, in TLS 1.3, a key exchange) establishes a symmetric key, and that symmetric key does the real work — PGP is simply the email/file-encryption instance of the identical pattern, decades older and still running.

## Comparing them directly

| | Symmetric | Asymmetric |
|---|---|---|
| Keys involved | One shared secret | A public/private pair |
| Speed | Fast — the default for bulk data | 100–1000× slower |
| Key distribution | Both sides need the identical secret beforehand — a chicken-and-egg problem | Public half needs no protection in transit at all |
| Non-repudiation | Not possible, structurally — either party could have produced a given tag | Possible — but only as strong as private-key custody |
| Typical role today | Encrypting the actual bulk data | Protecting/exchanging the symmetric key, signing, identity |

## Common pitfalls

- **Assuming a symmetric MAC proves who sent something** — it only proves *someone holding the shared key* did; that could be either party.
- **Treating a valid signature as proof of intent** — it proves private-key possession at signing time, nothing about whether the legitimate owner chose to sign, if the key was compromised or coerced.
- **Encrypting bulk data directly with RSA/ECC** — technically possible, practically never done, given the 100–1000× performance gap versus hybrid encryption.
- **Building a custom hybrid scheme instead of using an established one** — PGP, TLS, and age (a modern file-encryption tool) have all had this exact pattern reviewed for years; a homemade version hasn't.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.rfc-editor.org/rfc/rfc4880">RFC 4880</a></strong> defines the OpenPGP message format, including the hybrid encryption pattern described above. <strong><a href="https://csrc.nist.gov/pubs/fips/186-5/final">FIPS 186-5</a></strong> covers the signature schemes (RSA, ECDSA, EdDSA) underlying the non-repudiation guarantee discussed here.</p>
</div>

## Where this fits

This is the direct comparison [Symmetric Cryptography]({{ '/topics/symmetric-cryptography/' | relative_url }}) and [Asymmetric Cryptography]({{ '/topics/asymmetric-cryptography/' | relative_url }}) each gesture toward but don't fully resolve on their own — both pages now focus on their own mechanics; this is where the tradeoffs between them, and why real systems use both together, actually get worked out.
