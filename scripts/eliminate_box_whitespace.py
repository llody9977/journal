#!/usr/bin/env python3
import os, re

IMG_DIR = 'assets/img'
SVGS = {}

# 1. cryptography-threats.svg
SVGS['cryptography-threats.svg'] = """<svg viewBox="0 0 1200 310" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="310" fill="#ffffff"/>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#94a3b8"/>
    </marker>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">Threats to Data Crossing an Untrusted Network</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Cryptographic controls protect different security properties of the same communication channel</text>

  <!-- Box 1: Confidentiality -->
  <rect x="50" y="115" width="330" height="170" rx="14" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5"/>
  <text x="75" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="#2563eb">CONFIDENTIALITY</text>
  <text x="75" y="172" font-size="18" font-weight="800" fill="#0f172a">Eavesdropping</text>
  <text x="75" y="196" font-size="12" fill="#475569">• Passive intercept of network packets</text>
  <text x="75" y="216" font-size="12" fill="#475569">• Violates payload data secrecy</text>
  <rect x="75" y="234" width="280" height="32" rx="6" fill="#ffffff" stroke="#93c5fd" stroke-width="1"/>
  <text x="215" y="255" font-size="11.5" font-weight="700" fill="#1e40af" text-anchor="middle">Control: AES-256-GCM / TLS Encryption</text>

  <!-- Connector 1->2 -->
  <path d="M 388 200 L 427 200" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" marker-end="url(#arrow)"/>

  <!-- Box 2: Integrity -->
  <rect x="435" y="115" width="330" height="170" rx="14" fill="#f0fdfa" stroke="#0f766e" stroke-width="2.5"/>
  <text x="460" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="#0f766e">INTEGRITY</text>
  <text x="460" y="172" font-size="18" font-weight="800" fill="#0f172a">Tampering</text>
  <text x="460" y="196" font-size="12" fill="#475569">• Active alteration of bit sequences</text>
  <text x="460" y="216" fill="#475569" font-size="12">• Corrupts payload data in transit</text>
  <rect x="460" y="234" width="280" height="32" rx="6" fill="#ffffff" stroke="#5eead4" stroke-width="1"/>
  <text x="600" y="255" font-size="11.5" font-weight="700" fill="#0f766e" text-anchor="middle">Control: HMAC-SHA256 / Auth Tag</text>

  <!-- Connector 2->3 -->
  <path d="M 773 200 L 812 200" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" marker-end="url(#arrow)"/>

  <!-- Box 3: Authenticity -->
  <rect x="820" y="115" width="330" height="170" rx="14" fill="#fffbeb" stroke="#b45309" stroke-width="2.5"/>
  <text x="845" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="#b45309">AUTHENTICITY</text>
  <text x="845" y="172" font-size="18" font-weight="800" fill="#0f172a">Impersonation</text>
  <text x="845" y="196" font-size="12" fill="#475569">• Active spoofing of peer identity</text>
  <text x="845" y="216" font-size="12" fill="#475569">• Injects unauthorized instructions</text>
  <rect x="845" y="234" width="280" height="32" rx="6" fill="#ffffff" stroke="#fcd34d" stroke-width="1"/>
  <text x="985" y="255" font-size="11.5" font-weight="700" fill="#b45309" text-anchor="middle">Control: X.509 Certs / Ed25519</text>
</svg>"""

# 2. full-disk-encryption-scope.svg
SVGS['full-disk-encryption-scope.svg'] = """<svg viewBox="0 0 1200 420" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="420" fill="#ffffff"/>
  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">Full Disk Encryption (FDE) Threat Scope &amp; Boundaries</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">FDE protects data on powered-off physical drives; OS access controls protect active booted sessions</text>

  <!-- Left: Powered-off -->
  <rect x="50" y="115" width="535" height="235" rx="14" fill="#f0fdf4" stroke="#16a34a" stroke-width="2.5"/>
  <text x="75" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="#16a34a">POWERED-OFF STATE (PROTECTED)</text>
  <text x="75" y="170" font-size="16" font-weight="800" fill="#0f172a">Physical Drive Theft / Cold Storage</text>
  <line x1="75" y1="182" x2="560" y2="182" stroke="#bbf7d0" stroke-width="1"/>
  <text x="75" y="204" font-size="12" fill="#475569">• Volume keys bound to TPM 2.0 / Secure Enclave</text>
  <text x="75" y="224" font-size="12" fill="#475569">• Physical SSD extraction yields unreadable sector ciphertext</text>
  <text x="75" y="244" font-size="12" fill="#475569">• AES-XTS (IEEE 1619) sector-level block encryption</text>
  <text x="75" y="264" font-size="12" fill="#475569">• Requires boot passphrase or TPM hardware authorization</text>
  <rect x="75" y="285" width="485" height="40" rx="8" fill="#15803d"/>
  <text x="317" y="310" font-size="12.5" font-weight="800" fill="#ffffff" text-anchor="middle">MITIGATES OFFLINE DISCLOSURE FROM DEVICE THEFT</text>

  <!-- Right: Booted -->
  <rect x="615" y="115" width="535" height="235" rx="14" fill="#fffbeb" stroke="#b45309" stroke-width="2.5"/>
  <text x="640" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="#b45309">ACTIVE BOOTED SESSION (TRANSPARENT)</text>
  <text x="640" y="170" font-size="16" font-weight="800" fill="#0f172a">Running OS / Mounted File System</text>
  <line x1="640" y1="182" x2="1125" y2="182" stroke="#fde68a" stroke-width="1"/>
  <text x="640" y="204" font-size="12" fill="#475569">• Volume key unlocked in memory; sector decrypt transparent</text>
  <text x="640" y="224" font-size="12" fill="#475569">• OS access controls (user permissions, ACLs) govern access</text>
  <text x="640" y="244" font-size="12" fill="#475569">• SQLi, path traversal, &amp; malware bypass FDE completely</text>
  <text x="640" y="264" font-size="12" fill="#475569">• Screen lock does NOT unmount or evict volume key</text>
  <rect x="640" y="285" width="485" height="40" rx="8" fill="#b45309"/>
  <text x="882" y="310" font-size="12.5" font-weight="800" fill="#ffffff" text-anchor="middle">UNPROTECTED: Requires App-Layer Field Encryption</text>

  <!-- Summary Footer -->
  <rect x="50" y="365" width="1100" height="40" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
  <text x="600" y="390" font-size="12" font-weight="700" fill="#334155" text-anchor="middle">Summary: FDE is a physical security control. Data-in-use protection requires application-level field encryption.</text>
</svg>"""

# 3. quantum-algorithm-impact.svg
SVGS['quantum-algorithm-impact.svg'] = """<svg viewBox="0 0 1200 420" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="420" fill="#ffffff"/>
  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">Quantum Computing Impact on Modern Cryptography</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Shor's algorithm breaks classical asymmetric ciphers; Grover's algorithm halves symmetric key security</text>

  <!-- Left: Asymmetric (Shor) -->
  <rect x="50" y="115" width="535" height="235" rx="14" fill="#fef2f2" stroke="#dc2626" stroke-width="2.5"/>
  <text x="75" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="#dc2626">ASYMMETRIC CIPHERS (CRITICAL THREAT)</text>
  <text x="75" y="170" font-size="16" font-weight="800" fill="#0f172a">Shor's Algorithm (Polynomial Time)</text>
  <line x1="75" y1="182" x2="560" y2="182" stroke="#fca5a5" stroke-width="1"/>
  <text x="75" y="204" font-size="12" fill="#475569">• Solves discrete logs &amp; prime factorization efficiently</text>
  <text x="75" y="224" fill="#475569" font-size="12">• Completely breaks RSA, ECDSA, Ed25519, &amp; ECDH</text>
  <text x="75" y="244" font-size="12" fill="#475569">• Enables retrospective decryption of recorded TLS traffic</text>
  <text x="75" y="264" font-size="12" fill="#475569">• Migration Action: Adopt FIPS 203 (ML-KEM) &amp; FIPS 204 (ML-DSA)</text>
  <rect x="75" y="285" width="485" height="40" rx="8" fill="#dc2626"/>
  <text x="317" y="310" font-size="12.5" font-weight="800" fill="#ffffff" text-anchor="middle">BROKEN: Must Migrate to PQC Standards</text>

  <!-- Right: Symmetric (Grover) -->
  <rect x="615" y="115" width="535" height="235" rx="14" fill="#f0fdf4" stroke="#16a34a" stroke-width="2.5"/>
  <text x="640" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="#16a34a">SYMMETRIC CIPHERS &amp; HASHES (RESISTANT)</text>
  <text x="640" y="170" font-size="16" font-weight="800" fill="#0f172a">Grover's Algorithm (Quadratic Speedup)</text>
  <line x1="640" y1="182" x2="1125" y2="182" stroke="#bbf7d0" stroke-width="1"/>
  <text x="640" y="204" font-size="12" fill="#475569">• Quadratic speedup for unstructured brute-force search</text>
  <text x="640" y="224" font-size="12" fill="#475569">• Effectively halves key security strength (N bits --&gt; N/2 bits)</text>
  <text x="640" y="244" font-size="12" fill="#475569">• AES-256 retains 128-bit quantum security strength</text>
  <text x="640" y="264" font-size="12" fill="#475569">• SHA-256 / SHA-384 / SHA-512 remain collision-resistant</text>
  <rect x="640" y="285" width="485" height="40" rx="8" fill="#15803d"/>
  <text x="882" y="310" font-size="12.5" font-weight="800" fill="#ffffff" text-anchor="middle">SAFE: AES-256 Keys &amp; SHA-384+ Digests</text>

  <!-- Summary Footer -->
  <rect x="50" y="365" width="1100" height="40" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
  <text x="600" y="390" font-size="12" font-weight="700" fill="#334155" text-anchor="middle">Key Takeaway: Prioritize PQC migration for asymmetric PKI by data confidentiality lifetime and risk, while AES-256 remains secure.</text>
</svg>"""

# 4. hash-security-properties.svg
SVGS['hash-security-properties.svg'] = """<svg viewBox="0 0 1200 320" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="320" fill="#ffffff"/>
  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">Cryptographic Hash Security Properties &amp; Complexities</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Three mandatory security requirements defining cryptographically secure hash functions</text>

  <!-- Box 1 -->
  <rect x="50" y="115" width="330" height="180" rx="14" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5"/>
  <text x="75" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="#2563eb">1. PREIMAGE RESISTANCE</text>
  <text x="75" y="170" font-size="16" font-weight="800" fill="#0f172a">One-Way Property</text>
  <text x="75" y="194" font-size="12" fill="#475569">Given digest h = H(m), it is</text>
  <text x="75" y="214" font-size="12" fill="#475569">computationally infeasible to find m.</text>
  <rect x="75" y="235" width="280" height="36" rx="6" fill="#ffffff" stroke="#93c5fd" stroke-width="1"/>
  <text x="215" y="258" font-size="12" font-weight="800" fill="#1e40af" text-anchor="middle">Brute-Force Attack: O(2<sup>n</sup>)</text>

  <!-- Box 2 -->
  <rect x="435" y="115" width="330" height="180" rx="14" fill="#f0fdfa" stroke="#0f766e" stroke-width="2.5"/>
  <text x="460" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="#0f766e">2. SECOND PREIMAGE</text>
  <text x="460" y="170" font-size="16" font-weight="800" fill="#0f172a">Weak Collision Resistance</text>
  <text x="460" y="194" font-size="12" fill="#475569">Given input m₁, infeasible to find</text>
  <text x="460" y="214" font-size="12" fill="#475569">m₂ ≠ m₁ such that H(m₁) = H(m₂).</text>
  <rect x="460" y="235" width="280" height="36" rx="6" fill="#ffffff" stroke="#5eead4" stroke-width="1"/>
  <text x="600" y="258" font-size="12" font-weight="800" fill="#0f766e" text-anchor="middle">Brute-Force Attack: O(2<sup>n</sup>)</text>

  <!-- Box 3 -->
  <rect x="820" y="115" width="330" height="180" rx="14" fill="#fffbeb" stroke="#b45309" stroke-width="2.5"/>
  <text x="845" y="142" font-size="11" font-weight="900" letter-spacing="1" fill="#b45309">3. COLLISION RESISTANCE</text>
  <text x="845" y="170" font-size="16" font-weight="800" fill="#0f172a">Strong Collision Resistance</text>
  <text x="845" y="194" font-size="12" fill="#475569">Infeasible to find ANY two distinct</text>
  <text x="845" y="214" font-size="12" fill="#475569">inputs (m₁, m₂) with H(m₁) = H(m₂).</text>
  <rect x="845" y="235" width="280" height="36" rx="6" fill="#ffffff" stroke="#fcd34d" stroke-width="1"/>
  <text x="985" y="258" font-size="12" font-weight="800" fill="#b45309" text-anchor="middle">Birthday Attack: O(2<sup>n/2</sup>)</text>
</svg>"""

# 5. hkdf-extract-expand.svg
SVGS['hkdf-extract-expand.svg'] = """<svg viewBox="0 0 1200 300" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="300" fill="#ffffff"/>
  <defs>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#2563eb"/>
    </marker>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">HKDF Extract-and-Expand Architecture (RFC 5869)</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Two-stage Key Derivation Function: extracting uniform pseudorandom key (PRK) and expanding to target traffic keys</text>

  <!-- Box 1 -->
  <rect x="50" y="115" width="234" height="155" rx="12" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>
  <text x="65" y="140" font-size="11" font-weight="900" letter-spacing="1" fill="#475569">1. INPUT KEYMATTER (IKM)</text>
  <text x="65" y="165" font-size="13" font-weight="800" fill="#0f172a">ECDH Shared Secret S</text>
  <text x="65" y="185" font-size="11.5" fill="#475569">• Optional Salt input</text>
  <text x="65" y="203" font-size="11.5" fill="#475569">• Variable entropy pool</text>
  <rect x="65" y="222" width="204" height="32" rx="6" fill="#e2e8f0"/>
  <text x="167" y="243" font-size="11" font-weight="800" fill="#334155" text-anchor="middle">Input Entropy Source</text>

  <path d="M 292 192 L 331 192" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <!-- Box 2 -->
  <rect x="339" y="115" width="234" height="155" rx="12" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
  <text x="354" y="140" font-size="11" font-weight="900" letter-spacing="1" fill="#2563eb">2. HKDF-EXTRACT PASS</text>
  <text x="354" y="165" font-size="13" font-weight="800" fill="#1e40af">HMAC-Hash(Salt, IKM)</text>
  <text x="354" y="185" font-size="11.5" fill="#475569">• Extracts a pseudorandom key</text>
  <text x="354" y="203" font-size="11.5" fill="#475569">• Outputs fixed PRK</text>
  <rect x="354" y="222" width="204" height="32" rx="6" fill="#1e40af"/>
  <text x="456" y="243" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">Pseudorandom Key (PRK)</text>

  <path d="M 581 192 L 620 192" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <!-- Box 3 -->
  <rect x="628" y="115" width="234" height="155" rx="12" fill="#f0fdfa" stroke="#0f766e" stroke-width="2"/>
  <text x="643" y="140" font-size="11" font-weight="900" letter-spacing="1" fill="#0f766e">3. HKDF-EXPAND PASS</text>
  <text x="643" y="165" font-size="12.2" font-weight="800" fill="#0f766e">T(i)=HMAC(PRK,T(i-1)||info||i)</text>
  <text x="643" y="185" font-size="11.5" fill="#475569">• Binds context string info</text>
  <text x="643" y="203" font-size="11.5" fill="#475569">• Expands to target length</text>
  <rect x="643" y="222" width="204" height="32" rx="6" fill="#0f766e"/>
  <text x="745" y="243" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">Key Expansion Stream</text>

  <path d="M 870 192 L 909 192" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <!-- Box 4 -->
  <rect x="916" y="115" width="234" height="155" rx="12" fill="#f5f3ff" stroke="#7c3aed" stroke-width="2"/>
  <text x="931" y="140" font-size="11" font-weight="900" letter-spacing="1" fill="#7c3aed">4. OUTPUT KEYMATERIAL</text>
  <text x="931" y="165" font-size="13" font-weight="800" fill="#5b21b6">Derived Traffic Keys</text>
  <text x="931" y="185" font-size="11.5" fill="#475569">• AES Client / Server Keys</text>
  <text x="931" y="203" font-size="11.5" fill="#475569">• IVs &amp; MAC keys derived</text>
  <rect x="931" y="222" width="204" height="32" rx="6" fill="#6d28d9"/>
  <text x="1033" y="243" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">Session Traffic Keys (OKM)</text>
</svg>"""

# 6. certificate-lifetime-timeline.svg
SVGS['certificate-lifetime-timeline.svg'] = """<svg viewBox="0 0 1200 275" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="275" fill="#ffffff"/>
  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">X.509 Certificate Validity Lifetime Evolution</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Tightening maximum certificate validity periods under CA/Browser Forum Baseline Requirements</text>

  <!-- 5 Cards -->
  <rect x="50" y="115" width="176" height="135" rx="10" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="138" y="140" font-size="11" font-weight="900" fill="#475569" text-anchor="middle">MARCH 2018 (SC12)</text>
  <text x="138" y="170" font-size="20" font-weight="800" fill="#0f172a" text-anchor="middle">825 Days</text>
  <text x="138" y="195" font-size="11.5" fill="#475569" text-anchor="middle">~27-Month Certs</text>
  <text x="138" y="228" font-size="10.5" font-weight="600" fill="#64748b" text-anchor="middle">Manual Renewal</text>

  <rect x="281" y="115" width="176" height="135" rx="10" fill="#eff6ff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="369" y="140" font-size="11" font-weight="900" fill="#2563eb" text-anchor="middle">SEPT 2020</text>
  <text x="369" y="170" font-size="20" font-weight="800" fill="#1e40af" text-anchor="middle">398 Days</text>
  <text x="369" y="195" font-size="11.5" fill="#475569" text-anchor="middle">1-Year Standard Certs</text>
  <text x="369" y="228" font-size="10.5" font-weight="600" fill="#2563eb" text-anchor="middle">Browser Root Program Policy</text>

  <rect x="512" y="115" width="176" height="135" rx="10" fill="#f0fdfa" stroke="#5eead4" stroke-width="1.5"/>
  <text x="600" y="140" font-size="11" font-weight="900" fill="#0f766e" text-anchor="middle">MARCH 2026 (CURRENT)</text>
  <text x="600" y="170" font-size="20" font-weight="800" fill="#0f766e" text-anchor="middle">200 Days</text>
  <text x="600" y="195" font-size="11.5" fill="#475569" text-anchor="middle">Shortened Lifespan</text>
  <text x="600" y="228" font-size="10.5" font-weight="600" fill="#0f766e" text-anchor="middle">ACME Recommended</text>

  <rect x="743" y="115" width="176" height="135" rx="10" fill="#fffbeb" stroke="#fcd34d" stroke-width="1.5"/>
  <text x="831" y="140" font-size="11" font-weight="900" fill="#b45309" text-anchor="middle">MARCH 2027</text>
  <text x="831" y="170" font-size="20" font-weight="800" fill="#b45309" text-anchor="middle">100 Days</text>
  <text x="831" y="195" font-size="11.5" fill="#475569" text-anchor="middle">Upcoming Requirement</text>
  <text x="831" y="228" font-size="10.5" font-weight="600" fill="#b45309" text-anchor="middle">Practically Necessitates Automation</text>

  <rect x="974" y="115" width="176" height="135" rx="10" fill="#fef2f2" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="1062" y="140" font-size="11" font-weight="900" fill="#dc2626" text-anchor="middle">MARCH 2029</text>
  <text x="1062" y="170" font-size="20" font-weight="800" fill="#991b1b" text-anchor="middle">47 Days</text>
  <text x="1062" y="195" font-size="11.5" fill="#475569" text-anchor="middle">Maximum Cap</text>
  <text x="1062" y="228" font-size="10.5" font-weight="600" fill="#dc2626" text-anchor="middle">Practically Requires Full Automation</text>
</svg>"""

# 7. ecb-pattern-leak.svg
SVGS['ecb-pattern-leak.svg'] = """<svg viewBox="0 0 1200 370" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="370" fill="#ffffff"/>
  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">ECB Structural Pattern Leakage vs Randomized AEAD</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Electronic Codebook (ECB) maps identical 16-byte plaintext blocks to identical ciphertext blocks, exposing data structure</text>

  <!-- Panel 1 -->
  <rect x="40" y="115" width="340" height="235" rx="12" fill="#f8fafc" stroke="#64748b" stroke-width="2" />
  <text x="60" y="140" font-size="11" font-weight="900" letter-spacing="1" fill="#475569">1. ORIGINAL BITMAP INPUT</text>
  <rect x="80" y="155" width="260" height="110" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
  <circle cx="210" cy="210" r="35" fill="#2563eb" opacity="0.8"/>
  <rect x="185" y="185" width="50" height="50" fill="#f59e0b" opacity="0.8"/>
  <text x="210" y="285" font-size="11.5" font-weight="700" fill="#334155" text-anchor="middle">• Distinct Repeated Image Patterns</text>
  <text x="210" y="305" font-size="11" fill="#475569" text-anchor="middle">• Structured data blocks in memory</text>

  <!-- Panel 2 -->
  <rect x="410" y="115" width="350" height="235" rx="12" fill="#fef2f2" stroke="#dc2626" stroke-width="2" />
  <text x="430" y="140" font-size="11" font-weight="900" letter-spacing="1" fill="#dc2626">2. ECB MODE ENCRYPTION (VULNERABLE)</text>
  <rect x="450" y="155" width="270" height="110" rx="8" fill="#fee2e2" stroke="#fca5a5" stroke-width="1.5"/>
  <circle cx="585" cy="210" r="35" fill="none" stroke="#991b1b" stroke-width="5" stroke-dasharray="5,3"/>
  <rect x="560" y="185" width="50" height="50" fill="none" stroke="#991b1b" stroke-width="5" stroke-dasharray="5,3"/>
  <text x="585" y="285" font-size="11.5" font-weight="800" fill="#991b1b" text-anchor="middle">• Identical blocks yield identical ciphertext</text>
  <text x="585" y="305" font-size="11" fill="#dc2626" text-anchor="middle">• Violates semantic security (IND-CPA)</text>

  <!-- Panel 3 -->
  <rect x="790" y="115" width="370" height="235" rx="12" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" />
  <text x="810" y="140" font-size="11" font-weight="900" letter-spacing="1" fill="#16a34a">3. RANDOMIZED ENCRYPTION (E.G. AES-GCM)</text>
  <rect x="840" y="155" width="270" height="110" rx="8" fill="#dcfce7" stroke="#86efac" stroke-width="1.5"/>
  <pattern id="noise" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
    <rect x="0" y="0" width="5" height="5" fill="#15803d" opacity="0.3"/>
    <rect x="5" y="5" width="5" height="5" fill="#15803d" opacity="0.3"/>
  </pattern>
  <rect x="840" y="155" width="270" height="110" rx="8" fill="url(#noise)"/>
  <text x="975" y="285" font-size="11.5" font-weight="800" fill="#15803d" text-anchor="middle">• Unique IV/counter per message hides patterns</text>
  <text x="975" y="305" font-size="11" fill="#15803d" text-anchor="middle">• Authentication (AEAD tag) is a separate property</text>
</svg>"""

def main():
    print("Writing optimized SVGs with zero box whitespace...")
    for filename, content in SVGS.items():
        path = os.path.join(IMG_DIR, filename)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content.strip() + '\n')
        print(f"  Updated {filename}")
    print("Done!")

if __name__ == '__main__':
    main()
