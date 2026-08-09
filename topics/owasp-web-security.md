---
title: "OWASP Web Vulnerabilities: SQLi, XSS, SSRF & IDOR"
description: Attack mechanics, code-level vulnerability patterns, and defensive engineering controls for the core OWASP web application flaws.
permalink: /topics/owasp-web-security/
last_verified: 2026-08-06
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
- Deploy a strict **Content Security Policy (CSP)** HTTP response header:
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com; object-src 'none';
  ```

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

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>OWASP Web Security Summary</strong>
    <ul>
      <li><strong>Top Web Vulnerabilities</strong>: Broken Access Control (#1), Cryptographic Failures (#2), Injection (#3), Insecure Design (#4).</li>
      <li><strong>Defense Against Injection</strong>: Parameterized SQL queries, contextual output encoding (XSS defense), and CSP headers.</li>
      <li><strong>Security Headers</strong>: Enforce Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), and X-Frame-Options across all endpoints.</li>
    </ul>
  </div>
</div>

## Primary References

- **OWASP Top 10:2021**: *Top 10 Web Application Security Risks* — [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- **OWASP ASVS 4.0**: *Application Security Verification Standard* — [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
