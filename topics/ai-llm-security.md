---
title: AI & LLM Security
description: Prompt injection, MCP tool poisoning, model supply-chain scanning, and concrete mitigation architectures for AI systems.
permalink: /topics/ai-llm-security/
---

<span class="eyebrow">Emerging Topics / Deep Dive</span>

# AI & LLM Security

<p class="lede">LLMs introduce genuinely new failure modes — prompt injection has no equivalent in classical software the way SQL injection does. Where these problems intersect with cryptography — model integrity, API credentials — the same tools apply regardless of what's on the other end being an AI system.</p>

## Prompt injection: SQL injection's harder successor

SQL injection was solved architecturally: parameterized queries give the database engine a hard, structural boundary between the trusted query template and untrusted user data — the data literally cannot be interpreted as code, no matter what it contains. LLMs have no equivalent boundary:

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
- **The dual-LLM (quarantine) pattern** — a privileged model holds the tools and takes actions, but never reads untrusted content directly; a separate, quarantined model reads untrusted content (the webpage, the email, the tool output) and passes back only a structured, constrained summary. Injected instructions in the untrusted content have no path to reach the model that can actually act on them. This doesn't cover every workflow (tasks where the untrusted content itself must directly drive the action are harder to quarantine this way), but it closes off a large share of realistic attacks.
- **Output validation before any consequential action** — treat a tool call an agent wants to make the same way [API Security]({{ '/topics/api-security/' | relative_url }}) already treats any external input: validate it against an expected shape/allow-list before executing it, rather than trusting it because "the model decided to."
- **Human-in-the-loop for sensitive operations** — anything destructive, irreversible, or high-value (sending money, deleting data, exfiltrating files) should require explicit confirmation, not silent agent autonomy.
- **Segregating external content structurally** — where the interface allows it, marking retrieved/tool content distinctly from direct instructions (separate fields, explicit delimiters, metadata tags) gives the model more signal to work with, even though it isn't a hard guarantee the way SQL parameterization is.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p>The <a href="https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html">OWASP LLM Prompt Injection Prevention Cheat Sheet</a> is the actively-maintained practical guide this section summarizes. <a href="https://owasp.org/www-community/attacks/MCP_Tool_Poisoning">OWASP's MCP Tool Poisoning</a> page documents the attack class covered above in more depth.</p>
</div>

## Model supply-chain integrity: scanning, hashing, signing

Beyond runtime prompt injection, there's a distinct, more familiar-shaped problem: is the model file itself safe to load in the first place?

PyTorch's historical default checkpoint format is Python's `pickle` — and deserializing a pickle file can execute arbitrary code embedded in it, by design (pickle serializes arbitrary object behavior, not just data). Loading an untrusted `.pkl` model file is functionally equivalent to running an untrusted executable, and this has been actively exploited against public model hubs.

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

Same scanner, two files — one flagged instantly for embedding a call to `os.system`, the other passes clean because it contains nothing but plain data. This is a real, runnable check, not a theoretical one, and it costs nothing to run before loading any model file from an external source.

The other half of the fix is the same as for any downloaded artifact:

- **Prefer safetensors over pickle** — a format developed specifically to close this gap, storing only tensor weights with no executable content and no deserialization hooks at all.
- **Hashing** — publish and verify a SHA-256 checksum of model weight files, the same [integrity check]({{ '/topics/hash-functions-macs/' | relative_url }}) used for any downloaded software.
- **Signing** — an increasing number of model registries support signing model artifacts (e.g. via Sigstore), giving the same [digital-signature]({{ '/topics/digital-signatures/' | relative_url }}) guarantee already covered for code signing — proof of who published it and that it wasn't altered since.

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
  <p>The <a href="https://genai.owasp.org/llm-top-10/">OWASP Top 10 for LLM Applications (2025)</a> is the standard practical risk checklist for AI/LLM security generally. The <a href="https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html">OWASP Prompt Injection Prevention Cheat Sheet</a> and <a href="https://owasp.org/www-community/attacks/MCP_Tool_Poisoning">MCP Tool Poisoning</a> page cover prompt injection and MCP tool poisoning directly. <strong><a href="https://www.nist.gov/itl/ai-risk-management-framework">NIST AI 100-1</a></strong> (the AI Risk Management Framework) covers AI risk more broadly. <strong><a href="https://atlas.mitre.org/">MITRE ATLAS</a></strong> catalogs real-world adversarial AI tactics and techniques. <a href="https://github.com/protectai/modelscan">ModelScan</a> is the scanner demonstrated above.</p>
</div>

## Where this fits

The supply-chain half of this folds directly back into [Hash Functions & MACs]({{ '/topics/hash-functions-macs/' | relative_url }}) and [Digital Signatures]({{ '/topics/digital-signatures/' | relative_url }}), and API key handling is just [API Security]({{ '/topics/api-security/' | relative_url }}) again. Prompt injection and MCP tool poisoning are the genuinely new part — problems this field is still actively working out, with defense-in-depth rather than a clean structural fix as the current state of the art.
