---
title: Web Application Vulnerabilities & OWASP Top 10
description: Technical reference for the OWASP Top 10:2025 categories, the injection and cross-site scripting mechanisms behind them, SSRF as an access-control failure, insecure deserialization, and what memory-safe languages do and do not guarantee.
permalink: /topics/web-application-vulnerabilities/
last_verified: 2026-08-14
---

<span class="eyebrow">Application Security / Web Vulnerabilities</span>

# Web Application Vulnerabilities & OWASP Top 10

<p class="lede">Most web application vulnerabilities reduce to one mechanism: somewhere in the request path, data supplied by a user is handed to an interpreter that reads part of it as an instruction. A SQL parser, a browser's HTML parser, an operating system shell, an object deserializer, and a URL fetcher are all interpreters, and each fails the same way. The defenses differ because the interpreters differ, but the question to ask at every boundary is the same one — is this value being passed as data, or is it being concatenated into something that will be parsed?</p>

The OWASP Top 10 is the usual entry point into this subject. It is an **awareness document reflecting a community consensus and contributed vulnerability data — not a standard, a certification scheme, or a compliance requirement.** OWASP's own verification standard, [ASVS](https://owasp.org/www-project-application-security-verification-standard/), is the artifact intended for testing against. Treat the Top 10 as a map of where the losses concentrate, then verify against ASVS.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/web-application-vulnerabilities.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the web application vulnerability classes diagram at full size">
    <img src="{{ '/assets/img/web-application-vulnerabilities.svg' | relative_url }}" alt="Three panels. Injection and cross-site scripting: string concatenation into a parser, and script injected into the browser DOM, remediated by parameterized queries and context-aware encoding. SSRF and insecure deserialization: the server coerced into fetching an internal metadata endpoint, and untrusted object streams running gadget chains, remediated by destination allowlisting with IMDSv2 and by safe data formats. Memory safety: the four corruption classes, what Rust and Go change, and the C and C++ hardening flags, with a footer noting that the guarantee covers safe-subset code only.">
  </a>
  <p class="diagram-caption">The four vulnerability families on this page, each paired with the interpreter it abuses and the control that closes it</p>
</div>

## The OWASP Top 10:2025 categories

The most current released version is the **OWASP Top 10:2025**, published by the OWASP Foundation and linked from the [project page](https://owasp.org/www-project-top-ten/). The ten categories:

| ID | Category | What it covers |
|---|---|---|
| **A01:2025** | **Broken Access Control** | A user acts outside their intended permissions — reading another user's object, invoking an administrative function, or elevating privilege. **Server-Side Request Forgery was a standalone category in 2021 and is folded into A01 in 2025**, on the reasoning that SSRF is the server being coerced past its own access boundary. |
| **A02:2025** | **Security Misconfiguration** | Insecure defaults, unnecessary features enabled, verbose errors, permissive CORS, missing hardening. Moved up from fifth in 2021 to second. |
| **A03:2025** | **Software Supply Chain Failures** | New in 2025. Expands the 2021 *Vulnerable and Outdated Components* category to the whole ecosystem — dependencies, build systems, and distribution infrastructure. |
| **A04:2025** | **Cryptographic Failures** | Data exposed through absent, weak, or misapplied cryptography. Dropped from second to fourth. |
| **A05:2025** | **Injection** | Untrusted data interpreted as part of a command or query. Includes SQL, NoSQL, OS command, LDAP, expression-language injection, and cross-site scripting. Dropped from third to fifth. |
| **A06:2025** | **Insecure Design** | Missing or ineffective control design, as distinct from a defective implementation of a sound design. |
| **A07:2025** | **Authentication Failures** | Renamed from *Identification and Authentication Failures*. Credential stuffing, weak recovery flows, session fixation, absent brute-force limits. |
| **A08:2025** | **Software or Data Integrity Failures** | Code and data accepted without integrity verification — unsigned updates, untrusted deserialization, and CI/CD pipelines that trust unverified input. |
| **A09:2025** | **Security Logging & Alerting Failures** | Renamed from *Security Logging and Monitoring Failures*. Breaches that are not detected, or are detected too late, because events were not recorded or not alerted on. |
| **A10:2025** | **Mishandling of Exceptional Conditions** | New in 2025. Improper error handling, logic errors, and failing open when an abnormal condition occurs. |

Two consequences worth carrying forward. First, **SSRF is now framed as an access-control failure**, which is the more useful mental model — the fix is bounding where the server may go, not sanitizing a string. Second, **A03 and A08 push most software supply chain material off this page**; that subject is covered in [Software Bill of Materials (SBOM) & VEX]({{ '/topics/sbom-dependency-management/' | relative_url }}), [SLSA & Build Provenance Attestations]({{ '/topics/slsa-provenance-attestation/' | relative_url }}), and [CI/CD Pipeline Security & Workload Identity]({{ '/topics/cicd-pipeline-security/' | relative_url }}). Access control as a model — RBAC, ABAC, ReBAC — is in [Authorization Models]({{ '/topics/authorization-models/' | relative_url }}), and object-level enforcement in APIs is in [API & Microservice Security]({{ '/topics/api-microservice-security/' | relative_url }}).

## Injection: where a value becomes an instruction

Injection is the concatenation of untrusted input into a string that an interpreter later parses. The parser cannot distinguish the developer's intent from the attacker's, because by the time it sees the string, both are the same text.

### SQL injection

```python
# VULNERABLE: the input becomes part of the query text before the parser sees it.
cursor.execute(
    f"SELECT * FROM users WHERE username = '{user_input}' AND password = '{pass_input}'"
)
```

Submitting `' OR '1'='1` as `user_input` closes the literal and appends a tautology, so the WHERE clause matches every row.

```python
# SECURE: the query text is fixed; values are bound separately and are never parsed as SQL.
cursor.execute(
    "SELECT * FROM users WHERE username = %s AND password = %s",
    (user_input, pass_input),
)
```

The distinction is not "escaping versus not escaping" — it is that the query structure is sent to the database independently of the values. Two limits are worth stating:

- **Bind parameters cover values, not identifiers.** Table names, column names, and `ORDER BY` direction cannot be bound. Where the query structure must be dynamic, select it from a fixed allowlist in application code rather than interpolating input.
- **An ORM is not automatic protection.** Most ORMs expose a raw-SQL escape hatch, and string interpolation into it reintroduces the same flaw.

### OS command injection

Passing a string to a shell means the shell parses it, so `;`, `|`, `&&`, backticks, and `$()` are all operators.

```python
# VULNERABLE: the shell parses the whole string.
os.system(f"ping -c 1 {host}")

# SECURE: no shell; the argument vector is passed to execve directly.
subprocess.run(["ping", "-c", "1", host], shell=False, check=True)
```

Passing an argument list with no shell removes the metacharacter problem entirely. Where a shell genuinely cannot be avoided, allowlist the input against an explicit pattern — escaping shell metacharacters correctly across shells and locales is difficult to get right and easy to get wrong.

## Cross-site scripting: three delivery paths, one sink

Cross-site scripting (XSS) is injection where the interpreter is the victim's browser. The attacker's script runs inside the origin, so it inherits that origin's cookies, storage, and ability to make same-origin requests.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/xss-execution-flow.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the cross-site scripting execution flow diagram at full size">
    <img src="{{ '/assets/img/xss-execution-flow.svg' | relative_url }}" alt="Three delivery paths converge on one browser. Reflected XSS travels in a crafted link and returns in the immediate response; stored XSS is written to the database once and served to every later viewer; DOM-based XSS never reaches the server, moving from a client-side source such as location.search into an unsafe sink such as innerHTML. All three end at the same point — the browser parses attacker text as script inside the origin — and a footer contrasts the server-side fix, context-aware encoding on output, with the client-side fix, assigning to textContent instead of innerHTML.">
  </a>
  <p class="diagram-caption">Three delivery paths, one failure: the browser parses attacker-supplied text as script inside the origin</p>
</div>

1. **Reflected XSS** — the payload travels in the request (typically a query parameter) and is echoed into the immediate response. It needs the victim to follow a crafted link.
2. **Stored XSS** — the payload is persisted server-side and served to every subsequent viewer. No per-victim delivery step is needed, which makes it the more severe of the two.
3. **DOM-based XSS** — the payload never has to reach the server. Client-side JavaScript reads a source it does not control (`location.search`, `location.hash`, `postMessage` data) and writes it to a sink that parses HTML or evaluates code (`innerHTML`, `outerHTML`, `document.write`, `eval`, `setTimeout` with a string). Server-side output encoding does not touch this path.

### Encoding has to match the sink

Escaping is context-dependent. The same string is safe in one position and executable in another.

| Insertion context | Correct handling |
|---|---|
| **HTML text node** | Encode `&` as `&amp;`, `<` as `&lt;`, `>` as `&gt;`, `"` as `&quot;`, and `'` as `&#x27;`. |
| **Quoted HTML attribute** | Quote the attribute, then encode every non-alphanumeric character below U+00FF as `&#xHH;`. Never place untrusted data in an unquoted attribute — a space or slash ends the attribute and starts a new one. |
| **Inside a `<script>` block** | Prefer not to. Where unavoidable, emit the value with Unicode escapes (`\uXXXX`). `JSON.stringify()` alone is **not** sufficient here: its output can contain `</script>`, U+2028, and U+2029, each of which breaks out of or terminates the script context. |
| **URL attribute (`href`, `src`)** | Validate the scheme against an allowlist before encoding. Percent-encoding does not stop `javascript:` — the scheme is read before the path. |
| **CSS value** | Encode non-alphanumerics as `\HH`, and reject `expression()` and `url()` containing untrusted input. |

Three structural defenses do more work than escaping rules:

- **Framework auto-escaping.** React, Vue, and Angular escape interpolated text by default. The vulnerability moves to the deliberate escape hatches — `dangerouslySetInnerHTML`, `v-html`, `bypassSecurityTrustHtml` — which is a much smaller surface to audit.
- **Safe sinks.** Assigning to `textContent` cannot execute script; assigning to `innerHTML` can. Where the application genuinely must accept user HTML, run it through a maintained sanitizer (DOMPurify) rather than a hand-written filter, and prefer [Trusted Types](https://www.w3.org/TR/trusted-types/) where browser support allows, which makes unsafe sink assignment a runtime error.
- **Content Security Policy** as defense in depth — see [Client-Side & Mobile Security]({{ '/topics/client-side-mobile-security/' | relative_url }}) for the nonce and `strict-dynamic` form. **CSP is a second line, not a substitute for encoding**; the CSP Level 3 draft says so directly.

`HttpOnly` on session cookies stops script from *reading* the cookie. It does not stop script from *using* it: an XSS payload can still issue same-origin requests that the browser attaches the cookie to. It reduces the impact; it does not contain the flaw.

## Server-side request forgery: bounding where the server may go

In SSRF the attacker supplies a URL and the server fetches it. The server's network position is the prize — it can usually reach an internal network, a service mesh, and a cloud metadata endpoint that the attacker cannot reach directly.

The canonical target is the link-local instance metadata service:

```
http://169.254.169.254/latest/meta-data/iam/security-credentials/<role-name>
```

On an unprotected EC2 instance this returns temporary IAM credentials. Layered controls, in the order they should be applied:

1. **Allowlist the destination.** Restrict the scheme to `https` (blocking `file:`, `gopher:`, `dict:`, `ftp:`) and the host to an explicit set. An allowlist of permitted destinations is the only control here that fails closed; a blocklist of forbidden ones does not.
2. **Re-check the resolved address, not the hostname.** Resolve DNS, then verify the resolved IP is not loopback (`127.0.0.0/8`, `::1`), **link-local (`169.254.0.0/16`, `fe80::/10`)**, private (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`), or otherwise internal — and connect to that verified address. Checking the hostname alone loses to DNS rebinding, where the name resolves to a permitted address at validation time and an internal one at connection time.
3. **Do not follow redirects,** or re-run the full check on every hop. A permitted host answering `302 Location: http://169.254.169.254/` bypasses a validator that only inspected the original URL.
4. **Enforce IMDSv2 on EC2.** IMDSv2 requires a `PUT` to obtain a session token, then an `X-aws-ec2-metadata-token` header on each request, and sets a low IP TTL. A basic SSRF that only issues `GET` requests to an attacker-chosen URL cannot satisfy it. Azure IMDS requires `Metadata: true` and GCP requires `Metadata-Flavor: Google` for the same reason.
5. **Filter egress at the network.** An egress proxy or security-group rule that denies the metadata range and internal ranges outright bounds the damage when application-layer validation is bypassed.

Note the framing change: because A01:2025 absorbs SSRF, the review question is *where is this server permitted to go*, which is an authorization question, rather than *is this string clean*.

## Insecure deserialization

Native deserializers do not merely parse data — they reconstruct objects, and reconstruction runs code. Java's `ObjectInputStream` invokes `readObject`, Python's `pickle` invokes `__reduce__`, and PHP's `unserialize` invokes `__wakeup` and `__destruct`. An attacker who controls the byte stream chains together methods already present in the application's dependencies (a *gadget chain*) to reach code execution, without needing any vulnerability in those libraries individually.

- **Do not deserialize untrusted input with a native object deserializer.** This is the whole control. Use a data-only format — JSON, Protocol Buffers, MessagePack — parsed into a declared schema or type.
- Where a native deserializer is unavoidable, apply a strict **allowlist** of permitted classes at the deserializer (Java's `ObjectInputFilter`), not a blocklist of known gadget classes; new gadget chains are found in common libraries regularly.
- **Signing the payload does not make deserialization safe** if the signing key is reachable by the attacker, and it does nothing about a legitimate but malicious client.

This category maps to **A08:2025 Software or Data Integrity Failures**.

## Memory safety: what Rust and Go actually guarantee

Memory-corruption bugs are not web-specific, but they sit underneath the web stack — in TLS terminators, image and font parsers, XML libraries, and the runtimes themselves — so they end up in the exploit path of web applications.

The frequently quoted proportion is real but is often attached to the wrong claim. Chromium reports that **around 70% of its high-severity security bugs are memory-safety problems**, from an analysis of 912 high or critical severity bugs affecting the Stable channel since 2015. Microsoft has reported a similar proportion of the CVEs it assigns annually. Separately, CISA and partners found that **52% of 172 critical open source projects contained code written in memory-unsafe languages, and 55% of the total lines of code across those projects were memory-unsafe**. These are three different measurements; none of them is a general statement about "critical patches."

| Corruption class | Root cause | What a memory-safe language changes |
|---|---|---|
| **Buffer overflow (spatial)** | A write passes the end of an allocation into adjacent memory. | **Rust and Go** bounds-check indexing. The check is at runtime for dynamic indices — the compiler elides it only where it can prove the index is in range — and a failed check panics rather than corrupting memory. |
| **Use-after-free (temporal)** | A pointer is dereferenced after the allocation it names has been freed. | **Rust** rejects it at compile time through ownership and the borrow checker. **Go** prevents it with garbage collection: an object is not collected while a reference exists. |
| **Double free** | `free()` is called twice on the same pointer, corrupting allocator metadata. | **Rust** frees exactly once when the owner goes out of scope. **Go** does not expose manual free at all. |
| **Null pointer dereference** | A null or uninitialized pointer is read or written. | **Rust** has no null; absence is `Option<T>` and must be handled explicitly. **Go** still permits a nil dereference, but it panics deterministically rather than corrupting memory — a crash, not a corruption primitive. |

### What the guarantee does not cover

Stating memory safety as absolute is the common error, and it matters because it changes where review effort goes:

- **Rust `unsafe` blocks** suspend the aliasing and bounds guarantees. Every class above is reachable inside one. Audit `unsafe` explicitly; it is where the memory bugs in Rust codebases live.
- **Foreign function interfaces** — Rust FFI, Go's `cgo`, JNI — call into C. Nothing on the other side of that boundary is checked.
- **Go data races can break memory safety.** Concurrent writes to an interface value or a slice header are not atomic, and a torn write can produce a pointer that was never valid. Go's guarantee holds for race-free programs; run the race detector in CI.
- **Memory safety is not logic safety.** Rust does not prevent SQL injection, broken access control, or a path-traversal bug. It removes one class.

### Hardening C and C++ that will not be rewritten

| Mitigation | Build or platform setting | What it does |
|---|---|---|
| **ASLR** | Compile and link position-independent (`-fPIE -pie`) | Randomizes image base addresses, so an exploit cannot hardcode target addresses. |
| **DEP / NX** | Non-executable stack (`-Wl,-z,noexecstack`), non-executable heap | Marks writable pages non-executable, forcing code reuse rather than injected shellcode. |
| **Stack canaries** | `-fstack-protector-strong` | Detects a linear stack overwrite before the function returns. |
| **RELRO** | `-Wl,-z,relro,-z,now` | Makes the GOT read-only after relocation, removing a common overwrite target. |
| **Fortified libc** | `-D_FORTIFY_SOURCE=3 -O2` | Substitutes bounds-checked variants of common string and memory functions where sizes are known. |
| **Control-flow integrity** | Clang `-fsanitize=cfi`, or hardware CFI — Intel CET shadow stacks, ARM BTI and pointer authentication | Restricts indirect branch targets, breaking ROP and JOP chains. |

Verify what actually shipped rather than what the build script claims, with `checksec --file=<binary>` or `hardening-check`.

**AddressSanitizer belongs in CI, not in production.** ASan is a bug-finding instrumentation with roughly 2x slowdown and a large memory overhead, it is incompatible with static linking, and it is not a mitigation — it detects errors during testing. Run it in test and fuzzing pipelines; do not ship it as a hardening flag.

## Cross-site request forgery, and two client-side classes worth knowing

- **CSRF** is not injection: the attacker makes the *victim's browser* issue an authenticated request, relying on the browser attaching cookies automatically. The defenses are the `SameSite` cookie attribute (Chromium-based browsers treat a cookie that omits it as `Lax`, which blocks cross-site `POST`, but set it explicitly rather than relying on a browser default), an anti-CSRF token bound to the session, and — for sensitive operations — re-authentication. Note that CSRF defenses and XSS defenses are independent: an XSS payload runs in the origin and can read the anti-CSRF token.
- **Prototype pollution** — a merge or clone routine that copies attacker-controlled `__proto__`, `constructor`, or `prototype` keys mutates `Object.prototype` process-wide, turning a data write into a logic change elsewhere in the application. Reject those keys explicitly or use `Object.create(null)` for parsed data.
- **Client-side template injection** — passing untrusted input into a client-side template compiler evaluates it as an expression, which reaches script execution even where HTML is escaped.

## Web application review checklist

The checklist below is a journal working model, not a published audit standard. When auditing a web application, evaluate these eight criteria:

| Diagnostic area | Evaluation question | Verification &amp; audit evidence |
|---|---|---|
| **Query parameterization** | Are all database queries constructed with bound parameters, and where query structure is dynamic, is it selected from a fixed allowlist rather than interpolated? | SAST results for string-built SQL, ORM raw-query call sites, code review of dynamic `ORDER BY` and identifier paths. |
| **Shell avoidance** | Do subprocess calls pass an argument vector with no shell, rather than a composed command string? | Grep for `shell=True`, `os.system`, `exec` with a single string; SAST command-injection rules. |
| **Context-correct encoding** | Is output encoding chosen by insertion context, with framework auto-escaping on and every escape hatch (`dangerouslySetInnerHTML`, `v-html`) individually justified? | Template engine configuration, an inventory of escape-hatch call sites, DOM sink review for `innerHTML`. |
| **SSRF destination binding** | Are outbound fetch destinations allowlisted, is the *resolved IP* re-checked against loopback, link-local, and private ranges before connecting, and are redirects blocked or re-validated? | Fetch wrapper source, DNS-resolution guard tests, egress proxy policy, IMDSv2 enforcement setting. |
| **Deserialization format** | Is native object deserialization of untrusted input absent, in favor of a schema-validated data format? | Static scan for `ObjectInputStream`, `pickle.loads`, `unserialize`, `yaml.load` without `SafeLoader`. |
| **Memory-safe boundaries** | For memory-safe components, are `unsafe` blocks and FFI boundaries inventoried and separately reviewed, and does CI run the race detector? | `unsafe` block inventory, `cgo` and JNI call sites, CI configuration for `-race`. |
| **Binary hardening evidence** | For shipped C and C++ binaries, are PIE, NX, stack protector, RELRO, and fortification present in the built artifact — with ASan confined to test builds? | `checksec` output on release artifacts, build flag diff between test and release pipelines. |
| **CSRF and cookie posture** | Do state-changing endpoints require an anti-CSRF token or an equivalent, with session cookies setting `SameSite` explicitly? | Framework CSRF middleware configuration, `Set-Cookie` header capture, a cross-origin `POST` test. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Every one of these is the same failure — untrusted data reaching an interpreter that reads part of it as instruction — so the fix is always structural separation, not filtering. Bind query parameters, pass argument vectors instead of shell strings, encode for the exact insertion context, and never deserialize untrusted input with a native object deserializer. SSRF is an access-control problem in the 2025 list: allowlist the destination, re-check the <em>resolved</em> IP against loopback, link-local and private ranges, block redirects, and enforce IMDSv2. Memory-safe languages remove one bug class in safe-subset code only — <code>unsafe</code>, FFI, and Go data races are still live.</p>
</div>

## Primary references

- **[OWASP Top 10 project page](https://owasp.org/www-project-top-ten/)** — verified that the most current released version is the OWASP Top Ten 2025, and that the document is an awareness document rather than a standard.
- **[OWASP Top 10:2025 introduction](https://owasp.org/Top10/2025/0x00_2025-Introduction/)** — verified the ten category identifiers and titles, the two new categories, the A07 and A09 renames, and that SSRF is rolled into A01.
- **[OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)** — verified that ASVS, not the Top 10, is the OWASP artifact intended for verification and testing.
- **[OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)** — verified that bind parameters cover values only and that allowlisting is the recommended treatment for dynamic identifiers.
- **[OWASP Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)** — verified the per-context encoding rules, the safe-sink guidance, and CSP's defense-in-depth role.
- **[OWASP Server Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)** — verified destination allowlisting, resolved-address validation, and the DNS rebinding and redirect bypasses.
- **[AWS: Use IMDSv2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html)** — verified the session-token requirement and why a plain SSRF `GET` cannot satisfy it.
- **[The Chromium Projects: Memory safety](https://www.chromium.org/Home/chromium-security/memory-safety/)** — verified the ~70% figure and its scope: 912 high or critical severity Stable-channel bugs since 2015.
- **[CISA: Exploring Memory Safety in Critical Open Source Projects](https://www.cisa.gov/resources-tools/resources/exploring-memory-safety-critical-open-source-projects)** — verified the 52% of projects and 55% of lines of code findings across 172 projects.
- **[Google: AddressSanitizer](https://github.com/google/sanitizers/wiki/AddressSanitizer)** — verified the ~2x slowdown, the static-linking incompatibility, and that ASan is a testing tool rather than a production mitigation.
