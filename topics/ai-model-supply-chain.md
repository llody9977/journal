---
title: AI Model Supply Chain & Deserialization Safety
description: Comprehensive technical guide to AI model supply chain security, PyTorch pickle RCE vulnerabilities (`torch.load()`), `weights_only=True` enforcement, Safetensors zero-code deserialization, and ModelScan CLI static model scanning.
permalink: /topics/ai-model-supply-chain/
last_verified: 2026-08-13
---

<span class="eyebrow">AI & LLM Security / Model Security</span>

# AI Model Supply Chain & Deserialization Safety

<p class="lede">AI model files contain billions of numerical parameters, but traditional serialization formats—specifically Python pickle-derived formats like PyTorch `.pkl` or `.pth`—embed executable Python opcodes directly inside model files. Loading an untrusted PyTorch model file using `torch.load()` can execute arbitrary remote code on the host machine. Securing the AI model supply chain requires migrating to Safetensors, enforcing `weights_only=True` during legacy loading, and scanning model artifacts in CI/CD pipelines using ModelScan.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/ai-model-supply-chain.svg' | relative_url }}" alt="AI Model Supply Chain diagram comparing PyTorch pickle RCE risks with Safetensors byte buffers, ModelScan CLI, and Hugging Face Hub scanning.">
  <p class="diagram-caption">AI Model Supply Chain: PyTorch Pickle Arbitrary Code Execution vs Safetensors Zero-Code Deserialization Buffer &amp; CI/CD ModelScan Automated Pipeline</p>
</div>

## The PyTorch Pickle Deserialization RCE Vector

Legacy PyTorch model files (`.pkl`, `.pth`, `.bin`) rely on Python's native `pickle` module for object serialization. Pickle is not a static data format—it is a stack-based virtual machine language capable of constructing arbitrary Python objects and invoking system calls during unpickling:

<div class="diagram-frame">
  <img src="{{ '/assets/img/ai-model-supply-chain.svg' | relative_url }}" alt="PyTorch Pickle Arbitrary Code Execution diagram.">
  <p class="diagram-caption">PyTorch Pickle RCE Mechanism: Unpickling Stack &leftrightarrow; Magic Reduce Method &leftrightarrow; Arbitrary Shell Execution</p>
</div>

When a application loads a model using `torch.load("model.pkl")`, the unpickler executes any embedded `__reduce__` methods or system calls before returning control to the caller. This enables adversaries to craft backdoored model files that compromise ML inference servers upon model initialization.

## Safetensors vs. PyTorch Pickle Format Comparison

To eliminate pickle deserialization attacks, Hugging Face developed **Safetensors** (`.safetensors`), an open format designed specifically for secure tensor storage:

| Security &amp; Operational Dimension | PyTorch Pickle (`.pth` / `.bin` / `.pkl`) | Safetensors (`.safetensors`) |
|---|---|---|
| **Serialization Mechanism** | Executable Python `pickle` opcodes. | JSON header (metadata) + raw byte tensor buffer. |
| **Deserialization RCE Risk** | **CRITICAL RISK**: Arbitrary Python code execution during load. | **ZERO RCE RISK**: Header parsing executes zero code; only reads tensor shapes &amp; dtypes. |
| **Loading Performance** | Slow Python object reconstruction. | Fast zero-copy memory mapping (`mmap`). |
| **Ecosystem Status** | Legacy default in PyTorch ecosystem. | Recommended standard across Hugging Face &amp; modern ML tooling. |

## Mitigating Legacy Models: `weights_only=True`

When legacy PyTorch models cannot be converted immediately to Safetensors, developers must enforce the `weights_only=True` parameter in `torch.load()`:

```python
import torch

# UNSAFE LEGACY LOAD (Executes arbitrary pickle code):
# model = torch.load("untrusted_model.pth")

# SECURE SAFEGUARD LOAD (Restricts unpickling to tensor data only):
model = torch.load("untrusted_model.pth", weights_only=True)
```

- **Mechanism**: `weights_only=True` configures an explicit allowlist of safe PyTorch tensor types, blocking unpickling of arbitrary Python modules (*e.g. `os.system`, `subprocess.Popen`*).
- **Default Status**: In PyTorch 2.6+, `weights_only=True` became the default setting for `torch.load()`.
- **Residual Risk**: While `weights_only=True` eliminates arbitrary code execution, it does not guard against parser memory-corruption flaws, denial-of-service via huge allocations, or data poisoning inside the weights themselves.

## Model Scanning Automation via ModelScan CLI

**ModelScan** is an open-source security tool developed by Protect AI that inspects model files for unsafe deserialization operators across PyTorch, Pickle, Keras (HDF5), and TensorFlow (Protobuf) formats without executing the model logic:

```bash
# Install ModelScan
pip install modelscan

# Scan a directory of model artifacts in a CI/CD pipeline
modelscan -d ./models/

# Example Output for a backdoored model:
# --- Summary ---
# Total Issues: 1 (CRITICAL: 1)
# Unsafe operator found: 'system' from module 'os' in model.pkl
```

### Automating Model Validation in CI/CD Pipelines
Integrating ModelScan into CI/CD build runners prevents malicious or unauthorized model formats from reaching production inference clusters:

```yaml
# GitHub Actions CI Step
- name: Scan Model Artifacts
  run: |
    modelscan -d ./ml_models/ --fail-on-error
```

## Essential Model Supply Chain Diagnostic Checklist

When auditing AI model ingestion pipelines and model registries, evaluate these 6 criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Safetensors Adoption** | Are model artifacts stored and loaded exclusively in `.safetensors` formats across model registries? | Model storage inventory &amp; Hugging Face repo file extensions. |
| **Legacy `weights_only` Check** | Is `weights_only=True` explicitly passed to all `torch.load()` invocations when loading legacy PyTorch files? | Python code review &amp; static analysis SAST scan results. |
| **Automated Model Scanning** | Are incoming model weights scanned via ModelScan CLI before deployment to staging/production clusters? | CI/CD build pipeline logs &amp; ModelScan scan reports. |
| **Hugging Face Security Badges** | Does the model ingestion pipeline verify Hugging Face security scan status and malware signatures? | Model ingestion pipeline verification logs. |
| **Model Registry Provenance** | Are model weights signed using cryptographic signatures or stored in access-controlled ML registries (e.g. MLflow, W&B)? | MLflow model registry signatures &amp; S3 bucket access logs. |
| **PyTorch Version Enforcement** | Are ML runtime environments updated to PyTorch 2.6+ to ensure `weights_only=True` is enforced by default? | Python environment `requirements.txt` &amp; container base image tags. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>PyTorch pickle model files (`.pkl`, `.pth`) enable arbitrary Remote Code Execution during `torch.load()`. Eliminate this vulnerability by adopting Safetensors zero-code format, enforcing `weights_only=True` for legacy loads, and scanning model files using ModelScan.</p>
</div>

## Primary references

- **PyTorch Serialization Notes**: *PyTorch torch.load Security Documentation* — [PyTorch Docs](https://docs.pytorch.org/docs/main/notes/serialization.html)
- **Hugging Face Safetensors**: *Safetensors Library Documentation* — [Safetensors GitHub](https://github.com/huggingface/safetensors)
- **Protect AI ModelScan**: *Open Source Model Security Scanner* — [ModelScan GitHub](https://github.com/protectai/modelscan)
