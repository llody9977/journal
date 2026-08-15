---
title: "GRC Strategy: Framework Stacking & Assessment Models"
description: Technical reference for combining NIST CSF 2.0, ISO 27001, CIS Controls, and SOC 2 into one non-redundant stack, and for choosing between risk-driven and control-driven assessment.
permalink: /topics/grc-framework-strategy/
last_verified: 2026-08-15
---

<span class="eyebrow">Governance, Risk & Compliance / Deep Dive</span>

# GRC Strategy: Framework Stacking & Assessment Models

<p class="lede">Governance, Risk, and Compliance (GRC) strategy requires combining frameworks into a unified, non-redundant security stack. Rather than viewing standards as competing silos, mature engineering organizations use NIST CSF 2.0 for executive vocabulary, CIS Controls IG1 for technical hygiene, NIST SP 800-53 for control catalogs, and ISO 27001 / SOC 2 Type II for third-party audit evidence.</p>

## The Four-Layer Unified Framework Stack

Production GRC programs avoid running parallel compliance audits by layering standards according to operational function:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/grc-framework-stack.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the grc framework stack diagram at full size">
    <img src="{{ '/assets/img/grc-framework-stack.svg' | relative_url }}" alt="Layered relationship between governance frameworks, control catalogs, domain standards, and assurance or attestation.">
  </a>
  <p class="diagram-caption">Frameworks serve different layers of the security program</p>
</div>

NIST publishes explicit **[Online Informative References (OLIR)](https://www.nist.gov/cyberframework/informative-references)** mapping NIST CSF subcategories to NIST SP 800-53, ISO 27001 Annex A, and CIS Controls. NIST describes these mappings as informative rather than normative: NIST performs only limited conformance testing on submitted mappings, does not conduct correctness testing on non-NIST submissions, and states that inclusion in the catalog does not imply NIST endorsement of the mapping's accuracy. Operating against CIS Controls IG1 therefore gives an indicative cross-reference into related ISO 27001 and NIST CSF requirements that can accelerate a gap analysis — it does not by itself satisfy those frameworks' actual requirements, which still need to be verified directly against each target framework's text and audit criteria.

## Control-Driven vs Risk-Driven Assessment Models

Organizations evaluate security posture using two fundamental paradigms:

| Dimension | Control-Driven (Compliance Model) | Risk-Driven (Threat-Informed Model) |
|---|---|---|
| **Starting Point** | Predefined control list (*e.g., CIS 18, NIST 800-53*) | Asset, threat actor, and impact identification (*e.g., NIST 800-30*) |
| **Primary Question** | "Which controls on this list are missing or unconfigured?" | "Which plausible threat scenarios create unacceptable business loss?" |
| **Primary Metric** | Control implementation percentage (*Gap Analysis*) | Qualitative (Low/Med/High) or Quantitative ($Financial Loss Exposure) |
| **Core Strength** | Auditability, rapid baseline deployment, customer questionnaire readiness | Targeted resource allocation, protection against org-specific threats |
| **Primary Risk** | "Compliance Trap": Passing audits while remaining vulnerable to unlisted threats | High operational effort; difficult to map directly to external questionnaires |
| **Standard Frameworks** | CIS Controls, NIST SP 800-53, PCI DSS | **[NIST SP 800-37 RMF](https://csrc.nist.gov/pubs/sp/800/37/r2/final)**, **[ISO/IEC 27005:2022](https://www.iso.org/standard/80585.html)**, **[Open FAIR](https://www.opengroup.org/open-fair)** |

### Quantitative Risk Modeling: The FAIR Model

The **Factor Analysis of Information Risk (FAIR)** framework, standardized by The Open Group as the **[Open FAIR](https://www.opengroup.org/open-fair)** body of knowledge (the Risk Taxonomy *O-RT* and Risk Analysis *O-RA* standards), translates qualitative risk ratings into financial loss exposure:

<p class="formula"><strong>Risk = Loss Event Frequency &times; Loss Magnitude</strong></p>

The taxonomy decomposes each side further:

- **Loss Event Frequency** = Threat Event Frequency &times; **Vulnerability**, where Vulnerability is itself derived by comparing **Threat Capability** against the control's **Resistance Strength**. Vulnerability is a named factor in the taxonomy, not a loose synonym for "control efficacy."
- **Loss Magnitude** = Primary Loss (incident response effort, productivity loss, asset replacement) plus **Secondary Risk**. Secondary Risk is itself a frequency-times-magnitude term — the likelihood that stakeholders such as regulators, customers, or litigants react, multiplied by the cost when they do — rather than a flat additive figure for fines and reputational damage.

Quantifying risk in financial figures enables security leadership to justify control investments to executive boards using standard business metrics. The estimates remain estimates: FAIR's discipline is in decomposing a judgment into factors that can each be argued about separately, not in producing a defensible single number.

## Who owns which decision

A framework stack does not assign accountability by itself, and two failure modes follow from leaving that implicit: the team that operates a control also attests that it works, or nobody owns the residual risk that a control was never funded.

The **[IIA Three Lines Model](https://www.theiia.org/en/content/position-papers/2020/the-iias-three-lines-model-an-update-of-the-three-lines-of-defense/)** is the common reference for separating those roles. Its 2020 update deliberately moved away from the older "three lines of defense" framing: the lines describe *roles and their relationships*, not a sequence of barriers, and the model does not require three separate org units.

| Role | Owns | In a security program |
|---|---|---|
| **Governing body** | Accountability to stakeholders; sets risk appetite | Board or risk committee approves the risk appetite that decides which findings are acceptable. |
| **Management (first and second roles)** | Delivering products and services, and managing risk | Engineering teams operate controls; a security or risk function sets policy, advises, and challenges. |
| **Internal audit (third role)** | Independent, objective assurance | Reports to the governing body, not to the function it assesses. |
| **External assurance providers** | Assurance outside the organization | ISO 27001 registrars, SOC 2 auditors, QSAs. |

The distinction that matters operationally is independence, not headcount. A ten-person startup cannot staff three lines, but it can still ensure that whoever signs off on a control's effectiveness is not the person who configured it, and that accepting a risk is a documented decision by someone with the authority to accept it.

**[NIST SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final)** frames the same separation vertically instead of horizontally, as risk decisions taken at the organization, mission/business-process, and information-system tiers, with risk appetite flowing down and risk information flowing up. Either framing works; what fails is having neither, so that risk acceptance happens implicitly whenever a backlog item is deprioritized.

## Defensive Implementation Roadmap for Emerging Organizations

For an emerging enterprise or startup establishing a security program from scratch, a common and reasonable implementation sequence progresses through five stages. The exact ordering and pace should still be adjusted for the organization's actual risk profile, industry, regulatory exposure, and resourcing — this is one illustrative starting sequence, not a universally optimal path:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/security-program-roadmap.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the security program roadmap diagram at full size">
    <img src="{{ '/assets/img/security-program-roadmap.svg' | relative_url }}" alt="Security program roadmap from essential technical hygiene through governance, product security, customer assurance, and an information security management system.">
  </a>
  <p class="diagram-caption">Build repeatable security capability before pursuing external assurance</p>
</div>

1. **Stage 1 (Technical Hygiene)**: Implement **[CIS Controls IG1](https://www.cisecurity.org/controls/implementation-groups)** (56 essential safeguards) to establish immediate defense against widespread automated attacks.
2. **Stage 2 (Strategic Vocabulary)**: Map security outcomes onto **NIST CSF 2.0** to communicate program status to executive leadership.
3. **Stage 3 (Product Security)**: Apply **OWASP ASVS Level 2** to the software development lifecycle to prevent application-layer vulnerabilities.
4. **Stage 4 (Customer Attestation)**: Undergo a **SOC 2 Type II audit** when enterprise B2B sales demand third-party attestation.
5. **Stage 5 (Global Certification)**: Pursue **ISO/IEC 27001:2022 certification** when expanding into international or heavily regulated markets.

### Automated GRC Evidence Collection Pipeline

Manual compliance evidence collection is error-prone and stale by audit time. A scheduled collector that queries cloud APIs and emits a dated evidence payload keeps the record current between audits. The script below covers one control — automatic rotation of customer-managed AWS KMS keys — and is written to fail loudly rather than under-report:

```python
#!/usr/bin/env python3
"""Automated GRC evidence collection: AWS KMS customer-managed key rotation status."""

import json
from datetime import datetime, timezone
import boto3

# Automatic rotation is available only for symmetric encryption keys whose material
# AWS generated. Asymmetric keys, HMAC keys, imported material, and custom key stores
# cannot be rotated automatically, and get_key_rotation_status raises
# UnsupportedOperationException for them. They are reported as not_applicable rather
# than skipped, so the population in the evidence file stays complete.
ROTATABLE = {"KeySpec": "SYMMETRIC_DEFAULT", "Origin": "AWS_KMS"}


def collect_kms_evidence() -> list[dict]:
    kms = boto3.client('kms')
    evidence = []
    collected_at = datetime.now(timezone.utc).isoformat()

    # list_keys returns at most 100 keys per call. Paginating is not optional here:
    # a truncated read produces an evidence file that looks complete and is not.
    for page in kms.get_paginator('list_keys').paginate():
        for key in page['Keys']:
            metadata = kms.describe_key(KeyId=key['KeyId'])['KeyMetadata']
            if metadata['KeyManager'] != 'CUSTOMER':
                continue

            record = {
                "resource_id": metadata['Arn'],
                "control_id": "ISO_27001_A.8.24_USE_OF_CRYPTOGRAPHY",
                "key_state": metadata['KeyState'],
                "collected_at": collected_at,
            }

            if all(metadata.get(k) == v for k, v in ROTATABLE.items()):
                rotation = kms.get_key_rotation_status(
                    KeyId=key['KeyId'])['KeyRotationEnabled']
                record["status"] = "compliant" if rotation else "non_compliant"
                record["evidence_detail"] = f"Automatic rotation enabled: {rotation}"
            else:
                record["status"] = "not_applicable"
                record["evidence_detail"] = (
                    f"Automatic rotation unavailable for KeySpec="
                    f"{metadata.get('KeySpec')} Origin={metadata.get('Origin')}; "
                    "rotation must be evidenced manually."
                )

            evidence.append(record)
    return evidence


if __name__ == "__main__":
    print(json.dumps(collect_kms_evidence(), indent=2))
```

What this proves and what it does not: it establishes the rotation setting on every customer-managed KMS key in one account and region at one point in time. It does not prove a rotation actually occurred, does not cover AWS-managed keys, does not span other accounts or regions, and — for keys marked `not_applicable` — leaves the control unevidenced rather than satisfied. An auditor will ask for the manual evidence covering that remainder.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>One practical startup sequence is technical hygiene → shared risk vocabulary → product security → customer attestation → certification, adjusted to the organization's risks, obligations, and resources; it is not a universal maturity model. Separating who operates a control from who attests that it works is what makes the evidence mean anything, and an automated collector only keeps that evidence current — it does not establish compliance, and a collector that silently reads a partial population is worse than none.</p>
</div>

## Primary references

- **IIA Three Lines Model**: *The IIA's Three Lines Model for Governance* — [IIA Three Lines](https://www.theiia.org/en/content/position-papers/2020/the-iias-three-lines-model-an-update-of-the-three-lines-of-defense/) — verified that the 2020 update describes roles and relationships rather than sequential lines of defense.
- **NIST SP 800-39**: *Managing Information Security Risk: Organization, Mission, and Information System View* — [NIST CSRC SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final) — verified the three-tier risk governance structure.
- **The Open Group Open FAIR**: *Risk Taxonomy (O-RT) and Risk Analysis (O-RA)* — [Open FAIR](https://www.opengroup.org/open-fair) — verified the Loss Event Frequency and Loss Magnitude decomposition and the named Vulnerability factor.
- **NIST OLIR**: *Online Informative References* — [NIST informative references](https://www.nist.gov/cyberframework/informative-references) — verified that submitted mappings are informative and are not correctness-tested by NIST.
