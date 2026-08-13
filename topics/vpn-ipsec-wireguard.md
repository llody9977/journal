---
title: "VPN & Secure Tunneling: IPsec, WireGuard & OpenVPN"
description: VPN tunnel boundaries, IPsec/IKEv2, WireGuard, and OpenVPN mechanics, authentication, routing, anti-replay, operations, migration, and selection criteria.
permalink: /topics/vpn-ipsec-wireguard/
last_verified: 2026-08-13
---

<span class="eyebrow">Network Security / Secure Transport</span>

# VPN & Secure Tunneling: IPsec, WireGuard & OpenVPN

<p class="lede">A virtual private network (VPN) protects selected traffic between tunnel endpoints across an untrusted path. It does not make either endpoint trustworthy, authorize every inner connection, or guarantee that routes, DNS, keys, and failover behave as intended.</p>

## Define the protection boundary first

A tunnel encapsulates an inner packet or frame in an outer packet carried between tunnel endpoints. The outer headers remain visible for routing. The protected content, peer authentication, replay handling, and traffic selection depend on the protocol and configuration.

| Model | What enters the tunnel | Common use |
|---|---|---|
| **Site-to-site** | Traffic selected between network gateways | Connect offices, data centers, and cloud networks. |
| **Remote access** | Selected or default client traffic to a gateway | Give a managed user/device network reachability. |
| **Host-to-host / overlay** | Traffic between enrolled hosts or workloads | Build a private routed overlay without exposing services directly. |

**Full tunnel** routes a broad default path through the VPN; **split tunnel** routes selected prefixes or applications. Split tunneling reduces backhaul and can preserve local access, but it creates simultaneous trusted/untrusted paths and requires explicit DNS, route, and endpoint policy. Full tunneling centralizes inspection only when the gateway actually sees the traffic and IPv6, DNS, and alternate interfaces cannot escape.

## Compare protocols on the same axes

| Protocol | Data model and transport | Peer authentication and cryptography | Operational boundary |
|---|---|---|---|
| **IPsec with IKEv2** | IPsec operates at the IP layer. ESP transport mode protects upper-layer payload while retaining the original IP header; tunnel mode encapsulates the original IP packet in a new packet. NAT traversal commonly carries ESP in UDP. | IKEv2 establishes Security Associations and supports authentication models including pre-shared keys, signatures/certificates, and EAP-based remote access. ESP can use AEAD or separate encryption/integrity algorithms; integrity-only ESP exists. | Standards-based and widely integrated, but selectors, proposals, identities, NAT, rekey, lifetimes, and multiple Security Associations create substantial configuration state. |
| **WireGuard** | Routes IP packets over UDP and always encrypts the inner packet. | Fixed protocol construction using NoiseIK, Curve25519, ChaCha20-Poly1305, BLAKE2s, and related primitives; static public keys identify peers, with an optional pre-shared key mixed into the handshake. | Small protocol surface and no cipher negotiation. Key distribution, peer-to-identity mapping, address assignment, endpoint discovery, and revocation are external operational responsibilities. |
| **OpenVPN** | `tun` carries Layer-3 IP packets; `tap` can carry Layer-2 Ethernet frames where supported. The tunnel can use UDP or TCP. | TLS authenticates the control channel; deployments can use certificates and configured external/user authentication mechanisms. The negotiated data channel commonly uses AEAD suites in current configurations. | Flexible and mature. User-space processing is not a universal performance limit because supported Data Channel Offload (DCO) can move compatible data paths into the kernel; platform and feature support still vary. |

Performance depends on implementation, platform crypto acceleration, packet size, path latency/loss, MTU, number of peers, traffic mix, hardware, and offload. Protocol design alone does not justify a universal “fastest,” “low latency,” or line-count-based auditability claim.

## IPsec separates policy, key management, and packet protection

- The **Security Policy Database (SPD)** decides whether matching traffic is discarded, bypasses IPsec, or is protected.
- **IKEv2** authenticates peers and negotiates Security Associations, traffic selectors, algorithms, and fresh keying material.
- The **Security Association Database (SAD)** holds the unidirectional state used to process AH/ESP traffic.
- **ESP** supplies confidentiality when encryption is selected and data-origin authentication/integrity when the configured algorithm supplies it.

An AEAD tag detects unauthorized modification for a packet under the Security Association. A byte-for-byte replay can still carry a valid tag. ESP therefore has a separate sequence-number and receiver anti-replay-window mechanism; implementations support it, but the receiver chooses whether to enable it for an SA, and it depends on integrity protection.

Tunnel mode hides the inner IP header from observers between the IPsec endpoints, not from those endpoints or the networks beyond them. The new outer header, packet size, timing, and endpoint addresses remain observable.

## WireGuard AllowedIPs combines routing and source checks

WireGuard's **cryptokey routing** associates peer public keys with allowed IP prefixes:

- For outbound traffic, `AllowedIPs` participates in selecting which peer receives a destination prefix.
- For inbound decrypted traffic, the source address must belong to that peer's configured prefixes.

This constrains inner addresses but does not assign addresses, authenticate a human-readable device identity, distribute keys, authorize application actions, or prevent two configuration sources from creating ambiguous policy. Overlay controllers can add those functions, but their identity and control planes become additional trust dependencies.

WireGuard endpoints can roam when authenticated packets arrive from a new outer address. Roaming does not remove the need to detect stolen private keys, expire devices, remove peers, and manage recovery when the coordination or discovery system is unavailable.

## OpenVPN flexibility changes the decision

- Prefer UDP for general tunnel transport when the path allows it. Carrying TCP application flows inside a TCP-based VPN can make loss recovery and congestion control interact poorly; TCP 443 may pass some restrictive networks, but it is not guaranteed to traverse proxies, inspection, authentication portals, or policy that distinguishes non-HTTPS traffic.
- DCO can improve compatible data-path performance, but it is conditional on platform/module support, mode, cipher set, and options. Confirm the active mode from runtime evidence rather than assuming offload is used.
- Layer-2 `tap` mode carries broadcasts and expands the failure and attack domain. Use it only for a requirement that cannot be met with routed Layer-3 `tun` mode.
- Disable compression unless a narrowly reviewed legacy dependency requires it; compression can create information leakage and may be incompatible with modern offload paths.

## Operate keys, routes, names, and failure together

1. Bind each peer credential to an owner, device/workload, allowed prefixes, environment, issuance time, and retirement action.
2. Use least-privilege routes and downstream firewall/application authorization; tunnel membership is not resource authorization.
3. Test route precedence, overlapping prefixes, IPv4 and IPv6 leakage, DNS resolver/search behavior, local-LAN access, kill-switch behavior, and reconnect after network change.
4. Measure packet loss, retransmission, handshake/rekey failure, peer last-seen state, route drift, MTU/fragmentation, gateway saturation, and denied inner flows.
5. Define gateway failover and fail-closed/fail-open behavior. Confirm that high availability does not reuse identities or Security Association state unsafely.
6. Revoke compromised peers, rotate affected keys, remove routes, inspect post-revocation use, and test recovery from lost controller, CA, pre-shared key, or gateway state.

## Migrate unsafe and obsolete tunnels deliberately

- **PPTP with MS-CHAPv2** and obsolete cryptographic configurations should not be selected for new protection. Inventory clients and replace the dependency rather than wrapping it in another tunnel and leaving it active.
- **IKEv1** is deprecated and its defining RFCs are Historic. Migrate to IKEv2 and review algorithms during migration instead of importing the old proposal unchanged.
- Remove single-DES, 3DES where prohibited by current policy, RC4, MD5-based integrity, weak Diffie-Hellman groups, static shared credentials with broad reuse, and unauthenticated or integrity-free configurations.
- Run old and new tunnels in parallel only for a bounded cutover. Validate routes and applications, revoke old credentials, remove listeners and firewall rules, and monitor for attempts to use the retired path.

## Select the mechanism from requirements

- Choose **IPsec/IKEv2** for interoperable site-to-site or native-client requirements when the team can manage its policy and negotiation state.
- Choose **WireGuard** for a lean Layer-3 UDP tunnel when external key, identity, address, and lifecycle management are available.
- Choose **OpenVPN** when TLS-based extensibility, `tun`/`tap`, or UDP/TCP transport flexibility is required and its larger option surface can be governed.
- Choose **[Administrative Network Access]({{ '/topics/administrative-network-access/' | relative_url }})** rather than a general VPN when engineers need narrowly mediated access to specific management resources.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>A VPN protects selected traffic between tunnel endpoints; routes, DNS, endpoint security, key lifecycle, and resource authorization remain separate. Compare IPsec, WireGuard, and OpenVPN by protection scope, authentication, policy state, platform support, and recovery—not by universal speed or simplicity claims.</p>
</div>

## Primary references

- **[RFC 4301: Security Architecture for IP](https://www.rfc-editor.org/rfc/rfc4301.html)**, **[RFC 4303: IP Encapsulating Security Payload](https://www.rfc-editor.org/rfc/rfc4303.html)**, and **[RFC 7296: IKEv2](https://www.rfc-editor.org/rfc/rfc7296.html)** — verified IPsec databases, modes, Security Associations, authentication, ESP protection, sequence numbers, and anti-replay boundaries.
- **[WireGuard whitepaper](https://www.wireguard.com/papers/wireguard.pdf)** and **[WireGuard protocol overview](https://www.wireguard.com/protocol/)** — verified cryptokey routing, protocol primitives, roaming, and fixed-suite behavior.
- **[OpenVPN 2.6 manual](https://openvpn.net/community-docs/community-articles/openvpn-2-6-manual.html)** — verified `tun`/`tap`, UDP/TCP, current data-cipher, compression, and conditional DCO behavior.
- **[NIST SP 800-77 Rev. 1: Guide to IPsec VPNs](https://csrc.nist.gov/pubs/sp/800/77/r1/final)** — verified IPsec deployment guidance and the unsafe/deprecated boundary for PPTP and obsolete VPN configurations.
- **[RFC 9395: Deprecation of IKEv1](https://www.rfc-editor.org/rfc/rfc9395.html)** — verified IKEv1 Historic status, migration guidance, and associated obsolete-algorithm considerations.
