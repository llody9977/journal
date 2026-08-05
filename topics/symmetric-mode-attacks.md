---
title: "Symmetric Mode Attacks: ECB, CBC & CTR"
description: Real, runnable demonstrations of the ECB pattern leak, CBC bit-flipping, and CTR nonce-reuse — with actual AES ciphertext.
permalink: /topics/symmetric-mode-attacks/
last_verified: 2026-08-05
---

<span class="eyebrow">Cryptography / Failure Analysis</span>

# Symmetric Mode Attacks: ECB, CBC & CTR

<p class="lede">I wanted runnable proof for the three mode failures I keep seeing in explanations: ECB pattern leakage, CBC malleability without authentication, and CTR nonce reuse. These fixed-value commands are for learning only; the keys and IVs are deliberately public so I can reproduce the same output.</p>

<div class="callout">
  <span class="callout-title">About the keys below</span>
  <p>Every command uses a fixed, published key and IV so the walkthrough is exactly reproducible. In a real system the key must be secret and generated with a cryptographically secure random number generator. The IV/nonce rule depends on the mode: CBC encryption needs an unpredictable IV, while CTR requires a nonce/counter value that never repeats under the same key.</p>
</div>

## 1. ECB: identical plaintext blocks → identical ciphertext blocks

Encrypt 64 bytes of plaintext made of the same 16-byte block repeated four times:

```
$ printf 'ATTACKATDAWN1234ATTACKATDAWN1234ATTACKATDAWN1234ATTACKATDAWN1234' > plain.bin

$ openssl enc -aes-128-ecb -K 000102030405060708090a0b0c0d0e0f -nopad -in plain.bin -out cipher.bin

$ xxd cipher.bin
00000000: f443 167b d98b 197e 88e7 a6fd c7c0 1f50  .C.{...~.......P
00000010: f443 167b d98b 197e 88e7 a6fd c7c0 1f50  .C.{...~.......P
00000020: f443 167b d98b 197e 88e7 a6fd c7c0 1f50  .C.{...~.......P
00000030: f443 167b d98b 197e 88e7 a6fd c7c0 1f50  .C.{...~.......P
```

All four ciphertext blocks are byte-for-byte identical — because all four plaintext blocks were identical, and ECB encrypts each block completely independently. For contrast, the exact same plaintext under CTR mode:

```
$ openssl enc -aes-128-ctr -K 000102030405060708090a0b0c0d0e0f \
    -iv 00112233445566778899aabbccddeeff -in plain.bin -out ctr_cipher.bin

$ xxd ctr_cipher.bin
00000000: 2890 b499 2930 4564 9c8c e0ce 4186 f66e  (...)0Ed....A..n
00000010: 9c2c d37c e916 c6ac a0d6 e9bb 702c fd06  .,.|........p,..
00000020: d724 47fe 585a 2d19 7d69 e3f3 5297 1db4  .$G.XZ-.}i..R...
00000030: 38f7 cd4c e876 7d45 0ae9 22b0 c928 dd43  8..L.v}E.."..(.C
```

Four completely different-looking blocks from the same repeated plaintext. This is exactly the [pattern-leak diagram]({{ '/topics/symmetric-cryptography/' | relative_url }}#modes-of-operation-why-aes-alone-isnt-enough) from the Symmetric Cryptography page, reproduced with real AES output instead of illustration — and it's the same reason ECB-encrypted images famously still show a recognizable silhouette of the original picture.

## 2. CBC: a missing integrity check that can lead to privilege escalation

AES-CBC only provides confidentiality — nothing in the mode itself checks whether a ciphertext was tampered with in transit. MITRE classifies that gap as [CWE-353: Missing Support for Integrity Check](https://cwe.mitre.org/data/definitions/353.html). When an application then trusts a value recovered from that ciphertext to make an authorization decision, it compounds into [CWE-807: Reliance on Untrusted Inputs in a Security Decision](https://cwe.mitre.org/data/definitions/807.html) — attacker-controlled bytes deciding who counts as admin. The toy example below reproduces exactly that chain, using the same kind of `isadmin` flag popularized by [Cryptopals Set 2, Challenge 16, "CBC bitflipping attacks"](https://cryptopals.com/sets/2/challenges/16).

The plaintext is a fake session string, exactly 32 bytes (two AES blocks): `user=alice;role=` (block 1) followed by `user;isadmin=0;;` (block 2).

```
$ python3 -c "open('plain.bin','wb').write(b'user=alice;role=' + b'user;isadmin=0;;')"

$ openssl enc -aes-128-cbc -K 000102030405060708090a0b0c0d0e0f \
    -iv 0102030405060708090a0b0c0d0e0f10 -nopad -in plain.bin -out cipher.bin

$ xxd cipher.bin
00000000: bc71 8c55 b1a5 ff2f ae64 7de3 debd 047f  .q.U.../.d}.....
00000010: f3a7 ff30 057f 2213 0d2d 45e0 41d7 74f8  ...0.."..-E.A.t.
```

The attacker never sees the plaintext or the key — only this ciphertext. They know (or guess, from how the application is built) that byte 13 of block 2 is the `isadmin` flag character. In CBC, flipping a bit in ciphertext block *N* flips that exact same bit in the **decrypted plaintext of block N+1** — while completely destroying block *N*'s own decrypted content:

<div class="diagram-frame">
  <img src="{{ '/assets/img/cbc-bitflip.svg' | relative_url }}" alt="Diagram showing a CBC bit-flipping attack: the attacker flips one byte in ciphertext block 1, which scrambles block 1's own decrypted plaintext into garbage, but changes exactly one corresponding byte in block 2's decrypted plaintext -- flipping isadmin=0 to isadmin=1 -- without ever knowing the encryption key." >
  <p class="diagram-caption">One flipped ciphertext byte, one precisely controlled plaintext byte next door</p>
</div>

```
$ python3 -c "
data = bytearray(open('cipher.bin','rb').read())
data[13] ^= (ord('0') ^ ord('1'))   # flip byte 13 of block 1
open('cipher_flipped.bin','wb').write(data)
"

$ openssl enc -d -aes-128-cbc -K 000102030405060708090a0b0c0d0e0f \
    -iv 0102030405060708090a0b0c0d0e0f10 -nopad -in cipher_flipped.bin -out decrypted.bin

$ python3 -c "
d = open('decrypted.bin','rb').read()
print('block 1 (garbled):', d[0:16])
print('block 2 (target): ', d[16:32])
"
block 1 (garbled): b'\xc3\xef<?\xef\xe1\xc4\x84\xf28\xe5\x11G\xdd\x8c\$'
block 2 (target):   b'user;isadmin=1;;'
```

`isadmin=0` became `isadmin=1`, byte-exact, with block 1 turned to unrecoverable noise. No exception was thrown and no check failed — CBC decryption has nothing built in that could reject this. In an application that trusted this field, that byte flip is a complete privilege-escalation primitive, built entirely from the ciphertext, without the key or the plaintext ever being seen. The fix is not a secret field name; it's authenticating the ciphertext with a MAC or an AEAD mode like GCM before trusting anything decrypted from it. Microsoft's [MS10-070](https://learn.microsoft.com/en-us/security-updates/securitybulletins/2010/ms10-070) was a similar CBC problem, but a different attack. It was a "padding oracle": the attacker sent many guesses and learned secrets from how the server reacted to bad padding, not a single bit-flip like the example above.

## 3. CTR: nonce reuse exposes the plaintext relationship

Encrypt two *different* messages of the same length, using the same key **and the same nonce** — the one thing CTR mode absolutely cannot tolerate:

```
$ python3 -c "
open('p1.bin','wb').write(b'Transfer \$100 to Bob!!!')
open('p2.bin','wb').write(b'Meet me at 9pm sharp!!!')
"

$ openssl enc -aes-128-ctr -K 000102030405060708090a0b0c0d0e0f \
    -iv 00000000000000000000000000000001 -in p1.bin -out c1.bin
$ openssl enc -aes-128-ctr -K 000102030405060708090a0b0c0d0e0f \
    -iv 00000000000000000000000000000001 -in p2.bin -out c2.bin
```

<div class="diagram-frame">
  <img src="{{ '/assets/img/ctr-two-time-pad.svg' | relative_url }}" alt="Diagram showing a CTR nonce-reuse attack: the same key and nonce produce the identical keystream for two different plaintexts, so XORing the two resulting ciphertexts together cancels the keystream entirely and reveals the XOR of the two plaintexts, without any knowledge of the key." >
  <p class="diagram-caption">The keystream cancels out — no key, no decryption, just XOR</p>
</div>

An attacker who only ever sees `c1.bin` and `c2.bin` — never the key, never the plaintexts — computes this:

```
$ python3 -c "
c1 = open('c1.bin','rb').read()
c2 = open('c2.bin','rb').read()
p1 = open('p1.bin','rb').read()
p2 = open('p2.bin','rb').read()
xor_c = bytes(a ^ b for a, b in zip(c1, c2))
xor_p = bytes(a ^ b for a, b in zip(p1, p2))
print('XOR(C1, C2) =', xor_c)
print('XOR(P1, P2) =', xor_p)
print('equal:', xor_c == xor_p)
"
XOR(C1, C2) = b'\x19\x17\x04\x1aS\x0b\x00RAP\x11\t@MT\x1cH#\x1d\x12\x00\x00\x00'
XOR(P1, P2) = b'\x19\x17\x04\x1aS\x0b\x00RAP\x11\t@MT\x1cH#\x1d\x12\x00\x00\x00'
equal: True
```

The identical keystream cancels out, leaving `P1 XOR P2`—a direct relationship between the secret messages, recovered with no key. This does not automatically reveal both complete plaintexts. If the attacker knows or can guess part of one message, however, the corresponding part of the other message can be recovered:

```
$ python3 -c "
xor_c = bytes(a ^ b for a, b in zip(open('c1.bin','rb').read(), open('c2.bin','rb').read()))
guess = b'Transfer \$100 to'
recovered = bytes(a ^ b for a, b in zip(xor_c[:len(guess)], guess))
print('guessed part of P1:  ', guess)
print('recovered part of P2:', recovered)
"
guessed part of P1:   b'Transfer $100 to'
recovered part of P2: b'Meet me at 9pm s'
```

Guessing 17 bytes of one message recovered the corresponding 17 bytes of the other from public ciphertext. WEP suffered from repeated/weak IVs and RC4 keystream reuse, but its failure also involved RC4 key-scheduling weaknesses, a small IV space, and a weak CRC-based integrity check. The narrower lesson for CTR is still clear: [nonce reuse]({{ '/topics/symmetric-cryptography/' | relative_url }}#modes-of-operation-why-aes-alone-isnt-enough) creates a two-time-pad problem.

<div class="callout warn">
  <span class="callout-title">Switching to GCM does not fix nonce reuse</span>
  <p>GCM uses counter-mode encryption plus the GHASH authenticator. A valid tag makes CBC-style undetected bit flipping fail. It does <strong>not</strong> make nonce reuse safe: reuse exposes the same plaintext relationship shown here and can reveal enough information about GCM's authentication subkey to enable forgeries. This does not mean the AES key itself is directly exposed. The operational rule is still simple: never repeat a GCM nonce under the same key.</p>
</div>

## Common pitfalls, specific to these three demos

- **Assuming "not ECB" is automatically safe** — unauthenticated CBC is malleable and needs an unpredictable IV; CTR is also malleable and must never repeat a nonce/counter under the same key. A reviewed AEAD construction handles confidentiality and authentication together.
- **Treating a random-looking ciphertext as proof of security** — the CTR ciphertexts above look perfectly random individually; the weakness only appears once two of them are compared.
- **Reusing an IV/nonce "just for testing," then shipping it** — a shockingly common real-world root cause, since it "works" functionally right up until it's exploited.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://csrc.nist.gov/pubs/sp/800/38/a/final">NIST SP 800-38A</a></strong> defines ECB, CBC, and CTR. <strong><a href="https://csrc.nist.gov/pubs/sp/800/38/d/final">NIST SP 800-38D</a></strong> defines GCM. Vaudenay's 2002 paper <em>"Security Flaws Induced by CBC Padding"</em> formalized the padding-oracle attack class that CBC's lack of integrity checking enables.</p>
</div>
