---
title: Cryptography Overview
description: The four pillars of cryptography — confidentiality, integrity, authenticity, non-repudiation — and a worked analogy for how they combine in practice.
permalink: /topics/cryptography-overview/
---

<span class="eyebrow">Cryptography / Overview</span>

# Cryptography, mapped out.

<p class="lede">Every time you send a message, log into a bank, or load a webpage, your data travels across an open, untrusted network — passed along by routers, cables, and servers operated by total strangers. Cryptography is the math and engineering built to make that untrusted journey safe.</p>

## Why cryptography? The open network problem

Imagine having to run a business where every business contract, payment order, and private conversation had to be written on a postcard and passed hand-to-hand down a crowded street.

Anyone along the line could:
1. **Read** your private figures (**Eavesdropping**).
2. **Change** the numbers before passing it on (**Tampering**).
3. **Pretend** to be you and send false orders (**Impersonation**).
4. **Deny** later that they ever sent a document (**Repudiation**).

The internet is that crowded street. Cryptography exists because we cannot make the network inherently trustworthy, so we must make the *data itself* self-protecting. To do that, cryptography guarantees four fundamental security pillars.

---

## The 4 core pillars of security

These four are cryptography's own framing, not the full [security triad]({{ '/topics/security-fundamentals/' | relative_url }}) — confidentiality and integrity are shared with it directly; authenticity and non-repudiation are the extended properties cryptographic tools happen to be the primary mechanism for. Availability, the triad's third leg, sits outside this list entirely — no cipher, hash, or signature keeps a server reachable. Before looking at any algorithms or math, every cryptographic tool is designed to solve one or more of these four challenges:

1. **Confidentiality (Secrecy)** — Ensuring that *only* the intended recipient can read the message contents.
2. **Integrity (Tamper Prevention)** — Ensuring the message has not been altered, modified, or corrupted during transit.
3. **Authenticity (Identity Verification)** — Confirming that the message genuinely originated from the claimed sender.
4. **Non-Repudiation (Proof of Action)** — Ensuring the sender cannot later claim they never sent or authorized the message.

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
  <p><em>In Cryptography:</em> <strong><a href="{{ '/topics/hash-functions-macs/' | relative_url }}">Hash Functions & MACs</a></strong> (like SHA-256 and HMAC) generate a unique mathematical fingerprint. If even 1 bit of data changes, the hash output changes completely.</p>
</div>

<div class="callout">
  <span class="callout-title">3. Authenticity — The Official ID & Notary Stamp</span>
  <p><strong>The Threat:</strong> Eve hands a locked briefcase to the courier claiming, <em>"I am Alice, transfer $10,000 to Eve."</em></p>
  <p><strong>The Solution:</strong> The bank teller checks the document for Alice's official notary stamp and signature card on file. Unless the document carries Alice's verified mark, the teller ignores the request.</p>
  <p><em>In Cryptography:</em> <strong><a href="{{ '/topics/certificates/' | relative_url }}">Digital Certificates & CAs</a></strong> (Public Key Infrastructure) verify that a public key genuinely belongs to the person or website claiming it.</p>
</div>

<div class="callout">
  <span class="callout-title">4. Non-Repudiation — The Handwritten Signature on Record</span>
  <p><strong>The Threat:</strong> Next week, after the bank transfers $10,000, Alice regrets her transfer. She sues the bank, claiming: <em>"I never authorized that transfer! A bank teller stole my money!"</em></p>
  <p><strong>The Solution:</strong> The bank produces the original document bearing Alice's unique, certified handwritten signature. Because only Alice holds the legal stamp and signing pen, she cannot legally or practically deny having authorized the transaction.</p>
  <p><em>In Cryptography:</em> <strong><a href="{{ '/topics/digital-signatures/' | relative_url }}">Asymmetric Digital Signatures</a></strong> (like ECDSA or RSA signing) use a private key held strictly by the owner, proving to any third party that only the key holder could have generated the signature.</p>
</div>

---

## Pillar summary at a glance

| Security Pillar | The Core Question | What Breaks Without It | Cryptographic Primitive |
| :--- | :--- | :--- | :--- |
| **Confidentiality** | *"Can anyone else read this?"* | Eavesdropping / Leakage | **Encryption** ([AES]({{ '/topics/symmetric-cryptography/' | relative_url }}), ChaCha20, RSA) |
| **Integrity** | *"Has this been modified?"* | Tampering / Corruption | **[Cryptographic Hashes & MACs]({{ '/topics/hash-functions-macs/' | relative_url }})** (SHA-256, HMAC) |
| **Authenticity** | *"Is the sender who they claim?"* | Impersonation / Spoofing | **[Certificates & PKI]({{ '/topics/certificates/' | relative_url }})** (X.509, CAs) |
| **Non-Repudiation** | *"Can the sender deny this later?"* | False Denial / Backtracking | **[Digital Signatures]({{ '/topics/digital-signatures/' | relative_url }})** (ECDSA, Ed25519, RSA) |

---

## How real-world protocols combine all four

Modern web security doesn't pick just one pillar — it combines all four into unified protocols like **[TLS / HTTPS]({{ '/topics/tls-ssl-handshake/' | relative_url }})**:

1. **Authenticity:** Your browser checks the website's SSL certificate issued by a **[Certificate Authority]({{ '/topics/certificates/' | relative_url }})** to confirm `bank.com` is genuine.
2. **Non-Repudiation & Key Exchange:** The server and browser use **[Asymmetric Cryptography]({{ '/topics/key-exchange-derivation/' | relative_url }})** (Elliptic Curve Diffie-Hellman) to safely negotiate shared secrets.
3. **Confidentiality:** All web traffic (passwords, credit cards, HTML) is encrypted using fast **[Symmetric Ciphers]({{ '/topics/symmetric-cryptography/' | relative_url }})** (AES-GCM).
4. **Integrity:** Every network packet includes an **[Auth Tag / MAC]({{ '/topics/hash-functions-macs/' | relative_url }})** to ensure no router along the way modified the data.

## What "secure" actually means: time, not certainty

Every cipher on this site is breakable, given enough time and compute — brute force alone eventually finds any key, no matter how large. Nothing here is unbreakable in an absolute sense, and no page on this site claims otherwise. The actual engineering goal is narrower and more useful: make breaking it take *so much longer* than the information needs to stay protected that the two numbers never meet.

A credit card number needs to stay confidential for a few years; a state secret might need decades; a root CA key backing an entire trust hierarchy might need to hold for longer than that. "Secure" always means "secure for how long this needs to matter" — which is exactly why key sizes get revised upward over time (see [Recommended Algorithms & Regional Standards]({{ '/topics/recommended-algorithms/' | relative_url }})), why algorithms eventually get deprecated rather than staying in use forever, and why the entire post-quantum migration is racing against a clock at all: an attacker recording encrypted traffic *today* and decrypting it once a capable quantum computer exists later is simply attacking on a longer time horizon than the data's protection was designed for. The math doesn't change; the value of breaking it in time does.

## Where this fits

This is the conceptual entry point for everything under Cryptography, one level beneath [Security Fundamentals]({{ '/topics/security-fundamentals/' | relative_url }})'s CIA framing — [Foundations]({{ '/topics/symmetric-cryptography/' | relative_url }}) covers each of the four pillars' primitives in depth, [Public Key Infrastructure]({{ '/topics/certificates/' | relative_url }}) covers authenticity and non-repudiation at internet scale, and [Applied Cryptography]({{ '/topics/password-storage/' | relative_url }}) covers where these primitives show up in real systems (passwords, disks, blockchains). Everything under [Key Management]({{ '/topics/hsm-kms/' | relative_url }}), [Authentication & Authorization]({{ '/topics/oauth-oidc/' | relative_url }}), [Network Security]({{ '/topics/dns-security/' | relative_url }}), and [Emerging Topics]({{ '/topics/ai-llm-security/' | relative_url }}) builds directly on these four pillars, applied to a specific layer of a real system.
