---
title: "Secure Tunneling: IPsec, WireGuard & SSH Bastions"
description: Securing network transport across untrusted boundaries using IPsec, WireGuard, OpenVPN, and SSH Bastion architectures.
permalink: /topics/vpn-ipsec-wireguard/
last_verified: 2026-08-12
---

<span class="eyebrow">Network Security / Transport</span>

# Secure Tunneling: IPsec, WireGuard & SSH Bastions

<p class="lede">When IP traffic travels over untrusted networks (such as the public internet or untrusted Wi-Fi), it is vulnerable to eavesdropping, tampering, and IP spoofing. Secure tunneling protocols encapsulate and cryptographically protect packets between endpoints, creating virtual private channels across untrusted infrastructure.</p>

## What is secure tunneling: encapsulating network traffic

Secure tunneling wraps an original network packet inside an outer transport packet, typically protected by **Authenticated Encryption with Associated Data (AEAD)**. WireGuard always uses AEAD (ChaCha20-Poly1305) by design, but the protection scope and cipher configuration are not uniform across all tunneling protocols — see the IPsec mode and ESP configuration notes below. The receiving gateway verifies payload integrity, decrypts the inner packet where encryption is configured, and routes it to the target network.

When confidentiality is configured, tunneling provides up to three security guarantees:

1. **Confidentiality**: Payload (and, depending on mode, the inner IP header) is encrypted, protecting internal IP addresses from external exposure. IPsec in **tunnel mode** encapsulates and encrypts the entire original packet, including its header, inside a new outer IP packet; IPsec in **transport mode** protects only the upper-layer payload and leaves the original IP header largely intact and visible. WireGuard's design always encapsulates the full inner packet, functionally similar to tunnel mode.
2. **Integrity & Authenticity**: WireGuard and AEAD-configured ESP carry a cryptographic authentication tag on every packet; a modified packet fails that tag check and is dropped. Replay rejection is a separate mechanism from the tag check — a byte-for-byte replayed packet still carries a valid tag, since nothing about it was altered. IPsec's ESP ([RFC 4303](https://www.rfc-editor.org/rfc/rfc4303.html)) addresses this with a sequence-number-based anti-replay window: implementations are required to support it, but a receiver may enable or disable it per Security Association, and it must not be enabled without the integrity service also enabled (since the sequence number itself needs integrity protection to be trustworthy). IPsec's ESP protocol ([RFC 4301](https://www.rfc-editor.org/rfc/rfc4301.html)) can also be configured for integrity-only (no confidentiality/encryption at all) or with separate encrypt-then-MAC algorithms instead of a combined AEAD cipher — not every IPsec deployment encrypts traffic, though RFC 4301 prohibits an SA with neither encryption nor an integrity algorithm.
3. **Identity Binding**: Tunnel endpoints verify peer identity (via public keys or certificates) before passing traffic.

## Comparing tunneling protocols: IPsec vs WireGuard vs OpenVPN

When evaluating VPN protocols for site-to-site or remote access connections, compare architecture, crypto primitives, and operational complexity:

| Protocol | Layer | Handshake / Crypto Primitives | Strengths | Trade-offs / Weaknesses |
|---|---|---|---|---|
| **IPsec (IKEv2)** | Network (Layer 3) | **IKEv2** (Diffie-Hellman), AES-GCM / ChaCha20-Poly1305 | OS-native support (iOS, macOS, Windows, Android); standardized; hardware-accelerated | Complex configuration state machine; large code footprint; complex NAT traversal |
| **WireGuard** | Network (Layer 3) | **Noise IK** handshake, Noise protocol framework, Curve25519, ChaCha20-Poly1305, BLAKE2s | ~4,000 lines of code (audit-friendly); modern crypto; state-of-the-art speed & low latency; seamless roaming | Fixed modern crypto suite (no agility/negotiation by design); static IP assignments in default config |
| **OpenVPN** | Transport (Layer 4, UDP/TCP) | TLS-based handshake, custom protocol, OpenSSL backend | Operates over TCP 443 (traverses strict corporate firewalls); mature | User-space processing overhead (slower throughput); complex OpenSSL dependency surface |

The table above lists the cipher suites IPsec's ESP ([RFC 4301](https://www.rfc-editor.org/rfc/rfc4301.html)) commonly negotiates, but ESP is configurable, not fixed: an administrator can select **transport mode** (only the upper-layer payload is protected; the original IP header stays largely intact and visible) or **tunnel mode** (the entire original packet, including its header, is encapsulated and encrypted inside a new IP packet), and can configure ESP for AEAD, for separate encrypt-then-MAC algorithms, or for integrity-only with no encryption at all. WireGuard has no equivalent negotiation: every WireGuard tunnel uses the same fixed AEAD construction (ChaCha20-Poly1305) and always encapsulates the full inner packet.

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

## Zero Trust Network Access (ZTNA) as an alternative to VPN tunnels

Many traditional VPN deployments grant a connected client broad network-level reachability: once the tunnel is up, the client may have a routable path to an entire subnet or VPC, with individual services restricted downstream by firewall or application policy. That breadth is a deployment choice rather than a protocol requirement—IPsec traffic selectors, WireGuard `AllowedIPs`, routing, and firewalls can narrow reachability. **Zero Trust Network Access (ZTNA)** instead mediates access per application or resource: an identity-aware proxy or broker authenticates and authorizes each specific application request without placing the client directly on an internal network segment. This can narrow the blast radius of a compromised endpoint or credential, at the cost of per-application integration or proxying.

## Network Tunnel Selection Rulebook

1. **WireGuard**: A lean option for site-to-site tunnels and modern VPN infrastructure when its platform support and key-distribution model fit the environment.
2. **IPsec (IKEv2)**: Useful when client devices require standardized, native OS VPN integration without installing third-party agents.
3. **Short-Lived SSH Certificates + ProxyJump**: A focused option for interactive engineer access to SSH services in private networks.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>WireGuard is a lean option for new tunnels; IPsec/IKEv2 remains useful where standardized, OS-native VPN support is required. A VPN can be narrowly routed and firewalled, but many deployments expose broad network reachability; use per-peer routes and downstream policy, or ZTNA when per-application authorization is the goal.</p>
</div>

## Primary references

- **WireGuard Whitepaper**: *WireGuard: Next Generation Kernel Network Tunnel* — [WireGuard Official Paper](https://www.wireguard.com/papers/wireguard.pdf)
- **RFC 7296**: *Internet Key Exchange Protocol Version 2 (IKEv2)* — [IETF RFC 7296](https://www.rfc-editor.org/rfc/rfc7296)
