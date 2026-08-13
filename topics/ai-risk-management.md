---
title: AI & LLM Threat Frameworks & Risk Management
description: Comprehensive technical guide to AI and Large Language Model (LLM) risk governance, NIST AI RMF 1.0 core functions, OWASP Top 10 for LLM Applications (2025), and MITRE ATLAS adversarial ML threat mapping.
permalink: /topics/ai-risk-management/
last_verified: 2026-08-13
---

<span class="eyebrow">AI & LLM Security / Risk & Governance</span>

# AI & LLM Threat Frameworks & Risk Management

<p class="lede">Artificial Intelligence (AI) and Large Language Model (LLM) systems introduce novel security risk surfaces that differ fundamentally from traditional software. Rather than executing deterministic compiled code, AI systems operate non-deterministically over dynamic probabilistic models. Managing AI risk requires aligning governance frameworks—NIST AI RMF 1.0, OWASP Top 10 for LLM Applications, and MITRE ATLAS—to establish trustworthy, secure AI deployments.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/ai-risk-management.svg' | relative_url }}" alt="AI &amp; LLM Threat Frameworks &amp; Risk Management Architecture diagram showing NIST AI RMF 1.0 functions (Govern, Map, Measure, Manage), OWASP Top 10 for LLMs, and MITRE ATLAS matrix mapping.">
  <p class="diagram-caption">AI Risk Management Architecture: NIST AI RMF 1.0 Core Functions &leftrightarrow; OWASP Top 10 for LLMs (2025) &leftrightarrow; MITRE ATLAS Adversarial Threat Matrix</p>
</div>

## The Fundamental AI Risk Shift

Traditional software security relies on strict boundary isolation between code instructions and data inputs. AI and LLM systems break this boundary:

| Security Dimension | Traditional Software Systems | AI &amp; LLM Systems |
|---|---|---|
| **Execution Model** | Deterministic compiled logic ($f(x) \rightarrow y$). | Probabilistic token inference ($\mathbb{P}(w_t \mid w_{<t})$). |
| **Instruction/Data Boundary** | Strict separation (e.g. Parameterized SQL queries). | Undifferentiated context window (System prompt, RAG data, and user text share token space). |
| **Vulnerability Class** | Code injection, buffer overflows, broken access control. | Prompt injection, model poisoning, excessive agency, hallucination exploitation. |
| **Threat Actor Goal** | Remote Code Execution (RCE), SQL exfiltration. | Guardrail bypass, model weight theft, agent hijacking, data exfiltration via RAG. |

## NIST AI Risk Management Framework (AI RMF 1.0)

Published by NIST, the **AI RMF 1.0** provides a structured framework for managing risks to individuals, organizations, and society. The framework structures risk management into 4 core functions:

<div class="diagram-frame">
  <img src="{{ '/assets/img/ai-risk-management.svg' | relative_url }}" alt="NIST AI RMF 1.0 Core Functions diagram showing Govern, Map, Measure, and Manage.">
  <p class="diagram-caption">NIST AI RMF 1.0 Core Functions: Govern &leftrightarrow; Map Context &leftrightarrow; Measure Empirical Metrics &leftrightarrow; Manage Risk Allocation</p>
</div>

1. **GOVERN**: Establishes a culture of risk management across the AI lifecycle. Defines policies, transparent accountabilities, human-in-the-loop requirements, and organizational risk tolerance.
2. **MAP**: Categorizes AI system context, capabilities, dependencies, and potential impacts. Identifies third-party foundation models, training data provenance, and RAG data boundaries.
3. **MEASURE**: Employs quantitative and qualitative metrics to evaluate AI system safety, security, robustness, bias, and privacy. Conducts empirical red-teaming and adversarial benchmark evaluations.
4. **MANAGE**: Allocates risk response resources to prioritized AI risks. Deploys technical controls (*e.g. guardrails, least-privilege tool binding*) and defines incident response procedures for AI failures.

## OWASP Top 10 for LLM Applications (2025 Edition)

The **OWASP Top 10 for LLM Applications** categorizes the most critical security vulnerabilities impacting LLM-backed applications:

| Vulnerability ID | Vulnerability Name | Operational Risk &amp; Threat Description |
|---|---|---|
| **LLM01:2025** | **Prompt Injection** | Direct jailbreaks or indirect untrusted data payloads override system prompt instructions. |
| **LLM02:2025** | **Sensitive Information Disclosure** | Model discloses confidential training data, PII, or internal system context in responses. |
| **LLM03:2025** | **Supply Chain Vulnerabilities** | Compromised foundation models, poisoned datasets, or vulnerable third-party Python packages. |
| **LLM04:2025** | **Data and Model Poisoning** | Adversaries manipulate fine-tuning datasets or pre-training corpora to introduce backdoors. |
| **LLM05:2025** | **Improper Output Handling** | Unsanitized LLM responses passed directly to downstream web browsers, DBs, or shells. |
| **LLM06:2025** | **Excessive Agency** | LLM agents granted over-privileged tool access or autonomous execution without approval gates. |
| **LLM07:2025** | **System Prompt Leakage** | Attackers craft prompts that force the model to reveal proprietary system instructions. |
| **LLM08:2025** | **Vector and Embedding Weaknesses** | Unauthorized data access or injection via weak vector database access controls and RAG pipelines. |
| **LLM09:2025** | **Misinformation &amp; Hallucination** | Over-reliance on inaccurate or hallucinated model outputs leading to security operational failures. |
| **LLM10:2025** | **Unbounded Consumption** | Resource exhaustion and denial-of-wallet via heavy inference requests or recursive agent loops. |

## MITRE ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems)

**MITRE ATLAS** is a globally accessible knowledge base of real-world adversary tactics, techniques, and procedures (TTPs) targeting AI/ML systems:

<div class="diagram-frame">
  <img src="{{ '/assets/img/ai-risk-management.svg' | relative_url }}" alt="MITRE ATLAS AI Threat Matrix diagram.">
  <p class="diagram-caption">MITRE ATLAS TTP Matrix: Reconnaissance &leftrightarrow; Initial Access &leftrightarrow; Execution &leftrightarrow; Exfiltration &leftrightarrow; Impact</p>
</div>

- **Initial Access**: Gaining access via poisoned training data, malicious Hugging Face model weights, or indirect prompt injection embedded in fetched web documents.
- **Execution**: Triggering unauthorized model actions, execution of unsafe Python deserialization payloads (`.pkl`), or unexpected tool calls.
- **Exfiltration**: Extracting sensitive system prompts, training data memories, or proprietary model weights via inversion queries.
- **Impact**: Altering model classification behavior, degrading inference availability, or forcing unauthorized financial transactions.

## Essential AI Risk Management Diagnostic Checklist

When auditing an enterprise AI deployment, evaluate these 6 core criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **NIST AI RMF Governance** | Has the organization formally documented AI risk tolerance, human-in-the-loop policies, and system mapping? | AI governance charter &amp; system mapping documentation. |
| **OWASP LLM01 Mitigation** | Are direct and indirect prompt injection vectors isolated using structural guardrails and dual-LLM architectures? | Guardrail policy files &amp; red-team prompt injection test logs. |
| **Agentic Tool Scoping** | Are LLM agents restricted from executing destructive operations (file deletion, financial transfer) without human approval? | Agent tool permission manifests &amp; HITL audit logs. |
| **RAG Boundary Security** | Do RAG vector database queries enforce user-level document access control lists (ACLs)? | Vector database RBAC configuration &amp; RAG query log audits. |
| **Model Deserialization** | Are model weights restricted to Safetensors formats or scanned via ModelScan prior to deployment? | CI/CD model scan reports &amp; PyTorch `weights_only=True` configs. |
| **Continuous Red-Teaming** | Are AI applications evaluated against MITRE ATLAS TTPs using automated red-teaming benchmarks? | Automated AI red-team benchmark test reports. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>AI risk management requires governing non-deterministic token inference. NIST AI RMF 1.0 provides governance functions (Govern, Map, Measure, Manage), OWASP LLM01:2025 highlights prompt injection and excessive agency, and MITRE ATLAS maps adversarial AI attack paths.</p>
</div>

## Primary references

- **NIST AI Risk Management Framework**: *Artificial Intelligence Risk Management Framework (AI RMF 1.0)* — [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework)
- **OWASP Top 10 for LLMs**: *OWASP Top 10 for Large Language Model Applications (2025)* — [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- **MITRE ATLAS**: *Adversarial Threat Landscape for Artificial-Intelligence Systems* — [MITRE ATLAS Official](https://atlas.mitre.org/)
