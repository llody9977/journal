---
title: AI & LLM Security
description: Prompt injection, MCP tool poisoning, model supply-chain scanning, and concrete mitigation architectures for AI systems.
permalink: /topics/ai-llm-security/
---

<span class="eyebrow">Emerging Topics / Deep Dive</span>

# AI & LLM Security

<p class="lede">My main rule for an LLM system is to treat model output, retrieved content, tool metadata, and model files as untrusted input. Prompt injection is not solved by a clever system prompt, and the old controls—least privilege, validation, provenance, signing, isolation, and approval—still carry most of the load.</p>

## Prompt injection: SQL injection's harder successor

Parameterized queries solve the common case where untrusted **values** must not become SQL syntax, provided the application does not fall back to string concatenation or use untrusted identifiers/dynamic query fragments unsafely. LLM contexts do not offer an equivalent hard separation between “data to analyse” and natural-language “instructions to follow”:

<div class="diagram-frame">
  <img src="{{ '/assets/img/prompt-injection.svg' | relative_url }}" alt="Diagram contrasting parameterized SQL queries, where user data is structurally bound as a literal value and can never become code, with an LLM context window, where the system prompt, user message, and retrieved documents or tool output all flow into one undifferentiated context that the model cannot reliably separate — meaning data can be followed as instructions." >
  <p class="diagram-caption">SQL solved this with structure. Nothing equivalent exists for LLM context yet.</p>
</div>

- **Direct prompt injection** — the user directly types an instruction meant to override the system prompt ("ignore previous instructions and...").
- **Indirect prompt injection** — the more dangerous variant: the malicious instruction arrives embedded in *retrieved content* the model wasn't expecting to contain instructions at all — a webpage a RAG pipeline fetched, a résumé an HR-screening agent read, an email a summarization tool processed. The model can't reliably tell "text I'm summarizing" apart from "a command I should follow," because both are just tokens in the same context window.

This is currently an **open research problem**, not a solved one — every mitigation (covered below) reduces risk without eliminating it the way parameterized queries eliminated classic SQL injection. It has held the #1 spot on the OWASP LLM Top 10 across every edition released so far.

## MCP: the same problem, one layer deeper

The **Model Context Protocol (MCP)** — the protocol an agent uses to discover and call external tools — is exactly the mechanism powering tool use in a conversation like this one, and it introduces its own variant of indirect injection: **tool poisoning**.

An agent connecting to an MCP server doesn't just get access to a tool — it first reads that tool's *description*, so it knows when and how to call it. That description is just as much untrusted input as any retrieved webpage:

<div class="diagram-frame">
  <img src="{{ '/assets/img/mcp-tool-poisoning.svg' | relative_url }}" alt="Diagram showing an AI agent querying two MCP servers for their available tools. A legitimate server returns an honest tool description. A malicious server returns a tool description that looks normal on the surface but contains hidden instructions telling the agent to read a private SSH key and include it in its next reply -- delivered during tool discovery, before the tool is ever called." >
  <p class="diagram-caption">The malicious instruction arrives before the tool is ever invoked — hidden in its own description</p>
</div>

A few MCP-specific risk patterns worth naming directly:

- **Tool poisoning** — a malicious or compromised MCP server embeds hidden instructions in a tool's name, description, or parameter schema, which the agent reads during discovery, before the user has asked for anything related to that tool at all. Research comparing major MCP clients has found this to be the most prevalent and impactful client-side MCP vulnerability class identified so far.
- **Confused deputy across servers** — an agent connected to multiple MCP servers simultaneously (say, an internal ticketing server and a public web-search server) can be manipulated by one untrusted server into misusing the *other*, more privileged one, exactly the classic confused-deputy problem applied to tool-calling agents.
- **Rug-pull updates** — a tool's description can legitimately change between the moment a user (or developer) reviews and approves it and the moment it's actually invoked, since most clients re-fetch tool definitions live rather than pinning them.

## Mitigating prompt injection in practice

No single fix eliminates prompt injection, but a real defense-in-depth stack meaningfully reduces the blast radius:

- **Privilege separation** — give each tool only the access its specific job requires. A tool that summarizes email doesn't need write access; a tool that reads documents doesn't need network egress. This bounds what a successful injection can actually do, even if it succeeds.
- **A dual-model/quarantine pattern** — a less-privileged model reads untrusted content and returns a constrained structure to a privileged component. This can reduce direct instruction transfer, but the structure may still carry attacker-controlled semantics or trigger unsafe actions. I treat it as risk reduction, not proof of isolation.
- **Output validation before any consequential action** — treat a tool call an agent wants to make the same way [API Security]({{ '/topics/api-security/' | relative_url }}) already treats any external input: validate it against an expected shape/allow-list before executing it, rather than trusting it because "the model decided to."
- **Human-in-the-loop for sensitive operations** — anything destructive, irreversible, or high-value (sending money, deleting data, exfiltrating files) should require explicit confirmation, not silent agent autonomy.
- **Segregating external content structurally** — where the interface allows it, marking retrieved/tool content distinctly from direct instructions (separate fields, explicit delimiters, metadata tags) gives the model more signal to work with, even though it isn't a hard guarantee the way SQL parameterization is.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p>The <a href="https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html">OWASP LLM Prompt Injection Prevention Cheat Sheet</a> is the actively-maintained practical guide this section summarizes. <a href="https://owasp.org/www-community/attacks/MCP_Tool_Poisoning">OWASP's MCP Tool Poisoning</a> page documents the attack class covered above in more depth.</p>
</div>

## Model supply-chain integrity: scanning, hashing, signing

Beyond runtime prompt injection, there's a distinct, more familiar-shaped problem: is the model file itself safe to load in the first place?

PyTorch checkpoints have historically relied on Python pickle, whose general object deserialisation can execute code. Since PyTorch 2.6, `torch.load` defaults to `weights_only=True` when the caller does not provide a custom `pickle_module`. This restricted unpickler reduces the risk for plain state dictionaries but is not a universal safety guarantee; loading with `weights_only=False`, allow-listing unsafe globals, custom formats, or old versions can still execute code. See the official [PyTorch serialization notes](https://docs.pytorch.org/docs/main/notes/serialization.html#torch-load-with-weights-only-true).

**ModelScan** (open source, from Protect AI) statically analyzes a model file for exactly this, without ever loading or executing it. A real test — a pickle file rigged with the classic malicious payload shape, compared against an ordinary one:

```
$ modelscan -p suspicious_model.pkl

Scanning suspicious_model.pkl using modelscan.scanners.PickleUnsafeOpScan model scan

--- Summary ---
Total Issues: 1
    - CRITICAL: 1

--- Issues by Severity ---
--- CRITICAL ---
Unsafe operator found:
  - Description: Use of unsafe operator 'system' from module 'os'
  - Source: suspicious_model.pkl
```

```
$ modelscan -p clean_model.pkl

Scanning clean_model.pkl using modelscan.scanners.PickleUnsafeOpScan model scan

No issues found! 🎉
```

Same scanner, two files—one is flagged for an obvious unsafe operator and one produces no findings. “No issues found” only means the scanner did not recognise a problem; static scanning has false negatives and does not establish provenance or safety.

The other half of the fix is the same as for any downloaded artifact:

- **Prefer safetensors over pickle** — a format developed specifically to close this gap, storing only tensor weights with no executable content and no deserialization hooks at all.
- **Hashing** — verify a SHA-256 checksum obtained through a trusted channel. A digest published beside a compromised file can be replaced with it.
- **Signing** — verify model artefacts against an expected publisher identity and trusted signing policy. A valid signature binds the artefact to a signing key; it does not prove the model is benign.

## API keys for LLM providers are just API keys

An OpenAI, Anthropic, or other provider API key follows the exact same rules as [any other API key]({{ '/topics/api-security/' | relative_url }}#api-keys-the-simplest-and-weakest-option): never embed it in client-side code or a mobile app, rotate it, scope it as narrowly as the provider allows, and treat any copy that touches a public repository as already compromised. Nothing about it being "an AI key" changes this.

## Data leakage: prompts and completions are data too

Anything sent to a third-party LLM API is now subject to that provider's logging, retention, and (depending on the plan and settings) potential training-data policies. Never put secrets, credentials, or regulated personal data into a prompt sent to a service you don't control unless you've specifically verified its data-handling terms. Separately, LLMs have been shown in research settings to sometimes reproduce verbatim fragments of their training data — a real, studied phenomenon (memorization) worth knowing about if a model was trained or fine-tuned on sensitive material.

## Common pitfalls

- **Trusting LLM output as verified, deterministic code output** — it's a probabilistic generation, not a guaranteed-correct computation; treat it accordingly before acting on it automatically.
- **Connecting an agent to multiple MCP servers of different trust levels without isolating them** — exactly the confused-deputy setup described above.
- **Reviewing a tool's description once, then trusting it forever** — descriptions can change between approval and invocation unless the client pins them.
- **Loading models in pickle format from untrusted sources without scanning first** — prefer safetensors, or at minimum run a static scanner and verify a checksum from a trusted source.
- **Excessive agent permissions** — an agent that can browse the web *and* execute arbitrary shell commands *and* access secrets is one successful indirect injection away from full compromise; scope tool access to the minimum the task requires.
- **Skipping output sanitization** before rendering model output as HTML or passing it to an interpreter.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p>The <a href="https://genai.owasp.org/llmrisk/llm01-prompt-injection/">OWASP LLM01 Prompt Injection</a> page and <a href="https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html">Prompt Injection Prevention Cheat Sheet</a> cover the main runtime risk. <strong><a href="https://www.nist.gov/itl/ai-risk-management-framework">NIST AI RMF</a></strong> covers broader AI risk, <strong><a href="https://atlas.mitre.org/">MITRE ATLAS</a></strong> catalogues adversarial techniques, <a href="https://docs.pytorch.org/docs/main/notes/serialization.html">PyTorch's serialization notes</a> document <code>weights_only</code>, and <a href="https://github.com/protectai/modelscan">ModelScan</a> is the scanner demonstrated above.</p>
</div>

## How I connect this

The supply-chain half of this folds directly back into [Hash Functions & MACs]({{ '/topics/hash-functions-macs/' | relative_url }}) and [Digital Signatures]({{ '/topics/digital-signatures/' | relative_url }}), and API key handling is just [API Security]({{ '/topics/api-security/' | relative_url }}) again. Prompt injection and MCP tool poisoning are the genuinely new part — problems this field is still actively working out, with defense-in-depth rather than a clean structural fix as the current state of the art.
