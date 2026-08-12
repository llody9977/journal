---
title: TLS 1.3 Handshake & Network Encryption
description: Detailed protocol breakdown of the TLS 1.3 1-RTT handshake, ECDHE key exchange, AEAD transport protection, 0-RTT early data replay risks, and Encrypted Client Hello (ECH, RFC 9849).
permalink: /topics/tls-ssl-handshake/
last_verified: 2026-08-11
---

<span class="eyebrow">Cryptography / Protocols</span>

# TLS 1.3 Handshake & Network Encryption

<p class="lede">Transport Layer Security (TLS) 1.3 is the foundational security protocol of the internet, providing confidentiality, integrity, server authentication, and — for its standard full handshake — Perfect Forward Secrecy over TCP networks. Standardized in [RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html) — which obsoletes [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html), the original TLS 1.3 specification, rather than merely amending it — TLS 1.3 streamlines the handshake phase to 1-RTT by combining key exchange with initial parameters and deprecating legacy, insecure ciphers.</p>

## TLS 1.3 Handshake Architecture (1-RTT)

Unlike a **full** TLS 1.2 handshake, which required 2 round-trips (2-RTT) before transmitting encrypted application data — TLS 1.2's *abbreviated* (session-resumption) handshake could complete in 1-RTT, so "2-RTT" describes the full handshake specifically, not TLS 1.2 as a whole — **TLS 1.3** establishes an encrypted channel in just **1-RTT** for its full handshake:

<div class="diagram-frame">
  <img src="{{ '/assets/img/tls-handshake.svg' | relative_url }}" alt="TLS 1.3 1-RTT handshake sequence diagram between Client, Server, and CA.">
  <p class="diagram-caption">TLS 1.3 1-RTT Handshake: key shares sent in ClientHello enable immediate encryption. The diagram's g<sup>x</sup>/g<sup>y</sup> notation depicts plain ECDHE; for the hybrid X25519MLKEM768 group, the client's share (g<sup>x</sup>) is an ML-KEM encapsulation key concatenated with its X25519 share, and the server's share (g<sup>y</sup>) is the resulting ML-KEM ciphertext (from the server encapsulating to that key) concatenated with its own X25519 share — not pure Diffie-Hellman in either direction.</p>
</div>

### Step-by-Step Handshake Sequence

1. **ClientHello + Key Share**: Client sends supported cipher suites, protocol version (TLS 1.3), and an ephemeral key share for its chosen group — either a plain ECDH share (**X25519**) or, for post-quantum readiness, the hybrid **X25519MLKEM768** group ([RFC 10024](https://www.rfc-editor.org/info/rfc10024/) §4.1), whose client-side share concatenates a freshly generated ML-KEM-768 **encapsulation key** (the client's ML-KEM public key) with an X25519 ECDH share — not an ML-KEM ciphertext.
2. **ServerHello + Key Share**: Server selects a cipher suite from the client's offered list (TLS 1.3 also negotiates **AES-128-GCM** and **ChaCha20-Poly1305**; AES-256-GCM here is one example, not TLS 1.3's fixed choice) and completes the negotiated group's key-establishment step: ordinary Diffie-Hellman for plain X25519, or, for the hybrid group, **ML-KEM encapsulation** against the client's encapsulation key ([RFC 10024](https://www.rfc-editor.org/info/rfc10024/) §4.2) — producing a ciphertext the server sends back alongside its own X25519 share. The server derives the **Handshake Secret** via HKDF from the resulting shared secret; the client derives the same secret by performing **ML-KEM decapsulation** on that ciphertext once it processes ServerHello. The **Main Secret** ([RFC 9846 §7.1](https://www.rfc-editor.org/rfc/rfc9846.html#section-7.1) — called "Master Secret" in the original RFC 8446 wording) is derived immediately afterward, via a further HKDF-Extract step keyed from the Handshake Secret; it does **not** wait for either side's `Finished` message. The server sends its key share.
3. **Encrypted Extensions & Certificate**: All subsequent handshake messages are encrypted using the derived handshake key. Server sends its X.509 certificate and `CertificateVerify` signature, then its own `Finished` message. At this point the server can already derive its **application traffic secret** — its `Derive-Secret` call only needs the transcript through the server's own `Finished`, which is why TLS 1.3 permits the server to send 0.5-RTT application data before the client's flight arrives.
4. **Client Finished**: The client verifies the server's handshake transcript, derives its own handshake MAC, and sends its `Finished` message (preceded by the client's `Certificate`/`CertificateVerify` only if the server requested client authentication). Once the client's `Finished` is added to the transcript, both sides can derive the **resumption secret**, which specifically requires the transcript through the *client's* `Finished` (unlike the application traffic secrets, which only needed the transcript through the server's `Finished`) — this client flight happens *before* ordinary bidirectional application data, per [RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html).

This is the handshake as it runs directly over TCP for HTTP/2 and earlier. **HTTP/3 does not reuse the TLS record layer at all** — it runs over **QUIC** ([RFC 9000](https://www.rfc-editor.org/rfc/rfc9000)), which uses TLS 1.3 ([RFC 9001](https://www.rfc-editor.org/rfc/rfc9001)) only for the handshake and key negotiation, then applies its own QUIC packet protection (built on the negotiated AEAD keys) rather than framing application data inside ordinary TLS records. Describing HTTP/3 traffic as "the TLS record layer over AES-GCM" conflates the two transports.

## TLS Protocol Version & Security Status Matrix

| Version | Handshake Latency | Security Status &amp; Cryptographic Changes | Recommended Action |
|---|---|---|---|
| **SSL 2.0 / SSL 3.0** | 2-RTT | **CRITICALLY BROKEN**: SSL 3.0 specifically is vulnerable to the POODLE CBC-padding oracle; SSL 2.0 specifically is vulnerable to DROWN (a cross-protocol RSA padding-oracle attack) — the two flaws don't both apply to both versions, but both versions share weak, non-AEAD MAC constructions. | **PROHIBITED**: Must be disabled across all servers. |
| **TLS 1.0 / TLS 1.1** | 2-RTT | **DEPRECATED ([RFC 8996](https://www.rfc-editor.org/rfc/rfc8996))**: Lacks modern AEAD ciphers; TLS 1.0 specifically is vulnerable to the BEAST CBC-chaining attack, and CBC-mode suites in either version are susceptible to Lucky13-style timing attacks — see RFC 8996 for the complete deprecation rationale. | **PROHIBITED**: Disable per PCI-DSS and [NIST SP 800-52 Rev. 2](https://csrc.nist.gov/pubs/sp/800/52/r2/final). |
| **TLS 1.2** | 2-RTT (full handshake; abbreviated/resumption handshake can be 1-RTT) | **LEGACY APPROVED**: Secure when restricted to AEAD cipher suites with ephemeral key exchange — ECDHE + AES-GCM ([RFC 5289](https://www.rfc-editor.org/rfc/rfc5289)) or ECDHE + ChaCha20-Poly1305 ([RFC 7905](https://www.rfc-editor.org/rfc/rfc7905)) are both acceptable; avoid static RSA key exchange and CBC-mode suites. | **MAINTAIN FOR COMPATIBILITY**: Phase out in favor of TLS 1.3. |
| **TLS 1.3** | **1-RTT** (full handshake without a `HelloRetryRequest`; add a round trip if HRR occurs) | **RECOMMENDED STANDARD**: Mandatory AEAD; (EC)DHE key exchange is required for the full handshake, though PSK-only use (without `psk_dhe_ke`) — covering both session-resumption PSKs and out-of-band-established external PSKs, not resumption alone — is a permitted mode that forgoes forward secrecy for that connection; zero static RSA key exchange ([RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html), which obsoletes the original [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html)). | **DEFAULT FOR NEW DEPLOYMENTS**: Use TLS 1.3 by default; retain a restricted TLS 1.2 profile (AEAD-only, ECDHE-only, as described above) only where client compatibility genuinely requires it, and phase that out over time. |

## Advanced TLS 1.3 Features & Security Trade-offs

### 1. 0-RTT Early Data & Replay Attack Vulnerability

TLS 1.3 allows returning clients to resume sessions and send data in the very first packet (**0-RTT**). However, because 0-RTT data is transmitted before server handshake completion, an attacker can capture and **replay** 0-RTT packets.

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">0-RTT Security Guidance</div>
  <div>
    <strong>0-RTT Early Data Replay Protection</strong>
    <p>Per <a href="https://www.rfc-editor.org/rfc/rfc9846.html#section-2.3">RFC 9846 §2.3</a>, 0-RTT data carries no non-replay guarantee, so what's actually safe to send over it has to be decided per application, not inferred from an HTTP method's nominal semantics. HTTP idempotence (a request whose *end state* is the same no matter how many times it's applied — the classic justification for allowing `GET` or `PUT`) is not the same property as replay safety: an idempotent request can still trigger a side effect — sending a notification email, incrementing an audit counter, calling a billing webhook — every time it's replayed, even though the resource's final state doesn't change. Treating "idempotent" as synonymous with "safe to replay" misses that gap. State-modifying operations, and any operation with side effects beyond the resource's own state, should be restricted to 1-RTT transport unless the application explicitly de-duplicates replays (e.g., via a request nonce or idempotency key checked server-side) on top of HTTP idempotence.</p>
  </div>
</div>

### 2. Encrypted Client Hello (ECH, [RFC 9849](https://www.rfc-editor.org/rfc/rfc9849.html))

In standard TLS 1.3, the Server Name Indication (SNI) header in `ClientHello` remains unencrypted, allowing network observers to monitor target domain destinations. **Encrypted Client Hello (ECH)**, standardized as [RFC 9849](https://www.rfc-editor.org/rfc/rfc9849.html) in March 2026 after progressing through the `draft-ietf-tls-esni` series, addresses this: the client sends an unencrypted, innocuous-looking `ClientHelloOuter` and wraps the true handshake parameters — including the real SNI — inside an encrypted `ClientHelloInner`, carried as an extension and encrypted (via HPKE) under a public key published in the server's DNS HTTPS record. ECH does not encrypt the entire `ClientHello`; the outer message is still sent in the clear, but the sensitive fields it would otherwise expose are hidden inside the encrypted inner payload, which is what defeats passive SNI eavesdropping.

## TLS Ecosystem Mechanics

Beyond the core handshake, several mechanisms determine how TLS 1.3 actually behaves in a real deployment:

- **What a "cipher suite" means in TLS 1.3**: TLS 1.2 cipher suite names (e.g., `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384`) bundled key exchange, authentication, bulk cipher, and hash into one negotiated unit. TLS 1.3 splits this apart: the cipher suite now names only the **AEAD algorithm and hash** (e.g., `TLS_AES_256_GCM_SHA384`), while key exchange (`supported_groups` / `key_share`) and authentication (the signature algorithm used in `CertificateVerify`, via `signature_algorithms`) are negotiated as separate, independent extensions. A TLS 1.3 "cipher suite" is a narrower concept than its TLS 1.2 namesake.
- **ALPN (Application-Layer Protocol Negotiation, [RFC 7301](https://www.rfc-editor.org/rfc/rfc7301))**: A `ClientHello` extension listing application protocols the client supports (e.g., `h2` for HTTP/2, `http/1.1`); the server picks one and returns its choice in `EncryptedExtensions`. This is how a single HTTPS port (443) serves both HTTP/1.1 and HTTP/2 clients without a separate handshake round-trip to negotiate the application protocol afterward.
- **Session resumption via tickets**: Rather than repeating a full handshake, TLS 1.3 lets the server issue one or more opaque `NewSessionTicket` messages (post-handshake). The ticket itself doesn't necessarily contain the resumption secret directly — it's implementation-defined and opaque to the client, either a reference into server-side session state or self-contained encrypted state. The actual resumption PSK is derived from the connection's `resumption_master_secret` together with a per-ticket `ticket_nonce` via `HKDF-Expand-Label`, so each issued ticket yields a distinct PSK even though every ticket for a connection traces back to the same resumption secret. A returning client presents a ticket via the `pre_shared_key` extension, letting both sides skip straight to a PSK-based (optionally PSK+DHE) abbreviated handshake. Tickets should be short-lived and, ideally, single-use or anti-replay-protected server-side, since ticket-based resumption without `psk_dhe_ke` forgoes forward secrecy for that resumed session (see the version matrix above).
- **Client authentication / mTLS**: The server can request a client certificate via `CertificateRequest`; the client responds with its own `Certificate` and `CertificateVerify` inside the same encrypted flight this page's handshake sequence calls out (step 4, the client's post-ServerHello flight). Mutual TLS (mTLS) is this mechanism used for service-to-service or zero-trust network authentication, where both directions authenticate via certificates rather than relying solely on server-side auth plus an application-layer credential.
- **HelloRetryRequest (HRR)**: If the server doesn't support any group the client offered a `key_share` for (or wants a different one), it responds with a `HelloRetryRequest` instead of `ServerHello`, asking the client to resend `ClientHello` with an acceptable group. This costs an extra round trip (making that handshake 2-RTT instead of 1-RTT) but lets the server participate in group selection without requiring the client to guess correctly up front or send key shares for every group it supports.
- **KeyUpdate**: For long-lived connections, either side can send a `KeyUpdate` message to ratchet the traffic keys forward — deriving fresh application traffic keys from the current ones via a one-way HKDF step — without a full re-handshake. This bounds how much ciphertext is protected under any single key (useful for staying within AEAD's per-key data limits on very long connections) and protects *earlier* key generations after the fact, provided the superseded secrets are actually erased. It does **not** provide post-compromise recovery: because each new generation is derived deterministically from the current one, an attacker who holds the current traffic secret can derive every later generation too — `KeyUpdate` ratchets existing key material forward, it doesn't inject the fresh entropy a new (EC)DHE exchange would.
- **TLS vs. QUIC boundary**: As noted above, HTTP/3 runs over QUIC, which uses TLS 1.3 only for its handshake and key negotiation (RFC 9001) — QUIC then does its own packet protection and has its own loss-recovery and multiplexing layer entirely separate from the TCP-carried TLS record layer HTTP/1.1 and HTTP/2 use.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>TLS 1.3 completes a full handshake in one round trip, mandates AEAD ciphers, and requires ephemeral key exchange for forward secrecy — a PSK-only resumption is permitted but forgoes that guarantee. 0-RTT early data is replay-vulnerable and should be restricted to operations explicitly confirmed as replay-safe, not assumed safe from HTTP idempotence alone.</p>
</div>

## Primary references

- **RFC 9846**: *The Transport Layer Security (TLS) Protocol Version 1.3* — [IETF RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html) (a backward-compatible update that obsoletes [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html), the original TLS 1.3 specification)
- **RFC 9849**: *TLS Encrypted Client Hello* — [IETF RFC 9849](https://www.rfc-editor.org/rfc/rfc9849.html)
- **RFC 8996**: *Deprecating TLS 1.0 and TLS 1.1* — [IETF RFC 8996](https://www.rfc-editor.org/rfc/rfc8996)
