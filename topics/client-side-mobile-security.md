---
title: Client-Side & Mobile Security
description: Comprehensive technical guide to client-side browser isolation (SOP, CORS, CSP, Subresource Integrity - SRI), HTTP security headers, and Mobile Application Security (iOS/Android sandboxing, Keychain/Keystore, MASVS).
permalink: /topics/client-side-mobile-security/
last_verified: 2026-08-13
---

<span class="eyebrow">Application Security / Client & Mobile</span>

# Client-Side & Mobile Security

<p class="lede">Web browsers and mobile devices are untrusted execution environments operating directly on end-user hardware. Unlike backend servers controlled by enterprise operators, client-side applications execute in environments where adversaries can inspect memory, reverse-engineer binaries, and manipulate network traffic. Securing client-side web applications requires enforcing Same-Origin Policy (SOP), strict Content Security Policy (CSP) headers, and Subresource Integrity (SRI). Securing mobile applications requires iOS/Android sandboxing, hardware-backed Keystore encryption, and OWASP MASVS alignment.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/client-side-mobile-security.svg' | relative_url }}" alt="Client-Side and Mobile Security diagram showing SOP, CORS, CSP, Subresource Integrity (SRI), and iOS/Android sandboxing (MASVS).">
  <p class="diagram-caption">Client-Side &amp; Mobile Security Architecture: Browser Isolation Controls (SOP/CORS/CSP/SRI) &leftrightarrow; Mobile Hardware Sandboxing &amp; Keystore Storage</p>
</div>

## Browser Isolation Primitives: SOP, CORS, CSP & SRI

Web browsers enforce security boundaries through standardized browser policy engines:

| Browser Security Mechanism | Technical Boundary &amp; Operational Function | Security Failure Mode If Misconfigured |
|---|---|---|
| **Same-Origin Policy (SOP)** | Restricts scripts on Origin A (`https://app.example.com:443`) from reading DOM data or network responses from Origin B (`https://bank.com:443`). | Foundation of browser security; prevents arbitrary cross-site data theft. |
| **Cross-Origin Resource Sharing (CORS)** | Mechanism allowing servers to relax SOP safely via HTTP response headers (`Access-Control-Allow-Origin: https://app.example.com`). | Wildcard origins (`*`) or reflecting untrusted `Origin` headers allows unauthorized cross-site data exfiltration. |
| **Content Security Policy (CSP)** | Restricts the sources from which scripts, stylesheets, images, and worker threads can be loaded and executed by the browser. | Disables inline scripts (`'unsafe-inline'`) to prevent Cross-Site Scripting (XSS) payload execution. |
| **Subresource Integrity (SRI)** | Verifies that scripts fetched from Third-Party CDNs have not been tampered with by checking cryptographic hashes (`integrity="sha384-..."`). | Protects against compromised CDN supply-chain attacks (e.g. Magecart script injection). |

### Example Hardened CSP Header
```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com 'sha256-abc123...'; object-src 'none'; frame-ancestors 'none'; base-uri 'self';
```

## Mandatory Client-Side HTTP Security Headers

Web servers must return protective HTTP response headers to harden browser behavior:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

- **HSTS**: Forces browsers to communicate exclusively over HTTPS for 1 year, eliminating SSL stripping attacks.
- **X-Frame-Options**: Set to `DENY` or `SAMEORIGIN` to prevent Clickjacking framing attacks.
- **X-Content-Type-Options**: Set to `nosniff` to prevent browsers from MIME-sniffing non-executable content into executable JavaScript.

## Mobile Application Security Architecture (OWASP MASVS)

Mobile applications (iOS & Android) operate under distinct operating system security models:

<div class="diagram-frame">
  <img src="{{ '/assets/img/client-side-mobile-security.svg' | relative_url }}" alt="Mobile Application Security Architecture showing sandbox and hardware enclave storage.">
  <p class="diagram-caption">Mobile OS Security: Application Sandboxing &leftrightarrow; Hardware Enclave Keystore Storage</p>
</div>

1. **Application Sandboxing**: iOS and Android assign a unique User ID (UID) and isolated filesystem directory to every installed app. App A cannot read App B's local files.
2. **Hardware-Backed Keystore**: Sensitive cryptographic keys, tokens, and biometric credentials must be stored in **iOS Keychain (Secure Enclave)** or **Android Keystore (TEE/StrongBox)**, never in unencrypted local storage (`SharedPreferences` or SQLite).
3. **OWASP MASVS Categories**:
   - **MASVS-STORAGE**: Secure storage of sensitive data.
   - **MASVS-CRYPTO**: Proper cryptographic implementation using platform primitives.
   - **MASVS-NETWORK**: Secure network communication (enforcing Certificate Pinning for high-risk banking apps).
   - **MASVS-RESILIENCE**: Reverse-engineering defenses (root/jailbreak detection, anti-debugging, code obfuscation via DexGuard/ProGuard).

## Essential Client & Mobile Security Diagnostic Checklist

When auditing a web or mobile application client, evaluate these 6 criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **CORS Wildcard Audit** | Are CORS headers restricted to explicit trusted origins rather than wildcard (`*`) or reflected origins? | HTTP response header analysis. |
| **Strict CSP Enforcement** | Does the Content Security Policy disable `'unsafe-inline'` and `'unsafe-eval'` script execution? | Browser CSP header inspection &amp; CSP Evaluator tests. |
| **Subresource Integrity (SRI)** | Do external CDN `<script>` tags carry valid SHA-384 cryptographic integrity hashes? | HTML source code inspection (`integrity="sha384-..."`). |
| **Session Cookie Hardening** | Are session cookies configured with `HttpOnly`, `Secure`, and `SameSite=Strict` attributes? | Browser cookie inspector inspection. |
| **Hardware Keystore Usage** | Do mobile apps store tokens exclusively in iOS Keychain or Android Keystore with biometric backing? | Mobile app source code &amp; static binary audit reports. |
| **Certificate Pinning** | Do mobile apps enforce TLS certificate public key pinning for critical backend API connections? | Network proxy interception testing (Charles / Burp Suite). |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Browsers enforce isolation via Same-Origin Policy (SOP), CORS, CSP, and SRI. Secure mobile apps by storing credentials in hardware-backed Keystore/Keychain, enforcing TLS certificate pinning, and aligning with OWASP MASVS.</p>
</div>

## Primary references

- **OWASP MASVS**: *Mobile Application Security Verification Standard* — [OWASP MASVS](https://mas.owasp.org/MASVS/)
- **W3C Content Security Policy**: *CSP Level 3 Specification* — [W3C Recommendation](https://www.w3.org/TR/CSP3/)
