# Fresh Review & Remediation Closure Record: Section 6 (Threat Intelligence & Detection)

## Status and Baseline

- **Status**: Remediation complete; closure claimed against the post-fix state identified below.
- **Review Mode**: Fresh full-section review (2026-08-13), followed by remediation and a closure pass over the resulting state (2026-08-14).
- **Review Date**: 2026-08-13 (review) / 2026-08-14 (remediation and closure)
- **Branch**: `main`

### Reviewed baseline (pre-fix)

- **Commit**: `49d6d9d19b4c7195ae1deadf73063b553c263498`
- **Worktree**: dirty — one untracked, out-of-scope file (`scripts/update_owasp_year.py`)
- **Scoped content fingerprint (sha256)**: `2b6aa3b023e4b882687f1b174d910fe64775607f779145ee8bd73f84b7181b39`
- **Review state ID (sha256)**: `ce5defd8678292987cc5a1879723b03f1bcf08ee86deecfd811fbf97e62b80bd`
- **Baseline changed during review**: No. Re-captured at the end of the review pass and confirmed identical.

### Post-remediation state (closure baseline)

- **Scoped content fingerprint (sha256)**: `acf425d63df9bf02c312462c2650c5e792ca7270f82a9130ad6ee4ee1481b5bc`
- **Review state ID (sha256)**: `83e51fb0707bd25c7d4a673c61209f24c49c0c8b3c90eb34eb8a010dea32428a`
- **Scope**: 35 files (6 pages, 19 diagrams, 5 shared presentation/navigation files, 3 scripts/workflow, the decision register)

Implementation and closure were run as separate phases: the review was completed and frozen first, then all edits were made, then the resulting state was re-frozen and re-validated.

## Scope Inventory

| Artifact | Type | Disposition |
| --- | --- | --- |
| `topics/threat-modeling-design.md` | Topic page 6.1 | Rewritten |
| `topics/operational-intrusion-frameworks.md` | Topic page 6.2 | Rewritten |
| `topics/cyber-threat-intelligence.md` | Topic page 6.3 | Rewritten |
| `topics/detection-engineering.md` | Topic page 6.4 | Rewritten |
| `topics/threat-hunting.md` | Topic page 6.5 | Rewritten |
| `topics/adversary-emulation.md` | Topic page 6.6 | Rewritten |
| `assets/img/design-time-threat-modeling.svg` | Diagram | Edited (STRIDE data-store qualifier) |
| `assets/img/threat-modeling-questions.svg` | Diagram | Adopted — was orphaned, now used by 6.1 |
| `assets/img/threat-modeling-design.svg` | Diagram | **Deleted** — generic flow mislabelled as the OWASP questions |
| `assets/img/operational-intrusion-frameworks.svg` | Diagram | Edited (15 tactics) |
| `assets/img/cyber-kill-chain.svg` | Diagram | **New** |
| `assets/img/diamond-model.svg` | Diagram | Redrawn (axis labels, diamond geometry, legend) |
| `assets/img/cyber-threat-intelligence-lifecycle.svg` | Diagram | Edited (TAXII Channels, TLP line) |
| `assets/img/cyber-threat-intelligence.svg` | Diagram | Rebuilt (stage names, a11y, background) |
| `assets/img/pyramid-of-pain.svg` | Diagram | Rebuilt (clipping) |
| `assets/img/detection-engineering-pipeline.svg` | Diagram | Edited (`sigma-cli`, metric label) |
| `assets/img/detection-engineering.svg` | Diagram | Rebuilt |
| `assets/img/telemetry-normalization.svg` | Diagram | **New** |
| `assets/img/precision-vs-recall.svg` | Diagram | Rebuilt (clipping, axis titles) |
| `assets/img/threat-hunting-methodology.svg` | Diagram | Edited (M-ATH, EDA, PEAK expansion) |
| `assets/img/threat-hunting.svg` | Diagram | Rebuilt |
| `assets/img/peak-hunting-framework.svg` | Diagram | Rebuilt (M-ATH, PEAK expansion) |
| `assets/img/post-hunt-operationalization.svg` | Diagram | **New** |
| `assets/img/adversary-emulation-validation.svg` | Diagram | Edited (CTID library replaces Prelude) |
| `assets/img/adversary-emulation.svg` | Diagram | Rebuilt (labels aligned to prose) |
| `assets/img/coverage-theoretical-vs-empirical.svg` | Diagram | **New** |
| `assets/css/style.css` | Shared presentation | `.formula` class added |
| `_data/nav.yml`, `_layouts/default.html`, `_includes/nav*.html`, `_includes/topic-nav.html` | Navigation / layout | Inspected; no change required |
| `scripts/verify_rendering_hazards.py` | Check | **New**, wired into the blocking deploy gate |
| `scripts/verify_links.py` | Check | **New**, review-time only |
| `.github/workflows/deploy.yml` | CI | Hazard check added to quality gate |
| `reviews/CONTENT_DECISIONS.yml` | Decision register | 8 records added (CD-0030 … CD-0037) |
| `scripts/update_owasp_year.py` | Untracked script | **Deleted** — spent one-shot migration, effect already committed |

## Review Passes

| Pass | Complete | Evidence |
| --- | --- | --- |
| Factual and technical correctness | Yes | 112 material claims recorded; 5 standards claims corrected against current primary sources. |
| Evidence, authority, version, date, applicability | Yes | ATT&CK v19 tactic set, TAXII 2.1 Channel status, PEAK publication, Atomic Red Team GUID, D3FEND tactic set, OWASP question wording, OCTAVE Allegro phases all re-verified at source. |
| Adversarial wording, assumptions, threat state | Yes | Removed "None", "Audit-proof", "globally authoritative"; attributed the Kill Chain premise; qualified the Z-score and STRIDE data-store cells. |
| Terminology, taxonomy, conceptual boundaries | Yes | PEAK/M-ATH, ATT&CK acronym, OCTAVE altitude boundary, hunt-type taxonomy collision. |
| Cross-format consistency | Yes | 5 image/caption contradictions and 4 duplicate embeds found by rendering, all resolved. |
| Cross-page consistency | Yes | 6.1↔1.4 duplication and OCTAVE boundary reconciled; 6.2↔7.1 ATLAS cross-linked. |
| Topic completeness (12-category matrix) | Yes | 7 required gaps identified and closed. |
| Mechanical, executable, link, rendered-output validation | Yes | See below. |
| Decision-history reconciliation | Yes | CD-0025 and CD-0026 dispositioned; 8 new records added. |
| Residual exhaustion | Yes | Re-read after fixes; the detector self-test exposed a gap in its own coverage, which was fixed before acceptance. |

## Open Required Findings

None. All 36 required corrections from the 2026-08-13 review are implemented and verified against the post-fix state.

## Optional Coverage Items

All 10 adopted except one, which is deliberately declined and recorded:

- O-1 threat-model limitations, O-2/O-10 cross-links, O-3 D3FEND status, O-4 Admiralty confidence grading, O-6 rule retirement lifecycle, O-7 Sigma correlation rules and YARA-X, O-8 Hunting Maturity Model and IR handoff, O-9 CTID emulation library — **adopted**.
- O-5 rename the two CTI diagram files — **declined**, recorded as CD-0037 with rationale (no reader-facing benefit; would break the recorded scope of the accepted CD-0026).

## Mechanical Checks Executed

| Check | Result | What it does not prove |
| --- | --- | --- |
| `scripts/capture_review_state.py` (pre and post) | Pre-fix baseline held; post-fix state frozen | Nothing about content. |
| `scripts/verify_writing_style.py` | 94/94 pass | Accuracy, completeness, cross-format consistency. |
| `scripts/verify_rendering_hazards.py` (new) | 94/94 pass; self-tested against all 4 observed defect shapes | Diagram/caption agreement; diagram legibility. |
| `scripts/verify_content_decisions.py` | 37 records validated | Technical correctness of any decision. |
| `scripts/verify_links.py` (new) | All links resolve across topics and the register | That a live page still supports the claim beside it. |
| `bin/jekyll build` | Clean; the pre-existing `privacy-by-design-pets.md` front-matter parse failure is fixed | Rendered correctness. |
| Rendered HTML scan | 0 raw-math leaks, 0 duplicate images, all images resolve, all frames openable, no heading skips | Semantic accuracy. |
| Embedded asset validation | STIX bundle parses with the objects the prose claims; both Atomic YAML files parse; Python parses; base64 round-trips as UTF-16LE | Runtime behavior against a live SIEM. |
| Visual inspection | 4 rebuilt diagrams at full size; 6 pages at 1280×900; 2 pages at 375×812 | Every diagram at every viewport. |

## Applicable Durable Decisions

| ID | Disposition | Basis |
| --- | --- | --- |
| CD-0025 | **Superseded on the ATT&CK tactic count**; STRIDE/PASTA/taxonomy outcomes reaffirmed | Its own invalidation condition #1 met by ATT&CK v19 evidence. Recorded in CD-0030 rather than by editing the historical record. |
| CD-0026 | **Reaffirmed on structure; reopened on rendered output** | Six-topic split unchanged and sound. Its invalidation condition #3 was met: rendered evidence showed caption/image contradictions, literal LaTeX, and clipped diagrams. Addressed by CD-0033 and CD-0034. |
| CD-0030 … CD-0036 | **New, accepted, implemented** | ATT&CK currency; TAXII/TLP; PEAK terminology; one diagram per frame; formulas as literal text plus the blocking check; working-model labelling; emulation authorization. |
| CD-0037 | **New, rejected, not applicable** | Diagram file rename deliberately declined. |

## Known Limitations

1. The closure baseline is a dirty worktree by construction — the edits are uncommitted at capture time. The commit that carries this record is the durable identifier.
2. The Diamond Model paper's title page was not read verbatim; no local PDF text extractor was available. The citation was verified independently (publisher name, authors, year, live PDF URL).
3. Bianco's Pyramid of Pain difficulty words exist only inside his diagram image, not the blog text. The prose/diagram inconsistency was resolved internally to "Tough"; the original label was not extracted from source.
4. The STIX 2.1 relationship table was not read clause by clause; the example's `indicates` edges were validated structurally and against the specification's described model, not against the rendered table.
5. MITRE ATLAS tactic and technique IDs were not enumerated (`atlas.mitre.org/tactics` and `/matrices/ATLAS` both returned 404). The page frames its ATLAS entries as representative threat classes, not as an authoritative enumeration.
6. "Vistas" as a Prelude agent name could not be disproved, only not found; the entry was removed as outdated rather than asserted false.
7. The LaTeX remediation extended beyond Section 6 to 12 further pages, so that the new hazard check could be made blocking rather than shipped disabled. Those pages received the formula fix only; they have not had a full content review.

## Process Assessment

The review rules were effective. Three provisions caught nearly every finding, and each corresponds to a step the prior Section 6 record claimed but did not perform:

- **Scope inventory** — the prior record inventoried 6 SVGs; the section had 14. Every caption/image contradiction lived in a frame that inventory never listed.
- **Rendered-output inspection** — a genuine render would immediately have shown a formula column of raw LaTeX and a sentence collapsed into a table.
- **Current-source verification** — `last_verified` was stamped the same day while the ATT&CK tactic set had changed months earlier.

The gap was in the automation, not the standard: both existing checks passed cleanly against content carrying 36 open corrections, because neither can request a URL or see rendered output. `verify_rendering_hazards.py` (blocking) and `verify_links.py` (review-time) close the two defect classes that were mechanically detectable. Caption/image agreement and diagram legibility remain human-verified only.
