---
title: Digital Signatures
description: How signing actually works end-to-end, the nonce-reuse trap in ECDSA, non-repudiation's real limits, and where signatures show up in practice.
permalink: /topics/digital-signatures/
---

<span class="eyebrow">Cryptography / Foundations / Deep Dive</span>

# Digital Signatures

<p class="lede">The <a href="{{ '/topics/asymmetric-cryptography/' | relative_url }}">asymmetric cryptography</a> page covered the core mechanism — private key signs, public key verifies. What happens in between: why you sign a hash instead of the message itself, where real signature schemes go wrong in practice, and what "non-repudiation" does and doesn't actually guarantee.</p>

## The full pipeline: hash, then sign

Signature algorithms operate on fixed-size input, and running RSA or ECDSA math directly over a multi-gigabyte file would be both impossibly slow and mathematically awkward. So in practice, nobody signs the message itself — they sign its [hash]({{ '/topics/hash-functions-macs/' | relative_url }}):

<div class="diagram-frame">
  <img src="{{ '/assets/img/signature-pipeline.svg' | relative_url }}" alt="Diagram showing the signing pipeline: message is hashed to a digest, then signed with a private key to produce a signature. The verifying pipeline: the message is hashed again to digest A, the signature is verified with the public key to recover digest B, and if A equals B the signature is valid." >
  <p class="diagram-caption">Sign the digest, not the message — verification just checks the two digests match</p>
</div>

This has a useful side effect: signature size stays constant no matter how large the original message is, and verification only ever needs to re-hash the message and compare — it never needs to "undo" the signature to read anything, because there was nothing encrypted in the first place. A signature proves authorship and integrity; it does not provide confidentiality.

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

One digit added to the amount, and verification fails outright — this is the same avalanche-effect property from [Hash Functions & MACs]({{ '/topics/hash-functions-macs/' | relative_url }}) doing its job: the digest of the tampered message no longer matches what the signature actually covers.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/fips/186-5/final">FIPS 186-5</a></strong> is the Digital Signature Standard, approving RSA (PKCS#1/PSS), ECDSA, and EdDSA. <strong><a href="https://www.rfc-editor.org/rfc/rfc8032">RFC 8032</a></strong> specifies EdDSA/Ed25519 in detail, including the deterministic nonce derivation described above.</p>
</div>

## Where this fits

Digital signatures are the mechanism; [Certificate Authorities]({{ '/topics/certificates/' | relative_url }}) are one specific, enormously important *application* of that mechanism — a CA's signature over a certificate is exactly the pipeline described above, at internet scale.
