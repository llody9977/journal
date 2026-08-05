---
title: Symmetric vs Asymmetric Cryptography
description: My comparison of shared-key and public-key cryptography, including the limits of attribution and why hybrid encryption is normal.
permalink: /topics/symmetric-vs-asymmetric/
last_verified: 2026-08-05
---

<span class="eyebrow">Cryptography / Decision Guide</span>

# Symmetric vs Asymmetric Cryptography

<p class="lede">I should not treat symmetric and asymmetric cryptography as competing choices. They have different jobs: symmetric primitives handle data efficiently, while public-key primitives help with key establishment, signatures, and identity binding.</p>

## Attribution: what asymmetric signatures make possible

With symmetric crypto, both parties hold the same key. A valid MAC proves that someone with that key created it, but it cannot distinguish one key holder from another. A bank therefore cannot use a two-party MAC alone to prove that the customer, rather than the bank, authorized a transfer.

Asymmetric signatures make stronger attribution possible because the private key can be held by one party while everyone else receives only the public key. The result is still conditional:

- It depends entirely on private-key custody — a stolen key, a compromised signing server, or a coerced signature all produce a cryptographically perfect, valid signature that proves nothing about who *actually* chose to sign.
- Key escrow, shared signing infrastructure, or a poorly-secured HSM all quietly undermine the same guarantee the algorithm itself provides.

[Digital Signatures]({{ '/topics/digital-signatures/' | relative_url }}#non-repudiation-what-it-actually-promises) covers this dependency in full. My short version: the signature binds a message to a key; the surrounding system must bind that key and signing event to a person, organization, and intent.

## The security tradeoff: a shared secret vs. a secret that never travels

A symmetric key is, functionally, a passphrase both sides must already possess before anything works. That has a real consequence: the key has to get from one party to the other over *some* channel, and whatever that channel is becomes the entire security of the system. Compromise either copy of the key and the whole scheme is broken — there's no distinction between "the sender's copy leaked" and "the receiver's copy leaked."

Asymmetric crypto removes the need to transmit the private key. The public key can be disclosed freely, but its **identity binding must be authenticated**; otherwise an attacker can substitute a different public key. This is why certificates, fingerprints, trusted directories, or another authenticated channel are still required.

The cost is speed and payload constraints. The actual performance ratio depends on the operation, algorithm, implementation, hardware, and data size, so I should benchmark rather than repeat one generic multiplier.

## The real answer is both: hybrid encryption, and PGP as the enduring example

Nearly every real system that needs both properties — the security posture of asymmetric crypto, and the speed of symmetric crypto — combines them in the same pattern: use asymmetric crypto for the *one small thing* that must never be transmitted in the clear (a symmetric key), and let that symmetric key handle the actual bulk of the data, fast.

**OpenPGP**, currently specified by **[RFC 9580](https://www.rfc-editor.org/rfc/rfc9580)**, is a long-running example of this pattern. It remains available in tools such as GnuPG, although usage varies by organization and it is not safe to call encrypted email a general industry standard.

1. A random **session key** is generated for this message only.
2. The actual message is encrypted with that session key using a fast symmetric cipher (AES, in modern OpenPGP implementations).
3. The session key itself — small, and the only thing that actually needs asymmetric-grade protection — is encrypted with the recipient's **public key**.
4. Both pieces travel together: the symmetric-encrypted message, and the asymmetric-encrypted session key.
5. The recipient uses their **private key** to unwrap the session key, then uses that session key to decrypt the actual message.

This has the same high-level division of labor as TLS: public-key mechanisms authenticate and establish secrets, while symmetric keys protect the application data. The protocol details are different. TLS 1.3 normally uses authenticated ephemeral key agreement; it does not encrypt the session key directly with the server certificate's public key.

## Comparing them directly

| | Symmetric | Asymmetric |
|---|---|---|
| Keys involved | One shared secret | A public/private pair |
| Speed | Fast — the normal choice for bulk data | More expensive; measure the chosen operation and implementation |
| Key distribution | Both sides need the same secret | Public key can be disclosed, but its identity binding must be authenticated |
| Attribution | A MAC cannot distinguish between parties sharing the key | A signature can support attribution if identity, custody, and process are sound |
| Typical role today | Encrypting the actual bulk data | Protecting/exchanging the symmetric key, signing, identity |

## Common pitfalls

- **Assuming a symmetric MAC proves who sent something** — it only proves *someone holding the shared key* did; that could be either party.
- **Treating a valid signature as proof of intent** — it proves private-key possession at signing time, nothing about whether the legitimate owner chose to sign, if the key was compromised or coerced.
- **Encrypting bulk data directly with RSA** — payload limits and performance make a standard hybrid construction the safer design. ECDH itself is key agreement, not bulk encryption.
- **Building a custom hybrid scheme instead of using an established one** — PGP, TLS, and age (a modern file-encryption tool) have all had this exact pattern reviewed for years; a homemade version hasn't.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.rfc-editor.org/rfc/rfc9580">RFC 9580</a></strong> defines the current OpenPGP message format and obsoletes RFC 4880. <strong><a href="https://csrc.nist.gov/pubs/fips/186-5/final">FIPS 186-5</a></strong> covers approved RSA, ECDSA, and EdDSA signature schemes.</p>
</div>
