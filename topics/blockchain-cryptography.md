---
title: Blockchain Cryptography
description: Hash chains, Merkle trees, and transaction signing — the cryptography actually underneath a blockchain, without the hype.
permalink: /topics/blockchain-cryptography/
---

<span class="eyebrow">Cryptography / Applied Cryptography / Deep Dive</span>

# Blockchain Cryptography

<p class="lede">Strip away the terminology, and a blockchain is a specific combination of three primitives — <a href="{{ '/topics/hash-functions-macs/' | relative_url }}">hash functions</a>, <a href="{{ '/topics/digital-signatures/' | relative_url }}">digital signatures</a>, and Merkle trees (a structure built entirely out of hashing) — arranged to let mutually distrusting parties agree on a shared, tamper-evident history without a central authority.</p>

## The chain part: linking blocks by hash

Each block contains the hash of the *previous* block's header, alongside its own data. That single link has a big consequence: changing anything in block 100 changes block 100's hash — via the [avalanche effect]({{ '/topics/hash-functions-macs/' | relative_url }}#what-a-cryptographic-hash-function-guarantees) covered under Hash Functions — which changes the "previous hash" field stored in block 101, which changes block 101's hash, and so on through every block since. Altering old history isn't mathematically impossible, but it means recomputing every single block after the tampered one, which (combined with proof-of-work or proof-of-stake, outside the scope here) is what makes it economically impractical rather than cryptographically impossible.

## The transactions part: Merkle trees

Each block needs to commit to potentially thousands of transactions without storing all of them directly in the header that gets hashed. A **Merkle tree** solves this by hashing transactions in pairs, repeatedly, up to a single root hash:

<div class="diagram-frame">
  <img src="{{ '/assets/img/merkle-tree.svg' | relative_url }}" alt="Diagram of a Merkle tree: four transactions are each hashed, the resulting hashes are combined and hashed in pairs, and those results are combined into a single Merkle Root stored in the block header. Changing any one transaction changes its hash, which changes every hash above it up to the root." >
  <p class="diagram-caption">One root hash commits to every transaction beneath it, without storing them all in the header</p>
</div>

This gives two useful properties: the block header only needs to store one small, fixed-size hash no matter how many transactions are in the block, and it's possible to prove a specific transaction is included in a block by revealing only the handful of sibling hashes along its path to the root (a "Merkle proof") — without needing every other transaction in the block at all.

## The ownership part: signing transactions

A transaction that says "send funds from address A to address B" is only valid if it's signed by the private key controlling address A — exactly the [digital signature]({{ '/topics/digital-signatures/' | relative_url }}) pattern, with one specific detail: in most blockchains (Bitcoin, Ethereum), an **address is derived directly from a public key** (typically via a hash of it), rather than being assigned by any registrar. There's no certificate authority in this picture at all — anyone can generate a key pair offline and that key pair's derived address instantly "exists" as a valid destination, with no registration step.

**ECDSA** (Bitcoin, and Ethereum historically) and increasingly **Ed25519/Schnorr-based schemes** (newer chains, and Bitcoin's Taproot upgrade) are the signature algorithms in use — which means the [nonce-reuse trap]({{ '/topics/digital-signatures/' | relative_url }}#where-real-signature-schemes-go-wrong-the-nonce-trap) covered under Digital Signatures is not theoretical here: poor random number generation in several early Android Bitcoin wallets led to real, direct theft of funds through exactly that mechanism.

## What's deliberately left out here

Consensus mechanisms (proof-of-work, proof-of-stake), tokenomics, smart contract execution semantics, and the broader "Web3" ecosystem are a different, much larger subject from the cryptography itself — the scope here stays on the actual cryptographic primitives, a small, well-understood slice of what people usually mean by "blockchain."

## Common pitfalls

- **Weak randomness during signing** — see the nonce-reuse note above; this has caused real, irreversible fund losses.
- **Address reuse** — reusing the same address repeatedly links transactions together publicly (blockchains are typically fully public ledgers), a privacy leak distinct from any cryptographic weakness.
- **Confusing "hard to tamper with" with "anonymous"** — signatures and hashes provide integrity and authenticity, not anonymity; public blockchains are pseudonymous at best, and addresses are often de-anonymizable through transaction pattern analysis.
- **Losing the private key** — with no central authority, there is no password reset. The key *is* the funds; losing it is unrecoverable by design.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p>The original <a href="https://bitcoin.org/bitcoin.pdf"><strong>Bitcoin whitepaper</strong></a> (Nakamoto, 2008) describes the hash-chain and Merkle tree structure directly. <strong><a href="https://csrc.nist.gov/pubs/fips/186-5/final">FIPS 186-5</a></strong> covers ECDSA, the signature scheme Bitcoin and early Ethereum both use.</p>
</div>

## Where this fits

Nothing here is a new cryptographic primitive — it's [hash functions]({{ '/topics/hash-functions-macs/' | relative_url }}), [digital signatures]({{ '/topics/digital-signatures/' | relative_url }}), and [asymmetric key pairs]({{ '/topics/asymmetric-cryptography/' | relative_url }}) arranged into a specific structure. Understanding those three pages is most of the way to understanding what's actually happening underneath any blockchain, independent of whatever it's being used for.
