---
title: Certificate Transparency (CT) & Merkle Audit Proofs
description: Cryptographic principles of Certificate Transparency (RFC 6962 / RFC 9162), Signed Certificate Timestamps (SCT), Merkle tree audit proofs, and browser CT policies.
permalink: /topics/certificate-transparency/
last_verified: 2026-08-09
---

<span class="eyebrow">Cryptography / Infrastructure</span>

# Certificate Transparency (CT) & Merkle Audit Proofs

<p class="lede">Certificate Transparency (CT) is an open cryptographic auditing framework that forces Certificate Authorities (CAs) to log every issued public X.509 certificate into append-only, publicly verifiable Merkle hash trees. CT does not prevent a CA from misissuing a certificate; instead, by requiring Signed Certificate Timestamps (SCTs) before browsers will trust a TLS connection, it makes secret CA certificate misissuance and rogue MitM certificates publicly discoverable rather than allowing them to go unnoticed.</p>

## The Problem: Rogue CA Misissuance

Historically, any trusted Root CA in an operating system trust store could issue a valid certificate for *any* domain on the internet without domain owner knowledge (*e.g., the 2011 DigiNotar compromise where rogue Google certificates were issued*). Certificate Transparency does not stop a CA from issuing a rogue certificate, but it makes all cert issuance public and cryptographically auditable, so a rogue certificate becomes discoverable by the legitimate domain owner or third-party monitors instead of remaining secret.

## Merkle Tree Architecture in CT (RFC 6962 / RFC 9162)

CT logs organize certificates into append-only Merkle hash trees. Standardized in **[RFC 6962](https://www.rfc-editor.org/rfc/rfc6962)** and **[RFC 9162](https://www.rfc-editor.org/rfc/rfc9162)**, a **Merkle Tree** hashes leaf data pairwise up to a single cryptographic **Root Hash**:

<div class="diagram-frame">
  <img src="{{ '/assets/img/certificate-transparency-merkle-tree.svg' | relative_url }}" alt="Certificate Transparency Merkle tree diagram showing leaf certificates hashed up to a Merkle Root Hash.">
  <p class="diagram-caption">CT Merkle Tree: append-only binary tree allowing O(log N) inclusion and consistency verification</p>
</div>

### Cryptographic Proof Types

1. **Inclusion Proof (Audit Path)**: Proves in **O(log N)** time that a specific certificate exists inside a log tree containing **N** entries without revealing the full log.
2. **Consistency Proof**: Proves in **O(log N)** time that an updated tree with **N + M** entries is a pure append-only extension of an earlier tree with **N** entries, ensuring past entries were never mutated or deleted.

## Signed Certificate Timestamps (SCT) & Flow

When a domain owner or automated ACME agent requests a certificate, the CA submits the pre-certificate to multiple independent CT log servers. Each log returns a **Signed Certificate Timestamp (SCT)** promising inclusion within a Maximum Merge Delay (MMD, typically 24 hours):

<div class="diagram-frame">
  <img src="{{ '/assets/img/sct-flow.svg' | relative_url }}?v=2" alt="Signed Certificate Timestamp (SCT) workflow showing CA log submission, SCT generation, and TLS embedding.">
  <p class="diagram-caption">SCT Delivery Workflow: CA submits pre-certificate to CT logs, receives SCTs, and embeds them into the TLS certificate</p>
</div>

## Browser CT Enforcement Policies

CT enforcement is set independently by each browser vendor, rolled out on different dates, and scoped differently:

- **Google Chrome**: enforces CT for publicly-trusted TLS certificates issued after April 30, 2018 per [Chrome Certificate Transparency Policy](https://googlechrome.github.io/CertificateTransparency/ct_policy.html).
- **Apple Safari / macOS / iOS**: enforces CT platform-wide for publicly-trusted certificates issued after October 15, 2018 per [Apple Certificate Transparency Policy](https://support.apple.com/en-us/103214).
- **Mozilla Firefox**: added CT enforcement on desktop platforms starting with Firefox 135 (February 2025), scoped to certificates chaining to a CA in Mozilla's Root CA Program.
- **Microsoft Edge**: as a Chromium-based browser, inherits Chrome's enforcement by default; administrators can disable it for specific CAs or URLs via Edge policy.

### 1. Chrome Embedded-SCT Policy

For certificates evaluated under [Chrome's CT Policy](https://googlechrome.github.io/CertificateTransparency/ct_policy.html) using embedded SCTs:

| Certificate Lifetime | Required Embedded SCT Count | Log Operator Diversity Rule |
|---|---|---|
| **Under 180 Days** | **Minimum 2 SCTs** | Must include SCTs from at least 2 distinct, independent CT log operators (*e.g., Google + Cloudflare*). |
| **Over 180 Days** | **Minimum 3 SCTs** | Must include SCTs from at least 2 distinct log operators to hedge against operator outage or compromise. |

### 2. Apple CT Policy Rules

Under [Apple's CT Policy](https://support.apple.com/en-us/103214), publicly trusted server certificates must present SCTs depending on certificate validity period:
- **Lifetime $\le$ 180 days**: At least 2 SCTs from distinct log operators.
- **Lifetime > 180 days up to 398 days**: At least 3 SCTs from distinct log operators.
- **Operator Diversity Requirement**: At least 1 SCT must come from an Apple-recognized log operator, and at least 1 from a different log operator.

### 3. TLS-Delivered SCTs vs. X.509 Embedded SCTs

SCTs can be delivered to the client browser via three distinct transport mechanisms:
1. **Embedded X.509 v3 Extension** (OID `1.3.6.1.4.1.11129.2.4.2`): Pre-certificates are submitted to logs by the CA before final issuance, and the received SCTs are statically baked directly into the certificate. This is the overwhelmingly common pattern.
2. **TLS Extension** (`signed_certificate_timestamp`, extension type 18): The web server requests SCTs dynamically or receives them out-of-band and transmits them inside the `ServerHello` handshake message.
3. **OCSP Stapling**: The web server includes SCTs wrapped inside a stapled OCSP response (`OCSPResponse`).

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Certificate Transparency Summary</strong>
    <ul>
      <li><strong>Detection, Not Prevention</strong>: CT does not stop a CA from misissuing a certificate — it makes misissuance publicly loggable and discoverable after the fact, so it enables accountability rather than blocking the act itself.</li>
      <li><strong>Public Append-Only Logs</strong>: CAs must log pre-certificates to public Merkle tree logs before issuing certificates.</li>
      <li><strong>Signed Certificate Timestamps (SCTs)</strong>: CAs receive SCT promises from CT logs and deliver them via X.509 extensions, TLS extensions, or OCSP stapling.</li>
      <li><strong>Browser Enforcement Policies</strong>: Chrome and Apple enforce distinct CT policies requiring specific SCT counts and log operator diversity rules based on certificate lifetime.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 6962**: *Certificate Transparency* — [IETF RFC 6962](https://www.rfc-editor.org/rfc/rfc6962)
- **RFC 9162**: *Certificate Transparency Version 2.0* — [IETF RFC 9162](https://www.rfc-editor.org/rfc/rfc9162)
- **Chrome CT Policy**: *Chrome Certificate Transparency Policy* — [Google Chrome CT Policy](https://googlechrome.github.io/CertificateTransparency/ct_policy.html)
- **Apple CT Policy**: *Apple's Certificate Transparency Policy* — [Apple Support HT209249 / 103214](https://support.apple.com/en-us/103214)
