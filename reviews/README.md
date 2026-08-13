# Review records

This directory stores auditable records for fresh page and section reviews. A record proves what was inspected, which review passes were completed, what remained open, and the exact repository state to which the result applies. It does not make the content permanently reviewed.

Start from [`REVIEW_TEMPLATE.md`](REVIEW_TEMPLATE.md). Capture the baseline before analysis:

```sh
python3 scripts/capture_review_state.py \
  --scope topics/security-fundamentals.md \
  --scope assets/img/risk-management-lifecycle.svg
```

For a complete section, list every page and associated asset explicitly. Save the JSON output outside the repository (for example, under `/tmp`) or copy its state identifier, commit, worktree status, and file inventory into the review record. Writing the snapshot itself into the repository would change the state it claims to freeze.

After independently reviewing the current source and evidence, reconcile applicable durable decisions using [`CONTENT_DECISION_GUIDE.md`](CONTENT_DECISION_GUIDE.md) and [`CONTENT_DECISIONS.yml`](CONTENT_DECISIONS.yml):

```sh
python3 scripts/verify_content_decisions.py \
  --file topics/security-fundamentals.md \
  --file assets/img/security-domains-overlap.svg
```

The register preserves rationale and prevents silent reversals; it does not replace current-source or primary-evidence verification.

Use these lifecycle rules:

1. **In progress** means one or more mandatory passes, files, claims, or checks remain.
2. **Complete with findings** means every mandatory pass is finished and all open required and optional items are recorded.
3. **Complete with no open findings** is allowed only when every closure condition in [`REVIEW_STANDARD.md`](../REVIEW_STANDARD.md) is evidenced.
4. Any in-scope content change invalidates closure for that state. Capture a new baseline and repeat the affected passes.
5. Fix verification is recorded separately from a fresh review and cannot inherit its closure label.
6. Applicable durable content decisions must be listed as reaffirmed, not applicable, reopened, or superseded. Reversing one requires a changed fact, scope, source, implementation, or demonstrated reasoning defect.

Name records with an ISO date and scope, for example `2026-08-13-section-1-fresh-review.md`. Do not overwrite a historical record to describe a later state.
