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

### Verification Commands

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

## 2. SHA-1 Collisions: The SHAttered Attack Strategy

In 2017, Google and CWI Amsterdam published the **SHAttered** attack, demonstrating the first practical SHA-1 collision using two distinct PDF documents sharing an identical SHA-1 hash.

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
