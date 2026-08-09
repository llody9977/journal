---
title: DNS Security
description: Architectural analysis of DNS security primitives, Kaminsky cache poisoning, DNSSEC signature chains (DS/DNSKEY/RRSIG), DoH/DoT encryption, and dangling CNAME risks.
permalink: /topics/dns-security/
last_verified: 2026-08-06
---

<span class="eyebrow">Network Security / Protocol Analysis</span>

# DNS Security

<p class="lede">Domain Name System (DNS) security encompasses three distinct cryptographic objectives: authenticating domain records via DNSSEC, encrypting client-to-resolver transport via DNS-over-HTTPS/TLS (DoH/DoT), and managing domain delegation hygiene to prevent dangling CNAME subdomain takeovers.</p>

## Core DNS Record Types & Security Impact

| Record Type | Protocol Function | Security Implications & Failure Modes |
|---|---|---|
| **A / AAAA** | Hostname to IPv4 / IPv6 mapping | Primary target for DNS cache poisoning and malicious IP redirection. |
| **CNAME** | Canonical hostname alias | Leaving dangling CNAME records pointing to deprovisioned SaaS targets enables **subdomain takeover**. |
| **MX** | Mail Exchanger priority list | Priority `0` represents primary mail server; unauthenticated MX records permit email interception. |
| **NS** | Nameserver delegation | Compromising or hijacking authoritative NS records hands total zone control to an adversary. |
| **TXT** | Arbitrary text attributes | Stores **SPF**, **DKIM**, and **DMARC** email authentication policies and SaaS verification tokens. |
| **CAA** | Certification Authority Authorization | Restricts which public Certificate Authorities are authorized to issue TLS certificates for the zone. |

---

## The Threat: Kaminsky Cache Poisoning Attack (2008)

Unauthenticated DNS (RFC 1035) relies solely on 16-bit Transaction IDs (TxID) and UDP source port matching. The 2008 **Kaminsky Attack** demonstrated that an adversary could flood a recursive resolver with forged authoritative responses for non-existent subdomains (*e.g., `1.example.com`, `2.example.com`*), forging matching TxIDs to poison the parent domain's nameserver record (`NS`) in the resolver cache.

<div class="diagram-frame">
  <img src="{{ '/assets/img/dns-cache-poisoning.svg' | relative_url }}" alt="DNS cache-poisoning attempt in which an attacker triggers a lookup, races forged replies, and tries to place false data in a recursive resolver cache.">
  <p class="diagram-caption">A forged response is useful only if the resolver accepts and caches it</p>
</div>

Modern resolvers mitigate Kaminsky attacks by randomizing UDP source ports and query IDs, but complete authentication requires **DNSSEC**.

---

## DNSSEC: Cryptographic Chain of Trust (RFC 4033 - 4035)

**DNSSEC** adds cryptographic signatures to DNS records using public-key cryptography:

<div class="diagram-frame">
  <img src="{{ '/assets/img/dnssec-chain.svg' | relative_url }}" alt="DNSSEC chain of trust from the root trust anchor through parent DS records and child DNSKEY records to a signed answer.">
  <p class="diagram-caption">Each parent zone securely delegates trust to the child zone</p>
</div>

### DNSSEC Record Definitions

- **DNSKEY**: Contains the public key used to verify signatures within the zone (Key Signing Key `KSK` or Zone Signing Key `ZSK`).
- **RRSIG**: Cryptographic signature over a record set (RRset) created by the ZSK.
- **DS (Delegation Signer)**: Cryptographic hash of the child zone's DNSKEY published in the parent zone, forging the chain of trust across zone boundaries.

---

## DNSSEC vs Encrypted DNS (DoH / DoT)

| Dimension | DNSSEC (RFC 4033-4035) | DNS-over-HTTPS (DoH / RFC 8484) | DNS-over-TLS (DoT / RFC 7858) |
|---|---|---|---|
| **Primary Protection** | **Data Authenticity & Integrity** | **Client-to-Resolver Confidentiality** | **Client-to-Resolver Confidentiality** |
| **Transport Encryption** | None (Payloads sent in cleartext) | TLS Encrypted (HTTP/2 on Port 443) | TLS Encrypted (Dedicated Port 853) |
| **Mitigates Eavesdropping?** | No | Yes (Hides queries from local ISP/WiFi) | Yes (Hides queries from local ISP/WiFi) |
| **Mitigates Cache Poisoning?** | **Yes** (Validates signatures end-to-end) | No (Trusts resolver to provide valid data) | No (Trusts resolver to provide valid data) |

---

## CLI Inspection Commands

```bash
# 1. Inspect DNSSEC keys and signatures for a signed domain using dig
dig +dnssec nist.gov A +noall +answer
# Output snippet:
# nist.gov. 300 IN A 172.65.90.25
# nist.gov. 300 IN RRSIG A 8 2 300 20260806120000 ... nist.gov. H5dIY8Tt...

# 2. Perform complete cryptographic chain validation using delv
delv nist.gov A
# Output: ; fully validated
```

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>DNS Security Summary</strong>
    <ul>
      <li><strong>DNS Cache Poisoning</strong>: Attackers spoof DNS responses to redirect user traffic. Mitigated by source port randomization and DNSSEC.</li>
      <li><strong>DNSSEC Validation</strong>: Cryptographically signs DNS resource records (RRSIG, DNSKEY, DS) to prove origin authenticity and integrity.</li>
      <li><strong>DoH &amp; DoT Transport Security</strong>: DNS over HTTPS (DoH / RFC 8484) and DNS over TLS (DoT / RFC 7858) encrypt DNS queries against network eavesdropping.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 4033**: *DNS Security Introduction and Requirements (DNSSEC)* — [IETF RFC 4033](https://www.rfc-editor.org/rfc/rfc4033)
- **RFC 8484**: *DNS Queries over HTTPS (DoH)* — [IETF RFC 8484](https://www.rfc-editor.org/rfc/rfc8484)
