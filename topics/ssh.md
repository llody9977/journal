---
title: SSH
description: SSH's trust-on-first-use model vs TLS's CA-backed one, key-based authentication, and SSH certificates.
permalink: /topics/ssh/
last_verified: 2026-08-06
---

<span class="eyebrow">Authentication & Authorization / Protocol</span>

# SSH

<p class="lede">The part I need to remember is not another cipher list. SSH and TLS use similar key-agreement and symmetric-protection ideas; the practical difference is how I authenticate the server host key and the user key.</p>

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
The authenticity of host 'server.example.net (203.0.113.10)' can't be established.
ED25519 key fingerprint is SHA256:zy9q4C7U9Ki5kOv7mwmGxyfVbpbwlJMiqU1tCxoh0cM.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

<div class="diagram-frame">
  <img src="{{ '/assets/img/ssh-trust.svg' | relative_url }}" alt="Diagram showing SSH's two separate trust decisions: the client must trust the server's host key, checked against known_hosts (trust-on-first-use), and the server must trust the client's identity, verified against authorized_keys — neither backed by a certificate authority by default." >
  <p class="diagram-caption">No CA in the loop by default — both sides just have to decide to trust a bare key</p>
</div>

In a default TOFU setup, this prompt asks me to make the first identity decision. The fingerprint only helps if I compare it with a value obtained through an independent trusted channel; otherwise an attacker on that first path can present their own key. Once accepted, the host key is cached in `~/.ssh/known_hosts` and later connections are checked against it. SSH can also use host certificates or verified SSHFP records, so TOFU is the default model rather than the protocol's only option.

## Client authentication: password vs. public key

SSH supports both, but they're not equally good ideas:

- **Password authentication** — sent (encrypted, but still) to the server for it to check; vulnerable to brute-force and credential-stuffing against internet-facing servers, and depends entirely on password strength.
- **Public key authentication** — the client proves possession of a private key by signing data bound to the current SSH session and authentication request, the [signing pattern]({{ '/topics/digital-signatures/' | relative_url }}) covered earlier. The server verifies the signature using an authorized public key; the private key is never sent. This removes a human password from the remote authentication path, but it does not make brute force mathematically impossible. Because the public key is not secret, an attacker could theoretically search offline for its matching private key. The search space of a securely generated modern key is simply too large for that attack to be practical. [RFC 4252, Section 7](https://www.rfc-editor.org/rfc/rfc4252#section-7) defines the signed fields and the server's checks.

The comparison is about **effective security strength**, not key length alone. [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032) places Ed25519 at about 128-bit security. If a password has `p` bits of entropy, the idealized difference in exhaustive-search work is about `2^(128-p)`—so I cannot give one fixed multiplier without knowing how the password was generated and how each attempt is checked. A stolen, passphrase-protected private-key file creates a different attack: the attacker can guess its passphrase offline, with the cost controlled by that passphrase and the key-file KDF. Stealing an unlocked key, an agent session, or the client itself bypasses brute force altogether.

In a default OpenSSH setup, the authorized public key is commonly stored in the account's `~/.ssh/authorized_keys`. That file is not a protocol requirement: OpenSSH can use another `AuthorizedKeysFile`, obtain keys through `AuthorizedKeysCommand`, or trust user certificates through `TrustedUserCAKeys`, as documented in [`sshd_config(5)`](https://man.openbsd.org/sshd_config).

After confirming that key-based access, recovery access, and automation all work, disabling password authentication (`PasswordAuthentication no`) removes password guessing and credential stuffing from the SSH service. I should test a second session before reloading the daemon so I do not lock myself out.

## SSH key types

| Type | Status |
|---|---|
| RSA | Still common, especially in older infrastructure; 3072+ bits recommended if used |
| ECDSA | Supported, but see the [nonce-reuse risk]({{ '/topics/digital-signatures/' | relative_url }}#where-real-signature-schemes-go-wrong-the-nonce-trap) covered under Digital Signatures |
| **Ed25519** | Common default for new OpenSSH keys—small and deterministic, so signing does not depend on a fresh random nonce for every signature ([RFC 8709](https://www.rfc-editor.org/rfc/rfc8709)) |

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
$ ssh-keyscan -T 5 github.com 2>/dev/null | ssh-keygen -lf -
3072 SHA256:uNiVztksCsDhcc0u9e8BujQXVUpKZIDTMczCvj3tD2s github.com (RSA)
256 SHA256:p2QAMXNIC1TJYWeIOttrVc98/R1BUFWu3/LiyKgUfQM github.com (ECDSA)
256 SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU github.com (ED25519)
```

Captured on **26 July 2026**. `ssh-keyscan` only retrieves what the current network path presents; it does not authenticate the result. I compare it against the operator's independently published value, such as [GitHub's official SSH key fingerprints](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints).

## SSH certificates: fixing TOFU at scale

TOFU can be manageable for a small personal setup, but it becomes difficult to verify and rotate across a large fleet. **OpenSSH certificates** let administrators trust an SSH CA, then accept host or user keys carrying a valid, scoped, time-limited certificate from that CA. This reduces per-host fingerprint handling. It is conceptually similar to centralized certificate trust, but OpenSSH certificates are not X.509 and use different formats and policy controls.

## Real-world case: the XZ Utils backdoor (2024)

In late March 2024, Microsoft engineer and PostgreSQL developer Andres Freund noticed that SSH logins on a test system were consuming unusual CPU and taking roughly half a second. The extra few hundred milliseconds led him into `liblzma`, the XZ compression library pulled into `sshd` on affected distributions through `systemd`.

What he found was a deliberately planted backdoor ([CVE-2024-3094](https://nvd.nist.gov/vuln/detail/CVE-2024-3094)) affecting XZ/liblzma 5.6.0–5.6.1. The activation chain combined build logic with payload material hidden in release-tarball test files, so a normal source checkout did not reveal the complete delivered behavior. The malicious library could interfere with `sshd` authentication on affected builds and enable attacker-controlled remote code execution.

None of this was a break in SSH's cryptographic protocol. The backdoor sat underneath it in a dependency and was found through an unexpected performance/CPU observation. My lesson is to treat build artifacts and transitive dependencies as part of the security boundary, not to quote one inconsistent slowdown number.

## Common pitfalls

- **Typing `yes` reflexively** at the host authenticity prompt without checking the fingerprint through any independent channel.
- **Ignoring a host-key-changed warning** — legitimate rebuilds, rotations, load-balancer changes, and stale `known_hosts` entries are common causes, while MITM is a serious possible cause. I should verify the new fingerprint out of band before replacing the old entry.
- **Leaving password authentication enabled** on internet-facing servers.
- **Weak private key file permissions** — OpenSSH refuses to use a private key that is accessible to other local users. I keep the key readable only by its owner.
- **One key reused everywhere, no passphrase** — a single laptop compromise then grants access everywhere that key is trusted.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://www.rfc-editor.org/rfc/rfc4252">RFC 4252</a></strong> defines SSH user authentication, while <strong><a href="https://www.rfc-editor.org/rfc/rfc4253">RFC 4253</a></strong> defines the transport protocol. <strong><a href="https://www.rfc-editor.org/rfc/rfc8709">RFC 8709</a></strong> defines Ed25519 and Ed448 for SSH. OpenSSH's own certificate format is documented in its <code>PROTOCOL.certkeys</code> file rather than an RFC.</p>
</div>
