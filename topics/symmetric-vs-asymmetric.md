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

With symmetric crypto, both parties hold the same key. A valid **message authentication code (MAC)** proves that someone with that key created it, but it cannot distinguish one key holder from another. A bank therefore cannot use a two-party MAC alone to prove that the customer, rather than the bank, authorized a transfer.

Asymmetric signatures make stronger attribution possible because the private key can be held by one party while everyone else receives only the public key. The result is still conditional:

- It depends entirely on private-key custody — a stolen key, a compromised signing server, or a coerced signature all produce a cryptographically perfect, valid signature that proves nothing about who *actually* chose to sign.
- Key escrow, shared signing infrastructure, or a poorly-secured HSM all quietly undermine the same guarantee the algorithm itself provides.

[Digital Signatures]({{ '/topics/digital-signatures/' | relative_url }}#non-repudiation-what-it-actually-promises) covers this dependency in full. My short version: the signature binds a message to a key; the surrounding system must bind that key and signing event to a person, organization, and intent.

## The security tradeoff: a shared secret vs. a secret that never travels

A symmetric key is one secret value that both sides must possess before they can use it together. It should normally be generated key material, not a human passphrase. The key therefore has to be established or delivered through some protected mechanism. Compromise either copy and the shared-key protection is broken—there is no distinction between “the sender's copy leaked” and “the receiver's copy leaked.”

Asymmetric crypto removes the need to transmit the private key. The public key can be disclosed freely, but its **identity binding must be authenticated**; otherwise an attacker can substitute a different public key. This is why certificates, fingerprints, trusted directories, or another authenticated channel are still required.

The cost is speed and payload constraints. The actual performance ratio depends on the operation, algorithm, implementation, hardware, and data size, so I should benchmark rather than repeat one generic multiplier.

## The real answer is often both: hybrid encryption

Systems that need public-key distribution and efficient data encryption normally combine them: a public-key mechanism establishes or protects short symmetric key material, and the symmetric key protects the actual data.

**OpenPGP**, currently specified by **[RFC 9580](https://www.rfc-editor.org/rfc/rfc9580)**, is a long-running example of this pattern. It remains available in tools such as GnuPG, although usage varies by organization and it is not safe to call encrypted email a general industry standard.

1. A random **session key** is generated for this message only.
2. The actual message is encrypted with that session key using a fast symmetric cipher (AES, in modern OpenPGP implementations).
3. The session key itself — small, and the only thing that actually needs asymmetric-grade protection — is encrypted with the recipient's **public key**.
4. Both pieces travel together: the symmetric-encrypted message, and the asymmetric-encrypted session key.
5. The recipient uses their **private key** to unwrap the session key, then uses that session key to decrypt the actual message.

This has the same high-level division of labor as TLS: public-key mechanisms authenticate and establish secrets, while symmetric keys protect the application data. The protocol details are different. TLS 1.3 normally uses authenticated ephemeral key agreement; it does not encrypt the session key directly with the server certificate's public key.

[Hybrid Public Key Encryption (HPKE), RFC 9180](https://www.rfc-editor.org/rfc/rfc9180) is another current construction. It encapsulates key material to the recipient's public key, derives symmetric keys, and uses authenticated encryption for the payload. This is more precise than saying that an elliptic-curve public key directly encrypts a large file.

## My operation matrix: choose the objective first

| Objective | Construction and key direction | Typical product or use case | What it provides | What it does not provide |
|---|---|---|---|---|
| Protect bulk data from reading and modification | Symmetric Authenticated Encryption with Associated Data (AEAD): the same secret key encrypts and decrypts | TLS records, application data, encrypted files | Confidentiality and integrity between key holders | Attribution between parties that share the key |
| Check a message from another shared-key holder | MAC: the same secret key creates and verifies the tag | HMAC-signed webhooks, internal service messages | Integrity and shared-key origin authentication | Confidentiality or proof of which key holder created it |
| Deliver data to one recipient without a pre-shared secret | Hybrid public-key encryption: recipient's public key encapsulates/protects a symmetric key; recipient's private key recovers it | HPKE, OpenPGP, file transfer to an offline recipient | Confidentiality to the private-key holder | Sender authentication in an unauthenticated/base mode |
| Publish evidence that a specific signing key approved content | Digital signature: private key signs; public key verifies | CA certificates, code signing, signed JWTs, Git tags | Integrity and evidence of signing-key possession | Confidentiality or proof that a human intended the action |
| Establish session keys over an untrusted network | Authenticated key agreement: each side combines private and public inputs, then derives symmetric keys | TLS 1.3 ephemeral Elliptic Curve Diffie-Hellman (ECDHE), SSH | Fresh shared keys; forward secrecy when the protocol uses ephemeral keys correctly | Authentication from bare Diffie-Hellman without certificates, signatures, or another binding |
| Control encryption of stored cloud data | Envelope encryption: a symmetric data-encryption key (DEK) encrypts data; a key-management service (KMS)-held key-encryption key (KEK) wraps or controls the DEK | Cloud disks, object storage, database customer-managed encryption keys (CMEKs) | Efficient encryption plus centralized key lifecycle and access control | Protection while an authorized workload is actively using decrypted data |

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
  <p><strong><a href="https://www.rfc-editor.org/rfc/rfc8017">RFC 8017</a></strong> defines RSA encryption and signature schemes as separate constructions. <strong><a href="https://www.rfc-editor.org/rfc/rfc9180">RFC 9180</a></strong> specifies HPKE. <strong><a href="https://www.rfc-editor.org/rfc/rfc9580">RFC 9580</a></strong> defines the current OpenPGP message format and obsoletes RFC 4880. <strong><a href="https://www.rfc-editor.org/rfc/rfc8446">RFC 8446</a></strong> defines TLS 1.3. <strong><a href="https://csrc.nist.gov/pubs/fips/186-5/final">FIPS 186-5</a></strong> covers approved RSA, ECDSA, and EdDSA signature schemes.</p>
</div>
