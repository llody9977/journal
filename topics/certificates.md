---
title: Public Key Infrastructure (PKI) & X.509 Certificates
description: X.509 v3 certificate structure, Certificate Authority (CA) hierarchies, automated ACME issuance (RFC 8555 / ARI), CRL/OCSP revocation, and PQC hybrid certificates.
permalink: /topics/certificates/
last_verified: 2026-08-09
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
| **Certificate Revocation List (CRL) / OCSP** | Revocation status mechanisms publishing invalid certificate serial numbers | Best-effort defense against compromised or misissued certificates — most browsers soft-fail (proceed with the connection) when a revocation check is unavailable, so it is not an absolute guarantee. |
| **Registration Authority (RA)** | Verifies domain ownership or organizational identity prior to issuance | Enforces domain control validation (DNS-01, HTTP-01). |
| **Trust Store** | Pre-installed list of trusted Root CA certificates embedded in OS / browser | Establishes local trust anchors used during path validation (RFC 5280 §6): chain building to a trusted root, signature verification at each hop, validity-period and name-constraint checks, and — where enforced — revocation status. |

## Anatomy of an X.509 v3 Certificate (RFC 5280)

Specified in **[RFC 5280](https://www.rfc-editor.org/rfc/rfc5280)**, an X.509 v3 certificate structures identity metadata into standard fields signed by a CA:

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Live CT Issuance Inspector</span>
    <h3>Domain CT Log Issuance Inspector</h3>
    <p>Enter any public domain name (e.g. google.com, github.com) to query its Certificate Transparency (CT) log issuance records via CertSpotter API.</p>
  </div>

  <div class="demo-body">
    <div class="demo-form-group">
      <label for="domain-input">Target Domain Name:</label>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input id="domain-input" type="text" class="demo-input" style="flex: 1; margin: 0;" placeholder="example.com" value="google.com">
        <button id="btn-fetch-domain-cert" class="btn-primary" style="margin: 0;" type="button">&#9889; Query Certificate</button>
      </div>
    </div>

    <!-- Output Display -->
    <div id="domain-cert-output" class="demo-output-area" style="font-family: var(--font-mono); font-size: 0.8rem; line-height: 1.4; white-space: pre-wrap; word-break: break-all; max-height: 350px; overflow-y: auto;"></div>
  </div>
</div>

{% raw %}
<script>
(function() {
  const btnQuery = document.getElementById('btn-fetch-domain-cert');
  const domainInput = document.getElementById('domain-input');
  const outputArea = document.getElementById('domain-cert-output');

  if (!btnQuery || !domainInput || !outputArea) return;

  function hexToBase64(hexStr) {
    const bytes = [];
    for (let c = 0; c < hexStr.length; c += 2) {
      bytes.push(parseInt(hexStr.substr(c, 2), 16));
    }
    const binary = String.fromCharCode.apply(null, bytes);
    return window.btoa(binary);
  }

  function formatDate(isoStr) {
    const d = new Date(isoStr);
    return d.toUTCString();
  }

  async function queryCertificate() {
    const domain = domainInput.value.trim().toLowerCase();
    if (!domain) {
      outputArea.innerHTML = '<div style="color: #b91c1c; font-family: var(--font-sans);">⚠️ Please enter a domain name.</div>';
      return;
    }

    outputArea.innerHTML = '<div style="color: var(--amber); font-family: var(--font-sans); font-weight: 600;">&#8987; Fetching certificate transparency issuances from CertSpotter...</div>';

    try {
      const url = `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&expand=dns_names&expand=issuer&limit=1`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`CT Log API responded with HTTP status ${res.status}`);
      }
      const data = await res.json();
      if (!data || data.length === 0) {
        throw new Error("No certificates found in CT logs for this domain.");
      }

      const cert = data[0];
      const pinBase64 = hexToBase64(cert.pubkey_sha256);

      let sans = cert.dns_names.map(name => `DNS:${name}`).join(', ');
      if (sans.length > 100) {
        sans = cert.dns_names.slice(0, 3).map(name => `DNS:${name}`).join(', ') + `, ... (+ ${cert.dns_names.length - 3} more)`;
      }

      let rfcText = `Certificate Transparency Log Entry:
  Data:
    Certificate SHA-256 Fingerprint: ${cert.cert_sha256}
    Issuer: ${cert.issuer.name}
    Validity Window:
        Not Before: ${formatDate(cert.not_before)}
        Not After : ${formatDate(cert.not_after)}
    Subject Alternative Names (SANs):
        ${sans}
    Subject Public Key SPKI SHA-256 Pin (Base64):
        ${pinBase64}`;

      outputArea.textContent = rfcText;
    } catch (err) {
      outputArea.innerHTML = `<div style="color: #b91c1c; font-family: var(--font-sans); padding: 0.5rem; border: 1px solid #fca5a5; border-radius: 4px; background: #fef2f2;"><strong>Query Failure:</strong> ${err.message}</div>`;
    }
  }

  btnQuery.addEventListener('click', queryCertificate);
  queryCertificate();
})();
</script>
{% endraw %}

| Field Name | Standard Function | Critical Security Check |
|---|---|---|
| **Basic Constraints** | Indicates whether subject is a CA (`cA: TRUE` vs `cA: FALSE`) | Leaf certificates must never assert `cA: TRUE`. Depending on the issuing CA's profile, they either omit this extension entirely (which defaults to non-CA per [RFC 5280 §4.2.1.9](https://www.rfc-editor.org/rfc/rfc5280#section-4.2.1.9)) or include it explicitly set to `cA: FALSE` — either form prevents the leaf key from minting further certificates. |
| **Extended Key Usage (EKU)** | Specifies allowed certificate roles (*Server Auth, Client Auth, Code Signing*) | Prevents a TLS server certificate from signing executable software binaries. |
| **Subject Alternative Name (SAN)** | Lists exact FQDN domain names bound to this certificate | Modern browsers validate SAN fields exclusively; commonName (CN) is ignored. |
| **Validity Period** | Defines `Not Before` and `Not After` timestamp bounds | Enforces maximum validity periods per CA/Browser Forum Baseline Requirements: 200 days as of March 15, 2026; 100 days as of March 15, 2027; and 47 days as of March 15, 2029. |

## Certificate Lifecycle & Automated Issuance (ACME & ARI)

Managing short-lived certificates at scale requires automated enrollment via the **Automated Certificate Management Environment (ACME / [RFC 8555](https://www.rfc-editor.org/rfc/rfc8555))** protocol:

<div class="diagram-frame">
  <img src="{{ '/assets/img/certificate-lifecycle.svg' | relative_url }}?v=2" alt="Automated ACME certificate issuance lifecycle showing CSR submission, DV challenge validation, CA issuance, and ARI renewal.">
  <p class="diagram-caption">Automated ACME certificate lifecycle: domain challenge verification, CSR signing, and automated renewal</p>
</div>

### Certificate Lifetime Shrinkage Timeline

<div class="diagram-frame">
  <img src="{{ '/assets/img/certificate-lifetime-timeline.svg' | relative_url }}" alt="Timeline showing X.509 certificate maximum lifetimes shrinking from 825 days down to 47 days.">
  <p class="diagram-caption">X.509 lifetime evolution: transition from multi-year (825-day) static certificates to automated short-lived certificates, tightening from 200 days today to a 47-day maximum by March 2029</p>
</div>

### ACME Renewal Information (ARI, RFC 9773)

To support these shrinking (200-day today, 47-day by 2029) certificate lifetimes without outages, **ACME Renewal Information (ARI)** ([RFC 9773](https://www.rfc-editor.org/info/rfc9773), published as a Proposed Standard in 2025) allows CAs to suggest optimal renewal windows to automated agents dynamically before expiration.

## Certificate Formats & OpenSSL Encoding Conversions

X.509 certificates and private keys are distributed across four primary format encodings:

| Format Extension | Encoding Type | Typical Content | Target Application Use Case |
|---|---|---|---|
| **.pem** | Base64 ASCII with `-----BEGIN ... -----` armor | Certificates, Private Keys, CSRs, CA Chains | Standard default for Linux, NGINX, Apache, and OpenSSL. |
| **.der** | Binary ASN.1 encoding | Single Certificate or Private Key | Java KeyStores, Windows OS binary certs, smart cards. |
| **.crt / .cer** | **Ambiguous** — either Base64 PEM or binary DER, depending on platform/tool | Single Certificate (rarely a private key) | The extension alone does not tell you the encoding; inspect the file (`file cert.crt` or look for a `-----BEGIN` header) before assuming a format. |
| **.p7b / .p7c** | PKCS#7 Base64 or binary | Certificate Bundles & CRLs (No Private Keys) | Windows IIS, S/MIME email signature verification. |
| **.pfx / .p12** | PKCS#12 password-protected binary archive | Bundles Leaf Cert + Private Key + CA Chain | Windows IIS, Tomcat, macOS Keychain, Android system certs. |

### OpenSSL CLI Reference Cheat Sheet

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Command Generator</span>
    <h3>OpenSSL CLI Code Generator</h3>
    <p>Select any common certificate operation below, customize variables, and copy the exact syntax required for your local console terminal.</p>
  </div>

  <div class="demo-body">
    <!-- Operation Selector -->
    <div class="demo-form-group">
      <label for="openssl-task-select">Select OpenSSL Operation:</label>
      <select id="openssl-task-select" class="demo-input" style="width: 100%;">
        <option value="pem2der">1. Convert PEM to DER (ASCII Base64 -> Binary ASN.1)</option>
        <option value="der2pem">2. Convert DER to PEM (Binary ASN.1 -> ASCII Base64)</option>
        <option value="bundle12">3. Bundle PEM Certificate + Key + Chain to PKCS#12 (.pfx/.p12)</option>
        <option value="extract12">4. Extract PEM Certificate & Key from PKCS#12</option>
        <option value="p7b2pem">5. Convert PKCS#7 (.p7b) to PEM</option>
        <option value="view-txt">6. View Certificate Details in Plain Text</option>
        <option value="gen-rsa">7. Generate New RSA Key Pair & CSR</option>
        <option value="match-mod">8. Check if Private Key matches Certificate (Public Key SHA-256 check)</option>
      </select>
    </div>

    <!-- Parameter Inputs -->
    <div id="openssl-group-in" class="demo-form-group">
      <label id="openssl-label-in" for="openssl-input-in">Input Certificate File:</label>
      <input id="openssl-input-in" type="text" class="demo-input" value="cert.pem">
    </div>

    <div id="openssl-group-out" class="demo-form-group">
      <label id="openssl-label-out" for="openssl-input-out">Output File:</label>
      <input id="openssl-input-out" type="text" class="demo-input" value="cert.der">
    </div>

    <div id="openssl-group-key" class="demo-form-group" style="display: none;">
      <label id="openssl-label-key" for="openssl-input-key">Private Key File:</label>
      <input id="openssl-input-key" type="text" class="demo-input" value="private.key">
    </div>

    <div id="openssl-group-chain" class="demo-form-group" style="display: none;">
      <label id="openssl-label-chain" for="openssl-input-chain">CA Chain File:</label>
      <input id="openssl-input-chain" type="text" class="demo-input" value="ca_chain.pem">
    </div>

    <!-- Output Code Container -->
    <div class="demo-form-group" style="margin-top: 1.5rem;">
      <label>Generated OpenSSL Console Command:</label>
      <div style="display: flex; gap: 0.5rem; align-items: stretch;">
        <div style="flex: 1; background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; font-family: var(--font-mono); font-size: 0.85rem; word-break: break-all; white-space: pre-wrap; display: flex; align-items: center;" id="openssl-cmd-code"></div>
        <button id="btn-copy-openssl-cmd" class="btn-primary" style="margin: 0; display: flex; align-items: center; justify-content: center; padding: 0 1.25rem;" type="button">&#128203; Copy</button>
      </div>
    </div>
  </div>
</div>

{% raw %}
<script>
(function() {
  const taskSelect = document.getElementById('openssl-task-select');

  const groupIn = document.getElementById('openssl-group-in');
  const groupOut = document.getElementById('openssl-group-out');
  const groupKey = document.getElementById('openssl-group-key');
  const groupChain = document.getElementById('openssl-group-chain');

  const labelIn = document.getElementById('openssl-label-in');
  const labelOut = document.getElementById('openssl-label-out');
  const labelKey = document.getElementById('openssl-label-key');
  const labelChain = document.getElementById('openssl-label-chain');

  const inputIn = document.getElementById('openssl-input-in');
  const inputOut = document.getElementById('openssl-input-out');
  const inputKey = document.getElementById('openssl-input-key');
  const inputChain = document.getElementById('openssl-input-chain');

  const codeArea = document.getElementById('openssl-cmd-code');
  const btnCopy = document.getElementById('btn-copy-openssl-cmd');

  if (!taskSelect || !codeArea || !btnCopy) return;

  function updateCommand() {
    const task = taskSelect.value;
    const valIn = inputIn.value.trim() || 'input.file';
    const valOut = inputOut.value.trim() || 'output.file';
    const valKey = inputKey.value.trim() || 'private.key';
    const valChain = inputChain.value.trim() || 'ca_chain.pem';

    let cmd = '';

    // Show/hide groups and set labels based on selection
    if (task === 'pem2der') {
      groupIn.style.display = 'block'; labelIn.innerText = 'Input PEM File:';
      groupOut.style.display = 'block'; labelOut.innerText = 'Output DER File:';
      groupKey.style.display = 'none';
      groupChain.style.display = 'none';
      cmd = `openssl x509 -in "${valIn}" -outform DER -out "${valOut}"`;
    } else if (task === 'der2pem') {
      groupIn.style.display = 'block'; labelIn.innerText = 'Input DER File:';
      groupOut.style.display = 'block'; labelOut.innerText = 'Output PEM File:';
      groupKey.style.display = 'none';
      groupChain.style.display = 'none';
      cmd = `openssl x509 -inform DER -in "${valIn}" -outform PEM -out "${valOut}"`;
    } else if (task === 'bundle12') {
      groupIn.style.display = 'block'; labelIn.innerText = 'Input Certificate File (PEM):';
      groupOut.style.display = 'block'; labelOut.innerText = 'Output PKCS#12 Bundle (.p12/.pfx):';
      groupKey.style.display = 'block'; labelKey.innerText = 'Private Key File:';
      groupChain.style.display = 'block'; labelChain.innerText = 'CA Chain File (optional):';
      cmd = `openssl pkcs12 -export -out "${valOut}" -inkey "${valKey}" -in "${valIn}" -certfile "${valChain}"`;
    } else if (task === 'extract12') {
      groupIn.style.display = 'block'; labelIn.innerText = 'Input PKCS#12 Bundle File:';
      groupOut.style.display = 'block'; labelOut.innerText = 'Output Decoded PEM File:';
      groupKey.style.display = 'none';
      groupChain.style.display = 'none';
      cmd = `openssl pkcs12 -in "${valIn}" -out "${valOut}"`;
    } else if (task === 'p7b2pem') {
      groupIn.style.display = 'block'; labelIn.innerText = 'Input PKCS#7 File (.p7b):';
      groupOut.style.display = 'block'; labelOut.innerText = 'Output PEM File:';
      groupKey.style.display = 'none';
      groupChain.style.display = 'none';
      cmd = `openssl pkcs7 -print_certs -in "${valIn}" -out "${valOut}"`;
    } else if (task === 'view-txt') {
      groupIn.style.display = 'block'; labelIn.innerText = 'Certificate File (PEM/DER):';
      groupOut.style.display = 'none';
      groupKey.style.display = 'none';
      groupChain.style.display = 'none';
      cmd = `openssl x509 -in "${valIn}" -text -noout`;
    } else if (task === 'gen-rsa') {
      groupIn.style.display = 'none';
      groupOut.style.display = 'block'; labelOut.innerText = 'Output CSR File:';
      groupKey.style.display = 'block'; labelKey.innerText = 'Output Private Key File:';
      groupChain.style.display = 'none';
      cmd = `openssl req -newkey rsa:2048 -keyout "${valKey}" -out "${valOut}"`;
    } else if (task === 'match-mod') {
      groupIn.style.display = 'block'; labelIn.innerText = 'Certificate File:';
      groupOut.style.display = 'none';
      groupKey.style.display = 'block'; labelKey.innerText = 'Private Key File:';
      groupChain.style.display = 'none';
      cmd = `openssl x509 -noout -pubkey -in "${valIn}" | openssl sha256 && openssl pkey -pubout -in "${valKey}" | openssl sha256`;
    }

    codeArea.innerText = cmd;
  }

  // Copy click listener
  btnCopy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(codeArea.innerText);
      const oldText = btnCopy.innerHTML;
      btnCopy.innerHTML = '&#9989; Copied!';
      setTimeout(() => {
        btnCopy.innerHTML = oldText;
      }, 1500);
    } catch (e) {
      alert("Failed to copy command: " + e.message);
    }
  });

  taskSelect.addEventListener('change', updateCommand);
  inputIn.addEventListener('input', updateCommand);
  inputOut.addEventListener('input', updateCommand);
  inputKey.addEventListener('input', updateCommand);
  inputChain.addEventListener('input', updateCommand);

  updateCommand();
})();
</script>
{% endraw %}

## Certificate & Public Key Pinning (Mobile & Native App Defense)

Standard PKI path validation trusts **any of the ~150+ pre-installed Root CAs** in an OS trust store to issue certificates for your domain. **Certificate Pinning** (or **Public Key Pinning**) restricts native client applications (iOS, Android, IoT) to accept **only specific, pre-declared public key hashes**, bypassing untrusted or compromised CAs.

### Pinning Target Strategies

| Pinning Strategy | Target Object Pinned | Maintenance & Operational Risk | Primary Use Case |
|---|---|---|---|
| **Leaf Certificate Pinning** | Hashes full leaf X.509 certificate | **CRITICAL RISK**: Leaf cert expiration or emergency ACME renewal breaks app connectivity unless app update is deployed. | High-security ephemeral IoT sessions. |
| **Intermediate / Root CA Pinning** | Hashes public key of issuing CA | **MODERATE RISK**: Leaf certs can rotate freely, but issuing CA key rotation or intermediate retirement breaks client connections. | Enterprise mobile applications. |
| **SPKI Public Key Pinning** | Hashes `SubjectPublicKeyInfo` (SPKI) bit string | **HIGH RISK**: Re-issuing leaf certs using the *same key pair* maintains pin validity, but key compromise or emergency key rotation without a valid backup pin breaks connectivity. | Native mobile app transport security. |

### Pinning Scope: Public CA vs. Private CA Deployment

Certificate pinning applies to both Public PKI and Private PKI environments, addressing distinct threat vectors:

- **Public CAs (e.g. Let's Encrypt, DigiCert, Sectigo)**: Mobile OS trust stores pre-install **~150+ commercial Root CAs**. If a single Public CA is compromised or coerced into issuing a fake certificate for your domain (`api.example.com`), standard TLS path validation accepts the forged cert. Pinning your server's **SPKI key hash** forces native apps to ignore all other 150+ Public CAs, ensuring only your specific server key is trusted.
- **Private CAs (Internal / Enterprise PKI)**: Used inside corporate networks, mTLS microservice meshes, and IoT fleets (e.g. HashiCorp Vault PKI, AWS Private CA). Pinning the **Private CA Root/Intermediate key** inside native apps prevents corporate SSL decryption proxies (e.g. Zscaler, Charles Proxy) or user-installed custom root certificates from eavesdropping on enterprise API traffic.

### Security Risks & Threat Vectors of Pinning

While pinning protects network transport against rogue CAs, it introduces significant security trade-offs and threat vectors:

| Security Risk / Threat Vector | Attack Mechanics & Impact | Engineering Mitigation |
|---|---|---|
| **Self-Inflicted Security DoS** | If an emergency key revocation occurs (e.g. private key leak) and no matching backup pin exists in the app binary, deployed client instances lose API connectivity, preventing over-the-air API security patches. | Always configure at least one **Backup SPKI Pin** derived from an offline, cold-storage key pair. |
| **Pin-Jacking / Hostage Attack** | An attacker who briefly compromises server header configurations can inject malicious pins, locking legitimate clients out of the legitimate service indefinitely. | Primary reason **HPKP was deprecated in browsers**. Restrict pinning configurations to signed native app code bundles. |
| **Client-Side Bypass (Frida / Jailbreak)** | Attackers analyzing mobile apps on rooted/jailbroken devices easily bypass pinning using dynamic instrumentation tools (**Frida**, **Objection**) to hook TLS validation routines. | Treat pinning as a network-layer defense, not a client-side reverse engineering barrier. Combine with root/jailbreak detection and obfuscation. |
| **CA Intermediate Migration Failure** | If an issuing CA retires an Intermediate certificate authority (e.g. Let's Encrypt R3 to R10), pinned clients that hardcoded the Intermediate CA key drop connection. | Pin **SubjectPublicKeyInfo (SPKI)** of your own key pair, or pin the **Root CA** key rather than transient Intermediate keys. |

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Pinning Industry Guidance &amp; Deprecation Warning</div>
  <div>
    <strong>Web Browsers (Deprecated) vs. Mobile Native Apps (Situational)</strong>
    <p>Understanding where Certificate Pinning belongs prevents catastrophic self-inflicted Denial of Service (DoS):</p>
    <ul>
      <li><strong>Web Browsers (Deprecated)</strong>: <strong>HTTP Public Key Pinning (HPKP / RFC 7469)</strong> was officially <strong>deprecated and removed from web browsers</strong> (Chrome, Firefox, Safari) due to site-bricking hazards and malicious pin-jacking attacks. Web browsers rely on <strong>Certificate Transparency (CT)</strong> for rogue CA detection instead.</li>
      <li><strong>Mobile &amp; Native Apps (Situational — Use Deliberately)</strong>: Certificate and SPKI pinning can add defense-in-depth for <strong>iOS and Android native applications</strong> against corporate TLS proxies, local MitM interception, and rogue CA issuance. However, both platform vendors caution against reaching for static public key pinning by default: <a href="https://developer.android.com/privacy-and-security/security-config">Android's official guidance</a> and <a href="https://developer.apple.com/news/?id=g9ejcf8y">Apple's PKI guidance</a> advise that pinning carries high operational risk during key rotation, recommending it only for applications with a specific, well-understood threat model and a tested pin-rotation process.</li>
      <li><strong>Backup Pin Recommendation Rule</strong>: If you choose to deploy pinning, mobile app configurations are <strong>strongly recommended</strong> to specify at least one backup pin (a secondary public key hash held in cold storage) to allow key rotation without bricking deployed application instances (Android's documentation advises including a backup pin, though schema validation itself does not block single-pin blocks).</li>
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

## Post-Quantum Hybrid Certificates

As PKI migrates toward quantum safety, Certificate Authorities and standards groups (IETF LAMPS working group) are standardizing **Post-Quantum Hybrid Certificates**:

- **Dual-Algorithm / Composite Certificates** ([draft-ietf-lamps-pq-composite-sigs](https://datatracker.ietf.org/doc/html/draft-ietf-lamps-pq-composite-sigs)): Binds both a classical public key (e.g. RSA-3072 or ECDSA P-256) and a post-quantum public key (e.g. FIPS 204 ML-DSA) under a single composite algorithm identifier.
- **Interoperability & Transition Mechanics**: Non-upgraded legacy clients cannot parse or fall back to verifying only the classical signature component of a composite certificate, as they do not recognize the composite algorithm OID (the IETF draft explicitly notes that upgraded/non-upgraded interoperability is not directly provided by composite signatures). Upgraded/non-upgraded interoperability is therefore achieved through parallel certificates (dual X.509 certificate chains) or negotiated protocol parameters rather than in-place composite fallback.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Certificates &amp; PKI Summary</strong>
    <ul>
      <li><strong>X.509 Trust Chain</strong>: Root CAs sign Intermediate CAs, which sign short-lived Leaf certificates (SAN fields enforce domain matching).</li>
      <li><strong>Automated ACME &amp; ARI (RFC 9773)</strong>: Cert lifespans are shrinking under CA/Browser Forum Baseline Requirements — 200 days now, 100 days from March 2027, 47 days from March 2029. At this cadence, automated renewal via ACME (RFC 8555) and ARI (RFC 9773) is essential in practice.</li>
      <li><strong>Pinning Trade-offs</strong>: Certificate/SPKI pinning carries high operational risk during key rotation. Both Apple and Android guidance recommend against static public key pinning for general web traffic, reserving it for specific threat models with tested backup pins. HPKP is deprecated in web browsers.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 5280**: *Internet X.509 Public Key Infrastructure Certificate and CRL Profile* — [IETF RFC 5280](https://www.rfc-editor.org/rfc/rfc5280)
- **RFC 8555**: *Automatic Certificate Management Environment (ACME)* — [IETF RFC 8555](https://www.rfc-editor.org/rfc/rfc8555)
- **RFC 9773**: *ACME Renewal Information (ARI) Extension* — [IETF RFC 9773](https://www.rfc-editor.org/info/rfc9773)
- **RFC 7469**: *Public Key Pinning Extension for HTTP (Deprecation Notice)* — [IETF RFC 7469](https://www.rfc-editor.org/rfc/rfc7469)
- **CA/Browser Forum Baseline Requirements**: *Baseline Requirements for the Issuance and Management of Publicly-Trusted TLS Server Certificates* — [CA/Browser Forum BRs](https://cabforum.org/working-groups/server/baseline-requirements/requirements/)
- **Android Network Security Config**: *Network Security Configuration Pinning Guidance* — [Android Developer Security Config](https://developer.android.com/privacy-and-security/security-config)
- **Apple PKI Guidance**: *Identity & Public Key Pinning Guidance* — [Apple Developer News](https://developer.apple.com/news/?id=g9ejcf8y)
- **IETF Composite Signatures Draft**: *Composite Signatures For Use in X.509 Public Key Infrastructure* — [draft-ietf-lamps-pq-composite-sigs](https://datatracker.ietf.org/doc/html/draft-ietf-lamps-pq-composite-sigs)
