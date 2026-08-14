---
title: AI & LLM Threat Frameworks & Risk Management
description: What NIST AI RMF 1.0, the OWASP Top 10 for LLM Applications, and MITRE ATLAS each cover, how their scopes differ, edition currency, and a model retirement working rule.
permalink: /topics/ai-risk-management/
last_verified: 2026-08-14
---

<span class="eyebrow">AI & LLM Security / Risk & Governance</span>

# AI & LLM Threat Frameworks & Risk Management

<p class="lede">Artificial Intelligence (AI) and Large Language Model (LLM) systems shift where the security boundary sits. A conventional application separates instructions from data structurally, at a parser. An LLM does not: system instructions, user input, retrieved documents, and tool output arrive as one token stream, and the model infers its next action probabilistically from all of it. Three frameworks are commonly stacked over that problem — NIST AI RMF 1.0 for governance structure, the OWASP Top 10 for LLM Applications for ranked application risk, and MITRE ATLAS for observed adversary behavior. They answer different questions, and none substitutes for another.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/ai-risk-management.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the AI risk framework comparison diagram at full size">
    <img src="{{ '/assets/img/ai-risk-management.svg' | relative_url }}" alt="Three panels comparing what each AI risk framework covers: NIST AI RMF 1.0 governance functions, the OWASP Top 10 for LLM Applications 2025 entries, and the MITRE ATLAS tactic progression, with a footer noting the OWASP list is versioned.">
  </a>
  <p class="diagram-caption">Three frameworks, three questions: how to govern (NIST AI RMF 1.0), what goes wrong (OWASP Top 10 for LLM Applications), and what has been done (MITRE ATLAS)</p>
</div>

## Where the AI risk surface differs from conventional software

| Security dimension | Conventional software | AI &amp; LLM systems |
|---|---|---|
| **Execution model** | Deterministic compiled logic (`f(x) -> y`). | Token-by-token inference (`P(next token | preceding tokens)`), sampled from a distribution. |
| **Instruction/data boundary** | Enforced structurally by a parser (for example, a prepared SQL statement). | No structural boundary: system prompt, retrieved data, and user text share one context window. |
| **Vulnerability class** | Code injection, memory corruption, broken access control. | Prompt injection, model and data poisoning, excessive agency, over-reliance on fabricated output. |
| **Attacker goal** | Remote code execution, database exfiltration. | Guardrail bypass, hidden-context disclosure, agent hijacking, exfiltration through the retrieval path. |

The row that matters most is the second. Nondeterministic sampling is a configuration choice — set temperature to zero and output becomes largely reproducible — but the missing instruction/data boundary does not go away at any temperature. Treat it as the root cause and the rest of this section follows from it.

## NIST AI Risk Management Framework (AI RMF 1.0)

The **AI RMF 1.0** was published by NIST in January 2023 as **voluntary** guidance. It does not certify systems or mandate controls; it structures how an organization reaches and records risk decisions across the AI lifecycle, through four core functions.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/nist-ai-rmf-functions.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the NIST AI RMF core functions diagram at full size">
    <img src="{{ '/assets/img/nist-ai-rmf-functions.svg' | relative_url }}" alt="Govern shown as a continuous band above Map, Measure, and Manage, which run left to right as an iterative loop, with measurement and incident evidence feeding back into Map.">
  </a>
  <p class="diagram-caption">NIST AI RMF 1.0: Govern runs continuously around Map, Measure, and Manage, which iterate across the lifecycle</p>
</div>

1. **Govern** — establishes risk culture, policy, documented risk tolerance, named accountabilities, and human-in-the-loop expectations. It is continuous rather than a stage.
2. **Map** — categorizes system context, capability, dependencies, and impact. This is where third-party foundation models, training-data provenance, and retrieval data boundaries get identified.
3. **Measure** — evaluates safety, security, robustness, bias, and privacy with quantitative and qualitative metrics, including red-team exercises and adversarial benchmark evaluation.
4. **Manage** — prioritizes risks and allocates response, deploys technical controls, and defines incident response for AI-specific failures.

Because the framework is voluntary, "aligned to the AI RMF" describes a process, not a compliance state. Nothing in it makes a control mandatory.

### A working rule for model retirement

> This subsection is a **journal working model**, not a NIST requirement. The AI RMF asks that decommissioning be governed; it does not supply these triggers.

Models accumulate in production far more readily than they are removed. A practical retirement trigger list:

- A training or fine-tuning dataset turns out to contain unacceptably biased, poisoned, or unlicensed data — for example, a data license is withdrawn or a source is subject to a takedown.
- Evaluation shows the deployed model has drifted outside its accepted safety and quality baselines.
- A replacement model passes the same safety benchmarks, making continued exposure of the older model unnecessary. Note that a smaller replacement is usually a cost and latency decision that trades some robustness away — it is a reason to retire the old model only once the replacement has actually cleared the same bar.

Retirement means revoking the model from inference endpoints and routing tables, not merely deprecating it in documentation. An endpoint that still answers is still in scope.

## OWASP Top 10 for LLM Applications

The [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) ranks the risks most commonly seen in LLM-backed applications. The entries below are the **2025 edition**, which is the edition OWASP currently publishes as per-risk reference pages.

| ID | Name | Operational description |
|---|---|---|
| **LLM01:2025** | [Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) | Direct jailbreaks, or instructions embedded in untrusted data, redirect model behavior. |
| **LLM02:2025** | Sensitive Information Disclosure | The model reveals confidential training data, personal data, or internal context in its output. |
| **LLM03:2025** | Supply Chain | Compromised foundation models, poisoned datasets, or vulnerable third-party packages. |
| **LLM04:2025** | Data and Model Poisoning | Adversaries manipulate pre-training corpora or fine-tuning data to introduce backdoors. |
| **LLM05:2025** | Improper Output Handling | Unvalidated model output is passed to a browser, database, shell, or terminal sink. |
| **LLM06:2025** | [Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/) | Agents hold tool permissions or autonomy beyond what their task requires. |
| **LLM07:2025** | System Prompt Leakage | Crafted prompts recover proprietary system instructions and operational context. |
| **LLM08:2025** | Vector and Embedding Weaknesses | Weak access control or adversarial influence over the retrieval and embedding pipeline. |
| **LLM09:2025** | Misinformation | Confident, plausible, incorrect output relied on without verification. |
| **LLM10:2025** | Unbounded Consumption | Resource and cost exhaustion through expensive inference or runaway agent loops. |

### Edition currency

OWASP published a **2026 edition** of this list in August 2026, announced on the [OWASP GenAI Security Project resource page](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/). It re-ranks several entries and renames at least one. At the time of writing, the 2026 document is distributed behind a registration form and OWASP's per-risk reference pages still serve the 2025 entries, so the identifiers above have deliberately been kept on the 2025 edition, where every entry is verifiable against a published primary page.

Two consequences worth carrying:

- **Always write the edition into the identifier.** `LLM06:2025` is precise; a bare `LLM06` silently changes meaning between editions.
- **Re-check the mapping before quoting a rank.** An identifier from one edition should never be pasted into a document that claims another.

## MITRE ATLAS

[MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for Artificial-Intelligence Systems) is a knowledge base of adversary tactics and techniques observed against AI and machine-learning systems, modeled after ATT&amp;CK. It records what has been done, which is a different question from what should be controlled.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/mitre-atlas-matrix.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the MITRE ATLAS tactic progression diagram at full size">
    <img src="{{ '/assets/img/mitre-atlas-matrix.svg' | relative_url }}" alt="Five columns showing an attack progressing through reconnaissance, initial access, execution, exfiltration, and impact, each listing representative techniques against AI systems.">
  </a>
  <p class="diagram-caption">MITRE ATLAS tactics as an attack progression, with representative techniques at each stage</p>
</div>

- **Reconnaissance** — searching public model repositories and papers, probing a deployed model to infer its family and guardrails, identifying the retrieval corpus and tool surface.
- **Initial access** — poisoned training data, backdoored weights pulled from a public hub, or indirect prompt injection planted in a document the system will fetch.
- **Execution** — unsafe deserialization of a model artifact, or unintended tool calls driven by injected instructions.
- **Exfiltration** — recovering hidden operational context, extracting memorized training records through inversion queries, or stealing model weights.
- **Impact** — evading classification, degrading inference availability, or driving an unauthorized downstream action.

ATLAS is not a control framework and carries no compliance weight. Use it to populate a threat model; use the AI RMF to decide what to do about what it surfaces.

## What these frameworks do not cover

Stacking all three still leaves gaps that have to be closed elsewhere:

- **No framework here supplies a mitigation that eliminates prompt injection.** They classify and rank it. See [Prompt Injection & Context Safety](../prompt-injection-defense/) for why the class has no complete fix.
- **None of them is a legal or regulatory obligation by itself.** Jurisdictional AI regulation is separate, and adopting a voluntary framework does not discharge it.
- **The OWASP list is a ranking, not a coverage guarantee.** A risk that did not make the top ten is not thereby acceptable in a given system.
- **ATLAS lags novel technique classes**, because it records what has been observed and reported.

## Diagnostic checklist

When auditing an enterprise AI deployment, evaluate these six criteria:

| Diagnostic area | Evaluation question | Audit evidence |
|---|---|---|
| **Governance** | Is AI risk tolerance documented, with named accountabilities and a stated human-in-the-loop policy? | AI governance charter &amp; system mapping records. |
| **Prompt injection containment** | Are untrusted inputs isolated architecturally, rather than only filtered, and is the residual risk written down? | Architecture records &amp; red-team injection test logs. |
| **Agent tool scoping** | Are destructive operations gated on explicit human approval of the resolved arguments? | Tool permission manifests &amp; approval audit logs. |
| **Retrieval authorization** | Do retrieval queries enforce the caller's document access rights inside the query itself? | Vector store authorization config &amp; multi-tenant isolation tests. |
| **Model artifact safety** | Are weights stored as safetensors or scanned before load, with `torch.load` restricted where legacy files remain? | CI scan reports &amp; loader configuration. |
| **Adversarial evaluation** | Are applications exercised against ATLAS techniques on a recurring schedule, not once at launch? | Red-team benchmark reports with dates. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>The root AI risk is the missing instruction/data boundary, not nondeterminism. NIST AI RMF 1.0 is voluntary governance structure, the OWASP Top 10 for LLM Applications is a versioned ranking of application risks — always cite the edition — and MITRE ATLAS records observed adversary behavior rather than prescribing controls.</p>
</div>

## Primary references

- **[NIST AI Risk Management Framework (AI RMF 1.0)](https://www.nist.gov/itl/ai-risk-management-framework)** — verified the four core functions, the January 2023 publication, and the framework's voluntary status.
- **[OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)** — verified the 2025 identifiers and names against the per-risk pages OWASP currently publishes.
- **[OWASP GenAI LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/)** — verified that a 2026 edition exists and was published in August 2026; the document itself is registration-gated and was not read for this page.
- **[MITRE ATLAS](https://atlas.mitre.org/)** — verified the tactic names and the knowledge-base framing.
