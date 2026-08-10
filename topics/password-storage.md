---
title: Password Hashing & Key Derivation
description: Password storage security guidelines, Argon2id (RFC 9106), bcrypt, PBKDF2, salting mechanics, pepper KMS integration, and bcrypt 72-byte truncation workarounds.
permalink: /topics/password-storage/
last_verified: 2026-08-10
---

<span class="eyebrow">Cryptography / Authentication</span>

# Password Hashing & Key Derivation

<p class="lede">Passwords are low-entropy user secrets highly vulnerable to offline dictionary and GPU brute-force attacks. Secure password storage requires specialized, computationally expensive Password-Based Key Derivation Functions (PBKDF) that incorporate unique per-user salts, high memory hardness, and tunable time cost parameters to render offline cracking economically unviable.</p>

## Why Plain Cryptographic Hashes Fail for Passwords

Fast general-purpose hash functions such as SHA-256 and MD5 can be evaluated massively in parallel, making weak passwords vulnerable to rapid offline guessing. Password-hashing functions deliberately impose computational cost, while memory-hard functions such as Argon2id additionally impose substantial memory requirements.

<div class="diagram-frame">
  <img src="{{ '/assets/img/password-hash-comparison.svg' | relative_url }}" alt="Execution throughput comparison across SHA-256, bcrypt, scrypt, and Argon2id.">
  <p class="diagram-caption">Password hash comparison: Argon2id enforces memory hardness to defeat GPU/ASIC parallel cracking</p>
</div>

## Modern Password Complexity & Policy Guidelines (NIST SP 800-63B)

Modern password security standards (formalized in **NIST SP 800-63B**) prioritize **length and entropy** over arbitrary complexity rules. Traditional policies forcing mixed casing, digits, and symbols are deprecated because they result in predictable user behavior (e.g., capitalizing the first letter and appending `1!`) while making passwords harder to remember.

### NIST SP 800-63B Core Authentication Requirements

1. **Length-Based Security**:
   * Enforce a minimum length of at least **15 characters** for single-factor password authentication per **[NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)** (an 8-character minimum is permitted only when the password is used as one factor alongside an independent authenticator in MFA; 16+ characters recommended as an organizational best practice for administrative or privileged accounts).
   * Allow maximum lengths of at least **64 characters** to support easy-to-remember, high-entropy **passphrases** (e.g., `correct horse battery staple`).
2. **Eliminate Arbitrary Complexity Rules**:
   * Deprecate rules requiring specific character mixes (uppercase, numbers, symbols) to improve user adoption and key diversity.
3. **Ban Periodic Expiry / Forced Rotation**:
   * Do not force users to change passwords periodically (e.g., every 90 days) unless a compromise is active. Forced rotation results in users selecting weaker, sequential passwords (e.g., `Winter2025!` to `Spring2025!`).
4. **Enforce Breached Password Blacklisting**:
   * Compare new passwords against a dictionary of **known compromised credentials** (breached database lists like HaveIBeenPwned) and block matches during registration.
5. **Deprecate Security Questions / Hints**:
   * Knowledge-based authentication (KBA) questions (e.g., *"What was your first pet's name?"*) are forbidden because answers are easily researched using open-source intelligence (OSINT).

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Strength Meter</span>
    <h3>Password Entropy &amp; Search-Space Estimator</h3>
    <p>Type any password or passphrase below to calculate its idealized character-set search-space upper bound (bits of security) and an estimated brute-force crack time. This math assumes uniform random guessing over the detected character set &mdash; real human-chosen passwords (including well-known example passphrases) have much lower <em>effective</em> entropy because dictionary and pattern-based attacks skip most of that idealized search space, so treat the numbers below as an optimistic upper bound, not a real-world guarantee.</p>
  </div>

  <div class="demo-body">
    <!-- Password Input -->
    <div class="demo-form-group">
      <label for="password-input">Test Password / Passphrase:</label>
      <input id="password-input" type="text" class="demo-input" placeholder="Type password here..." value="correct horse battery staple">
    </div>

    <!-- Character Pool & Entropy Display -->
    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
      <div style="flex: 1; background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; text-align: center;">
        <span style="font-size: 0.75rem; color: var(--muted); display: block;">Password Length (L)</span>
        <span id="password-len-val" style="font-size: 1.25rem; font-weight: 800; color: var(--ink);">0</span>
      </div>
      <div style="flex: 1; background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; text-align: center;">
        <span style="font-size: 0.75rem; color: var(--muted); display: block;">Character Pool (R)</span>
        <span id="password-pool-val" style="font-size: 1.25rem; font-weight: 800; color: var(--ink);">0</span>
      </div>
      <div style="flex: 1; background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem; text-align: center;">
        <span style="font-size: 0.75rem; color: var(--muted); display: block;">Idealized Upper Bound</span>
        <span id="password-bits-val" style="font-size: 1.25rem; font-weight: 800; color: var(--accent);">0 bits</span>
      </div>
    </div>

    <!-- Live Status Indicator -->
    <div id="password-status-bar" style="margin-top: 1rem; padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;"></div>

    <!-- Estimated Crack Time Card -->
    <div style="margin-top: 1rem; background: var(--paper); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem;">
      <span style="font-size: 0.8rem; color: var(--muted); display: block;">Estimated Uniform Brute-Force Time (at 100,000 guesses/sec):</span>
      <span id="password-crack-time" style="font-size: 1.1rem; font-weight: 800; color: var(--ink);">N/A</span>
    </div>
  </div>
</div>

{% raw %}
<script>
(function() {
  const passwordInput = document.getElementById('password-input');
  const lenVal = document.getElementById('password-len-val');
  const poolVal = document.getElementById('password-pool-val');
  const bitsVal = document.getElementById('password-bits-val');
  const statusBar = document.getElementById('password-status-bar');
  const crackTime = document.getElementById('password-crack-time');

  if (!passwordInput || !lenVal || !poolVal || !bitsVal || !statusBar || !crackTime) return;

  function calculateEntropy() {
    const password = passwordInput.value;
    // Array.from splits on Unicode code points, not UTF-16 code units, so a
    // surrogate-pair character (e.g. most emoji) counts as one character, not two.
    const codePoints = Array.from(password);
    const len = codePoints.length;
    lenVal.innerText = len;

    if (len === 0) {
      poolVal.innerText = '0';
      bitsVal.innerText = '0 bits';
      statusBar.innerText = 'Enter a password to begin estimation.';
      statusBar.style.background = 'transparent';
      statusBar.style.color = 'var(--muted)';
      statusBar.style.borderColor = 'var(--rule)';
      crackTime.innerText = 'N/A';
      return;
    }

    // Determine character pool (R). This model only covers printable ASCII —
    // it does not attempt to size a pool for arbitrary Unicode scripts, where
    // the "reasonable" character-set size varies enormously by language.
    let hasLower = false;
    let hasUpper = false;
    let hasDigit = false;
    let hasSpecial = false;
    let hasNonAscii = false;

    for (const ch of codePoints) {
      const cp = ch.codePointAt(0);
      if (cp >= 97 && cp <= 122) hasLower = true;
      else if (cp >= 65 && cp <= 90) hasUpper = true;
      else if (cp >= 48 && cp <= 57) hasDigit = true;
      else if (cp >= 32 && cp <= 126) hasSpecial = true; // printable ASCII punctuation/symbols
      else hasNonAscii = true; // outside this model's scope — see note below
    }

    if (hasNonAscii) {
      // No defensible fixed pool size exists for arbitrary Unicode scripts — the
      // "reasonable" alphabet size varies by orders of magnitude between, say,
      // Vietnamese and Chinese. Rather than invent a number, suppress the estimate.
      poolVal.innerText = 'N/A';
      bitsVal.innerText = 'N/A';
      statusBar.innerHTML = '&#8505;&#65039; Non-ASCII character detected — this simplified calculator only models a fixed printable-ASCII pool and has no defensible pool size for other scripts, so no numeric estimate is shown.';
      statusBar.style.background = 'rgba(36, 87, 214, 0.08)';
      statusBar.style.color = 'var(--accent)';
      statusBar.style.borderColor = 'var(--accent)';
      crackTime.innerText = 'N/A';
      return;
    }

    let R = 0;
    if (hasLower) R += 26;
    if (hasUpper) R += 26;
    if (hasDigit) R += 10;
    if (hasSpecial) R += 33; // Standard printable special characters

    poolVal.innerText = R;

    // Idealized Uniform Search-Space Upper Bound: E = L * log2(R)
    const E = len * (Math.log(R) / Math.log(2));
    bitsVal.innerText = `${E.toFixed(1)} bits`;

    // Qualitative Idealized Search-Space Tier
    let rating = '';
    let bgColor = '';
    let textColor = '';
    let borderColor = '';

    if (E < 28) {
      rating = '&#10060; Low Search-Space Upper Bound (< 28 bits)';
      bgColor = 'rgba(159, 18, 57, 0.08)'; // critical-wash
      textColor = 'var(--critical)';
      borderColor = 'var(--critical)';
    } else if (E < 60) {
      rating = '&#9888; Moderate Search-Space Upper Bound (28-59 bits)';
      bgColor = 'rgba(161, 76, 0, 0.08)'; // amber-wash
      textColor = 'var(--amber)';
      borderColor = 'var(--amber)';
    } else if (E < 80) {
      rating = '&#128309; High Search-Space Upper Bound (60-79 bits)';
      bgColor = 'rgba(36, 87, 214, 0.08)'; // accent-wash
      textColor = 'var(--accent)';
      borderColor = 'var(--accent)';
    } else {
      rating = '&#9989; Very High Search-Space Upper Bound (80+ bits)';
      bgColor = 'rgba(15, 118, 110, 0.08)'; // teal-wash
      textColor = 'var(--teal)';
      borderColor = 'var(--teal)';
    }

    statusBar.innerHTML = rating;
    statusBar.style.background = bgColor;
    statusBar.style.color = textColor;
    statusBar.style.borderColor = borderColor;

    // Crack time estimation: average-case seconds = (2^E / 2) / guessesPerSec
    const totalPossibilities = Math.pow(2, E);
    const avgGuesses = totalPossibilities / 2;
    const guessesPerSec = 100000;
    const seconds = avgGuesses / guessesPerSec;

    let timeText = '';
    if (seconds < 1) {
      timeText = 'Instantaneous (under 1 second)';
    } else if (seconds < 60) {
      timeText = `~${Math.round(seconds)} seconds`;
    } else if (seconds < 3600) {
      timeText = `~${Math.round(seconds / 60)} minutes`;
    } else if (seconds < 86400) {
      timeText = `~${Math.round(seconds / 3600)} hours`;
    } else if (seconds < 31536000) {
      timeText = `~${Math.round(seconds / 86400)} days`;
    } else if (seconds < 3153600000) {
      timeText = `~${Math.round(seconds / 31536000)} years`;
    } else {
      const centuries = seconds / (31536000 * 100);
      if (centuries < 1e6) {
        timeText = `~${centuries.toExponential(2)} centuries`;
      } else {
        timeText = `~${centuries.toExponential(2)} centuries (computationally infeasible)`;
      }
    }

    crackTime.innerText = timeText;
  }

  passwordInput.addEventListener('input', calculateEntropy);
  calculateEntropy();
})();
</script>
{% endraw %}

## Specialized Password Hashing Functions Matrix

| Algorithm | Memory Hardness | GPU / ASIC Resistance | Specification &amp; Recommended Status |
|---|---|---|---|
| **Argon2id** ([RFC 9106](https://www.rfc-editor.org/rfc/rfc9106)) | **HIGH** (Memory-Hard) | **Generally considered strongest of this group when comparably tuned**: memory-hardness raises the cost of GPU/ASIC parallelism more directly than CPU-only designs, though actual resistance depends on the chosen parameters and the attacker's hardware budget, not the algorithm choice alone. | **PRIMARY RECOMMENDATION**: RFC 9106 / OWASP recommended first-choice algorithm for modern applications ([OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)). |
| **bcrypt** | None (CPU-Hard) | **Weaker against custom ASICs than memory-hard designs**: its fixed, small memory footprint (4 KiB) is cheap to replicate in dedicated hardware, though it still resists commodity GPU cracking better than an unsalted fast hash. | **COMMONLY ACCEPTED LEGACY OPTION**: Acceptable where already deployed or required for compatibility; watch out for 72-byte truncation limit. |
| **PBKDF2-HMAC-SHA256** | None (CPU-Hard) | **Weakest of this group against GPU/ASIC parallelism**: a high iteration count (600,000+) raises the cost per guess, but with no memory requirement at all, that cost is easy to parallelize across many cheap cores. | **FIPS COMPLIANCE OPTION**: FIPS 140-3 itself does not mandate PBKDF2 — it certifies cryptographic *modules*, not a specific password-hashing choice. Use PBKDF2 (NIST SP 800-132) when your environment requires an algorithm implemented inside a FIPS 140-3 validated module, since Argon2id, bcrypt, and scrypt are not currently NIST-approved primitives eligible for that validation. |
| **scrypt** (RFC 7914) | **MODERATE** | **Comparable to Argon2id in principle, less tunable in practice**: an earlier memory-hard design with fewer independent cost parameters (no separate parallelism knob distinct from memory/CPU cost), which is part of why RFC 9106 and OWASP now recommend Argon2id first. | **ACCEPTABLE FALLBACK**: A reasonable choice when Argon2id isn't available in your stack. |

## Salting & Peppering Architecture

### 1. Per-User Salt (Public Metadata)

A **Salt** is a 16-byte (128-bit) CSPRNG random sequence generated uniquely per user account and stored alongside the hash digest in cleartext. Salting enforces two critical controls:
- **Defeats Precomputed Rainbow Tables**: A rainbow table built before the salt is known can't match any of these hashes — the attacker would need a separate precomputed table per salt value, which defeats the entire point of precomputing a table in advance.
- **Prevents Duplicate Hash Discovery**: Two users sharing the identical password `"Password123!"` yield completely different hash digests.

### 2. Secret Pepper (KMS Custody)

A **Pepper** is a 32-byte secret key stored outside the primary user database (*e.g., inside an AWS KMS or HSM*). The application combines the pepper with the salted password prior to hashing. If an adversary's breach is scoped to a SQL database dump alone (e.g., via SQL injection) and doesn't also expose the pepper, they cannot perform offline cracking without it — but that protection depends on the breach genuinely not reaching the pepper; an attacker with broader access (application-server compromise, KMS misconfiguration) that reaches both the database *and* the pepper isn't stopped by this control.

| Security Control | Storage Location | Entropy Source | Primary Attack Mitigated |
|---|---|---|---|
| **Pepper (Secret Key)** | KMS / HSM / Secret Manager | 256-bit CSPRNG secret | Database exfiltration &amp; offline GPU cracking. |
| **Salt (Public Metadata)** | Database table alongside hash | 128-bit CSPRNG per user | Precomputed Rainbow Tables &amp; cross-user hash matching. |

## Argon2id Recommended Parameters (RFC 9106)

Specified in **[RFC 9106](https://www.rfc-editor.org/rfc/rfc9106)** and recommended by **[OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)**, **Argon2id** is a memory-hard password-hashing function designed to resist parallel cracking while balancing side-channel considerations. The current **[OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)** lists several single-lane (p=1) configurations trading memory for time cost rather than ranking strongest-to-weakest — options range from **m=47104 KiB (46 MiB), t=1, p=1** (more memory, fewer passes) to **m=19456 KiB (19 MiB), t=2, p=1** (less memory, more passes); pick based on the memory your deployment can dedicate per concurrent hash operation, since under-provisioning memory on a busy auth endpoint can matter as much as the specific numbers chosen. RFC 9106 separately recommends **m=65536 KiB (64 MiB), t=3, p=4** as its own memory-constrained profile (the tuner's default below), which spreads the work across four parallel lanes rather than OWASP's single lane:

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Parameter Tuner</span>
    <h3>Argon2id Cost Estimator & Parameter Tuner</h3>
    <p>Adjust memory, time, and thread parameters to generate and copy a Node.js Argon2 config that meets OWASP or RFC 9106 guidance — the right values depend on your deployment's available memory and request volume, not a single universally "optimal" setting.</p>
  </div>

  <div class="demo-body">
    <!-- Parameters -->
    <div class="demo-form-group">
      <div style="display: flex; justify-content: space-between;">
        <label for="argon-mem">Memory Cost (m): <span id="label-argon-mem-val" style="font-weight: 700;">64 MiB</span></label>
        <span style="font-size: 0.8rem; color: var(--muted);">65,536 KiB</span>
      </div>
      <input id="argon-mem" type="range" class="demo-input" style="width: 100%;" min="8" max="256" step="8" value="64">
    </div>

    <div class="demo-form-group">
      <div style="display: flex; justify-content: space-between;">
        <label for="argon-time">Time Cost (t - Iterations): <span id="label-argon-time-val" style="font-weight: 700;">3</span></label>
        <span style="font-size: 0.8rem; color: var(--muted);">Passes over memory</span>
      </div>
      <input id="argon-time" type="range" class="demo-input" style="width: 100%;" min="1" max="10" step="1" value="3">
    </div>

    <div class="demo-form-group">
      <div style="display: flex; justify-content: space-between;">
        <label for="argon-threads">Parallelism (p - Threads): <span id="label-argon-threads-val" style="font-weight: 700;">4</span></label>
        <span style="font-size: 0.8rem; color: var(--muted);">OWASP single-lane profiles specify p=1; RFC 9106 uses p=4</span>
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

    // Check compliance status against OWASP (p=1) and RFC 9106 (p=4) profiles
    let statusHtml = '';
    let bgColor = '';
    let textColor = '';
    let borderColor = '';

    if (threadsVal === 1 && memMiB >= 46 && timeVal >= 1) {
      statusHtml = '&#9989; Meets OWASP Higher-Memory Single-Lane Profile (m&#8805;46 MiB, t&#8805;1, p=1)';
      bgColor = 'rgba(15, 118, 110, 0.08)';
      textColor = 'var(--teal)';
      borderColor = 'var(--teal)';
    } else if (threadsVal === 1 && memMiB >= 19 && timeVal >= 2) {
      statusHtml = '&#9888; Meets OWASP Lower-Memory Single-Lane Profile (m&#8805;19 MiB, t&#8805;2, p=1)';
      bgColor = 'rgba(161, 76, 0, 0.08)';
      textColor = 'var(--amber)';
      borderColor = 'var(--amber)';
    } else if (threadsVal === 4 && memMiB >= 64 && timeVal >= 3) {
      statusHtml = '&#9989; Meets RFC 9106 Recommended Multi-Threaded Profile (m&#8805;64 MiB, t&#8805;3, p=4)';
      bgColor = 'rgba(15, 118, 110, 0.08)';
      textColor = 'var(--teal)';
      borderColor = 'var(--teal)';
    } else if (memMiB >= 19) {
      statusHtml = '&#9888; Custom Parameter Configuration (Note: OWASP single-lane profiles specify p=1; RFC 9106 specifies p=4)';
      bgColor = 'rgba(161, 76, 0, 0.08)';
      textColor = 'var(--amber)';
      borderColor = 'var(--amber)';
    } else {
      statusHtml = '&#10060; Below Minimum Recommended Memory Bound (Vulnerable to Parallel Cracking)';
      bgColor = 'rgba(159, 18, 57, 0.08)';
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
    <p>The standard <code>bcrypt</code> algorithm silently truncates input password strings at <strong>72 bytes</strong>. Any characters beyond byte 72 are ignored during authentication.</p>
  </div>
</div>

<div class="callout warn">
  <span class="callout-title">Do Not Pre-Hash With Plain, Unkeyed SHA-256</span>
  <p>A tempting mitigation is to pre-hash long passwords with plain <code>SHA-256(password)</code> — producing a fixed 32-byte digest — before passing them to <code>bcrypt</code>. The <a href="https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pre-hashing-passwords-with-bcrypt">OWASP Password Storage Cheat Sheet</a> advises against this because of a technique known as <strong>password shucking</strong> — but the risk isn't that possessing the <code>bcrypt(SHA-256(password))</code> database alone lets an attacker skip bcrypt's cost. Attacking that stored value directly still requires one full bcrypt computation per guess, exactly as intended, regardless of what the inner hash is. The actual danger is <strong>cross-referencing</strong>: because <code>SHA-256(password)</code> is fast, unkeyed, and produces the same output for the same password everywhere it's used, if that <em>intermediate</em> digest ever becomes independently known — leaked from a different breach that stored it raw, exposed by a debug log, a caching layer, or another service using the identical pre-hash-then-store pattern — an attacker can feed that leaked <code>SHA-256</code> value directly into <code>bcrypt</code> and compare the result to your stored hash, with a single bcrypt operation. They do <strong>not</strong> need to first crack that digest back to the plaintext password to make the comparison — simply knowing the intermediate hash value is enough to confirm the match. That direct-comparison shortcut is what "shucks off" the bcrypt shell, and it works with or without the attacker ever recovering the literal password. Without that separately-leaked intermediate digest, unkeyed SHA-256 pre-hashing on its own doesn't hand an attacker a shortcut against the bcrypt-protected database — attacking the bcrypt hash directly still costs one full bcrypt computation per guess.</p>
  <p>OWASP's recommended construction instead uses a <strong>keyed</strong> pre-hash: <code>bcrypt(base64(HMAC-SHA-384(password, pepper)), salt, cost)</code>. Because HMAC-SHA-384 is keyed with a secret <strong>pepper</strong> (see "Salting &amp; Peppering Architecture" above), an attacker without that pepper cannot reuse generic public SHA-2 cracking infrastructure against the pre-hash at all — they would first need the pepper itself, which is why the pepper should live in KMS/HSM custody separate from the password database. Base64-encoding the HMAC output (rather than feeding bcrypt the raw binary digest) also avoids embedded null bytes, which some bcrypt implementations treat as a C-style string terminator and truncate on.</p>
  <p><strong>Pepper-management implications</strong>: this construction only helps if the pepper stays secret and available. Plan for pepper rotation (version peppers so old hashes can still be verified during a rotation window, then rehash on next login), a pepper backup/recovery strategy (losing the pepper makes every stored hash unverifiable — unlike a compromised per-user salt, which only affects that one user), and awareness that a single shared pepper is a single point of failure: its compromise affects the whole user base at once, which is why it belongs in a KMS/HSM rather than application config.</p>
</div>

## Password Lifecycle Beyond Initial Storage

Choosing a hashing algorithm is only the starting point — the hash's parameters and the surrounding authentication flow need ongoing maintenance:

- **Rehash-on-login**: Because you don't have the plaintext password to re-hash a user's credential in bulk, cost-parameter upgrades (bumping Argon2id's memory or time cost, or migrating between algorithms) roll out gradually: check the stored hash's embedded parameters at every successful login, and if they're below the current target, re-hash the just-verified plaintext with the new parameters and overwrite the stored value. Inactive accounts stay on old parameters until they next log in — an accepted trade-off, not an oversight.
- **Legacy-hash migration**: The same rehash-on-login mechanism handles migrating between algorithms entirely (e.g., an old system storing plain salted SHA-256, or MD5, moving to Argon2id): verify against the legacy scheme on login, and on success, immediately compute and store the new Argon2id hash of the same plaintext. Accounts that never log back in either get force-reset or stay flagged as needing migration — silently leaving them on a broken legacy scheme indefinitely is the failure mode to design against.
- **Unicode handling**: Password inputs should be normalized (typically Unicode NFC) before hashing, and the byte encoding must be both consistent and well-defined (UTF-8 is standard) — an application that hashes raw, unnormalized bytes risks legitimate users being locked out when the same password is typed on a different keyboard layout, IME, or OS that produces a different Unicode normalization form for visually identical text. Length limits (see the bcrypt 72-byte discussion above) should also be measured in bytes after encoding, not in characters, since multi-byte UTF-8 sequences can hit a byte-based truncation limit well before a naive character count would suggest.
- **Authentication DoS limits**: Memory-hard functions are expensive by design — that's the point against attackers, but it also means a login endpoint doing Argon2id verification on every request is a much easier target for a resource-exhaustion DoS than a stateless endpoint. Rate-limit authentication attempts per account and per source, and size Argon2id's memory/time parameters with your expected peak concurrent-login load in mind, not just against offline-cracking resistance in isolation — the parameters that are "strong" against an offline attacker can still be tuned so a login storm doesn't exhaust server memory.
- **Privacy-preserving breached-password checks**: [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)'s breached-password blacklisting requirement (see above) shouldn't be implemented by sending plaintext passwords to a third-party API. The [Have I Been Pwned Pwned Passwords API](https://haveibeenpwned.com/API/v3#PwnedPasswords) supports a **k-anonymity** model: the client hashes the candidate password with SHA-1, sends only the first 5 hex characters of the digest, and receives back all breached-password suffixes sharing that prefix — the client checks the full digest locally, so the full password (or its full hash) never leaves the client/server boundary being checked.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Password Storage Summary</strong>
    <ul>
      <li><strong>Argon2id (RFC 9106)</strong>: Winner of Password Hashing Competition; primary recommendation for password storage (memory-hard against GPU/ASIC attacks).</li>
      <li><strong>Bcrypt 72-Byte Truncation Limit</strong>: Bcrypt silently ignores characters beyond byte 72. Do not pre-hash with plain unkeyed SHA-256 — it enables password shucking. If pre-hashing is needed, use OWASP's keyed <code>base64(HMAC-SHA-384(password, pepper))</code> construction, with the pepper held in KMS/HSM custody.</li>
      <li><strong>Salts &amp; Peppers</strong>: 128-bit CSPRNG unique salt per user prevents rainbow tables; HSM pepper protects against database exfiltration.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 9106**: *Argon2 Memory-Hard Function for Password Hashing and Proof-of-Work Applications* — [IETF RFC 9106](https://www.rfc-editor.org/rfc/rfc9106)
- **NIST SP 800-63B-4**: *Digital Identity Guidelines: Authentication and Lifecycle Management* — [NIST CSRC SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)
- **OWASP Password Storage Cheat Sheet**: *Current Argon2id, bcrypt, and PBKDF2 parameter recommendations* — [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
