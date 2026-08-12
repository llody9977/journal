---
title: "OWASP Web Vulnerabilities: SQLi, XSS, SSRF & IDOR"
description: Attack mechanics, code-level vulnerability patterns, and defensive engineering controls for the core OWASP web application flaws.
permalink: /topics/owasp-web-security/
last_verified: 2026-08-12
---

<span class="eyebrow">Application Security / Vulnerabilities</span>

# OWASP Web Vulnerabilities: SQLi, XSS, SSRF & IDOR

<p class="lede">Web application vulnerabilities allow attackers to bypass authorization, extract confidential databases, execute arbitrary code, or force servers to make unauthorized internal requests. Eliminating these flaws requires understanding the exact code mechanics that cause them and deploying context-aware defensive controls.</p>

## The Threat & Vulnerability Matrix

Below is a reference breakdown for four critical web application vulnerabilities:

| Vulnerability | Root Cause | Exploit Impact | Primary Defensive Control |
|---|---|---|---|
| **SQL Injection (SQLi)** | Concatenating untrusted user input directly into dynamic database query strings | Full database extraction, data modification, potential remote code execution | **Parameterized queries** (Prepared statements / ORM bindings) |
| **Cross-Site Scripting (XSS)** | Rendering untrusted user input into HTML context without proper encoding | Session hijacking, cookie theft, DOM manipulation in the victim's browser | **Context-aware output encoding** + **Content Security Policy (CSP)** |
| **Server-Side Request Forgery (SSRF)** | Server fetches a remote URL supplied by a user without validating target IP/scheme | Accessing internal microservices, AWS EC2 metadata endpoints (`169.254.169.254`), cloud keys | **Strict URL allowlists** + **Network egress filtering / IMDSv2** |
| **Insecure Direct Object References (IDOR)** | Referencing internal database IDs (e.g., `/api/user/1042`) without checking authorization | Unauthorized reading or modifying other users' private resources | **Enforce object-level authorization checks** on every request |

## Attack Mechanics & Code-Level Defenses

### 1. SQL Injection (SQLi)

#### Vulnerable Pattern (String Concatenation):
```python
# VULNERABLE: Direct string interpolation
cursor.execute(f"SELECT * FROM users WHERE username = '{user_input}' AND password = '{pass_input}'")
```
An attacker submits `' OR '1'='1` to bypass authentication completely.

#### Secure Pattern (Parameterized Query):
```python
# SECURE: Database engine treats input as raw scalar literal, not executable code
cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (user_input, pass_input))
```

### 2. Cross-Site Scripting (XSS)

- **Stored XSS**: Malicious script is saved in the database (e.g., user comment) and executed for every viewing user.
- **Reflected XSS**: Script in URL parameter is reflected back in the HTTP response.
- **DOM XSS**: Client-side JavaScript directly passes untrusted input to an unsafe sink (e.g., `element.innerHTML = location.search`).

#### Defense: Context-Aware Encoding & Content Security Policy (CSP)
- Use framework auto-escaping (React/Vue JSX automatically escapes HTML text nodes).
- Use context-appropriate encoding and safe DOM sinks such as <code>textContent</code>; HTML, attribute, URL, CSS, and JavaScript contexts require different handling.
- Sanitize untrusted content with a maintained HTML sanitizer when the application intentionally allows users to submit HTML.
- Deploy a strict **Content Security Policy (CSP)** HTTP response header:
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com; object-src 'none';
  ```

CSP is defense in depth rather than a substitute for encoding, safe sinks, or sanitization. Apply HTTP Strict Transport Security (HSTS) across the HTTPS site. Use CSP's `frame-ancestors` directive or X-Frame-Options for browser-rendered responses that could be framed; these framing controls add no useful protection to JSON API responses that are not rendered as documents.

### 3. Server-Side Request Forgery (SSRF)

An application accepts a URL parameter (e.g., `https://example.com/fetch_avatar?url=...`) and fetches it from the server side.

#### Vulnerable Exploit Target:
An attacker inputs `http://169.254.169.254/latest/meta-data/iam/security-credentials/role-name` to steal AWS IAM credentials.

#### Secure Controls:
1. **URL Scheme Allowlist**: Restrict allowed schemes to `https://` only (block `file://`, `gopher://`, `dict://`).
2. **Network Layer Isolation**: Resolve DNS and verify the destination IP is not in a private/loopback range (`127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`) before making the HTTP connection.
3. **AWS IMDSv2**: Enforce IMDSv2 on EC2 instances, which requires a session token header (`X-aws-ec2-metadata-token`) that simple SSRF GET requests cannot provide.

### 4. Insecure Direct Object References (IDOR / BOLA)

IDOR occurs when an application exposes a reference to an internal object (such as an auto-incrementing database ID `1042`) without checking if the current user owns or has permission to read that object.

#### Vulnerable Handler:
```python
@app.route("/api/invoice/<invoice_id>")
def get_invoice(invoice_id):
    # VULNERABLE: Fetches invoice by ID directly without checking current_user ownership!
    return db.find_invoice(invoice_id)
```

#### Secure Handler:
```python
@app.route("/api/invoice/<invoice_id>")
def get_invoice(invoice_id):
    invoice = db.find_invoice(invoice_id)
    # SECURE: Explicit object-level authorization check
    if invoice.owner_id != current_user.id:
        raise AuthorizationError("Access denied")
    return invoice
```

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Broken Access Control remains OWASP's top web-application risk; enforce object-level authorization for every operation that uses a client-supplied object reference. Prevent SQL injection with parameterized values plus allowlisting where query structure must be dynamic; prevent XSS with context-appropriate encoding, safe sinks, and sanitization where HTML is allowed, using CSP as defense in depth. Apply HSTS site-wide over HTTPS, and apply <code>frame-ancestors</code> or X-Frame-Options where browser-rendered responses can be framed—not indiscriminately to JSON APIs.</p>
</div>

## Primary references

- **OWASP Top 10:2021**: *Top 10 Web Application Security Risks* — [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- **OWASP ASVS 4.0**: *Application Security Verification Standard* — [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- **OWASP SQL Injection Prevention Cheat Sheet** — verified parameterized values and allowlisting for query parts that cannot use bind variables — [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- **OWASP Cross Site Scripting Prevention Cheat Sheet** — verified context-specific encoding, safe sinks, sanitization, and CSP's defense-in-depth role — [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- **OWASP HTTP Headers Cheat Sheet** — verified the scope of HSTS and browser framing controls — [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
