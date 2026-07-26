---
title: SSH
description: SSH's trust-on-first-use model vs TLS's CA-backed one, key-based authentication, and SSH certificates.
permalink: /topics/ssh/
---

<span class="eyebrow">Authentication & Authorization / Deep Dive</span>

# SSH

<p class="lede">SSH runs on the same basic transport-security shape as the <a href="{{ '/topics/tls-ssl-handshake/' | relative_url }}">TLS handshake</a> — an asymmetric key exchange sets up symmetric encryption and a MAC for the session. What's genuinely different is the trust model: by default, SSH has no equivalent of a Certificate Authority at all.</p>

## SSH vs TLS: same mechanics, different trust model

| | TLS | SSH |
|---|---|---|
| Key exchange | (EC)DHE, per connection | (EC)DH, per connection — same underlying idea |
| Bulk encryption | AES-GCM / ChaCha20-Poly1305 | Same families, negotiated per session |
| Server identity backing | [CA-signed certificate]({{ '/topics/certificates/' | relative_url }}), chain of trust to a pre-installed root | **A bare key pair by default** — no third party vouches for it |
| How a client learns to trust the server | Automatic — root already in the OS/browser trust store | **Trust On First Use (TOFU)** — the client just has to decide to trust it the first time, and remember |

That last row is the entire practical difference worth understanding.

## The "authenticity of host can't be established" prompt

Anyone who's used SSH has seen this:

```
The authenticity of host 'example.com (93.184.216.34)' can't be established.
ED25519 key fingerprint is SHA256:zy9q4C7U9Ki5kOv7mwmGxyfVbpbwlJMiqU1tCxoh0cM.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

<div class="diagram-frame">
  <img src="{{ '/assets/img/ssh-trust.svg' | relative_url }}" alt="Diagram showing SSH's two separate trust decisions: the client must trust the server's host key, checked against known_hosts (trust-on-first-use), and the server must trust the client's identity, verified against authorized_keys — neither backed by a certificate authority by default." >
  <p class="diagram-caption">No CA in the loop by default — both sides just have to decide to trust a bare key</p>
</div>

Typing `yes` here is the **only** identity check SSH is offering you — there's no CA silently doing it for you like there is with a browser and TLS. If an attacker is actively intercepting this specific connection (a coffee-shop Wi-Fi MITM, for instance), this prompt is the one and only moment that would reveal it, by showing a fingerprint that doesn't match the real server's. Answering `yes` without checking the fingerprint against a value obtained through some other trusted channel skips that check entirely. Once accepted, the fingerprint is cached in `~/.ssh/known_hosts`, and future connections are silently verified against it — which is also why a *sudden* "**WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED**" message is something to actually stop and investigate, not click past.

## Client authentication: password vs. public key

SSH supports both, but they're not equally good ideas:

- **Password authentication** — sent (encrypted, but still) to the server for it to check; vulnerable to brute-force and credential-stuffing against internet-facing servers, and depends entirely on password strength.
- **Public key authentication** — the client proves possession of a private key by signing a server-issued challenge, the exact [signing pattern]({{ '/topics/digital-signatures/' | relative_url }}) covered earlier. The private key never leaves the client, and there's nothing to brute-force remotely. The server just needs that public key listed in the account's `~/.ssh/authorized_keys`.

Disabling password authentication entirely (`PasswordAuthentication no` in `sshd_config`) removes an entire class of remote attacks against any internet-facing SSH server.

## SSH key types

| Type | Status |
|---|---|
| RSA | Still common, especially in older infrastructure; 3072+ bits recommended if used |
| ECDSA | Supported, but see the [nonce-reuse risk]({{ '/topics/digital-signatures/' | relative_url }}#where-real-signature-schemes-go-wrong-the-nonce-trap) covered under Digital Signatures |
| **Ed25519** | **Recommended default** for new keys — small, fast, and immune to the nonce-reuse failure class entirely ([RFC 8709](https://www.rfc-editor.org/rfc/rfc8709)) |

## Practical demo: generating and inspecting a key

```
$ ssh-keygen -t ed25519 -f demo_ed25519 -C "demo@cryptography-notes"

Generating public/private ed25519 key pair.
Your identification has been saved in demo_ed25519
Your public key has been saved in demo_ed25519.pub
The key fingerprint is:
SHA256:zy9q4C7U9Ki5kOv7mwmGxyfVbpbwlJMiqU1tCxoh0cM demo@cryptography-notes
The key's randomart image is:
+--[ED25519 256]--+
|.o               |
| .E              |
|o  .             |
|.. o ..o         |
|. = *o*oS        |
| O *.B+o.o       |
|+ X.o+*.  o      |
| o *+=. . ..     |
| .+o*=.... ..    |
+----[SHA256]-----+
```

The public key that gets shared (e.g. pasted into a server's `authorized_keys`, or a GitHub account):

```
$ cat demo_ed25519.pub
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFBWaDIzuMeqjYDm/hPVPOkNnBDJBOKMGLcvtn+QNtpc demo@cryptography-notes
```

To fetch and verify a server's host key fingerprint out-of-band before ever connecting interactively:

```
$ ssh-keyscan example.com
example.com ssh-ed25519 AAAA...
```

(This alone doesn't *prove* authenticity — it just retrieves the key. The fingerprint still needs to be confirmed through some channel you already trust, like a value published by the server's operator.)

## SSH certificates: fixing TOFU at scale

TOFU works fine for a personal server, but breaks down badly across a fleet of thousands of hosts and engineers — nobody manually verifies fingerprints at that scale, so in practice TOFU becomes "click yes and hope." **SSH certificates** (a lesser-known but well-supported OpenSSH feature) fix this the same way TLS fixed it for the web: a CA signs short-lived certificates for both host keys and user keys, so trust is established once (trusting the CA) instead of once per host or per user, forever. Tools like `step-ssh`, HashiCorp Vault's SSH secrets engine, and Teleport are built around exactly this model, typically issuing certificates valid for hours, not indefinitely.

## Real-world case: the XZ Utils backdoor (2024)

In late March 2024, Microsoft engineer and PostgreSQL developer Andres Freund noticed that SSH logins on a system he was benchmarking were taking around 500ms instead of the usual ~100ms — a small enough anomaly that most people would never have investigated it. He did, and traced the slowdown to excessive CPU time inside `liblzma`, the XZ compression library that several Linux distributions link into `sshd` via `systemd`.

What he found was a deliberately planted backdoor ([CVE-2024-3094](https://nvd.nist.gov/vuln/detail/CVE-2024-3094)), built into `liblzma` versions 5.6.0–5.6.1 by a contributor going by "Jia Tan," who had spent roughly two years patiently building commit history and trust in the project before shipping the malicious code — hidden inside binary test files in the release tarballs, not visible in the public git history at all. The payload intercepted SSH authentication and gave anyone holding a specific attacker-controlled private key the ability to run arbitrary code on the affected server, ahead of any password or SSH key check the operator thought was protecting it.

None of this was a failure of SSH's own trust model — the key-based authentication and TOFU mechanics described above worked exactly as designed. The backdoor sat one layer beneath it, in a compression dependency almost nobody audits line-by-line, and it was caught not by a security review but by one engineer noticing a **100-millisecond** performance regression during unrelated benchmarking. It's a sobering companion case to the same supply-chain risk flagged for [downloaded model files]({{ '/topics/ai-llm-security/' | relative_url }}#model-supply-chain-integrity-scanning-hashing-signing) — verify what you're running, however deep in the dependency tree it sits, because "it's just a compression library" is exactly the kind of dependency nobody thinks to distrust.

## Common pitfalls

- **Typing `yes` reflexively** at the host authenticity prompt without checking the fingerprint through any independent channel.
- **Ignoring a host-key-changed warning** — the single most likely signal of an active MITM attempt, easy to dismiss as "the server was probably just reinstalled."
- **Leaving password authentication enabled** on internet-facing servers.
- **Weak private key file permissions** — SSH will refuse to use a private key that's group- or world-readable; this isn't pedantry, it's the client protecting you from a key any other local user could read.
- **One key reused everywhere, no passphrase** — a single laptop compromise then grants access everywhere that key is trusted.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.rfc-editor.org/rfc/rfc4253">RFC 4253</a></strong> defines the SSH transport protocol. <strong><a href="https://www.rfc-editor.org/rfc/rfc8709">RFC 8709</a></strong> defines Ed25519 and Ed448 for SSH. OpenSSH's own certificate format is documented in its <code>PROTOCOL.certkeys</code> file rather than an RFC.</p>
</div>

## Where this fits

SSH reuses the same [asymmetric]({{ '/topics/asymmetric-cryptography/' | relative_url }}) and [key-exchange]({{ '/topics/key-exchange-derivation/' | relative_url }}) machinery as TLS, which is exactly why understanding one makes the other faster to pick up — the real difference worth remembering is entirely about trust distribution, not cryptography.
