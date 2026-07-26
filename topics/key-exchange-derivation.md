---
title: Key Exchange & Key Derivation
description: Diffie-Hellman/ECDH, forward secrecy, and turning a shared secret into usable keys with HKDF.
permalink: /topics/key-exchange-derivation/
---

<span class="eyebrow">Cryptography / Foundations / Deep Dive</span>

# Key Exchange & Key Derivation

<p class="lede">Two distinct problems get bundled together constantly: how two parties who've never met agree on a shared secret over a network that an attacker can watch every byte of (<strong>key exchange</strong>), and how that shared secret becomes actual, usable encryption keys (<strong>key derivation</strong>).</p>

## Key exchange: Diffie-Hellman

**Diffie-Hellman (DH)** solves a problem that looks paradoxical at first: let two parties, watched the entire time by an eavesdropper, agree on a secret that the eavesdropper cannot feasibly compute — without either party ever sending that secret, or enough to reconstruct it.

<div class="diagram-frame">
  <img src="{{ '/assets/img/diffie-hellman.svg' | relative_url }}" alt="Diagram of Diffie-Hellman key exchange: Alice and Bob each combine a shared public value with their own private secret, exchange the results in the open, then each combines the received value with their own secret again, arriving at the same shared secret that an eavesdropper — who only saw the public value and both exchanged values — cannot compute." >
  <p class="diagram-caption">An eavesdropper sees everything sent — and still can't compute the shared secret</p>
</div>

The classical version (as pictured) relies on modular exponentiation: both parties agree publicly on a generator `g` and a prime `p`, each picks a private exponent, and the math (`g^a mod p`, then raised to the other party's exponent) happens to land on the same value from both directions — while reversing it (recovering `a` from `g^a mod p`) is the **discrete logarithm problem**, believed to be computationally infeasible for large enough parameters.

**ECDH (Elliptic Curve Diffie-Hellman)** is the same idea, using point multiplication on an elliptic curve instead of modular exponentiation. It's the version almost everything uses today, for the same reason [ECC beat RSA]({{ '/topics/asymmetric-cryptography/' | relative_url }}#the-two-main-families-rsa-and-ecc) in the signing world: dramatically smaller keys for equivalent security.

## Forward secrecy: why "ephemeral" matters

| | Static (fixed) DH | Ephemeral DH (DHE / ECDHE) |
|---|---|---|
| Key pair used | Same long-term key pair, every session | Fresh, temporary key pair, generated per session |
| If the long-term private key leaks later | Every past session using it can be decrypted retroactively | Past sessions stay safe — the ephemeral keys that protected them are already gone |
| Cost | Cheaper — no fresh key generation per connection | Slightly more compute per handshake |
| Used by | Mostly historical / legacy configurations | TLS 1.3 (mandatory), SSH, Signal |

That "past sessions stay safe" property is called **forward secrecy**, and it's exactly why TLS 1.3 removed static RSA/DH key exchange entirely and requires an ephemeral exchange for every single connection. An attacker who silently records encrypted traffic today and later steals the server's private key gains nothing from that recording — the actual session keys were never derived from, or recoverable from, that long-term key in the first place.

## From shared secret to usable keys: KDFs

The raw output of a DH or ECDH exchange isn't something you should plug directly into AES as a key — it can have subtle statistical structure that a truly random key shouldn't have, and real protocols usually need *several* independent keys from one exchange (one for each traffic direction, one for MAC/authentication, etc.), not just one.

**HKDF (HMAC-based Key Derivation Function)**, defined in **[RFC 5869](https://www.rfc-editor.org/rfc/rfc5869)**, solves this in two steps:

1. **Extract** — condense the (possibly imperfect) shared secret into a short, uniformly-random pseudorandom key.
2. **Expand** — stretch that into as many independent, purpose-labeled keys as the protocol needs (e.g. "client write key", "server write key", "client MAC key" all derived from one exchange, each cryptographically independent of the others).

<div class="callout warn" id="a-different-problem-password-based-kdfs">
  <span class="callout-title">A different problem: password-based KDFs</span>
  <p>HKDF assumes the input already has plenty of entropy (like a DH output). A human-chosen password does not — it might only have 20–30 bits of real entropy despite being 12 characters long. Turning a password into a key needs a deliberately <em>slow</em>, memory-hard function instead — PBKDF2, scrypt, or Argon2. That's a different problem with different tools, covered in full under <a href="{{ '/topics/password-storage/' | relative_url }}">Password Storage</a>.</p>
</div>

## Practical demo: ECDH with OpenSSL (X25519)

```
$ openssl genpkey -algorithm x25519 -out alice.pem
$ openssl genpkey -algorithm x25519 -out bob.pem
$ openssl pkey -in alice.pem -pubout -out alice_pub.pem
$ openssl pkey -in bob.pem -pubout -out bob_pub.pem

$ openssl pkeyutl -derive -inkey alice.pem -peerkey bob_pub.pem -out alice_shared.bin
$ openssl pkeyutl -derive -inkey bob.pem -peerkey alice_pub.pem -out bob_shared.bin

$ diff alice_shared.bin bob_shared.bin && echo IDENTICAL
IDENTICAL

$ xxd alice_shared.bin
00000000: 24ad 370d 4851 e9a6 4a1d 089e 36e0 797f  $.7.HQ..J...6.y.
00000010: ecb0 2645 e3d4 9161 ae56 44d2 8d64 814e  ..&E...a.VD..d.N
```

Alice derived her copy using only *her* private key and *Bob's public* key; Bob derived his using only *his* private key and *Alice's public* key. Neither private key, nor the shared secret itself, ever needed to be transmitted — and both sides landed on the identical 32 bytes above. (Real output, generated for this demo — X25519 requires OpenSSL 1.1.0+; macOS's bundled LibreSSL doesn't support it, hence the Homebrew OpenSSL used here.)

## Real-world case: Logjam (2015)

**Logjam** ([CVE-2015-4000](https://nvd.nist.gov/vuln/detail/CVE-2015-4000), disclosed May 2015) exploited a leftover from 1990s US export restrictions on cryptography: many TLS servers still supported a legacy "export-grade" Diffie-Hellman mode capped at a 512-bit prime, kept around for compatibility long after the restrictions themselves were lifted. Because the TLS handshake at the time didn't cryptographically bind the negotiated cipher suite as tightly as it should have, an active man-in-the-middle attacker could intercept the handshake and trick both browser and server into "downgrading" to the weak export-grade group — even when neither side actually wanted it — then break that specific 512-bit exchange (using precomputation, on academic-scale compute available at the time, according to the [researchers who disclosed it](https://weakdh.org/)) and read or modify everything that followed.

This is the downgrade-attack failure mode the [forward-secrecy comparison above](#forward-secrecy-why-ephemeral-matters) is really warning about: the weakness wasn't in Diffie-Hellman itself, or even specifically in ephemeral vs. static key exchange — it was in leaving a deliberately weakened legacy option reachable at all, and trusting the handshake to negotiate it away safely on its own. The fix was blunt and effective: drop support for export-grade ciphers and any DH group under 2048 bits entirely — precisely the same philosophy behind [TLS 1.3 deleting]({{ '/topics/tls-ssl-handshake/' | relative_url }}#what-tls-13-removed-and-why), rather than merely discouraging, its own list of legacy options.

## Common pitfalls

- **Using static instead of ephemeral DH** — silently forfeits forward secrecy; a future key compromise retroactively decrypts everything.
- **Using the raw shared secret as an encryption key directly** — skips HKDF (or an equivalent), risking subtle structure in the key material.
- **Deriving multiple keys by simple truncation** (e.g. "first 16 bytes = key 1, next 16 = key 2") instead of a proper labeled KDF expand step — can introduce unexpected correlations between the "independent" keys.
- **Confusing this with password-based key derivation** — HKDF is not a substitute for PBKDF2/scrypt/Argon2, and vice versa; they solve different entropy problems.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/sp/800/56/a/r3/final">NIST SP 800-56A Rev. 3</a></strong> covers DH/ECDH key-establishment schemes. <strong><a href="https://www.rfc-editor.org/rfc/rfc7748">RFC 7748</a></strong> specifies the X25519 and X448 curves used above. <strong><a href="https://www.rfc-editor.org/rfc/rfc5869">RFC 5869</a></strong> defines HKDF.</p>
</div>

## Where this fits

This is the machinery running underneath every [TLS handshake]({{ '/topics/tls-ssl-handshake/' | relative_url }}) — (EC)DHE establishes the shared secret, HKDF turns it into the actual traffic keys, and those keys hand off to the [symmetric cipher]({{ '/topics/symmetric-cryptography/' | relative_url }}) doing the real encryption work for the rest of the connection.
