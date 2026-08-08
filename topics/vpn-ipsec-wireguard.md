---
title: "Secure Tunneling: IPsec, WireGuard & SSH Bastions"
description: How I secure network transport across untrusted boundaries using IPsec, WireGuard, OpenVPN, and SSH Bastion architectures.
permalink: /topics/vpn-ipsec-wireguard/
last_verified: 2026-08-06
---

<span class="eyebrow">Network Security / Transport</span>

# Secure Tunneling: IPsec, WireGuard & SSH Bastions

<p class="lede">When IP traffic travels over untrusted networks (such as the public internet or untrusted Wi-Fi), it is vulnerable to eavesdropping, tampering, and IP spoofing. Secure tunneling protocols encapsulate and cryptographically protect packets between endpoints, creating virtual private channels across untrusted infrastructure.</p>

## What is secure tunneling: encapsulating network traffic

Secure tunneling wraps an original network packet inside an outer transport packet protected by **Authenticated Encryption with Associated Data (AEAD)**. The receiving gateway verifies payload integrity, decrypts the inner packet, and routes it to the target network.

Tunneling provides three vital security guarantees:

1. **Confidentiality**: Payload and inner IP headers are encrypted (protecting internal IP addresses from external exposure).
2. **Integrity & Authenticity**: Every packet carries a cryptographic authentication tag; altered or replayed packets are dropped immediately.
3. **Identity Binding**: Tunnel endpoints verify peer identity (via public keys or certificates) before passing traffic.

## Comparing tunneling protocols: IPsec vs WireGuard vs OpenVPN

When evaluating VPN protocols for site-to-site or remote access connections, compare architecture, crypto primitives, and operational complexity:

| Protocol | Layer | Handshake / Crypto Primitives | Strengths | Trade-offs / Weaknesses |
|---|---|---|---|---|
| **IPsec (IKEv2)** | Network (Layer 3) | **IKEv2** (Diffie-Hellman), AES-GCM / ChaCha20-Poly1305 | OS-native support (iOS, macOS, Windows, Android); standardized; hardware-accelerated | Complex configuration state machine; large code footprint; complex NAT traversal |
| **WireGuard** | Network (Layer 3) | **Noise IK** handshake, Noise protocol framework, Curve25519, ChaCha20-Poly1305, BLAKE2s | ~4,000 lines of code (audit-friendly); modern crypto; state-of-the-art speed & low latency; seamless roaming | Fixed modern crypto suite (no agility/negotiation by design); static IP assignments in default config |
| **OpenVPN** | Transport (Layer 4, UDP/TCP) | TLS-based handshake, custom protocol, OpenSSL backend | Operates over TCP 443 (traverses strict corporate firewalls); mature | User-space processing overhead (slower throughput); complex OpenSSL dependency surface |

### WireGuard's crypto key routing design
WireGuard binds each peer's public key directly to its assigned internal IP address inside the interface configuration (`AllowedIPs`). When a packet arrives, WireGuard decrypts it, verifies that the source IP matches the public key's `AllowedIPs` mapping, and drops spoofed packets before they reach the routing table.

## SSH Bastion Host architecture for administrative access

For interactive server administration without exposing SSH ports directly to the public internet, deployment architectures use an **SSH Bastion Host** (Jump Server) combined with SSH ProxyJump (`-J`):

```bash
# Connect to private database server via public bastion host
ssh -J admin@bastion.example.com admin@10.0.2.45
```

### SSH Bastion Security Hardening Rulebook
1. **Disable password authentication**: Permit public-key or SSH certificate authentication only (`PasswordAuthentication no`).
2. **Enforce short-lived SSH Certificates**: Issue temporary, signed certificates (via OpenSSH CA or Vault SSH Secrets Engine) with 1-8 hour lifetimes rather than distributing static `authorized_keys`.
3. **Restrict Bastion Shell**: Limit bastion user capabilities so compromised keys cannot execute local commands on the bastion host itself.

## Network Tunnel Selection Rulebook

1. **WireGuard**: Primary choice for site-to-site tunnels and modern VPN infrastructure (minimal attack surface, high performance).
2. **IPsec (IKEv2)**: Selected when client devices require native OS VPN integration without installing third-party agents.
3. **Short-Lived SSH Certificates + ProxyJump**: Standard for interactive engineer access to private VPC resources.
