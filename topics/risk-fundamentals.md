---
title: Threats, Vulnerabilities & Risk
description: My foundation for assets, threats, vulnerabilities, likelihood, impact, controls, treatment, and residual risk.
permalink: /topics/risk-fundamentals/
last_verified: 2026-08-05
---

<span class="eyebrow">Security Foundations / Concepts</span>

# Threats, Vulnerabilities & Risk

<p class="lede">Risk connects something I value to possible harm. I do not treat every vulnerability as equally urgent: I ask which threat could exploit or trigger it, what impact would follow, how likely that scenario is, which controls already change it, and what risk remains.</p>

## What: keep the parts of risk separate

My shortest model is:

> A threat event exploits or triggers a vulnerability, causing an impact to an asset. Existing controls change the likelihood, impact, or time needed to detect, respond, and recover.

| Term | Meaning in my assessment |
|---|---|
| **Asset** | A person, service, process, dataset, device, facility, reputation, or other thing of value |
| **Threat source** | The actor, condition, accident, or environmental cause that could create harm |
| **Threat event** | The harmful event or action that may occur |
| **Vulnerability** | A weakness in design, implementation, configuration, process, or control that the event could exploit or trigger |
| **Likelihood** | How plausible the event and resulting impact are under the stated conditions |
| **Impact** | The harm to operations, assets, people, other organizations, or obligations |
| **Risk** | The significance of the possible harm, considering likelihood and impact |
| **Control** | A safeguard or countermeasure intended to change the risk |
| **Residual risk** | The risk remaining after existing or planned responses are considered |

These terms follow the risk factors used in [NIST SP 800-30 Rev. 1](https://csrc.nist.gov/pubs/sp/800/30/r1/final). `Likelihood × impact` is a useful reminder, not a universal mathematical formula. A number is only useful when the underlying scenario, assumptions, scale, evidence, and uncertainty are clear.

## So what: a vulnerability is not the whole risk

Suppose a payroll service allows administrators to change employee bank details:

- employee salary data and payments are the **assets**;
- a criminal using stolen administrator credentials is the **threat scenario**;
- broad administrator access and no independent approval are **vulnerabilities**;
- diverted salary, recovery work, distress, and loss of trust are possible **impacts**;
- phishing-resistant authentication, narrow privileges, dual approval, change alerts, and audit logs are **controls**.

The severity of one software flaw does not answer the whole risk question. I still need to know whether the vulnerable component is reachable, whether the attacker has the required conditions, what data or action is exposed, which controls interrupt the path, and what harm would result.

The reverse is also true: serious risk can exist without a software vulnerability. A critical service may depend on one supplier, one administrator, one region, or an unsafe business process.

## Assess risk as a scenario

For each material scenario, I record:

1. **Scope and assumptions.** Which system, process, time period, and operating conditions am I assessing?
2. **Asset and objective.** What matters, and which security property could be lost?
3. **Threat source and event.** Who or what could cause the harm, and what would happen?
4. **Vulnerability or predisposing condition.** Why could the event succeed or have serious consequences?
5. **Existing controls.** Which controls are actually operating, and what evidence supports that claim?
6. **Likelihood and impact.** What supports the rating, and how uncertain is it?
7. **Risk response.** Who owns the decision, what will change, and by when?
8. **Residual risk.** What remains, who accepts it, and what should trigger reassessment?

I avoid false precision. A qualitative `low / medium / high` scale can work when its criteria are defined. A score such as `4 × 5 = 20` does not become objective merely because it uses numbers.

## Now what: choose and verify a risk response

I can:

- **Avoid** the risk by stopping the activity that creates it.
- **Reduce** likelihood or impact with controls.
- **Share or transfer** some consequences through another party, contract, or insurance without assuming responsibility disappears.
- **Accept** the residual risk when the authorized owner understands the basis and consequences.

For the payroll example, requiring independent approval may reduce the likelihood that one compromised account can redirect a payment. I then test the real workflow: can the same person still initiate and approve through another role, API, emergency path, or shared account? The control is not validated until the failure path has been exercised.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>I assess a risk scenario, not a vulnerability in isolation. I connect the asset, threat event, weakness, likelihood, impact, controls, evidence, owner, and residual risk.</p>
</div>

## Primary references

- **[NIST SP 800-30 Rev. 1](https://csrc.nist.gov/pubs/sp/800/30/r1/final)** — risk factors and assessment process.
- **[NIST risk glossary](https://csrc.nist.gov/glossary/term/risk)** — risk definitions from NIST publications.
- **[NIST security-control glossary](https://csrc.nist.gov/glossary/term/security_control)** — safeguards and countermeasures.
