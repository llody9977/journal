---
title: Blockchain Cryptography
description: Hash chains, Merkle trees, and transaction signing — the cryptography actually underneath a blockchain, without the hype.
permalink: /topics/blockchain-cryptography/
last_verified: 2026-08-05
---

<span class="eyebrow">Cryptography / Applied</span>

# Blockchain Cryptography

<p class="lede">For my notes, hashes, signatures, and Merkle trees explain how a blockchain commits to data and authorizes transactions. They do not make mutually distrusting nodes agree by themselves. Consensus rules, network assumptions, incentives, and the fork-choice mechanism are essential to deciding which history is accepted.</p>

## The chain part: linking blocks by hash

Each block contains a commitment to an earlier block, commonly the previous block header's hash. Changing old data changes that commitment and makes the later history inconsistent. An attacker would need to produce an alternative history that satisfies the network's consensus and finality rules and then get it accepted. The required work and probability differ sharply between proof-of-work, proof-of-stake, permissioned, and other designs; the hash link alone does not make rewriting history economically impossible.

## The transactions part: Merkle trees

Each block needs to commit to potentially thousands of transactions without storing all of them directly in the header that gets hashed. A **Merkle tree** solves this by hashing transactions in pairs, repeatedly, up to a single root hash:

<div class="diagram-frame">
  <img src="{{ '/assets/img/merkle-tree.svg' | relative_url }}" alt="Diagram of a Merkle tree: four transactions are each hashed, the resulting hashes are combined and hashed in pairs, and those results are combined into a single Merkle Root stored in the block header. Changing any one transaction changes its hash, which changes every hash above it up to the root." >
  <p class="diagram-caption">One root hash commits to every transaction beneath it, without storing them all in the header</p>
</div>

This gives two useful properties: the block header only needs to store one small, fixed-size hash no matter how many transactions are in the block, and it's possible to prove a specific transaction is included in a block by revealing only the handful of sibling hashes along its path to the root (a "Merkle proof") — without needing every other transaction in the block at all.

## The ownership part: signing transactions

A transaction is valid only when it satisfies that blockchain's authorization rules. In a simple externally owned account, this normally includes a signature from the required private key. Bitcoin address types and Ethereum externally owned accounts derive identifiers through different transformations of public keys or scripts; they are not X.509 identities and no certificate authority assigns them. Smart-contract wallets, multisignature scripts, and account-abstraction designs can impose more complex authorization rules.

Bitcoin's legacy transaction signatures and Ethereum accounts use **ECDSA over secp256k1** today; Bitcoin Taproot adds Schnorr signatures over the same curve. Other chains use Ed25519 and other schemes. This makes the [nonce-reuse trap]({{ '/topics/digital-signatures/' | relative_url }}#where-real-signature-schemes-go-wrong-the-nonce-trap) operationally relevant: bad signing randomness has caused real cryptocurrency key recovery and theft.

## What's deliberately left out here

Consensus mechanisms, network/finality assumptions, token economics, and smart-contract execution are outside this page's scope, but not optional parts of a blockchain. This page covers only the cryptographic building blocks.

## Common pitfalls

- **Weak randomness during signing** — see the nonce-reuse note above; this has caused real, irreversible fund losses.
- **Address reuse** — reusing the same address repeatedly links transactions together publicly (blockchains are typically fully public ledgers), a privacy leak distinct from any cryptographic weakness.
- **Confusing "hard to tamper with" with "anonymous"** — signatures and hashes provide integrity and authenticity, not anonymity; public blockchains are pseudonymous at best, and addresses are often de-anonymizable through transaction pattern analysis.
- **Losing the private key** — a single-key self-custody account may become unrecoverable if its only key is lost. Custodial, multisignature, social-recovery, and smart-contract designs can provide different recovery paths, each with its own trust tradeoffs.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p>The original <a href="https://bitcoin.org/bitcoin.pdf"><strong>Bitcoin whitepaper</strong></a> describes the hash chain, Merkle tree, proof-of-work, and network consensus. <strong><a href="https://csrc.nist.gov/pubs/fips/186-5/final">FIPS 186-5</a></strong> specifies ECDSA, but Bitcoin and Ethereum use the <code>secp256k1</code> curve from <a href="https://www.secg.org/sec2-v2.pdf">SEC 2</a>, not a NIST-recommended curve in SP 800-186.</p>
</div>
