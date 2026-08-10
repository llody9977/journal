#!/usr/bin/env python3
import os, re, xml.etree.ElementTree as ET

IMG_DIR = 'assets/img'

NEW_SVGS = {}

# 1. symmetric-flow.svg
NEW_SVGS['symmetric-flow.svg'] = """<svg viewBox="0 0 1200 340" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="340" fill="#ffffff"/>
  <defs>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#2563eb"/>
    </marker>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#16a34a"/>
    </marker>
    <g id="person">
      <circle cx="0" cy="-9" r="11" />
      <path d="M-17 26 C-17 6 17 6 17 26 Z" />
    </g>
    <g id="key-icon">
      <circle cx="0" cy="0" r="10" fill="none" stroke-width="5" />
      <rect x="8" y="-3" width="24" height="6" />
      <rect x="24" y="3" width="5" height="6" />
      <rect x="31" y="3" width="5" height="9" />
    </g>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">Symmetric Encryption &amp; Decryption Pipeline</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Shared pre-authenticated key K encrypts plaintext into AEAD ciphertext; same key K decrypts and authenticates payloads</text>

  <rect x="40" y="110" width="1120" height="205" rx="14" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />

  <!-- Sender -->
  <g fill="#1d4ed8" transform="translate(100, 175)">
    <use href="#person" transform="scale(1.2)" />
  </g>
  <text x="100" y="225" font-size="13" font-weight="800" fill="#0f172a" text-anchor="middle">Sender</text>
  <text x="100" y="242" font-size="11" font-weight="500" fill="#475569" text-anchor="middle">Cleartext Input</text>

  <path d="M 140 185 L 210 185" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <!-- Encrypt Box -->
  <rect x="215" y="140" width="210" height="90" rx="10" fill="#1e40af" />
  <text x="320" y="168" font-size="14" font-weight="800" fill="#ffffff" text-anchor="middle">AES-256-GCM Encrypt</text>
  <text x="320" y="188" font-size="11" fill="#bfdbfe" text-anchor="middle">AEAD Cipher + CSPRNG IV</text>
  <g fill="#fde047" stroke="#fde047">
    <use href="#key-icon" transform="translate(305,212) scale(0.65)" />
  </g>
  <text x="320" y="217" font-size="11" font-weight="800" fill="#fde047" text-anchor="middle">Shared Key K</text>

  <path d="M 430 185 L 500 185" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <!-- Network / Ciphertext Box -->
  <rect x="505" y="140" width="190" height="90" rx="10" fill="#fef2f2" stroke="#dc2626" stroke-width="1.5"/>
  <text x="600" y="165" font-size="12" font-weight="900" fill="#dc2626" text-anchor="middle">UNTRUSTED NETWORK</text>
  <text x="600" y="185" font-size="13" font-weight="800" fill="#991b1b" text-anchor="middle">Ciphertext + Auth Tag</text>
  <line x1="520" y1="193" x2="680" y2="193" stroke="#fca5a5" stroke-width="1"/>
  <text x="600" y="212" font-size="10.5" font-weight="600" fill="#7f1d1d" text-anchor="middle">Confidentiality &amp; Authenticity</text>

  <path d="M 700 185 L 770 185" fill="none" stroke="#16a34a" stroke-width="2.5" marker-end="url(#arrow-green)"/>

  <!-- Decrypt Box -->
  <rect x="775" y="140" width="210" height="90" rx="10" fill="#15803d" />
  <text x="880" y="168" font-size="14" font-weight="800" fill="#ffffff" text-anchor="middle">AES-256-GCM Decrypt</text>
  <text x="880" y="188" font-size="11" fill="#bbf7d0" text-anchor="middle">Verify Tag &amp; Recover Plaintext</text>
  <g fill="#fde047" stroke="#fde047">
    <use href="#key-icon" transform="translate(865,212) scale(0.65)" />
  </g>
  <text x="880" y="217" font-size="11" font-weight="800" fill="#fde047" text-anchor="middle">Same Key K</text>

  <path d="M 990 185 L 1050 185" fill="none" stroke="#16a34a" stroke-width="2.5" marker-end="url(#arrow-green)"/>

  <!-- Receiver -->
  <g fill="#15803d" transform="translate(1090, 175)">
    <use href="#person" transform="scale(1.2)" />
  </g>
  <text x="1090" y="225" font-size="13" font-weight="800" fill="#0f172a" text-anchor="middle">Receiver</text>
  <text x="1090" y="242" font-size="11" font-weight="500" fill="#475569" text-anchor="middle">Verified Plaintext</text>

  <!-- Summary Footer inside Panel -->
  <rect x="60" y="260" width="1080" height="40" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
  <text x="600" y="284" font-size="12" font-weight="700" fill="#334155" text-anchor="middle">Single Secret Key K: Fast performance, but requires pre-established secure key distribution channel.</text>
</svg>"""

# 2. asymmetric-flow.svg
NEW_SVGS['asymmetric-flow.svg'] = """<svg viewBox="0 0 1200 390" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="390" fill="#ffffff"/>
  <defs>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#2563eb"/>
    </marker>
    <marker id="arrow-purple" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#7c3aed"/>
    </marker>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">Asymmetric Key Pair Operations</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Public key for encryption/verification (distributed freely); Private key for decryption/signing (kept secret)</text>

  <!-- Top Panel: Public Key Encryption (y=110, h=125) -->
  <rect x="40" y="110" width="1120" height="125" rx="12" fill="#eff6ff" stroke="#2563eb" stroke-width="2" />
  <text x="60" y="133" font-size="11" font-weight="900" letter-spacing="1" fill="#2563eb">SCENARIO A: PUBLIC KEY ENCRYPTION / KEM ENCAPSULATION</text>
  
  <rect x="60" y="148" width="220" height="72" rx="8" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="170" y="176" font-size="13" font-weight="800" fill="#1e40af" text-anchor="middle">Sender (Alice)</text>
  <text x="170" y="196" font-size="11" fill="#475569" text-anchor="middle">Holds Bob's Public Key</text>

  <path d="M 285 184 L 375 184" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <rect x="380" y="148" width="340" height="72" rx="8" fill="#1e40af"/>
  <text x="550" y="176" font-size="13" font-weight="800" fill="#ffffff" text-anchor="middle">Encrypt with Bob's Public Key (K<sub>pub</sub>)</text>
  <text x="550" y="196" font-size="11" fill="#bfdbfe" text-anchor="middle">Anyone holding K<sub>pub</sub> can encrypt messages to Bob</text>

  <path d="M 725 184 L 815 184" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <rect x="820" y="148" width="320" height="72" rx="8" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="980" y="176" font-size="13" font-weight="800" fill="#1e40af" text-anchor="middle">Decrypt with Bob's Private Key (K<sub>priv</sub>)</text>
  <text x="980" y="196" font-size="11" fill="#1e40af" text-anchor="middle">ONLY Bob can decrypt (Kept Secret)</text>

  <!-- Bottom Panel: Digital Signature / Verification (y=245, h=125) -->
  <rect x="40" y="245" width="1120" height="125" rx="12" fill="#f5f3ff" stroke="#7c3aed" stroke-width="2" />
  <text x="60" y="268" font-size="11" font-weight="900" letter-spacing="1" fill="#7c3aed">SCENARIO B: DIGITAL SIGNATURE / NON-REPUDIATION EVIDENCE</text>

  <rect x="60" y="283" width="220" height="72" rx="8" fill="#ffffff" stroke="#ddd6fe" stroke-width="1.5"/>
  <text x="170" y="311" font-size="13" font-weight="800" fill="#5b21b6" text-anchor="middle">Signer (Bob)</text>
  <text x="170" y="331" font-size="11" fill="#475569" text-anchor="middle">Holds Private Key K<sub>priv</sub></text>

  <path d="M 285 319 L 375 319" fill="none" stroke="#7c3aed" stroke-width="2.5" marker-end="url(#arrow-purple)"/>

  <rect x="380" y="283" width="340" height="72" rx="8" fill="#6d28d9"/>
  <text x="550" y="311" font-size="13" font-weight="800" fill="#ffffff" text-anchor="middle">Sign Digest with Bob's Private Key (K<sub>priv</sub>)</text>
  <text x="550" y="331" font-size="11" fill="#ddd6fe" text-anchor="middle">Proves private key holder generated signature tag</text>

  <path d="M 725 319 L 815 319" fill="none" stroke="#7c3aed" stroke-width="2.5" marker-end="url(#arrow-purple)"/>

  <rect x="820" y="283" width="320" height="72" rx="8" fill="#ffffff" stroke="#ddd6fe" stroke-width="1.5"/>
  <text x="980" y="311" font-size="13" font-weight="800" fill="#5b21b6" text-anchor="middle">Verify with Bob's Public Key (K<sub>pub</sub>)</text>
  <text x="980" y="331" font-size="11" fill="#5b21b6" text-anchor="middle">Any third party can verify origin &amp; integrity</text>
</svg>"""

# 3. ecb-pattern-leak.svg
NEW_SVGS['ecb-pattern-leak.svg'] = """<svg viewBox="0 0 1200 370" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="370" fill="#ffffff"/>
  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">ECB Structural Pattern Leakage vs Randomized AEAD</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Electronic Codebook (ECB) maps identical 16-byte plaintext blocks to identical ciphertext blocks, exposing data structure</text>

  <!-- Panel 1: Original Image Input (x=40, y=110, w=340, h=235) -->
  <rect x="40" y="110" width="340" height="235" rx="12" fill="#f8fafc" stroke="#64748b" stroke-width="2" />
  <text x="60" y="135" font-size="11" font-weight="900" letter-spacing="1" fill="#475569">1. ORIGINAL BITMAP INPUT</text>
  <rect x="80" y="155" width="260" height="130" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
  <circle cx="210" cy="220" r="45" fill="#2563eb" opacity="0.8"/>
  <rect x="180" y="190" width="60" height="60" fill="#f59e0b" opacity="0.8"/>
  <text x="210" y="308" font-size="12" font-weight="700" fill="#334155" text-anchor="middle">Distinct Repeated Image Patterns</text>

  <!-- Panel 2: ECB Mode Encryption (x=410, y=110, w=350, h=235) -->
  <rect x="410" y="110" width="350" height="235" rx="12" fill="#fef2f2" stroke="#dc2626" stroke-width="2" />
  <text x="430" y="135" font-size="11" font-weight="900" letter-spacing="1" fill="#dc2626">2. ECB MODE ENCRYPTION (VULNERABLE)</text>
  <rect x="450" y="155" width="270" height="130" rx="8" fill="#fee2e2" stroke="#fca5a5" stroke-width="1.5"/>
  <circle cx="585" cy="220" r="45" fill="none" stroke="#991b1b" stroke-width="6" stroke-dasharray="6,4"/>
  <rect x="555" y="190" width="60" height="60" fill="none" stroke="#991b1b" stroke-width="6" stroke-dasharray="6,4"/>
  <text x="585" y="308" font-size="12" font-weight="800" fill="#991b1b" text-anchor="middle">Identical Blocks Yield Identical Ciphertext (Pattern Exposed!)</text>

  <!-- Panel 3: CBC / GCM Mode Encryption (x=790, y=110, w=370, h=235) -->
  <rect x="790" y="110" width="370" height="235" rx="12" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" />
  <text x="810" y="135" font-size="11" font-weight="900" letter-spacing="1" fill="#16a34a">3. RANDOMIZED ENCRYPTION (E.G. AES-GCM)</text>
  <rect x="840" y="155" width="270" height="130" rx="8" fill="#dcfce7" stroke="#86efac" stroke-width="1.5"/>
  <pattern id="noise" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
    <rect x="0" y="0" width="5" height="5" fill="#15803d" opacity="0.3"/>
    <rect x="5" y="5" width="5" height="5" fill="#15803d" opacity="0.3"/>
  </pattern>
  <rect x="840" y="155" width="270" height="130" rx="8" fill="url(#noise)"/>
  <text x="975" y="308" font-size="12" font-weight="800" fill="#15803d" text-anchor="middle">Unique IV/Counter Hides Patterns (Authentication Is Separate)</text>
</svg>"""

# 4. hash-avalanche.svg
NEW_SVGS['hash-avalanche.svg'] = """<svg viewBox="0 0 1200 340" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="340" fill="#ffffff"/>
  <defs>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#2563eb"/>
    </marker>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">Cryptographic Hash Avalanche Effect</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Flipping a single input bit causes ~50% of output digest bits to change unpredictably</text>

  <rect x="40" y="110" width="1120" height="205" rx="14" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />

  <!-- Input A -->
  <rect x="70" y="140" width="300" height="60" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5"/>
  <text x="90" y="165" font-size="11" font-weight="900" fill="#2563eb">INPUT STRING A</text>
  <text x="90" y="186" font-size="14" font-weight="800" fill="#0f172a">"The quick brown fox..."</text>

  <path d="M 375 170 L 455 170" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <!-- Digest A -->
  <rect x="460" y="140" width="670" height="60" rx="8" fill="#1e40af"/>
  <text x="480" y="163" font-size="11" font-weight="900" fill="#bfdbfe">SHA-256 DIGEST A</text>
  <text x="480" y="186" font-size="13" font-family="monospace" font-weight="700" fill="#ffffff">5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8</text>

  <!-- Input B (1 bit modified) -->
  <rect x="70" y="225" width="300" height="60" rx="8" fill="#fef2f2" stroke="#dc2626" stroke-width="1.5"/>
  <text x="90" y="250" font-size="11" font-weight="900" fill="#dc2626">INPUT STRING B (1 BIT FLIPPED)</text>
  <text x="90" y="271" font-size="14" font-weight="800" fill="#0f172a">"The quick brown fox<tspan fill="#dc2626" font-weight="900">!</tspan>"</text>

  <path d="M 375 255 L 455 255" fill="none" stroke="#dc2626" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <!-- Digest B -->
  <rect x="460" y="225" width="670" height="60" rx="8" fill="#991b1b"/>
  <text x="480" y="248" font-size="11" font-weight="900" fill="#fca5a5">SHA-256 DIGEST B (~50% BITS CHANGED)</text>
  <text x="480" y="271" font-size="13" font-family="monospace" font-weight="700" fill="#ffffff">17a1023a1a6b0c439281f6209e7c3b11823901cf8432a1982b12fe9012cd38f1</text>
</svg>"""

# 5. hmac-flow.svg
NEW_SVGS['hmac-flow.svg'] = """<svg viewBox="0 0 1200 360" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="360" fill="#ffffff"/>
  <defs>
    <marker id="arrow-teal" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#0f766e"/>
    </marker>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">HMAC Dual-Nested Key Hashing Pipeline</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Constructs a secure MAC from a suitable cryptographic hash function (e.g., SHA-256) via inner (ipad) and outer (opad) key-padding passes</text>

  <rect x="40" y="110" width="1120" height="225" rx="14" fill="#f0fdfa" stroke="#0f766e" stroke-width="2.5" />

  <!-- Stage 1: Key Prep & Inner Pad -->
  <rect x="70" y="140" width="310" height="165" rx="10" fill="#ffffff" stroke="#0f766e" stroke-width="1.5"/>
  <text x="85" y="165" font-size="11" font-weight="900" letter-spacing="1" fill="#0f766e">1. INNER HASH PASS</text>
  <text x="85" y="188" font-size="13" font-weight="800" fill="#0f172a">Key K ⊕ ipad (0x36)</text>
  <text x="85" y="210" font-size="11.5" fill="#475569">• Prepend padded key share</text>
  <text x="85" y="230" font-size="11.5" fill="#475569">• Append Message payload M</text>
  <rect x="85" y="245" width="280" height="42" rx="6" fill="#ccfbf1"/>
  <text x="225" y="271" font-size="12" font-weight="800" fill="#0f766e" text-anchor="middle">H((K ⊕ ipad) || M)</text>

  <path d="M 385 222 L 455 222" fill="none" stroke="#0f766e" stroke-width="2.5" marker-end="url(#arrow-teal)"/>

  <!-- Stage 2: Outer Hash Pass -->
  <rect x="460" y="140" width="340" height="165" rx="10" fill="#ffffff" stroke="#0f766e" stroke-width="1.5"/>
  <text x="475" y="165" font-size="11" font-weight="900" letter-spacing="1" fill="#0f766e">2. OUTER HASH PASS</text>
  <text x="475" y="188" font-size="13" font-weight="800" fill="#0f172a">Key K ⊕ opad (0x5c)</text>
  <text x="475" y="210" font-size="11.5" fill="#475569">• Prepend outer padded key share</text>
  <text x="475" y="230" font-size="11.5" fill="#475569">• Append Inner Hash Result</text>
  <rect x="475" y="245" width="310" height="42" rx="6" fill="#ccfbf1"/>
  <text x="630" y="271" font-size="12" font-weight="800" fill="#0f766e" text-anchor="middle">H((K ⊕ opad) || InnerHash)</text>

  <path d="M 805 222 L 875 222" fill="none" stroke="#0f766e" stroke-width="2.5" marker-end="url(#arrow-teal)"/>

  <!-- Stage 3: HMAC Tag Output -->
  <rect x="880" y="140" width="250" height="165" rx="10" fill="#0f766e"/>
  <text x="1005" y="175" font-size="12" font-weight="900" letter-spacing="1" fill="#ccfbf1" text-anchor="middle">FINAL RESULT</text>
  <text x="1005" y="205" font-size="16" font-weight="800" fill="#ffffff" text-anchor="middle">HMAC-SHA256 Tag</text>
  <line x1="910" y1="220" x2="1100" y2="220" stroke="#5eead4" stroke-width="1"/>
  <text x="1005" y="245" font-size="11.5" fill="#ccfbf1" text-anchor="middle">Prevents Length Extension</text>
  <text x="1005" y="265" font-size="11.5" fill="#ccfbf1" text-anchor="middle">&amp; Authenticates Origin (Keyed)</text>
</svg>"""

# 6. diffie-hellman.svg
NEW_SVGS['diffie-hellman.svg'] = """<svg viewBox="0 0 1200 480" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="480" fill="#ffffff"/>
  <defs>
    <marker id="arrow-amber" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#b45309"/>
    </marker>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">Diffie-Hellman Key Agreement Architecture</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Endpoints exchange public key shares over an insecure channel to independently compute the same shared secret S</text>

  <!-- Public Domain Parameters Header (y=110, h=50) -->
  <rect x="40" y="110" width="1120" height="50" rx="10" fill="#fffbeb" stroke="#f59e0b" stroke-width="2"/>
  <text x="600" y="140" font-size="13" font-weight="800" fill="#92400e" text-anchor="middle">PUBLIC DOMAIN PARAMETERS: Prime modulus p, Generator g (Known to all, including eavesdroppers)</text>

  <!-- Left: Alice (x=40, y=175, w=530, h=275) -->
  <rect x="40" y="175" width="530" height="275" rx="12" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
  <text x="60" y="202" font-size="11" font-weight="900" letter-spacing="1" fill="#2563eb">PARTY A (ALICE)</text>
  <text x="60" y="228" font-size="13" font-weight="800" fill="#0f172a">1. Generate Ephemeral Private Key: <tspan fill="#dc2626">a</tspan> (Secret RAM)</text>
  <text x="60" y="255" font-size="13" font-weight="800" fill="#0f172a">2. Compute Public Key Share: <tspan fill="#2563eb">A = g<sup>a</sup> mod p</tspan></text>
  <text x="60" y="282" font-size="12" fill="#475569">3. Transmit A across network to Bob --&gt;</text>
  
  <rect x="60" y="305" width="490" height="125" rx="10" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="75" y="330" font-size="11" font-weight="900" fill="#1e40af">4. SHARED SECRET CALCULATION (ALICE)</text>
  <text x="75" y="356" font-size="14" font-weight="800" fill="#1e40af">S = B<sup>a</sup> mod p = (g<sup>b</sup>)<sup>a</sup> mod p = g<sup>ab</sup> mod p</text>
  <line x1="75" y1="368" x2="535" y2="368" stroke="#bfdbfe" stroke-width="1"/>
  <text x="75" y="392" font-size="12" font-weight="700" fill="#16a34a">Result: Shared Secret S derived in Alice's RAM</text>
  <text x="75" y="412" font-size="11" fill="#475569">Passed through HKDF to derive AES-256 session traffic keys</text>

  <!-- Right: Bob (x=630, y=175, w=530, h=275) -->
  <rect x="630" y="175" width="530" height="275" rx="12" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
  <text x="650" y="202" font-size="11" font-weight="900" letter-spacing="1" fill="#16a34a">PARTY B (BOB)</text>
  <text x="650" y="228" font-size="13" font-weight="800" fill="#0f172a">1. Generate Ephemeral Private Key: <tspan fill="#dc2626">b</tspan> (Secret RAM)</text>
  <text x="650" y="255" font-size="13" font-weight="800" fill="#0f172a">2. Compute Public Key Share: <tspan fill="#16a34a">B = g<sup>b</sup> mod p</tspan></text>
  <text x="650" y="282" font-size="12" fill="#475569">&lt;-- 3. Transmit B across network to Alice</text>

  <rect x="650" y="305" width="490" height="125" rx="10" fill="#ffffff" stroke="#86efac" stroke-width="1.5"/>
  <text x="665" y="330" font-size="11" font-weight="900" fill="#15803d">4. SHARED SECRET CALCULATION (BOB)</text>
  <text x="665" y="356" font-size="14" font-weight="800" fill="#15803d">S = A<sup>b</sup> mod p = (g<sup>a</sup>)<sup>b</sup> mod p = g<sup>ab</sup> mod p</text>
  <line x1="665" y1="368" x2="1125" y2="368" stroke="#bbf7d0" stroke-width="1"/>
  <text x="665" y="392" font-size="12" font-weight="700" fill="#16a34a">Result: Identical Shared Secret S derived in Bob's RAM!</text>
  <text x="665" y="412" font-size="11" fill="#475569">Eavesdropper seeing A and B cannot compute S without solving discrete log</text>
</svg>"""

# 7. signature-pipeline.svg
NEW_SVGS['signature-pipeline.svg'] = """<svg viewBox="0 0 1200 410" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="410" fill="#ffffff"/>
  <defs>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#2563eb"/>
    </marker>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#16a34a"/>
    </marker>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">Digital Signature Execution Pipeline</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">RSA-PSS / ECDSA external-hash-then-sign pattern shown below; EdDSA (Ed25519/Ed448) hashes internally as one integrated step, not a separate pre-hash stage</text>

  <rect x="40" y="110" width="1120" height="270" rx="14" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />

  <!-- Stage 1: Hashing -->
  <rect x="70" y="140" width="310" height="210" rx="10" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
  <text x="90" y="168" font-size="11" font-weight="900" letter-spacing="1" fill="#2563eb">STAGE 1: PAYLOAD HASHING</text>
  <text x="90" y="196" font-size="14" font-weight="800" fill="#0f172a">Message M --&gt; H(M)</text>
  <line x1="90" y1="208" x2="360" y2="208" stroke="#bfdbfe" stroke-width="1"/>
  <text x="90" y="232" font-size="12" fill="#475569">• Compute SHA-256 / SHA-512 digest</text>
  <text x="90" y="254" font-size="12" fill="#475569">• Ed25519/Ed448 hash internally per RFC 8032</text>
  <text x="90" y="276" font-size="12" fill="#475569">• Prevents RSA/ECDSA malleability attacks</text>
  <rect x="90" y="295" width="270" height="36" rx="6" fill="#eff6ff"/>
  <text x="225" y="318" font-size="12" font-weight="800" fill="#1e40af" text-anchor="middle">Fixed-Size Digest H(M)</text>

  <path d="M 385 245 L 455 245" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <!-- Stage 2: Private Key Signing -->
  <rect x="460" y="140" width="340" height="210" rx="10" fill="#ffffff" stroke="#7c3aed" stroke-width="2"/>
  <text x="480" y="168" font-size="11" font-weight="900" letter-spacing="1" fill="#7c3aed">STAGE 2: PRIVATE KEY SIGNING</text>
  <text x="480" y="196" font-size="14" font-weight="800" fill="#0f172a">Sign H(M) with K<sub>priv</sub></text>
  <line x1="480" y1="208" x2="780" y2="208" stroke="#ddd6fe" stroke-width="1"/>
  <text x="480" y="232" font-size="12" fill="#475569">• ECDSA uses deterministic nonce (RFC 6979)</text>
  <text x="480" y="254" font-size="12" fill="#475569">• EdDSA uses internal SHA-512/SHAKE256</text>
  <text x="480" y="276" font-size="12" fill="#475569">• Produces unforgeable signature tag S</text>
  <rect x="480" y="295" width="300" height="36" rx="6" fill="#f5f3ff"/>
  <text x="630" y="318" font-size="12" font-weight="800" fill="#5b21b6" text-anchor="middle">Signature Tag S = Sign(K<sub>priv</sub>, H(M))</text>

  <path d="M 805 245 L 875 245" fill="none" stroke="#16a34a" stroke-width="2.5" marker-end="url(#arrow-green)"/>

  <!-- Stage 3: Public Key Verification -->
  <rect x="880" y="140" width="250" height="210" rx="10" fill="#15803d"/>
  <text x="1005" y="168" font-size="11" font-weight="900" letter-spacing="1" fill="#bbf7d0" text-anchor="middle">STAGE 3: VERIFICATION</text>
  <text x="1005" y="196" font-size="15" font-weight="800" fill="#ffffff" text-anchor="middle">Verify(K<sub>pub</sub>, H(M'), S)</text>
  <line x1="900" y1="208" x2="1110" y2="208" stroke="#86efac" stroke-width="1"/>
  <text x="1005" y="235" font-size="12" fill="#bbf7d0" text-anchor="middle">Verifier computes H(M')</text>
  <text x="1005" y="257" font-size="12" fill="#bbf7d0" text-anchor="middle">Validates signature tag S</text>
  <rect x="900" y="280" width="230" height="60" rx="6" fill="#ffffff"/>
  <text x="1005" y="298" font-size="12" font-weight="900" fill="#15803d" text-anchor="middle">VALID: PASS</text>
  <text x="1005" y="314" font-size="10" font-weight="600" fill="#475569" text-anchor="middle">Key Control &amp; Integrity Proven</text>
  <text x="1005" y="330" font-size="9" font-weight="600" fill="#166534" text-anchor="middle">Identity needs a trusted key binding (PKI)</text>
</svg>"""

# 8. ca-hierarchy.svg
NEW_SVGS['ca-hierarchy.svg'] = """<svg viewBox="0 0 1200 440" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="440" fill="#ffffff"/>
  <defs>
    <marker id="arrow-gray" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#64748b"/>
    </marker>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">X.509 Certificate Authority Trust Hierarchy</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Offline Root CA delegates signing authority to Intermediate CAs to issue short-lived End-Entity certificates</text>

  <!-- Root CA Level (y=110, h=90) -->
  <rect x="400" y="110" width="400" height="90" rx="12" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>
  <text x="600" y="138" font-size="11" font-weight="900" letter-spacing="1" fill="#94a3b8" text-anchor="middle">TRUST ANCHOR (OFFLINE ROOT CA)</text>
  <text x="600" y="162" font-size="15" font-weight="800" fill="#ffffff" text-anchor="middle">Self-Signed Root Certificate</text>
  <text x="600" y="183" font-size="11.5" fill="#cbd5e1" text-anchor="middle">Pre-installed in OS / Browser Trust Stores (10-25 yr lifespan, Air-gapped HSM)</text>

  <!-- Connecting Lines Root -> Intermediates -->
  <path d="M 500 200 L 320 245" fill="none" stroke="#64748b" stroke-width="2.5" marker-end="url(#arrow-gray)"/>
  <path d="M 700 200 L 880 245" fill="none" stroke="#64748b" stroke-width="2.5" marker-end="url(#arrow-gray)"/>

  <!-- Intermediate CAs Level (y=250, h=90) -->
  <rect x="100" y="250" width="440" height="90" rx="10" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
  <text x="320" y="275" font-size="11" font-weight="900" letter-spacing="1" fill="#2563eb" text-anchor="middle">ISSUING CA (INTERMEDIATE CA 1)</text>
  <text x="320" y="297" font-size="14" font-weight="800" fill="#1e40af" text-anchor="middle">Signed by Root CA</text>
  <text x="320" y="318" font-size="11" fill="#475569" text-anchor="middle">Active online signing CA for web/TLS certificates</text>

  <rect x="660" y="250" width="440" height="90" rx="10" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
  <text x="880" y="275" font-size="11" font-weight="900" letter-spacing="1" fill="#2563eb" text-anchor="middle">ISSUING CA (INTERMEDIATE CA 2)</text>
  <text x="880" y="297" font-size="14" font-weight="800" fill="#1e40af" text-anchor="middle">Signed by Root CA</text>
  <text x="880" y="318" font-size="11" fill="#475569" text-anchor="middle">Backup / specialized issuing CA branch</text>

  <!-- Connecting Lines Intermediates -> Leaf -->
  <path d="M 320 340 L 480 375" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow-gray)"/>
  <path d="M 880 340 L 720 375" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow-gray)"/>

  <!-- Leaf Level (y=380, h=45) -->
  <rect x="420" y="380" width="360" height="45" rx="8" fill="#15803d"/>
  <text x="600" y="408" font-size="13" font-weight="800" fill="#ffffff" text-anchor="middle">Leaf / End-Entity Certificate (example.com)</text>
</svg>"""

# 9. tls-handshake.svg
NEW_SVGS['tls-handshake.svg'] = """<svg viewBox="0 0 1200 570" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="570" fill="#ffffff"/>
  <defs>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#2563eb"/>
    </marker>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10Z" fill="#16a34a"/>
    </marker>
  </defs>

  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">TLS 1.3 1-RTT Handshake Architecture</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Full handshake completed in 1 Round-Trip Time (1-RTT) using Ephemeral ECDHE key shares and AEAD encryption</text>

  <rect x="40" y="110" width="1120" height="430" rx="14" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />

  <!-- Client Column -->
  <rect x="80" y="130" width="220" height="50" rx="8" fill="#1e40af"/>
  <text x="190" y="160" font-size="14" font-weight="800" fill="#ffffff" text-anchor="middle">CLIENT (BROWSER)</text>
  <line x1="190" y1="180" x2="190" y2="510" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4,4"/>

  <!-- Server Column -->
  <rect x="900" y="130" width="220" height="50" rx="8" fill="#15803d"/>
  <text x="1010" y="160" font-size="14" font-weight="800" fill="#ffffff" text-anchor="middle">SERVER (WEB HOST)</text>
  <line x1="1010" y1="180" x2="1010" y2="510" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4,4"/>

  <!-- Step 1: ClientHello (Flight 1) -->
  <path d="M 190 210 L 1000 210" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>
  <rect x="360" y="190" width="480" height="40" rx="6" fill="#eff6ff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="600" y="215" font-size="12" font-weight="800" fill="#1e40af" text-anchor="middle">1. ClientHello: Supported Ciphers + Ephemeral Key Share g<sup>x</sup> (+ ECH SNI)</text>

  <!-- Step 2: ServerHello & Handshake Encrypted (Flight 2) -->
  <path d="M 1010 300 L 200 300" fill="none" stroke="#16a34a" stroke-width="2.5" marker-end="url(#arrow-green)"/>
  <rect x="270" y="250" width="660" height="85" rx="8" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
  <text x="600" y="273" font-size="12" font-weight="800" fill="#15803d" text-anchor="middle">2. ServerHello: Selected Cipher + Server Key Share g<sup>y</sup></text>
  <text x="600" y="293" font-size="11.5" fill="#166534" text-anchor="middle">[Encrypted Handshake Extensions: Certificate + CertificateVerify + Finished]</text>
  <text x="600" y="313" font-size="11" fill="#475569" text-anchor="middle">Both endpoints derive the handshake secret via HKDF, then the master secret --&gt; Traffic Keys</text>

  <!-- Step 3: Client Finished (Flight 3) -->
  <path d="M 190 365 L 1000 365" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>
  <rect x="300" y="345" width="600" height="40" rx="6" fill="#eff6ff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="600" y="370" font-size="12" font-weight="800" fill="#1e40af" text-anchor="middle">3. [Encrypted] Client Finished (+ Certificate/CertificateVerify only if client auth requested)</text>

  <!-- Step 4: Application Data (Encrypted) -->
  <path d="M 190 435 L 1000 435" fill="none" stroke="#15803d" stroke-width="3" marker-end="url(#arrow-green)"/>
  <rect x="300" y="415" width="600" height="40" rx="6" fill="#15803d"/>
  <text x="600" y="440" font-size="12.5" font-weight="800" fill="#ffffff" text-anchor="middle">4. Encrypted Application Data (HTTP/2 over the TLS record layer, or HTTP/3 over QUIC)</text>

  <rect x="120" y="480" width="960" height="40" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
  <text x="600" y="504" font-size="12" font-weight="700" fill="#334155" text-anchor="middle">Perfect Forward Secrecy (PFS): Compromise of long-term server cert key cannot decrypt past traffic sessions.</text>
</svg>"""

# 10. password-hash-comparison.svg
NEW_SVGS['password-hash-comparison.svg'] = """<svg viewBox="0 0 1200 410" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="410" fill="#ffffff"/>
  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">Password Hashing Throughput &amp; GPU Resistance</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">Illustrative logarithmic benchmark throughput across password hashing algorithms (Lower throughput = stronger offline resistance)</text>

  <rect x="40" y="110" width="1120" height="270" rx="14" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />

  <!-- Y-Axis -->
  <line x1="120" y1="140" x2="120" y2="330" stroke="#64748b" stroke-width="2"/>
  <text x="110" y="150" font-size="10.5" fill="#475569" text-anchor="end" font-weight="700">100 Billion / s</text>
  <text x="110" y="210" font-size="10.5" fill="#475569" text-anchor="end" font-weight="700">1 Million / s</text>
  <text x="110" y="270" font-size="10.5" fill="#475569" text-anchor="end" font-weight="700">10,000 / s</text>
  <text x="110" y="325" font-size="10.5" fill="#475569" text-anchor="end" font-weight="700">&lt; 10 / s</text>

  <!-- X-Axis Base -->
  <line x1="120" y1="330" x2="1100" y2="330" stroke="#64748b" stroke-width="2"/>

  <!-- SHA-256 Bar -->
  <rect x="180" y="145" width="160" height="185" fill="#dc2626" rx="4"/>
  <text x="260" y="135" font-size="13" font-weight="800" fill="#dc2626" text-anchor="middle">SHA-256</text>
  <text x="260" y="235" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">~100 Billion / s</text>
  <text x="260" y="350" font-size="11" font-weight="700" fill="#dc2626" text-anchor="middle">Vulnerable to GPU Cracking</text>
  <text x="260" y="365" font-size="10" fill="#475569" text-anchor="middle">Fast General Digest (Unsuitable)</text>

  <!-- bcrypt Bar -->
  <rect x="420" y="270" width="160" height="60" fill="#d97706" rx="4"/>
  <text x="500" y="260" font-size="13" font-weight="800" fill="#d97706" text-anchor="middle">bcrypt</text>
  <text x="500" y="305" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">~10,000 / s</text>
  <text x="500" y="350" font-size="11" font-weight="700" fill="#d97706" text-anchor="middle">CPU-Bound Slowness</text>
  <text x="500" y="365" font-size="10" fill="#475569" text-anchor="middle">Approved Legacy (72-byte max)</text>

  <!-- scrypt Bar -->
  <rect x="660" y="295" width="160" height="35" fill="#0d9488" rx="4"/>
  <text x="740" y="285" font-size="13" font-weight="800" fill="#0d9488" text-anchor="middle">scrypt</text>
  <text x="740" y="318" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">~1,000 / s</text>
  <text x="740" y="350" font-size="11" font-weight="700" fill="#0d9488" text-anchor="middle">Memory-Hard Defense</text>
  <text x="740" y="365" font-size="10" fill="#475569" text-anchor="middle">Early Memory-Hard Standard</text>

  <!-- Argon2id Bar -->
  <rect x="900" y="318" width="160" height="12" fill="#1d4ed8" rx="3"/>
  <text x="980" y="308" font-size="13" font-weight="800" fill="#1d4ed8" text-anchor="middle">Argon2id</text>
  <text x="980" y="350" font-size="11" font-weight="800" fill="#1d4ed8" text-anchor="middle">RFC 9106 / OWASP Recommended</text>
  <text x="980" y="365" font-size="10" fill="#475569" text-anchor="middle">Hybrid Memory-Hard (First Choice)</text>
</svg>"""

# 11. dek-kek.svg
NEW_SVGS['dek-kek.svg'] = """<svg viewBox="0 0 1200 420" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="420" fill="#ffffff"/>
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

  <rect x="40" y="110" width="1120" height="280" rx="14" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />

  <!-- Box 1: KMS Hardware Security Module (y=140, h=220) -->
  <rect x="70" y="140" width="340" height="220" rx="10" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>
  <text x="90" y="168" font-size="11" font-weight="900" letter-spacing="1" fill="#94a3b8">CLOUD KMS / HSM (TRUST BOUNDARY)</text>
  <text x="90" y="196" font-size="15" font-weight="800" fill="#ffffff">Key Encryption Key (KEK / CMEK)</text>
  <line x1="90" y1="208" x2="390" y2="208" stroke="#475569" stroke-width="1"/>
  <text x="90" y="232" font-size="12" fill="#cbd5e1">• KEK stays in the HSM security boundary (by design)</text>
  <text x="90" y="254" font-size="12" fill="#cbd5e1">• Handles Wrap / Unwrap API calls</text>
  <text x="90" y="276" font-size="12" fill="#cbd5e1">• Scheduled rotation creates new KEK versions</text>
  <rect x="90" y="295" width="300" height="40" rx="6" fill="#334155"/>
  <text x="240" y="320" font-size="12" font-weight="800" fill="#fde047" text-anchor="middle">Customer-Managed Key (CMEK)</text>

  <path d="M 415 250 L 485 250" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <!-- Box 2: Application Memory (RAM) -->
  <rect x="490" y="140" width="320" height="220" rx="10" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
  <text x="510" y="168" font-size="11" font-weight="900" letter-spacing="1" fill="#2563eb">APPLICATION MEMORY (RAM)</text>
  <text x="510" y="196" font-size="15" font-weight="800" fill="#1e40af">Plaintext DEK (32-byte AES)</text>
  <line x1="510" y1="208" x2="790" y2="208" stroke="#bfdbfe" stroke-width="1"/>
  <text x="510" y="232" font-size="12" fill="#475569">• Encrypts/decrypts local bulk data</text>
  <text x="510" y="254" font-size="12" fill="#475569">• High-speed local AES-GCM operations</text>
  <text x="510" y="276" font-size="12" fill="#475569">• Should be zeroed when unmounted (impl.-dependent)</text>
  <rect x="510" y="295" width="280" height="40" rx="6" fill="#1e40af"/>
  <text x="650" y="320" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">Ephemeral DEK in Memory</text>

  <path d="M 815 250 L 885 250" fill="none" stroke="#16a34a" stroke-width="2.5" marker-end="url(#arrow-green)"/>

  <!-- Box 3: Persistent Storage (Disk) -->
  <rect x="890" y="140" width="240" height="220" rx="10" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
  <text x="910" y="168" font-size="11" font-weight="900" letter-spacing="1" fill="#16a34a">PERSISTENT STORAGE</text>
  <text x="910" y="196" font-size="15" font-weight="800" fill="#15803d">Encrypted Data + EDEK</text>
  <line x1="910" y1="208" x2="1110" y2="208" stroke="#86efac" stroke-width="1"/>
  <text x="910" y="232" font-size="12" fill="#475569">• Bulk Payload Ciphertext</text>
  <text x="910" y="254" font-size="12" fill="#475569">• Wrapped EDEK Header</text>
  <rect x="910" y="295" width="200" height="40" rx="6" fill="#15803d"/>
  <text x="1010" y="320" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">EDEK Header on Disk</text>
</svg>"""

# 12. key-size-comparison.svg
NEW_SVGS['key-size-comparison.svg'] = """<svg viewBox="0 0 1200 430" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif">
  <rect width="1200" height="430" fill="#ffffff"/>
  <text x="50" y="55" font-size="30" font-weight="850" fill="#0f172a">Asymmetric Key Size Growth vs Symmetric Security Strength</text>
  <text x="50" y="82" font-size="14.5" fill="#475569">NIST Security Strength levels: RSA key sizes scale sub-exponentially compared to ECC linear efficiency</text>

  <rect x="40" y="110" width="1120" height="290" rx="14" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />

  <!-- Bar Chart Columns -->
  <!-- Header Row -->
  <text x="160" y="145" font-size="12" font-weight="900" fill="#475569" text-anchor="middle">Symmetric Security Strength</text>
  <text x="450" y="145" font-size="12" font-weight="900" fill="#dc2626" text-anchor="middle">RSA Key Length (Bits) -- Sub-Exponential Growth</text>
  <text x="900" y="145" font-size="12" font-weight="900" fill="#16a34a" text-anchor="middle">ECC Key Length (Bits) -- Linear Efficiency</text>

  <!-- Level 1: 112 Bits -->
  <rect x="80" y="165" width="160" height="45" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="160" y="192" font-size="13" font-weight="800" fill="#334155" text-anchor="middle">112 Bits (Legacy)</text>
  
  <rect x="280" y="165" width="340" height="45" rx="6" fill="#fef2f2" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="450" y="192" font-size="13" font-weight="800" fill="#991b1b" text-anchor="middle">RSA 2048 Bits</text>

  <rect x="680" y="165" width="440" height="45" rx="6" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
  <text x="900" y="192" font-size="13" font-weight="800" fill="#166534" text-anchor="middle">ECC 224 Bits (P-224)</text>

  <!-- Level 2: 128 Bits -->
  <rect x="80" y="220" width="160" height="45" rx="6" fill="#eff6ff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="160" y="247" font-size="13" font-weight="800" fill="#1e40af" text-anchor="middle">128 Bits (Standard)</text>

  <rect x="280" y="220" width="340" height="45" rx="6" fill="#fee2e2" stroke="#f87171" stroke-width="1.5"/>
  <text x="450" y="247" font-size="13" font-weight="800" fill="#991b1b" text-anchor="middle">RSA 3072 Bits</text>

  <rect x="680" y="220" width="440" height="45" rx="6" fill="#dcfce7" stroke="#4ade80" stroke-width="1.5"/>
  <text x="900" y="247" font-size="13" font-weight="800" fill="#166534" text-anchor="middle">ECC 256 Bits (P-256 / Ed25519)</text>

  <!-- Level 3: 192 Bits -->
  <rect x="80" y="275" width="160" height="45" rx="6" fill="#eff6ff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="160" y="302" font-size="13" font-weight="800" fill="#1e40af" text-anchor="middle">192 Bits (High)</text>

  <rect x="280" y="275" width="340" height="45" rx="6" fill="#fca5a5" stroke="#ef4444" stroke-width="1.5"/>
  <text x="450" y="302" font-size="13" font-weight="800" fill="#7f1d1d" text-anchor="middle">RSA 7680 Bits (Impractical)</text>

  <rect x="680" y="275" width="440" height="45" rx="6" fill="#bbf7d0" stroke="#22c55e" stroke-width="1.5"/>
  <text x="900" y="302" font-size="13" font-weight="800" fill="#14532d" text-anchor="middle">ECC 384 Bits (P-384)</text>

  <!-- Level 4: 256 Bits -->
  <rect x="80" y="330" width="160" height="45" rx="6" fill="#eff6ff" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="160" y="357" font-size="13" font-weight="800" fill="#1e40af" text-anchor="middle">256 Bits (Max)</text>

  <rect x="280" y="330" width="340" height="45" rx="6" fill="#f87171" stroke="#dc2626" stroke-width="1.5"/>
  <text x="450" y="357" font-size="13" font-weight="800" fill="#ffffff" text-anchor="middle">RSA 15360 Bits (Extreme CPU Overhead)</text>

  <rect x="680" y="330" width="440" height="45" rx="6" fill="#86efac" stroke="#16a34a" stroke-width="1.5"/>
  <text x="900" y="357" font-size="13" font-weight="800" fill="#14532d" text-anchor="middle">ECC 521 Bits (P-521)</text>
</svg>"""

TIGHTEN_HEIGHTS = {
    'ecb-openssl-block-leak.svg': 325,
    'cbc-bitflip.svg': 430,
    'ctr-two-time-pad.svg': 425,
    'aes-round-operations.svg': 320,
    'cryptography-threats.svg': 355,
    'quantum-algorithm-impact.svg': 490,
    'hash-security-properties.svg': 365,
    'hkdf-extract-expand.svg': 345,
    'certificate-lifecycle.svg': 435,
    'certificate-lifetime-timeline.svg': 315,
    'tls-cryptography-layers.svg': 565,
    'sct-flow.svg': 415,
    'certificate-transparency-merkle-tree.svg': 745,
    'full-disk-encryption-scope.svg': 490,
    'blockchain-cryptography-layers.svg': 565,
    'hybrid-public-key-encryption.svg': 585,
}

def main():
    print("Writing 12 standardized small SVGs...")
    for filename, content in NEW_SVGS.items():
        path = os.path.join(IMG_DIR, filename)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content.strip() + '\n')
        print(f"  Updated {filename}")

    print("\nTightening viewBox heights of 16 existing 1200px SVGs...")
    for filename, new_h in TIGHTEN_HEIGHTS.items():
        path = os.path.join(IMG_DIR, filename)
        if not os.path.exists(path): continue
        with open(path, 'r', encoding='utf-8') as f:
            code = f.read()

        code = re.sub(r'viewBox=["\']0 0 1200 \d+["\']', f'viewBox="0 0 1200 {new_h}"', code)
        code = re.sub(r'<rect width="1200" height="\d+"', f'<rect width="1200" height="{new_h}"', code)
        code = re.sub(r'<rect x="0" y="0" width="1200" height="\d+"', f'<rect x="0" y="0" width="1200" height="{new_h}"', code)

        with open(path, 'w', encoding='utf-8') as f:
            f.write(code)
        print(f"  Tightened {filename} -> viewBox 1200x{new_h}")

    print("\nSVG Standardization Complete!")

if __name__ == '__main__':
    main()
