---
title: Federated Learning & Privacy-Preserving Machine Learning
description: Cross-device and cross-silo federated learning, the FedAvg loop, what secure aggregation and differential privacy each assume and guarantee, and why robust aggregation conflicts with plain SecAgg.
permalink: /topics/federated-learning-privacy/
last_verified: 2026-08-15
---

<span class="eyebrow">AI & LLM Security / Privacy-Preserving ML</span>

# Federated Learning & Privacy-Preserving Machine Learning

<p class="lede">Centralizing user data for training concentrates both privacy risk and regulatory exposure in one place. Federated Learning (FL) inverts the arrangement: the model goes to the data. Clients train locally and send only model updates, which are combined into a new global model. That removes the central dataset, but it does not by itself remove the privacy problem — updates leak information about the data that produced them — and it introduces a new one, because the participants computing those updates are no longer trusted. Secure aggregation and differential privacy address the first; robust aggregation addresses the second, and the two pull against each other.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/federated-learning-privacy.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the federated learning architecture diagram at full size">
    <img src="{{ '/assets/img/federated-learning-privacy.svg' | relative_url }}" alt="Three panels: decentralized edge client training with local data staying on device and Gaussian noise added for differential privacy; secure aggregation where the server sees only the aggregate sum, with its honest-but-curious and non-collusion assumptions stated; and defenses against poisoning and membership inference, noting the tension between robust aggregation and secure aggregation.">
  </a>
  <p class="diagram-caption">Federated learning: local training, secure aggregation of updates, and the poisoning and inference defenses layered over it</p>
</div>

## Two regimes, not one

"Federated learning" covers two settings whose threat models and engineering constraints differ enough that a control appropriate to one is often wrong for the other.

| | **Cross-device** | **Cross-silo** |
|---|---|---|
| **Participants** | Up to millions of consumer devices. | A handful to a few hundred organizations. |
| **Availability** | Intermittent; clients drop mid-round routinely. | Reliable, usually always-on infrastructure. |
| **Round participation** | A small sampled subset each round; a client may never be selected twice. | Typically all participants, every round. |
| **Client state** | Stateless — no assumption that a client returns. | Stateful across rounds. |
| **Identity** | Weak. Devices generally cannot be enrolled in an organizational trust domain. | Strong. Each participant is a known, contracted legal entity. |
| **Dominant threat** | Many cheap, individually weak malicious clients. | Few clients, but each holds a large data share and real incentives. |

Dropout recovery machinery matters in the cross-device setting and is close to irrelevant in cross-silo. Client authentication is practical in cross-silo and largely unavailable cross-device. Read every claim below against the regime you are in.

## The training loop

Federated Averaging (FedAvg) iterates four steps. Writing `W_t` for the global weights at round `t` and `D_k` for client `k`'s local dataset:

1. **Broadcast** — the server sends `W_t` to the clients selected for this round.
2. **Local training** — each client trains on its own `D_k` for a fixed number of local epochs, producing `W_t^k`.
3. **Aggregation** — clients return their updates, which the server combines into a single weighted sum.
4. **Update** — the server forms `W_(t+1)` from that sum and the round repeats.

Raw data never leaves the client. Model updates do, and a gradient or weight delta is a function of the training data — gradient inversion attacks reconstruct recognizable training images and text from unprotected updates. Step 3 is therefore where the privacy engineering has to happen.

## Secure aggregation and differential privacy

These are different tools solving different halves of the problem. Neither replaces the other.

| Safeguard | Mechanism | What it guarantees | What it assumes |
|---|---|---|---|
| **Secure aggregation (SecAgg)** | Clients apply pairwise masks derived from key agreement, which cancel when the updates are summed; secret sharing lets the server recover the sum when clients drop out. | The server learns the aggregate sum and nothing about any individual update. | An honest-but-curious server, and no collusion above the protocol's threshold. It hides individuals, not the sum. |
| **Local differential privacy** | Each client clips its update to a bounded norm, then adds calibrated Gaussian noise before sending it. | A bounded (&epsilon;, &delta;) limit on what any observer — including the server — can infer about one record, independent of the aggregation protocol. | Correct clipping and noise calibration on every client. Utility cost is highest here. |
| **Central differential privacy** | The server adds calibrated noise to the aggregate before publishing the new global model. | A bounded limit on membership inference against the published model. | A trusted server, since it sees the clean aggregate before adding noise. |

Two things follow that are easy to miss:

- **SecAgg is not differential privacy.** It hides who contributed what, while the aggregate itself is still a function of everyone's data. With a small cohort, inversion against the aggregate remains feasible. The DP layer is what bounds that, and it must be chosen for the regime — local DP where the server is untrusted, central DP where it is.
- **&epsilon; has no universal safe value.** Deployed systems span a wide range and NIST's guidance deliberately declines to set a threshold, so treat any specific figure as a local policy decision that must be recorded with its justification, not as a standard. Tightening &epsilon; increases privacy and costs accuracy; the exchange rate is model- and task-specific, not proportional.

For the broader family of privacy-enhancing technologies these sit within — differential privacy, secure multi-party computation, homomorphic encryption, and zero-knowledge proofs as distinct primitives — see [Privacy by Design & Privacy-Enhancing Technologies]({{ '/topics/privacy-by-design-pets/' | relative_url }}).

## Poisoning, and the conflict it creates

The participants are untrusted, which is the structural difference from centralized training.

- **Model poisoning and Sybil attacks** — malicious clients submit crafted updates to degrade convergence or implant a backdoor trigger. Cross-device is the harder case: identities are cheap.
  - *Defenses*: bounded norm clipping applied to every submission, and robust aggregation rules — **Krum**, **Trimmed Mean**, and **Bulyan**, which composes a Krum-style selection stage with coordinate-wise trimming.
- **Membership inference** — an adversary queries the global model to determine whether a particular record was in the training data.
  - *Defense*: differential privacy at the layer matching the trust model, with the privacy budget tracked across rounds rather than per round.

**The conflict.** Plain SecAgg is designed so the server sees only the sum. Krum, Trimmed Mean, and Bulyan all work by ranking or trimming *individual* updates. Deploying both naively is contradictory: whatever lets the server rank submissions also lets it inspect them. Reconciling them requires a protocol built for it — verifiable or robust secure aggregation schemes that compute the robust statistic inside the protected computation, or norm bounds enforced cryptographically on each masked submission rather than by inspection. A deployment claiming both should be asked which scheme it uses.

Client authentication helps in cross-silo, where participants are known entities: short-lived OIDC tokens raise the cost of registering extra identities and bound how many one principal can hold. It does not *prevent* Sybil attacks — one authenticated principal can still control many enrolled devices — and in cross-device settings it is usually unavailable in the first place.

## Operational cost

- **Communication.** SecAgg's masking and secret-sharing rounds add bandwidth and latency on top of transmitting the updates themselves, which is the binding constraint on intermittently-connected devices.
- **Dropout handling.** Cross-device clients disappear mid-round. Recovery machinery exists precisely for that, and it is where much of the protocol complexity lives.
- **Heterogeneity.** Client datasets are not identically distributed, so FedAvg converges more slowly and less predictably than centralized training on the pooled equivalent.

## Diagnostic checklist

When auditing a privacy-preserving machine learning deployment, evaluate these six criteria:

| Diagnostic area | Evaluation question | Audit evidence |
|---|---|---|
| **Regime and threat model** | Is the deployment cross-device or cross-silo, and are the server trust assumptions written down? | Architecture records &amp; documented trust boundaries. |
| **Data locality** | Does raw training data stay on the client, verified rather than assumed? | Client code review &amp; network captures. |
| **Aggregation protection** | Is secure aggregation in use, and what does it assume about server honesty and collusion? | Aggregation implementation &amp; protocol specification. |
| **Privacy budget** | Is noise calibrated at the layer matching the trust model, with &epsilon; accounted across rounds and its value justified? | Clipping and noise configuration &amp; budget accounting records. |
| **Poisoning defense** | Are norm bounds enforced on every submission, and does the robust aggregation rule coexist with secure aggregation by design? | Aggregation configuration &amp; the scheme reconciling the two. |
| **Participant identity** | In cross-silo, are participants authenticated with short-lived credentials, and is the residual Sybil exposure recorded? | Authentication gateway logs &amp; risk register entry. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Federated learning removes the central dataset, not the leakage — updates still encode the data. Secure aggregation hides individual updates from an honest-but-curious server; differential privacy bounds what the aggregate reveals; they solve different halves. Robust aggregation like Krum or Bulyan needs to rank individual updates, which plain SecAgg exists to prevent, so any deployment claiming both must name the scheme that reconciles them.</p>
</div>

## Primary references

- **[Communication-Efficient Learning of Deep Networks from Decentralized Data](https://arxiv.org/abs/1602.05629)** — McMahan et al., 2017. Verified the FedAvg loop, local epochs, and client sampling.
- **[Practical Secure Aggregation for Federated Learning on User-Held Data](https://arxiv.org/abs/1611.04482)** — Bonawitz et al. Verified the pairwise masking and secret-sharing construction, its dropout recovery, and its honest-but-curious threat model.
- **[NIST SP 800-226: Guidelines for Evaluating Differential Privacy Guarantees](https://doi.org/10.6028/NIST.SP.800-226)** — final, March 2025. Verified the local and central differential privacy distinction and that no universal &epsilon; threshold is specified.
