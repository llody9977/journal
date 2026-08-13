---
title: Password Hashing & Key Derivation
description: Password storage security guidelines, Argon2id (RFC 9106), bcrypt, PBKDF2, salting mechanics, pepper KMS integration, and bcrypt 72-byte truncation workarounds.
permalink: /topics/password-storage/
last_verified: 2026-08-13
---

<span class="eyebrow">Cryptography / Authentication</span>

# Password Hashing & Key Derivation

<p class="lede">Passwords are low-entropy user secrets highly vulnerable to offline dictionary and GPU brute-force attacks. Secure password storage requires specialized, computationally expensive Password-Based Key Derivation Functions (PBKDFs) that incorporate unique per-stored-hash salts and tunable cost parameters to raise the cost of offline cracking, per <a href="https://pages.nist.gov/800-63-4/sp800-63b/authenticators/">NIST SP 800-63B-4</a>. The outcome still depends on the chosen parameters, the password's entropy, and the attacker's hardware, so no PBKDF makes an arbitrarily weak password uncrackable. Memory-hard functions such as Argon2id additionally impose memory cost for stronger GPU/ASIC resistance where the deployment can afford it, while accepted constructions also include time-cost-only functions such as PBKDF2 and CPU-bound ones such as bcrypt.</p>

## Why Plain Cryptographic Hashes Fail for Passwords

Fast general-purpose hash functions such as SHA-256 and MD5 can be evaluated massively in parallel, making weak passwords vulnerable to rapid offline guessing. Password-hashing functions deliberately impose computational cost, while memory-hard functions such as Argon2id additionally impose substantial memory requirements.

<div class="diagram-frame">
  <img src="{{ '/assets/img/password-hash-comparison.svg' | relative_url }}" alt="Execution throughput comparison across SHA-256, bcrypt, scrypt, and Argon2id.">
  <p class="diagram-caption">Password hash comparison: Argon2id's memory hardness raises the cost of GPU/ASIC parallel cracking</p>
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
   * [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html) requires checking new passwords against more than just breach lists — it also calls for rejecting commonly used, expected, and context-specific passwords (e.g., the service name, the username, or other account-specific dictionary words), not only credentials from **known compromised databases** (breach lists like HaveIBeenPwned).
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
      <span style="font-size: 0.8rem; color: var(--muted); display: block;">Estimated Uniform Brute-Force Time (illustrative rate of 100,000 guesses/sec — actual attacker throughput depends heavily on the hashing algorithm and hardware; see the Password Hashing diagram above):</span>
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
      rating = '&#10060; Low Search-Space Upper Bound (illustrative tier: < 28 bits)';
      bgColor = 'rgba(159, 18, 57, 0.08)'; // critical-wash
      textColor = 'var(--critical)';
      borderColor = 'var(--critical)';
    } else if (E < 60) {
      rating = '&#9888; Moderate Search-Space Upper Bound (illustrative tier: 28-59 bits)';
      bgColor = 'rgba(161, 76, 0, 0.08)'; // amber-wash
      textColor = 'var(--amber)';
      borderColor = 'var(--amber)';
    } else if (E < 80) {
      rating = '&#128309; High Search-Space Upper Bound (illustrative tier: 60-79 bits)';
      bgColor = 'rgba(36, 87, 214, 0.08)'; // accent-wash
      textColor = 'var(--accent)';
      borderColor = 'var(--accent)';
    } else {
      rating = '&#9989; Very High Search-Space Upper Bound (illustrative tier: 80+ bits)';
      bgColor = 'rgba(15, 118, 110, 0.08)'; // teal-wash
      textColor = 'var(--teal)';
      borderColor = 'var(--teal)';
    }

    statusBar.innerHTML = rating;
    statusBar.style.background = bgColor;
    statusBar.style.color = textColor;
    statusBar.style.borderColor = borderColor;

    // Crack time estimation: average-case seconds = (2^E / 2) / guessesPerSec.
    // Computed in log10 space rather than via Math.pow(2, E) directly, because E
    // easily exceeds ~1024 for long or high-charset inputs, at which point 2^E
    // overflows Number.MAX_VALUE (~1.8e308) and silently becomes Infinity.
    const guessesPerSec = 100000;
    const log10Seconds = (E - 1) * Math.log10(2) - Math.log10(guessesPerSec);

    let timeText = '';
    if (log10Seconds < 10) {
      // Safely within the representable range (well under 1e308) for a direct value.
      const seconds = Math.pow(10, log10Seconds);
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
        timeText = `~${Math.round(seconds / (31536000 * 100))} centuries`;
      }
    } else {
      // Beyond ~10 orders of magnitude, express directly as centuries in
      // scientific notation without ever forming the raw (overflow-prone) seconds value.
      const log10Centuries = log10Seconds - Math.log10(31536000 * 100);
      const exponent = Math.floor(log10Centuries);
      const mantissa = Math.pow(10, log10Centuries - exponent);
      timeText = `~${mantissa.toFixed(2)}e+${exponent} centuries (computationally infeasible)`;
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
| **scrypt** ([RFC 7914](https://www.rfc-editor.org/rfc/rfc7914)) | **MODERATE** | **An earlier memory-hard design, predating Argon2id's hybrid approach**: scrypt defines independent cost parameters (`N` for CPU/memory cost, `r` for block size, and `p` for parallelization), but its memory-access pattern is data-dependent, unlike Argon2id's hybrid data-dependent/data-independent design. Argon2id was engineered and vetted through the Password Hashing Competition to balance GPU/ASIC resistance with side-channel resistance; this is why RFC 9106 and OWASP recommend it first, not because scrypt lacks tunable parameters. | **ACCEPTABLE FALLBACK**: A reasonable choice when Argon2id isn't available in your stack. |

## Salting & Peppering Architecture

### 1. Unique Salt Per Stored Hash (Public Metadata)

A **Salt** is a CSPRNG-generated random sequence, generated uniquely per stored password hash — a fresh salt accompanies each newly generated hash, including a rehash after a password change, not just once per account for its lifetime — and stored alongside the hash digest in cleartext; 16 bytes (128 bits) is a common, sound choice, but the required length depends on the specific password-hashing construction in use (e.g., Argon2id's recommended salt length differs from bcrypt's fixed input) rather than being a universal fixed value. Salting enforces two critical controls:
- **Defeats Precomputed Rainbow Tables**: A rainbow table built before the salt is known can't match any of these hashes — the attacker would need a separate precomputed table per salt value, which defeats the entire point of precomputing a table in advance.
- **Prevents Duplicate Hash Discovery**: Two users sharing the identical password `"Password123!"` yield completely different hash digests.

### 2. Secret Pepper (KMS Custody)

A **Pepper** is a secret key stored outside the primary user database (*e.g., inside an AWS KMS or HSM*); 32 bytes (256 bits) is a common, sound choice, but the required length depends on the specific pepper mechanism (a raw HMAC key, an AES key wrapping a per-user value, etc.) rather than being a universal fixed value. The application combines the pepper with the salted password prior to hashing. If an adversary's breach is scoped to a SQL database dump alone (e.g., via SQL injection) and doesn't also expose the pepper, they cannot perform offline cracking without it — but that protection depends on the breach genuinely not reaching the pepper; an attacker with broader access (application-server compromise, KMS misconfiguration) that reaches both the database *and* the pepper isn't stopped by this control.

| Security Control | Storage Location | Entropy Source | Primary Attack Mitigated |
|---|---|---|---|
| **Pepper (Secret Key)** | KMS / HSM / Secret Manager | 256-bit CSPRNG secret | Database exfiltration &amp; offline GPU cracking. |
| **Salt (Public Metadata)** | Database table alongside hash | 128-bit CSPRNG per stored hash | Precomputed Rainbow Tables &amp; cross-user hash matching. |

## Argon2id Recommended Parameters (RFC 9106)

Specified in **[RFC 9106](https://www.rfc-editor.org/rfc/rfc9106)** and recommended by **[OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)**, **Argon2id** is a memory-hard password-hashing function designed to resist parallel cracking while balancing side-channel considerations. The current **[OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)** lists five single-lane (p=1) configurations OWASP states provide an equal level of defense, trading memory for time cost rather than ranking strongest-to-weakest: **m=47104 KiB (46 MiB), t=1**; **m=19456 KiB (19 MiB), t=2**; **m=12288 KiB (12 MiB), t=3**; **m=9216 KiB (9 MiB), t=4**; and **m=7168 KiB (7 MiB), t=5** — pick based on the memory your deployment can dedicate per concurrent hash operation, since under-provisioning memory on a busy auth endpoint can matter as much as the specific numbers chosen. RFC 9106 separately recommends **m=65536 KiB (64 MiB), t=3, p=4** as its own memory-constrained profile (the tuner's default below), which spreads the work across four parallel lanes rather than OWASP's single lane:

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
        <span id="label-argon-mem-kib" style="font-size: 0.8rem; color: var(--muted);">65,536 KiB</span>
      </div>
      <input id="argon-mem" type="range" class="demo-input" style="width: 100%;" min="7" max="256" step="1" value="64">
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
  const memKibLabel = document.getElementById('label-argon-mem-kib');
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
    if (memKibLabel) memKibLabel.innerText = `${memKiB.toLocaleString()} KiB`;
    timeValLabel.innerText = timeVal;
    threadsValLabel.innerText = threadsVal;

    // Check compliance status against OWASP's five equal-defense single-lane (p=1)
    // profiles and RFC 9106's p=4 profile. OWASP states these five trade memory for
    // time cost at an equal defense level, so any one of them should read as fully
    // compliant rather than ranking the higher-memory ones above the others.
    const OWASP_PROFILES = [
      { mem: 46, time: 1 },
      { mem: 19, time: 2 },
      { mem: 12, time: 3 },
      { mem: 9, time: 4 },
      { mem: 7, time: 5 },
    ];
    const matchedOwasp = threadsVal === 1
      ? OWASP_PROFILES.find(p => memMiB >= p.mem && timeVal >= p.time)
      : undefined;

    let statusHtml = '';
    let bgColor = '';
    let textColor = '';
    let borderColor = '';

    if (matchedOwasp) {
      statusHtml = `&#9989; Meets an OWASP Single-Lane Profile (m&#8805;${matchedOwasp.mem} MiB, t&#8805;${matchedOwasp.time}, p=1)`;
      bgColor = 'rgba(15, 118, 110, 0.08)';
      textColor = 'var(--teal)';
      borderColor = 'var(--teal)';
    } else if (threadsVal === 4 && memMiB >= 64 && timeVal >= 3) {
      statusHtml = '&#9989; Meets RFC 9106 Recommended Multi-Threaded Profile (m&#8805;64 MiB, t&#8805;3, p=4)';
      bgColor = 'rgba(15, 118, 110, 0.08)';
      textColor = 'var(--teal)';
      borderColor = 'var(--teal)';
    } else if (memMiB >= 7) {
      statusHtml = '&#9888; Custom Parameter Configuration (Note: OWASP single-lane profiles specify p=1; RFC 9106 specifies p=4)';
      bgColor = 'rgba(161, 76, 0, 0.08)';
      textColor = 'var(--amber)';
      borderColor = 'var(--amber)';
    } else {
      statusHtml = '&#10060; Below the Cited Recommended Memory Baseline';
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
    <p>The traditional (OpenBSD-style) <code>bcrypt</code> algorithm silently truncates input password strings at <strong>72 bytes</strong>, ignoring any characters beyond that during authentication — but this is implementation-dependent, not a universal behavior of every bcrypt library. For example, current versions of the widely used <a href="https://github.com/pyca/bcrypt">pyca/bcrypt</a> Python library raise a <code>ValueError</code> on a password longer than 72 bytes instead of truncating it. Verify your specific implementation's actual behavior rather than assuming silent truncation.</p>
  </div>
</div>

<div class="callout warn">
  <span class="callout-title">Do Not Pre-Hash With Plain, Unkeyed SHA-256</span>
  <p>A tempting mitigation is to pre-hash long passwords with plain <code>SHA-256(password)</code> — producing a fixed 32-byte digest — before passing them to <code>bcrypt</code>. The <a href="https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pre-hashing-passwords-with-bcrypt">OWASP Password Storage Cheat Sheet</a> advises against this because of a technique known as <strong>password shucking</strong> — but the risk isn't that possessing the <code>bcrypt(SHA-256(password))</code> database alone lets an attacker skip bcrypt's cost. Attacking that stored value directly still requires one full bcrypt computation per guess, exactly as intended, regardless of what the inner hash is. The actual danger is <strong>cross-referencing</strong>: because <code>SHA-256(password)</code> is fast, unkeyed, and produces the same output for the same password everywhere it's used, if that <em>intermediate</em> digest ever becomes independently known — leaked from a different breach that stored it raw, exposed by a debug log, a caching layer, or another service using the identical pre-hash-then-store pattern — an attacker can feed that leaked <code>SHA-256</code> value directly into <code>bcrypt</code> and compare the result to your stored hash, with a single bcrypt operation. They do <strong>not</strong> need to first crack that digest back to the plaintext password to make the comparison — simply knowing the intermediate hash value is enough to confirm the match. That direct-comparison shortcut is what "shucks off" the bcrypt shell, and it works with or without the attacker ever recovering the literal password. Without that separately-leaked intermediate digest, unkeyed SHA-256 pre-hashing on its own doesn't hand an attacker a shortcut against the bcrypt-protected database — attacking the bcrypt hash directly still costs one full bcrypt computation per guess.</p>
  <p>OWASP's recommended construction instead uses a <strong>keyed</strong> pre-hash: <code>bcrypt(base64(HMAC-SHA-384(key=pepper, data=password)), salt, cost)</code>. Because HMAC-SHA-384 is keyed with a secret <strong>pepper</strong> (see "Salting &amp; Peppering Architecture" above), an attacker without that pepper cannot reuse generic public SHA-2 cracking infrastructure against the pre-hash at all — they would first need the pepper itself, which is why the pepper should live in KMS/HSM custody separate from the password database. Base64-encoding the HMAC output (rather than feeding bcrypt the raw binary digest) also avoids embedded null bytes, which some bcrypt implementations treat as a C-style string terminator and truncate on.</p>
  <p><strong>Pepper-management implications</strong>: this construction only helps if the pepper stays secret and available. Plan for pepper rotation (version peppers so old hashes can still be verified during a rotation window, then rehash on next login), a pepper backup/recovery strategy (losing the pepper makes every stored hash unverifiable — unlike a compromised salt, which only affects the one stored hash it belongs to), and awareness that a single shared pepper is a single point of failure: its compromise affects the whole user base at once, which is why it belongs in a KMS/HSM rather than application config.</p>
</div>

## Password Lifecycle Beyond Initial Storage

Choosing a hashing algorithm is only the starting point — the hash's parameters and the surrounding authentication flow need ongoing maintenance:

- **Rehash-on-login**: Because you don't have the plaintext password to re-hash a user's credential in bulk, cost-parameter upgrades (bumping Argon2id's memory or time cost, or migrating between algorithms) roll out gradually: check the stored hash's embedded parameters at every successful login, and if they're below the current target, re-hash the just-verified plaintext with the new parameters and overwrite the stored value. Inactive accounts stay on old parameters until they next log in — an accepted trade-off, not an oversight.
- **Legacy-hash migration**: The same rehash-on-login mechanism handles migrating between algorithms entirely (e.g., an old system storing plain salted SHA-256, or MD5, moving to Argon2id): verify against the legacy scheme on login, and on success, immediately compute and store the new Argon2id hash of the same plaintext. Accounts that never log back in either get force-reset or stay flagged as needing migration — silently leaving them on a broken legacy scheme indefinitely is the failure mode to design against.
- **Unicode handling**: Password inputs should be normalized (typically Unicode NFC) before hashing, and the byte encoding must be both consistent and well-defined (UTF-8 is standard) — an application that hashes raw, unnormalized bytes risks legitimate users being locked out when the same password is typed on a different keyboard layout, IME, or OS that produces a different Unicode normalization form for visually identical text. This is a different notion of "length" from the general password-policy minimum/maximum discussed earlier on this page, which [NIST SP 800-63B-4 requires counting in Unicode code points](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/), not bytes. The byte-based caveat applies specifically to algorithm-level input ceilings, like bcrypt's 72-byte limit (see above): multi-byte UTF-8 sequences can hit that truncation boundary well before a naive code-point count would suggest, but that's an algorithm implementation detail, not a general password-policy length rule.
- **Authentication DoS limits**: Memory-hard functions are expensive by design — that's the point against attackers, but it also means a login endpoint doing Argon2id verification on every request is a much easier target for a resource-exhaustion DoS than a stateless endpoint. Rate-limit authentication attempts per account and per source, and size Argon2id's memory/time parameters with your expected peak concurrent-login load in mind, not just against offline-cracking resistance in isolation — the parameters that are "strong" against an offline attacker can still be tuned so a login storm doesn't exhaust server memory.
- **Privacy-preserving breached-password checks**: [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)'s breached-password blacklisting requirement (see above) shouldn't be implemented by sending plaintext passwords to a third-party API. The [Have I Been Pwned Pwned Passwords API](https://haveibeenpwned.com/API/v3#PwnedPasswords) supports a **k-anonymity** model: the client hashes the candidate password with SHA-1, sends only the first 5 hex characters of the digest, and receives back all breached-password suffixes sharing that prefix — the client checks the full digest locally, so the full password (or its full hash) never leaves the client/server boundary being checked.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Argon2id is the primary recommendation for password storage, memory-hard against GPU/ASIC cracking; a unique per-hash salt prevents rainbow tables, and an HSM/KMS-held pepper adds protection specifically when a breach is scoped to the database alone. Rehash-on-login is how cost parameters and legacy algorithms get upgraded gradually, since bulk re-hashing isn't possible without the plaintext.</p>
</div>

## Primary references

- **RFC 9106**: *Argon2 Memory-Hard Function for Password Hashing and Proof-of-Work Applications* — [IETF RFC 9106](https://www.rfc-editor.org/rfc/rfc9106)
- **NIST SP 800-63B-4**: *Digital Identity Guidelines: Authentication and Lifecycle Management* — [NIST CSRC SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)
- **OWASP Password Storage Cheat Sheet**: *Current Argon2id, bcrypt, and PBKDF2 parameter recommendations* — [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
