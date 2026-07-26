---
title: Certificate Transparency
description: How public, append-only Merkle tree logs stop CAs (or attackers) from issuing certificates in secret.
permalink: /topics/certificate-transparency/
---

<span class="eyebrow">Cryptography / Public Key Infrastructure / Deep Dive</span>

# Certificate Transparency

<p class="lede">The <a href="{{ '/topics/certificates/' | relative_url }}#certificate-transparency-ct">certificates page</a> introduced Certificate Transparency (CT) in brief. The actual mechanism is a specific, clever application of the same Merkle tree structure from <a href="{{ '/topics/blockchain-cryptography/' | relative_url }}#the-transactions-part-merkle-trees">Blockchain Cryptography</a>, adapted to a very different problem: catching mis-issued certificates, publicly, before browsers are ever asked to trust them.</p>

## The problem CT was built to solve

In 2011, an attacker compromised **DigiNotar**, a Dutch CA, and issued fraudulent certificates for domains including `*.google.com` — used in the wild to intercept traffic in Iran. The certificates were technically valid (correctly signed by a trusted root) and nothing in the [chain-of-trust validation]({{ '/topics/certificates/' | relative_url }}#chain-of-trust) covered earlier would have caught them; the CA itself was the compromised party. DigiNotar was discovered only because one of the fraudulent certificates happened to be misused in a way that got noticed. Certificate Transparency, proposed by Google shortly after, exists so that this class of incident gets caught systematically instead of by luck.

## How the log itself works

A CT log is an **append-only Merkle tree** — structurally the same idea as the [blockchain Merkle tree]({{ '/topics/blockchain-cryptography/' | relative_url }}#the-transactions-part-merkle-trees) covered earlier, with certificates in place of transactions. But a CT log needs to prove something a blockchain doesn't have to: that the log itself hasn't been secretly rewritten or had entries quietly removed. That needs two distinct kinds of proof:

- **Inclusion proof** — "this specific certificate is really in the tree" (identical in spirit to a Merkle proof from the blockchain page).
- **Consistency proof** — "the tree's current state is purely an *append* to its previous state — nothing earlier was altered or deleted." This is the piece unique to CT logs: any monitor can fetch the tree's head at two different times and cryptographically verify the newer one is a strict superset of the older one, with no way for the log operator to rewrite history undetected.

## The SCT lifecycle

<div class="diagram-frame">
  <img src="{{ '/assets/img/sct-flow.svg' | relative_url }}" alt="Diagram showing the SCT lifecycle: a CA submits a pre-certificate to independent CT logs, each log returns a signed SCT promising to include it within a maximum merge delay, the CA embeds the SCTs into the final certificate, and the browser checks for at least two valid SCTs from recognized logs before trusting the certificate." >
  <p class="diagram-caption">A CA can't skip this step quietly — no valid SCTs, no trusted connection</p>
</div>

A **Signed Certificate Timestamp (SCT)** is a log's cryptographic promise: *"I will incorporate this certificate into my tree within my Maximum Merge Delay."* It's delivered to the browser one of three ways — embedded directly in the certificate (most common), via a TLS extension during the handshake, or stapled alongside an OCSP response. Modern browsers (Chrome since 2018, for all publicly-trusted certificates) require at least two valid SCTs from logs they recognize, from independent log operators — a certificate without them is rejected outright, regardless of how legitimate the issuing CA otherwise is.

## Monitoring: using CT logs defensively

Because every publicly-trusted certificate must appear in these logs, domain owners can monitor them for anything issued for their own domains — including certificates they never requested. **crt.sh** is the most widely used public search interface over aggregated CT log data:

```
https://crt.sh/?q=example.com
```

<div class="callout warn">
  <span class="callout-title">A note on live output here</span>
  <p>crt.sh is a free, community-run service that's occasionally overloaded and returns a temporary 502 — it was returning exactly that at the time this page was written, so no live query output is included here. The URL above is real and correct; try it directly, or use its JSON API at <code>https://crt.sh/?q=example.com&output=json</code> when it's responsive.</p>
</div>

Several commercial and free services (Cert Spotter, Facebook's CT monitoring tool, and CT-aware security scanners) build automated alerting on top of the same log data, notifying a domain owner within minutes of any new certificate being logged for their domains.

## Common pitfalls

- **Treating CT as prevention rather than detection** — CT doesn't stop a mis-issued certificate from being created; it guarantees it can't stay hidden. Monitoring is what turns that visibility into an actual response.
- **Not monitoring your own domains** — the data is public and free to query; not watching it means finding out about a mis-issuance the hard way instead.
- **Confusing an SCT with a CA's signature** — an SCT proves a certificate was logged publicly; it says nothing about whether the certificate should have been issued in the first place. Both checks matter, independently.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.rfc-editor.org/rfc/rfc6962">RFC 6962</a></strong> is the original Certificate Transparency specification; <strong><a href="https://www.rfc-editor.org/rfc/rfc9162">RFC 9162</a></strong> is the updated version (CTv2). Google's own <a href="https://certificate.transparency.dev/">certificate.transparency.dev</a> documents the current log list and policy requirements.</p>
</div>

## Where this fits

CT doesn't replace anything covered under [Certificate Authorities & Certificates]({{ '/topics/certificates/' | relative_url }}) — it adds a public accountability layer on top, using the same Merkle tree math as [Blockchain Cryptography]({{ '/topics/blockchain-cryptography/' | relative_url }}), so that the trust the rest of PKI depends on doesn't rest solely on individual CAs behaving correctly, unobserved.
