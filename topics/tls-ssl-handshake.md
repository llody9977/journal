---
title: TLS 1.3 Handshake & Network Encryption
description: Detailed protocol breakdown of the TLS 1.3 1-RTT handshake, ECDHE key exchange, AEAD transport protection, 0-RTT early data replay risks, and Encrypted Client Hello (ECH, RFC 9849).
permalink: /topics/tls-ssl-handshake/
last_verified: 2026-08-09
---

<span class="eyebrow">Cryptography / Protocols</span>

# TLS 1.3 Handshake & Network Encryption

<p class="lede">Transport Layer Security (TLS) 1.3 is the foundational security protocol of the internet, providing confidentiality, integrity, server authentication, and — for its standard full handshake — Perfect Forward Secrecy over TCP networks. Standardized in [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html), and updated by [RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html), TLS 1.3 streamlines the handshake phase to 1-RTT by combining key exchange with initial parameters and deprecating legacy, insecure ciphers.</p>

## TLS 1.3 Handshake Architecture (1-RTT)

Unlike TLS 1.2 which required 2 full round-trips (2-RTT) before transmitting encrypted application data, **TLS 1.3** establishes an encrypted channel in just **1-RTT**:

<div class="diagram-frame">
  <img src="{{ '/assets/img/tls-handshake.svg' | relative_url }}" alt="TLS 1.3 1-RTT handshake sequence diagram between Client, Server, and CA.">
  <p class="diagram-caption">TLS 1.3 1-RTT Handshake: key shares sent in ClientHello enable immediate encryption</p>
</div>

### Step-by-Step Handshake Sequence

1. **ClientHello + Key Share**: Client sends supported cipher suites, protocol version (TLS 1.3), and an ephemeral ECDH key share (**X25519** or **X25519MLKEM768**).
2. **ServerHello + Key Share**: Server selects cipher suite (**AES-256-GCM**), completes Diffie-Hellman to derive the master secret, and sends its key share.
3. **Encrypted Extensions & Certificate**: All subsequent handshake messages are encrypted using the derived handshake key. Server sends its X.509 certificate and `CertificateVerify` signature.
4. **Finished**: Both endpoints verify handshake transcript MACs and switch to application transport keys.

## TLS Protocol Version & Security Status Matrix

| Version | Handshake Latency | Security Status &amp; Cryptographic Changes | Recommended Action |
|---|---|---|---|
| **SSL 2.0 / SSL 3.0** | 2-RTT | **CRITICALLY BROKEN**: Vulnerable to POODLE, DROWN, and weak MACs. | **PROHIBITED**: Must be disabled across all servers. |
| **TLS 1.0 / TLS 1.1** | 2-RTT | **DEPRECATED ([RFC 8996](https://www.rfc-editor.org/rfc/rfc8996))**: Lacks modern AEAD ciphers; vulnerable to BEAST and Lucky13. | **PROHIBITED**: Disable per PCI-DSS and [NIST SP 800-52 Rev. 2](https://csrc.nist.gov/pubs/sp/800/52/r2/final). |
| **TLS 1.2** | 2-RTT | **LEGACY APPROVED**: Secure when restricted to ECDHE + AES-GCM cipher suites. | **MAINTAIN FOR COMPATIBILITY**: Phase out in favor of TLS 1.3. |
| **TLS 1.3** | **1-RTT** | **RECOMMENDED STANDARD**: Mandatory AEAD; (EC)DHE key exchange is required for the full handshake, though PSK-only resumption (without `psk_dhe_ke`) is a permitted mode that forgoes forward secrecy for that resumed session; zero static RSA key exchange ([RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html), updated by [RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html)). | **STANDARD DEFAULT**: Mandate across all production systems. |

## Advanced TLS 1.3 Features & Security Trade-offs

### 1. 0-RTT Early Data & Replay Attack Vulnerability

TLS 1.3 allows returning clients to resume sessions and send data in the very first packet (**0-RTT**). However, because 0-RTT data is transmitted before server handshake completion, an attacker can capture and **replay** 0-RTT packets.

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">0-RTT Security Guidance</div>
  <div>
    <strong>0-RTT Early Data Replay Protection</strong>
    <p>Per <a href="https://www.rfc-editor.org/rfc/rfc8446.html#section-8">RFC 8446 §8</a>, 0-RTT data carries no non-replay guarantee, so it should only be used for application-defined replay-safe operations. While HTTP idempotence (e.g., standard <code>GET</code> or <code>PUT</code> with idempotency headers) is a primary guideline, HTTP idempotence alone is not always sufficient if backend application logic processes the request non-atomically. State-modifying or non-replay-safe operations must be restricted to 1-RTT transport to prevent transaction replay attacks.</p>
  </div>
</div>

### 2. Encrypted Client Hello (ECH, [RFC 9849](https://www.rfc-editor.org/rfc/rfc9849.html))

In standard TLS 1.3, the Server Name Indication (SNI) header in `ClientHello` remains unencrypted, allowing network observers to monitor target domain destinations. **Encrypted Client Hello (ECH)**, standardized as [RFC 9849](https://www.rfc-editor.org/rfc/rfc9849.html) in March 2026 after progressing through the `draft-ietf-tls-esni` series, addresses this: the client sends an unencrypted, innocuous-looking `ClientHelloOuter` and wraps the true handshake parameters — including the real SNI — inside an encrypted `ClientHelloInner`, carried as an extension and encrypted (via HPKE) under a public key published in the server's DNS HTTPS record. ECH does not encrypt the entire `ClientHello`; the outer message is still sent in the clear, but the sensitive fields it would otherwise expose are hidden inside the encrypted inner payload, which is what defeats passive SNI eavesdropping.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>TLS Handshake Summary</strong>
    <ul>
      <li><strong>TLS 1.3 1-RTT Speed</strong>: Reduces handshake latency to 1 round-trip time; mandates AEAD ciphers and requires ephemeral key exchange (ECDHE) for the full handshake — PSK-only resumption is a permitted mode but forgoes forward secrecy for that session.</li>
      <li><strong>Encrypted Client Hello (ECH, [RFC 9849](https://www.rfc-editor.org/rfc/rfc9849.html))</strong>: Encrypts the real SNI and selected <code>ClientHello</code> fields inside an encrypted inner payload to prevent passive SNI eavesdropping (though destination IP addresses, unencrypted DNS, and traffic flow analysis may still reveal destination servers).</li>
      <li><strong>0-RTT Replay Warning</strong>: 0-RTT early data is vulnerable to replay attacks; restrict it to application-defined replay-safe operations (per RFC 8446 §8; HTTP idempotence alone is not always sufficient).</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 9846**: *The Transport Layer Security (TLS) Protocol Version 1.3* — [IETF RFC 9846](https://www.rfc-editor.org/rfc/rfc9846.html) (a backward-compatible update that obsoletes [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html), the original TLS 1.3 specification)
- **RFC 9849**: *TLS Encrypted Client Hello* — [IETF RFC 9849](https://www.rfc-editor.org/rfc/rfc9849.html)
- **RFC 8996**: *Deprecating TLS 1.0 and TLS 1.1* — [IETF RFC 8996](https://www.rfc-editor.org/rfc/rfc8996)
