---
title: Blockchain & Distributed Ledger Cryptography
description: Cryptographic primitives in distributed ledgers, hash-linked block headers, Merkle trees, secp256k1 ECDSA, Schnorr signatures (BIP 340), BLS aggregation, and Zero-Knowledge Proofs (zk-SNARKs).
permalink: /topics/blockchain-cryptography/
last_verified: 2026-08-08
---

<span class="eyebrow">Cryptography / Distributed Systems</span>

# Blockchain & Distributed Ledger Cryptography

<p class="lede">Distributed ledgers eliminate central trust authorities by combining cryptographic primitives into immutability and authorization engines. Blockchains coordinate hash-linked data chains, Merkle-tree transaction inclusion proofs, public-key digital signatures (secp256k1 / Ed25519), BLS signature aggregation, and Zero-Knowledge Proofs (ZK-SNARKs) to enforce consensus across untrusted P2P nodes.</p>

## Cryptographic Layering in Blockchains

Distributed ledgers compose cryptographic primitives across four architectural layers:

<div class="diagram-frame">
  <img src="{{ '/assets/img/blockchain-cryptography-layers.svg' | relative_url }}" alt="Blockchain cryptography layers: Hash chains, Merkle trees, digital signatures, and zero-knowledge proofs.">
  <p class="diagram-caption">Blockchain Cryptography Layering: hash chains enforce immutability; Merkle trees enable light client proofs; signatures authorize state transitions</p>
</div>

## 1. Hash-Linked Chains: Immutability Enforcers

Blocks are linked together sequentially by embedding the 256-bit cryptographic hash digest of block **n-1** into the header of block **n**:

<b>Block_Header<sub>n</sub> = H(Block_Header<sub>n-1</sub> ∥ Merkle_Root<sub>n</sub> ∥ Timestamp ∥ Nonce)</b>

Altering a single transaction in block **n-10** alters <b>Block_Header<sub>n-10</sub></b>, invalidating the hash pointer stored in block **n-9** and breaking the hash chain up to the current tip.

## 2. Merkle Trees & Light Client Proofs (SPV)

To verify that transaction <b>T<sub>x</sub></b> is included in a block containing <b>N</b> transactions, a client requires only <b>log<sub>2</sub>(N)</b> sibling hashes (a **Merkle Audit Path**) rather than downloading the full block data:

<b>Proof Complexity = O(log<sub>2</sub> N) vs Full Block Download = O(N)</b>

Light clients (SPV nodes) download 80-byte block headers and verify transaction inclusion using Merkle inclusion proofs.

## 3. Transaction Authorization & Signature Schemes

| Blockchain Network | Signature Scheme | Elliptic Curve / Primitive | Primary Engineering Characteristics |
|---|---|---|---|
| **Bitcoin (Legacy)** | **ECDSA** | `secp256k1` | Requires DER encoding; strict deterministic nonce safety (**[RFC 6979](https://www.rfc-editor.org/rfc/rfc6979)**). |
| **Bitcoin (Taproot / BIP 340)** | **Schnorr Signatures** | `secp256k1` | Linearly additive; enables signature aggregation and Taproot MAST privacy ([BIP 340](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)). |
| **Ethereum (Consensus Layer)** | **BLS Signatures** | `BLS12-381` | Supports aggregation of thousands of validator signatures into 1 signature. |
| **Ethereum (EVM Execution)** | **ECDSA** | `secp256k1` | Recovers public key from signature via recovery parameter `v in {27, 28}`. |
| **Solana &amp; Polkadot** | **Ed25519** | `Curve25519` | High-throughput signature verification with deterministic nonces. |

## 4. Advanced Cryptography: Zero-Knowledge Proofs (zk-SNARKs / STARKs)

Modern L2 scaling rollups (ZK-Rollups) and privacy blockchains use **Zero-Knowledge Proofs**:

1. **zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge)**: Enables a prover to demonstrate to a verifier that a computational statement is true (*e.g., "I know a private key that owns this UTXO and has sufficient balance"*) without revealing any private inputs.
2. **zk-STARKs (Zero-Knowledge Scalable Transparent Arguments of Knowledge)**: Quantum-resistant zero-knowledge proofs relying purely on hash functions without requiring a trusted setup ceremony.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Blockchain Cryptography Summary</strong>
    <ul>
      <li><strong>Hash Chains &amp; Immutability</strong>: Embedding block header hashes <code>H(Block<sub>n-1</sub>)</code> creates an immutable sequential ledger.</li>
      <li><strong>Merkle SPV Proofs</strong>: Light clients verify transaction inclusion in <code>O(log₂ N)</code> time without downloading full blocks.</li>
      <li><strong>Signature Schemes</strong>: Bitcoin uses secp256k1 ECDSA and Schnorr (BIP 340); Ethereum consensus uses BLS12-381 signature aggregation.</li>
    </ul>
  </div>
</div>

## Primary References

- **Bitcoin BIP 340**: *Schnorr Signatures for secp256k1* — [Bitcoin BIP 340 Specification](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)
- **BLS Signatures Draft**: *BLS Signatures IETF Draft Standard* — [draft-irtf-cfrg-bls-signature-05](https://datatracker.ietf.org/doc/draft-irtf-cfrg-bls-signature/)
