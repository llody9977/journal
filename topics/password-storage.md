---
title: Password Hashing & Key Derivation
description: Password storage security guidelines, Argon2id (RFC 9106), bcrypt, PBKDF2, salting mechanics, pepper KMS integration, and bcrypt 72-byte truncation workarounds.
permalink: /topics/password-storage/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Authentication</span>

# Password Hashing & Key Derivation

<p class="lede">Passwords are low-entropy user secrets highly vulnerable to offline dictionary and GPU brute-force attacks. Secure password storage requires specialized, computationally expensive Password-Based Key Derivation Functions (PBKDF) that incorporate unique per-user salts, high memory hardness, and tunable time cost parameters to render offline cracking economically unviable.</p>

## Why Plain Cryptographic Hashes Fail for Passwords

Fast general-purpose hash functions (SHA-256, MD5) are engineered for gigabytes-per-second throughput. A modern GPU cluster can compute over **100 billion SHA-256 hashes per second**, allowing offline brute-force recovery of weak passwords in minutes. Specialized password hashes (Argon2id, bcrypt) force memory accesses and CPU iterations to slow down execution to ~250ms per verification.

<div class="diagram-frame">
  <img src="{{ '/assets/img/password-hash-comparison.svg' | relative_url }}" alt="Execution throughput comparison across SHA-256, bcrypt, scrypt, and Argon2id.">
  <p class="diagram-caption">Password hash comparison: Argon2id enforces memory hardness to defeat GPU/ASIC parallel cracking</p>
</div>

## Specialized Password Hashing Functions Matrix

| Algorithm | Memory Hardness | GPU / ASIC Resistance | OWASP &amp; NIST Recommendation Status |
|---|---|---|---|
| **Argon2id** ([RFC 9106](https://www.rfc-editor.org/rfc/rfc9106)) | **HIGH** (Memory-Hard) | **MAXIMUM**: Hybrid memory-hard design resists GPU and side-channel attacks. | **PRIMARY RECOMMENDATION**: First-choice algorithm for all modern applications ([OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)). |
| **bcrypt** | None (CPU-Hard) | **MODERATE**: Blowfish key schedule resists GPUs; vulnerable to custom ASICs. | **APPROVED LEGACY**: Acceptable legacy default; watch out for 72-byte truncation limit. |
| **PBKDF2-HMAC-SHA256** | None (CPU-Hard) | **LOW**: High iteration count (600,000+) but easily parallelized on GPUs. | **FIPS COMPLIANCE OPTION**: Use only when strict FIPS 140-3 compliance mandates it. |
| **scrypt** (RFC 7914) | **MODERATE** | **HIGH**: Early memory-hard function; superseded by Argon2id. | **APPROVED ALTERNATIVE**: Acceptable when Argon2id is unavailable. |

## Salting & Peppering Architecture

### 1. Per-User Salt (Public Metadata)

A **Salt** is a 16-byte (128-bit) CSPRNG random sequence generated uniquely per user account and stored alongside the hash digest in cleartext. Salting enforces two critical controls:
- **Defeats Precomputed Rainbow Tables**: Rainbow table lookups become impossible because every user hash uses a distinct salt.
- **Prevents Duplicate Hash Discovery**: Two users sharing the identical password `"Password123!"` yield completely different hash digests.

### 2. Secret Pepper (KMS Custody)

A **Pepper** is a 32-byte secret key stored outside the primary user database (*e.g., inside an AWS KMS or HSM*). The application combines the pepper with the salted password prior to hashing. If an adversary steals a SQL database dump, they cannot perform offline cracking without the KMS pepper.

| Security Control | Storage Location | Entropy Source | Primary Attack Mitigated |
|---|---|---|---|
| **Pepper (Secret Key)** | KMS / HSM / Secret Manager | 256-bit CSPRNG secret | Database exfiltration &amp; offline GPU cracking. |
| **Salt (Public Metadata)** | Database table alongside hash | 128-bit CSPRNG per user | Precomputed Rainbow Tables &amp; cross-user hash matching. |

## Argon2id Recommended Parameters (RFC 9106)

Specified in **[RFC 9106](https://www.rfc-editor.org/rfc/rfc9106)** and **[NIST SP 800-63B Rev. 4](https://csrc.nist.gov/pubs/sp/800/63/b/r4/final)**, **Argon2id** provides optimal protection against both side-channel and GPU attacks:

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Parameter Tuner</span>
    <h3>Argon2id Cost Estimator & Parameter Tuner</h3>
    <p>Adjust memory, time, and thread parameters to generate and copy the optimal Node.js Argon2 config conforming to OWASP and NIST guidelines.</p>
  </div>

  <div class="demo-body">
    <!-- Parameters -->
    <div class="demo-form-group">
      <div style="display: flex; justify-content: space-between;">
        <label for="argon-mem">Memory Cost (m): <span id="label-argon-mem-val" style="font-weight: 700;">64 MiB</span></label>
        <span style="font-size: 0.8rem; color: var(--text-muted);">65,536 KiB</span>
      </div>
      <input id="argon-mem" type="range" class="demo-input" style="width: 100%;" min="8" max="256" step="8" value="64">
    </div>

    <div class="demo-form-group">
      <div style="display: flex; justify-content: space-between;">
        <label for="argon-time">Time Cost (t - Iterations): <span id="label-argon-time-val" style="font-weight: 700;">3</span></label>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Passes over memory</span>
      </div>
      <input id="argon-time" type="range" class="demo-input" style="width: 100%;" min="1" max="10" step="1" value="3">
    </div>

    <div class="demo-form-group">
      <div style="display: flex; justify-content: space-between;">
        <label for="argon-threads">Parallelism (p - Threads): <span id="label-argon-threads-val" style="font-weight: 700;">4</span></label>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Parallel CPU cores</span>
      </div>
      <input id="argon-threads" type="range" class="demo-input" style="width: 100%;" min="1" max="8" step="1" value="4">
    </div>

    <!-- Live Compliance Status Indicator -->
    <div id="argon-status-indicator" style="margin-top: 1rem; padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;"></div>

    <!-- Code Block with Copy Button -->
    <div class="demo-form-group" style="margin-top: 1.5rem;">
      <label>Node.js Argon2 Configuration Code:</label>
      <div style="display: flex; gap: 0.5rem; align-items: stretch;">
        <div style="flex: 1; background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; font-family: var(--font-mono); font-size: 0.85rem; word-break: break-all; white-space: pre-wrap; display: flex; align-items: center;" id="argon-code-block"></div>
        <button id="btn-copy-argon-code" class="btn-primary" style="margin: 0; display: flex; align-items: center; justify-content: center; padding: 0 1.25rem;" type="button">&#128203; Copy</button>
      </div>
    </div>
  </div>
</div>

{% raw %}
<script>
(function() {
  const memSlider = document.getElementById('argon-mem');
  const timeSlider = document.getElementById('argon-time');
  const threadsSlider = document.getElementById('argon-threads');

  const memValLabel = document.getElementById('label-argon-mem-val');
  const timeValLabel = document.getElementById('label-argon-time-val');
  const threadsValLabel = document.getElementById('label-argon-threads-val');

  const statusIndicator = document.getElementById('argon-status-indicator');
  const codeBlock = document.getElementById('argon-code-block');
  const btnCopy = document.getElementById('btn-copy-argon-code');

  if (!memSlider || !timeSlider || !threadsSlider || !statusIndicator || !codeBlock || !btnCopy) return;

  function updateArgonTuner() {
    const memMiB = parseInt(memSlider.value, 10);
    const memKiB = memMiB * 1024;
    const timeVal = parseInt(timeSlider.value, 10);
    const threadsVal = parseInt(threadsSlider.value, 10);

    // Update value labels
    memValLabel.innerText = `${memMiB} MiB`;
    timeValLabel.innerText = timeVal;
    threadsValLabel.innerText = threadsVal;

    // Check compliance status
    let statusHtml = '';
    let bgColor = '';
    let textColor = '';
    let borderColor = '';

    if (memMiB >= 64 && timeVal >= 3 && threadsVal >= 4) {
      statusHtml = '&#9989; Meets OWASP Recommended Profile (High Security Standard)';
      bgColor = 'rgba(15, 118, 110, 0.08)'; // teal-wash
      textColor = 'var(--teal)';
      borderColor = 'var(--teal)';
    } else if (memMiB >= 32 && timeVal >= 1) {
      statusHtml = '&#9888; Meets RFC 9106 Minimal Safe Profile (Acceptable)';
      bgColor = 'rgba(161, 76, 0, 0.08)'; // amber-wash
      textColor = 'var(--amber)';
      borderColor = 'var(--amber)';
    } else {
      statusHtml = '&#10060; Weak Configuration (Vulnerable to GPU Cracking)';
      bgColor = 'rgba(159, 18, 57, 0.08)'; // critical-wash
      textColor = 'var(--critical)';
      borderColor = 'var(--critical)';
    }

    statusIndicator.innerHTML = statusHtml;
    statusIndicator.style.background = bgColor;
    statusIndicator.style.color = textColor;
    statusIndicator.style.border = `1px solid ${borderColor}`;

    // Update code block
    const code = `const argon2 = require('argon2');

async function hashUserPassword(password) {
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: ${memKiB}, // ${memMiB} MiB RAM
    timeCost: ${timeVal},        // ${timeVal} iterations
    parallelism: ${threadsVal}      // ${threadsVal} parallel threads
  });
  return hash;
}`;

    codeBlock.innerText = code;
  }

  btnCopy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(codeBlock.innerText);
      const oldText = btnCopy.innerHTML;
      btnCopy.innerHTML = '&#9989; Copied!';
      setTimeout(() => {
        btnCopy.innerHTML = oldText;
      }, 1500);
    } catch (e) {
      alert("Failed to copy configuration: " + e.message);
    }
  });

  memSlider.addEventListener('input', updateArgonTuner);
  timeSlider.addEventListener('input', updateArgonTuner);
  threadsSlider.addEventListener('input', updateArgonTuner);

  updateArgonTuner();
})();
</script>
{% endraw %}

## The Bcrypt 72-Byte Truncation Limit Pitfall

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Bcrypt Truncation Vulnerability</div>
  <div>
    <strong>Bcrypt 72-Byte Truncation Limit</strong>
    <p>The standard <code>bcrypt</code> algorithm silently truncates input password strings at <strong>72 bytes</strong>. Any characters beyond byte 72 are ignored during authentication. To mitigate this without breaking legacy compatibility, pre-hash long passwords using <code>SHA-256</code> (producing a fixed 32-byte binary digest) before passing the bytes into <code>bcrypt</code>.</p>
  </div>
</div>

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Password Storage Summary</strong>
    <ul>
      <li><strong>Argon2id (RFC 9106)</strong>: Winner of Password Hashing Competition; primary recommendation for password storage (memory-hard against GPU/ASIC attacks).</li>
      <li><strong>Bcrypt 72-Byte Truncation Limit</strong>: Bcrypt silently ignores characters beyond byte 72. Pre-hash long inputs with SHA-256 before passing to bcrypt.</li>
      <li><strong>Salts &amp; Peppers</strong>: 128-bit CSPRNG unique salt per user prevents rainbow tables; HSM pepper protects against database exfiltration.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 9106**: *Argon2 Memory-Hard Function for Password Hashing and Proof-of-Work Applications* — [IETF RFC 9106](https://www.rfc-editor.org/rfc/rfc9106)
- **NIST SP 800-63B**: *Digital Identity Guidelines: Authentication and Lifecycle Management* — [NIST CSRC SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)
