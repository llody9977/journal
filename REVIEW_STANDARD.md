# Journal review standard

## Purpose and applicability

This file defines the required procedure for reviewing journal content. It applies to human reviewers and LLM-assisted reviews of a page, section, or the complete journal.

Before reviewing, read this file and [`WRITING_STYLE.md`](WRITING_STYLE.md) completely. Review the current repository files as the source of truth. Earlier review reports, conversation summaries, diffs, and statements that an issue was fixed are context only; they are not evidence that the current content is correct.

Reviewing is read-only by default. Do not edit, rewrite, regenerate, commit, or push files unless the user explicitly requests implementation.

## Review modes

### Targeted verification

Use targeted verification when the request names specific fixes or previously reported findings.

- Inspect each named finding in the current source.
- Inspect every direct repetition of the finding in summaries, metadata, tables, diagrams, captions, alt text, examples, code, and scripts.
- Report only findings that remain open when that is what the user requests.
- State that the result is targeted verification. Do not describe it as a fresh, complete, final, or gap-free review.

### Fresh review

Use a fresh review when the request asks for a fresh, clean, full, complete, final, or gap assessment.

- Reread every current in-scope source file completely.
- Inventory and inspect every associated table, diagram, image, caption, alt text, animation, video, script, code example, command, displayed output, downloadable asset, front-matter field, description, summary, and navigation label.
- Apply every mandatory review dimension below. Do not limit the review to previously reported findings.
- Perform correctness, cross-format, cross-page, and knowledge-gap passes separately so that one does not substitute for another.

### Gap analysis

Gap analysis is mandatory during every fresh review. Determine whether the page or section omits knowledge necessary to understand, evaluate, or apply its subject correctly.

Evaluate, where applicable:

- foundational definitions and prerequisites;
- boundaries between commonly confused concepts;
- mechanism, actors, data flow, and operating sequence;
- security properties and threat model;
- assumptions, trust boundaries, and environmental dependencies;
- limitations, edge cases, failure modes, and residual risk;
- operational constraints and numerical limits;
- selection criteria and appropriate use;
- deprecated, unsafe, or incompatible alternatives;
- migration, interoperability, lifecycle, and recovery implications.

Classify omissions separately as required foundational gaps or optional advanced coverage. Do not present optional enrichment as a correctness defect.

## Mandatory review dimensions

For every in-scope artifact, review:

1. Factual and technical correctness.
2. Overclaim, underclaim, misleading framing, and unjustified certainty.
3. Normative strength and standards, legal, regulatory, or framework attribution.
4. Version, publication status, effective date, jurisdiction, system scope, and applicability.
5. Terminology, taxonomy, and conceptual-boundary accuracy.
6. Internal contradictions within each page.
7. Cross-page consistency within the reviewed section.
8. Structure, sequence, information flow, duplication, and narrative drift.
9. Missing prerequisites, limitations, failure cases, and decision context.
10. Numerical limits, formulas, thresholds, SLAs, performance claims, and illustrative values.
11. Source-to-claim support using current primary sources.
12. Cross-format consistency across prose and every associated asset.
13. Front matter, title, description, lede, navigation, caption, alt text, and summary consistency.
14. Code, script, command, demonstration, and displayed-output correctness.
15. Whether illustrative, hypothetical, locally defined, or author-created material is clearly identified.

## Required review procedure

A fresh review must follow this procedure:

1. **Resolve scope**: identify every in-scope page and associated asset before evaluating content.
2. **Identify the reviewed state**: record the current commit identifier and whether the worktree contains uncommitted changes.
3. **Read current sources**: review the main files rather than relying on diffs, comments, or earlier findings.
4. **Build claim coverage**: identify material statements that affect security, compliance, protocol behavior, implementation behavior, or an engineering decision.
5. **Verify evidence**: check security-sensitive, standards-sensitive, and time-sensitive claims against current primary sources.
6. **Run an adversarial claim pass**: challenge absolute wording, implicit assumptions, category boundaries, causal claims, and what a cited source actually proves.
7. **Run a cross-format and cross-page pass**: compare repeated claims, terminology, metadata, diagrams, captions, examples, and summaries.
8. **Run a knowledge-gap pass**: compare the content with the applicable gap-analysis dimensions above.
9. **Run mechanical validation**: execute applicable syntax, link, script, demonstration, and artifact-integrity checks. State what each check does and does not prove.
10. **Report the result**: separate required corrections, optional coverage, and review limitations. Report only open findings when requested.

## Closure requirements

Do not state or imply that content is “all fixed,” “fully resolved,” “gap-free,” “final,” or equivalent unless:

- every in-scope file and asset was inventoried and inspected;
- every mandatory review dimension was applied;
- all material standards-sensitive and time-sensitive claims were checked against current primary sources;
- separate adversarial-claim, cross-format, cross-page, and knowledge-gap passes were completed;
- applicable mechanical checks were run;
- the reviewed commit or worktree state is identified; and
- unresolved limitations or uncertainty are disclosed.

Passing an automated structural check does not establish factual accuracy, standards compliance, security, semantic completeness, or cross-format consistency. When only targeted verification was performed, say so and do not infer broader closure.

## Required review output

Each open finding must identify:

- the affected page or asset and location;
- the exact statement, omission, or inconsistency;
- its classification and practical impact;
- why it is incorrect, misleading, incomplete, or unsupported;
- a current primary source when external verification is applicable; and
- whether it is a required correction or optional addition.

Do not repeat closed findings when the user asks for open items only. Do not silently convert an optional improvement into a mandatory requirement.

## Persistent review record

For a formal page or section review, a review record may be maintained under `reviews/` when the user authorizes repository changes. The record should contain:

- review date;
- commit identifier and worktree state;
- files and assets inspected;
- review dimensions completed;
- mechanical checks executed;
- open required findings;
- optional coverage gaps; and
- known review limitations.

The record is evidence of coverage for that repository state, not permanent proof that later content remains correct. A fresh review must still inspect the current sources.
