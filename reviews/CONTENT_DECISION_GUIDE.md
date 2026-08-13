# Durable content-decision guide

## Purpose

The decision register preserves why a material content choice was accepted, rejected, or later superseded. It reduces review flip-flops without turning old conclusions into permanent truth.

The current source and current primary evidence remain authoritative. A decision record provides history, rationale, and a test for reopening the question; it does not prove that the current content is correct.

## When to create a decision

Create a record when feedback results in any of the following:

- a material technical, standards, legal, architectural, or security wording change;
- a deliberate rejection of feedback that is likely to recur;
- a cross-page taxonomy or terminology choice;
- a diagram relationship or visual rule whose meaning could otherwise be reversed later;
- an optional improvement that is deliberately adopted or declined; or
- a supersession of an earlier registered decision.

Do not create a record for spelling, punctuation, formatting, or other copyedits that do not change meaning.

## Required review sequence

1. Freeze and inventory the current review state.
2. Read and evaluate the current content without using the register to pre-classify it.
3. Verify material claims against current primary evidence.
4. Query the register by file and concept:

   ```sh
   python3 scripts/verify_content_decisions.py --file topics/example.md
   ```

5. Mark every applicable record as **reaffirmed**, **not applicable**, **reopened**, or **superseded** in the review record.
6. If the provisional finding conflicts with a registered decision, determine whether an invalidation condition is actually met.
7. Preserve the old record and add a new superseding record when the decision changes.

## Decision statuses

- **accepted**: the rationale and approved outcome remain the repository's deliberate position.
- **rejected**: the feedback was considered and deliberately not adopted for the recorded reason.
- **superseded**: a later decision replaces this record; `superseded_by` identifies it.

Implementation state is recorded separately:

- **implemented**: the approved outcome exists in the current repository.
- **not_applicable**: no repository change was required, normally for rejected feedback.
- **pending**: the decision is accepted but implementation is not complete; this state fails the automated check unless the record explicitly sets `allow_pending` to `true`.

## Reopening and supersession

A reviewer may reopen a decision when at least one recorded invalidation condition is met, including:

- the governing standard, law, protocol, or authoritative guidance changed;
- the implementation, page scope, threat model, jurisdiction, or supported environment changed;
- new primary evidence contradicts the recorded rationale;
- a rendered or executable artifact demonstrates that the approved outcome does not work; or
- the earlier reasoning omitted a material counterexample or confused comparison axes.

Preference, style taste, unfamiliarity with the earlier reasoning, or a differently worded secondary source is not enough.

A superseding record must identify the prior decision ID, state the changed fact or reasoning defect, provide current evidence where applicable, and define a complete replacement outcome. Never delete the earlier record.

## Registry format and validation

[`CONTENT_DECISIONS.yml`](CONTENT_DECISIONS.yml) uses JSON-compatible YAML so the dependency-free Python validator can parse it with the standard library. Each record contains:

- stable ID and title;
- status and implementation state;
- affected files and searchable concepts;
- originating feedback;
- decision and rationale;
- authoritative sources or direct verification methods;
- approved outcome;
- invalidation conditions;
- related or superseded decisions; and
- review and implementation dates.

Validate the register with:

```sh
python3 scripts/verify_content_decisions.py
```

The validator checks schema completeness, unique IDs, allowed states, referenced files, source URLs, cross-decision references, and unresolved pending implementations. It does not establish that a decision is technically correct.
