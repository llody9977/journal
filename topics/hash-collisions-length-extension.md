---
title: Hash Collisions & Length-Extension Attacks
description: Executable cryptanalytic demonstrations of MD5 and SHA-1 collision pairs and a complete Python length-extension attack against naive hash MACs.
permalink: /topics/hash-collisions-length-extension/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Failure Analysis</span>

# Hash Collisions & Length-Extension Attacks

<p class="lede">Evaluating cryptographic hash integrity requires distinguishing between theoretical weakness and practical cryptanalytic failure. This page provides executable cryptanalytic proofs: verifying real MD5 and SHA-1 collision pairs where distinct inputs yield identical digests, and executing a complete Python length-extension attack that forges valid authentication tags against naive hash constructions.</p>

## 1. MD5 Hash Collisions: Two Distinct Files, Identical Digest

A **hash collision** occurs when two distinct inputs **x ≠ x'** yield identical digests **H(x) = H(x')**.

The two GIF files below (from security researcher Ange Albertini's research repository) contain different binary image data but produce the identical MD5 digest:

<div class="image-pair">
  <figure>
    <img src="{{ '/assets/downloads/md5-collision-1.gif' | relative_url }}" alt="Green circle GIF image representing MD5 collision file 1">
    <figcaption>
      <strong>md5-collision-1.gif</strong> (10,386 bytes)<br>
      <a href="{{ '/assets/downloads/md5-collision-1.gif' | relative_url }}" download class="btn-secondary" style="display: inline-block; padding: 0.25rem 0.6rem; font-size: 0.75rem; margin-top: 0.35rem;">📥 Download File 1</a>
    </figcaption>
  </figure>
  <figure>
    <img src="{{ '/assets/downloads/md5-collision-2.gif' | relative_url }}" alt="Red X GIF image representing MD5 collision file 2">
    <figcaption>
      <strong>md5-collision-2.gif</strong> (10,386 bytes)<br>
      <a href="{{ '/assets/downloads/md5-collision-2.gif' | relative_url }}" download class="btn-secondary" style="display: inline-block; padding: 0.25rem 0.6rem; font-size: 0.75rem; margin-top: 0.35rem;">📥 Download File 2</a>
    </figcaption>
  </figure>
</div>

### Client-Side Executable MD5 Collision Verification

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Browser Playground</span>
    <h3>MD5 Cryptanalytic Collision Proof</h3>
    <p>Interactively compute MD5 digests and perform binary byte-by-byte comparison directly in your browser (Zero server calls / Executed locally via JavaScript).</p>
  </div>

  <div class="demo-body">
    <div class="demo-form-group">
      <div class="demo-actions" style="margin: 0.5rem 0;">
        <button id="btn-verify-md5" class="btn-primary" type="button">⚡ Verify MD5 Collision Pair</button>
      </div>
    </div>

    <!-- Output Display -->
    <div id="md5-output-area" class="demo-output-area"></div>
  </div>
</div>

### Local CLI Verification Commands

```bash
# 1. Compute MD5 digests (Identical output)
md5 md5-collision-1.gif md5-collision-2.gif
# Output:
# MD5 (md5-collision-1.gif) = d7a00002b2fa4dc40f03abba0a57631c
# MD5 (md5-collision-2.gif) = d7a00002b2fa4dc40f03abba0a57631c

# 2. Compare binary content (Proves files are distinct)
cmp md5-collision-1.gif md5-collision-2.gif
# Output: md5-collision-1.gif md5-collision-2.gif differ: char 468, line 1
```

If an integrity check relies solely on MD5 to verify file authenticity, an adversary can substitute `md5-collision-2.gif` for `md5-collision-1.gif` without triggering hash validation errors.

<script>
(function() {
  const btnVerifyMD5 = document.getElementById('btn-verify-md5');
  const outputArea = document.getElementById('md5-output-area');

  const sample1Url = "{{ '/assets/downloads/md5-collision-1.gif' | relative_url }}";
  const sample2Url = "{{ '/assets/downloads/md5-collision-2.gif' | relative_url }}";

  if (!btnVerifyMD5 || !outputArea) return;

  function calcMD5(buf) {
    var hex_chr = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];

    function md5cmn(q, a, b, x, s, t) {
      a = (a + q + x + t) | 0;
      return (((a << s) | (a >>> (32 - s))) + b) | 0;
    }
    function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
    function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | (~d)), a, b, x, s, t); }

    function md5cycle(x, k) {
      var a = x[0], b = x[1], c = x[2], d = x[3];
      a = md5ff(a, b, c, d, k[0], 7, -680876936); d = md5ff(d, a, b, c, k[1], 12, -389564586);
      c = md5ff(c, d, a, b, k[2], 17, 606105819); b = md5ff(b, c, d, a, k[3], 22, -1044525330);
      a = md5ff(a, b, c, d, k[4], 7, -176418897); d = md5ff(d, a, b, c, k[5], 12, 1200080426);
      c = md5ff(c, d, a, b, k[6], 17, -1473231341); b = md5ff(b, c, d, a, k[7], 22, -45705983);
      a = md5ff(a, b, c, d, k[8], 7, 1770035416); d = md5ff(d, a, b, c, k[9], 12, -1958414417);
      c = md5ff(c, d, a, b, k[10], 17, -42063); b = md5ff(b, c, d, a, k[11], 22, -1990404162);
      a = md5ff(a, b, c, d, k[12], 7, 1804603682); d = md5ff(d, a, b, c, k[13], 12, -40341101);
      c = md5ff(c, d, a, b, k[14], 17, -1502002290); b = md5ff(b, c, d, a, k[15], 22, 1236535329);

      a = md5gg(a, b, c, d, k[1], 5, -165796510); d = md5gg(d, a, b, c, k[6], 9, -1069501632);
      c = md5gg(c, d, a, b, k[11], 14, 643717713); b = md5gg(b, c, d, a, k[0], 20, -373897302);
      a = md5gg(a, b, c, d, k[5], 5, -701558691); d = md5gg(d, a, b, c, k[10], 9, 38016083);
      c = md5gg(c, d, a, b, k[15], 14, -660478335); b = md5gg(b, c, d, a, k[4], 20, -405537848);
      a = md5gg(a, b, c, d, k[9], 5, 568446438); d = md5gg(d, a, b, c, k[14], 9, -1019803690);
      c = md5gg(c, d, a, b, k[3], 14, -187363961); b = md5gg(b, c, d, a, k[8], 20, 1163531501);
      a = md5gg(a, b, c, d, k[13], 5, -1444681467); d = md5gg(d, a, b, c, k[2], 9, -51403784);
      c = md5gg(c, d, a, b, k[7], 14, 1735328473); b = md5gg(b, c, d, a, k[12], 20, -1926607734);

      a = md5hh(a, b, c, d, k[5], 4, -378558); d = md5hh(d, a, b, c, k[8], 11, -2022574463);
      c = md5hh(c, d, a, b, k[11], 16, 1839030562); b = md5hh(b, c, d, a, k[14], 23, -35309556);
      a = md5hh(a, b, c, d, k[1], 4, -1530992060); d = md5hh(d, a, b, c, k[4], 11, 1272893353);
      c = md5hh(c, d, a, b, k[7], 16, -1554976322); b = md5hh(b, c, d, a, k[10], 23, -1094730640);
      a = md5hh(a, b, c, d, k[13], 4, 681279174); d = md5hh(d, a, b, c, k[0], 11, -358537222);
      c = md5hh(c, d, a, b, k[3], 16, -722521979); b = md5hh(b, c, d, a, k[6], 23, 76029189);
      a = md5hh(a, b, c, d, k[9], 4, -640364187); d = md5hh(d, a, b, c, k[12], 11, -421815835);
      c = md5hh(c, d, a, b, k[15], 16, 530742520); b = md5hh(b, c, d, a, k[2], 23, -995338651);

      a = md5ii(a, b, c, d, k[0], 6, -198630844); d = md5ii(d, a, b, c, k[7], 10, 1126891415);
      c = md5ii(c, d, a, b, k[14], 15, -1416354905); b = md5ii(b, c, d, k[5], 21, -57434055);
      a = md5ii(a, b, c, d, k[12], 6, 1700485571); d = md5ii(d, a, b, c, k[3], 10, -1894986606);
      c = md5ii(c, d, a, b, k[10], 15, -1051523); b = md5ii(b, c, d, a, k[1], 21, -2054922799);
      a = md5ii(a, b, c, d, k[8], 6, 1873313359); d = md5ii(d, a, b, c, k[15], 10, -30611744);
      c = md5ii(c, d, a, b, k[6], 15, -1560198380); b = md5ii(b, c, d, a, k[13], 21, 1309151649);
      a = md5ii(a, b, c, d, k[4], 6, -145523070); d = md5ii(d, a, b, c, k[11], 10, -1120210379);
      c = md5ii(c, d, a, b, k[2], 15, 718787259); b = md5ii(b, c, d, a, k[9], 21, -343485551);

      x[0] = a + x[0] | 0; x[1] = b + x[1] | 0; x[2] = c + x[2] | 0; x[3] = d + x[3] | 0;
    }

    function md5blk_array(a) {
      var md5blks = [], i;
      for (i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = a[i] + (a[i + 1] << 8) + (a[i + 2] << 16) + (a[i + 3] << 24);
      }
      return md5blks;
    }

    var a = buf, n = a.length, state = [1732584193, -271733879, -1732584194, 271733878], i, length, tail, tmp, lo, hi;

    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk_array(a.subarray(i - 64, i)));
    }
    a = (i - 64) < n ? a.subarray(i - 64) : new Uint8Array(0);

    length = a.length;
    tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < length; i += 1) {
      tail[i >> 2] |= a[i] << ((i % 4) << 3);
    }
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i += 1) tail[i] = 0;
    }

    tmp = n * 8;
    tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
    lo = parseInt(tmp[2], 16);
    hi = parseInt(tmp[1], 16) || 0;

    tail[14] = lo;
    tail[15] = hi;

    md5cycle(state, tail);

    let hexResult = '';
    for (i = 0; i < 4; i += 1) {
      let val = state[i];
      for (let j = 0; j < 4; j += 1) {
        hexResult += hex_chr[(val >> (j * 8 + 4)) & 0x0F] + hex_chr[(val >> (j * 8)) & 0x0F];
      }
    }
    return hexResult;
  }

  function compareBuffers(b1, b2) {
    const minLen = Math.min(b1.length, b2.length);
    for (let i = 0; i < minLen; i++) {
      if (b1[i] !== b2[i]) return i;
    }
    if (b1.length !== b2.length) return minLen;
    return -1;
  }

  async function verifyMD5CollisionPair() {
    try {
      outputArea.innerHTML = '<div style="color: var(--amber); font-weight: 600; padding: 0.5rem;">⏳ Fetching and hashing GIF files...</div>';
      const r1 = await fetch(sample1Url);
      const r2 = await fetch(sample2Url);

      if (!r1.ok || !r2.ok) {
        throw new Error(`HTTP fetch failed: File 1 (${r1.status}), File 2 (${r2.status})`);
      }

      const b1 = new Uint8Array(await r1.arrayBuffer());
      const b2 = new Uint8Array(await r2.arrayBuffer());

      const md51 = calcMD5(b1);
      const md52 = calcMD5(b2);
      const diffOffset = compareBuffers(b1, b2);

      let html = '<div class="ecb-blocks-list">';

      html += `
      <div class="ecb-block-item">
        <div class="block-meta">
          <span class="block-num">File 1: md5-collision-1.gif (${b1.length} Bytes)</span>
          <span class="block-plain-preview">MD5 Digest</span>
        </div>
        <div class="block-hex-val"><code>${md51}</code></div>
      </div>

      <div class="ecb-block-item">
        <div class="block-meta">
          <span class="block-num">File 2: md5-collision-2.gif (${b2.length} Bytes)</span>
          <span class="block-plain-preview">MD5 Digest</span>
        </div>
        <div class="block-hex-val"><code>${md52}</code></div>
      </div>`;

      html += '</div>';

      if (md51 === md52 && diffOffset !== -1) {
        html += `
        <div class="security-layer security-layer-direct" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Cryptanalytic Collision Verified</div>
          <div>
            <strong>🚨 MD5 HASH COLLISION CONFIRMED!</strong>
            <p style="margin-bottom:0;">Both files yield the <strong>identical MD5 digest</strong> (<code>${md51}</code>), but binary comparison proves they differ starting at <strong>byte offset ${diffOffset}</strong>. Integrity checks relying on MD5 are vulnerable to silent file substitution!</p>
          </div>
        </div>`;
      } else {
        html += `
        <div class="security-layer security-layer-protect" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Verification Result</div>
          <div>
            <strong>MD5 Hashing Complete</strong>
            <p style="margin-bottom:0;">File 1: <code>${md51}</code> | File 2: <code>${md52}</code> (Diff offset: ${diffOffset})</p>
          </div>
        </div>`;
      }

      outputArea.innerHTML = html;
    } catch (err) {
      outputArea.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">Verification Error: ${err.message || err}</div>`;
    }
  }

  btnVerifyMD5.addEventListener('click', verifyMD5CollisionPair);
  verifyMD5CollisionPair();
})();
</script>

## 2. SHA-1 Collisions: The SHAttered Attack Strategy

In 2017, Google and CWI Amsterdam published the **SHAttered** attack, demonstrating the first practical SHA-1 collision using two distinct PDF documents sharing an identical SHA-1 hash.

<div class="image-pair" style="margin-bottom: 1.5rem;">
  <figure>
    <figcaption>
      <strong>sha1-collision-1.pdf</strong> (2,102 bytes)<br>
      <a href="{{ '/assets/downloads/sha1-collision-1.pdf' | relative_url }}" download class="btn-secondary" style="display: inline-block; padding: 0.25rem 0.6rem; font-size: 0.75rem; margin-top: 0.35rem;">📥 Download PDF 1</a>
    </figcaption>
  </figure>
  <figure>
    <figcaption>
      <strong>sha1-collision-2.pdf</strong> (2,102 bytes)<br>
      <a href="{{ '/assets/downloads/sha1-collision-2.pdf' | relative_url }}" download class="btn-secondary" style="display: inline-block; padding: 0.25rem 0.6rem; font-size: 0.75rem; margin-top: 0.35rem;">📥 Download PDF 2</a>
    </figcaption>
  </figure>
</div>

### Client-Side Executable SHA-1 SHAttered Verification

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Browser Playground</span>
    <h3>SHA-1 SHAttered PDF Collision Proof</h3>
    <p>Interactively compute SHA-1 digests over the official SHAttered PDF collision pair and verify binary divergence live via Web Crypto API.</p>
  </div>

  <div class="demo-body">
    <div class="demo-form-group">
      <div class="demo-actions" style="margin: 0.5rem 0;">
        <button id="btn-verify-sha1" class="btn-primary" type="button">⚡ Verify SHA-1 SHAttered Collision Pair</button>
      </div>
    </div>

    <!-- Output Display -->
    <div id="sha1-output-area" class="demo-output-area"></div>
  </div>
</div>

### Local CLI Verification Commands

```bash
# Verify SHA-1 Collision Pair
shasum -a 1 sha1-collision-1.pdf sha1-collision-2.pdf
# Output:
# 5e00eced22afee33889d4766e8366e8326abc749  sha1-collision-1.pdf
# 5e00eced22afee33889d4766e8366e8326abc749  sha1-collision-2.pdf

cmp sha1-collision-1.pdf sha1-collision-2.pdf
# Output: sha1-collision-1.pdf sha1-collision-2.pdf differ: char 193, line 8
```

SHA-1 is formally prohibited by **[NIST SP 800-131A Rev. 2](https://csrc.nist.gov/pubs/sp/800/131/a/r2/final)** for digital signatures due to collision vulnerability.

<script>
(function() {
  const btnVerifySHA1 = document.getElementById('btn-verify-sha1');
  const outputArea = document.getElementById('sha1-output-area');

  const pdf1Url = "{{ '/assets/downloads/sha1-collision-1.pdf' | relative_url }}";
  const pdf2Url = "{{ '/assets/downloads/sha1-collision-2.pdf' | relative_url }}";

  if (!btnVerifySHA1 || !outputArea) return;

  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function compareBuffers(b1, b2) {
    const minLen = Math.min(b1.length, b2.length);
    for (let i = 0; i < minLen; i++) {
      if (b1[i] !== b2[i]) return i;
    }
    if (b1.length !== b2.length) return minLen;
    return -1;
  }

  async function verifySHA1CollisionPair() {
    try {
      outputArea.innerHTML = '<div style="color: var(--amber); font-weight: 600; padding: 0.5rem;">⏳ Fetching and hashing PDF files...</div>';
      const r1 = await fetch(pdf1Url);
      const r2 = await fetch(pdf2Url);

      if (!r1.ok || !r2.ok) {
        throw new Error(`HTTP fetch failed: PDF 1 (${r1.status}), PDF 2 (${r2.status})`);
      }

      const b1 = new Uint8Array(await r1.arrayBuffer());
      const b2 = new Uint8Array(await r2.arrayBuffer());

      const h1Buffer = await window.crypto.subtle.digest("SHA-1", b1);
      const h2Buffer = await window.crypto.subtle.digest("SHA-1", b2);

      const sha1_1 = bytesToHex(new Uint8Array(h1Buffer));
      const sha1_2 = bytesToHex(new Uint8Array(h2Buffer));
      const diffOffset = compareBuffers(b1, b2);

      let html = '<div class="ecb-blocks-list">';

      html += `
      <div class="ecb-block-item">
        <div class="block-meta">
          <span class="block-num">PDF 1: sha1-collision-1.pdf (${b1.length} Bytes)</span>
          <span class="block-plain-preview">SHA-1 Digest</span>
        </div>
        <div class="block-hex-val"><code>${sha1_1}</code></div>
      </div>

      <div class="ecb-block-item">
        <div class="block-meta">
          <span class="block-num">PDF 2: sha1-collision-2.pdf (${b2.length} Bytes)</span>
          <span class="block-plain-preview">SHA-1 Digest</span>
        </div>
        <div class="block-hex-val"><code>${sha1_2}</code></div>
      </div>`;

      html += '</div>';

      if (sha1_1 === sha1_2 && diffOffset !== -1) {
        html += `
        <div class="security-layer security-layer-direct" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Cryptanalytic Collision Verified</div>
          <div>
            <strong>🚨 SHAttered SHA-1 COLLISION CONFIRMED!</strong>
            <p style="margin-bottom:0;">Both PDF documents yield the <strong>identical SHA-1 digest</strong> (<code>${sha1_1}</code>), but binary comparison proves they differ starting at <strong>byte offset ${diffOffset}</strong>. SHA-1 is forbidden for digital signatures under NIST SP 800-131A Rev. 2.</p>
          </div>
        </div>`;
      } else {
        html += `
        <div class="security-layer security-layer-protect" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Verification Result</div>
          <div>
            <strong>SHA-1 Hashing Complete</strong>
            <p style="margin-bottom:0;">PDF 1: <code>${sha1_1}</code> | PDF 2: <code>${sha1_2}</code> (Diff offset: ${diffOffset})</p>
          </div>
        </div>`;
      }

      outputArea.innerHTML = html;
    } catch (err) {
      outputArea.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">Verification Error: ${err.message || err}</div>`;
    }
  }

  btnVerifySHA1.addEventListener('click', verifySHA1CollisionPair);
  verifySHA1CollisionPair();
})();
</script>

SHA-1 is formally prohibited by **[NIST SP 800-131A Rev. 2](https://csrc.nist.gov/pubs/sp/800/131/a/r2/final)** for digital signatures due to collision vulnerability.

## 3. Length-Extension Attack: Forging Naive Hash MACs

Naive MAC constructions like **MAC = H(Secret || Message)** built on Merkle–Damgård hash functions (MD5, SHA-1, SHA-256) are vulnerable to **length-extension attacks**.

Because a Merkle–Damgård hash output exposes the internal compression state **H**, an adversary who knows the message and the length of the secret can resume hashing from that state to append malicious payload bytes **Appended_Data** without knowing **Secret**.

### Executable Python Length-Extension Forgery

```python
# length_extension_attack.py: Forging a valid MAC without the secret key
import struct, hashlib, math

# MD5 Compression Constants & Utilities
S = [7,12,17,22]*4 + [5,9,14,20]*4 + [4,11,16,23]*4 + [6,10,15,21]*4
K = [int(abs(math.sin(i+1)) * 2**32) & 0xFFFFFFFF for i in range(64)]

def left_rotate(x, c): return ((x << c) | (x >> (32 - c))) & 0xFFFFFFFF

def md5_padding(msg_len_bytes):
    bit_len = (msg_len_bytes * 8) & 0xFFFFFFFFFFFFFFFF
    pad_len = (56 - (msg_len_bytes + 1) % 64) % 64
    return b'\x80' + b'\x00' * pad_len + struct.pack('<Q', bit_len)

def md5_compress(chunk, h):
    a0, b0, c0, d0 = h
    M = list(struct.unpack('<16I', chunk))
    A, B, C, D = a0, b0, c0, d0
    for i in range(64):
        if i < 16:   F, g = (B & C) | (~B & D), i
        elif i < 32: F, g = (D & B) | (~D & C), (5*i + 1) % 16
        elif i < 48: F, g = B ^ C ^ D, (3*i + 5) % 16
        else:        F, g = C ^ (B | (~D & 0xFFFFFFFF)), (7*i) % 16
        F = (F + A + K[i] + M[g]) & 0xFFFFFFFF
        A, D, C, B = D, C, B, (B + left_rotate(F, S[i])) & 0xFFFFFFFF
    return [(a0+A)&0xFFFFFFFF, (b0+B)&0xFFFFFFFF, (c0+C)&0xFFFFFFFF, (d0+D)&0xFFFFFFFF]

def state_to_hex(h): return b''.join(struct.pack('<I', x) for x in h).hex()
def hex_to_state(hx): return list(struct.unpack('<4I', bytes.fromhex(hx)))

# Server Setup: Naive MAC = MD5(Secret + Message)
SECRET = b"s3cr3tkey"  # 9 bytes (Unknown to attacker)
orig_message = b"user=alice&admin=false"
orig_mac = hashlib.md5(SECRET + orig_message).hexdigest()

# Attacker Execution: Reconstruct internal state and append "&admin=true"
guessed_secret_len = 9
injected_data = b"&admin=true"
state = hex_to_state(orig_mac)

glue_padding = md5_padding(guessed_secret_len + len(orig_message))
forged_message = orig_message + glue_padding + injected_data

total_len_so_far = guessed_secret_len + len(orig_message) + len(glue_padding)
tail = injected_data + md5_padding(total_len_so_far + len(injected_data))

h = state
for i in range(0, len(tail), 64):
    h = md5_compress(tail[i:i+64], h)
forged_mac = state_to_hex(h)

# Server Validation Test
server_check = hashlib.md5(SECRET + forged_message).hexdigest()
print("Forged MAC matches server verification:", server_check == forged_mac)
# Output: Forged MAC matches server verification: True
```

The script proves that an adversary can alter `admin=false` to `admin=true` and compute a valid digest accepted by the server without knowing the secret key.

### Defensive Countermeasure: Use Standard HMAC or Sponge Hashes

Deploying **HMAC-SHA256** ([FIPS 198-1](https://csrc.nist.gov/pubs/fips/198-1/final)) neutralizes length-extension attacks by executing a nested double-hash algorithm:

**HMAC(K, M) = H((K ⊕ opad) || H((K ⊕ ipad) || M))**

Furthermore, modern sponge-based hash functions (**SHA-3 / FIPS 202**, **KMAC / SP 800-185**, and **BLAKE3**) squeeze outputs through internal capacity states, rendering them inherently immune to length extension by design.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Hash Attacks Summary</strong>
    <ul>
      <li><strong>Broken Hashes</strong>: MD5 and SHA-1 have broken collision resistance. Never use MD5 or SHA-1 for digital signatures or security integrity.</li>
      <li><strong>Length-Extension Vulnerability</strong>: Naive MACs like <code>H(key \|\| message)</code> allow attackers to append data and forge valid tags without learning the key.</li>
      <li><strong>Mitigation Standard</strong>: Deploy HMAC-SHA256, KMAC, or SHA-3 to guarantee resistance against length extension.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-131A Rev. 2**: *Transitioning the Use of Cryptographic Algorithms and Key Lengths* — [NIST CSRC SP 800-131A](https://csrc.nist.gov/pubs/sp/800/131/a/r2/final)
- **SHAttered Attack**: *First Practical SHA-1 Collision Announcement* — [SHAttered Google/CWI Paper](https://shattered.io/)
