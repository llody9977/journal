---
title: Password Storage
description: Why fast hashes are the wrong tool for passwords, what salting actually fixes, and bcrypt/scrypt/Argon2 compared.
permalink: /topics/password-storage/
---

<span class="eyebrow">Cryptography / Applied Cryptography / Deep Dive</span>

# Password Storage

<p class="lede">The <a href="{{ '/topics/hash-functions-macs/' | relative_url }}">Hash Functions & MACs</a> page flagged this as a common misuse in passing — the full version: why a perfectly good cryptographic hash function is still the wrong tool for storing passwords, and what to use instead.</p>

## How password strength is actually measured

Password strength comes down to **entropy** — how many guesses an attacker needs on average before hitting the right one — and entropy is a function of exactly two things: the size of the character set a password draws from, and its length. The formula is simple: entropy in bits ≈ length × log2(character-set size).

- A 6-character password using only lowercase letters (26 options) has ~28 bits of entropy (6 × log2(26) ≈ 6 × 4.7).
- A 12-character lowercase-only password has ~56 bits — doubling the length roughly doubles the bits, a linear relationship.
- Adding uppercase, digits, and symbols (94 printable ASCII characters) only modestly raises the *per-character* contribution (log2(94) ≈ 6.6 bits vs. log2(26) ≈ 4.7 bits) — nowhere near as much as extending the length does.

This is exactly why **NIST SP 800-63B Revision 4** (finalized 2024, published 2025) changed its own guidance: it now explicitly **prohibits mandating composition rules** ("must contain one uppercase, one digit, one symbol"), requires systems to support passwords up to 64 characters, recommends 15+ characters when a password is the sole authenticator, and drops forced periodic rotation entirely. Composition rules turn out to encourage predictable patterns (a capital letter at the start, a digit and `!` at the end) that add far less real entropy than the rules imply, while doing nothing about the attack that actually matters: an attacker checking a stolen hash against billions of guesses per second doesn't care whether a password "looks complex" to a human, only how many guesses it actually takes to find.

## Why plain SHA-256 is the wrong tool

A symmetric encryption key is, by design, uniformly random across its entire keyspace — there's no shortcut better than brute-forcing every possibility. A human-chosen password is nothing like that: it's drawn from a comparatively tiny set of dictionary words, names, dates, and predictable patterns, even when it looks reasonably long.

That gap matters enormously combined with hash speed. SHA-256 is *fast* — a virtue almost everywhere else, and a liability here: an attacker who steals a database of SHA-256 password hashes can try billions of candidate passwords per second on a single consumer GPU.

<div class="diagram-frame">
  <img src="{{ '/assets/img/password-hash-comparison.svg' | relative_url }}" alt="Bar chart comparing guess rates against a stolen hash: SHA-256 allows roughly 10 billion guesses per second, bcrypt only thousands per second, scrypt only hundreds per second, and Argon2id only tens per second." >
  <p class="diagram-caption">Same GPU, same stolen hash — the algorithm alone is a nine-order-of-magnitude difference</p>
</div>

Password storage needs a hash that's deliberately, tunably **slow** — the opposite design goal from almost every other cryptographic use case.

## Salting: solving a different problem

Salting is frequently misunderstood as the fix for hash speed. It isn't — a salt is a unique-per-user random value stored *alongside* the hash (not secret, not hidden) that solves two different problems:

- **Precomputed rainbow tables** — without a salt, an attacker can precompute hashes for common passwords once, then look up any stolen hash instantly. A unique salt per user makes that precomputation useless — the attacker has to redo the work per user.
- **Cross-user pattern leaks** — without a salt, two users with the same password get identical hashes, visibly revealing that fact to anyone with database access.

Salting does **not** slow down cracking any single targeted hash — that's entirely the job of the algorithm's cost parameters, covered next.

## Pepper: the other secret, and what it actually fixes

A pepper gets introduced right after salt and treated as "basically another salt" — it isn't, and the two solve genuinely different problems:

- **Salt** is unique per user, stored right alongside the hash in the database, and not secret at all — anyone with database access already has every salt. It defeats precomputed rainbow tables and cross-user pattern leaks, but adds no protection at all once the whole database is stolen.
- **Pepper** is a single secret value, shared across *every* password, deliberately stored *separately* from the database — in application config, an environment variable, or ideally an [HSM/KMS]({{ '/topics/hsm-kms/' | relative_url }}).

The specific problem pepper solves: the single most common real-world breach shape is "the database leaked, but the application server or secrets store didn't." Salt alone doesn't help here — an attacker holding the full database (hashes and salts together) already has everything needed to check a guess, and can start offline cracking immediately. A pepper changes that outcome directly: without it, the stolen database doesn't contain enough to verify a guess against *any* hash at all, because computing the correct hash also requires the pepper — a value that was never in the database to begin with. Offline cracking becomes impossible unless the attacker separately compromises wherever the pepper actually lives, a genuinely distinct system from the database.

In practice, a pepper is usually applied as an HMAC key over the password *before* the slow hash runs (`Argon2id(HMAC(pepper, password), salt)`) rather than simply concatenated in, keeping its role as a keyed secret clearly distinct from the salt's role as a public, per-user randomizer.

## Purpose-built password hashing functions

| Function | Approach | Notes |
|---|---|---|
| PBKDF2 | Repeats an HMAC many times | NIST-approved and still permitted, but not memory-hard — GPUs and ASICs parallelize it well, making it the weakest of this group |
| bcrypt | Blowfish-based, tunable cost factor | Fixed, small memory usage (~4 KB) — better than PBKDF2 against GPUs, but ASICs can still be built for it |
| scrypt | Tunable memory *and* CPU cost | Memory-hard by design — deliberately expensive to parallelize in custom hardware |
| **Argon2id** | Tunable memory, iterations, and parallelism | Winner of the 2015 Password Hashing Competition; **current default recommendation** (OWASP, NIST-adjacent guidance) for new systems |

## Recommended parameters

Per the OWASP Password Storage Cheat Sheet:

- **Argon2id** — minimum 19 MiB memory, 2 iterations, 1 degree of parallelism (higher memory is better if the server can afford it).
- **bcrypt** — cost factor of at least 10, higher if server load allows.
- **PBKDF2-HMAC-SHA256** — at least 600,000 iterations (per OWASP's 2023 update, tracking hardware getting faster over time).

## Practical demo

bcrypt, via `htpasswd` (same password, hashed twice — notice the output differs both times, because the salt is randomized automatically and stored inside the encoded hash itself):

```
$ htpasswd -nbB myuser "correct-horse-battery-staple"
myuser:$2y$05$TXSRTV1DhpfITpZ4t8wbvOOHmkK1FaXlWLS65q2VOyEcBYdyn8bQa

$ htpasswd -nbB myuser "correct-horse-battery-staple"
myuser:$2y$05$50Tlm46uGlyc6bH2cvq5WOwBD0Fet11y2sa78kNRcnAaMnTApmgo6
```

Argon2id directly, with explicit cost parameters:

```
$ echo -n "correct-horse-battery-staple" | argon2 somesalt1234567 -id -t 2 -m 16 -p 1

Type:           Argon2id
Iterations:     2
Memory:         65536 KiB
Parallelism:    1
Hash:           cc412e41b15195615e8650b35fb2fc9b868dae734479921a60c8a6c7a4da6c44
Encoded:        $argon2id$v=19$m=65536,t=2,p=1$c29tZXNhbHQxMjM0NTY3$zEEuQbFRlWFehlCzX7L8m4aNrnNEeZIaYMimx6TabEQ
0.086 seconds
Verification ok
```

That `0.086 seconds` is the entire point — a deliberately-imposed cost, per guess, that's negligible for one real login attempt but devastating multiplied across billions of offline guesses.

## Real-world case: Adobe, 2013

In October 2013, attackers stole a database covering roughly 38 million active Adobe user accounts, and how that database was actually protected has become one of the most-cited cautionary tales in this entire field. Adobe hadn't hashed the passwords at all — it had **encrypted** them, symmetrically, using 3DES **in ECB mode**, with the same key for every user.

That combination fails in exactly the way [ECB itself fails]({{ '/topics/symmetric-cryptography/' | relative_url }}#modes-of-operation-why-aes-alone-isnt-enough): identical plaintext blocks always produce identical ciphertext blocks. Two users with the same password ended up with byte-for-byte identical encrypted values, visible to anyone with the stolen data — no cracking required to spot the pattern, only to exploit it. Adobe had also stored plaintext password *hints* alongside the encrypted blobs, which let researchers cluster accounts by identical ciphertext and then use the hints to guess the shared password outright; [Bruce Schneier's contemporaneous write-up](https://www.schneier.com/blog/archives/2013/11/cryptographic_b.html) walked through exactly how, and the incident has carried the "textbook example of what not to do" label ever since.

The lesson isn't subtle: even a cipher that isn't itself broken — 3DES was not the weak point here — applied the wrong way (encryption instead of hashing, ECB instead of literally any other mode, one key shared across every user instead of per-user salts) reduces password storage to roughly the security of a lookup table.

## Common pitfalls

- **Using a fast general-purpose hash** (SHA-256, MD5, SHA-1) directly on passwords — the single most common real-world mistake in this area.
- **Rolling a homemade "stretching" scheme** (e.g., manually hashing in a loop 1,000 times) instead of a vetted library — easy to get subtly wrong in ways that don't show up until it's already been breached.
- **Reversible encryption instead of hashing** — if a system can decrypt stored passwords, so can anyone who compromises it; there's no legitimate reason a server needs the plaintext password back.
- **Skipping rate limiting** — slow hashing helps against a stolen database, not against an attacker just repeatedly trying logins online; both defenses are needed together.
- **Confusing a pepper with a salt** — see above; a pepper is an additional defense-in-depth layer against a database-only breach, not a replacement for per-user salts.
- **Enforcing composition rules or forced rotation** — current NIST guidance explicitly moves away from both; see above for why they add less real entropy than length does.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/sp/800/63/b/final">NIST SP 800-63B</a></strong> (Revision 4, 2025) covers memorized secret (password) verifier requirements, including the length-over-composition guidance above. The <a href="https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html"><strong>OWASP Password Storage Cheat Sheet</strong></a> is the most actively maintained practical guidance, including the specific hashing parameter numbers above.</p>
</div>

## Where this fits

This is the password-specific answer to the same question [Key Exchange & Key Derivation]({{ '/topics/key-exchange-derivation/' | relative_url }}#from-shared-secret-to-usable-keys-kdfs) raised for a different kind of input: a low-entropy secret needs a deliberately expensive derivation function, while a high-entropy shared secret (like a DH output) needs the opposite — a fast, simple one like HKDF. Same shape of problem — "turn this into a usable key" — solved by different tools depending on how much entropy actually went in.
