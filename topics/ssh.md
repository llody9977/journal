---
title: SSH Architecture & Authentication
description: Technical breakdown of SSH protocols (RFC 4252/4253), Trust-On-First-Use (TOFU), Ed25519 key pairs, OpenSSH Certificates, and SSH vs TLS comparison.
permalink: /topics/ssh/
last_verified: 2026-08-12
---

<span class="eyebrow">Authentication & Authorization / Protocol</span>

# SSH Architecture & Authentication

<p class="lede">Secure Shell (SSH) provides encrypted remote shell access, command execution, and network tunneling. SSH and TLS negotiate similar classes of modern cryptographic primitives for transport encryption (ECDHE-family key agreement, AEAD bulk ciphers)—but the concrete algorithm suites, wire framing, and key-derivation constructions differ between the two protocols, so the primitives are analogous, not interchangeable or identical. Where the protocols diverge structurally is server trust: SSH relies on a Trust-On-First-Use (TOFU) or OpenSSH Certificate trust model rather than hierarchical X.509 Certificate Authorities.</p>

## SSH vs TLS: Architectural Comparison

| Security Dimension | TLS 1.3 ([RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html), obsoletes RFC 8446) | SSH v2 (RFC 4253 / RFC 4252) |
|---|---|---|
| **Server Authentication** | Hierarchical X.509 Certificate Authority (Root ──> Intermediate ──> Leaf) | **Trust-On-First-Use (TOFU)** via bare host keys or **OpenSSH Certificates** |
| **Client Authentication** | Optional X.509 Client Certificates (mTLS) | Mandatory User Authentication (Public Key, Password, or OpenSSH Cert) |
| **Key Agreement** | Ephemeral (EC)DHE (X25519, NIST P-256) | Ephemeral (EC)DH (`curve25519-sha256`, `ecdh-sha2-nistp256`) |
| **Bulk AEAD Encryption** | AES-256-GCM, ChaCha20-Poly1305 | `chacha20-poly1305@openssh.com`, `aes256-gcm@openssh.com` |
| **Trust Anchor Storage** | Operating System / Browser Trust Store | Local `~/.ssh/known_hosts` file |

## Trust-On-First-Use (TOFU) Model & Host Key Verification

When a client connects to an SSH server for the first time, the client verifies the server's bare host key using TOFU:

<div class="diagram-frame">
  <img src="{{ '/assets/img/ssh-trust.svg' | relative_url }}" alt="SSH host-key trust flow showing known-host verification, first-use acceptance, and host-key mismatch failure.">
  <p class="diagram-caption">The host key authenticates the SSH server before user authentication begins</p>
</div>

<div class="callout warn">
  <span class="callout-title">The Host Key Changed Security Alert</span>
  <p>If a host key in <code>~/.ssh/known_hosts</code> mismatches the key presented during a connection, the OpenSSH client's default configuration (<a href="https://man.openbsd.org/ssh_config.5#StrictHostKeyChecking">StrictHostKeyChecking</a> set to <code>ask</code> or <code>accept-new</code>) refuses to proceed and warns of potential Man-in-the-Middle (MitM) key interception or unauthorized server replacement. This refusal is a client-configuration behavior, not a protocol guarantee: setting <code>StrictHostKeyChecking no</code> instead permits the connection to proceed without requiring interactive confirmation, subject to the restrictions <a href="https://man.openbsd.org/ssh_config.5#StrictHostKeyChecking">documented for that setting</a> — this does not necessarily mean no warning is printed at all, only that the client no longer blocks on one.</p>
</div>

## OpenSSH Public Key Types & Recommendations

| Algorithm | Key Length / Curve | Recommended Status | Cryptographic Properties |
|---|---|---|---|
| **Ed25519** | 256-bit Edwards Curve | **PRIMARY DEFAULT** | Deterministic signature nonces derived from the message and secret key, removing reliance on an RNG per signature ([RFC 8032](https://www.rfc-editor.org/rfc/rfc8032), applied to SSH via [RFC 8709](https://www.rfc-editor.org/rfc/rfc8709)); the curve's design also makes constant-time implementations comparatively easy to achieve, but constant-time execution itself is a property of the implementation, not something either RFC mandates. |
| **RSA-3072 / 4096** | 3,072+ bits | Approved Legacy | High compatibility; larger signatures and slower key generation. |
| **ECDSA P-256 / P-384** | NIST Curves | Accepted | Requires secure per-signature random nonces (Vulnerable to nonce reuse). |
| **DSA** | 1024-bit | **PROHIBITED** | Disabled in modern OpenSSH releases due to small key size and weak math. |

## OpenSSH Certificate Authority (CA) Architecture

To eliminate TOFU fingerprint prompts across enterprise fleets, organizations deploy an **OpenSSH Certificate Authority**:

<div class="diagram-frame">
  <img src="{{ '/assets/img/ssh-user-ca.svg' | relative_url }}" alt="OpenSSH user certificate flow from a user CA through a short-lived user certificate to a validating SSH server.">
  <p class="diagram-caption">The server trusts the user CA public key and validates certificate principals and expiry</p>
</div>

1. **Host Certificates**: Servers present host certificates signed by an OpenSSH Host CA. Clients trust all servers bearing valid CA signatures, eliminating `known_hosts` prompts.
2. **User Certificates**: Users authenticate using short-lived (1–8 hour) certificates signed by an OpenSSH User CA, eliminating static `authorized_keys` management.

## OpenSSH CLI Commands

```bash
# 1. Generate an Ed25519 SSH key pair
ssh-keygen -t ed25519 -C "admin@enterprise.com" -f ~/.ssh/id_ed25519

# 2. Inspect SSH public key fingerprint
ssh-keygen -lf ~/.ssh/id_ed25519.pub
# Output: 256 SHA256:zy9q4C7U9Ki5kOv7mwmGxyfVbpbwlJMiqU1tCxoh0cM admin@enterprise.com (ED25519)

# 3. Collect a remote server's host key fingerprint for known_hosts
ssh-keyscan -t ed25519 github.com 2>/dev/null | ssh-keygen -lf -
# Output: 256 SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU github.com (ED25519)
```

<div class="callout warn">
  <span class="callout-title">ssh-keyscan Is Not an Out-of-Band Verification Method</span>
  <p><code>ssh-keyscan</code> fetches the host key over the same network path being verified, and it cannot authenticate the key it returns—an attacker positioned on that path can substitute their own key without detection. OpenBSD's <a href="https://man.openbsd.org/ssh-keyscan.1">ssh-keyscan manual</a> states this directly: its output "should be verified out of band, or only used directly for host authentication if the network is trusted." <code>ssh-keyscan</code> is a convenience for <em>collecting</em> a key to add to <code>known_hosts</code>—the collected fingerprint still needs independent out-of-band verification (for example, comparing it against a fingerprint the server operator publishes through a separate channel, such as GitHub's published SSH key fingerprints) before it is trusted.</p>
</div>

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Static keys scattered across <code>authorized_keys</code> files scale poorly and cause key sprawl; short-lived SSH certificates signed by a central CA let hosts verify against one CA public key instead. <code>ssh-keyscan</code> fetches a host key over the same network path being verified, so its output still needs independent out-of-band verification before it's trusted.</p>
</div>

## Primary references

- **OpenSSH Certificates**: *OpenSSH Certificate Architecture Protocol* — [OpenSSH Specs](https://www.openssh.com/specs.html)
- **RFC 4253**: *The Secure Shell (SSH) Transport Layer Protocol* — [IETF RFC 4253](https://www.rfc-editor.org/rfc/rfc4253)
