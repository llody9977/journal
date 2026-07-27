---
title: Cryptography Overview
description: My working map of the security properties cryptographic systems can support.
permalink: /topics/cryptography-overview/
---

<span class="eyebrow">Cryptography / Overview</span>

# Cryptography, my working map

<p class="lede">I use cryptography to protect data even when the network, storage, or intermediary cannot be trusted. The important part for me is not memorising algorithms first; it is knowing which security property a primitive actually provides, and which property it does not.</p>

## Why cryptography? The open network problem

Imagine having to run a business where every business contract, payment order, and private conversation had to be written on a postcard and passed hand-to-hand down a crowded street.

Anyone along the line could:
1. **Read** your private figures (**Eavesdropping**).
2. **Change** the numbers before passing it on (**Tampering**).
3. **Pretend** to be you and send false orders (**Impersonation**).
4. **Deny** later that they ever sent a document (**Repudiation**).

The internet is that crowded street. Cryptography exists because we cannot make the network inherently trustworthy, so we must make the *data itself* self-protecting. To do that, cryptography guarantees four fundamental security pillars.

---

## Four properties I use to organise these notes

This is a useful study framework, not a universal or complete taxonomy of cryptography. Confidentiality and integrity come from the [CIA triad]({{ '/topics/security-fundamentals/' | relative_url }}); authenticity and accountability become important once keys are tied to identities. Availability remains outside the list because a cipher, hash, or signature does not keep a service reachable.

1. **Confidentiality (Secrecy)** — Ensuring that *only* the intended recipient can read the message contents.
2. **Integrity (Tamper Prevention)** — Ensuring the message has not been altered, modified, or corrupted during transit.
3. **Authenticity (Identity Verification)** — Confirming that the message genuinely originated from the claimed sender.
4. **Evidence / Non-repudiation support** — Producing evidence that can help attribute an action to a signing key. Whether this is enough to bind a human or organisation also depends on identity proofing, key custody, audit records, and the applicable process or law.

---

## An intuitive analogy: The certified bank transfer

To understand how these four pillars work together, imagine Alice wants to send a high-stakes financial instruction to her bank: *"Transfer $10,000 from Alice to Charlie."*

Because Alice lives far away, she must hand her written instruction to an independent, untrusted courier to deliver to the bank teller. Here is how physical safeguards mirror the four cryptographic pillars:

<div class="callout">
  <span class="callout-title">1. Confidentiality — The Locked Briefcase</span>
  <p><strong>The Threat:</strong> The courier opens the envelope on the bus and reads Alice's bank account number and transfer amount.</p>
  <p><strong>The Solution:</strong> Alice locks the instruction inside a steel briefcase using a lock combination known only to her and the bank manager. The courier carries the briefcase, but cannot see or read what's inside.</p>
  <p><em>In Cryptography:</em> <strong>Encryption</strong> (<a href="{{ '/topics/symmetric-cryptography/' | relative_url }}">Symmetric</a> & <a href="{{ '/topics/asymmetric-cryptography/' | relative_url }}">Asymmetric</a> ciphers like AES or RSA) scrambles readable plaintext into unreadable ciphertext.</p>
</div>

<div class="callout">
  <span class="callout-title">2. Integrity — The Tamper-Evident Seal</span>
  <p><strong>The Threat:</strong> An attacker picks open the briefcase, adds a zero to make it <code>$100,000</code>, and snaps the briefcase closed again.</p>
  <p><strong>The Solution:</strong> Alice seals the document inside a special wax envelope stamped with a fragile micro-pattern. If anyone tampers with even a single character, the seal shatters irreparably. When the bank receives it, any broken seal means immediate rejection.</p>
  <p><em>In Cryptography:</em> a trusted <strong><a href="{{ '/topics/hash-functions-macs/' | relative_url }}">hash or MAC</a></strong> can detect a change. A hash is not unique in the mathematical sense—collisions exist—and an unkeyed digest only helps against an attacker if the expected digest arrives through a trusted channel.</p>
</div>

<div class="callout">
  <span class="callout-title">3. Authenticity — The Official ID & Notary Stamp</span>
  <p><strong>The Threat:</strong> Eve hands a locked briefcase to the courier claiming, <em>"I am Alice, transfer $10,000 to Eve."</em></p>
  <p><strong>The Solution:</strong> The bank teller checks the document for Alice's official notary stamp and signature card on file. Unless the document carries Alice's verified mark, the teller ignores the request.</p>
  <p><em>In Cryptography:</em> <strong><a href="{{ '/topics/certificates/' | relative_url }}">Digital certificates and CAs</a></strong> bind a public key to a name or other asserted identity under a particular validation policy. A domain-validated TLS certificate mainly proves control of the domain, not the real-world identity of a company or person.</p>
</div>

<div class="callout">
  <span class="callout-title">4. Non-Repudiation — The Handwritten Signature on Record</span>
  <p><strong>The Threat:</strong> Next week, after the bank transfers $10,000, Alice regrets her transfer. She sues the bank, claiming: <em>"I never authorized that transfer! A bank teller stole my money!"</em></p>
  <p><strong>The Solution:</strong> The bank produces the original document bearing Alice's unique, certified handwritten signature. Because only Alice holds the legal stamp and signing pen, she cannot legally or practically deny having authorized the transaction.</p>
  <p><em>In Cryptography:</em> <strong><a href="{{ '/topics/digital-signatures/' | relative_url }}">digital signatures</a></strong> such as ECDSA, Ed25519, or RSA-PSS show that a valid signature was produced using the corresponding private key. I still need separate evidence to establish who controlled that key at the time.</p>
</div>

---

## Pillar summary at a glance

| Security Pillar | The Core Question | What Breaks Without It | Cryptographic Primitive |
| :--- | :--- | :--- | :--- |
| **Confidentiality** | *"Can anyone else read this?"* | Eavesdropping / Leakage | **Encryption** ([AES]({{ '/topics/symmetric-cryptography/' | relative_url }}), ChaCha20, RSA) |
| **Integrity** | *"Has this been modified?"* | Tampering / Corruption | **[Cryptographic Hashes & MACs]({{ '/topics/hash-functions-macs/' | relative_url }})** (SHA-256, HMAC) |
| **Authenticity** | *"Is the sender who they claim?"* | Impersonation / Spoofing | **[Certificates & PKI]({{ '/topics/certificates/' | relative_url }})** (X.509, CAs) |
| **Evidence / accountability** | *"What evidence ties this action to a key?"* | Weak attribution | **[Digital Signatures]({{ '/topics/digital-signatures/' | relative_url }})** (ECDSA, Ed25519, RSA-PSS) |

---

## How real-world protocols combine all four

Modern web security combines several properties in protocols such as **[TLS / HTTPS]({{ '/topics/tls-ssl-handshake/' | relative_url }})**:

1. **Authenticity:** Your browser checks the website's SSL certificate issued by a **[Certificate Authority]({{ '/topics/certificates/' | relative_url }})** to confirm `bank.com` is genuine.
2. **Authenticated key agreement:** The server normally signs the handshake transcript with the private key corresponding to its certificate. The peers use **[(EC)DHE key agreement]({{ '/topics/key-exchange-derivation/' | relative_url }})** to establish shared secrets. ECDHE itself does not provide non-repudiation.
3. **Confidentiality:** All web traffic (passwords, credit cards, HTML) is encrypted using fast **[Symmetric Ciphers]({{ '/topics/symmetric-cryptography/' | relative_url }})** (AES-GCM).
4. **Integrity:** Each protected TLS record carries an AEAD authentication tag. This is a TLS-record property, not a tag added independently to every IP packet.

## What "secure" actually means: time, not certainty

Every cipher on this site is breakable, given enough time and compute — brute force alone eventually finds any key, no matter how large. Nothing here is unbreakable in an absolute sense, and no page on this site claims otherwise. The actual engineering goal is narrower and more useful: make breaking it take *so much longer* than the information needs to stay protected that the two numbers never meet.

A credit card number needs to stay confidential for a few years; a state secret might need decades; a root CA key backing an entire trust hierarchy might need to hold for longer than that. "Secure" always means "secure for how long this needs to matter" — which is exactly why key sizes get revised upward over time (see [Recommended Algorithms & Regional Standards]({{ '/topics/recommended-algorithms/' | relative_url }})), why algorithms eventually get deprecated rather than staying in use forever, and why the entire post-quantum migration is racing against a clock at all: an attacker recording encrypted traffic *today* and decrypting it once a capable quantum computer exists later is simply attacking on a longer time horizon than the data's protection was designed for. The math doesn't change; the value of breaking it in time does.

## How I connect this

This is my entry point for the rest of the journal. [Foundations]({{ '/topics/symmetric-cryptography/' | relative_url }}) covers the primitives, [Public Key Infrastructure]({{ '/topics/certificates/' | relative_url }}) covers identity binding and trust, and [Applied Cryptography]({{ '/topics/password-storage/' | relative_url }}) covers the places where implementation details usually matter more than the neat textbook model.
