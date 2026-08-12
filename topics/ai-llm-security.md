---
title: AI & LLM Security
description: Architectural guide to AI/LLM threats, direct and indirect prompt injection (OWASP LLM01:2025), MCP tool poisoning, and model supply chain security.
permalink: /topics/ai-llm-security/
last_verified: 2026-08-12
---

<span class="eyebrow">Emerging Topics / Threat Analysis</span>

# AI & LLM Security

<p class="lede">Large Language Models (LLMs) operate without a structural boundary between system instructions and untrusted input data. This architectural characteristic exposes AI applications to direct and indirect prompt injection (OWASP Top 10 for LLM Applications LLM01:2025), Model Context Protocol (MCP) tool poisoning, and deserialization remote code execution via unsafe model weights.</p>

## The Fundamental Structural Deficit: Parameterized SQL vs LLM Context

In traditional web applications, SQL injection is mitigated by parameterized queries that isolate instructions from dynamic data:

$$\text{SQL Engine}: \text{PREPARE statement FROM } \text{"SELECT * FROM users WHERE id = ?"} \quad (\text{Data cannot become code})$$

In LLMs, system prompts, user queries, retrieved RAG documents, and tool outputs exist as undifferentiated tokens within a single context window:

<div class="diagram-frame">
  <img src="{{ '/assets/img/prompt-injection.svg' | relative_url }}" alt="Prompt injection diagram contrasting parameterized SQL queries with undifferentiated LLM context windows.">
  <p class="diagram-caption">LLM context vulnerability: natural language instructions and untrusted data share the same token space</p>
</div>

## Direct vs Indirect Prompt Injection

| Attack Vector | Input Source | Attack Target & Mechanism | Operational Consequence |
|---|---|---|---|
| **Direct Prompt Injection** | User input string | Overrides system prompt instructions via jailbreaks (*e.g., "Ignore system instructions..."*). | System guardrail bypass, unauthorized capability access. |
| **Indirect Prompt Injection** | Untrusted external data (RAG documents, fetched web pages, emails) | Attacker embeds instructions in data retrieved during background context assembly. | Silent background execution: exfiltrating user data, triggering unauthorized tool calls. |

## Model Context Protocol (MCP) Security: Tool Description Poisoning

The **Model Context Protocol (MCP)** enables AI agents to discover and invoke external tools. During discovery, a client requests the list of available tools and receives each tool's `name`, `description`, and input schema; this metadata is fed into the model's context so the model can decide which tool to call. This creates an agent-specific prompt-injection surface, sometimes called **MCP tool (description) poisoning**: a malicious or compromised MCP server can embed adversarial instructions inside a tool's description text. The [MCP specification](https://modelcontextprotocol.io/specification/2025-06-18/server/tools) itself warns that "clients **MUST** consider tool annotations to be untrusted unless they come from trusted servers." The description is not executed as code — it is ingested as untrusted natural-language content in the model's context, so it can influence the model's behavior or output through the same mechanism as any other prompt-injection vector (see [OWASP LLM01:2025](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)), not through literal code execution during tool listing.

<div class="diagram-frame">
  <img src="{{ '/assets/img/mcp-tool-poisoning.svg' | relative_url }}" alt="MCP Tool Poisoning diagram showing malicious instructions hidden inside tool metadata.">
  <p class="diagram-caption">MCP Tool Poisoning: malicious instructions embedded in tool descriptions are ingested into the model's context during discovery and can influence its behavior</p>
</div>

### MCP Security Checklist

1. **Validate Tool Descriptions**: Treat tool metadata returned by MCP servers as untrusted input, per the MCP specification's own guidance above.
2. **Restrict Scope via Resource Indicators (RFC 8707)**: Bind client tokens to explicit resource server URIs to prevent "confused deputy" attacks across multi-server agent environments.
3. **Enforce Human-in-the-Loop (HITL)**: Require explicit human approval before executing destructive or high-privilege tool calls (*e.g., file writes, financial transfers, code execution*).

## Model Supply Chain Security: Safetensors vs PyTorch Pickle

Model file format choice dictates deserialization safety:

| Model Format | Serialization Mechanism | Remote Code Execution (RCE) Risk | Security Recommendation |
|---|---|---|---|
| **PyTorch (`.pth`, `.bin`, `.pkl`)** | Python `pickle` deserialization | **HIGH RISK**: Arbitrary Python code execution during `torch.load()`. | Avoid loading untrusted pickle models; when full module objects are not needed, use [`torch.load(..., weights_only=True)`](https://docs.pytorch.org/docs/main/notes/serialization.html), which restricts unpickling to a safe allowlist of tensor-only types and (from PyTorch 2.6) is the default. It narrows the pickle RCE surface but does not guard against denial-of-service or all memory-corruption scenarios. |
| **[Safetensors](https://github.com/huggingface/safetensors) (`.safetensors`)** | Header (JSON metadata) + raw tensor byte buffer, no executable payload | Format design eliminates the pickle-deserialization RCE vector specifically: parsing involves no code execution, only reading declared tensor offsets/shapes/dtypes. This does not guarantee zero risk from any implementation bug in a parser, supply-chain compromise, or misuse elsewhere in a pipeline. | Default/recommended format in the Hugging Face ecosystem; not a universally adopted format across all ML tooling (ONNX, framework-native checkpoints, and GGUF for local inference remain common elsewhere). |

### Scanning Models via ModelScan CLI

[ModelScan](https://github.com/protectai/modelscan) is an open-source scanner from Protect AI that inspects model files for unsafe deserialization operators across several formats (pickle-derived formats such as PyTorch, scikit-learn, and XGBoost; TensorFlow's Protocol Buffer format; and Keras' HDF5 format):

```bash
# Scan a PyTorch model for unsafe deserialization operators
modelscan -p suspicious_model.pkl

# Output snippet:
# --- Summary ---
# Total Issues: 1 (CRITICAL: 1)
# Unsafe operator found: 'system' from module 'os'
```

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Indirect prompt injection lets untrusted content from retrieved documents or web pages manipulate an LLM's behavior; pattern-based filtering alone doesn't fully mitigate it per OWASP LLM01:2025, so pair it with least-privilege tool access and human-in-the-loop approval. Never let an LLM execute a destructive side effect — a database delete, a wire transfer — without explicit human confirmation.</p>
</div>

## Primary references

- **OWASP Top 10 for Large Language Model Applications**: *OWASP LLM Security Project* — [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- **NIST AI Risk Management Framework (AI RMF 1.0)**: *Artificial Intelligence Risk Management Framework* — [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework)
