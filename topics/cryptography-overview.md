---
title: What Is Cryptography?
description: My working map of the security properties cryptographic systems can support.
permalink: /topics/cryptography-overview/
last_verified: 2026-08-05
---

<span class="eyebrow">Cryptography / Concepts</span>

# What Is Cryptography?

<p class="lede">I use cryptography to protect data even when the network, storage, or intermediary cannot be trusted. I start with the property I need, then choose a reviewed protocol or primitive that provides it. Memorizing algorithm names first does not tell me what a system actually protects.</p>

## Why cryptography? The open network problem

Imagine having to run a business where every business contract, payment order, and private conversation had to be written on a postcard and passed hand-to-hand down a crowded street.

Anyone along the line could:
1. **Read** your private figures (**Eavesdropping**).
2. **Change** the numbers before passing it on (**Tampering**).
3. **Pretend** to be you and send false orders (**Impersonation**).
4. **Deny** later that they ever sent a document (**Repudiation**).

The internet is that crowded street. Cryptography gives me tools to protect data across an untrusted path. It does not guarantee security on its own: the protocol, implementation, keys, identities, and surrounding controls still matter.

---

## Four properties I use to organize these notes

This is a useful study framework, not a universal or complete taxonomy of cryptography. Confidentiality and integrity come from the [CIA triad]({{ '/topics/security-fundamentals/' | relative_url }}); authenticity and accountability become important once keys are tied to identities. Availability remains outside the list because a cipher, hash, or signature does not keep a service reachable.

1. **Confidentiality (Secrecy)** — Ensuring that *only* the intended recipient can read the message contents.
2. **Integrity (Change Detection)** — Making unauthorized or accidental modification detectable. Some controls can also prevent a change from being accepted.
3. **Authenticity (Origin Verification)** — Confirming that data came from a party controlling an expected key. Binding that key to a person, service, or domain is a separate step.
4. **Evidence / Non-repudiation support** — Producing evidence that can help attribute an action to a signing key. Whether this is enough to bind a human or organization also depends on identity proofing, key custody, audit records, and the applicable process or law.

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
  <p><strong>The Solution:</strong> The bank produces the signed instruction together with its identity checks, custody records, timestamps, and transaction logs. This is evidence that can be assessed; the signature alone does not prove Alice's intent or exclude key theft.</p>
  <p><em>In Cryptography:</em> <strong><a href="{{ '/topics/digital-signatures/' | relative_url }}">digital signatures</a></strong> such as ECDSA, Ed25519, or RSA-PSS show that a valid signature was produced using the corresponding private key. I still need separate evidence to establish who controlled that key at the time.</p>
</div>

---

## Pillar summary at a glance

| Security Pillar | The Core Question | What Breaks Without It | Cryptographic Primitive |
| :--- | :--- | :--- | :--- |
| **Confidentiality** | *"Can anyone else read this?"* | Eavesdropping / Leakage | **Encryption** (AES-GCM, ChaCha20-Poly1305, or a reviewed hybrid public-key scheme) |
| **Integrity** | *"Has this been modified?"* | Tampering / Corruption | **[Cryptographic Hashes & MACs]({{ '/topics/hash-functions-macs/' | relative_url }})** (SHA-256, HMAC) |
| **Authenticity** | *"Is the sender who they claim?"* | Impersonation / Spoofing | **[Certificates & PKI]({{ '/topics/certificates/' | relative_url }})** (X.509, CAs) |
| **Evidence / accountability** | *"What evidence ties this action to a key?"* | Weak attribution | **[Digital Signatures]({{ '/topics/digital-signatures/' | relative_url }})** (ECDSA, Ed25519, RSA-PSS) |

---

## How real-world protocols combine several properties

Modern web security combines several properties in protocols such as **[TLS / HTTPS]({{ '/topics/tls-ssl-handshake/' | relative_url }})**:

1. **Server authentication:** The browser validates the certificate chain and checks that the certificate covers `bank.com`. This binds the handshake to that domain under the browser's trust policy; it does not certify that the site is honest.
2. **Authenticated key agreement:** The server normally signs the handshake transcript with the private key corresponding to its certificate. The peers use **[(EC)DHE key agreement]({{ '/topics/key-exchange-derivation/' | relative_url }})** to establish shared secrets. ECDHE itself does not provide non-repudiation.
3. **Confidentiality:** All web traffic (passwords, credit cards, HTML) is encrypted using fast **[Symmetric Ciphers]({{ '/topics/symmetric-cryptography/' | relative_url }})** (AES-GCM).
4. **Integrity:** Each protected TLS record carries an AEAD authentication tag. This is a TLS-record property, not a tag added independently to every IP packet.

## What “secure” means in practice

“Secure” is not an absolute label. I need to ask which property is protected, against which attacker, for how long, and under which assumptions. A sound algorithm can still fail through nonce reuse, weak keys, bad certificate validation, side channels, excessive permissions, or a compromised endpoint.

Data lifetime still matters. Information encrypted today may be recorded and attacked later, so the selected algorithm and key size must remain suitable for the whole confidentiality period. I use the dated [Recommended Algorithms & Regional Standards]({{ '/topics/recommended-algorithms/' | relative_url }}) page for current choices, then rely on a reviewed protocol and tested implementation instead of assembling primitives myself.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/glossary/term/cryptography">NIST's cryptography glossary</a></strong> defines the discipline in terms of confidentiality, data integrity, source authentication, and non-repudiation. The <strong><a href="https://csrc.nist.gov/glossary/term/digital_signature">NIST digital-signature glossary</a></strong> is also careful to say that a properly implemented signature provides a mechanism for origin authentication, integrity, and non-repudiation support. That implementation and supporting-process condition is why I treat these as properties a cryptographic system can support, not automatic outcomes from choosing an algorithm.</p>
</div>
