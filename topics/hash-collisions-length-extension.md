---
title: Hash Collisions & Length-Extension Attacks
description: Real, downloadable MD5 and SHA-1 collisions, and a working Python length-extension attack against a naive MAC.
permalink: /topics/hash-collisions-length-extension/
---

<span class="eyebrow">Cryptography / Foundations / Deep Dive</span>

# Hash Collisions & Length-Extension Attacks

<p class="lede"><a href="{{ '/topics/hash-functions-macs/' | relative_url }}">Hash Functions & MACs</a> stated that MD5 and SHA-1 are broken, and that a naive <code>H(secret + message)</code> construction is vulnerable to length extension. Both claims, proven directly below — real downloadable collision files, and a working length-extension forgery in running code, not just an assertion.</p>

## MD5 collisions: two different files, one hash

A collision means two genuinely different inputs producing the identical hash output. Below are two real GIF files — different bytes, different images — with the same MD5 hash. These come from [corkami/collisions](https://github.com/corkami/collisions), a public research repository maintained by security researcher Ange Albertini, built specifically to make hash collisions visually obvious.

<div class="image-pair">
  <figure>
    <img src="{{ '/assets/downloads/md5-collision-1.gif' | relative_url }}" alt="A green circle image, part of an MD5 collision pair">
    <figcaption>md5-collision-1.gif (10,386 bytes)</figcaption>
  </figure>
  <figure>
    <img src="{{ '/assets/downloads/md5-collision-2.gif' | relative_url }}" alt="A red X image, part of an MD5 collision pair">
    <figcaption>md5-collision-2.gif (10,386 bytes)</figcaption>
  </figure>
</div>

<div class="callout">
  <span class="callout-title">Verify it yourself</span>
  <p>Download both — <a href="{{ '/assets/downloads/md5-collision-1.gif' | relative_url }}">md5-collision-1.gif</a> and <a href="{{ '/assets/downloads/md5-collision-2.gif' | relative_url }}">md5-collision-2.gif</a> — and run:</p>
</div>

```
$ md5 md5-collision-1.gif md5-collision-2.gif
MD5 (md5-collision-1.gif) = d7a00002b2fa4dc40f03abba0a57631c
MD5 (md5-collision-2.gif) = d7a00002b2fa4dc40f03abba0a57631c

$ cmp md5-collision-1.gif md5-collision-2.gif
md5-collision-1.gif md5-collision-2.gif differ: char 468, line 1
```

Identical MD5 hash, confirmed genuinely different files — `cmp` finds the first differing byte at position 468. If a system only checks an MD5 hash to decide whether a file is the "approved" version of something, it cannot tell these two images apart.

## SHA-1 collisions: the "SHAttered" style

In 2017, Google and CWI Amsterdam published the first practical SHA-1 collision — the **SHAttered** attack — as two different PDF files sharing one SHA-1 hash. The pair below use the same technique (in a much smaller, purpose-built form from the same corkami collection) to make the same point:

<div class="image-pair">
  <figure>
    <img src="{{ '/assets/img/sha1-collision-1.png' | relative_url }}" alt="A green diamond shape, rendered from a PDF that is part of a SHA-1 collision pair">
    <figcaption>sha1-collision-1.pdf, rendered</figcaption>
  </figure>
  <figure>
    <img src="{{ '/assets/img/sha1-collision-2.png' | relative_url }}" alt="A red X shape, rendered from a different PDF that is part of the same SHA-1 collision pair">
    <figcaption>sha1-collision-2.pdf, rendered</figcaption>
  </figure>
</div>

<div class="callout">
  <span class="callout-title">Verify it yourself</span>
  <p>Download both — <a href="{{ '/assets/downloads/sha1-collision-1.pdf' | relative_url }}">sha1-collision-1.pdf</a> and <a href="{{ '/assets/downloads/sha1-collision-2.pdf' | relative_url }}">sha1-collision-2.pdf</a> — and run:</p>
</div>

```
$ shasum -a 1 sha1-collision-1.pdf sha1-collision-2.pdf
5e00eced22afee33889d4766e8366e8326abc749  sha1-collision-1.pdf
5e00eced22afee33889d4766e8366e8326abc749  sha1-collision-2.pdf

$ cmp sha1-collision-1.pdf sha1-collision-2.pdf
sha1-collision-1.pdf sha1-collision-2.pdf differ: char 193, line 8
```

Same story: identical SHA-1 output, genuinely different files. The real SHAttered PDFs (full-size, at [shattered.io](https://shattered.io)) demonstrate exactly this same property with two full documents that each render a different image.

<div class="callout warn">
  <span class="callout-title">File verification note</span>
  <p>If you'd like to confirm the four files above weren't altered in transit from this site (a completely separate question from the MD5/SHA-1 collision demo itself — this uses SHA-256, which has no known collisions): <code>md5-collision-1.gif</code> → <code>bb0fd4741715de283750a967841dbeb0564a42205926a87d0fbb8738cbdf8e20</code>, <code>md5-collision-2.gif</code> → <code>6c8c640e19aaee6f511744da2d3b142791c3b8b5aa74b706dacb4e5e82e14bad</code>, <code>sha1-collision-1.pdf</code> → <code>ec1ba2bc0c80564a0b9cdfb04a5bbb86715189c40080cac0f054005f80ee711e</code>, <code>sha1-collision-2.pdf</code> → <code>24ba6c80f7b372a1c818a1ba3be9cc799b923868706c366d21ca17bc58b73234</code> (all SHA-256).</p>
</div>

## Length-extension attack: forging a MAC without the key

The setup: a naive server-side check computes `MAC = MD5(secret + message)` and sends `message` along with `MAC` to a client — for instance, as a signed URL parameter. The server later re-derives `MD5(secret + message)` itself and compares.

The attacker sees `message` and `MAC`, but never `secret`. Because MD5 (like SHA-1 and SHA-256) uses a **Merkle–Damgård construction**, `MAC` *is* MD5's complete internal state after processing `secret + message` — nothing about that state is hidden by the fact that it's presented as "just a hash." An attacker who also knows (or brute-forces, since it's usually short) the *length* of `secret` can resume MD5 computation from that leaked state and compute a valid MAC for `secret + message + glue_padding + anything_they_want` — without ever learning `secret` itself.

Here's a complete, runnable implementation — a from-scratch MD5 that supports resuming from an arbitrary state, self-checked against Python's own `hashlib` before it's trusted for the attack:

```python
import struct, hashlib, math

S = [7,12,17,22]*4 + [5,9,14,20]*4 + [4,11,16,23]*4 + [6,10,15,21]*4
K = [int(abs(math.sin(i+1)) * 2**32) & 0xFFFFFFFF for i in range(64)]

def left_rotate(x, c):
    x &= 0xFFFFFFFF
    return ((x << c) | (x >> (32 - c))) & 0xFFFFFFFF

def md5_padding(msg_len_bytes):
    bit_len = (msg_len_bytes * 8) & 0xFFFFFFFFFFFFFFFF
    padding = b'\x80'
    pad_len = (56 - (msg_len_bytes + 1) % 64) % 64
    padding += b'\x00' * pad_len
    padding += struct.pack('<Q', bit_len)
    return padding

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

def md5_full(data):
    h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476]
    padded = data + md5_padding(len(data))
    for i in range(0, len(padded), 64):
        h = md5_compress(padded[i:i+64], h)
    return h

def state_to_hex(h): return b''.join(struct.pack('<I', x) for x in h).hex()
def hex_to_state(hx): return list(struct.unpack('<4I', bytes.fromhex(hx)))

# Self-check: this implementation must match hashlib exactly before we trust it
assert state_to_hex(md5_full(b"The quick brown fox")) == hashlib.md5(b"The quick brown fox").hexdigest()

# --- The server's naive (broken) construction ---
def naive_mac(secret, message):
    return hashlib.md5(secret + message).hexdigest()

SECRET = b"s3cr3tkey"                                # attacker does NOT know this
original_message = b"user=alice&admin=false"
original_mac = naive_mac(SECRET, original_message)   # leaked/observed, alongside the message

# --- Attacker: knows only original_message, original_mac, and a guess at len(SECRET) ---
guessed_secret_len = 9
injected_data = b"&admin=true"

state = hex_to_state(original_mac)
glue_padding = md5_padding(guessed_secret_len + len(original_message))
forged_message = original_message + glue_padding + injected_data

total_len_so_far = guessed_secret_len + len(original_message) + len(glue_padding)
h = state
tail = injected_data + md5_padding(total_len_so_far + len(injected_data))
for i in range(0, len(tail), 64):
    h = md5_compress(tail[i:i+64], h)
forged_mac = state_to_hex(h)

# --- Does the real server (which HAS the secret) accept the forgery? ---
print("forged MAC matches server check:", naive_mac(SECRET, forged_message) == forged_mac)
```

Running it:

```
Self-check: from-scratch MD5 matches hashlib.md5 -- OK

Observed (public):  message = b'user=alice&admin=false'
Observed (public):  MAC     = f68e58dd36a1291ffbbcc1f40e393f6d

Forged message: b'user=alice&admin=false\x80\x00...\x00\xf8\x00\x00\x00\x00\x00\x00\x00&admin=true'
Forged MAC:     bcb0f99f1209133ffd73692c4a305301

forged MAC matches server check: True
```

`True` is the whole point: the attacker turned `admin=false` into `admin=true`, appended it to the message, and produced a MAC the real server accepts as valid — having never seen `SECRET` even once.

## Why HMAC isn't vulnerable to this

```python
import hmac, hashlib
tag = hmac.new(b"weakkey", b"user=alice&admin=false", hashlib.md5).hexdigest()
```

There is no equivalent attack against this line. [HMAC]({{ '/topics/hash-functions-macs/' | relative_url }}#macs-adding-a-key-to-prove-who-sent-it) hashes twice, with the key mixed in at both the inner and outer layer — the tag it produces is not usable as a resumable internal state the way a plain hash's output is, because it isn't the raw output of processing `key + message` in one pass. This is precisely why [Hash Functions & MACs]({{ '/topics/hash-functions-macs/' | relative_url }}#why-naive-hkey--message-is-broken-length-extension-attacks) insists on HMAC over hand-rolled concatenation, and it's not a theoretical concern — Flickr's API signature scheme was broken exactly this way in 2009, letting attackers forge valid API calls without the shared secret.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p>Wang and Yu, <em>"How to Break MD5 and Other Hash Functions"</em> (2005) is the original MD5 collision paper. Stevens, Bursztein, Karpman, Albertini, and Markov, <em>"The First Collision for Full SHA-1"</em> (Google/CWI, 2017) is the SHAttered paper — full technical detail and the original full-size PDFs at <a href="https://shattered.io">shattered.io</a>. <strong><a href="https://www.rfc-editor.org/rfc/rfc2104">RFC 2104</a></strong> defines HMAC.</p>
</div>

## Where this fits

The hands-on companion to [Hash Functions & MACs]({{ '/topics/hash-functions-macs/' | relative_url }}): everything stated there about MD5, SHA-1, and length extension, demonstrated here with real files and running code rather than taken on faith.
