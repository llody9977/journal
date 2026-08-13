---
title: Federated Learning & Privacy-Preserving Machine Learning
description: Comprehensive technical guide to Federated Learning (FL), decentralized edge model training, Secure Aggregation (SMPC), Differential Privacy noise injection, and Model Poisoning / Membership Inference defenses.
permalink: /topics/federated-learning-privacy/
last_verified: 2026-08-13
---

<span class="eyebrow">AI & LLM Security / Privacy-Preserving ML</span>

# Federated Learning & Privacy-Preserving Machine Learning

<p class="lede">Centralizing sensitive user datasets for machine learning training creates severe privacy and regulatory compliance risks. Federated Learning (FL) shifts the training paradigm: instead of bringing data to the model, FL brings the model to the data. Edge devices compute local gradient updates on private datasets, which are combined via Secure Aggregation (SecAgg) and Differential Privacy without raw data ever leaving the client device. However, securing FL requires defending against model poisoning attacks and membership inference exploits.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/federated-learning-privacy.svg' | relative_url }}" alt="Federated Learning diagram showing edge client model training, Secure Aggregation, Differential Privacy noise injection, and Central Server global model update.">
  <p class="diagram-caption">Federated Learning Architecture: Edge Local Training &leftrightarrow; Secure Aggregation (SecAgg/SMPC) &leftrightarrow; Global Model Broadcast</p>
</div>

## Federated Learning Architecture & Training Lifecycle

Federated Learning replaces centralized data collection with a 4-step iterative training loop:

1. **Global Model Broadcast**: The central server broadcasts current global model weights $W_t$ to selected participating edge clients (*mobile phones, IoT nodes, hospital servers*).
2. **Local Edge Training**: Each client trains the model on its private local dataset $D_k$ for a fixed number of epochs, computing updated local weights $W_t^k$.
3. **Secure Weight Aggregation**: Clients send encrypted local model updates back to the central server using **Secure Aggregation (SecAgg)** protocol based on Secure Multi-Party Computation (SMPC). The server computes the aggregate sum ($\sum W_t^k$) without inspecting individual client updates.
4. **Global Model Update**: The central server updates the master model weights $W_{t+1}$ using Federated Averaging (**FedAvg**) and redistributes the updated model.

## Cryptographic & Differential Privacy Safeguards

To prevent gradient inversion attacks (*where an adversary reconstructs raw training images or text from raw gradient updates*), FL integrates dual privacy safeguards:

| Privacy Safeguard | Cryptographic / Mathematical Primitive | Security Guarantee Provided |
|---|---|---|
| **Secure Aggregation (SecAgg)** | Secret-Sharing &amp; Homomorphic Encryption (SMPC). | Central server learns only the combined sum of client gradients; zero visibility into individual client updates. |
| **Local Differential Privacy (LDP)** | Injects bounded noise ($\varepsilon, \delta$) into client gradients before transmission. | Mathematically bounds the ability of an adversary to infer whether a specific record was present in a client's dataset. |
| **Central Differential Privacy (CDP)** | Server adds noise to global aggregated weights before broadcasting. | Bounds membership inference attacks against the published global model weights. |

## Adversarial Attacks & Defense Countermeasures

Federated Learning introduces unique decentralized attack vectors:

- **Model Poisoning & Sybil Attacks**: Compromised clients submit corrupted gradient updates designed to derail global model convergence or inject backdoor triggers.
  - *Defense*: Deploy robust aggregation algorithms (**Krum**, **Trimmed Mean**, **Bruma**) and enforce Bounded Norm Clipping to filter out outlier gradient submissions.
- **Membership Inference Attacks**: Adversaries query the global model to determine whether a target individual's private data was used in training.
  - *Defense*: Enforce strict Central Differential Privacy ($\varepsilon \le 1.0$) during model aggregation.

### Performance Trade-Offs & Limitations
Federated Learning imposes severe operational and theoretical constraints:
- **Privacy-Utility Trade-Off**: The Differential Privacy noise parameter ($\varepsilon$) operates on an inverse curve with model utility. Stricter privacy bounds (lower $\varepsilon$) mathematically guarantee higher privacy but proportionally degrade model accuracy.
- **Aggregation Overhead**: Secure Multi-Party Computation (SMPC) used in SecAgg requires extensive cryptographic overhead, dramatically increasing network bandwidth consumption and latency across participating edge clients.

## Essential Federated Learning Diagnostic Checklist

When auditing a privacy-preserving machine learning deployment, evaluate these 6 criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Zero Raw Data Transmission** | Is raw training data retained strictly on local client devices without transmission to central servers? | Edge client code &amp; network traffic packet captures. |
| **Secure Aggregation Protocol** | Is Secure Aggregation (SecAgg) enforced using cryptographic SMPC secret-sharing? | Server aggregation codebase &amp; protocol specs. |
| **Local Differential Privacy** | Are local gradient updates obfuscated using calibrated Differential Privacy noise ($\varepsilon, \delta$)? | Gradient clipping &amp; noise addition code configs. |
| **Outlier Gradient Clipping** | Are client gradient submissions clipped using bounded norm thresholds to prevent poisoning? | Server FedAvg implementation parameters. |
| **Robust Aggregation Functions** | Does the server employ robust aggregation (Krum / Trimmed Mean) to withstand malicious clients? | Aggregation algorithm configuration files. |
| **OIDC Client Authentication** | Are participating edge clients authenticated using short-lived OIDC identity tokens to prevent Sybil node creation? | Client authentication gateway logs. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Federated Learning trains machine learning models on edge devices without centralizing private data. Protect gradient updates using Secure Aggregation (SecAgg) and Differential Privacy, and defend against model poisoning via robust aggregation algorithms like Krum.</p>
</div>

## Primary references

- **McMahan et al. (2017)**: *Communication-Efficient Learning of Deep Networks from Decentralized Data (FedAvg)* — [arXiv:1602.05629](https://arxiv.org/abs/1602.05629)
- **NIST SP 800-226**: *Guidelines for Evaluating Privacy-Preserving Machine Learning Systems* — [NIST CSRC](https://csrc.nist.gov/publications)
