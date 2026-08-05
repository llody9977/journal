---
title: "Cybersecurity Standards & Frameworks"
description: What NIST CSF, NIST 800-53, ISO 27001, OWASP's standards, CIS Controls, CISA's CPGs, and SOC 2 each actually are, what they're for, and when to reach for each one.
permalink: /topics/cybersecurity-standards/
last_verified: 2026-07-28
---

<span class="eyebrow">Governance, Risk & Compliance / Deep Dive</span>

# Cybersecurity Standards & Frameworks

<p class="lede">These names get used almost interchangeably in conversation — "we need to be NIST compliant," "let's do ISO," "are we SOC 2 yet" — but they're not interchangeable. Some are voluntary guidance, some are certifiable management-system standards, some are literal audits, and some are checklists aimed at a specific kind of organization. Picking the wrong one for the job wastes a lot of a small team's time.</p>

## The landscape, at a glance

| Standard | Type | What it actually is | Who it's for |
|---|---|---|---|
| NIST CSF 2.0 | Voluntary framework | A common vocabulary and outcome list (Govern/Identify/Protect/Detect/Respond/Recover) for organizing a cybersecurity program | Any organization wanting a structured starting point, no certification involved |
| NIST SP 800-53 | Control catalog | An exhaustive, specific list of security controls, originally for U.S. federal systems | Federal agencies/contractors (mandatory); anyone else wanting a detailed control catalog to implement against |
| ISO/IEC 27001:2022 | Certifiable standard | Requirements for an Information Security Management System (ISMS) — a certification an external auditor issues | Organizations that need to *prove* a security program to customers/regulators via a recognized certificate |
| ISO/IEC 27002:2022 | Companion guidance | Implementation guidance for the Annex A controls 27001 requires you to select from | Anyone implementing 27001, for the "how" behind the "what" |
| OWASP Top 10 | Awareness document | The current consensus list of the most critical web application security risks | Developers and AppSec teams; a floor, not a complete program |
| OWASP ASVS | Verification standard | A leveled (L1/L2/L3) checklist of specific, testable application security requirements | Teams that need something more rigorous and testable than the Top 10 to build or audit against |
| OWASP SAMM | Maturity model | Assesses and improves an organization's *software security practices* themselves, not one application | Engineering orgs wanting to measure and grow their AppSec program over time |
| CIS Controls v8 | Prioritized control list | 153 safeguards grouped into 18 Controls, explicitly prioritized by real-world attack prevalence | Any organization, especially ones wanting a concrete "start here" list rather than a large abstract catalog |
| CISA CPGs | Baseline goals | A voluntary, minimum baseline of high-impact practices for critical infrastructure | Critical infrastructure operators, and small/under-resourced organizations generally as a floor |
| SOC 2 | Audit report | An independent auditor's report on whether specific controls operated effectively over a period | SaaS/service companies that need to prove security posture to enterprise customers contractually |

## NIST CSF 2.0: the organizing vocabulary

CSF 2.0 (2024) restructured the Framework around **six Functions**: the original Identify, Protect, Detect, Respond, Recover, plus a new **Govern** function added specifically to elevate cybersecurity governance and strategy to the same level as the operational functions. Each Function breaks into Categories and Subcategories — specific outcomes, not specific technical controls. CSF is explicitly a *voluntary* framework: it tells you what outcomes a mature program achieves, not which exact product or control implements them, which is precisely why it's usually the first framework an organization reaches for — it's vocabulary and structure, not a compliance obligation.

CSF also defines **Tiers** (Partial, Risk Informed, Repeatable, Adaptive) describing the rigor of an organization's risk *governance* practices. These are commonly mislabeled as a maturity scale; the [Security Maturity Models]({{ '/topics/security-maturity-models/' | relative_url }}#nist-csf-tiers-not-a-maturity-model-on-purpose) page covers why that's a meaningful distinction, not just semantics.

## NIST SP 800-53: the control catalog underneath

Where CSF describes outcomes, [NIST SP 800-53](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) enumerates the actual controls — specific, numbered, testable requirements (access control, audit logging, configuration management, and so on) originally built for U.S. federal information systems (FISMA) and mandatory for that world. NIST maintains an explicit crosswalk mapping 800-53 controls to CSF Subcategories, which is exactly how organizations outside the federal space often use it: CSF says *what outcome* Category X needs; 800-53 supplies a candidate list of *specific controls* that satisfy it.

## ISO/IEC 27001:2022 and 27002:2022: the certifiable pair

27001 is the standard an external auditor certifies an organization *against* — it requires establishing an ISMS, doing a risk assessment, and producing a **Statement of Applicability** justifying which of the 93 Annex A controls (organized into four themes — Organizational, People, Physical, Technological) are implemented or explicitly excluded based on that risk assessment. Certification runs a two-stage audit (documentation review, then an implementation audit), and the certificate is valid for three years subject to annual surveillance audits. 27002 is the separate document that actually explains *how* to implement each Annex A control — 27001 says "select and justify"; 27002 is the reference for what "good" looks like for each selected control.

The practical distinction from CSF: 27001 is something a customer or regulator can verify independently, because a named accredited body issued a certificate. CSF has no certification at all — it's self-assessed.

## OWASP's three, and how they're not the same thing

- **[OWASP Top 10](https://owasp.org/www-project-top-ten/)** (currently the **2025** edition, released January 2026, superseding 2021) is "a standard awareness document for developers and web application security" — a ranked list of the most critical risk *categories* (Broken Access Control leads both the 2021 and 2025 editions). It's a floor for awareness, not a testable checklist.
- **[OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)** turns that awareness into specific, verifiable requirements at three cumulative levels: **L1** covers controls defendable "from the outside" against easily-discovered, opportunistic attacks; **L2** ("Standard," recommended for most applications handling sensitive data) adds requirements needing both automated and manual/code-level review; **L3** is for high-assurance applications (financial, health, government) and substantially expands scope again. Each level fully contains the one below it.
- **[OWASP SAMM](https://owaspsamm.org/about/)** doesn't assess an application at all — it assesses the *organization's software security practices*, across 15 practices grouped into 5 business functions, each scored on its own 3-level maturity scale, letting a team target different maturity levels for different practices rather than a single overall score.

Put simply: Top 10 tells developers what to worry about, ASVS tells testers/auditors exactly what to check on one application, SAMM tells an engineering organization how to grow its security practices over time.

## CIS Controls v8: the prioritized, prescriptive list

153 Safeguards across 18 Controls, explicitly framed as "a prioritized set of CIS Safeguards to defend against the most prevalent cyber attacks" rather than an exhaustive abstract catalog. What makes CIS Controls distinctive for a resource-constrained team is **Implementation Groups**: IG1 is "essential cyber hygiene... every enterprise should apply," IG2 adds safeguards for organizations with more resources or higher risk, and IG3 is the full 153-safeguard set. IG1 alone is frequently the concrete "what do we actually do first" answer CSF and ISO 27001 both deliberately decline to give.

## CISA Cross-Sector Cybersecurity Performance Goals (CPGs)

CPGs are "a subset of cybersecurity practices... selected through a thorough process of industry, government, and expert consultation, aimed at meaningfully reducing risks," explicitly positioned as a voluntary baseline for critical infrastructure operators, and just as explicitly aimed at helping "small- and medium-sized organizations kickstart their cybersecurity efforts by prioritizing investment in a limited number of essential actions." In practice, CPGs and CIS Controls IG1 occupy very similar ground — both exist because CSF/ISO/800-53 are structurally unwilling to say "these ten things, in this order," and someone has to.

## SOC 2: the thing that isn't a framework at all

SOC 2 is an **audit report**, defined by the AICPA's five Trust Services Criteria — Security, Availability, Processing Integrity, Confidentiality, and Privacy — of which only **Security** is mandatory in every SOC 2 engagement; the other four are selected based on what the organization actually commits to. A SOC 2 report doesn't say "this company follows a good framework" — it says "an independent CPA firm tested these specific controls over this specific period and found them operating effectively" (Type II), or "designed appropriately as of a point in time" (Type I). This is why enterprise customers ask for it specifically: it's third-party-verified evidence, not a self-declared posture, and it's usually the single most common credential a B2B SaaS company is contractually required to produce.

## Common pitfalls

- **Treating CSF adoption as "compliance"** — there is no CSF certificate; a vendor or auditor claiming to "certify" an organization against CSF is not describing what NIST actually offers.
- **Confusing OWASP Top 10 coverage with a complete AppSec program** — it's explicitly an awareness list, not a verification standard; ASVS is the tool for that job.
- **Picking ISO 27001 or SOC 2 before establishing what a customer/regulator actually requires** — both are real investments of time and cost; the requirement should drive the choice, not the other way around.
- **Assuming a fixed hierarchy exists between these** — CSF, ISO 27001, CIS Controls, and CPGs are largely *parallel*, cross-referenced options, not tiers of a single ladder; the [GRC strategy]({{ '/topics/grc-framework-strategy/' | relative_url }}) page covers how they actually layer together in practice.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><a href="https://www.nist.gov/cyberframework">NIST Cybersecurity Framework</a> and <strong><a href="https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final">NIST SP 800-53</a></strong>. <a href="https://www.iso.org/standard/27001">ISO/IEC 27001:2022</a>. <a href="https://owasp.org/Top10/2025/">OWASP Top 10:2025</a>, <a href="https://owasp.org/www-project-application-security-verification-standard/">OWASP ASVS</a>, and <a href="https://owaspsamm.org/about/">OWASP SAMM</a>. <a href="https://www.cisecurity.org/controls/v8">CIS Controls v8</a> and its <a href="https://www.cisecurity.org/controls/implementation-groups">Implementation Groups</a>. <a href="https://www.cisa.gov/cross-sector-cybersecurity-performance-goals-cpgs">CISA Cross-Sector CPGs</a>. AICPA's SOC 2 Trust Services Criteria (TSP Section 100).</p>
</div>
