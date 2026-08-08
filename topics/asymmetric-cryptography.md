---
title: Asymmetric Cryptography & Public-Key Infrastructure
description: Core principles of asymmetric key pairs, HPKE, RSA vs ECC comparison, Ed25519 signatures, and OpenSSL CLI demonstrations proving why private keys cannot encrypt data.
permalink: /topics/asymmetric-cryptography/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Concepts</span>

# Asymmetric Cryptography & Public-Key Infrastructure

<p class="lede">Asymmetric cryptography uses mathematically linked pairs of keys: a Public Key that can be shared freely with any endpoint, and a Private Key that must be kept secret by its owner. Asymmetric primitives solve the key-distribution problem, enable digital signatures for non-repudiation, and establish ephemeral keys for transport security.</p>

## Asymmetric Paradigm: Linked Key Pairs

Unlike symmetric ciphers which rely on a single shared key, asymmetric ciphers generate a key pair (<b>K<sub>pub</sub></b>, <b>K<sub>priv</sub></b>). Operations executed with one key can only be inverted or verified by the corresponding key in the pair.

<div class="diagram-frame">
  <img src="{{ '/assets/img/asymmetric-flow.svg' | relative_url }}" alt="Diagram showing asymmetric cryptography: encryption using public key, decryption using private key, signing using private key, verification using public key.">
  <p class="diagram-caption">Public and private keys have complementary, non-interchangeable roles</p>
</div>

### Three Distinct Operations

1. **Public-Key Encryption (HPKE / RSA-OAEP)**: The sender encrypts a short payload using the recipient's public key; only the recipient's private key can decrypt it.
2. **Digital Signatures (Ed25519 / RSA-PSS)**: The sender computes a signature over data using their private key; anyone holding the sender's public key can verify origin and integrity.
3. **Key Agreement (ECDHE / X25519)**: Peer endpoints combine their own private keys with each other's public keys to derive a matching shared secret.

## Operations Comparison Matrix

| Objective | Public Key Action | Private Key Action | Standard Protocol | Primary Output |
|---|---|---|---|---|
| **Confidentiality** (HPKE) | Encrypts payload / KEM encapsulation | Decrypts payload / KEM decapsulation | RFC 9180 (HPKE), RSA-OAEP | Unreadable ciphertext readable only by private key holder |
| **Integrity &amp; Authenticity** | Verifies signature tag | Generates digital signature tag | Ed25519 (RFC 8032), RSA-PSS, ECDSA | Non-repudiable proof of private key possession |
| **Key Agreement** | Exchanged with peer | Combined with peer public key | Ephemeral ECDH (X25519 / NIST P-256) | Shared symmetric secret key for bulk AEAD encryption |

## Can I Use a Private Key to Encrypt Data?

**No.** It is mathematically impossible to use a private key to encrypt data under any asymmetric algorithm.

A **Private Key is used for Digital Signing** (and for decrypting incoming data locked under its matching public key). Describing a digital signature as *"encrypting data with a private key"* is cryptographically inaccurate for three technical reasons:

1. **Signatures Leave Plaintext Intact**: Digital signing computes a separate signature tag file (*`payload.sig`*) over a message digest while leaving the original payload file (*`payload.txt`*) completely unencrypted and readable in cleartext.
2. **Signature Algorithms Do Not Possess Encryption Functions**: Signature algorithms (*Ed25519, ECDSA, RSA-PSS, FIPS 204 ML-DSA*) operate strictly on mathematical signature equations. They do not contain encryption functions and cannot transform plaintext into ciphertext.
3. **Asymmetric Encryption Standards Enforce Fixed Key Roles**: Asymmetric encryption standards (*RSA-OAEP, HPKE RFC 9180*) define encryption as locking data using a recipient's Public Key. Standardized padding routines (*RSA-OAEP*) cannot execute using a private key, and decryption APIs explicitly reject public keys.

### OpenSSL CLI Demonstrations

#### 1. Digital Signature: Plaintext Payload Remains 100% Unchanged

```bash
# 1. Create a plaintext payload file
echo "Confidential Payroll Data: $100,000" > payload.txt

# 2. Generate an RSA-3072 key pair for Alice (Signer)
openssl genrsa -out alice_priv.pem 3072
openssl rsa -in alice_priv.pem -pubout -out alice_pub.pem

# 3. Create a digital signature using Alice's private key
openssl dgst -sha256 -sign alice_priv.pem -out payload.sig payload.txt

# 4. VERIFY PLAINTEXT: The original payload remains unencrypted cleartext!
cat payload.txt
# Output: Confidential Payroll Data: $100,000  (NOT ENCRYPTED!)

# 5. Verify the signature tag using Alice's public key
openssl dgst -sha256 -verify alice_pub.pem -signature payload.sig payload.txt
# Output: Verified OK
```

#### 2. Asymmetric Encryption: Plaintext Is Transformed into Ciphertext

```bash
# 1. Generate an RSA-3072 key pair for Bob (Recipient)
openssl genrsa -out bob_priv.pem 3072
openssl rsa -in bob_priv.pem -pubout -out bob_pub.pem

# 2. Encrypt plaintext using Bob's PUBLIC key (RSA-OAEP)
openssl pkeyutl -encrypt -pubin -inkey bob_pub.pem -pkeyopt rsa_padding_mode:oaep \
  -in payload.txt -out payload.enc

# 3. VERIFY CIPHERTEXT: The file is now unreadable binary ciphertext!
xxd payload.enc | head -n 2
# Output: 00000000: 1df9 70ed 6063 0717 ffdc 16fc cc42 36c1  ..p.`c.......B6.

# 4. Decrypt using Bob's PRIVATE key
openssl pkeyutl -decrypt -inkey bob_priv.pem -pkeyopt rsa_padding_mode:oaep \
  -in payload.enc -out decrypted.txt
cat decrypted.txt
# Output: Confidential Payroll Data: $100,000
```

#### 3. Attempting Public Key Decryption Fails

```bash
# Attempting to "decrypt" using a Public Key fails immediately
openssl pkeyutl -decrypt -pubin -inkey bob_pub.pem -in payload.enc -out fail.txt
# Output Error: A private key is needed for this operation
# Error initializing context
```

## Comparative Analysis: RSA vs Elliptic Curve Cryptography (ECC)

| Dimension | RSA (Rivest–Shamir–Adleman) | ECC (Elliptic Curve Cryptography) | Target Engineering Guidance |
|---|---|---|---|
| **Key Agreement Standards** | Static Key Exchange (**DEPRECATED**) | ECDHE / X25519 | Always use Ephemeral Elliptic Curve Diffie-Hellman for Forward Secrecy. |
| **Mathematical Basis** | Prime Factorization (**N = p × q**) | Elliptic Curve Discrete Logarithm Problem (ECDLP) | ECC offers equivalent security at significantly smaller key sizes. |
| **NIST 128-bit Security Key Size** | **3,072 bits** | **256 bits** (NIST P-256 or Curve25519) | 256-bit ECC provides equivalent security to 3072-bit RSA with 12x smaller keys. |
| **NIST 256-bit Security Key Size** | **15,360 bits** | **512 bits** (NIST P-521) | RSA 15,360-bit keys are computationally unviable for high-throughput TLS. |
| **Signature Standards** | RSA-PSS (FIPS 186-5), PKCS#1 v1.5 (Legacy) | ECDSA (secp256k1/P-256), EdDSA (Ed25519) | Prefer Ed25519 for signature performance and deterministic nonce safety. |

<div class="diagram-frame">
  <img src="{{ '/assets/img/key-size-comparison.svg' | relative_url }}" alt="Bar chart comparing RSA and ECC key sizes needed for equivalent security strength: 3072-bit RSA equals 256-bit ECC.">
  <p class="diagram-caption">Key size growth: RSA key sizes scale exponentially, while ECC remains compact</p>
</div>

### Why Ed25519 (EdDSA) is Preferred for Modern Applications

Specified in **[RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)**, **Ed25519** offers major advantages over legacy ECDSA:
- **Deterministic Nonce Derivation**: Ed25519 derives its per-signature nonce deterministically from the private key and message hash, eliminating catastrophic ECDSA private key leaks caused by weak random number generators.
- **Side-Channel &amp; Timing Attack Resistance**: Implemented using complete addition formulas on Edwards curves without conditional branching.
