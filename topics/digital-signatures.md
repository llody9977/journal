---
title: Digital Signatures
description: How signing actually works end-to-end, the nonce-reuse trap in ECDSA, non-repudiation's real limits, and where signatures show up in practice.
permalink: /topics/digital-signatures/
---

<span class="eyebrow">Cryptography / Foundations / Deep Dive</span>

# Digital Signatures

<p class="lede">My short version is “private key signs, public key verifies”, but that sentence hides the message encoding, hashing rules, nonce handling, and key-custody assumptions where real failures happen.</p>

## The common pipeline: hash and sign

RSA and ECDSA APIs normally hash the message and apply a scheme-specific encoding or equation to that digest. Ed25519 accepts the message and performs its hashing internally, while prehash variants such as Ed25519ph have separate rules. For large files and protocols, the implementation may stream the message into the required hash rather than load it all at once.

<div class="diagram-frame">
  <img src="{{ '/assets/img/signature-pipeline.svg' | relative_url }}" alt="Conceptual signature diagram: a message is hashed and signed with a private key. Verification recomputes the digest and checks the signature using the public key, returning valid or invalid. The verifier does not recover a second digest from ECDSA or EdDSA signatures." >
  <p class="diagram-caption">Conceptual prehash model—the exact encoding and verification equation depend on the signature scheme</p>
</div>

Signature size is fixed for a selected scheme regardless of message size. Verification checks the scheme's mathematical relation; ECDSA and EdDSA do not “decrypt the signature” or recover a digest. A valid signature supports message integrity and possession of the signing key. It does not by itself prove human authorship or provide confidentiality.

## Where real signature schemes go wrong: the nonce trap

**ECDSA** requires a fresh, secret, unpredictable random number (called `k`, the nonce) for every single signature. Get this wrong, and the private key itself can leak:

- **Reuse the same `k` for two different messages** with the same key, and simple algebra recovers the private key outright from the two signatures — no advanced cryptanalysis required. This is exactly how the **PlayStation 3's ECDSA signing key** was extracted in 2010 (Sony reused a static `k` for every firmware signature instead of generating a fresh one), and it's caused real-world Bitcoin wallet thefts from wallets with buggy random number generators.
- **A biased or partially-predictable `k`** — even without full reuse — can be enough for an attacker to recover the key given sufficiently many signatures, through lattice-based attacks.

**EdDSA (Ed25519)** was designed specifically to close this failure class: it derives `k` deterministically from the private key and the message itself, so there's no random number generator to fail in the first place. This is the single biggest practical argument for preferring Ed25519 over ECDSA where the choice is available — see [Asymmetric Cryptography]({{ '/topics/asymmetric-cryptography/' | relative_url }}#eddsa-and-ed25519-the-newer-signing-scheme) for the mechanism.

## Non-repudiation: what it actually promises

The overview's "Handwritten Signature on Record" example frames non-repudiation as *"only Alice holds the pen, so she can't deny signing."* That's true — but it's worth being precise about what's actually being proven:

- A valid signature proves the message was signed by **whoever controlled the private key at signing time**.
- It does **not** prove the legitimate owner personally chose to sign — a stolen key, a compromised signing server, or a coerced signature all produce cryptographically perfect, valid signatures.
- This is why key custody (HSMs, hardware tokens, access controls) matters just as much as the signature algorithm itself — non-repudiation is only as strong as the guarantee that nobody else ever had the key.

## Where signatures show up in practice

| Use | What gets signed | Notes |
|---|---|---|
| TLS certificates | The certificate body, by the issuing CA | Covered in depth under [Certificate Authorities & Certificates]({{ '/topics/certificates/' | relative_url }}) |
| Code signing | Executables, installers, scripts | Proves publisher identity and that the binary wasn't altered post-release |
| Git commit/tag signing | The commit or tag object | `git commit -S`, verified with `git verify-commit`; GitHub shows a "Verified" badge from this |
| JWTs (JSON Web Tokens) | The header + payload | `HS256` uses an HMAC (a shared-secret MAC, not a true signature); `RS256`/`ES256` use real RSA/ECDSA signatures — a meaningful distinction to check before trusting a JWT library's defaults |
| Software updates | Update packages/manifests | Prevents a compromised CDN or mirror from serving tampered updates |
| Blockchain transactions | The transaction data | Proves the sender authorized spending their funds — see [Blockchain Cryptography]({{ '/topics/blockchain-cryptography/' | relative_url }}) |

## Practical demo: sign, verify, then tamper

```
$ echo "Pay Charlie \$500" > message.txt
$ openssl ecparam -name prime256v1 -genkey -noout -out ec_private.pem
$ openssl ec -in ec_private.pem -pubout -out ec_public.pem

$ openssl dgst -sha256 -sign ec_private.pem -out message.sig message.txt
$ openssl dgst -sha256 -verify ec_public.pem -signature message.sig message.txt
Verified OK
```

Now change the message without re-signing it, and verify again against the *same* signature:

```
$ echo "Pay Charlie \$5000" > message.txt
$ openssl dgst -sha256 -verify ec_public.pem -signature message.sig message.txt
Verification failure
```

One digit added to the amount and verification fails because the signed message representation no longer matches the changed input. The hash's avalanche behaviour makes the new digest unrelated, but the security result comes from the signature scheme rejecting a message that was not signed.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/fips/186-5/final">FIPS 186-5</a></strong> is the Digital Signature Standard, approving RSA (PKCS#1/PSS), ECDSA, and EdDSA. <strong><a href="https://www.rfc-editor.org/rfc/rfc8032">RFC 8032</a></strong> specifies EdDSA/Ed25519 in detail, including the deterministic nonce derivation described above.</p>
</div>

## How I connect this

Digital signatures are the mechanism; [Certificate Authorities]({{ '/topics/certificates/' | relative_url }}) are one specific, enormously important *application* of that mechanism — a CA's signature over a certificate is exactly the pipeline described above, at internet scale.
