# Repository instructions

These instructions apply to the entire repository.

Before writing or editing journal content, read and follow [`WRITING_STYLE.md`](WRITING_STYLE.md). It defines the required voice, US English conventions, recall-first explanations, approved writing frameworks, technical accuracy checks, and citation practices.

Before reviewing journal content, read and follow both [`WRITING_STYLE.md`](WRITING_STYLE.md) and [`REVIEW_STANDARD.md`](REVIEW_STANDARD.md) completely. The current source files are authoritative; do not assume that earlier pages, review comments, or statements that an issue was fixed are accurate.

Reviewing is read-only unless the user explicitly requests changes. Do not edit, rewrite, regenerate, commit, or push files during a review-only request.

Interpret **verify** as targeted verification of the named findings. Interpret **fresh review**, **clean review**, **full review**, **complete review**, **final pass**, or **determine gaps** as a complete current-source review using every mandatory dimension and closure requirement in `REVIEW_STANDARD.md`.

Do not claim that all issues are fixed or that a review is complete unless the closure requirements in `REVIEW_STANDARD.md` have been satisfied and the reviewed commit or worktree state is identified.

## Review discipline and durable state

Every new chat and reviewer must treat a review as an auditable examination of one frozen repository state, not as a continuation of earlier review conclusions.

- Before a fresh review, capture the exact branch, commit, worktree status, scope inventory, and scoped content fingerprint. Use `scripts/capture_review_state.py` when available. A clean commit is the preferred baseline.
- Do not change in-scope files while reviewing that baseline. If the state changes, capture a new baseline and repeat every pass affected by the change. A full-scope closure claim requires closure against the final state.
- Build and retain a scope inventory, material-claim ledger, cross-format/cross-page ledger, and per-topic completeness matrix. A review based only on prior findings, diffs, keyword searches, or automated checks is not a fresh review.
- Perform correctness, evidence/currentness, adversarial-claim, conceptual-boundary, cross-format, cross-page, completeness, mechanical, and residual-exhaustion passes separately. Record each pass; do not infer one from another.
- Review diagrams and interactive or executable assets as independent technical artifacts, then compare them with their prose, captions, alt text, and generators.
- After fixes, first finish and validate the implementation, then freeze the resulting state and run semantic closure on the complete affected units. Do not alternate between fixing one reported sentence and discovering the next already-present issue.
- For a fresh page, section, or journal review, use `reviews/REVIEW_TEMPLATE.md`. If repository writes are authorized, save the completed record under `reviews/`; otherwise include the same evidence in the response without changing files.
- Treat a large set of newly reported, previously discoverable issues on an unchanged scope as evidence that the earlier review did not reach the required depth. Acceptable exceptions are newly introduced changes, newly published authoritative information, an explicitly expanded scope, or a disclosed prior limitation.
- After independently evaluating the current source and evidence, consult [`reviews/CONTENT_DECISIONS.yml`](reviews/CONTENT_DECISIONS.yml) for applicable accepted, rejected, or superseded decisions. Earlier decisions are context, not proof, but do not reverse one silently: either reaffirm it, identify a genuinely different scope, or document the changed source, standard, implementation, or reasoning that justifies superseding it. Follow [`reviews/CONTENT_DECISION_GUIDE.md`](reviews/CONTENT_DECISION_GUIDE.md).
