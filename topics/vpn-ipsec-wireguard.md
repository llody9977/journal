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
2. **Integrity & Authenticity**: WireGuard and AEAD-configured ESP carry a cryptographic authentication tag on every packet; altered or replayed packets are dropped immediately. IPsec's ESP protocol ([RFC 4301](https://www.rfc-editor.org/rfc/rfc4301.html)) can also be configured for integrity-only (no confidentiality/encryption at all) or with separate encrypt-then-MAC algorithms instead of a combined AEAD cipher — not every IPsec deployment encrypts traffic, though RFC 4301 prohibits an SA with neither encryption nor an integrity algorithm.
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

A traditional VPN (IPsec, WireGuard, or OpenVPN) grants a connected client broad network-level reachability: once the tunnel is up, the client typically has a routable path to an entire subnet or VPC, and access to individual services is enforced downstream (if at all) by firewall rules or application-layer controls. **Zero Trust Network Access (ZTNA)** replaces that broad tunnel with per-application, per-resource access: an identity-aware proxy or broker authenticates and authorizes the request for each specific application before forwarding it, rather than placing the client onto the internal network segment. This narrows the blast radius of a compromised endpoint or credential — a ZTNA session normally cannot reach lateral hosts the way a VPN-connected device can — at the cost of needing per-application integration or proxying rather than one blanket network tunnel.

## Network Tunnel Selection Rulebook

1. **WireGuard**: Primary choice for site-to-site tunnels and modern VPN infrastructure (minimal attack surface, high performance).
2. **IPsec (IKEv2)**: Selected when client devices require native OS VPN integration without installing third-party agents.
3. **Short-Lived SSH Certificates + ProxyJump**: Standard for interactive engineer access to private VPC resources.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>VPN, IPsec &amp; WireGuard Summary</strong>
    <ul>
      <li><strong>WireGuard Architecture</strong>: Modern, lightweight VPN protocol using Noise protocol framework, Curve25519, ChaCha20-Poly1305, and BLAKE2s (~4,000 LOC).</li>
      <li><strong>IPsec IKEv2</strong>: Enterprise standard for site-to-site tunnels; encrypts IP packets using ESP (Encapsulating Security Payload) mode.</li>
      <li><strong>Zero Trust Network Access (ZTNA)</strong>: Replaces perimeter VPN access with identity-aware application proxies to prevent lateral network movement.</li>
    </ul>
  </div>
</div>

## Primary References

- **WireGuard Whitepaper**: *WireGuard: Next Generation Kernel Network Tunnel* — [WireGuard Official Paper](https://www.wireguard.com/papers/wireguard.pdf)
- **RFC 7296**: *Internet Key Exchange Protocol Version 2 (IKEv2)* — [IETF RFC 7296](https://www.rfc-editor.org/rfc/rfc7296)
