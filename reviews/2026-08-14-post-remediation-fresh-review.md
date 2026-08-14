# Fresh review record: pages rewritten during the 2026-08-14 Section 7 work

## Status and baseline

- Status: Complete with findings — all six found were corrected; see Closure conclusion
- Review mode: **Fresh review** of content that was substantially rewritten earlier the same day. This closes the limitation disclosed in [the remediation record](2026-08-14-section-7-remediation-closure-review.md), which stated that the rewritten prose had never received an independent review.
- Review date: 2026-08-14
- Reviewer: llody9977
- Branch: `main`
- Reviewed commit: `2bf1dbc946477e343d05356a20523958e5663d22` (clean worktree)
- Review state ID: `dde442d2ddf51b595b8741987921585385142dd5b09e467b10109edd09a69ccf`
- Scoped fingerprint at review start: `1f7fbc9124156818c008b524e56e1914629bf9b5a1af9102d5e997359c3b4531` (29 files)
- State-capture command: `python3 scripts/capture_review_state.py --scope <each in-scope path> --output <outside repo>`
- Baseline changed during review: **Yes, after findings were assembled.** All six corrections were applied together in one change, then re-verified. No finding was fixed mid-pass.

## Scope

Every file modified across `1314cab..2bf1dbc` — ten topic pages, fifteen diagrams, one check script, and the shared navigation and presentation files. Reviewed as newly authored content, not as a diff.

| Group | Artifacts |
| --- | --- |
| Section 7 pages | 7.1 ai-risk-management, 7.2 prompt-injection-defense, 7.3 mcp-security-agentics, 7.4 ai-model-supply-chain, 7.5 federated-learning-privacy |
| Adjacent pages | 4.8 mcp-authorization, 9.3 privacy-by-design-pets, 13.2 grc-framework-strategy, 8.3 slsa-provenance-attestation, 2.11 recommended-algorithms |
| Diagrams | 8 new, 7 edited |
| Tooling | `scripts/verify_rendering_hazards.py` |
| Unchanged, checked | `_data/nav.yml`, `_includes/topic-nav.html`, `assets/css/style.css` |

## Findings — all six corrected

| # | Artifact | Defect | Class | Correction |
| --- | --- | --- | --- | --- |
| F1 | `topics/ai-risk-management.md:16` | Alt text described "the OWASP Top 10 for LLM Applications **2025** entries" and a footer "noting the OWASP list is versioned". The diagram had been updated to the 2026 entries with a different footer. **The alt text contradicted its own image** — the exact defect class CD-0033/CD-0038 exist to prevent, recurring because the prose and SVG were updated while the alt string was not. | Cross-format | Alt rewritten to the 2026 entries and the current footer. |
| F2 | `topics/ai-risk-management.md:3` | Front-matter description advertised "edition currency", a section heading that no longer exists, and omitted the agentic scope boundary that had become a substantial part of the page. | Metadata accuracy | Description rewritten to the current sections. |
| F3 | `topics/ai-risk-management.md:89` and `:136` | "this edition moved **six** of the ten" and "2026 moved **six** of ten". Derived from the published 2025 and 2026 orderings, **eight** entries moved; only Prompt Injection and Sensitive Information Disclosure held rank. | Factual — numerical | Restated as "only two of ten held their rank", with the furthest single move (Improper Output Handling, down five) named. |
| F4 | `topics/mcp-security-agentics.md:77` | Excessive Agency described as "the **largest single move** on that list". It climbed three places; Improper Output Handling moved five and Unbounded Consumption climbed four. The source calls it the *most consequential* move, which was paraphrased into a measurable claim that is false. | Factual — comparative | Restated as "climbing three places … the move the project itself calls the most consequential", with the reason. |
| F5 | `topics/ai-risk-management.md:64` | "ranks the risks **most commonly seen**" — contradicted two paragraphs later by the page's own methodology note, which explains that prompt injection ranks first while falling out of the top ten on raw incident count. | Internal contradiction | Restated as ranking by combined community and incident judgment, "not the same as most frequent". |
| F6 | `topics/mcp-security-agentics.md:12` | The lede called an agent "a confused-deputy risk **in the ordinary sense**", while the body's terminology note reserves "confused deputy" for the specific proxy consent-cookie attack MCP names. Introducing the term loosely before restricting it works against the correction that added the note. | Terminology | Lede rewritten to describe the mechanism without the contested label. |

Two further items were checked and **dismissed as non-findings**:

- Four surviving `LLM0X:2025` references are deliberate edition-migration notes explaining the renumbering, not stale citations.
- Three sub-pixel text overhangs in `mcp-oauth-discovery.svg` are on decorative white label chips behind connector lines, confirmed visually invisible.

## Review passes

| Pass | Complete | Evidence |
| --- | --- | --- |
| Factual and technical correctness | Yes | Rank movements recomputed from both published orderings; F3 and F4 found this way. |
| Evidence, authority, version, date, applicability | Yes | 2026 list verified against the supplied primary document; MCP `2026-07-28`, PyTorch, NIST SP 800-226, ISO/IEC 27701:2025 re-checked. |
| Adversarial wording, assumptions, attacker state | Yes | F5 found here; absolutes and comparative claims re-challenged across all ten pages. |
| Terminology, taxonomy, conceptual boundaries | Yes | F6 found here; SMPC/FHE, audience-validation/confused-deputy, cross-device/cross-silo all re-checked. |
| Cross-format consistency | Yes | Automated alt-vs-SVG sweep across every frame; F1 found this way. |
| Cross-page consistency | Yes | Six-property matrix across the pages that share concepts — all consistent. |
| Topic completeness | Yes | No new required gaps; every category previously closed remains closed. |
| Mechanical, link, rendered-output | Yes | See below. |
| Durable content-decision reconciliation | Yes | See below. |
| Residual exhaustion | Yes | Run after the six were assembled; produced the two dismissals above and no further findings. |

## Mechanical and rendered checks

| Check | Result |
| --- | --- |
| `verify_writing_style.py` | 94/94 pass |
| `verify_rendering_hazards.py` | 94/94 pass |
| `verify_content_decisions.py` | 48 records validated |
| `verify_links.py` across all ten touched pages | 59/59 verifiable links resolve; 4 hosts return 403 to automated requests (`doi.org`, `media.defense.gov`, `ipc.on.ca`, `iso.org`) and were confirmed by hand |
| Jekyll build | Success, 0 warnings |
| Rendered frame audit | 18 frames across 10 pages; no image reused within a page; every Section 7, 4.8 and 9.3 frame openable |
| Alt-vs-SVG year sweep | Clean after F1 |
| Rendered LaTeX sweep | Clean |
| SVG geometry | No text crosses a panel edge or viewBox in any touched diagram |
| Visual inspection | `ai-risk-management.svg` confirmed showing the 2026 entries |

## Applicable durable content decisions

| ID | Disposition | Rationale |
| --- | --- | --- |
| CD-0033, CD-0038 | **Reaffirmed** | F1 was a fresh instance of the defect class these govern, caught and closed. The rule held; the omission was mine. |
| CD-0034, CD-0042, CD-0047 | **Reaffirmed** | Rendered LaTeX sweep clean across the corpus. |
| CD-0039 | **Superseded by CD-0048** — already recorded | — |
| CD-0040, CD-0041, CD-0043, CD-0044, CD-0045, CD-0046, CD-0048 | **Reaffirmed** | Each approved outcome re-verified in the rendered output. |
| CD-0022, CD-0027, CD-0029 | **Reaffirmed** | Structure and navigation unchanged and correct. |

No decision was reopened or reversed. No new decision was created: all six findings were corrections of errors introduced during the rewrite, not material policy choices.

## Limitations and uncertainty

1. **Same-author review.** This pass was performed by the author of the reviewed text. It found six defects, including two false numerical claims, so it was not vacuous — but a reviewer with no memory of writing the prose would be a stronger check, particularly on framing and emphasis rather than fact.
2. **The OWASP 2026 document carries unfilled date placeholders** (`[Publication date to be set]`, `[2026 release date]`). The journal cites the edition without asserting a precise release date. Recorded on CD-0048.
3. **Rendered checks covered 1280 px and 375 px in one Chromium build on macOS.** No tablet breakpoint, no Firefox or Safari, no print stylesheet, no forced-colors mode, no screen-reader test.
4. **`verify_links.py` still cannot detect a citation whose URL resolves but does not support the claim.** Four hosts additionally block automated checking and rely on manual confirmation.
5. **Out of scope by choice:** the `Comprehensive technical guide to …` front-matter formula on 22 pages, and the Title Case heading style on 9.3 and other pages outside Section 7, which now differs from the sentence case used in Section 7.

## Closure attestation

- [x] Every in-scope artifact was inventoried and read in full, as newly authored content.
- [x] Material claims were re-verified, including recomputation of the numerical ones.
- [x] Every mandatory pass was completed separately and recorded.
- [x] Current primary sources were used, including the supplied OWASP 2026 document.
- [x] Prose, metadata, diagrams, captions, alt text, examples, summaries and navigation were reconciled.
- [x] Mechanical and rendered checks passed, with limitations recorded.
- [x] Durable decisions were reconciled; none reversed.
- [x] Residual exhaustion completed after findings were assembled.
- [x] The baseline was frozen during review and changed only once, after all findings were assembled.
- [x] Findings, dismissals and limitations are separated.

Closure conclusion: six defects were found in the rewritten content and all six are corrected. Cross-format, cross-page, mechanical and rendered checks are clean at the resulting state. Subject to Limitation 1 — this was a same-author review — the scope carries no known open required findings.
