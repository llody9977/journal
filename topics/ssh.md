---
title: SSH Architecture & Authentication
description: Technical breakdown of SSH protocols (RFC 4252/4253), Trust-On-First-Use (TOFU), Ed25519 key pairs, OpenSSH Certificates, and SSH vs TLS comparison.
permalink: /topics/ssh/
last_verified: 2026-08-06
---

<span class="eyebrow">Authentication & Authorization / Protocol</span>

# SSH Architecture & Authentication

<p class="lede">Secure Shell (SSH) provides encrypted remote shell access, command execution, and network tunneling. While SSH and TLS utilize identical cryptographic primitives for transport encryption (ECDHE key agreement, AEAD bulk ciphers), SSH relies on a Trust-On-First-Use (TOFU) or OpenSSH Certificate trust model rather than hierarchical X.509 Certificate Authorities.</p>

## SSH vs TLS: Architectural Comparison

| Security Dimension | TLS 1.3 (RFC 8446) | SSH v2 (RFC 4253 / RFC 4252) |
|---|---|---|
| **Server Authentication** | Hierarchical X.509 Certificate Authority (Root ──> Intermediate ──> Leaf) | **Trust-On-First-Use (TOFU)** via bare host keys or **OpenSSH Certificates** |
| **Client Authentication** | Optional X.509 Client Certificates (mTLS) | Mandatory User Authentication (Public Key, Password, or OpenSSH Cert) |
| **Key Agreement** | Ephemeral (EC)DHE (X25519, NIST P-256) | Ephemeral (EC)DH (`curve25519-sha256`, `ecdh-sha2-nistp256`) |
| **Bulk AEAD Encryption** | AES-256-GCM, ChaCha20-Poly1305 | `chacha20-poly1305@openssh.com`, `aes256-gcm@openssh.com` |
| **Trust Anchor Storage** | Operating System / Browser Trust Store | Local `~/.ssh/known_hosts` file |

---

## Trust-On-First-Use (TOFU) Model & Host Key Verification

When a client connects to an SSH server for the first time, the client verifies the server's bare host key using TOFU:

<div class="diagram-frame">
  <img src="{{ '/assets/img/ssh-trust.svg' | relative_url }}" alt="SSH host-key trust flow showing known-host verification, first-use acceptance, and host-key mismatch failure.">
  <p class="diagram-caption">The host key authenticates the SSH server before user authentication begins</p>
</div>

<div class="callout warn">
  <span class="callout-title">The Host Key Changed Security Alert</span>
  <p>If a host key in <code>~/.ssh/known_hosts</code> mismatches the key presented during a connection, OpenSSH aborts the session immediately. This alerts users to potential Man-in-the-Middle (MitM) key interception or unauthorized server replacement.</p>
</div>

---

## OpenSSH Public Key Types & Recommendations

| Algorithm | Key Length / Curve | Recommended Status | Cryptographic Properties |
|---|---|---|---|
| **Ed25519** | 256-bit Edwards Curve | **PRIMARY DEFAULT** | Constant-time execution, deterministic signature nonces (RFC 8709). |
| **RSA-3072 / 4096** | 3,072+ bits | Approved Legacy | High compatibility; larger signatures and slower key generation. |
| **ECDSA P-256 / P-384** | NIST Curves | Accepted | Requires secure per-signature random nonces (Vulnerable to nonce reuse). |
| **DSA** | 1024-bit | **PROHIBITED** | Disabled in modern OpenSSH releases due to small key size and weak math. |

---

## OpenSSH Certificate Authority (CA) Architecture

To eliminate TOFU fingerprint prompts across enterprise fleets, organizations deploy an **OpenSSH Certificate Authority**:

<div class="diagram-frame">
  <img src="{{ '/assets/img/ssh-user-ca.svg' | relative_url }}" alt="OpenSSH user certificate flow from a user CA through a short-lived user certificate to a validating SSH server.">
  <p class="diagram-caption">The server trusts the user CA public key and validates certificate principals and expiry</p>
</div>

1. **Host Certificates**: Servers present host certificates signed by an OpenSSH Host CA. Clients trust all servers bearing valid CA signatures, eliminating `known_hosts` prompts.
2. **User Certificates**: Users authenticate using short-lived (1–8 hour) certificates signed by an OpenSSH User CA, eliminating static `authorized_keys` management.

---

## OpenSSH CLI Commands

```bash
# 1. Generate an Ed25519 SSH key pair
ssh-keygen -t ed25519 -C "admin@enterprise.com" -f ~/.ssh/id_ed25519

# 2. Inspect SSH public key fingerprint
ssh-keygen -lf ~/.ssh/id_ed25519.pub
# Output: 256 SHA256:zy9q4C7U9Ki5kOv7mwmGxyfVbpbwlJMiqU1tCxoh0cM admin@enterprise.com (ED25519)

# 3. Retrieve remote server host key fingerprints out-of-band
ssh-keyscan -t ed25519 github.com 2>/dev/null | ssh-keygen -lf -
# Output: 256 SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU github.com (ED25519)
```
