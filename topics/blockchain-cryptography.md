---
title: Blockchain & Distributed Ledger Cryptography
description: Cryptographic primitives in distributed ledgers, hash-linked block headers, Merkle trees, secp256k1 ECDSA, Schnorr signatures (BIP 340), BLS aggregation, and Zero-Knowledge Proofs (zk-SNARKs).
permalink: /topics/blockchain-cryptography/
last_verified: 2026-08-10
---

<span class="eyebrow">Cryptography / Distributed Systems</span>

# Blockchain & Distributed Ledger Cryptography

<p class="lede">Distributed ledgers don't eliminate trust — they redistribute it, replacing a single central authority with a different set of trust-minimized assumptions: honest-majority hashpower or validator stake, correctly implemented client software, and the security of the underlying cryptography. Blockchains coordinate hash-linked data chains, Merkle-tree transaction inclusion proofs, public-key digital signatures (secp256k1 / Ed25519), BLS signature aggregation, and Zero-Knowledge Proofs (ZK-SNARKs) into tamper-evidence and authorization primitives that *support* — rather than themselves enforce — the separate consensus protocols that let P2P nodes agree on ordering and finality without a central operator.</p>

## Cryptographic Layering in Blockchains

Distributed ledgers compose cryptographic primitives across four architectural layers:

<div class="diagram-frame">
  <img src="{{ '/assets/img/blockchain-cryptography-layers.svg' | relative_url }}" alt="Blockchain cryptography layers: Hash chains, Merkle trees, digital signatures, and zero-knowledge proofs.">
  <p class="diagram-caption">Blockchain Cryptography Layering: hash chains make tampering evident; Merkle trees enable light client proofs; signatures authorize state transitions</p>
</div>

## 1. Hash-Linked Chains: Tamper-Evident Ordering

Cryptography's role here is narrower than it might appear: hashing and signatures give you tamper-evident commitments and authorization over what a node holds, but they do not by themselves decide which chain of blocks is "the" chain when nodes disagree, or when a block is final — that ordering and finality guarantee comes from the **consensus protocol** (Nakamoto longest/heaviest-chain PoW, Casper FFG finality, Tendermint BFT, and so on) layered on top of the cryptographic primitives, not from the hashes and signatures alone.

The block-header linking formula below and the "80-byte header" figure are **Bitcoin-specific** — other chains define their own header layouts, and some (e.g., Ethereum post-Merge) do not have a literal proof-of-work `Nonce` field in the block header at all. Bitcoin blocks are linked sequentially by embedding the 256-bit cryptographic hash digest of block **n-1** into the header of block **n**:

<b>Block_Header<sub>n</sub> = H(Block_Header<sub>n-1</sub> ∥ Merkle_Root<sub>n</sub> ∥ Timestamp ∥ Nonce)</b>

Altering a single transaction in block **n-10** alters <b>Block_Header<sub>n-10</sub></b>, invalidating the hash pointer stored in block **n-9** and breaking the hash chain up to the current tip.

This makes silent tampering computationally impractical to conceal, but "immutability" here is probabilistic, not absolute: an attacker who controls a majority of hashpower (PoW) or bonded stake (PoS) can rebuild an alternative chain from that point forward — a 51% / majority attack — and communities have, in extreme cases, chosen to fork away from an already-published chain (e.g., Ethereum's 2016 DAO fork). Deeper confirmation depth raises the computational and economic cost of rewriting history; it does not make rewriting mathematically impossible.

## 2. Merkle Trees & Light Client Proofs (SPV)

To verify that transaction <b>T<sub>x</sub></b> is included in a block containing <b>N</b> transactions, a client requires only <b>log<sub>2</sub>(N)</b> sibling hashes (a **Merkle Audit Path**) rather than downloading the full block data:

<b>Proof Complexity = O(log<sub>2</sub> N) vs Full Block Download = O(N)</b>

Bitcoin light clients (SPV nodes) download Bitcoin's fixed **80-byte** block headers and verify transaction inclusion using Merkle inclusion proofs; the header size and format are specific to Bitcoin's block structure, not a general property of "SPV" as a technique — other chains' light-client header formats differ.

## 3. Transaction Authorization & Signature Schemes

| Blockchain Network | Signature Scheme | Elliptic Curve / Primitive | Primary Engineering Characteristics |
|---|---|---|---|
| **Bitcoin (Legacy)** | **ECDSA** | `secp256k1` | Requires DER encoding; strict deterministic nonce safety (**[RFC 6979](https://www.rfc-editor.org/rfc/rfc6979)**). |
| **Bitcoin (Taproot / BIP 340)** | **Schnorr Signatures** | `secp256k1` | [BIP 340](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki) specifies single-signer Schnorr signature verification only; its linear algebra is what *enables* separate multi-signature aggregation protocols such as MuSig2 ([BIP 327](https://github.com/bitcoin/bips/blob/master/bip-0327.mediawiki)). The Taproot output structure and MAST (Merkelized Alternative Script Trees) privacy/efficiency benefits are defined separately in [BIP 341](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki) (Taproot) and [BIP 342](https://github.com/bitcoin/bips/blob/master/bip-0342.mediawiki) (Tapscript) — BIP 340 supplies the signature scheme those BIPs build on, not the MAST construction itself. |
| **Ethereum (Consensus Layer)** | **BLS Signatures** | `BLS12-381` | Per-slot committee aggregators compress up to hundreds/thousands of validator attestation signatures into a single aggregate signature under Gasper (LMD-GHOST fork choice + Casper FFG finality). |
| **Ethereum (EVM Execution)** | **ECDSA** | `secp256k1` | Recovers public key from signature via recovery parameter `v`. Supports legacy `v in {27, 28}`, EIP-155 chain-id-encoded `v = chainId * 2 + 35` or `36`, and EIP-2718 / EIP-1559 typed transaction parity `yParity in {0, 1}` ([EIP-155](https://eips.ethereum.org/EIPS/eip-155)). |
| **Solana** | **Ed25519** | `Curve25519` | High-throughput signature verification with deterministic nonces. |
| **Polkadot** | **sr25519** (primary; Ed25519 &amp; ECDSA also supported) | `Ristretto25519` (Curve25519-based) | Schnorr signatures over the Ristretto group (Schnorrkel); used for BABE block-production VRF + signing. GRANDPA finality voting uses a separate key type. |

## 4. Advanced Cryptography: Zero-Knowledge Proofs (zk-SNARKs / STARKs)

Modern L2 scaling rollups (ZK-Rollups) and privacy blockchains use **Zero-Knowledge Proofs**:

1. **zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge)**: Enables a prover to demonstrate to a verifier that a computational statement is true (*e.g., "I know a private key that owns this UTXO and has sufficient balance"*) without revealing any private inputs.
2. **zk-STARKs (Zero-Knowledge Scalable Transparent Arguments of Knowledge)**: Zero-knowledge proofs relying on hash-based collision-resistant assumptions generally considered post-quantum candidate constructions without requiring a trusted setup ceremony.

## Blockchain Security Boundaries: What Cryptography Does and Doesn't Cover

It's worth being explicit about where cryptographic guarantees end and other assumptions begin, since blockchain systems are frequently described in ways that blur the two:

- **Consensus vs. cryptography, again**: To restate the point made above with the specific failure modes it implies — a hash chain and signatures give you tamper-evidence and authorization, but *which chain wins* and *when a block is final* are consensus-protocol questions. A bug or economic failure in the consensus layer (a liveness stall, a validator cartel, a poorly incentivized fork-choice rule) is not a cryptographic break, even though it can have the same practical impact (double-spends, reorgs) as one.
- **Probabilistic vs. deterministic finality**: Nakamoto-style PoW chains (Bitcoin) never give absolute finality — every confirmation only reduces the probability of a later reorg, asymptotically, and a sufficiently resourced attacker can in principle still reverse many confirmations. BFT-style finality gadgets (Ethereum's Casper FFG, Tendermint-based chains) instead provide **deterministic finality**: once a block is finalized under the protocol's rules, reverting it requires validators controlling at least the protocol's **safety threshold** — a fraction of total voting power, classically "fewer than 1/3 Byzantine," under which the algorithm mathematically guarantees two conflicting blocks can't both finalize — to violate that assumption. That safety threshold is a property of the consensus algorithm itself, distinct from **slashing**, which is a separate economic layer some (not all) BFT-PoS protocols add on top: an on-chain penalty (stake burned or confiscated) applied when a validator's protocol violation can be proven after the fact, making it economically costly to attempt what the safety threshold already makes cryptographically hard. Ethereum's Casper FFG specifically ties the two together via "accountable safety" (a safety violation is provably attributable to specific validators, who are then slashed); Bitcoin's Nakamoto consensus has neither a deterministic safety threshold nor a slashing mechanism. Don't conflate "the safety threshold was crossed" with "someone got slashed" — they're related but distinct guarantees, and which ones a given chain actually provides varies by protocol.
- **Chain-ID / domain separation and replay**: A transaction or signature valid on one chain can be replayable on another chain sharing the same signature scheme and address format unless the protocol explicitly binds signatures to a specific chain — this is exactly why Ethereum's [EIP-155](https://eips.ethereum.org/EIPS/eip-155) (referenced in the table above) encodes the chain ID into the signed transaction hash: without it, a transaction signed for mainnet could be replayed verbatim on a fork or testnet sharing the same account. This is a protocol-level domain-separation problem, not something the signature algorithm itself solves.
- **Bridge and oracle risks**: Cross-chain bridges and price/data oracles sit outside the cryptographic guarantees of any single chain — a bridge's security reduces to whatever mechanism it uses to attest that an event happened on the source chain (a federated multisig, a light-client proof, an optimistic fraud-proof window), and that mechanism's trust assumptions are frequently much weaker than the underlying chains' consensus security. The underlying reason is structural: bridges and oracles concentrate value — often holding the locked collateral backing assets circulating on multiple chains — while inheriting security from whatever mechanism attests to off-chain or cross-chain state, which is frequently a smaller, differently-trusted validator or signer set than the base-layer consensus and cryptography this page covers.
- **Data availability**: A validity proof (including a ZK proof) can confirm that a state transition was computed correctly without confirming that the underlying transaction *data* was actually published anywhere accessible — if a rollup operator withholds the data behind a valid proof, users can't reconstruct their own account state or exit the system even though the proof itself is sound. This is why rollup designs distinguish **data availability** (is the data published and retrievable?) as a separate property from **validity** (was the computation correct?), with different constructions (on-chain calldata, dedicated DA layers, data availability sampling) addressing it.
- **Zero-knowledge proof assumptions**: some widely deployed zk-SNARK systems (Groth16-style circuit-specific constructions, used by Zcash and many others; also universal-but-still-trusted setups like PLONK's) have soundness that depends on a **trusted setup ceremony** (a one-time generation of public parameters that is secure only if at least one participant destroyed their secret "toxic waste" — an assumption external to the proof system's math itself), on specific pairing-friendly curve choices, and on the correctness of the circuit compiler translating the claimed statement into the arithmetic circuit actually being proven. zk-STARKs avoid the trusted-setup assumption (relying on collision-resistant hashes instead) at the cost of larger proof sizes. In both cases, "the proof verified" is a statement about the circuit that was proven, not an independent guarantee that the circuit itself correctly encodes the intended real-world statement — a bug in circuit design is a bug a valid proof will not catch.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Blockchain Cryptography Summary</strong>
    <ul>
      <li><strong>Hash Chains &amp; Tamper-Evidence</strong>: Embedding block header hashes <code>H(Block<sub>n-1</sub>)</code> makes silent history-rewriting computationally impractical to conceal — not impossible, since a majority-hashpower/stake attacker or a community hard fork can still alter it.</li>
      <li><strong>Merkle SPV Proofs</strong>: Light clients verify transaction inclusion in <code>O(log₂ N)</code> time without downloading full blocks.</li>
      <li><strong>Signature Schemes</strong>: Bitcoin uses secp256k1 ECDSA and single-signer Schnorr (BIP 340), with aggregation added separately via MuSig2/BIP 327; Ethereum consensus uses BLS12-381 signature aggregation; Polkadot's primary scheme is sr25519, not Ed25519.</li>
    </ul>
  </div>
</div>

## Primary References

- **Bitcoin BIP 340**: *Schnorr Signatures for secp256k1* — [Bitcoin BIP 340 Specification](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)
- **Bitcoin BIP 327**: *MuSig2 for BIP340-compatible Multi-Signatures* — [Bitcoin BIP 327 Specification](https://github.com/bitcoin/bips/blob/master/bip-0327.mediawiki)
- **Bitcoin BIP 341 / BIP 342**: *Taproot: SegWit version 1 spending rules / Validation of Taproot Scripts (Tapscript)* — [BIP 341](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki), [BIP 342](https://github.com/bitcoin/bips/blob/master/bip-0342.mediawiki)
- **Ethereum EIP-155**: *Simple Replay Attack Protection* — [EIP-155 Specification](https://eips.ethereum.org/EIPS/eip-155)
- **Polkadot Cryptography**: *Schnorrkel sr25519 Signatures over Ristretto25519* — [Polkadot Host Specification](https://spec.polkadot.network/#sect-cryptography)
- **STARKs Specification**: *Scalable, Transparent, and Post-Quantum Secure Computational Integrity* — [IACR Cryptology ePrint 2018/046](https://eprint.iacr.org/2018/046)
- **BLS Signatures Draft**: *BLS Signatures IETF CFRG Draft (Work in Progress — Not an IETF Standard)* — [draft-irtf-cfrg-bls-signature-07](https://datatracker.ietf.org/doc/draft-irtf-cfrg-bls-signature/)
