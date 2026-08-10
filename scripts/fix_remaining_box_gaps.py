#!/usr/bin/env python3
import os, re

IMG_DIR = 'assets/img'
SVGS = {}

# 1. aes-round-operations.svg
SVGS['aes-round-operations.svg'] = """<svg viewBox="0 0 1200 265" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="265" fill="#ffffff"/>
  <defs>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#2563eb"/>
    </marker>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">AES State Matrix Round Transformation Operations</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Four internal algebraic operations executed iteratively across 10 (128-bit), 12 (192-bit), or 14 (256-bit) rounds</text>

  <!-- 4 Round Steps -->
  <rect x="50" y="115" width="234" height="125" rx="10" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
  <text x="65" y="140" font-size="11" font-weight="900" letter-spacing="1" fill="#2563eb">STEP 1: SUBBYTES</text>
  <text x="65" y="165" font-size="14" font-weight="800" fill="#0f172a">Non-linear S-Box</text>
  <text x="65" y="186" font-size="11.5" fill="#475569">• 8-bit lookup substitution</text>
  <text x="65" y="204" font-size="11.5" fill="#475569">• Resists differential attacks</text>

  <path d="M 292 177 L 331 177" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <rect x="339" y="115" width="234" height="125" rx="10" fill="#f0fdfa" stroke="#0f766e" stroke-width="2"/>
  <text x="354" y="140" font-size="11" font-weight="900" letter-spacing="1" fill="#0f766e">STEP 2: SHIFTROWS</text>
  <text x="354" y="165" font-size="14" font-weight="800" fill="#0f766e">Cyclic Byte Shift</text>
  <text x="354" y="186" font-size="11.5" fill="#475569">• Row-wise state rotation</text>
  <text x="354" y="204" font-size="11.5" fill="#475569">• Diffuses byte positions</text>

  <path d="M 581 177 L 620 177" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <rect x="628" y="115" width="234" height="125" rx="10" fill="#fffbeb" stroke="#b45309" stroke-width="2"/>
  <text x="643" y="140" font-size="11" font-weight="900" letter-spacing="1" fill="#b45309">STEP 3: MIXCOLUMNS</text>
  <text x="643" y="165" font-size="14" font-weight="800" fill="#b45309">Matrix Multiplication</text>
  <text x="643" y="186" font-size="11.5" fill="#475569">• Galois Field GF(2^8) math</text>
  <text x="643" y="204" font-size="11.5" fill="#475569">• Spreads bit diffusion</text>

  <path d="M 870 177 L 909 177" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <rect x="916" y="115" width="234" height="125" rx="10" fill="#f5f3ff" stroke="#7c3aed" stroke-width="2"/>
  <text x="931" y="140" font-size="11" font-weight="900" letter-spacing="1" fill="#7c3aed">STEP 4: ADDROUNDKEY</text>
  <text x="931" y="165" font-size="14" font-weight="800" fill="#5b21b6">XOR Round Key</text>
  <text x="931" y="186" font-size="11.5" fill="#475569">• State ⊕ Expanded Key</text>
  <text x="931" y="204" font-size="11.5" fill="#475569">• Key injection phase</text>
</svg>"""

# 2. cbc-bitflip.svg
SVGS['cbc-bitflip.svg'] = """<svg viewBox="0 0 1200 330" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="330" fill="#ffffff"/>
  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">CBC Mode Bit-Flipping Attack Mechanics</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Flipping a ciphertext bit C1[i] alters plaintext P2[i] predictably while scrambling P1 into random garbage</text>

  <!-- Top Row: Normal CBC Decryption (y=115, h=80) -->
  <rect x="50" y="115" width="520" height="80" rx="10" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5"/>
  <text x="70" y="138" font-size="11" font-weight="900" fill="#2563eb">LEGITIMATE CBC DECRYPTION</text>
  <text x="70" y="158" font-size="13" font-weight="800" fill="#0f172a">P2 = Decrypt(K, C2) ⊕ C1</text>
  <text x="70" y="178" font-size="11" fill="#475569">• Decrypting block 2 XORs previous ciphertext block C1 to recover plaintext P2</text>

  <rect x="630" y="115" width="520" height="80" rx="10" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
  <text x="650" y="138" font-size="11" font-weight="900" fill="#16a34a">EXPECTED PLAINTEXT</text>
  <text x="650" y="158" font-size="13" font-weight="800" fill="#15803d">"admin=0;user=alice"</text>
  <text x="650" y="178" font-size="11" fill="#475569">• Authenticated user role parsed normally by application handler</text>

  <!-- Bottom Row: Tampered CBC Decryption (y=210, h=100) -->
  <rect x="50" y="210" width="520" height="100" rx="10" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>
  <text x="70" y="233" font-size="11" font-weight="900" fill="#dc2626">ATTACKER BIT-FLIP MODIFICATION</text>
  <text x="70" y="253" font-size="13" font-weight="800" fill="#991b1b">Flip bit in C1: C1' = C1 ⊕ ('0' ⊕ '1')</text>
  <text x="70" y="273" font-size="11" fill="#475569">• Attacker modifies 1 byte in C1 to target specific character in P2</text>
  <text x="70" y="293" font-size="11" fill="#dc2626">• Side Effect: P1 decrypts into random unusable garbage data</text>

  <rect x="630" y="210" width="520" height="100" rx="10" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>
  <text x="650" y="233" font-size="11" font-weight="900" fill="#dc2626">FORGED PLAINTEXT RESULT</text>
  <text x="650" y="253" font-size="13" font-weight="800" fill="#991b1b">"admin=<tspan fill="#dc2626" font-weight="900">1</tspan>;user=alice"</text>
  <text x="650" y="273" font-size="11" fill="#475569">• Target bit flipped to '1'! Privilege escalation achieved</text>
  <text x="650" y="293" font-size="11" font-weight="700" fill="#dc2626">• Mitigation: Use AEAD (AES-GCM) with Auth Tags to reject modified C1</text>
</svg>"""

# 3. dek-kek.svg
SVGS['dek-kek.svg'] = """<svg viewBox="0 0 1200 350" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="350" fill="#ffffff"/>
  <defs>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#2563eb"/>
    </marker>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#16a34a"/>
    </marker>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">Envelope Encryption Architecture (DEK &amp; KEK)</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Master Key Encryption Key (KEK) inside KMS wraps local Data Encryption Keys (DEKs) protecting bulk payload data</text>

  <rect x="40" y="110" width="1120" height="220" rx="14" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />

  <!-- Box 1 -->
  <rect x="70" y="135" width="340" height="170" rx="10" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>
  <text x="90" y="160" font-size="11" font-weight="900" letter-spacing="1" fill="#94a3b8">CLOUD KMS / HSM (TRUST BOUNDARY)</text>
  <text x="90" y="185" font-size="14.5" font-weight="800" fill="#ffffff">Key Encryption Key (KEK / CMEK)</text>
  <line x1="90" y1="195" x2="390" y2="195" stroke="#475569" stroke-width="1"/>
  <text x="90" y="215" font-size="11.5" fill="#cbd5e1">• KEK never leaves HSM boundary</text>
  <text x="90" y="233" font-size="11.5" fill="#cbd5e1">• Handles Wrap / Unwrap API calls</text>

  <rect x="90" y="252" width="300" height="34" rx="6" fill="#334155"/>
  <text x="240" y="274" font-size="11.5" font-weight="800" fill="#fde047" text-anchor="middle">Customer-Managed Key (CMEK)</text>

  <path d="M 415 220 L 485 220" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <!-- Box 2 -->
  <rect x="490" y="135" width="320" height="170" rx="10" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
  <text x="510" y="160" font-size="11" font-weight="900" letter-spacing="1" fill="#2563eb">APPLICATION MEMORY (RAM)</text>
  <text x="510" y="185" font-size="14.5" font-weight="800" fill="#1e40af">Plaintext DEK (32-byte AES)</text>
  <line x1="510" y1="195" x2="790" y2="195" stroke="#bfdbfe" stroke-width="1"/>
  <text x="510" y="215" font-size="11.5" fill="#475569">• Encrypts/decrypts local bulk data</text>
  <text x="510" y="233" font-size="11.5" fill="#475569">• Zeroed out of memory on unmount</text>

  <rect x="510" y="252" width="280" height="34" rx="6" fill="#1e40af"/>
  <text x="650" y="274" font-size="11.5" font-weight="800" fill="#ffffff" text-anchor="middle">Ephemeral DEK in Memory</text>

  <path d="M 815 220 L 885 220" fill="none" stroke="#16a34a" stroke-width="2.5" marker-end="url(#arrow-green)"/>

  <!-- Box 3 -->
  <rect x="890" y="135" width="240" height="170" rx="10" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
  <text x="910" y="160" font-size="11" font-weight="900" letter-spacing="1" fill="#16a34a">PERSISTENT STORAGE</text>
  <text x="910" y="185" font-size="14.5" font-weight="800" fill="#15803d">Encrypted Data + EDEK</text>
  <line x1="910" y1="195" x2="1110" y2="195" stroke="#86efac" stroke-width="1"/>
  <text x="910" y="215" font-size="11.5" fill="#475569">• Bulk Payload Ciphertext</text>
  <text x="910" y="233" font-size="11.5" fill="#475569">• Wrapped EDEK Header</text>

  <rect x="910" y="252" width="200" height="34" rx="6" fill="#15803d"/>
  <text x="1010" y="274" font-size="11.5" font-weight="800" fill="#ffffff" text-anchor="middle">EDEK Header on Disk</text>
</svg>"""

# 4. hash-avalanche.svg
SVGS['hash-avalanche.svg'] = """<svg viewBox="0 0 1200 315" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="315" fill="#ffffff"/>
  <defs>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#2563eb"/>
    </marker>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">Cryptographic Hash Avalanche Effect</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Flipping a single input bit causes ~50% of output digest bits to change unpredictably</text>

  <rect x="40" y="110" width="1120" height="180" rx="14" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />

  <!-- Input A -->
  <rect x="70" y="130" width="300" height="55" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5"/>
  <text x="90" y="152" font-size="11" font-weight="900" fill="#2563eb">INPUT STRING A</text>
  <text x="90" y="172" font-size="13.5" font-weight="800" fill="#0f172a">"The quick brown fox..."</text>

  <path d="M 375 157 L 455 157" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <!-- Digest A -->
  <rect x="460" y="130" width="670" height="55" rx="8" fill="#1e40af"/>
  <text x="480" y="152" font-size="11" font-weight="900" fill="#bfdbfe">SHA-256 DIGEST A</text>
  <text x="480" y="172" font-size="12.5" font-family="monospace" font-weight="700" fill="#ffffff">5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8</text>

  <!-- Input B -->
  <rect x="70" y="210" width="300" height="55" rx="8" fill="#fef2f2" stroke="#dc2626" stroke-width="1.5"/>
  <text x="90" y="232" font-size="11" font-weight="900" fill="#dc2626">INPUT STRING B (1 BIT FLIPPED)</text>
  <text x="90" y="252" font-size="13.5" font-weight="800" fill="#0f172a">"The quick brown fox<tspan fill="#dc2626" font-weight="900">!</tspan>"</text>

  <path d="M 375 237 L 455 237" fill="none" stroke="#dc2626" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <!-- Digest B -->
  <rect x="460" y="210" width="670" height="55" rx="8" fill="#991b1b"/>
  <text x="480" y="232" font-size="11" font-weight="900" fill="#fca5a5">SHA-256 DIGEST B (~50% BITS CHANGED)</text>
  <text x="480" y="252" font-size="12.5" font-family="monospace" font-weight="700" fill="#ffffff">17a1023a1a6b0c439281f6209e7c3b11823901cf8432a1982b12fe9012cd38f1</text>
</svg>"""

# 5. hmac-flow.svg
SVGS['hmac-flow.svg'] = """<svg viewBox="0 0 1200 315" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="315" fill="#ffffff"/>
  <defs>
    <marker id="arrow-teal" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#0f766e"/>
    </marker>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">HMAC Dual-Nested Key Hashing Pipeline</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Constructs a secure MAC from a suitable cryptographic hash function (e.g., SHA-256) via inner (ipad) and outer (opad) key-padding passes</text>

  <rect x="40" y="110" width="1120" height="185" rx="14" fill="#f0fdfa" stroke="#0f766e" stroke-width="2.5" />

  <!-- Stage 1 -->
  <rect x="70" y="130" width="310" height="145" rx="10" fill="#ffffff" stroke="#0f766e" stroke-width="1.5"/>
  <text x="85" y="152" font-size="11" font-weight="900" letter-spacing="1" fill="#0f766e">1. INNER HASH PASS</text>
  <text x="85" y="174" font-size="13" font-weight="800" fill="#0f172a">Key K ⊕ ipad (0x36)</text>
  <text x="85" y="194" font-size="11.5" fill="#475569">• Prepend padded key share</text>
  <rect x="85" y="215" width="280" height="38" rx="6" fill="#ccfbf1"/>
  <text x="225" y="239" font-size="12" font-weight="800" fill="#0f766e" text-anchor="middle">H((K ⊕ ipad) || M)</text>

  <path d="M 385 202 L 455 202" fill="none" stroke="#0f766e" stroke-width="2.5" marker-end="url(#arrow-teal)"/>

  <!-- Stage 2 -->
  <rect x="460" y="130" width="340" height="145" rx="10" fill="#ffffff" stroke="#0f766e" stroke-width="1.5"/>
  <text x="475" y="152" font-size="11" font-weight="900" letter-spacing="1" fill="#0f766e">2. OUTER HASH PASS</text>
  <text x="475" y="174" font-size="13" font-weight="800" fill="#0f172a">Key K ⊕ opad (0x5c)</text>
  <text x="475" y="194" font-size="11.5" fill="#475569">• Prepend outer padded key</text>
  <rect x="475" y="215" width="310" height="38" rx="6" fill="#ccfbf1"/>
  <text x="630" y="239" font-size="12" font-weight="800" fill="#0f766e" text-anchor="middle">H((K ⊕ opad) || InnerHash)</text>

  <path d="M 805 202 L 875 202" fill="none" stroke="#0f766e" stroke-width="2.5" marker-end="url(#arrow-teal)"/>

  <!-- Stage 3 -->
  <rect x="880" y="130" width="250" height="145" rx="10" fill="#0f766e"/>
  <text x="1005" y="157" font-size="11" font-weight="900" letter-spacing="1" fill="#ccfbf1" text-anchor="middle">FINAL RESULT</text>
  <text x="1005" y="185" font-size="15" font-weight="800" fill="#ffffff" text-anchor="middle">HMAC-SHA256 Tag</text>
  <line x1="910" y1="198" x2="1100" y2="198" stroke="#5eead4" stroke-width="1"/>
  <text x="1005" y="222" font-size="11.5" fill="#ccfbf1" text-anchor="middle">Prevents Length Extension</text>
  <text x="1005" y="240" font-size="11.5" fill="#ccfbf1" text-anchor="middle">&amp; Authenticates Origin (Keyed)</text>
</svg>"""

# 6. signature-pipeline.svg
SVGS['signature-pipeline.svg'] = """<svg viewBox="0 0 1200 365" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="365" fill="#ffffff"/>
  <defs>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#2563eb"/>
    </marker>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#16a34a"/>
    </marker>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">Digital Signature Execution Pipeline</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Three-stage cryptographic pipeline: payload hashing, private key signing, and independent public key verification</text>

  <rect x="40" y="110" width="1120" height="235" rx="14" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />

  <!-- Stage 1 -->
  <rect x="70" y="135" width="310" height="185" rx="10" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
  <text x="90" y="160" font-size="11" font-weight="900" letter-spacing="1" fill="#2563eb">STAGE 1: PAYLOAD HASHING</text>
  <text x="90" y="185" font-size="14" font-weight="800" fill="#0f172a">Message M --&gt; H(M)</text>
  <line x1="90" y1="195" x2="360" y2="195" stroke="#bfdbfe" stroke-width="1"/>
  <text x="90" y="217" font-size="11.5" fill="#475569">• Compute SHA-256 / SHA-512 digest</text>
  <text x="90" y="237" font-size="11.5" fill="#475569">• Ed25519/Ed448 hash internally (RFC 8032)</text>
  <rect x="90" y="257" width="270" height="34" rx="6" fill="#eff6ff"/>
  <text x="225" y="279" font-size="11.5" font-weight="800" fill="#1e40af" text-anchor="middle">Fixed-Size Digest H(M)</text>

  <path d="M 385 227 L 455 227" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <!-- Stage 2 -->
  <rect x="460" y="135" width="340" height="185" rx="10" fill="#ffffff" stroke="#7c3aed" stroke-width="2"/>
  <text x="480" y="160" font-size="11" font-weight="900" letter-spacing="1" fill="#7c3aed">STAGE 2: PRIVATE KEY SIGNING</text>
  <text x="480" y="185" font-size="14" font-weight="800" fill="#0f172a">Sign H(M) with K<sub>priv</sub></text>
  <line x1="480" y1="195" x2="780" y2="195" stroke="#ddd6fe" stroke-width="1"/>
  <text x="480" y="217" font-size="11.5" fill="#475569">• ECDSA uses deterministic nonce (RFC 6979)</text>
  <text x="480" y="237" font-size="11.5" fill="#475569">• EdDSA uses internal SHA-512/SHAKE256</text>
  <rect x="480" y="257" width="300" height="34" rx="6" fill="#f5f3ff"/>
  <text x="630" y="279" font-size="11.5" font-weight="800" fill="#5b21b6" text-anchor="middle">Signature Tag S = Sign(K<sub>priv</sub>, H(M))</text>

  <path d="M 805 227 L 875 227" fill="none" stroke="#16a34a" stroke-width="2.5" marker-end="url(#arrow-green)"/>

  <!-- Stage 3 -->
  <rect x="880" y="135" width="250" height="185" rx="10" fill="#15803d"/>
  <text x="1005" y="160" font-size="11" font-weight="900" letter-spacing="1" fill="#bbf7d0" text-anchor="middle">STAGE 3: VERIFICATION</text>
  <text x="1005" y="185" font-size="14.5" font-weight="800" fill="#ffffff" text-anchor="middle">Verify(K<sub>pub</sub>, H(M'), S)</text>
  <line x1="900" y1="195" x2="1110" y2="195" stroke="#86efac" stroke-width="1"/>
  <text x="1005" y="217" font-size="11.5" fill="#bbf7d0" text-anchor="middle">Verifier computes H(M')</text>
  <text x="1005" y="237" font-size="11.5" fill="#bbf7d0" text-anchor="middle">Validates signature tag S</text>
  <rect x="900" y="253" width="230" height="52" rx="6" fill="#ffffff"/>
  <text x="1005" y="270" font-size="11.5" font-weight="900" fill="#15803d" text-anchor="middle">VALID: PASS</text>
  <text x="1005" y="284" font-size="9.5" font-weight="600" fill="#475569" text-anchor="middle">Key Control &amp; Integrity Proven</text>
  <text x="1005" y="298" font-size="8.5" font-weight="600" fill="#166534" text-anchor="middle">Identity needs a trusted key binding (PKI)</text>
</svg>"""

def main():
    print("Writing tight remaining SVGs...")
    for filename, content in SVGS.items():
        path = os.path.join(IMG_DIR, filename)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content.strip() + '\n')
        print(f"  Fixed {filename}")
    print("Done!")

if __name__ == '__main__':
    main()
