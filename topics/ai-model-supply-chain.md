---
title: AI Model Supply Chain & Deserialization Safety
description: Why pickle-based model files execute code during torch.load, what weights_only=True and safetensors each actually stop, ModelScan usage in CI, and the weight-level risks none of them address.
permalink: /topics/ai-model-supply-chain/
last_verified: 2026-08-14
---

<span class="eyebrow">AI & LLM Security / Model Security</span>

# AI Model Supply Chain & Deserialization Safety

<p class="lede">A model file looks like a large array of numbers, but the traditional PyTorch formats are not arrays — they are Python <code>pickle</code> streams, and <code>pickle</code> is a stack-machine bytecode that can name and call arbitrary functions while it loads. Loading an untrusted <code>.pth</code> or <code>.pkl</code> therefore runs attacker-chosen code before <code>torch.load()</code> returns anything to inspect. Two controls address this: <code>weights_only=True</code> restricts the unpickler, and safetensors removes the opcode stream entirely. Neither looks at the weights themselves, which is a separate problem.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/ai-model-supply-chain.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the model supply chain overview diagram at full size">
    <img src="{{ '/assets/img/ai-model-supply-chain.svg' | relative_url }}" alt="Three panels: PyTorch pickle deserialization as an arbitrary code execution vector, the safetensors format with a JSON header and raw byte buffer and a note that it protects the container rather than the weights, and ModelScan plus hub scanning with a note that scanning is pattern matching rather than proof of safety.">
  </a>
  <p class="diagram-caption">Model supply chain: pickle deserialization, the safetensors alternative, and where automated scanning fits</p>
</div>

## Why loading a pickled model runs code

Legacy PyTorch checkpoints (`.pkl`, `.pth`, and the older `.bin` convention) rely on Python's `pickle` module. Pickle is not a static data format. It is a stack-based virtual machine whose opcodes can push a named callable onto the stack and then invoke it.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/pickle-rce-mechanism.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the pickle deserialization mechanism diagram at full size">
    <img src="{{ '/assets/img/pickle-rce-mechanism.svg' | relative_url }}" alt="Four stages: the file holds an opcode stream rather than plain tensors; the unpickler executes it on a stack machine pushing os.system and its arguments; the REDUCE opcode pops the callable and calls it; and by the time torch.load returns, the payload has already run. Two footer panels show where weights_only cuts the chain and where safetensors removes it.">
  </a>
  <p class="diagram-caption">The pickle chain: <code>GLOBAL</code> names a callable, <code>REDUCE</code> invokes it, and the payload has run before <code>torch.load()</code> returns</p>
</div>

When an application loads a model with `torch.load("model.pth")`, the unpickler executes that stream. A `GLOBAL` opcode names a callable such as `os.system`, the arguments are pushed, and `REDUCE` calls it — commonly reached through a class's `__reduce__` method. The payload runs during loading, so inspecting the returned object afterwards cannot detect it. This is what makes a backdoored checkpoint a working remote code execution primitive against an inference host.

## Safetensors compared with pickle

Hugging Face's **safetensors** format was designed to remove this class:

| Dimension | PyTorch pickle (`.pth` / `.bin` / `.pkl`) | Safetensors (`.safetensors`) |
|---|---|---|
| **Structure** | Executable `pickle` opcode stream. | JSON header of shapes and dtypes, followed by a raw byte tensor buffer. |
| **Code execution on load** | The file can name and call arbitrary callables. | Nothing in the file names a callable, so the reader invokes none. |
| **Loading performance** | Python object reconstruction. | Zero-copy memory mapping (`mmap`). |
| **What it does not cover** | — | The weights themselves. Parser and allocation defects remain in scope. |
| **Ecosystem status** | Historic default; still widespread in older checkpoints. | Default across Hugging Face and current tooling. |

The security claim is specific and worth stating precisely rather than absolutely. A 2023 independent audit commissioned by Hugging Face, EleutherAI, and Stability AI found no critical vulnerability permitting arbitrary code execution, and fixed three medium-severity issues including missing validation that had allowed polyglot files. That supports "the format does not provide a code-execution path", not "the file is safe" — a poisoned or backdoored set of weights loads through safetensors perfectly cleanly.

## Restricting the unpickler with `weights_only=True`

Where legacy checkpoints cannot be converted immediately:

```python
import torch

# Unsafe on an untrusted file — the pickle stream executes during load:
# model = torch.load("untrusted_model.pth", weights_only=False)

# Restricted load: the unpickler may only rebuild tensors and a few primitives.
state_dict = torch.load("untrusted_model.pth", weights_only=True)
```

- **Mechanism**: the restricted unpickler may only execute the functions and build the classes needed for a `state_dict` of plain tensors plus some primitive types, and it may not import anything dynamically. The `REDUCE`-to-`os.system` path never runs.
- **Default status**: from PyTorch 2.6, `torch.load` uses `weights_only=True` **when the `pickle_module` argument is not passed**. Passing `pickle_module` restores the old behavior.
- **The legacy exception**: a checkpoint that stores a full `nn.Module` object rather than a `state_dict` cannot load under the restriction — PyTorch's own guidance is to use `weights_only=False` for those. That is a decision to trust the file's origin, so it belongs with provenance evidence and a scan, not with a blanket rule.
- **Residual risk**: the restriction removes arbitrary code execution. It does not remove denial of service through huge allocations, does not guarantee freedom from memory-corruption defects in the parser, and does nothing about poisoning inside the weights.

## Scanning model artifacts with ModelScan

**ModelScan** is an open-source scanner (originally from Protect AI, since acquired by Palo Alto Networks) that inspects model files for unsafe deserialization operators without executing the model. It covers pickle-based formats (PyTorch, scikit-learn, XGBoost), TensorFlow SavedModel protobufs, Keras H5 and V3, and the cloudpickle, dill, and joblib variants.

```bash
pip install modelscan

# Scan a file or a directory of model artifacts. The path flag is -p / --path.
modelscan -p ./models/

# Machine-readable output for a pipeline to gate on:
modelscan -p ./models/ -r json -o modelscan-report.json
```

ModelScan reports issue counts by severity and exits non-zero when it finds them, so a CI step gates on the exit status:

```yaml
# GitHub Actions step — fails the job on a non-zero scan exit status.
- name: Scan model artifacts
  run: modelscan -p ./ml_models/
```

An illustrative console summary for a backdoored file — the exact layout varies by version:

```text
--- Summary ---
Total Issues: 1
Total Issues By Severity:
    - CRITICAL: 1
Unsafe operator found: 'system' from module 'os' in models/model.pkl
```

Scanning is opcode pattern matching against known-dangerous operators. A clean scan is evidence that no recognized unsafe operator is present; it is not proof that the artifact is safe.

## What the controls do not address

Everything above concerns the *container*. Three risks sit outside it:

- **Weight-level backdoors.** A model trained or fine-tuned to behave adversarially on a trigger input loads cleanly through safetensors and passes every scanner. Detecting it is an evaluation problem, not a deserialization one.
- **Provenance.** Format safety says nothing about whether the artifact is the one the publisher produced. That needs signing or an access-controlled registry with verifiable lineage.
- **Everything alongside the weights.** Custom modeling code, tokenizer configuration, and remote-code loading options can execute independently of how the tensors are stored.

## Diagnostic checklist

When auditing model ingestion pipelines and registries, evaluate these six criteria:

| Diagnostic area | Evaluation question | Audit evidence |
|---|---|---|
| **Format policy** | Are new artifacts stored as safetensors by default, with remaining pickle files inventoried rather than assumed absent? | Registry inventory by file extension. |
| **Loader configuration** | Is `weights_only=True` used for `state_dict` loads, with any `weights_only=False` call justified by provenance and a scan? | Code review &amp; static analysis results. |
| **Automated scanning** | Are incoming weights scanned before promotion, with the pipeline gating on the scan's exit status? | Pipeline logs &amp; scan reports. |
| **Hub scan status** | Does ingestion check the hub's own malware and pickle scan status before pulling? | Ingestion verification logs. |
| **Provenance** | Are weights signed, or pulled from an access-controlled registry with verifiable lineage? | Registry signatures &amp; access logs. |
| **Runtime version** | Are runtimes on PyTorch 2.6 or later so the restricted loader is the default? | Dependency pins &amp; container base image tags. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Pickle-based model files execute code during <code>torch.load()</code>, before there is anything to inspect. <code>weights_only=True</code> restricts the unpickler and is the default from PyTorch 2.6 when <code>pickle_module</code> is not passed; safetensors removes the opcode stream entirely. Both protect the container, not the weights — a backdoored model loads cleanly through either.</p>
</div>

## Primary references

- **[PyTorch serialization notes](https://docs.pytorch.org/docs/main/notes/serialization.html)** — verified the `weights_only` mechanism, the 2.6 default and its `pickle_module` condition, the `nn.Module` exception, and the stated residual risks.
- **[safetensors](https://github.com/safetensors/safetensors)** — verified the header-plus-buffer structure and zero-copy loading.
- **[Safetensors audited as really safe](https://huggingface.co/blog/safetensors-security-audit)** — verified the audit scope, the absence of critical findings, and the medium-severity issues that were fixed.
- **[ModelScan](https://github.com/protectai/modelscan)** — verified the CLI flags, supported formats, and reporting options.
