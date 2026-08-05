---
title: TLS Handshake
description: How TLS 1.3 combines certificates, key exchange, and symmetric encryption into a single 1-round-trip handshake.
permalink: /topics/tls-ssl-handshake/
last_verified: 2026-08-05
---

<span class="eyebrow">Cryptography / Protocol Walkthrough</span>

# TLS Handshake

<p class="lede">This is where my separate notes on certificates, key agreement, HKDF, signatures, and AEAD finally meet. I am using a normal certificate-authenticated TLS 1.3 handshake as the main path; resumption and PSK-only handshakes have different properties.</p>

## SSL, TLS — and which versions are actually safe

"SSL" is the older name; the protocol has been called **TLS** since 1999, but "SSL" stuck around in casual use (and even some product names) long after. Only TLS versions should ever be in use today:

| Version | Status |
|---|---|
| SSL 2.0 / SSL 3.0 | **Obsolete.** SSLv3 is prohibited by RFC 7568; I do not enable either version. |
| TLS 1.0 / TLS 1.1 | **Deprecated.** RFC 8996 formally deprecated both versions in 2021. |
| TLS 1.2 | **Still widely used**, secure when configured with modern cipher suites — but permits older, weaker options if not configured carefully. |
| TLS 1.3 | **Current standard** ([RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)). Faster, and removed the insecure options entirely rather than just discouraging them. |

## The TLS 1.3 handshake, step by step

<div class="diagram-frame">
  <img src="{{ '/assets/img/tls-handshake.svg' | relative_url }}" alt="Sequence diagram of a certificate-authenticated TLS 1.3 handshake. ClientHello and ServerHello exchange ECDHE key shares; both sides then derive handshake keys. The server sends encrypted extensions, certificate, CertificateVerify, and Finished. The client returns Finished before application data flows." >
  <p class="diagram-caption">Every primitive covered so far, in one handshake</p>
</div>

1. **ClientHello** — the client proposes TLS versions, cipher suites it supports, and — critically, this is what makes 1-RTT possible — it speculatively sends an [ECDHE]({{ '/topics/key-exchange-derivation/' | relative_url }}) key share immediately, guessing which key-exchange group the server will accept.
2. **ServerHello + key share** — the server picks a cipher suite and responds with its own key share. From this point on, the rest of the handshake is already encrypted under handshake-specific keys — even the certificate exchange isn't sent in the clear in TLS 1.3.
3. **Handshake-key derivation** — immediately after `ServerHello`, both sides compute the ECDHE shared secret and use [HKDF]({{ '/topics/key-exchange-derivation/' | relative_url }}#from-shared-secret-to-usable-keys-kdfs) to derive handshake traffic keys.
4. **EncryptedExtensions + Certificate + CertificateVerify + Finished** — these server messages are already encrypted. The certificate chain binds a key to the server name under a trust policy; `CertificateVerify` proves possession of the matching private key and signs the transcript.
5. **Client Finished** — the client verifies the server flight and returns its Finished MAC over the transcript. Finished detects tampering in the handshake, while TLS also has explicit downgrade protections.
6. **Application data** — the peers derive application traffic secrets and protect TLS records with an [AEAD cipher]({{ '/topics/symmetric-cryptography/' | relative_url }}#authenticated-encryption-aead), normally AES-GCM or ChaCha20-Poly1305.

## Why TLS 1.3 is faster: 1-RTT instead of 2-RTT

A full TLS 1.2 handshake normally needed two round trips before the client could receive the server's Finished message and safely continue with application data. TLS 1.3 reorganized the handshake and places a key share in `ClientHello`, allowing a normal full handshake in one round trip when the server accepts the offered group. If it does not, `HelloRetryRequest` adds another round trip. Optional **0-RTT** resumption lets a client send early data before completing a new handshake, but that early data is replayable and must be restricted to replay-safe operations.

## What TLS 1.3 removed, and why

TLS 1.3 didn't just recommend against weak options — it deleted them from the protocol entirely:

- **Static RSA and static DH key exchange** — removed from certificate-authenticated handshakes. Normal full handshakes use ephemeral (EC)DHE; TLS 1.3 separately permits PSK-only `psk_ke`, which does not provide forward secrecy.
- **Compression** — enabled the CRIME attack, which could recover secrets by observing compressed response sizes.
- **Renegotiation** — a source of several serious vulnerabilities in earlier TLS versions.
- **RC4, DES, 3DES, and any non-AEAD cipher mode** — only authenticated encryption is allowed now; see the [modes-of-operation discussion]({{ '/topics/symmetric-cryptography/' | relative_url }}#modes-of-operation-why-aes-alone-isnt-enough) for why that matters.
- **MD5 and SHA-1** in the handshake — both are [broken]({{ '/topics/hash-functions-macs/' | relative_url }}#sha-2-sha-3-and-the-broken-ones).

## Practical demo: inspecting a real handshake

```
$ /opt/homebrew/bin/openssl s_client -connect example.com:443 \
    -servername example.com -tls1_3 -brief </dev/null

Connecting to 172.66.147.243
CONNECTION ESTABLISHED
Protocol version: TLSv1.3
Ciphersuite: TLS_AES_256_GCM_SHA384
Peer certificate: CN=example.com
Hash used: SHA256
Signature type: ecdsa_secp256r1_sha256
Verification: OK
Negotiated TLS1.3 group: X25519MLKEM768
DONE
```

Captured on **26 July 2026** with Homebrew OpenSSL **3.6.3**. The IP address, certificate chain, cipher, signature type, and negotiated group are live server choices and will change. macOS's bundled `/usr/bin/openssl` is LibreSSL and does not support this exact `-brief` output.

That last line is worth pausing on — `X25519MLKEM768` is a **hybrid** key-exchange group, combining classical X25519 ECDH with **ML-KEM** (a post-quantum key encapsulation mechanism, standardized as **[FIPS 203](https://csrc.nist.gov/pubs/fips/203/final)**). Real production traffic is already using this hybrid approach, so that even if a future quantum computer eventually breaks X25519, the ML-KEM half alone still protects the session — a live example of the industry hedging against a future algorithm break, the same instinct behind SHA-3 existing alongside SHA-2.

The full certificate chain presented (captured from the same connection) shows exactly the [Root → Intermediate → Leaf]({{ '/topics/certificates/' | relative_url }}#certificate-authority-ca-types) structure covered on the certificates page, in the wild:

```
depth=3 C=US, O=SSL Corporation, CN=SSL.com TLS ECC Root CA 2022
depth=2 C=US, O=SSL Corporation, CN=SSL.com TLS Transit ECC CA R2
depth=1 C=US, O=SSL Corporation, CN=Cloudflare TLS Issuing ECC CA 3
depth=0 CN=example.com
verify return:1
```

## Real-world case: Heartbleed (2014)

**Heartbleed** ([CVE-2014-0160](https://nvd.nist.gov/vuln/detail/CVE-2014-0160), disclosed April 2014) was a buffer over-read bug in OpenSSL's implementation of the TLS "heartbeat" extension — a keep-alive feature unrelated to any of the handshake steps described above. A malformed heartbeat request could trick a vulnerable server into echoing back up to 64 KB of its own process memory per request, repeatable indefinitely, with no trace left in any log.

That memory routinely contained exactly the material the handshake above is meant to protect: session data, plaintext from recent requests, and — worst case — the server's own TLS **private key**, the one thing the entire chain-of-trust and key-exchange sequence above assumes never leaks. A stolen private key doesn't just expose future traffic; combined with recorded past traffic from a connection that wasn't using ephemeral key exchange, it can decrypt sessions retroactively too. An estimated 17% of the internet's secure servers were vulnerable at disclosure, and because the bug left no reliable forensic trace, [there was no way for an affected operator to know for certain whether their key had actually been read](https://owasp.org/www-community/vulnerabilities/Heartbleed_Bug) before they rotated it.

Heartbleed is also a clean illustration of why [forward secrecy]({{ '/topics/key-exchange-derivation/' | relative_url }}#forward-secrecy-why-ephemeral-matters) matters beyond the abstract. For an ephemeral (EC)DHE session, later theft of the certificate private key does not by itself decrypt recorded traffic. Static RSA key exchange lacked that protection. Heartbleed could still expose plaintext, session material, or keys present in process memory, so forward secrecy limited one retrospective-decryption path rather than containing the whole incident.

## Common pitfalls

- **Disabling certificate validation to silence an error** — this removes server authentication and should never be a "quick fix."
- **Supporting legacy TLS versions or cipher suites unnecessarily** — every enabled option is attack surface, even if never negotiated by legitimate clients.
- **Having no revocation strategy** — OCSP stapling can improve privacy and latency where clients use OCSP, but browser behavior differs and some ecosystems also use CRLSets, CRLite, or vendor-maintained revocation lists. I should follow the policy for the actual client population.
- **Not enforcing HTTPS everywhere (HSTS)** — without it, a user's first request can still go out in plaintext before ever reaching an HTTPS redirect.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.rfc-editor.org/rfc/rfc8446">RFC 8446</a></strong> is the TLS 1.3 specification. <a href="https://www.rfc-editor.org/rfc/rfc7568">RFC 7568</a> prohibits SSLv3, and <a href="https://www.rfc-editor.org/rfc/rfc8996">RFC 8996</a> deprecates TLS 1.0 and 1.1. <strong><a href="https://csrc.nist.gov/pubs/sp/800/52/r2/final">NIST SP 800-52 Rev. 2</a></strong> gives government/enterprise guidance on TLS server configuration. <strong><a href="https://csrc.nist.gov/pubs/fips/203/final">FIPS 203</a></strong> defines ML-KEM, the post-quantum algorithm shown hybridized above.</p>
</div>
