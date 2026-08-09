---
title: Public Key Infrastructure (PKI) & X.509 Certificates
description: X.509 v3 certificate structure, Certificate Authority (CA) hierarchies, automated ACME issuance (RFC 8555 / ARI), CRL/OCSP revocation, and PQC hybrid certificates.
permalink: /topics/certificates/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Infrastructure</span>

# Public Key Infrastructure (PKI) & X.509 Certificates

<p class="lede">Public Key Infrastructure (PKI) binds public keys to verified entity identities (domain names, servers, users, devices) using digital signatures issued by trusted Certificate Authorities (CAs). X.509 certificates provide the trust anchor for TLS, S/MIME, code signing, and mutual TLS (mTLS) identity verification across open networks.</p>

## Core PKI Components & Trust Model

PKI relies on a hierarchical trust model where trusted Root CAs issue certificates to Intermediate CAs, which in turn issue short-lived Leaf Certificates to end-entity servers.

<div class="diagram-frame">
  <img src="{{ '/assets/img/ca-hierarchy.svg' | relative_url }}" alt="PKI Certificate Authority hierarchy showing Root CA signing Intermediate CA, which signs leaf server certificates.">
  <p class="diagram-caption">PKI trust hierarchy: Root CA delegates signing authority to Intermediate CAs</p>
</div>

| PKI Component | Operational Role | Primary Security Property |
|---|---|---|
| **Certificate Authority (CA)** | Trusted entity that validates identity and signs X.509 certificates | Private key custody inside HSM; protects root of trust. |
| **Certificate Revocation List (CRL) / OCSP** | Revocation status mechanisms publishing invalid certificate serial numbers | Prevents compromised or misissued certificates from being trusted. |
| **Registration Authority (RA)** | Verifies domain ownership or organizational identity prior to issuance | Enforces domain control validation (DNS-01, HTTP-01). |
| **Trust Store** | Pre-installed list of trusted Root CA certificates embedded in OS / browser | Establishes local trust anchors for path validation algorithms. |

## Anatomy of an X.509 v3 Certificate (RFC 5280)

Specified in **[RFC 5280](https://www.rfc-editor.org/rfc/rfc5280)**, an X.509 v3 certificate structures identity metadata into standard fields signed by a CA:

```
Certificate:
  Data:
    Version: 3 (0x2)
    Serial Number: 04:00:00:00:00:01:15:69:97:0a:b0
    Signature Algorithm: ecdsa-with-SHA256
    Issuer: C=US, O=Let's Encrypt, CN=E1
    Validity:
        Not Before: Aug 01 00:00:00 2026 GMT
        Not After : Oct 30 23:59:59 2026 GMT
    Subject: CN=api.example.com
    Subject Public Key Info:
        Public Key Algorithm: id-ecPublicKey (secp256r1)
    X509v3 extensions:
        X509v3 Subject Alternative Name:
            DNS:api.example.com, DNS:www.example.com
        X509v3 Key Usage: critical
            Digital Signature
        X509v3 Extended Key Usage:
            TLS Web Server Authentication, TLS Web Client Authentication
```

| Field Name | Standard Function | Critical Security Check |
|---|---|---|
| **Basic Constraints** | Indicates whether subject is a CA (`cA: TRUE` vs `cA: FALSE`) | Leaf certificates must have `cA: FALSE` to prevent rogue CA certificate creation. |
| **Extended Key Usage (EKU)** | Specifies allowed certificate roles (*Server Auth, Client Auth, Code Signing*) | Prevents a TLS server certificate from signing executable software binaries. |
| **Subject Alternative Name (SAN)** | Lists exact FQDN domain names bound to this certificate | Modern browsers validate SAN fields exclusively; commonName (CN) is ignored. |
| **Validity Period** | Defines `Not Before` and `Not After` timestamp bounds | Enforces maximum 90-day to 398-day lifetime limits. |

## Certificate Lifecycle & Automated Issuance (ACME & ARI)

Managing short-lived certificates at scale requires automated enrollment via the **Automated Certificate Management Environment (ACME / [RFC 8555](https://www.rfc-editor.org/rfc/rfc8555))** protocol:

<div class="diagram-frame">
  <img src="{{ '/assets/img/certificate-lifecycle.svg' | relative_url }}?v=2" alt="Automated ACME certificate issuance lifecycle showing CSR submission, DV challenge validation, CA issuance, and ARI renewal.">
  <p class="diagram-caption">Automated ACME certificate lifecycle: domain challenge verification, CSR signing, and automated renewal</p>
</div>

### Certificate Lifetime Shrinkage Timeline

<div class="diagram-frame">
  <img src="{{ '/assets/img/certificate-lifetime-timeline.svg' | relative_url }}" alt="Timeline showing X.509 certificate maximum lifetimes shrinking from 825 days down to 47 days.">
  <p class="diagram-caption">X.509 lifetime evolution: transition from multi-year static certificates to automated 47–90 day lifespans</p>
</div>

### ACME Renewal Information (ARI)

To support short 47-to-90-day certificate lifetimes without outages, **ACME Renewal Information (ARI)** allows CAs to suggest optimal renewal windows to automated agents dynamically before expiration.

## Certificate Formats & OpenSSL Encoding Conversions

X.509 certificates and private keys are distributed across four primary format encodings:

| Format Extension | Encoding Type | Typical Content | Target Application Use Case |
|---|---|---|---|
| **.crt / .pem** | Base64 ASCII with `-----BEGIN CERTIFICATE-----` | Certificates, Private Keys, CA Chains | Standard default for Linux, NGINX, Apache, and OpenSSL. |
| **.der / .cer** | Binary ASN.1 encoding | Single Certificate or Private Key | Java KeyStores, Windows OS binary certs, smart cards. |
| **.p7b / .p7c** | PKCS#7 Base64 or binary | Certificate Bundles & CRLs (No Private Keys) | Windows IIS, S/MIME email signature verification. |
| **.pfx / .p12** | PKCS#12 password-protected binary archive | Bundles Leaf Cert + Private Key + CA Chain | Windows IIS, Tomcat, macOS Keychain, Android system certs. |

### OpenSSL Conversion Cheat Sheet

```bash
# 1. Convert PEM to DER (ASCII Text -> Binary ASN.1)
openssl x509 -in cert.pem -outform DER -out cert.der

# 2. Convert DER to PEM (Binary ASN.1 -> ASCII Text)
openssl x509 -inform DER -in cert.der -outform PEM -out cert.pem

# 3. Bundle PEM Certificate + Private Key + Chain into PKCS#12 (.p12 / .pfx)
openssl pkcs12 -export -out bundle.p12 -inkey private.key -in cert.pem -certfile ca_chain.pem

# 4. Extract PEM Certificate & Unencrypted Private Key from PKCS#12 (.p12 / .pfx)
openssl pkcs12 -in bundle.p12 -out unbundled.pem -nodes

# 5. Convert PKCS#7 (.p7b) to PEM
openssl pkcs7 -print_certs -in certs.p7b -out certs.pem
```

## Certificate & Public Key Pinning (Mobile & Native App Defense)

Standard PKI path validation trusts **any of the ~150+ pre-installed Root CAs** in an OS trust store to issue certificates for your domain. **Certificate Pinning** (or **Public Key Pinning**) restricts native client applications (iOS, Android, IoT) to accept **only specific, pre-declared public key hashes**, bypassing untrusted or compromised CAs.

### Pinning Target Strategies

| Pinning Strategy | Target Object Pinned | Maintenance & Operational Risk | Primary Use Case |
|---|---|---|---|
| **Leaf Certificate Pinning** | Hashes full leaf X.509 certificate | **HIGH RISK**: Leaf cert expiration or emergency ACME renewal breaks app connectivity unless app update is deployed. | High-security ephemeral IoT sessions. |
| **Intermediate / Root CA Pinning** | Hashes public key of issuing CA | **LOW RISK**: Leaf certs can rotate freely as long as issuing CA remains unchanged. | Enterprise mobile applications. |
| **SPKI Public Key Pinning (Best Practice)** | Hashes `SubjectPublicKeyInfo` (SPKI) bit string | **OPTIMAL**: Re-issuing leaf certs using the *same key pair* maintains pin validity across renewals. | Production iOS and Android mobile apps. |

### Pinning Scope: Public CA vs. Private CA Deployment

Certificate pinning applies to both Public PKI and Private PKI environments, addressing distinct threat vectors:

- **Public CAs (e.g. Let's Encrypt, DigiCert, Sectigo)**: Mobile OS trust stores pre-install **~150+ commercial Root CAs**. If a single Public CA is compromised or coerced into issuing a fake certificate for your domain (`api.example.com`), standard TLS path validation accepts the forged cert. Pinning your server's **SPKI key hash** forces native apps to ignore all other 150+ Public CAs, ensuring only your specific server key is trusted.
- **Private CAs (Internal / Enterprise PKI)**: Used inside corporate networks, mTLS microservice meshes, and IoT fleets (e.g. HashiCorp Vault PKI, AWS Private CA). Pinning the **Private CA Root/Intermediate key** inside native apps prevents corporate SSL decryption proxies (e.g. Zscaler, Charles Proxy) or user-installed custom root certificates from eavesdropping on enterprise API traffic.

### Security Risks & Threat Vectors of Pinning

While pinning protects network transport against rogue CAs, it introduces significant security trade-offs and threat vectors:

| Security Risk / Threat Vector | Attack Mechanics & Impact | Engineering Mitigation |
|---|---|---|
| **Self-Inflicted Security DoS** | If an emergency key revocation occurs (e.g. private key leak) and no matching backup pin exists in the app binary, **100% of client instances lose security connectivity**, preventing over-the-air API security patches. | Always configure at least one **Backup SPKI Pin** derived from an offline, cold-storage key pair. |
| **Pin-Jacking / Hostage Attack** | An attacker who briefly compromises server header configurations can inject malicious pins, locking legitimate clients out of the legitimate service indefinitely. | Primary reason **HPKP was deprecated in browsers**. Restrict pinning configurations to signed native app code bundles. |
| **Client-Side Bypass (Frida / Jailbreak)** | Attackers analyzing mobile apps on rooted/jailbroken devices easily bypass pinning using dynamic instrumentation tools (**Frida**, **Objection**) to hook TLS validation routines. | Treat pinning as a network-layer defense, not a client-side reverse engineering barrier. Combine with root/jailbreak detection and obfuscation. |
| **CA Intermediate Migration Failure** | If an issuing CA retires an Intermediate certificate authority (e.g. Let's Encrypt R3 to R10), pinned clients that hardcoded the Intermediate CA key drop connection. | Pin **SubjectPublicKeyInfo (SPKI)** of your own key pair, or pin the **Root CA** key rather than transient Intermediate keys. |

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Pinning Industry Guidance &amp; Deprecation Warning</div>
  <div>
    <strong>Web Browsers (Deprecated) vs. Mobile Native Apps (Active)</strong>
    <p>Understanding where Certificate Pinning belongs prevents catastrophic self-inflicted Denial of Service (DoS):</p>
    <ul>
      <li><strong>Web Browsers (Deprecated)</strong>: <strong>HTTP Public Key Pinning (HPKP / RFC 7469)</strong> was officially <strong>deprecated and removed from web browsers</strong> (Chrome, Firefox, Safari) due to site-bricking hazards and malicious pin-jacking attacks. Web browsers rely on <strong>Certificate Transparency (CT)</strong> for rogue CA detection instead.</li>
      <li><strong>Mobile &amp; Native Apps (Active Standard)</strong>: Certificate and SPKI pinning remain vital defense-in-depth controls for <strong>iOS and Android native applications</strong> to defeat corporate TLS proxies, local MitM interception, and rogue CA issuance.</li>
      <li><strong>Mandatory Backup Pin Rule</strong>: Mobile app configurations <strong>must specify at least one backup pin</strong> (a secondary public key hash held in cold storage) to allow key rotation without bricking deployed application instances.</li>
    </ul>
  </div>
</div>

### Native Mobile Pinning Configuration Examples

#### Android Network Security Config (`res/xml/network_security_config.xml`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.example.com</domain>
        <pin-set expiration="2027-01-01">
            <!-- Primary Pin: SHA-256 hash of SubjectPublicKeyInfo -->
            <pin digest="SHA-256">cUPcScTJnGGxEvWYspA5vF9VPol17BskT1hB64GVAHw=</pin>
            <!-- Backup Disaster Recovery Pin (Cold Storage Key) -->
            <pin digest="SHA-256">M8HwxWaMH1ECCkg4AgWFiUsS55TF0bT3A89LBFJgMqU=</pin>
        </pin-set>
    </domain-config>
</network-security-config>
```

#### iOS Network Transport Security (`Info.plist`)

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSPinnedDomains</key>
    <dict>
        <key>api.example.com</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSPinnedCAIdentities</key>
            <array>
                <dict>
                    <key>SPKI-SHA256-BASE64</key>
                    <string>cUPcScTJnGGxEvWYspA5vF9VPol17BskT1hB64GVAHw=</string>
                </dict>
                <dict>
                    <key>SPKI-SHA256-BASE64</key>
                    <string>M8HwxWaMH1ECCkg4AgWFiUsS55TF0bT3A89LBFJgMqU=</string>
                </dict>
            </array>
        </dict>
    </dict>
</dict>
```

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Certificates &amp; PKI Summary</strong>
    <ul>
      <li><strong>X.509 Trust Chain</strong>: Root CAs sign Intermediate CAs, which sign short-lived Leaf certificates (SAN fields enforce domain matching).</li>
      <li><strong>Automated ACME &amp; ARI</strong>: Cert lifespans are shrinking to 47–90 days; automated renewal via ACME (RFC 8555) and ARI is mandatory.</li>
      <li><strong>Pinning Trade-offs</strong>: Certificate/SPKI pinning protects mobile native apps against rogue CAs, but introduces self-inflicted DoS risks if backup pins are omitted. HPKP is deprecated in web browsers.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 5280**: *Internet X.509 Public Key Infrastructure Certificate and CRL Profile* — [IETF RFC 5280](https://www.rfc-editor.org/rfc/rfc5280)
- **RFC 8555**: *Automatic Certificate Management Environment (ACME)* — [IETF RFC 8555](https://www.rfc-editor.org/rfc/rfc8555)
- **RFC 7469**: *Public Key Pinning Extension for HTTP (Deprecation Notice)* — [IETF RFC 7469](https://www.rfc-editor.org/rfc/rfc7469)
