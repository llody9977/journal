---
title: Certificate Transparency
description: How public, append-only Merkle tree logs stop CAs (or attackers) from issuing certificates in secret.
permalink: /topics/certificate-transparency/
last_verified: 2026-07-26
---

<span class="eyebrow">Cryptography / Public Key Infrastructure / Deep Dive</span>

# Certificate Transparency

<p class="lede">I think of Certificate Transparency as public evidence and monitoring for certificate issuance, not a guarantee that a bad certificate is stopped before use. An SCT can be accepted by a browser before the certificate or precertificate is included in the log, because the SCT is a promise of later inclusion.</p>

## The problem CT was built to solve

In 2011, an attacker compromised **DigiNotar**, a Dutch CA, and issued fraudulent certificates for domains including `*.google.com` — used in the wild to intercept traffic in Iran. The certificates were technically valid (correctly signed by a trusted root) and nothing in the [chain-of-trust validation]({{ '/topics/certificates/' | relative_url }}#chain-of-trust) covered earlier would have caught them; the CA itself was the compromised party. DigiNotar was discovered only because one of the fraudulent certificates happened to be misused in a way that got noticed. Certificate Transparency, proposed by Google shortly after, exists so that this class of incident gets caught systematically instead of by luck.

## How the log itself works

A CT log is an **append-only Merkle tree**, using the same basic authenticated-tree idea as the [blockchain Merkle tree]({{ '/topics/blockchain-cryptography/' | relative_url }}#the-transactions-part-merkle-trees), with certificate entries instead of transactions. Blockchains address history through hash-linked structures and consensus; CT uses signed tree heads plus explicit proofs and external monitors. They have different trust and consistency models.

- **Inclusion proof** — "this specific certificate is really in the tree" (identical in spirit to a Merkle proof from the blockchain page).
- **Consistency proof** — "the tree's current state is purely an *append* to its previous state — nothing earlier was altered or deleted." This is the piece unique to CT logs: any monitor can fetch the tree's head at two different times and cryptographically verify the newer one is a strict superset of the older one, with no way for the log operator to rewrite history undetected.

## The SCT lifecycle

<div class="diagram-frame">
  <img src="{{ '/assets/img/sct-flow.svg' | relative_url }}" alt="Diagram showing the SCT lifecycle: a CA submits a precertificate to CT logs; each returns an SCT promising inclusion within its maximum merge delay. A browser then applies its own CT policy, whose SCT count and log requirements vary." >
  <p class="diagram-caption">The SCT is a promise; inclusion proofs, consistency proofs, monitors, and browser policy complete the control</p>
</div>

A **Signed Certificate Timestamp (SCT)** is a log's cryptographic promise: *“I will incorporate this certificate or precertificate into my tree within the Maximum Merge Delay.”* It can be embedded in the final certificate, delivered through a TLS extension, or carried with an OCSP response. Browser policies differ and evolve; the number of SCTs and operator diversity can depend on certificate lifetime and the policy in force. [Apple publishes its current CT policy](https://support.apple.com/en-us/103214), while Chromium maintains separate log and policy machinery.

## Monitoring: using CT logs defensively

Because browser policy normally causes a certificate or its precertificate to appear in accepted logs, domain owners can monitor for unexpected issuance. A search result may therefore be a precertificate rather than the byte-for-byte final certificate. **crt.sh** is a widely used public search interface over aggregated CT data:

```
https://crt.sh/?q=example.com
```

<div class="callout warn">
  <span class="callout-title">A note on live output here</span>
  <p>crt.sh is a free, community-run service that's occasionally overloaded and returns a temporary 502 — it was returning exactly that at the time this page was written, so no live query output is included here. The URL above is real and correct; try it directly, or use its JSON API at <code>https://crt.sh/?q=example.com&output=json</code> when it's responsive.</p>
</div>

Several commercial and free services (Cert Spotter, Facebook's CT monitoring tool, and CT-aware security scanners) build automated alerting on top of the same log data, notifying a domain owner within minutes of any new certificate being logged for their domains.

## Common pitfalls

- **Treating CT as prevention rather than detection** — CT does not stop issuance, and an SCT may precede inclusion. Visibility depends on log compliance, monitoring, consistency checks, and browser enforcement.
- **Not monitoring your own domains** — the data is public and free to query; not watching it means finding out about a mis-issuance the hard way instead.
- **Confusing an SCT with inclusion proof or a CA signature** — an SCT is a promise to include; an inclusion proof shows an entry is in a particular tree; the CA signature is the certificate issuer's attestation. None of these alone says the certificate should have been issued.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.rfc-editor.org/rfc/rfc6962">RFC 6962</a></strong> is the original Certificate Transparency specification; <strong><a href="https://www.rfc-editor.org/rfc/rfc9162">RFC 9162</a></strong> is the updated version (CTv2). Google's own <a href="https://certificate.transparency.dev/">certificate.transparency.dev</a> documents the current log list and policy requirements.</p>
</div>

## How I connect this

CT doesn't replace anything covered under [Certificate Authorities & Certificates]({{ '/topics/certificates/' | relative_url }}) — it adds a public accountability layer on top, using the same Merkle tree math as [Blockchain Cryptography]({{ '/topics/blockchain-cryptography/' | relative_url }}), so that the trust the rest of PKI depends on doesn't rest solely on individual CAs behaving correctly, unobserved.
