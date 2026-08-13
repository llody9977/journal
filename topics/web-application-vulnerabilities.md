---
title: Web Application Vulnerabilities & OWASP Top 10
description: Comprehensive technical guide to web application vulnerability engineering, OWASP Top 10 web risks, Injection (SQLi/Command), Cross-Site Scripting (XSS), Server-Side Request Forgery (SSRF), Insecure Deserialization, and Memory Safety (Rust/Go vs C/C++).
permalink: /topics/web-application-vulnerabilities/
last_verified: 2026-08-13
---

<span class="eyebrow">Application Security / Web Vulnerabilities</span>

# Web Application Vulnerabilities & OWASP Top 10

<p class="lede">Web application vulnerabilities arise when software fails to maintain structural boundaries between trusted code execution and untrusted user inputs. Adversaries exploit these implementation flaws to execute unauthorized commands, steal session tokens, or compromise underlying host servers. Securing web applications requires systematic vulnerability engineering across OWASP Top 10 flaw classes, enforcing parameterized interfaces, context-aware output encoding, and adopting memory-safe languages.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/web-application-vulnerabilities.svg' | relative_url }}" alt="Web Application Vulnerability Engineering diagram showing OWASP Top 10 web risks, Injection, XSS, SSRF, Deserialization, and Memory Safety.">
  <p class="diagram-caption">Web Application Vulnerability Engineering Architecture: OWASP Top 10 Risk Categories &leftrightarrow; Parameterized Input/Output Encoding &leftrightarrow; Memory Safety Engineering</p>
</div>

## Primary Web Vulnerability Taxonomy (OWASP Top 10 & CWE)

| Vulnerability Class | Core Mechanism | Operational Exploitation Vector | Primary Technical Defense |
|---|---|---|---|
| **SQL Injection (SQLi)** | Concatenating untrusted strings directly into SQL query statements. | Adversary alters query logic to bypass authentication or dump database contents. | Parameterized queries (`PreparedStatement`), ORMs with bound parameters. |
| **Command Injection** | Passing untrusted inputs to system shell execution calls (`eval`, `exec`). | Arbitrary OS command execution (`/bin/sh`) on host server. | Avoid shell calls; use safe language APIs (`execFile`) with array argument passing. |
| **Cross-Site Scripting (XSS)** | Injecting untrusted HTML/JS strings rendered by victim browsers. | Stealing session cookies, keylogging, executing unauthorized actions in victim browser session. | Context-aware output encoding, Content Security Policy (CSP), `HttpOnly` cookie flags. |
| **Server-Side Request Forgery (SSRF)** | Server forced to fetch external or internal URLs supplied by untrusted user input. | Pivot into internal networks, query cloud metadata services (`169.254.169.254`). | Strict URL destination whitelisting, block private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`). |
| **Insecure Deserialization** | Parsing untrusted object streams into memory without validation. | Executing embedded gadget chains leading to immediate Remote Code Execution (RCE). | Avoid native object deserialization (Java/Python pickle); use safe data formats (JSON/Protobuf). |

## Cross-Site Scripting (XSS) Engineering: Reflected, Stored & DOM

XSS occurs when an application includes untrusted data in a web page without proper validation or escaping:

```
[ Attacker Payload ] ──> Injected into App ──> Browser Renders Page ──> Executes Malicious Script ──> Exfiltrates Session
```

1. **Reflected XSS**: The malicious script is reflected off the web server in an immediate HTTP response (*e.g., error message or search result*).
2. **Stored XSS**: The malicious script is permanently stored in a database or comment field and served to every user viewing the resource.
3. **DOM-Based XSS**: The vulnerability exists entirely in client-side JavaScript code processing data from an untrusted source (*e.g., `location.search`*) into an unsafe sink (*e.g., `element.innerHTML`*).

### Defense: Context-Aware Output Encoding
Escaping must match the specific HTML context where user data is inserted:
- **HTML Body Context**: Convert `&` $\rightarrow$ `&amp;`, `<` $\rightarrow$ `&lt;`, `>` $\rightarrow$ `&gt;`, `"` $\rightarrow$ `&quot;`.
- **JavaScript Variable Context**: Use Unicode escaping (`\uXXXX`) or JSON serialization (`JSON.stringify()`).
- **Attribute Context**: Enforce strict alphanumeric whitelist validation.

## Memory Safety Engineering: Rust / Go vs. C / C++

Spatial and temporal memory corruption vulnerabilities (CWE-119, CWE-416) represent over 70% of critical security patches in C/C++ codebases:

| Memory Vulnerability | Root Architectural Cause | Memory-Safe Language Solution |
|---|---|---|
| **Buffer Overflow (Spatial)** | Writing beyond allocated array boundaries into adjacent stack/heap memory. | **Rust / Go**: Automatic compile-time and runtime array bounds checking. |
| **Use-After-Free (Temporal)** | Dereferencing a pointer after the referenced memory block has been freed. | **Rust**: Compile-time **ownership & borrow checker** preventing dangling references. |
| **Double Free** | Calling `free()` twice on the same pointer, corrupting heap metadata. | **Rust / Go**: Automatic memory lifetime management (Garbage Collection or RAII). |
| **Null Pointer Dereference** | Reading/writing through an uninitialized or null pointer value. | **Rust**: Explicit `Option<T>` type requiring explicit `Some`/`None` handling. |

### Hardening Legacy C/C++ Codebases
When legacy C/C++ code cannot be rewritten immediately, deploy mandatory compiler and OS hardening flags:
- **ASLR & DEP/NX**: Address Space Layout Randomization & Data Execution Prevention (Marking stack/heap non-executable).
- **Stack Canaries**: `-fstack-protector-strong` to detect stack buffer overwrites before function return.
- **Control Flow Integrity (CFI)**: Restricting indirect branch targets to valid functions.

## Essential AppSec Diagnostic Checklist

When auditing a web application for software vulnerabilities, evaluate these 6 criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Parameterized Queries** | Are all database queries constructed using parameterized prepared statements or safe ORM bindings? | Code review SAST query search (`SELECT * FROM ... + var`). |
| **Context-Aware Encoding** | Is dynamic user content sanitized using context-aware encoding functions before browser rendering? | Template engine auto-escaping settings. |
| **SSRF Destination Blocking** | Are outbound server HTTP requests validated against strict FQDN whitelists blocking internal IP ranges? | SSRF proxy configuration &amp; network egress logs. |
| **Safe Data Deserialization** | Is native object deserialization (Java `ObjectInputStream`, Python `pickle`) banned in favor of JSON/Protobuf? | Codebase static analysis scan results. |
| **Memory-Safe Language Selection** | Are new system components authored in memory-safe languages (Rust, Go) rather than C/C++? | Repository language inventory &amp; build manifests. |
| **Compiler Hardening Flags** | Are legacy C/C++ binaries compiled with ASLR, DEP/NX, Stack Canaries, and ASan flags enabled? | Binary security property check (`checksec`). |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Web application vulnerabilities stem from failing to separate instructions from untrusted data. Eliminate SQLi with parameterized queries, prevent XSS via context-aware output encoding and CSP, block SSRF with egress whitelists, and replace C/C++ with memory-safe languages (Rust/Go).</p>
</div>

## Primary references

- **OWASP Top 10 (2021/2025)**: *Web Application Security Risks* — [OWASP Top 10](https://owasp.org/www-project-top-10/)
- **CISA Memory Safety**: *Exploring Memory Safety in Software Development* — [CISA Advisory](https://www.cisa.gov/resources-tools/resources/exploring-memory-safety-software-development)
