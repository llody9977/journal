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

#### Fix verification and semantic closure

When verifying a reported fix:

- Inspect the complete changed paragraph, table row, diagram region, code block, or section and its immediate context—not only the originally quoted phrase.
- Treat every new or rewritten material claim introduced by the fix as in scope, including comparisons, causal statements, qualifications, examples, threat-model assumptions, citations, and source-status labels.
- Apply the relevant mandatory review dimensions to the replacement text as though it were newly authored content.
- If the fix adds or removes substantial coverage, recheck the page's description, lede, summary, captions, navigation, cross-references, and `Primary References` section.
- Before reporting, perform a residual-exhaustion pass over the affected content unit and report all remaining issues together. Do not reveal one residual issue per verification cycle when the others are already discoverable.
- Keep this expansion bounded to the changed content and its direct dependents; it does not convert targeted verification into an unrelated fresh review.

### Fresh review

Use a fresh review when the request asks for a fresh, clean, full, complete, final, or gap assessment.

- Reread every current in-scope source file completely.
- Inventory and inspect every associated table, diagram, image, caption, alt text, animation, video, script, code example, command, displayed output, downloadable asset, front-matter field, description, summary, and navigation label.
- Apply every mandatory review dimension below. Do not limit the review to previously reported findings.
- Perform correctness, cross-format, cross-page, and knowledge-gap passes separately so that one does not substitute for another.

### Frozen review baseline

A fresh review applies to one immutable content state.

- Before evaluating claims, record the branch, commit identifier, clean or dirty worktree status, complete scope inventory, and a deterministic fingerprint of the in-scope files. `scripts/capture_review_state.py` is the repository helper for this record.
- Prefer a clean commit. If a dirty worktree must be reviewed, list every staged, unstaged, and untracked in-scope file; the commit identifier alone is not sufficient.
- Do not edit in-scope content during the review. If any in-scope file changes, the previous result no longer closes the current state. Capture a new baseline and repeat the affected passes.
- When implementation and review are requested together, treat them as separate phases: complete and validate the edits, freeze the resulting state, and only then begin the closure review.
- Earlier reports may guide investigation, but they must not pre-populate a current finding as open or closed.

### Durable content decisions and anti-flip-flop reconciliation

The repository records deliberate content decisions in [`reviews/CONTENT_DECISIONS.yml`](reviews/CONTENT_DECISIONS.yml). The register preserves the question, rationale, sources, approved outcome, and conditions that would justify reconsideration. It prevents a later reviewer from unknowingly reversing a decision while still allowing standards, implementations, and evidence to evolve.

- Evaluate the current source and primary evidence independently before consulting the register. A prior decision must not pre-populate a claim as correct or incorrect.
- After reaching a provisional disposition, search the register by affected file and concept. Use `python3 scripts/verify_content_decisions.py --file <path>` for a scoped lookup.
- For each applicable record, classify it as **reaffirmed**, **not applicable to this scope**, **reopened**, or **superseded**. Record the decision ID and rationale in the review artifact.
- Do not reverse an accepted or rejected decision merely because a new reviewer prefers different wording. Reopen it only when a recorded invalidation condition is met or when new evidence demonstrates that the earlier reasoning was materially incomplete or incorrect.
- A superseding decision must identify the earlier decision, the changed fact or scope, current primary evidence where applicable, and the replacement outcome. Preserve the earlier record as history rather than deleting or rewriting it.
- The register is review context, not evidence of current correctness. Current source inspection, current primary evidence, cross-format checks, rendered validation, and the frozen baseline remain mandatory.
- Add a decision record when feedback leads to a deliberate material change, a deliberate rejection, or a choice likely to recur. Minor copyedits that do not affect meaning do not need records.

The complete record format, lifecycle, and status meanings are defined in [`reviews/CONTENT_DECISION_GUIDE.md`](reviews/CONTENT_DECISION_GUIDE.md).

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

For each topic, explicitly mark each applicable completeness category as **covered**, **not applicable** with a reason, **required gap**, or **optional extension**:

1. Definition and purpose.
2. Scope and conceptual boundaries.
3. Actors, components, and assets.
4. Mechanism, data flow, or operating sequence.
5. Assumptions, prerequisites, and dependencies.
6. Threats, failure modes, and attacker state.
7. Limitations and residual risk.
8. Selection criteria and appropriate use.
9. Operations, observability, testing, and evidence.
10. Recovery, lifecycle, and revocation or retirement.
11. Interoperability and migration.
12. Deprecated, unsafe, or incompatible alternatives.

The categories are prompts, not a demand that every page contain twelve headings. Coverage may be supplied by a clearly linked prerequisite or neighboring page when that division is deliberate and the section remains usable.

## Review depth controls

Fresh review depth is demonstrated by review artifacts, not by the number of rereads or the confidence of the reviewer.

### Scope inventory

Inventory all in-scope pages and their direct dependents before evaluating content. Include front matter, navigation, summaries, citations, tables, diagrams, image metadata, interactive assets, downloadable files, code, scripts, generated counterparts, and shared styles that materially affect presentation.

### Material-claim ledger

Record every material claim that affects security properties, compliance or standards applicability, protocol or implementation behavior, numerical limits, threat models, or engineering decisions. For each claim, capture its location, classification, source or verification method, repeated representations, and disposition. Claims in diagrams, summaries, examples, and generated assets count independently.

Use the ledger to prevent sampling bias. Keyword searches may locate repetitions, but they do not replace reading or claim verification.

### Independent passes

Complete these passes separately and record their results:

1. Factual and technical correctness.
2. Evidence, authority, version, date, jurisdiction, and applicability.
3. Adversarial wording, assumptions, threat state, and counterexamples.
4. Terminology, taxonomy, and conceptual boundaries.
5. Cross-format consistency.
6. Cross-page consistency, prerequisites, sequencing, and duplication.
7. Topic completeness using the matrix above.
8. Mechanical, executable, link, generator, and rendered-output validation.
9. Decision-history reconciliation against applicable durable content decisions.
10. Residual exhaustion: reread each affected content unit after proposed fixes are known and look specifically for additional issues that the same reasoning exposes.

Do not combine targeted verification with fresh-review closure. A targeted check answers whether named changes worked; a fresh review asks what remains wrong or missing across the complete frozen scope.

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
16. Comparative-claim symmetry: verify every side of claims using "unlike," "whereas," "compared with," "alone," or equivalent wording against the same comparison axis and compromise scope.
17. Attacker-state precision: distinguish passive observation, active interaction, database-only disclosure, credential-file disclosure, required server-secret disclosure, full server compromise, direct credential reuse, offline recovery, and downstream impersonation.
18. Decision-history consistency: identify applicable durable decisions and require explicit evidence before reversing or superseding them.

## Required review procedure

A fresh review must follow this procedure:

1. **Resolve scope**: identify every in-scope page and associated asset before evaluating content.
2. **Freeze and identify the reviewed state**: record the branch, commit identifier, worktree status, scope inventory, and scoped fingerprint. Do not edit that state during review.
3. **Read current sources**: review the main files rather than relying on diffs, comments, or earlier findings.
4. **Build claim coverage**: create the material-claim ledger and the per-topic completeness matrix before drawing closure conclusions.
5. **Verify evidence**: check security-sensitive, standards-sensitive, and time-sensitive claims against current primary sources.
6. **Run an adversarial claim pass**: challenge absolute wording, implicit assumptions, category boundaries, causal claims, and what a cited source actually proves.
7. **Run a cross-format and cross-page pass**: compare repeated claims, terminology, metadata, diagrams, captions, examples, and summaries.
8. **Run a knowledge-gap pass**: compare the content with the applicable gap-analysis dimensions above.
9. **Run mechanical validation**: execute applicable syntax, link, script, demonstration, and artifact-integrity checks. State what each check does and does not prove.
   - For diagrams and other rendered assets, inspect the actual output in an applicable target browser or viewer. XML, HTML, or syntax validity does not prove that mathematical notation, text, positioning, clipping, or semantic relationships render correctly.
   - For downloadable or executable demonstration assets, verify separately:
     1. the property demonstrated by the asset; and
     2. the asset's claimed identity, provenance, or official-source attribution.
10. **Reconcile durable decisions**: after independently evaluating current claims, consult the content-decision register, record applicable decision IDs and dispositions, and resolve any conflict without silently inheriting or reversing the earlier decision.
11. **Run residual exhaustion**: after the other passes, reread every unit associated with a finding and challenge neighboring claims using the same rule or source.
12. **Report the result**: separate required corrections, optional coverage, and review limitations. Report only open findings when requested.

## Closure requirements

Do not state or imply that content is “all fixed,” “fully resolved,” “gap-free,” “final,” or equivalent unless:

- every in-scope file and asset was inventoried and inspected;
- the baseline remained unchanged throughout the review, or a new baseline was captured and affected passes were repeated;
- a material-claim ledger and per-topic completeness matrix were completed;
- every mandatory review dimension was applied;
- all material standards-sensitive and time-sensitive claims were checked against current primary sources;
- separate adversarial-claim, cross-format, cross-page, and knowledge-gap passes were completed;
- applicable mechanical checks were run;
- applicable durable content decisions were reconciled and any reversal or supersession was justified;
- a residual-exhaustion pass was completed after all other findings were assembled;
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

For every fresh page, section, or journal review, complete the fields in [`reviews/REVIEW_TEMPLATE.md`](reviews/REVIEW_TEMPLATE.md). When the user authorizes repository changes, save the record under `reviews/`. During a read-only review, do not create a file; provide equivalent state, coverage, findings, checks, and limitations in the response.

The record must contain:

- review date;
- commit identifier and worktree state;
- files and assets inspected;
- the scoped content fingerprint;
- the material-claim ledger or a durable link to it;
- the per-topic completeness matrix;
- review dimensions completed;
- mechanical checks executed;
- open required findings;
- optional coverage gaps; and
- known review limitations; and
- applicable durable decision IDs and their dispositions.

The record is evidence of coverage for that repository state, not permanent proof that later content remains correct. A fresh review must still inspect the current sources.
