---
title: Certificate Authorities & Certificates
description: CA hierarchy, chain of trust, validation levels, certificate types by use, formats, and revocation.
permalink: /topics/certificates/
last_verified: 2026-08-05
---

<span class="eyebrow">Cryptography / Public Key Infrastructure</span>

# Certificate Authorities & Certificates

<p class="lede">My starting problem is simple: a public key says nothing about whose key it is. An X.509 certificate binds that key to names or other claims under an issuer's policy. The strength of the claim depends on what the issuer actually validated—domain control is not the same as a verified legal identity.</p>

## By use case

- First pass: [why certificates exist](#why-certificates-exist), [certificate fields](#anatomy-of-an-x509-certificate), and [the CA hierarchy](#certificate-authority-ca-types).
- When operating a CA: [the Smallstep walkthrough](#try-it-yourself-building-a-mini-ca-with-step-ca) and [chain validation](#chain-of-trust).
- When running production TLS: [formats](#formats-and-encodings), [lifecycle and revocation](#certificate-lifecycle), and [Certificate Transparency](#certificate-transparency-ct).

## Quick primer: symmetric vs asymmetric keys

The short version, since everything past this point leans on it: symmetric cryptography uses shared secret key material, while asymmetric cryptography uses a mathematically linked private/public key pair. The dedicated [Symmetric Cryptography]({{ '/topics/symmetric-cryptography/' | relative_url }}) and [Asymmetric Cryptography]({{ '/topics/asymmetric-cryptography/' | relative_url }}) pages explain the limits.

- **Symmetric** — one key, shared by both sides, does both locking and unlocking (AES is the common example). Fast, but only works once both sides already have the same key — which is its own unsolved problem.
- **Asymmetric** — a key pair with operations determined by the scheme: RSA can support encryption or signatures, ECDSA and EdDSA are signature schemes, and ECDH is key agreement. The public key can be distributed, but its owner and permitted use still need authentication.

Certificates are fundamentally about the second kind — binding a public key to an identity so asymmetric crypto can be trusted at scale.

## Why certificates exist

Asymmetric cryptography lets parties work without a pre-shared secret, but I still need to authenticate the public key. Otherwise an attacker can substitute a different key while claiming it belongs to `example.com`.

A certificate answers that by having a **Certificate Authority (CA)** sign a statement containing a public key, names or other claims, a validity period, and constraints. For a domain-validated TLS certificate, the core claim is that the applicant demonstrated control of the domain under the CA's procedure. It is not a general statement that the CA verified the website owner's real-world identity.

This is the core of **X.509**, the standard format used for TLS, code signing, email, and most other certificate types in use today.

## What is Public Key Infrastructure (PKI)?

**Public Key Infrastructure (PKI)** is the overarching system of hardware, software, security policies, data standards, and procedures required to create, manage, distribute, store, and revoke digital certificates.

While a **Certificate Authority (CA)** is the specific component that signs certificates, **PKI** encompasses the entire framework that makes digital identity and encryption trustworthy across global networks.

### My working map of PKI components

There is no canonical rule that PKI has exactly six components. This is simply how I group the moving parts for study:

| Component | Function & Responsibilities |
|---|---|
| **Certificate Authority (CA)** | The trusted engine that verifies identity claims and cryptographically signs digital certificates using its private key. |
| **Registration Authority (RA)** | The front-end validation layer that vets identity credentials (domain ownership, corporate documentation) before instructing the CA to issue a certificate. |
| **Certificate Store / Trust Store** | Local repositories pre-installed in operating systems (Windows, macOS, Linux) and web browsers containing trusted Root CA certificates. |
| **Certificate Database & CT Logs** | Databases storing issued certificates, serial numbers, audit trails, and publicly verifiable append-only Certificate Transparency (CT) logs. |
| **Revocation Infrastructure** | The network services (CRL distribution points, OCSP responders, and OCSP Stapling) that broadcast invalidated certificates. |
| **Key Management & Security Policies** | Formal guidelines (CP/CPS) governing key pair generation, Hardware Security Module (HSM) key storage, lifecycle rotation, and disaster recovery. |

### Which security properties PKI supports

- **Authenticity (binding under a policy):** The CA's signature lets a relying party verify that the certificate contents were issued under that CA's policy. For DV TLS, this normally means verified domain control.
- **Integrity (change detection):** The CA signature covers the certificate fields. Changing those fields makes signature validation fail.
- **Confidentiality (indirect support):** PKI authenticates keys used by a secure-channel protocol such as TLS. Confidentiality comes from the protocol's key agreement and record encryption, not from the certificate itself.
- **Evidence and accountability:** Signatures can bind content to a certificate key. Legal or organizational attribution also depends on identity proofing, private-key custody, signing procedures, audit evidence, and applicable law.

## Anatomy of an X.509 certificate

| Field | Purpose |
|---|---|
| Version | X.509 version (almost always v3 today — needed for extensions) |
| Serial Number | Unique ID assigned by the issuing CA, used for revocation lookups |
| Signature Algorithm | Algorithm the CA used to sign the certificate (e.g. `sha256WithRSAEncryption`, `ecdsa-with-SHA384`) |
| Issuer | The CA (or intermediate) that signed this certificate |
| Validity | `Not Before` / `Not After` dates |
| Subject | The identity the certificate is issued to |
| Subject Public Key Info | The public key being certified, plus its algorithm |
| Subject Alternative Name (SAN) | Additional identities covered — extra domains, IPs, or emails (modern browsers require SAN for hostname checks, not the Subject CN) |
| Key Usage | What the key may cryptographically be used for (e.g. digital signature, key encipherment) |
| Extended Key Usage (EKU) | What role the certificate plays (e.g. `serverAuth`, `clientAuth`, `codeSigning`, `emailProtection`) |
| Basic Constraints | Whether this certificate can act as a CA (`CA:TRUE`) and, if so, its path length |
| Authority Key Identifier | Points back to the issuing CA's key, used to build the chain |
| CA's Signature | The CA's signature over all of the above |

## What algorithms actually sign these certificates

Both the certificate's own key and the CA's signature over it rely on an underlying algorithm — and not all of them are still considered safe. Two separate things are being chosen here:

1. **The key algorithm** — what kind of key pair the certificate's Subject Public Key actually is.
2. **The signature algorithm** — what the *issuing CA* used to sign it (visible as `sha256WithRSAEncryption`, `ecdsa-with-SHA384`, etc. in the table above), which itself combines a signing algorithm with a hash function.

| Algorithm | Status | Notes |
|---|---|---|
| MD5 | **Broken** — never use | Collisions are practical; the Flame malware (2012) forged a Microsoft code-signing certificate by exploiting this |
| SHA-1 (signatures) | **Broken / deprecated** | Practical collisions demonstrated in 2017; disallowed for digital signature generation by NIST since 2013 |
| RSA, key < 2048 bits | **Deprecated / disallowed for new public TLS issuance** | Insufficient security margin under current policy; “cheap to factor” is not an accurate general description of RSA-1024 |
| RSA-2048 | Acceptable under current final NIST transition guidance | ~112-bit security strength; plan migration according to the data lifetime and the final guidance in force |
| RSA-3072 / RSA-4096 | Stronger RSA options | ~128-bit / ~150-bit security strength; larger keys and signatures than ECC at similar strength |
| ECDSA P-256 | Widely used, acceptable | ~128-bit security strength; smaller and faster than RSA at equivalent strength |
| ECDSA P-384 / Ed25519 | Approved signature options | ~192-bit strength for P-384 and ~128-bit for Ed25519; protocol and certificate-ecosystem support must be checked |

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final">NIST SP 800-57 Part 1 Rev. 5</a></strong> maps key sizes to security strength. RSA-2048 is approximately 112-bit strength; P-256 is approximately 128-bit strength and therefore is not “flagged for retirement” by a 128-bit planning target. <strong><a href="https://csrc.nist.gov/pubs/sp/800/131/a/r2/final">NIST SP 800-131A Rev. 2</a></strong> remains the final transition publication; Rev. 3 is currently a draft. <strong><a href="https://csrc.nist.gov/pubs/fips/186-5/final">FIPS 186-5</a></strong> defines approved RSA, ECDSA, and EdDSA signature schemes.</p>
</div>

Tooling still matters. The current `step certificate create` command restricts RSA keys to a minimum of 2048 bits and does not expose MD5 as a certificate-signature choice. I should confirm actual CLI constraints instead of assuming every low-level algorithm can be selected.

## Certificate Authority (CA) types

There is a hierarchy because validation must eventually reach a configured trust anchor. A public CA may operate a shared intermediate for many unrelated subscribers, or a dedicated intermediate for one customer, product, geography, policy, or certificate type. The diagram shows the shared-intermediate case, not a universal rule.

<div class="diagram-frame">
  <img src="{{ '/assets/img/ca-hierarchy.svg' | relative_url }}" alt="Diagram showing a Root CA at the top, signing one Intermediate CA below it, which in turn signs leaf certificates for three completely unrelated businesses: a.com, example.com, and shop.net.">
  <p class="diagram-caption">One root, one intermediate, many unrelated customers underneath</p>
</div>

`a.com` and `example.com` in the diagram do not need to be related; they can receive certificates from the same intermediate CA. A root name such as “DigiCert Global Root G2” or “ISRG Root X1” identifies the trust anchor, not the set of domains beneath it.

### Root CA

The trust anchor. Root CAs are self-signed and their public certificates are distributed through operating-system or browser trust stores. Compromising a publicly trusted root can enable fraudulent certificate chains within that root's permitted scope, so root private keys are normally kept offline in [hardware security modules]({{ '/topics/hsm-kms/' | relative_url }}) and used mainly to sign or revoke intermediate CAs.

### Intermediate (Subordinate) CA

A CA whose certificate is signed by a root (or by another intermediate), used to actually issue end-entity certificates day to day. This indirection is deliberate:

- If an intermediate is ever compromised, it can be revoked without invalidating the root or every other intermediate under it.
- The root stays offline almost permanently, minimizing its exposure.

Public TLS leaf certificates are normally issued by an intermediate rather than directly by a root, keeping the root key offline or tightly controlled.

### Leaf (end-entity) certificate

This is the one I left out earlier when I first mapped out CA types — worth calling out properly, because it's the certificate everyone actually deals with day to day.

A leaf certificate (also called an **end-entity certificate**) is issued to a website, person, device, or application rather than another CA. It cannot act as a CA. Basic Constraints may explicitly say `CA:FALSE`; under RFC 5280, an absent extension also means the certificate is not a CA. Certification-path validation additionally checks key usage, constraints, and the issuer chain.

So when someone says "example.com's certificate," they mean its leaf certificate — the one containing example.com's actual public key. Root and Intermediate CAs exist purely to vouch for it.

### Public CA

A CA whose root is trusted by default in major operating systems and browsers (DigiCert, Let's Encrypt, Sectigo, Google Trust Services, etc.). Getting a root into these trust stores requires passing independent audits (WebTrust / ETSI) and following the CA/Browser Forum's Baseline Requirements. This is what makes a certificate from a public CA trusted "out of the box" anywhere.

### Private (Internal) CA

A CA an organization runs for itself — for internal services, VPNs, device fleets, or service-to-service mTLS. Its root is not trusted by default anywhere; it has to be manually distributed and installed into the trust stores of every client that needs to trust it. Common tooling: an internal `step-ca` or HashiCorp Vault PKI instance, or on-prem Microsoft AD CS.

- Pro: full control, no per-certificate cost, can issue very short-lived certs freely.
- Con: trusted only where I have deployed the root; it does not work for arbitrary public clients that use their existing trust stores.

### Public vs private CA, side by side

The two get conflated, but the decision of which to use is really just "who else needs to trust this certificate?":

| | Public CA | Private CA |
|---|---|---|
| Trusted by default? | Yes — root ships in OS/browser trust stores | No — the root must be manually installed on every trusting client |
| Typical use case | Public websites, anything a customer's browser or a stranger's device connects to | Internal services, VPNs, service-to-service mTLS, device fleets you control |
| Cost | Free (Let's Encrypt, ZeroSSL) to paid, per-cert or per-year | Free to run (step-ca, Vault PKI) or licensed (Microsoft AD CS), no per-cert fee |
| Validation required | Domain/organization checks enforced by CA/Browser Forum rules | The identity and authorization policy I define and enforce |
| Governance | Audited under WebTrust/ETSI schemes and bound to Baseline Requirements | My organization's responsibility unless another assurance regime applies |
| Certificate lifetime | Capped by browser and CA policy (see [Revocation](#revocation-crl-and-ocsp)) | Set by internal policy; short-lived certificates are practical with automation |
| Example tooling | DigiCert, Let's Encrypt, Sectigo, Google Trust Services | step-ca, HashiCorp Vault PKI, Microsoft AD CS, AWS Private CA |

My decision rule is straightforward: if an unmanaged public client must trust the service without setup, I need a publicly trusted certificate. If I control the clients and can deploy a trust anchor, a private CA gives me more control over names, lifetimes, issuance, and revocation—but also makes me responsible for that control plane.

### Self-signed certificates

A certificate signed by its own private key rather than another CA—the subject and issuer are the same entity. It is useful for local development or as a private trust anchor. A browser warns when the certificate is not trusted or does not match the hostname. If I deliberately install it as a trust anchor and it otherwise validates, the browser need not warn.

### Cross-signed CAs

A CA can hold multiple valid certificates for the same key — for example, a new root cross-signed by an older, more widely-trusted root during a transition period. This lets clients that haven't yet added the new root still build a trusted chain via the old one. Let's Encrypt's transition away from its original cross-sign with IdenTrust is a well-known real-world example.

## Try it yourself: building a mini CA with step-ca

To make the chain concrete, I can use [step-ca](https://smallstep.com/docs/step-ca/) and the `step` CLI to create a local Root → Intermediate → Leaf path. The manual commands below are a learning exercise, not a production CA design.

<div class="callout">
  <span class="callout-title">Note</span>
  <p>Commands below are accurate to the <code>step</code> CLI's documented usage. Exact terminal output (prompts, wording) varies slightly by version — the output blocks are illustrative of the shape of the output, not a byte-for-byte transcript.</p>
</div>

### 1. Default algorithms & certificate types created

By default, `step` uses secure modern defaults unless flags are passed:
- **Default Algorithm:** **ECDSA P-256** (NIST curve `prime256v1`) key pair with **`ecdsa-with-SHA256`** signature algorithm.
- **Certificate Types (Profiles):**
  - `--profile root-ca`: Creates a **Self-Signed Root CA Certificate** (`Basic Constraints: CA:TRUE`, Key Usage: `Certificate Sign, CRL Sign`).
  - `--profile intermediate-ca`: Creates a **Subordinate/Intermediate CA Certificate** (`Basic Constraints: CA:TRUE, pathlen:0`, Key Usage: `Certificate Sign, CRL Sign`).
  - `--profile leaf`: Creates an **End-Entity / Leaf TLS Server Certificate** (`Basic Constraints: CA:FALSE`, Extended Key Usage: `TLS Web Server Authentication, TLS Web Client Authentication`).

---

### 2. Step-by-step certificate creation

**Step 1: Create the Root CA (Self-Signed Root CA Certificate)**
```bash
step certificate create --profile root-ca "Example Root CA" root_ca.crt root_ca.key
```

**Step 2: Create the Intermediate CA (Intermediate CA Certificate signed by Root)**
```bash
step certificate create "Example Intermediate CA1" \
    intermediate_ca.crt intermediate_ca.key \
    --profile intermediate-ca --ca root_ca.crt --ca-key root_ca.key
```

**Step 3: Create the Leaf Certificate (End-Entity TLS Certificate signed by Intermediate)**
```bash
step certificate create example.com example.com.crt example.com.key \
    --profile leaf --not-after=2160h \
    --ca intermediate_ca.crt --ca-key intermediate_ca.key --bundle
```
`--bundle` writes the leaf concatenated with the intermediate into `example.com.crt` so the server can serve the full chain. `--not-after=2160h` sets a 90-day validity.

**Step 4: Confirm the chain validates with OpenSSL**
```bash
openssl verify -CAfile root_ca.crt -untrusted intermediate_ca.crt example.com.crt
# Output: example.com.crt: OK
```

---

### 3. How to inspect and verify the algorithm & certificate type

To verify what algorithm, key size, signature algorithm, or certificate type (CA vs Leaf) was created, inspect the certificate details:

#### Option A: Using `step certificate inspect`
```bash
step certificate inspect example.com.crt
```
Look for these key fields in the output:
- **Signature Algorithm:** `ECDSA-SHA256` or `SHA256-RSA`
- **Public Key Algorithm:** `ECDSA` / `P-256` or `RSA` / `3072`
- **X509v3 Basic Constraints:** `CA:FALSE` (for leaf) or `CA:TRUE` (for CA)
- **X509v3 Extended Key Usage:** `TLS Web Server Authentication`

#### Option B: Using `openssl x509`
```bash
openssl x509 -in example.com.crt -text -noout
```
Look for:
- `Signature Algorithm: ecdsa-with-SHA256`
- `Public Key Algorithm: id-ecPublicKey` (ASN.1 OID for EC keys)
- `ASN1 OID: prime256v1` (NIST P-256 curve)
- `X509v3 Basic Constraints: CA:FALSE`

---

### 4. How to change the key algorithm or certificate type

You can override defaults using key type (`--kty`), curve (`--curve`), key size (`--size`), and profile (`--profile`) flags:

#### A. Change Key Algorithm

- **Use RSA-3072 instead of default ECDSA P-256:**
  ```bash
  step certificate create example.com example.com.crt example.com.key \
      --profile leaf --kty RSA --size 3072 \
      --ca intermediate_ca.crt --ca-key intermediate_ca.key
  ```

- **Use ECDSA P-384 for higher security:**
  ```bash
  step certificate create example.com example.com.crt example.com.key \
      --profile leaf --kty EC --curve P-384 \
      --ca intermediate_ca.crt --ca-key intermediate_ca.key
  ```

- **Use Ed25519 (Edwards-curve Digital Signature Algorithm):**
  ```bash
  step certificate create example.com example.com.crt example.com.key \
      --profile leaf --kty OKP --curve Ed25519 \
      --ca intermediate_ca.crt --ca-key intermediate_ca.key
  ```

#### B. Change Certificate Type (Profile)

Pass a different `--profile` flag to specify the role of the certificate:
- `--profile leaf` $\rightarrow$ End-entity server/client TLS certificate (`CA:FALSE`).
- `--profile root-ca` $\rightarrow$ Self-signed root CA certificate (`CA:TRUE`).
- `--profile intermediate-ca` $\rightarrow$ Subordinate CA certificate (`CA:TRUE`).

The built-in profiles stop there. Code-signing and S/MIME certificates need a template or CA policy that adds the required Key Usage/EKU and other constraints; `step certificate create` does not have built-in `code-signing` or `smime` profiles. See the [Smallstep command reference](https://smallstep.com/docs/step-cli/reference/certificate/create/).

<div class="callout">
  <span class="callout-title">Faster path</span>
  <p>The steps above create standalone certificate files. For an actual CA service, <code>step ca init</code> initializes a root, an intermediate, and server configuration; ACME issuance still requires the appropriate provisioner and operating controls. I keep the manual version here because it exposes each object in the chain.</p>
</div>

## Chain of trust

A server doesn't just present its own certificate — it presents a **chain**: its own (leaf/end-entity) certificate, plus every intermediate up to (but usually not including) the root, since roots are already in the client's trust store. A client then walks that chain upward, verifying one signature at a time, until it either lands on something it already trusts, or gives up:

<div class="diagram-frame">
  <img src="{{ '/assets/img/chain-validation.svg' | relative_url }}" alt="Diagram showing chain of trust validation: the root CA's signature verifies the intermediate CA, the intermediate's signature verifies the leaf certificate, and since the root is already in the browser's trust store, the whole chain is verified and the connection is trusted.">
  <p class="diagram-caption">Two signature checks, plus one root that was already trusted going in</p>
</div>

My practical checklist is broader than six signature and name checks:

1. Is the leaf certificate's `Not Before` / `Not After` currently valid?
2. Does the requested hostname match a SAN entry on the leaf?
3. Is the leaf's signature valid under the intermediate's public key?
4. Is the intermediate's signature valid under the root's public key?
5. Is that root actually present in the client's trust store?
6. Do Basic Constraints, path-length limits, Key Usage, EKU, name constraints, certificate policies, and algorithm constraints permit this use?
7. Does the client apply revocation or ecosystem-specific blocklist checks, and what happens if those checks are unavailable?

If a required validation step fails, the client must reject the certificate for that connection. Browsers surface this class of failure with a certificate warning.

<div class="callout warn">
  <span class="callout-title">Common misconfiguration</span>
  <p>Serving only the leaf certificate without the intermediate is one of the most common TLS setup mistakes. Most browsers cache intermediates and may still connect, but many non-browser clients (curl, mobile apps, API clients) will fail outright. Always serve the full chain minus the root.</p>
</div>

## Validation levels

These describe *how much the CA verified* before issuing — they do not change the strength of the encryption.

| Level | What's verified | Typical use | Visual cue |
|---|---|---|---|
| **DV** — Domain Validated | Control over the domain only (DNS record, HTTP file, or email challenge) | Most websites; issued automatically, often free (e.g. Let's Encrypt) | None beyond the padlock |
| **OV** — Organization Validated | Domain control + the requesting organization's legal existence | Corporate/business sites wanting an identifiable entity behind the cert | Organization name visible in certificate details |
| **EV** — Extended Validation | Domain control + rigorous legal, physical, and operational vetting of the organization, per strict CA/Browser Forum criteria | Banking, finance — historically | Organization name in certificate details (browsers stopped giving EV special UI treatment around 2019 after research showed users didn't notice/understand it) |

## Certificate types by use

### TLS/SSL server certificates

- **Single-domain** — covers exactly one hostname.
- **Wildcard** (`*.example.com`) — covers all direct subdomains of one domain. Does *not* cover the bare domain or multi-level subdomains (`a.b.example.com`) unless separately listed.
- **Multi-domain / SAN / UCC** — one certificate covering several unrelated hostnames via multiple SAN entries; common for shared hosting and Microsoft Exchange/Office 365 setups (UCC).

### Client certificates (mTLS)

Used for **mutual TLS**, where the client also authenticates to the server with a certificate — common in service-to-service auth, VPNs, and zero-trust architectures. EKU: `clientAuth`.

### Code signing certificates

Sign executables, installers, drivers, or scripts so the OS can verify the publisher and detect tampering (Authenticode on Windows, notarization-adjacent signing on macOS). EKU: `codeSigning`. Private keys for these are high-value targets and are increasingly required to live in hardware tokens/HSMs by CA policy.

### Email / S/MIME certificates

Sign and/or encrypt email (S/MIME), proving sender identity and optionally encrypting the message body end-to-end. EKU: `emailProtection`.

### Document signing certificates

Used to digitally sign PDFs and similar documents (e.g. Adobe-trusted certificates) to prove authorship and detect post-signing edits.

### Device / IoT certificates

Short-lived or high-volume certificates issued to individual devices for authentication, often from a private CA, since public CAs generally aren't practical at that scale or trust model.

## Formats and encodings

The same certificate data can be stored in several container formats — this trips people up constantly:

| Format | Encoding | Typical extension | Notes |
|---|---|---|---|
| PEM | Base64 text, `-----BEGIN CERTIFICATE-----` | `.pem`, `.crt`, `.cer` | Most common on Linux/Apache/nginx; can hold cert, key, and chain in one file, concatenated |
| DER | Raw binary | `.der`, `.cer` | Common on Windows/Java; PEM is just DER, base64-encoded with headers |
| PKCS#7 | Binary or Base64, certs/chain only (no private key) | `.p7b`, `.p7c` | Used by Windows and Java for distributing chains |
| PKCS#12 | Binary, encrypted container | `.pfx`, `.p12` | Bundles a private key *with* its certificate (and chain), password-protected — used for importing identities into browsers, Windows, or mobile devices |

<div class="callout">
  <span class="callout-title">Quick conversion reference</span>
  <p><code>openssl x509 -in cert.der -inform DER -out cert.pem -outform PEM</code> converts DER→PEM. <code>openssl pkcs12 -in identity.pfx -out identity.pem -nodes</code> extracts a PEM key+cert from a PFX.</p>
</div>

## Certificate lifecycle

A certificate is a lifecycle rather than a one-time file:

<div class="diagram-frame">
  <img src="{{ '/assets/img/certificate-lifecycle.svg' | relative_url }}" alt="Circular diagram of the certificate lifecycle: key generation, CSR, validation, issuance, deployment, and renewal, which loops back to CSR before expiry. Revocation branches off from deployment as an emergency exit that can happen anytime if the certificate is compromised or mis-issued.">
  <p class="diagram-caption">Renewal loops the cycle; revocation is the only way out early</p>
</div>

1. **Key generation** — the subject or an authorized managed service generates the key pair. The private key should remain inside its intended protection boundary.
2. **CSR (Certificate Signing Request)** — the subject sends the CA their public key plus identity details, self-signed with their own private key to prove possession.
3. **Validation** — the CA verifies the request per the intended validation level (DV/OV/EV).
4. **Issuance** — the CA signs and returns the certificate.
5. **Deployment** — installed on the server/device alongside the full chain.
6. **Renewal** — before the certificate expires, steps 2–4 repeat. How often this happens is shrinking fast — see below.
7. **Revocation** — the emergency exit. If a key is compromised or a certificate was mis-issued, the CA revokes it before its natural expiry, at any point in the cycle.

### CSR (Certificate Signing Request) & Proof of Possession

A **CSR** is an encoded PKCS#10 structure submitted to a CA to request a signed certificate. It includes:
- **Public Key:** The public key generated by the applicant (e.g. RSA-3072 or ECDSA P-256).
- **Subject Identity & SANs:** Subject Distinguished Name (DN) and Subject Alternative Names (`DNS:example.com`, `DNS:www.example.com`).
- **Proof of Possession (POP):** A digital signature created with the applicant's private key over the CSR data. The CA verifies this signature before issuing to guarantee that the applicant actually owns the matching private key.

#### Generating a CSR with OpenSSL

**ECDSA P-256 (Recommended):**
```bash
openssl req -new -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 \
  -nodes -keyout example.com.key -out example.com.csr \
  -subj "/CN=example.com/O=My Enterprise" \
  -addext "subjectAltName=DNS:example.com,DNS:www.example.com"
```

**RSA-3072:**
```bash
openssl req -new -newkey rsa:3072 \
  -nodes -keyout example.com.key -out example.com.csr \
  -subj "/CN=example.com/O=My Enterprise" \
  -addext "subjectAltName=DNS:example.com,DNS:www.example.com"
```

**Inspect a CSR:**
```bash
openssl req -in example.com.csr -noout -text
```

### Revocation: CRL and OCSP

- **CRL (Certificate Revocation List)** — a signed, periodically-updated list of revoked serial numbers, published by the CA. Clients download and check against it. Simple, but lists grow large and updates lag.
- **OCSP (Online Certificate Status Protocol)** — a client queries the CA in real time for the status of one specific certificate. Faster and lighter than CRLs, but leaks the client's browsing pattern to the CA and adds a live dependency (and latency) to every connection.
- **OCSP stapling** — the server periodically fetches a signed OCSP response and can staple it to the TLS handshake, avoiding a direct client-to-CA query. Client behavior varies: browsers may use stapled OCSP, CRLSets, CRLite, vendor blocklists, or other policy-specific mechanisms.

### The industry trend: shrinking lifetimes instead of relying on revocation

Here's the uncomfortable truth behind both mechanisms above: revocation checking is widely unreliable in practice. Browsers routinely "soft-fail" — if an OCSP responder times out, most browsers connect anyway rather than block the user, since blocking is worse for reliability than the risk of missing one revoked cert. That makes revocation a weaker safety net than it looks on paper.

The industry's answer hasn't been to fix revocation — it's been to shrink the window where an unrevoked-but-compromised certificate can do damage, by shortening how long any certificate is valid for in the first place:

| When | Max validity | Driven by |
|---|---|---|
| Before 2020 | Up to 825 days | — |
| Since Sept 2020 | 398 days | Apple's root program change, later adopted industry-wide |
| From Mar 15, 2026 | 200 days | CA/Browser Forum Ballot SC-081v3 |
| From Mar 15, 2027 | 100 days | CA/Browser Forum Ballot SC-081v3 |
| From Mar 15, 2029 | 47 days | CA/Browser Forum Ballot SC-081v3 |

Ballot [SC-081v3, "Introduce Schedule of Reducing Validity and Data Reuse Periods"](https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/), proposed by Apple and approved by the CA/Browser Forum on April 11, 2025, sets this schedule for all publicly-trusted TLS certificates. By 2029, a certificate that would previously renew roughly once a year will need to renew about eight times a year — which only becomes practical because of automation (ACME/Let's Encrypt-style issuance), not because anyone wants to run CSRs by hand more often.

<div class="callout">
  <span class="callout-title">Why this actually helps</span>
  <p>A shorter-lived certificate means a stolen key, or a mis-issued certificate that slips through validation, is only useful to an attacker for weeks instead of over a year — even if revocation never happens at all. It's a blast-radius fix, not a revocation fix.</p>
</div>

### Certificate Transparency (CT)

**Certificate Transparency (CT)** ([RFC 6962](https://www.rfc-editor.org/rfc/rfc6962) / [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162)) is an open audit framework designed to monitor and audit all TLS certificates issued on the public web.

Public-trust browser policies require certificates or precertificates to be submitted to accepted CT logs and accompanied by sufficient SCTs under that browser's policy. The required number, operators, delivery methods, and lifetime rules vary.

- The log returns a **Signed Certificate Timestamp (SCT)** promising inclusion within the log's Maximum Merge Delay. It is not proof that inclusion has already happened.
- Browsers enforce their own CT policies. Apple's current policy, for example, varies the accepted SCT count by certificate lifetime and log operator; see [Apple's CT policy](https://support.apple.com/en-us/103214).
- **Why CT matters:** CT makes public certificate issuance observable when logs and monitors behave correctly. Monitoring is still needed, and split-view/collusion risks are handled through consistency checking and ecosystem governance rather than by the SCT alone.

## Best practices, briefly

- Prefer ECDSA (P-256 or better) over RSA for new deployments — smaller, faster, and see the [algorithms table](#what-algorithms-actually-sign-these-certificates) above for what NIST currently recommends.
- Automate issuance and renewal (ACME/Let's Encrypt, or internal ACME-compatible private CAs) — manual renewal is already the single most common cause of expiry outages, and it only gets worse as the industry shortens lifetimes.
- Use OCSP stapling where it benefits the actual clients, and understand the browser/vendor revocation mechanism instead of assuming stapling is universally consumed.
- Don't over-scope wildcards — a compromised wildcard key exposes every subdomain; scope certificates as narrowly as the use case allows.
- Monitor Certificate Transparency (CT) logs for your domains to catch mis-issued or unexpected certificates.
