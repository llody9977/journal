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
    <img src="{{ '/assets/downloads/md5-collision-1.gif' | relative_url }}" alt="A green circle GIF image representing MD5 collision file 1">
    <figcaption>md5-collision-1.gif (10,386 bytes)</figcaption>
  </figure>
  <figure>
    <img src="{{ '/assets/downloads/md5-collision-2.gif' | relative_url }}" alt="A red X GIF image representing MD5 collision file 2">
    <figcaption>md5-collision-2.gif (10,386 bytes)</figcaption>
  </figure>
</div>

### Client-Side Executable MD5 Collision Verification Playground

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Browser Playground</span>
    <h3>MD5 Collision Pair & Upload Verification Playground</h3>
    <p>Upload any custom files or load the famous GIF collision pair. Compute MD5 digests and perform binary byte-by-byte comparison directly in your browser (Zero server calls / Executed locally via JavaScript).</p>
  </div>

  <div class="demo-body">
    <!-- Image Pair Display -->
    <div class="image-pair" style="margin-bottom: 1rem;">
      <figure>
        <img id="md5-img-1" src="{{ '/assets/downloads/md5-collision-1.gif' | relative_url }}" alt="Green circle GIF">
        <figcaption id="md5-cap-1">md5-collision-1.gif (10,386 bytes)</figcaption>
      </figure>
      <figure>
        <img id="md5-img-2" src="{{ '/assets/downloads/md5-collision-2.gif' | relative_url }}" alt="Red X GIF">
        <figcaption id="md5-cap-2">md5-collision-2.gif (10,386 bytes)</figcaption>
      </figure>
    </div>

    <!-- File Inputs -->
    <div class="demo-form-group">
      <label>1. Select / Upload Two Files to Compare:</label>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
        <div>
          <small><strong>File 1 (GIF / Image / Any file):</strong></small>
          <input type="file" id="md5-file-1" class="demo-input" style="padding: 0.35rem;">
        </div>
        <div>
          <small><strong>File 2 (GIF / Image / Any file):</strong></small>
          <input type="file" id="md5-file-2" class="demo-input" style="padding: 0.35rem;">
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="demo-form-group">
      <div class="demo-actions" style="margin: 0.5rem 0;">
        <button id="btn-load-md5-sample" class="btn-primary" type="button">🖼️ Load MD5 Sample Collision Pair</button>
        <button id="btn-verify-md5-upload" class="btn-secondary" type="button">⚡ Verify Uploaded Files</button>
      </div>
    </div>

    <!-- Output Display -->
    <div id="md5-output-area" class="demo-output-area"></div>
  </div>
</div>

<script>
(function() {
  const file1Input = document.getElementById('md5-file-1');
  const file2Input = document.getElementById('md5-file-2');
  const btnSample = document.getElementById('btn-load-md5-sample');
  const btnVerify = document.getElementById('btn-verify-md5-upload');
  const outputArea = document.getElementById('md5-output-area');
  const img1 = document.getElementById('md5-img-1');
  const img2 = document.getElementById('md5-img-2');
  const cap1 = document.getElementById('md5-cap-1');
  const cap2 = document.getElementById('md5-cap-2');

  const sample1Url = "{{ '/assets/downloads/md5-collision-1.gif' | relative_url }}";
  const sample2Url = "{{ '/assets/downloads/md5-collision-2.gif' | relative_url }}";

  if (!btnSample || !outputArea) return;

  // Pure JS MD5 Implementation for Uint8Array
  function calcMD5(uint8) {
    let n = uint8.length;
    let words = [];
    for (let i = 0; i < n; i++) {
      words[i >> 2] |= uint8[i] << ((i % 4) * 8);
    }
    words[n >> 2] |= 0x80 << ((n % 4) * 8);
    words[(((n + 8) >> 6) << 4) + 14] = n * 8;
    
    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    
    function cmn(q,a,b,x,s,t) {
      let sum = (a + q + x + t) | 0;
      return (((sum << s) | (sum >>> (32 - s))) + b) | 0;
    }
    function ff(a,b,c,d,x,s,t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a,b,c,d,x,s,t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a,b,c,d,x,s,t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a,b,c,d,x,s,t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }

    for (let i = 0; i < words.length; i += 16) {
      let olda = a, oldb = b, oldc = c, oldd = d;
      a = ff(a, b, c, d, words[i+0], 7, -680876936);
      d = ff(d, a, b, c, words[i+1], 12, -389564586);
      c = ff(c, d, a, b, words[i+2], 17,  606105819);
      b = ff(b, c, d, a, words[i+3], 22, -1044525330);
      a = ff(a, b, c, d, words[i+4], 7, -176418897);
      d = ff(d, a, b, c, words[i+5], 12,  1200080426);
      c = ff(c, d, a, b, words[i+6], 17, -1473231341);
      b = ff(b, c, d, a, words[i+7], 22, -45705983);
      a = ff(a, b, c, d, words[i+8], 7,  1770035416);
      d = ff(d, a, b, c, words[i+9], 12, -1958414417);
      c = ff(c, d, a, b, words[i+10], 17, -42063);
      b = ff(b, c, d, a, words[i+11], 22, -1990404162);
      a = ff(a, b, c, d, words[i+12], 7,  1804603682);
      d = ff(d, a, b, c, words[i+13], 12, -40341101);
      c = ff(c, d, a, b, words[i+14], 17, -1502002290);
      b = ff(b, c, d, a, words[i+15], 22,  1236535329);

      a = gg(a, b, c, d, words[i+1], 5, -165796510);
      d = gg(d, a, b, c, words[i+6], 9, -1069501632);
      c = gg(c, d, a, b, words[i+11], 14,  643717713);
      b = gg(b, c, d, a, words[i+0], 20, -373897302);
      a = gg(a, b, c, d, words[i+5], 5, -701558691);
      d = gg(d, a, b, c, words[i+10], 9,  38016083);
      c = gg(c, d, a, b, words[i+15], 14, -660478335);
      b = gg(b, c, d, a, words[i+4], 20, -405537848);
      a = gg(a, b, c, d, words[i+9], 5,  568446438);
      d = gg(d, a, b, c, words[i+14], 9, -1019803690);
      c = gg(c, d, a, b, words[i+3], 14, -187363961);
      b = gg(b, c, d, a, words[i+8], 20,  1163531501);
      a = gg(a, b, c, d, words[i+13], 5, -1444681467);
      d = gg(d, a, b, c, words[i+2], 9, -51403784);
      c = gg(c, d, a, b, words[i+7], 14,  1735328473);
      b = gg(b, c, d, a, words[i+12], 20, -1926607734);

      a = hh(a, b, c, d, words[i+5], 4, -378558);
      d = hh(d, a, b, c, words[i+8], 11, -2022574463);
      c = hh(c, d, a, b, words[i+11], 16,  1839030562);
      b = hh(b, c, d, a, words[i+14], 23, -35309556);
      a = hh(a, b, c, d, words[i+1], 4, -1530992060);
      d = hh(d, a, b, c, words[i+4], 11,  1272893353);
      c = hh(c, d, a, b, words[i+7], 16, -1554976322);
      b = hh(b, c, d, a, words[i+10], 23, -1094730640);
      a = hh(a, b, c, d, words[i+13], 4,  681279174);
      d = hh(d, a, b, c, words[i+0], 11, -358537222);
      c = hh(c, d, a, b, words[i+3], 16, -722521979);
      b = hh(b, c, d, a, words[i+6], 23,  76029189);
      a = hh(a, b, c, d, words[i+9], 4, -640364187);
      d = hh(d, a, b, c, words[i+12], 11, -421815835);
      c = hh(c, d, a, b, words[i+15], 16,  530742520);
      b = hh(b, c, d, a, words[i+2], 23, -995338651);

      a = ii(a, b, c, d, words[i+0], 6, -198630844);
      d = ii(d, a, b, c, words[i+7], 10,  1126891415);
      c = ii(c, d, a, b, words[i+14], 15, -1416354905);
      b = ii(b, c, d, a, words[i+5], 21, -57434055);
      a = ii(a, b, c, d, words[i+12], 6,  1700485571);
      d = ii(d, a, b, c, words[i+3], 10, -1894980668);
      c = ii(c, d, a, b, words[i+10], 15, -1051523);
      b = ii(b, c, d, a, words[i+1], 21, -2054922799);
      a = ii(a, b, c, d, words[i+8], 6,  1873313359);
      d = ii(d, a, b, c, words[i+15], 10, -30611744);
      c = ii(c, d, a, b, words[i+6], 15, -1560198380);
      b = ii(b, c, d, a, words[i+13], 21,  1309151649);
      a = ii(a, b, c, d, words[i+4], 6, -145523070);
      d = ii(d, a, b, c, words[i+11], 10, -1120210379);
      c = ii(c, d, a, b, words[i+2], 15,  718787259);
      b = ii(b, c, d, a, words[i+9], 21, -343485551);

      a = (a + olda) | 0;
      b = (b + oldb) | 0;
      c = (c + oldc) | 0;
      d = (d + oldd) | 0;
    }
    
    return [a, b, c, d].map(x => {
      let hex = (x >>> 0).toString(16).padStart(8, '0');
      return hex.match(/../g).reverse().join('');
    }).join('');
  }

  function compareBuffers(b1, b2) {
    const minLen = Math.min(b1.length, b2.length);
    for (let i = 0; i < minLen; i++) {
      if (b1[i] !== b2[i]) return i;
    }
    if (b1.length !== b2.length) return minLen;
    return -1; // identical
  }

  async function verifyBuffers(name1, b1, name2, b2) {
    const md51 = calcMD5(b1);
    const md52 = calcMD5(b2);
    const diffOffset = compareBuffers(b1, b2);

    const isCollision = (md51 === md52) && (diffOffset !== -1);

    let html = '<div class="ecb-blocks-list">';

    html += `
    <div class="ecb-block-item">
      <div class="block-meta">
        <span class="block-num">File 1: ${name1} (${b1.length} Bytes)</span>
        <span class="block-plain-preview">MD5 Digest</span>
      </div>
      <div class="block-hex-val"><code>${md51}</code></div>
    </div>

    <div class="ecb-block-item">
      <div class="block-meta">
        <span class="block-num">File 2: ${name2} (${b2.length} Bytes)</span>
        <span class="block-plain-preview">MD5 Digest</span>
      </div>
      <div class="block-hex-val"><code>${md52}</code></div>
    </div>`;

    html += '</div>';

    if (isCollision) {
      html += `
      <div class="security-layer security-layer-direct" style="margin-top: 1.25rem;">
        <div class="security-layer-label">Cryptanalytic Collision Verified</div>
        <div>
          <strong>🚨 MD5 HASH COLLISION CONFIRMED!</strong>
          <p style="margin-bottom:0;">Both files yield the <strong>identical MD5 digest</strong> (<code>${md51}</code>), but binary comparison proves they differ starting at <strong>byte offset ${diffOffset}</strong>. Integrity checks relying on MD5 are vulnerable to silent file substitution!</p>
        </div>
      </div>`;
    } else if (diffOffset === -1) {
      html += `
      <div class="security-layer security-layer-protect" style="margin-top: 1.25rem;">
        <div class="security-layer-label">Binary Match</div>
        <div>
          <strong>✔ Files Are Identical</strong>
          <p style="margin-bottom:0;">Both files contain identical binary bytes.</p>
        </div>
      </div>`;
    } else {
      html += `
      <div class="security-layer security-layer-protect" style="margin-top: 1.25rem;">
        <div class="security-layer-label">No Collision</div>
        <div>
          <strong>✔ Distinct MD5 Digests</strong>
          <p style="margin-bottom:0;">Files yield different MD5 digests as expected. Differ at byte offset ${diffOffset}.</p>
        </div>
      </div>`;
    }

    outputArea.innerHTML = html;
  }

  async function loadSamplePair() {
    try {
      outputArea.innerHTML = '<div style="color: var(--amber); font-weight: 600; padding: 0.5rem;">⏳ Fetching sample collision pair...</div>';
      const r1 = await fetch(sample1Url);
      const r2 = await fetch(sample2Url);
      const b1 = new Uint8Array(await r1.arrayBuffer());
      const b2 = new Uint8Array(await r2.arrayBuffer());

      img1.src = sample1Url;
      img2.src = sample2Url;
      cap1.textContent = `md5-collision-1.gif (${b1.length} bytes)`;
      cap2.textContent = `md5-collision-2.gif (${b2.length} bytes)`;

      await verifyBuffers("md5-collision-1.gif", b1, "md5-collision-2.gif", b2);
    } catch (err) {
      outputArea.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">Sample Load Error: ${err.message || err}</div>`;
    }
  }

  function readFileBytes(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(new Uint8Array(e.target.result));
      reader.onerror = err => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  async function handleVerifyUpload() {
    try {
      const f1 = file1Input.files[0];
      const f2 = file2Input.files[0];

      if (!f1 || !f2) {
        outputArea.innerHTML = '<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">⚠️ Please select two files to verify.</div>';
        return;
      }

      outputArea.innerHTML = '<div style="color: var(--amber); font-weight: 600; padding: 0.5rem;">⏳ Reading and hashing uploaded files...</div>';
      const b1 = await readFileBytes(f1);
      const b2 = await readFileBytes(f2);

      if (f1.type.startsWith('image/')) img1.src = URL.createObjectURL(f1);
      if (f2.type.startsWith('image/')) img2.src = URL.createObjectURL(f2);
      cap1.textContent = `${f1.name} (${b1.length} bytes)`;
      cap2.textContent = `${f2.name} (${b2.length} bytes)`;

      await verifyBuffers(f1.name, b1, f2.name, b2);
    } catch (err) {
      outputArea.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">File Verification Error: ${err.message || err}</div>`;
    }
  }

  btnSample.addEventListener('click', loadSamplePair);
  btnVerify.addEventListener('click', handleVerifyUpload);

  loadSamplePair();
})();
</script>

## 2. SHA-1 Collisions: The SHAttered Attack Strategy

In 2017, Google and CWI Amsterdam published the **SHAttered** attack, demonstrating the first practical SHA-1 collision using two distinct PDF documents sharing an identical SHA-1 hash.

### Client-Side Executable SHA-1 SHAttered Verification Playground

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Browser Playground</span>
    <h3>SHA-1 SHAttered PDF Collision Playground</h3>
    <p>Upload PDF documents or load the official SHAttered PDF collision pair to compute SHA-1 digests and verify binary divergence live via Web Crypto API.</p>
  </div>

  <div class="demo-body">
    <!-- File Upload Inputs -->
    <div class="demo-form-group">
      <label>Select / Upload PDF Documents to Verify:</label>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
        <div>
          <small><strong>PDF Document 1:</strong></small>
          <input type="file" id="sha1-file-1" class="demo-input" accept=".pdf" style="padding: 0.35rem;">
        </div>
        <div>
          <small><strong>PDF Document 2:</strong></small>
          <input type="file" id="sha1-file-2" class="demo-input" accept=".pdf" style="padding: 0.35rem;">
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="demo-form-group">
      <div class="demo-actions" style="margin: 0.5rem 0;">
        <button id="btn-load-sha1-sample" class="btn-primary" type="button">📄 Load SHAttered SHA-1 PDF Sample Pair</button>
        <button id="btn-verify-sha1-upload" class="btn-secondary" type="button">⚡ Verify Uploaded PDFs</button>
      </div>
    </div>

    <!-- Output Display -->
    <div id="sha1-output-area" class="demo-output-area"></div>
  </div>
</div>

<script>
(function() {
  const sha1File1 = document.getElementById('sha1-file-1');
  const sha1File2 = document.getElementById('sha1-file-2');
  const btnSample = document.getElementById('btn-load-sha1-sample');
  const btnVerify = document.getElementById('btn-verify-sha1-upload');
  const outputArea = document.getElementById('sha1-output-area');

  const pdf1Url = "{{ '/assets/downloads/sha1-collision-1.pdf' | relative_url }}";
  const pdf2Url = "{{ '/assets/downloads/sha1-collision-2.pdf' | relative_url }}";

  if (!btnSample || !outputArea) return;

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

  async function verifySHA1Buffers(name1, b1, name2, b2) {
    const h1Buffer = await window.crypto.subtle.digest("SHA-1", b1);
    const h2Buffer = await window.crypto.subtle.digest("SHA-1", b2);

    const sha1_1 = bytesToHex(new Uint8Array(h1Buffer));
    const sha1_2 = bytesToHex(new Uint8Array(h2Buffer));
    const diffOffset = compareBuffers(b1, b2);

    const isCollision = (sha1_1 === sha1_2) && (diffOffset !== -1);

    let html = '<div class="ecb-blocks-list">';

    html += `
    <div class="ecb-block-item">
      <div class="block-meta">
        <span class="block-num">PDF 1: ${name1} (${b1.length} Bytes)</span>
        <span class="block-plain-preview">SHA-1 Digest</span>
      </div>
      <div class="block-hex-val"><code>${sha1_1}</code></div>
    </div>

    <div class="ecb-block-item">
      <div class="block-meta">
        <span class="block-num">PDF 2: ${name2} (${b2.length} Bytes)</span>
        <span class="block-plain-preview">SHA-1 Digest</span>
      </div>
      <div class="block-hex-val"><code>${sha1_2}</code></div>
    </div>`;

    html += '</div>';

    if (isCollision) {
      html += `
      <div class="security-layer security-layer-direct" style="margin-top: 1.25rem;">
        <div class="security-layer-label">Cryptanalytic Collision Verified</div>
        <div>
          <strong>🚨 SHAttered SHA-1 COLLISION CONFIRMED!</strong>
          <p style="margin-bottom:0;">Both PDF documents yield the <strong>identical SHA-1 digest</strong> (<code>${sha1_1}</code>), but binary comparison proves they differ starting at <strong>byte offset ${diffOffset}</strong>. SHA-1 is forbidden for digital signatures under NIST SP 800-131A Rev. 2.</p>
        </div>
      </div>`;
    } else if (diffOffset === -1) {
      html += `
      <div class="security-layer security-layer-protect" style="margin-top: 1.25rem;">
        <div class="security-layer-label">Binary Match</div>
        <div>
          <strong>✔ PDFs Are Identical</strong>
          <p style="margin-bottom:0;">Both PDF files contain identical binary bytes.</p>
        </div>
      </div>`;
    } else {
      html += `
      <div class="security-layer security-layer-protect" style="margin-top: 1.25rem;">
        <div class="security-layer-label">No Collision</div>
        <div>
          <strong>✔ Distinct SHA-1 Digests</strong>
          <p style="margin-bottom:0;">PDF files yield different SHA-1 digests. Differ at byte offset ${diffOffset}.</p>
        </div>
      </div>`;
    }

    outputArea.innerHTML = html;
  }

  async function loadSHA1SamplePair() {
    try {
      outputArea.innerHTML = '<div style="color: var(--amber); font-weight: 600; padding: 0.5rem;">⏳ Fetching SHAttered PDF sample pair...</div>';
      const r1 = await fetch(pdf1Url);
      const r2 = await fetch(pdf2Url);
      const b1 = new Uint8Array(await r1.arrayBuffer());
      const b2 = new Uint8Array(await r2.arrayBuffer());

      await verifySHA1Buffers("sha1-collision-1.pdf", b1, "sha1-collision-2.pdf", b2);
    } catch (err) {
      outputArea.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">Sample Load Error: ${err.message || err}</div>`;
    }
  }

  function readFileBytes(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(new Uint8Array(e.target.result));
      reader.onerror = err => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  async function handleVerifyUpload() {
    try {
      const f1 = sha1File1.files[0];
      const f2 = sha1File2.files[0];

      if (!f1 || !f2) {
        outputArea.innerHTML = '<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">⚠️ Please select two PDF files to verify.</div>';
        return;
      }

      outputArea.innerHTML = '<div style="color: var(--amber); font-weight: 600; padding: 0.5rem;">⏳ Reading and hashing uploaded PDFs...</div>';
      const b1 = await readFileBytes(f1);
      const b2 = await readFileBytes(f2);

      await verifySHA1Buffers(f1.name, b1, f2.name, b2);
    } catch (err) {
      outputArea.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">PDF Verification Error: ${err.message || err}</div>`;
    }
  }

  btnSample.addEventListener('click', loadSHA1SamplePair);
  btnVerify.addEventListener('click', handleVerifyUpload);

  loadSHA1SamplePair();
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
