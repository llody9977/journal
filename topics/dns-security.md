---
title: DNS Security
description: DNS cache poisoning, DNSSEC's chain of trust, and why DNSSEC and encrypted DNS solve two completely different problems.
permalink: /topics/dns-security/
---

<span class="eyebrow">Network Security / Deep Dive</span>

# DNS Security

<p class="lede">DNS is the internet's phone book — turning <code>nist.gov</code> into an IP address before anything else can happen. It was designed in the 1980s with no authentication at all: any answer that arrives looking plausible gets trusted. Cache poisoning, DNSSEC, and DoH/DoT all trace back to that one original gap.</p>

## Record types and the parameters that actually matter for security

A quick reference first — most DNS security problems trace back to one of these records being misconfigured, over-trusted, or left dangling:

| Record | Purpose | Security-relevant parameters | Example | What it means |
|---|---|---|---|---|
| **A / AAAA** | Hostname → IPv4 / IPv6 address | The core mapping everything else depends on | `nist.gov. → 172.65.90.25` | Straight hostname-to-IP lookup — no other field to interpret |
| **CNAME** | Alias → another hostname (canonical name) | Cannot coexist with other records at the same name — and is the record type behind almost every subdomain takeover (see below) | `www.github.com. → github.com.` | `www` isn't a separate server — it's just another name for `github.com`, resolved again from there |
| **MX** | Which servers accept mail for the domain | **Priority** — lower number is preferred; multiple MX records give mail delivery redundancy | `0 nist-gov.mail.protection.outlook.com.` | The leading `0` is the priority — mail is tried there first; a second MX with priority `10` would only be used if the first is unreachable |
| **NS** | Delegates a zone to a set of authoritative nameservers | Delegating to the wrong or a decommissioned nameserver is its own takeover vector, one level up from CNAME | `nist.gov. → gold.foundationdns.com.` | This server (and its siblings) is who the rest of the internet asks for anything under `nist.gov` |
| **SOA** | Zone metadata — serial number, refresh/retry/expire timers | The **serial number** is how secondary nameservers know a zone has changed and needs re-syncing | `gold.foundationdns.com. dns.cloudflare.com. 2410408099 10000 2400 604800 1800` | In order: primary nameserver, admin mailbox (`dns.cloudflare.com` = `dns@cloudflare.com`), serial `2410408099`, then refresh/retry/expire/minimum-TTL in seconds |
| **TXT** | Arbitrary text — used for SPF, DKIM, DMARC, and domain-ownership verification | Security-critical despite being "just text"; see SPF/DMARC below | `"v=spf1 include:_spf.google.com ~all"` | Not a comment field — this specific line is a live authorization rule for which servers may send mail as this domain |
| **CAA** | Restricts which Certificate Authorities may issue certificates for the domain | Directly enforced by CAs at issuance time — see [Certificates]({{ '/topics/certificates/' | relative_url }}) | `0 issue "letsencrypt.org"` | Only Let's Encrypt (or whichever CAs have their own `issue` line) is permitted to issue a certificate for this domain at all |
| **SRV** | Service location (host + port) for a named service | Has both **priority** and **weight** parameters for load balancing between multiple targets | `30 30 5222 scarlet.jabber.org.` | In order: priority `30`, weight `30` (both used to pick between multiple SRV records), port `5222`, target host |
| **PTR** | Reverse lookup — IP address → hostname | Mismatched forward/reverse DNS is a common mail-deliverability and anti-spoofing signal | `8.8.8.8 → dns.google.` | The reverse direction of an A record — given the IP, this is the hostname it claims to belong to |

Real examples, pulled live — one query per record type in the table above:

```
$ dig A nist.gov +short
172.65.90.25
172.65.90.24
172.65.90.27
172.65.90.26

$ dig AAAA google.com +short
2404:6800:4003:c02::71
2404:6800:4003:c02::8a

$ dig CNAME www.github.com +short
github.com.

$ dig MX nist.gov +short
0 nist-gov.mail.protection.outlook.com.

$ dig NS nist.gov +short
gold.foundationdns.com.
gold.foundationdns.net.
gold.foundationdns.org.

$ dig SOA nist.gov +short
gold.foundationdns.com. dns.cloudflare.com. 2410408099 10000 2400 604800 1800

$ dig SRV _xmpp-client._tcp.jabber.org +short
30 30 5222 scarlet.jabber.org.

$ dig -x 8.8.8.8 +short
dns.google.

$ dig CAA github.com +short
0 issue "sectigo.com"
0 issuewild "digicert.com"
0 issuewild "letsencrypt.org"
0 issue "digicert.com"
0 issue "globalsign.com"
0 issue "letsencrypt.org"

$ dig TXT github.com +short | grep spf
"v=spf1 ip4:192.30.252.0/22 include:spf.protection.outlook.com include:_netblocks.google.com
 include:_netblocks2.google.com include:mail.zendesk.com include:_spf.salesforce.com
 include:servers.mcsv.net include:mktomail.com include:sendgrid.net ... ~all"

$ dig TXT _dmarc.github.com +short
"v=DMARC1; p=quarantine; sp=reject; pct=100; rua=mailto:dmarc@github.com; ruf=mailto:dmarc@github.com"
```

The SOA fields, in order, are worth decoding once: primary nameserver, responsible-party mailbox (`dns.cloudflare.com` here means `dns@cloudflare.com`), then **serial** (`2410408099`, incremented on every zone change so secondaries know to re-sync), **refresh** (how often secondaries check for updates, in seconds), **retry** (how soon to retry after a failed refresh), **expire** (how long a secondary keeps serving stale data before giving up entirely), and **minimum** (the negative-caching TTL — how long a "this record doesn't exist" answer is cached).

That CAA record is a real, enforced control: it tells every CA in the world that only Sectigo, DigiCert, Let's Encrypt, and GlobalSign are allowed to issue a certificate for `github.com` at all — any other CA is required to refuse the request, closing off a meaningful slice of the [mis-issuance problem]({{ '/topics/certificate-transparency/' | relative_url }}#the-problem-ct-was-built-to-solve) CT also defends against. The SPF record is doing something worth noticing too: it explicitly authorizes `_spf.salesforce.com` as a legitimate sender of mail on GitHub's behalf — which is exactly the kind of enterprise SaaS delegation that goes wrong if it isn't cleaned up later.

## Why an unauthenticated phone book is a problem

A DNS resolver asks "what's the IP for `bank.com`?" over plain UDP, and accepts whichever reply arrives first that looks like a valid match — there's nothing in the original protocol confirming the reply actually came from the real authoritative server. An attacker who can guess or inject a matching reply first can redirect any victim relying on that resolver anywhere they like, with no certificate, browser warning, or visible sign anything is wrong — the browser will happily load `https://` on the wrong IP if that IP is also under the attacker's control, or simply intercept plain HTTP entirely.

**DNS cache poisoning** (or spoofing) is exactly this: injecting a forged answer into a resolver's cache so it serves the attacker's answer to every subsequent asker, not just the original victim. The 2008 **Kaminsky attack** made this dramatically easier by exploiting weak randomization in query IDs and source ports, and by targeting an entire zone's *nameserver* record instead of one hostname at a time — a single successful poisoning could redirect an unlimited number of subdomains. It triggered a coordinated, multi-vendor emergency patch across virtually every DNS software vendor simultaneously.

## DNSSEC: the same chain-of-trust idea, applied to DNS

**DNSSEC** fixes the authentication gap by having each level of the DNS hierarchy cryptographically sign the level below it — a structure that should look immediately familiar:

<div class="diagram-frame">
  <img src="{{ '/assets/img/dnssec-chain.svg' | relative_url }}" alt="Diagram showing the DNSSEC chain of trust: the DNS root zone's DNSKEY is the trust anchor built into every resolver, it signs a DS record for the .gov TLD, which signs a DS record for nist.gov, whose RRSIG signs the actual DNS records returned to a query." >
  <p class="diagram-caption">Root → TLD → domain — the same tree shape as the CA hierarchy, rooted in a trust anchor instead of a browser trust store</p>
</div>

This is structurally the same idea as [Certificate Authorities & Certificates]({{ '/topics/certificates/' | relative_url }}#certificate-authority-ca-types): a **DS (Delegation Signer)** record is the DNS equivalent of an intermediate CA's certificate, an **RRSIG** is the DNS equivalent of a CA's signature over a leaf certificate, and the root zone's key — physically held across multiple trusted parties worldwide in a highly ceremonial key-signing process — plays the same role a root CA does, except there's exactly one DNS root instead of hundreds of root CAs.

## Seeing it live: one domain with DNSSEC, one without

```
$ dig DNSKEY nist.gov +short
257 3 8 AwEAAeaJ7qqumy0GJV00pMwozYZ+2Fj+VxfbCzjLL428MHvSceglIf6o...
256 3 8 AwEAAeNZU6cdEr+o3lMoluay4XV/dgC/a/p6/RQCgKbzPe1S6DCa4N6m...

$ dig DS nist.gov +short
33751 8 2 90C6CD28626CA7B8E3A1FACAD58D20D486E52DF040B9B2F085ACD5C703E624C6

$ dig +dnssec nist.gov A +noall +answer
nist.gov.  128  IN  A      172.65.90.26
nist.gov.  128  IN  A      172.65.90.25
nist.gov.  128  IN  A      172.65.90.27
nist.gov.  128  IN  A      172.65.90.24
nist.gov.  128  IN  RRSIG  A 8 2 300 20260726130838 20260724110838 18303 nist.gov. H5dIY8Tt...
```

Real DNSKEY, DS, and RRSIG records — NIST signs its own DNS answers. Compare that to a domain without DNSSEC deployed:

```
$ dig DNSKEY github.com +short
(no output — no DNSSEC key published)

$ dig +dnssec github.com A +noall +answer
github.com.  24  IN  A  20.205.243.166
```

No `RRSIG`, no signature, nothing to validate — a resolver has to simply trust that this answer wasn't forged in transit, the exact gap DNSSEC exists to close.

## Is DNSSEC enabled per record, or for the whole zone?

A natural question given the signed `A` record above: does an operator opt in per record type, or is it all-or-nothing for the domain? It's zone-wide as a practical matter — there's no control that says "sign A records but leave MX unsigned." Turning on DNSSEC means the zone's signer starts producing a signature for every **RRset** (all records sharing the same name and type) in that zone going forward. The signing mechanism itself does operate one RRset at a time — each record type at each name gets its own independent RRSIG, not one blanket signature over the whole domain — but in practice a domain owner enables or disables the feature once, for everything the zone serves.

Real proof, pulled from `nist.gov` — three more record types beyond the `A` record already shown above, each carrying its own independent signature:

```
$ dig +dnssec nist.gov MX +noall +answer
nist.gov.  288  IN  MX     0 nist-gov.mail.protection.outlook.com.
nist.gov.  288  IN  RRSIG  MX 8 2 300 20260727034311 20260725014311 18303 nist.gov. fxbwhJrBqt3V...

$ dig +dnssec nist.gov NS +noall +answer
nist.gov.  86388  IN  NS     gold.foundationdns.com.
nist.gov.  86388  IN  NS     gold.foundationdns.net.
nist.gov.  86388  IN  NS     gold.foundationdns.org.
nist.gov.  86388  IN  RRSIG  NS 8 2 86400 20260727034311 20260725014311 18303 nist.gov. HVjWr/Xhux8h...

$ dig +dnssec nist.gov TXT +noall +answer
nist.gov.  300  IN  TXT    "v=spf1 include:_spf1.nist.gov include:_spf2.nist.gov -all"
nist.gov.  300  IN  TXT    "google-site-verification=oJSFVUoM3RN44bzuiI9F3qWzWxTqmrawzMycAD_NUcY"
nist.gov.  300  IN  TXT    ... (several more TXT records, each covered by the same signature)
nist.gov.  300  IN  RRSIG  TXT 8 2 300 20260727034323 20260725014323 18303 nist.gov. W9PWP4TMGZwR...
```

A, MX, NS, and TXT all validate independently under the same zone. The practical takeaway: once DNSSEC is turned on for `nist.gov`, every record type at every name in that zone gets signed as a side effect of the zone being signed at all — an operator can't selectively protect just their MX records while leaving A records unsigned, and conversely can't accidentally sign one record type without the rest. Because one key effectively covers the whole zone, a single key-management mistake risks the whole zone, not just one record type.

## Why doesn't a site like github.com use DNSSEC — and what's the actual risk?

Worth asking directly, since the comparison above singles GitHub out: is this a GitHub-specific gap? Checking a few other major web properties the same way says no — none of them publish a `DNSKEY` either:

```
$ for d in google.com github.com amazon.com facebook.com; do dig DNSKEY $d +short; done
(no output for any of them)
```

This is a genuinely industry-wide pattern, not negligence specific to one company. [APNIC's own research into DNSSEC adoption](https://blog.apnic.net/2017/12/06/dnssec-deployment-remains-low/) found the real barriers are operational, not a lack of awareness: only a minority of major registrars fully support DNSSEC for their own nameservers, a meaningful share of domain owners who do attempt it (APNIC measured roughly 40% among Cloudflare-hosted domains) never successfully complete the DS-record handoff to their registrar, and some registrars charge extra for it while others include it free — producing wildly different real-world adoption rates for the same feature.

The deeper reason is a specific, well-documented failure mode: DNSSEC doesn't degrade gracefully. A misconfigured zone — most commonly a botched **key rollover** — doesn't just weaken protection, it causes every DNSSEC-validating resolver on the internet to return SERVFAIL for the entire domain: an outright outage, not a fallback to "unsigned but reachable." This isn't theoretical. On 5 May 2026, a software bug in the .de registry's own signing system produced invalid DNSSEC signatures during a routine key rollover, and every validating resolver worldwide — including Google Public DNS and Cloudflare's own 1.1.1.1 — began rejecting every `.de` domain as unverifiable. Amazon.de, Deutsche Bahn's ticketing system, the N26 banking app, and numerous German government portals were unreachable for roughly three hours, [as DENIC's own post-incident report describes](https://blog.denic.de/en/final-report-dns-outage-of-5-may-2026/) — one zone's cryptographic housekeeping error taking down a national-level chunk of the internet, for every visitor, everywhere, simultaneously.

That risk — trading "vulnerable to an active, comparatively rare MITM cache-poisoning attack" for "one signing mistake takes the whole domain offline for every user on Earth" — is a real, defensible engineering tradeoff for an operator serving traffic at GitHub's scale, not simply an oversight. The mitigations available to an operator who skips DNSSEC for exactly this reason are narrower and don't fully substitute for it, but they do reduce the same underlying risk from other angles:

- **Source port and query ID randomization** — the direct, DNSSEC-independent fix for the original Kaminsky-class poisoning attack, now standard in every modern resolver.
- **DoH/DoT** — doesn't stop a forged answer, but removes the easiest observation point (a plaintext network path) an attacker would use to time a convincing spoofed reply.
- **CAA records** (covered in the record-type table above) — even if a resolver were successfully tricked, CAA still requires any CA issuing a certificate for the domain to check the same restriction, limiting what a successful DNS spoof alone can actually get an attacker.
- **Certificate Transparency monitoring** (covered under [Certificate Transparency]({{ '/topics/certificate-transparency/' | relative_url }})) — catches a fraudulently-issued certificate quickly even if DNS itself was briefly compromised.

None of these close the authentication gap the way DNSSEC actually would — they reduce the blast radius of the same threat from adjacent angles instead. That's the honest tradeoff large operators are making here, not an oversight to be corrected.

## DNSSEC does not encrypt your DNS queries

This is the single most common DNS misconception, worth stating plainly: **DNSSEC provides authenticity and integrity — it does not provide confidentiality.** Every query and RRSIG above still traveled in plaintext; anyone on the network path could read exactly which domains were being looked up, DNSSEC or not.

Encrypting the query itself is a separate, unrelated mechanism:

| | DNSSEC | DoH / DoT |
|---|---|---|
| Problem solved | Is this DNS answer authentic and untampered? | Can anyone on the network see what I'm looking up? |
| Mechanism | Signature chain (RRSIG/DNSKEY/DS) | TLS-encrypted transport for the query/response |
| RFC | [RFC 4033](https://www.rfc-editor.org/rfc/rfc4033)–[4035](https://www.rfc-editor.org/rfc/rfc4035) | DoH: [RFC 8484](https://www.rfc-editor.org/rfc/rfc8484) · DoT: [RFC 7858](https://www.rfc-editor.org/rfc/rfc7858) |
| Protects against | Cache poisoning, forged answers | Network eavesdropping, ISP-level query logging/blocking |

**DoH (DNS over HTTPS)** tunnels DNS queries inside a normal HTTPS connection (indistinguishable from other web traffic, which is itself sometimes controversial since it can bypass network-level DNS filtering). **DoT (DNS over TLS)** does the same over a dedicated TLS connection on its own port (853), easier to identify and firewall separately from web traffic if that's desired. Both rely on exactly the same [TLS handshake]({{ '/topics/tls-ssl-handshake/' | relative_url }}) — nothing new cryptographically, just DNS riding inside it.

A fully protected resolution uses both together: DNSSEC to know the answer wasn't forged, DoH/DoT so nobody in between can read (or quietly tamper with) the question being asked.

## Business case: enterprise SaaS domain delegation, and what's left behind

This exact CNAME-delegation pattern shows up constantly in real enterprise deployments, and it's worth walking through concretely because the risk only appears *later*, well after the original setup is forgotten.

**The setup.** Enterprises adopting Salesforce Marketing Cloud are asked, as a documented part of onboarding, to delegate several subdomains to Salesforce via CNAME through what Salesforce calls a [**Sender Authentication Package (SAP)**](https://help.salesforce.com/s/articleView?id=sf.mc_es_sender_authentication_package.htm&type=5) — this is a real, current, officially-documented requirement. Two distinct kinds of record get delegated, and they carry two genuinely different risks:

- **Tracking/image links** (e.g. `email.company.com`, `images.company.com`) — served from the company's own branded domain instead of a generic Salesforce one, for deliverability and to make the email look like it actually came from the company.
- **A DKIM selector** (e.g. `sfmc._domainkey.company.com`) — CNAMEd to a record Salesforce controls, so receiving mail servers can verify Salesforce's cryptographic signature on outgoing mail as legitimately authorized by `company.com`.

**Why this is a reasonable ask.** Mail providers and spam filters trust a company's own domain more than an unrelated SaaS vendor's, and DKIM specifically needs *some* record published under the company's domain for the signature to mean anything. CNAME-delegating the selector (instead of pasting a static public-key TXT record) is also a real operational convenience: when Salesforce rotates its signing key — which any well-run mail platform does periodically — the customer's DNS follows automatically, with nothing to update on their end. Both of these are genuine, defensible reasons; this isn't a vendor being careless.

**Where the risk actually enters — and it's two different mechanisms, not one.**

DKIM works by having the sender hold a **private key** it signs outgoing mail with, while the corresponding **public key** sits in DNS for any receiving server to check the signature against — DNS itself never signs anything, it only publishes the public half. Delegating the selector via CNAME means Salesforce's mail infrastructure holds that private key and can produce a valid, DKIM-passing signature as `company.com` for as long as the CNAME keeps pointing at Salesforce's published key — a standing signing capability that has nothing to do with whether the Marketing Cloud subscription itself is still active. If the company migrates off Salesforce, changes vendors, or lets the account lapse and simply forgets to pull the DKIM CNAME, Salesforce's infrastructure retains the practical ability to send mail that authenticates as `company.com` indefinitely — no "claiming" of anything required, unlike the risk below. Removing or rotating that specific delegation has to be an explicit, deliberate step of offboarding, not something that happens on its own just because the account is closed.

The tracking/image CNAMEs carry the *other*, more commonly-discussed risk: the CNAME record and the Salesforce-side resource it points to are two separate things, provisioned and deprovisioned independently. If that link is forgotten after offboarding, the CNAME keeps resolving, but the resource it points to on the vendor's side is now unclaimed — and many SaaS platforms let a *new*, unrelated customer register that same custom domain against their own tenant with only DNS presence as proof of "ownership." Whoever does that first now effectively controls what `email.company.com` serves, with the company's own domain reputation attached to it. This is the well-documented **dangling DNS / subdomain takeover** class of vulnerability, not specific to Salesforce — the community-maintained [**"Can I take over XYZ?"**](https://github.com/EdOverflow/can-i-take-over-xyz) reference catalogs dozens of platforms sharing the identical exploitable shape: a CNAME left pointing at a deprovisioned resource that a new tenant can then claim. Unlike the DKIM case, this one *does* require someone to actively go claim the abandoned target — it's a race against whoever notices first, not a standing capability the original vendor already holds.

### The same ask, from other SaaS vendors

Salesforce isn't unusual here — "point a branded subdomain at us via CNAME" is close to standard practice across marketing and communications SaaS:

- **SendGrid** (Twilio) asks customers enabling its ["Automated Security" domain authentication](https://www.twilio.com/docs/sendgrid/ui/account-and-settings/how-to-set-up-domain-authentication) to delegate a subdomain like `em1234.company.com` via CNAME back to SendGrid, which then auto-manages SPF, a rotating DKIM key, and an MX record underneath it.
- **HubSpot** asks marketing customers to [connect an email-sending domain](https://knowledge.hubspot.com/domains-and-urls/connect-your-email-sending-domain) the same way — CNAME records pointing subdomains at HubSpot-controlled targets for DKIM and link tracking.

An illustrative (not any real customer's) example of what this looks like once several of these accumulate on one domain over a few years:

```
email.company.com.       CNAME   sendgrid.net.
em9821.company.com.      CNAME   u9821.wl123.sendgrid.net.
hs-email.company.com.    CNAME   hubspot123456.hs-sites.com.
tracking.company.com.    CNAME   mkto-ab123456.mktoweb.com.
```

Four vendors, four CNAMEs, four separate offboarding steps required later — and every one of them keeps resolving indefinitely unless someone deliberately deletes it, whether or not the underlying vendor account is still active.

### Controls that actually reduce this risk

- **Revoke or rotate DKIM delegations as an explicit offboarding step, not an afterthought.** This one doesn't show up in a dangling-record scan — the vendor's infrastructure is still live and still answering, so nothing looks "broken." The only fix is deliberately removing or repointing the selector CNAME the moment the vendor relationship ends, and checking DMARC aggregate reports afterward for any mail still passing DKIM under a selector that shouldn't exist anymore.
- **Treat DNS as tracked inventory, not a one-way setup step** — every CNAME delegating to a third party should have a named owner and an expected lifetime tied to that vendor relationship, checked as part of vendor offboarding, not discovered by accident.
- **Prefer one-time TXT verification over a standing CNAME, wherever the vendor supports it.** Some providers only need DNS presence *once*, to prove domain ownership, rather than an indefinitely-live delegation. `nist.gov`'s own real DNS already shows this pattern in practice — one domain simultaneously carrying one-time ownership tokens from six unrelated vendors, none of which create an ongoing dangling-resource risk the way a live CNAME does:
  ```
  $ dig TXT nist.gov +short
  "google-site-verification=oJSFVUoM3RN44bzuiI9F3qWzWxTqmrawzMycAD_NUcY"
  "atlassian-domain-verification=xVa84aCbqa1pJZZdpB0gGm0ZNukDUU4TBzccNbFkyozIg3QXHaufaQaczvEDG3Jp"
  "box-domain-verification=4d49553685eee3edbcf58b736eb4c42febff4e1741da8db3098f2bb3d161d90f"
  "cisco-ci-domain-verification=1b1e68d4cf0e84478115596723f00e17a848c659bb11f53b58f8f2cd84b7e111"
  "jamf-site-verification=Sr15KQEdTRZZXqaxbFaFQw"
  "openai-domain-verification=dv-LH2I25vAcFPzjYDPYCU2t6Uy"
  ```
  A stale TXT token like these is inert once the vendor relationship ends — there's no live resource anywhere for a new tenant to claim by matching it. A stale CNAME, by contrast, is a standing invitation.
- **Scan for dangling records automatically**, rather than relying on someone remembering. [dnsReaper](https://github.com/punk-security/dnsReaper) and similar open-source tools fetch a domain's DNS records directly from major providers (AWS, Azure, Cloudflare, GoDaddy, Google Cloud) and test each one against dozens of known takeover signatures in seconds.
- **Monitor Certificate Transparency logs** ([covered separately]({{ '/topics/certificate-transparency/' | relative_url }})) for certificates suddenly being issued for subdomains that shouldn't have active certificates — often the first visible sign someone has claimed an abandoned one.

<div class="callout warn">
  <span class="callout-title">The lesson generalizes</span>
  <p>Any enterprise integration that asks you to point a subdomain at a third party creates a standing liability that outlives the integration itself — sometimes as a resource someone else can later claim, sometimes as a trust delegation the original vendor simply keeps holding. The fix isn't "don't delegate domains" — it's treating DNS records as inventory: tracked, owned, and explicitly removed as a required step of vendor offboarding, not an afterthought nobody remembers six months later.</p>
</div>

## Common pitfalls

- **Assuming DNSSEC means "encrypted DNS"** — it doesn't; see the table above.
- **Enabling DNSSEC without automated key-rollover tooling** — see the .de outage above; a manual or buggy rollover doesn't degrade gracefully, it takes the entire zone offline for every validating resolver simultaneously.
- **Not validating DNSSEC signatures at the resolver** — publishing signed records does nothing if the resolver asking the question never checks them; validation has to happen on the querying side.
- **DNS rebinding** — a malicious page's domain resolves to an attacker's server during initial page load, then the DNS answer is changed to point at an internal address (e.g. `127.0.0.1` or an internal service) with a very short TTL, letting client-side code make requests that appear to originate from the browser but actually reach internal infrastructure.
- **Dangling CNAMEs left after vendor offboarding** — see the business case above; this is the single most common real-world path to subdomain takeover, precisely because it requires someone to remember a cleanup step with no immediate consequence for skipping it.
- **Treating DNS as a trust boundary for security decisions** — e.g., allow-listing requests "from `internal.company.com`" based on the hostname resolving correctly is only as strong as the DNS infrastructure behind it.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.rfc-editor.org/rfc/rfc4033">RFC 4033</a>, <a href="https://www.rfc-editor.org/rfc/rfc4034">4034</a>, <a href="https://www.rfc-editor.org/rfc/rfc4035">4035</a></strong> define DNSSEC. <strong><a href="https://www.rfc-editor.org/rfc/rfc8484">RFC 8484</a></strong> defines DoH. <strong><a href="https://www.rfc-editor.org/rfc/rfc7858">RFC 7858</a></strong> defines DoT. The Kaminsky vulnerability is documented as <a href="https://www.kb.cert.org/vuls/id/800113">CERT/CC VU#800113</a>. <a href="https://blog.apnic.net/2017/12/06/dnssec-deployment-remains-low/">APNIC's analysis of low DNSSEC deployment</a> and <a href="https://blog.denic.de/en/final-report-dns-outage-of-5-may-2026/">DENIC's own report on the May 2026 .de outage</a> cover the operational-risk tradeoff discussed above. The <a href="https://cheatsheetseries.owasp.org/cheatsheets/Subdomain_Takeover_Prevention_Cheat_Sheet.html">OWASP Subdomain Takeover Prevention Cheat Sheet</a> and the <a href="https://github.com/EdOverflow/can-i-take-over-xyz">"Can I take over XYZ?"</a> reference cover the dangling-DNS risk class in the business case above in full.</p>
</div>

## Where this fits

DNSSEC's chain of trust is the same structural idea as [Certificate Authorities & Certificates]({{ '/topics/certificates/' | relative_url }}), and DoH/DoT are just the [TLS handshake]({{ '/topics/tls-ssl-handshake/' | relative_url }}) applied to a new kind of traffic. Nothing here is a new primitive — it's the same signature-chain and encrypted-transport ideas, solving the same two problems (authenticity, confidentiality) one layer further down the stack than TLS operates at.
