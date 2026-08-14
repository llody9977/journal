---
title: DNS Security
description: DNS actors and resolution, cache-poisoning defenses, DNSSEC validation, encrypted DNS privacy boundaries, delegation lifecycle, operations, and recovery.
permalink: /topics/dns-security/
last_verified: 2026-08-13
---

<span class="eyebrow">Network Security / Protocol Analysis</span>

# DNS Security

<p class="lede">Domain Name System (DNS) security has separate goals: return the intended data, authenticate signed data where DNSSEC is deployed, protect selected DNS transport hops from observation or modification, keep resolution available, and remove stale delegations. No single mechanism supplies all of these properties.</p>

## Follow the actors and caches

1. A **stub resolver** in an application or operating system sends a question to a configured recursive resolver.
2. The **recursive resolver** answers from cache or follows delegations through root, top-level-domain, and authoritative name servers.
3. An **authoritative server** answers for data in a zone. The zone operator controls the records; the registrar and registry maintain the parent-side delegation.
4. A **validating resolver** additionally evaluates DNSSEC signatures and the chain from a configured trust anchor. Validation can occur on the client, recursive resolver, or both.

The stub normally trusts its selected recursive resolver unless it validates independently. Split-horizon or private DNS may intentionally return different answers by network or identity; resolver selection and search-suffix policy therefore affect both security and correctness.

## Record types carry different risks

| Record | Function | Security and lifecycle concern |
|---|---|---|
| **A / AAAA** | Maps a name to an IPv4 / IPv6 address | Forged or unauthorized changes can redirect traffic; application-layer authentication such as TLS remains necessary. |
| **CNAME** | Aliases one name to another | A record that points to a deprovisioned, claimable service can enable subdomain takeover. This is an ownership-lifecycle failure, not a DNS cryptographic property. |
| **MX** | Lists mail exchangers with numeric preferences | [Lower numbers are preferred](https://www.rfc-editor.org/rfc/rfc5321.html#section-5.1). Preference `0` is only the lowest value in that RRset when no lower value exists; it does not universally mean “primary.” Unauthorized changes can redirect delivery, subject to the mail transport's other controls. |
| **NS** | Identifies authoritative servers and supports delegation | Compromise can alter answers served by the affected authority or delegation. Impact depends on registrar, registry, DNSSEC, secondary-server, and application controls; it is not automatically total control of every domain asset. |
| **TXT** | Carries arbitrary text | Commonly carries SPF, DKIM-related keys, DMARC policy, and service-verification tokens; stale tokens and overly broad email policy are separate risks. |
| **CAA** | Expresses which certificate issuers may issue for a domain | [RFC 8659 requires a conforming issuer to check CAA](https://www.rfc-editor.org/rfc/rfc8659.html#section-3), but CAA does not prevent issuance by an already authorized or nonconforming issuer and is not a substitute for certificate monitoring. |

## Cache poisoning is a response-acceptance race

Classic DNS over UDP does not cryptographically authenticate a response. An off-path forger must make a response arrive before the authentic answer and match the resolver's acceptance checks, including the question, query identifier, expected source address, and destination address and port described by [RFC 5452](https://www.rfc-editor.org/rfc/rfc5452.html). The Kaminsky technique repeatedly asks for unpredictable names so the resolver generates new upstream queries and the attacker gets repeated races against a delegation-related answer.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/dns-cache-poisoning.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the dns cache poisoning diagram at full size">
    <img src="{{ '/assets/img/dns-cache-poisoning.svg' | relative_url }}" alt="Conceptual DNS cache-poisoning race: a client triggers a cache miss, forged and authentic responses race toward the recursive resolver, and only a response that arrives first and passes all acceptance checks can affect the cache.">
  </a>
  <p class="diagram-caption">Conceptual attack path: a forged response must win the race and satisfy every resolver acceptance check</p>
</div>

Source-port and query-ID randomization increase the off-path guessing space; bailiwick checks and response matching reduce what a resolver accepts. These hardening measures lower forgery probability but do not add cryptographic origin authentication. DNSSEC provides that property for signed data when a validator has a valid chain; TLS-protected resolver transport protects only the encrypted hop and its authenticated endpoint.

## DNSSEC authenticates signed RRsets

DNSSEC signs **resource-record sets (RRsets)** and builds a chain across zone cuts:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/dnssec-chain.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the dnssec chain diagram at full size">
    <img src="{{ '/assets/img/dnssec-chain.svg' | relative_url }}" alt="Conceptual DNSSEC validation chain: the resolver begins with the root trust anchor, validates the parent DNSKEY and DS relationship for dot gov, validates the DS and DNSKEY relationship for nist.gov, then verifies the RRSIG covering the requested RRset.">
  </a>
  <p class="diagram-caption">Conceptual validation chain: each DS authenticates selected child DNSKEY data; an RRSIG then authenticates the answer RRset</p>
</div>

- **DNSKEY:** Publishes a zone public key. Operators often separate Key Signing Key (KSK) and Zone Signing Key (ZSK) roles, but that operational split is not required for every zone.
- **RRSIG:** Contains a signature produced by the private key corresponding to the identified DNSKEY. It is not necessarily produced by a key with one universal “ZSK” role.
- **DS:** The parent publishes a digest over the canonical child owner name concatenated with the child DNSKEY RDATA—not merely a hash of raw public-key bytes.
- **NSEC / NSEC3:** Authenticated-denial records prove that a requested name or type does not exist. NSEC3 changes the disclosure trade-off but does not hide all zone structure or remove enumeration risk.

A validator classifies an answer according to the chain and local policy. **Secure** data validates to a trust anchor; **insecure** data has a proven unsigned delegation; **bogus** data should validate but fails; **indeterminate** data cannot yet be classified. A broken signature, missing parent/child rollover data, expired signature, incorrect clock, stale trust anchor, or unreachable authoritative server can turn a signed deployment into a resolution outage.

The DNSSEC-related header flags answer different questions:

- **DO** in the EDNS request asks the server to include DNSSEC records; it does not request or prove validation by itself.
- **CD** asks a recursive resolver to disable its normal checking for that query so the requester can inspect or validate data itself.
- **AD** in a response is meaningful only when received over a trusted channel from a resolver whose validation behavior is trusted. It is not a portable proof when an attacker can alter the response header.

## DNSSEC and encrypted DNS solve different problems

| Mechanism | Protected path and property | What remains visible or trusted |
|---|---|---|
| **DNSSEC** ([RFC 4033–4035](https://www.rfc-editor.org/rfc/rfc4033.html)) | Authenticates signed DNS data from the validating component back to a configured trust anchor; does not encrypt DNS messages. | Query names remain visible on DNS transport. Unsigned zones and the validator's trust-anchor/policy state remain dependencies. |
| **DNS over TLS (DoT)** ([RFC 7858](https://www.rfc-editor.org/rfc/rfc7858.html)) | Protects a TLS connection between DNS client and resolver, commonly on TCP 853. | The selected resolver sees the query and performs or forwards resolution; later authoritative hops are separate. |
| **DNS over HTTPS (DoH)** ([RFC 8484](https://www.rfc-editor.org/rfc/rfc8484.html)) | Carries DNS in HTTPS; HTTP/2 is the minimum recommended version and deployments can use HTTP/3. | The selected HTTPS resolver sees the query; web-like transport can complicate enterprise resolver policy and visibility. |
| **DNS over QUIC (DoQ)** ([RFC 9250](https://www.rfc-editor.org/rfc/rfc9250.html)) | Protects DNS over a dedicated QUIC connection without HTTP semantics. | The selected resolver still sees client addressing and query content. |
| **Oblivious DoH (ODoH)** ([RFC 9230](https://www.rfc-editor.org/rfc/rfc9230.html), Experimental) | Separates a proxy that sees the client address from a target that decrypts the DNS message, assuming they do not collude. | Availability, traffic analysis, proxy/target policy, and the experimental protocol's deployment assumptions remain. |

DoH, DoT, and DoQ can carry DNSSEC records and validation results; they do not inherently disable DNSSEC. They authenticate and encrypt a transport endpoint, not the DNS data across every resolver-to-authority hop. The privacy gain therefore depends on which resolver is selected, whether the local network can force or bypass that choice, resolver logging and retention, and whether validation occurs locally.

## Reduce data exposure and operate the lifecycle

- **QNAME minimization** ([RFC 9156](https://www.rfc-editor.org/rfc/rfc9156.html)) sends only the name portion needed at each delegation step. It reduces disclosure to intermediate authoritative servers but not to the stub's recursive resolver; cold-cache resolution can require more queries.
- **Aggressive use of authenticated denial** ([RFC 8198](https://www.rfc-editor.org/rfc/rfc8198.html)) lets a validating resolver synthesize some negative answers from cached NSEC/NSEC3 data, reducing authoritative load. Cache policy and proof coverage limit where it applies.
- Coordinate DNSKEY, DS, and signature timing during rollover. Publish overlap, account for TTLs and caches, verify the parent update, and retain an emergency plan before removing the old validation path.
- Monitor validation failures, SERVFAIL rates, signature inception/expiration, DS/DNSKEY mismatch, authoritative reachability, unexpected delegation changes, resolver configuration drift, and query-volume anomalies.
- Inventory DNS records with the external resource lifecycle. Remove or replace aliases before a third-party target becomes claimable; investigate possible exposure if takeover occurred.
- Define recovery for registrar compromise, lost signing keys, bad DS publication, trust-anchor failure, resolver outage, and accidental private/public-zone divergence.

## Inspect behavior without treating one command as proof

```bash
# Request DNSSEC records. Presence of RRSIG shows signed data was returned;
# it does not prove that this client validated the chain.
dig +dnssec nist.gov A +noall +answer

# Ask the configured recursive resolver not to perform its normal checking.
# Comparing this with the normal response can help diagnose validation failure.
dig +dnssec +cdflag nist.gov A

# Validate with delv when the installed build has crypto support and a usable
# trust anchor. Output varies with software, resolver path, cache, and time.
delv nist.gov A
```

Record the resolver address, software version, trust-anchor source, system time, network path, and execution time with diagnostic evidence. A successful lookup proves only the tested name, type, path, validator state, and moment; it does not prove every record or future rollover is sound.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>DNSSEC authenticates signed RRsets through a validating chain; encrypted DNS protects a selected client-to-resolver transport; resolver and delegation operations preserve availability and ownership. Identify where validation occurs, which resolver learns the query, and how keys, DS records, caches, clocks, and stale aliases recover from failure.</p>
</div>

## Primary references

- **[RFC 5452: Measures for Making DNS More Resilient against Forged Answers](https://www.rfc-editor.org/rfc/rfc5452.html)** — verified response-matching conditions, race requirements, and forgery hardening boundaries.
- **[RFC 4033](https://www.rfc-editor.org/rfc/rfc4033.html), [RFC 4034](https://www.rfc-editor.org/rfc/rfc4034.html), and [RFC 4035](https://www.rfc-editor.org/rfc/rfc4035.html)** — verified DNSSEC records, DS digest input, validation states, authenticated denial, and chain behavior.
- **[RFC 6781: DNSSEC Operational Practices, Version 2](https://www.rfc-editor.org/rfc/rfc6781.html)** — verified rollover, timing, parent coordination, and operational failure considerations.
- **[Microsoft: Prevent dangling DNS entries and avoid subdomain takeover](https://learn.microsoft.com/en-us/azure/security/fundamentals/subdomain-takeover)** — verified the deprovisioned-resource lifecycle and remediation boundary for dangling aliases.
