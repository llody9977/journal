---
title: "Symmetric Mode Attacks: ECB, CBC & CTR"
description: Practical cryptanalysis and runnable CLI demonstrations of ECB pattern leakage, CBC bit-flipping malleability, and CTR two-time pad nonce reuse attacks.
permalink: /topics/symmetric-mode-attacks/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Failure Analysis</span>

# Symmetric Mode Attacks: ECB, CBC & CTR

<p class="lede">Evaluating symmetric block cipher modes requires understanding their specific cryptanalytic failure modes. Unauthenticated cipher modes fail in distinct ways: Electronic Codebook (ECB) leaks structural patterns, Cipher Block Chaining (CBC) is vulnerable to bit-flipping and padding oracle attacks, and Counter (CTR) mode collapses into a two-time pad when nonces repeat under the same key.</p>

## Attack Summary Matrix

| Cipher Mode | Vulnerability / Failure Mode | Root Cause | Impact | Defensive Countermeasure |
|---|---|---|---|---|
| **AES-CBC** | Bit-Flipping Malleability &amp; Padding Oracles | Ciphertext block **N** XORed into plaintext block **N+1** during decryption | Attacker flips arbitrary bits in block **N+1** without knowing the key | **Use AEAD (AES-GCM)** or apply Encrypt-then-MAC (HMAC-SHA256). |
| **AES-CTR** | Two-Time Pad Keystream Reuse | Identical nonce/counter generates duplicate keystream | **C<sub>1</sub> &oplus; C<sub>2</sub> = P<sub>1</sub> &oplus; P<sub>2</sub>**; recovers plaintext without knowing key | **Never Reuse Nonces**; deploy CSPRNG 96-bit nonces or **AES-GCM-SIV ([RFC 8452](https://www.rfc-editor.org/rfc/rfc8452))**. |
| **AES-ECB** | Structural Pattern Leakage | Independent block encryption (**C<sub>i</sub> = E<sub>K</sub>(P<sub>i</sub>)**) | Plaintext patterns and duplicate blocks remain visible in ciphertext | **Do Not Use ECB**; deploy AES-GCM or ChaCha20-Poly1305. |

## 1. ECB Mode: Structural Pattern Leakage

In **ECB (Electronic Codebook)** mode, every 16-byte plaintext block **P<sub>i</sub>** is encrypted independently using key **K**:

**C<sub>i</sub> = E<sub>K</sub>(P<sub>i</sub>)**

When identical plaintext blocks occur in input data, identical ciphertext blocks are emitted.

<div class="diagram-frame">
  <img src="{{ '/assets/img/ecb-openssl-block-leak.svg' | relative_url }}?v=3" alt="AES-128-ECB block pattern leakage breakdown showing identical 16-byte plaintext blocks producing identical 16-byte hex ciphertext outputs.">
  <p class="diagram-caption">AES-128-ECB block pattern leakage: four identical 16-byte plaintext blocks yield identical 16-byte hex ciphertext outputs (ecb_leak.py)</p>
</div>

### Python ECB Pattern Leakage Demonstration

```python
# ecb_leak.py: Demonstrating identical block pattern leakage in AES-ECB
import subprocess

# 1. Create a 64-byte plaintext with four identical 16-byte blocks
plain = b"ATTACKATDAWN1234" * 4
open("plain.bin", "wb").write(plain)

# 2. Encrypt using AES-128-ECB via OpenSSL
key_hex = "000102030405060708090a0b0c0d0e0f"
cmd = (
    f"openssl enc -aes-128-ecb -K {key_hex} "
    f"-nopad -in plain.bin -out ecb_cipher.bin"
)
subprocess.run(cmd, shell=True)

# 3. Read ciphertext and inspect 16-byte blocks
cipher = open("ecb_cipher.bin", "rb").read()
for i in range(0, len(cipher), 16):
    print(f"Block {i//16 + 1}:", cipher[i:i+16].hex())
# Output:
# Block 1: f443167bd98b197e88e7a6fdc7c01f50
# Block 2: f443167bd98b197e88e7a6fdc7c01f50  (Identical Match!)
# Block 3: f443167bd98b197e88e7a6fdc7c01f50  (Identical Match!)
# Block 4: f443167bd98b197e88e7a6fdc7c01f50  (Identical Match!)
```

## 2. CBC Mode: Bit-Flipping Malleability & Padding Oracle Attacks

In **CBC (Cipher Block Chaining)** mode, plaintext block **P<sub>i</sub>** is XORed with previous ciphertext block **C<sub>i-1</sub>** before encryption:

**P<sub>i</sub> = D<sub>K</sub>(C<sub>i</sub>) &oplus; C<sub>i-1</sub>**

Because **C<sub>i-1</sub>** is XORed directly into decrypted plaintext **P<sub>i</sub>**, altering byte **k** of **C<sub>i-1</sub>** changes byte **k** of **P<sub>i</sub>** by the exact same bitmask, while scrambling block **P<sub>i-1</sub>** into unrecoverable noise.

<div class="diagram-frame">
  <img src="{{ '/assets/img/cbc-bitflip.svg' | relative_url }}?v=2" alt="CBC bit-flipping attack diagram showing how flipping byte k in ciphertext block 1 alters byte k in decrypted block 2.">
  <p class="diagram-caption">CBC bit-flipping mechanics: altering ciphertext block 1 flips targeted bits in block 2</p>
</div>

### Python Bit-Flipping Privilege Escalation Proof

```python
# cbc_attack.py: Bit-flipping attack modifying "isadmin=0" to "isadmin=1"
import subprocess

# 1. Create a 32-byte plaintext across two 16-byte AES blocks:
# Block 1: "user=alice;role="
# Block 2: "user;isadmin=0;;"
plain = b"user=alice;role=" + b"user;isadmin=0;;"
open("plain.bin", "wb").write(plain)

# 2. Encrypt using AES-128-CBC with OpenSSL
key_hex = "000102030405060708090a0b0c0d0e0f"
iv_hex  = "0102030405060708090a0b0c0d0e0f10"

cmd_enc = (
    f"openssl enc -aes-128-cbc -K {key_hex} -iv {iv_hex} "
    f"-nopad -in plain.bin -out cipher.bin"
)
subprocess.run(cmd_enc, shell=True)

# 3. Flip bit 13 in Block 1 of Ciphertext ('0' -> '1' in Block 2)
ciphertext = bytearray(open("cipher.bin", "rb").read())
ciphertext[13] ^= (ord("0") ^ ord("1"))
open("cipher_flipped.bin", "wb").write(ciphertext)

# 4. Decrypt tampered ciphertext
cmd_dec = (
    f"openssl enc -d -aes-128-cbc -K {key_hex} -iv {iv_hex} "
    f"-nopad -in cipher_flipped.bin -out decrypted.bin"
)
subprocess.run(cmd_dec, shell=True)

decrypted = open("decrypted.bin", "rb").read()
print("Block 1 (Garbled Noise):", decrypted[0:16])
print("Block 2 (Target Payload):", decrypted[16:32])
# Output: Block 2 (Target Payload): b'user;isadmin=1;;'
```

Because unauthenticated CBC mode lacks an authentication tag (AEAD), decryption succeeds without raising an integrity exception, granting unauthorized administrative privileges.

## 3. CTR Mode: Nonce Reuse Two-Time Pad Attack

In **CTR (Counter)** mode, AES operates as a stream cipher, encrypting a counter value to generate a pseudo-random keystream **KS**:

**C<sub>1</sub> &oplus; C<sub>2</sub> = (P<sub>1</sub> &oplus; KS) &oplus; (P<sub>2</sub> &oplus; KS) = P<sub>1</sub> &oplus; P<sub>2</sub>**

If a nonce is reused under the same key, the exact same keystream **KS** is generated (**KS<sub>1</sub> = KS<sub>2</sub>**). XORing two ciphertexts together eliminates the keystream and secret key entirely, leaving the XOR sum of the two plaintexts (**P<sub>1</sub> &oplus; P<sub>2</sub>**).

<div class="diagram-frame">
  <img src="{{ '/assets/img/ctr-two-time-pad.svg' | relative_url }}?v=2" alt="CTR two-time pad attack diagram showing keystream cancellation when nonces repeat under the same key.">
  <p class="diagram-caption">CTR nonce-reuse two-time pad: XORing ciphertexts C1 and C2 reveals P1 XOR P2</p>
</div>

### Python Keystream Extraction Proof

```python
# ctr_reuse.py: Extracting plaintext bytes from CTR nonce reuse
c1 = open("c1.bin", "rb").read()  # Encrypted "Transfer $100 to Bob!!!"
c2 = open("c2.bin", "rb").read()  # Encrypted "Meet me at 9pm sharp!!!"

# 1. Compute XOR of the two ciphertexts
xor_cipher = bytes(a ^ b for a, b in zip(c1, c2))

# 2. Known-Plaintext Attack: Suppose adversary guesses first 16 bytes of P1 ("Transfer $100 to")
guessed_p1 = b"Transfer $100 to"

# 3. Recover corresponding bytes of P2 without the decryption key
recovered_p2 = bytes(a ^ b for a, b in zip(xor_cipher[:len(guessed_p1)], guessed_p1))
print("Recovered P2 bytes:", recovered_p2)
# Output: Recovered P2 bytes: b'Meet me at 9pm s'
```

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Symmetric Mode Vulnerabilities Summary</strong>
    <ul>
      <li><strong>ECB Block Leakage</strong>: Identical plaintext blocks produce identical ciphertext blocks. Never use ECB for multi-block payloads.</li>
      <li><strong>CBC Bit-Flipping</strong>: Modifying ciphertext block <em>C₁</em> flips corresponding bits in decrypted plaintext block <em>P₂</em>. Always enforce AEAD or HMAC.</li>
      <li><strong>CTR Two-Time Pad</strong>: Reusing a counter/nonce exposes <em>C₁ ⊕ C₂ = P₁ ⊕ P₂</em>, allowing adversaries to recover cleartext payloads.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-38A**: *Recommendation for Block Cipher Modes of Operation* — [NIST CSRC SP 800-38A](https://csrc.nist.gov/pubs/sp/800/38/a/final)
- **RFC 8452**: *AES-GCM-SIV: Nonce-Misuse-Resistant Authenticated Encryption* — [IETF RFC 8452](https://www.rfc-editor.org/rfc/rfc8452)
