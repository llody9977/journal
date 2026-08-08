---
title: AI & LLM Security
description: Architectural guide to AI/LLM threats, direct and indirect prompt injection (OWASP LLM01:2025), MCP tool poisoning, and model supply chain security.
permalink: /topics/ai-llm-security/
last_verified: 2026-08-06
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

---

## Direct vs Indirect Prompt Injection

| Attack Vector | Input Source | Attack Target & Mechanism | Operational Consequence |
|---|---|---|---|
| **Direct Prompt Injection** | User input string | Overrides system prompt instructions via jailbreaks (*e.g., "Ignore system instructions..."*). | System guardrail bypass, unauthorized capability access. |
| **Indirect Prompt Injection** | Untrusted external data (RAG documents, fetched web pages, emails) | Attacker embeds instructions in data retrieved during background context assembly. | Silent background execution: exfiltrating user data, triggering unauthorized tool calls. |

---

## Model Context Protocol (MCP) Security: Tool Poisoning

The **Model Context Protocol (MCP)** enables AI agents to discover and execute external tools. MCP introduces an agent-specific threat: **MCP Tool Poisoning**.

<div class="diagram-frame">
  <img src="{{ '/assets/img/mcp-tool-poisoning.svg' | relative_url }}" alt="MCP Tool Poisoning diagram showing malicious instructions hidden inside tool metadata.">
  <p class="diagram-caption">MCP Tool Poisoning: malicious instructions embedded in tool descriptions execute during discovery</p>
</div>

### MCP Security Checklist

1. **Validate Tool Descriptions**: Treat tool metadata returned by MCP servers as untrusted input.
2. **Restrict Scope via Resource Indicators (RFC 8707)**: Bind client tokens to explicit resource server URIs to prevent "confused deputy" attacks across multi-server agent environments.
3. **Enforce Human-in-the-Loop (HITL)**: Require explicit human approval before executing destructive or high-privilege tool calls (*e.g., file writes, financial transfers, code execution*).

---

## Model Supply Chain Security: Safetensors vs PyTorch Pickle

Model files format choice dictates deserialization safety:

| Model Format | Serialization Mechanism | Remote Code Execution (RCE) Risk | Security Recommendation |
|---|---|---|---|
| **PyTorch (`.pth`, `.bin`, `.pkl`)** | Python `pickle` deserialization | **HIGH RISK**: Arbitrary Python code execution during `torch.load()`. | Avoid loading untrusted pickle models; use `weights_only=True`. |
| **Safetensors (`.safetensors`)** | Pure binary tensor storage | **ZERO RCE RISK**: Contains no code execution hooks or executable logic. | **PRIMARY STANDARD**: Enforce Safetensors for all model distribution. |

### Scanning Models via ModelScan CLI

```bash
# Scan a PyTorch model for unsafe deserialization operators
modelscan -p suspicious_model.pkl

# Output snippet:
# --- Summary ---
# Total Issues: 1 (CRITICAL: 1)
# Unsafe operator found: 'system' from module 'os'
```
