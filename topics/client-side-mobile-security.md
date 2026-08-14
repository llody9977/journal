---
title: Client-Side & Mobile Security
description: Technical reference for the browser origin model and the controls that relax or constrain it (CORS, CSP, SRI, COOP/COEP), the response headers worth setting and what each actually bounds, and the iOS and Android isolation and key-storage models with the MASVS control groups.
permalink: /topics/client-side-mobile-security/
last_verified: 2026-08-14
---

<span class="eyebrow">Application Security / Client & Mobile</span>

# Client-Side & Mobile Security

<p class="lede">The client runs on hardware the operator does not control. A determined user can read process memory, unpack a binary, patch it, and rewrite every request in transit — so no client-side check is a security boundary, and any secret shipped to a client is disclosed. What the client <em>does</em> provide is a set of browser- and OS-enforced boundaries that a server can configure but not replace: the origin model in the browser, and the app sandbox plus hardware-backed key storage on mobile. Client-side security engineering is mostly the work of configuring those boundaries correctly and knowing precisely what each one bounds.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/client-side-mobile-security.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the client-side and mobile security controls diagram at full size">
    <img src="{{ '/assets/img/client-side-mobile-security.svg' | relative_url }}" alt="Three panels. Browser isolation: the same-origin policy as the default boundary, CORS as the server-controlled relaxation of it, and CSP with SRI as added constraints on what may execute. Mobile platform isolation: Android per-app UIDs with SELinux, the iOS sandbox where all third-party apps run as the user mobile, and key storage in the Android Keystore backed by a TEE or StrongBox and in the iOS Keychain with keys protected by the Secure Enclave. Client-side hardening: response headers, never storing session tokens in localStorage, and reverse-engineering defenses that raise cost without being a boundary.">
  </a>
  <p class="diagram-caption">The three boundaries a client actually enforces, and where each one stops</p>
</div>

## The origin, and the controls that relax or constrain it

An **origin** is the triple of scheme, host, and port — `https://app.example.com:443`. The **same-origin policy (SOP)** is the browser's default: script running in one origin may not read the DOM or the response body of another. It is a read restriction, which is the detail that explains most of what follows.

SOP does not prevent *sending* cross-origin requests. A form `POST` or an image load reaches another origin regardless; the browser simply withholds the response from script. That asymmetry is why CSRF exists as a separate class (covered in [Web Application Vulnerabilities & OWASP Top 10]({{ '/topics/web-application-vulnerabilities/' | relative_url }})) — the request succeeds even though the attacker never sees the answer.

| Mechanism | What it does | How it fails when misconfigured |
|---|---|---|
| **CORS** | Lets a server opt into having its responses readable by a named origin, via `Access-Control-Allow-Origin` and related headers. It is a *relaxation* of SOP, granted by the responding server. | Reflecting the request's `Origin` header into the response while also sending `Access-Control-Allow-Credentials: true` makes every origin trusted, and authenticated responses become readable by any site. `Access-Control-Allow-Origin: *` cannot be combined with credentials, so the reflection pattern is the dangerous one. A permissive regex matching `example.com.attacker.net` is the other common form. |
| **CSP** | Constrains which sources the page may load and execute, independent of origin. | A policy containing `'unsafe-inline'` permits exactly the inline execution it exists to stop. A host-allowlist policy is bypassable through a JSONP endpoint or open redirect on any allowlisted host. A policy with no `object-src` or `base-uri` leaves plugin and base-tag injection open. |
| **SRI** | Pins a third-party script or stylesheet to a cryptographic digest, so a modified file is refused. | A missing or stale `integrity` attribute lets a compromised CDN serve modified script — the Magecart pattern. A subresource without `crossorigin` set will not be checked for a cross-origin fetch. |
| **COOP / COEP / CORP** | Isolate the browsing context: COOP severs the `window.opener` relationship with cross-origin openers, CORP declares who may embed a resource, and COEP requires embedded resources to opt in. | Without COOP, a cross-origin opener retains a handle to the window. Cross-origin isolation (COOP `same-origin` plus COEP `require-corp`) is also the precondition for `SharedArrayBuffer` and high-resolution timers, which is why Spectre-class mitigation and this configuration are linked. |

### Writing a policy that is actually strict

The host-allowlist form of CSP is the one most commonly deployed and the weakest. The CSP Level 3 draft's authoring guidance advances nonces, hashes, and `'strict-dynamic'` instead:

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'nonce-r4nd0mPerResponse' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none';
  form-action 'self';
  require-trusted-types-for 'script';
  report-to csp-endpoint;
```

- The **nonce must be unpredictable and regenerated per response**. A static nonce is equivalent to `'unsafe-inline'`.
- **`'strict-dynamic'`** propagates trust from a nonced script to scripts it loads, and causes supporting browsers to ignore host allowlists entirely. Any host list left in the policy then serves only as a fallback for browsers without Level 3 support.
- **`object-src 'none'` and `base-uri 'none'`** close plugin execution and base-tag injection, neither of which `script-src` covers.
- **`require-trusted-types-for 'script'`** turns unsafe DOM sink assignment into a runtime error, which is the strongest available answer to DOM-based XSS. Check browser support before relying on it.
- **Roll out in `Content-Security-Policy-Report-Only` first**, collect violations at a reporting endpoint, and only then enforce. A policy deployed enforcing without a report phase breaks the application.

**CSP is defense in depth.** The specification says so directly: it "is not intended as a first line of defense against content injection vulnerabilities."

## Response headers, and what each one actually bounds

These are worth setting on a browser-rendered application. They are engineering recommendations here, not a normative requirement of any single standard.

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
Cross-Origin-Opener-Policy: same-origin
```

- **HSTS** ([RFC 6797](https://datatracker.ietf.org/doc/html/rfc6797)) tells the browser to use HTTPS for this host for `max-age` seconds, which closes the SSL-stripping window **after the policy has been cached**. It is trust-on-first-use: the very first request, before any policy is stored, is still strippable. Preloading removes that gap, and **sending the `preload` token does not put a domain on the preload list** — inclusion requires submission at [hstspreload.org](https://hstspreload.org/) plus a valid certificate, an HTTP-to-HTTPS redirect on port 80, HTTPS on every subdomain, and `max-age` of at least 31536000. The site notes that preloading is a long commitment because removal takes months to propagate; treat it as a deliberate decision rather than a default.
- **Framing control**: CSP's `frame-ancestors` is the current mechanism and takes precedence where supported; `X-Frame-Options: DENY` remains useful as a fallback for older browsers. Its `ALLOW-FROM` value is obsolete and ignored. Neither adds protection to a JSON API response that is never rendered as a document.
- **`X-Content-Type-Options: nosniff`** stops content-type sniffing, so a response served as `text/plain` is not reinterpreted as script. It only works if the `Content-Type` is actually correct.
- **`Referrer-Policy`** bounds what leaks in the `Referer` header — path and query strings routinely carry identifiers and tokens.
- **`Permissions-Policy`** disables powerful features for the document and its frames, reducing what a compromised or malicious embedded frame can request.

### Cookies and where tokens live

```http
Set-Cookie: __Host-session=...; Secure; HttpOnly; SameSite=Lax; Path=/
```

- **`HttpOnly`** stops script *reading* the cookie. It does not stop script *using* it: an XSS payload can still issue same-origin requests that the browser attaches the cookie to. It reduces impact; it does not contain the flaw.
- **`Secure`** confines the cookie to HTTPS.
- **`SameSite`** — set it explicitly. `Lax` is the right default for a session cookie: it blocks cross-site `POST` while still allowing top-level navigation to arrive authenticated. `Strict` is stronger but breaks any inbound link, including OAuth and SSO returns, so reserve it for cookies no cross-site navigation needs to carry.
- **The `__Host-` prefix** makes the browser enforce that the cookie was set with `Secure`, no `Domain` attribute, and `Path=/`, which prevents a subdomain from overwriting it.
- **Do not put session tokens in `localStorage`.** Any script running in the origin can read it, so a single XSS is a complete token theft, and it persists across tabs and restarts with no expiry the browser enforces. An `HttpOnly` cookie is not readable by script at all. Where an architecture genuinely requires a token in JavaScript, keep it in memory only and accept that it does not survive a reload.

## Mobile: two different isolation models

"iOS and Android both sandbox apps" is true and hides a real difference in how, which matters when reasoning about what a compromise reaches.

- **Android assigns each app a distinct Linux UID** and runs it in its own process; the kernel enforces separation through standard user and group ID mechanisms. Since Android 9, non-privileged apps targeting API level 28 or higher additionally run in **per-app SELinux domains**, adding mandatory access control on top of the UID-based discretionary control.
- **iOS does not use per-app UIDs.** Apple's platform documentation states that system files and resources, and all third-party apps, run as the non-privileged user `mobile`. Isolation comes from a mandatory **sandbox profile** applied to every third-party app plus a **randomly assigned per-app home directory**, with the operating system partition mounted read-only.

Both models prevent app A from reading app B's files. Only the mechanism differs — which is exactly the sort of distinction that matters when a platform-specific bypass is reported.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/mobile-sandbox-key-storage.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the mobile app sandbox and key storage diagram at full size">
    <img src="{{ '/assets/img/mobile-sandbox-key-storage.svg' | relative_url }}" alt="Two device columns compared. Android: each app has its own Linux UID with kernel-enforced separation and a per-app SELinux domain since Android 9, and the Keystore holds key material in a TEE or in StrongBox, which requires its own CPU, secure storage and true random number generator. iOS: all third-party apps run as the user mobile, isolated by a mandatory sandbox profile and a randomly assigned home directory, and the Keychain is an encrypted SQLite database on the file system whose per-item keys are protected by the Secure Enclave rather than stored inside it. A footer states that key material staying inside secure hardware means the app can request an operation but cannot export the key.">
  </a>
  <p class="diagram-caption">Same guarantee, two mechanisms — and where key material actually sits on each platform</p>
</div>

### Key storage

The property worth wanting is that **key material never becomes readable by the app**: the app asks the secure hardware to perform an operation and receives the result, and an attacker with full app-process compromise still cannot export the key.

- **Android Keystore.** Keys are generated and used inside a **Trusted Execution Environment** — typically TrustZone on an ARM SoC — or, on devices that support it, inside **StrongBox**, which the platform defines as an implementation in a discrete or integrated secure element with its own CPU, secure storage, a true random number generator, a secure timer, and tamper-resistance mechanisms. StrongBox is slower, more resource-constrained, and supports a limited algorithm set, so it is warranted where physical tampering is in the threat model rather than everywhere.
- **iOS Keychain.** The keychain is **an encrypted SQLite database stored on the file system**, not storage inside the Secure Enclave. Items are encrypted with a metadata key and a per-item secret key; Apple documents that the metadata key is protected by the Secure Enclave but cached in the Application Processor for query speed, while the secret key always requires a round trip through the Secure Enclave. Separately, keys can be generated directly in the Secure Enclave so the private key never exists outside it.
- **Neither platform uses a TPM.** The TPM is a Trusted Computing Group specification for PC-class platforms; the mobile equivalents are the Secure Enclave, the TEE, and StrongBox or a discrete secure element.
- Anything sensitive that is not in one of these — `SharedPreferences`, an app-directory SQLite file, `NSUserDefaults`, a log line — is readable from a backup or a rooted device.

### MASVS control groups

The [OWASP Mobile Application Security Verification Standard](https://mas.owasp.org/MASVS/) defines **eight** control groups:

| Group | Coverage |
|---|---|
| **MASVS-STORAGE** | Secure storage of sensitive data on the device, including what must not be logged or backed up. |
| **MASVS-CRYPTO** | Correct use of platform cryptographic primitives and key management. |
| **MASVS-AUTH** | Authentication and authorization, including local biometric and device-credential flows. |
| **MASVS-NETWORK** | Secure network communication, including transport security and identity pinning. |
| **MASVS-PLATFORM** | Safe interaction with the platform and other apps — IPC, deep links, WebViews, custom URL schemes. |
| **MASVS-CODE** | Code quality and build settings, including dependency and update handling. |
| **MASVS-RESILIENCE** | Resistance to reverse engineering and tampering. |
| **MASVS-PRIVACY** | Privacy properties: data minimization, transparency, and user control. |

MASVS states the requirements; the **MASTG** (Mobile Application Security Testing Guide) provides the test cases that verify them.

### Pinning and resilience, in proportion

- **Certificate or public-key pinning** constrains which certificate chain the app will accept, defeating a user-installed interception CA. The cost is operational: a pinned key that rotates without a shipped update bricks the app for every installed client. Pin to a public key rather than a leaf certificate, ship at least one backup pin, and have a remote kill switch. MASVS-NETWORK treats identity pinning as a defense-in-depth control rather than a baseline requirement, which is the right calibration — it is warranted for high-value flows, not universally.
- **MASVS-RESILIENCE controls** — root and jailbreak detection, anti-debugging, obfuscation via R8, ProGuard, or DexGuard — raise the cost of analysis. They do not create a boundary. An attacker with the device and enough time defeats all of them, and treating a root check as an authorization control puts the decision on the attacker's hardware. Use them to slow mass automated abuse; never to protect a secret that the server could protect instead.
- **Attestation moves the decision server-side**, which is the structural fix: Google's **Play Integrity API** and Apple's **App Attest** and **DeviceCheck** produce a signed verdict that the *server* validates. Even then, treat it as one signal in a risk decision rather than a binary gate.

## Client and mobile review checklist

The checklist below is a journal working model, not a published audit standard. When auditing a web or mobile client, evaluate these eight criteria:

| Diagnostic area | Evaluation question | Verification &amp; audit evidence |
|---|---|---|
| **CORS origin handling** | Are allowed origins matched against an explicit list, rather than reflecting the `Origin` header or matching a loose pattern — especially where credentials are allowed? | CORS middleware source, response header capture for a forged `Origin`, a test with a suffix-matching hostile origin. |
| **CSP strength and rollout** | Does the policy use per-response nonces with `strict-dynamic` rather than a host allowlist, set `object-src` and `base-uri`, and was it rolled out report-only first? | Header capture across routes, CSP Evaluator output, nonce generation code, violation report volume. |
| **Subresource integrity** | Do externally hosted `script` and `link` elements carry an `integrity` digest — SHA-256, SHA-384, or SHA-512 — with `crossorigin` set? | HTML source inspection, build-time SRI generation step, a tampered-asset load test. |
| **Transport policy** | Is HSTS set with an adequate `max-age`, and if the domain relies on preloading, is it actually on the preload list rather than merely sending the token? | Header capture, preload list lookup for the domain, subdomain HTTPS coverage check. |
| **Cookie and token placement** | Are session cookies `Secure`, `HttpOnly`, `SameSite`-explicit and `__Host-` prefixed, with no session token in `localStorage`? | `Set-Cookie` capture, client storage inspection, a grep for token writes to `localStorage`. |
| **Mobile key storage** | Is every long-lived secret held in the Android Keystore or the iOS Keychain, with key material non-exportable, rather than in preferences, plain files, or logs? | Key generation call sites, a filesystem and backup dump of the app container, log review on a debug build. |
| **Platform interaction surface** | Are exported components, deep links, custom URL schemes, and WebView settings reviewed — with JavaScript interfaces and file access disabled unless needed? | Manifest and `Info.plist` review, WebView configuration, an IPC fuzz or intent-replay test. |
| **Server-side enforcement** | Is every decision the client appears to make — entitlement, price, role, root status — re-decided server-side, with attestation verdicts validated on the server? | API authorization tests issued with a patched or proxied client, attestation verification code path. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Nothing the client enforces is a boundary — re-decide everything server-side, and ship no secret to a client. The same-origin policy restricts <em>reading</em>, not sending, which is why CSRF is a separate problem and why reflecting the <code>Origin</code> header with credentials allowed is the dangerous CORS mistake. Prefer per-response nonces with <code>strict-dynamic</code> over host allowlists, and remember HSTS is trust-on-first-use — the <code>preload</code> token alone does not put a domain on the preload list. On mobile, Android isolates by per-app UID and SELinux while iOS runs every third-party app as <code>mobile</code> under a sandbox profile; the iOS Keychain is an encrypted database whose keys are protected by the Secure Enclave, not storage inside it, and neither platform uses a TPM.</p>
</div>

## Primary references

- **[W3C Content Security Policy Level 3](https://www.w3.org/TR/CSP3/)** — a **W3C Working Draft** (13 August 2026), intended to become a Recommendation; verified the nonce, hash, and `'strict-dynamic'` authoring guidance and the statement that CSP is defense in depth rather than a first line of defense.
- **[W3C Subresource Integrity](https://www.w3.org/TR/sri-1/)** — a W3C Recommendation (23 June 2016); verified that conformant user agents must support SHA-256, SHA-384, and SHA-512.
- **[RFC 6797: HTTP Strict Transport Security](https://datatracker.ietf.org/doc/html/rfc6797)** — verified the policy semantics and the trust-on-first-use limitation.
- **[HSTS Preload List submission](https://hstspreload.org/)** — verified that the `preload` token is a request for inclusion rather than inclusion itself, and the certificate, redirect, subdomain, and `max-age` requirements.
- **[Apple Platform Security: Security of runtime process](https://support.apple.com/guide/security/security-of-runtime-process-sec15bfe098e/web)** — verified that third-party iOS apps run as the non-privileged user `mobile`, are sandboxed, and receive a randomly assigned home directory.
- **[Apple Platform Security: Keychain data protection](https://support.apple.com/guide/security/keychain-data-protection-secb0694df1a/web)** — verified that the keychain is a SQLite database on the file system and that the per-item secret key requires a round trip through the Secure Enclave.
- **[Android: Application sandbox](https://source.android.com/docs/security/app-sandbox)** — verified per-app UID assignment, kernel-level enforcement, and per-app SELinux domains from Android 9 for apps targeting API 28 or higher.
- **[Android Keystore system](https://developer.android.com/privacy-and-security/keystore)** — verified the TEE and StrongBox backing options and the StrongBox hardware requirements.
- **[OWASP MASVS](https://mas.owasp.org/MASVS/)** — verified the eight control groups and the division of responsibility between MASVS and the MASTG.
