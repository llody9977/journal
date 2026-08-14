# Fresh review record: Section 9 — Security Architecture & Design Principles (9.1–9.4)

## Status and baseline

- Status: Complete with no open findings in scope
- Review mode: Fresh review, followed by remediation and closure re-verification
- Review date: 2026-08-14
- Reviewer: Journal maintainer
- Branch: `main`
- Review baseline commit: `a3309b425c118e786322d94e21f0e6c0516a976b` (worktree clean)
- Review baseline fingerprint: `1c6420771349ec34657f98d4859266a2c48e46deea998a721b61e38debf234ab`
- Review state ID: `72861d205da399b4273720b1d77e2b40741877b0a63f4fd2e6da26fd9496e90b`
- Baseline changed during review: No. The fingerprint was re-captured after every pass and was identical. Remediation began only after the review closed.
- Post-remediation fingerprint (16 files): `7d4644a104109892d1f6c9280c7de935250555a602a55d421ad91bf209292718`
- Post-remediation state ID: `34d58e103cbf85828882f1257abbb2c3c013be627178652ce3c29073133df813`

Section-number note: the earlier record `2026-08-13-section-9-closure-review.md` covers the GRC pages that `CD-0028` renumbered to Section 13. It does not cover this scope. The four current Section 9 pages had not previously received a fresh review.

State-capture command:

```sh
python3 scripts/capture_review_state.py \
  --scope topics/security-design-principles.md \
  --scope topics/zero-trust-architecture.md \
  --scope topics/privacy-by-design-pets.md \
  --scope topics/cloud-secure-architecture-patterns.md \
  --scope assets/img/security-design-principles.svg \
  --scope assets/img/defense-in-depth-tiers.svg \
  --scope assets/img/zero-trust-architecture.svg \
  --scope assets/img/zero-trust-pdp-pep-flow.svg \
  --scope assets/img/privacy-by-design-pets.svg \
  --scope assets/img/cloud-secure-architecture-patterns.svg \
  --scope assets/img/cloud-service-perimeters.svg \
  --scope assets/img/immutable-infrastructure-lifecycle.svg \
  --scope _data/nav.yml \
  --scope _includes/topic-nav.html \
  --scope reviews/CONTENT_DECISIONS.yml \
  --scope scripts/verify_rendering_hazards.py
```

## Scope inventory

| Artifact | Type | Direct dependents or generated counterpart | Inspected |
| --- | --- | --- | --- |
| `topics/security-design-principles.md` (9.1) | Topic page | front matter, eyebrow, lede, 2 diagram frames, 2 tables, callout, references | Yes |
| `topics/zero-trust-architecture.md` (9.2) | Topic page | front matter, lede, 2 diagram frames, 2 tables, callout, references | Yes |
| `topics/privacy-by-design-pets.md` (9.3) | Topic page | front matter, lede, 1 diagram frame, 3 tables, internal link, callout, references | Yes |
| `topics/cloud-secure-architecture-patterns.md` (9.4) | Topic page | front matter, lede, 3 diagram frames, 2 tables, callout, references | Yes |
| `assets/img/security-design-principles.svg` | Diagram (rebuilt) | 9.1 frame 1 caption and alt text | Yes |
| `assets/img/defense-in-depth-tiers.svg` | Diagram (new) | 9.1 frame 2 caption and alt text | Yes |
| `assets/img/zero-trust-architecture.svg` | Diagram (rebuilt) | 9.2 frame 1 caption and alt text | Yes |
| `assets/img/zero-trust-pdp-pep-flow.svg` | Diagram (new) | 9.2 frame 2 caption and alt text | Yes |
| `assets/img/privacy-by-design-pets.svg` | Diagram (corrected) | 9.3 frame caption and alt text | Yes |
| `assets/img/cloud-secure-architecture-patterns.svg` | Diagram (rebuilt) | 9.4 frame 1 caption and alt text | Yes |
| `assets/img/cloud-service-perimeters.svg` | Diagram (new) | 9.4 frame 2 caption and alt text | Yes |
| `assets/img/immutable-infrastructure-lifecycle.svg` | Diagram (new) | 9.4 frame 3 caption and alt text | Yes |
| `_data/nav.yml` | Navigation | Section 9 titles and URLs | Yes |
| `_includes/topic-nav.html` | Nav template | prev/next chain 8.4 → 9.1 → 9.2 → 9.3 → 9.4 → 10.1 | Yes |
| `_layouts/default.html`, `assets/css/style.css` | Shared presentation | diagram frame, openable pattern, table scroll, media queries | Yes |
| `reviews/CONTENT_DECISIONS.yml` | Decision register | queried after independent evaluation | Yes |
| `scripts/verify_rendering_hazards.py` | Check | extended under CD-0057 | Yes |
| Rendered output | Generated | full Jekyll build to a scratchpad destination | Yes |

Out-of-scope boundaries: Sections 1–8 and 10–13 were not reviewed. Four defects found incidentally in them were fixed and are listed under "Out-of-scope fixes" below; no other page in those sections was inspected.

## Review passes

| Pass | Complete | Evidence or notes |
| --- | --- | --- |
| Factual and technical correctness | Yes | SP 800-207 text extracted from the source PDF; gVisor, Docker tmpfs, Azure Private Link, AWS Service Catalog, and VPC Service Controls checked against vendor documentation. |
| Evidence, authority, version, date, jurisdiction, applicability | Yes | SP 800-207 confirmed as guidance not mandate; ISO/IEC 27701:2025 second edition October 2025; RFC 7009 scope; dead Saltzer link replaced. |
| Adversarial wording, assumptions, attacker state, counterexamples | Yes | Four absolute cloud claims and the JWT revocation claim rewritten with their conditions and residual windows. |
| Terminology, taxonomy, conceptual boundaries | Yes | gVisor vs microVM; fail-safe vs fail-closed vs fail-open; PbD framework vs GDPR Art. 25 vs ISO 27701; allowlist vs whitelist; US spelling. |
| Cross-format consistency | Yes | Every caption, alt string, SVG `<desc>`, front-matter description, and callout reconciled against its own image and prose. |
| Cross-page consistency, prerequisites, sequence, duplication | Yes | Complete-mediation wording aligned with 1.6 and 4.2; cross-links added to 1.6, 4.2, 5.3, 11.1, 11.2, 11.3, 8.2. |
| Topic completeness | Yes | 12-category matrix per page; all required gaps closed (see matrix). |
| Mechanical, link, generator, executable, rendered-output validation | Yes | See checks table. |
| Durable content-decision reconciliation | Yes | 12 records dispositioned; 6 new records added (CD-0052 to CD-0057). |
| Residual exhaustion | Yes | Post-fix rendered-output scan for literal Markdown found three further pipe-reparsed formulas outside scope, all fixed. |

## Material-claim ledger summary

98 material claims recorded across the four pages: 60 verified or accepted at review time, 38 carrying an open finding. The 38 resolved into 24 required corrections, because several corrections covered one claim repeated across prose, description, diagram, alt text, and caption — R1 spanned five representations and R2 six. All 24 are implemented and re-verified in rendered output.

| Page | Claims recorded | Verified at review | Open at review | Open now |
| --- | --- | --- | --- | --- |
| 9.1 security-design-principles | 24 | 14 | 10 | 0 |
| 9.2 zero-trust-architecture | 22 | 11 | 11 | 0 |
| 9.3 privacy-by-design-pets | 26 | 21 | 5 | 0 |
| 9.4 cloud-secure-architecture-patterns | 26 | 14 | 12 | 0 |

Claims verified against current primary sources: SP 800-207 §2.1 tenet count and text, §3 component definitions and variations, §5 threat list, and the zero occurrences of "assume breach" and "CARTA" (extracted from the NIST PDF); Microsoft's three Zero Trust principles; Saltzer & Schroeder's eight principles plus work factor and compromise recording; CARTA's Gartner origin; gVisor's self-description; Google's VPC Service Controls scope and limits; AWS Service Catalog's purpose; Docker tmpfs default mount options; Azure Private Link terminology; ISO/IEC 27701:2025 edition and date; RFC 7009 scope; NIST SP 800-160 v1 r1 title; NIST SP 800-226 on differential privacy.

## Topic completeness matrix

C = covered · N/A = not applicable · G = required gap (all closed) · O = optional extension

| Topic | Definition | Boundaries | Actors/components | Mechanism/sequence | Assumptions/dependencies | Threats/failures | Limits/residual risk | Selection/use | Operations/evidence | Recovery/lifecycle | Interoperability/migration | Unsafe alternatives |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 9.1 Design principles | C | C (was G: fail-safe/fail-open, DiD not among the eight) | C | C | C (was G: layer independence) | C (was G) | C (was G) | C | C | N/A — principles are not lifecycle artifacts | N/A | C |
| 9.2 Zero Trust | C | C (was G: NIST vs vendor vs analyst framings) | C | C | C | C (was G: §5 threats) | C (was G: revocation residual) | C (was G: §3.1/§3.2) | C | C (was G: revocation semantics) | O — §7 migration steps | C |
| 9.3 Privacy by design & PETs | C | C | C | C | C | C | C | C | C | C | N/A | C |
| 9.4 Cloud patterns | C | C (was G: boundary vs Section 11) | C | C | C (was G: shared responsibility) | C (was G) | C (was G) | C | C | O — rollback | O — multi-cloud portability | C |

## Cross-format and cross-page ledger

| Concept or claim | Representations compared | Result |
| --- | --- | --- |
| Zero Trust tenets | prose, front-matter description, callout, SVG content, SVG `<desc>`, alt text, caption | All six now state seven NIST tenets; vendor framing attributed separately. |
| CARTA attribution | heading, prose, description, SVG panel, SVG `<desc>`, alt text | Removed from the NIST-labelled control plane; attributed to Gartner in prose. |
| Complete mediation and caching | 9.1 table, 1.6 table, 4.2 prose | All three now permit bounded, revocable caching. |
| Defense in depth membership | 9.1 prose, 9.1 SVG footer, 1.6 prose | All three state it is not among the eight. |
| Data minimization spelling | 9.3 table, SVG panel header, SVG bullet, SVG bottom bar | All US spelling. |
| PbD principle count | alt text, caption, SVG panel header, SVG bullets | All seven now shown and described. |
| Allowlist terminology | 9.4 prose, 9.4 checklist, 9.4 SVG | Aligned with the reviewed sections' allowlist wording. |
| Diagram-to-frame mapping | 8 frames, 8 images | One purpose-built image per frame; no reuse. |

## Applicable durable content decisions

| Decision ID | Affected concept | Disposition | Current evidence and rationale |
| --- | --- | --- | --- |
| CD-0033 | one image per diagram frame | Reaffirmed, scope extended by CD-0052 | Section 9 carried the identical defect; the rule's rationale applies unchanged. |
| CD-0038 | same rule, Section 7 | Reaffirmed as precedent | Establishes that section-scoping the rule is the recurring failure. |
| CD-0049 | same rule, Section 8 | Reaffirmed as precedent | Third consecutive section-scoped record; Section 9 is the fourth occurrence. |
| CD-0035 | checklist labelling, description scoping | Reaffirmed, scope extended by CD-0053 | Section 9 had four unlabelled checklists and four comprehensiveness claims. |
| CD-0050 | same rule, Section 8 | Reaffirmed, scope extended by CD-0053 | Explicitly left the remaining pages unsettled; CD-0053 settles Section 9 only. |
| CD-0028 | Section 9 taxonomy | Reaffirmed on taxonomy; verification claim not supported | The sitemap stands. Its `approved_outcome` claim of "fully verified with matching SVGs" was contradicted by inspection; the taxonomy decision itself is unaffected. |
| CD-0029 | 9.3 reference URL | Reaffirmed | IPC Ontario URL live (403 is bot filtering, not a broken link). |
| CD-0034 | formulas as literal text | Reaffirmed, applied to three out-of-scope formulas | Two pipe-reparsed formulas on 2.8 and one on 2.9 fixed with the `<p class="formula">` pattern. |
| CD-0043 | federated learning primitives | Reaffirmed | 9.3 and 7.5 use consistent PET language. |
| CD-0046 | what each PET bounds | Reaffirmed | Verified surviving in prose, tables, diagram, and callout. New findings on 9.3 were additive and met no invalidation condition. |
| CD-0047 | math-span hazard check | Reaffirmed, extended by CD-0057 | Same argument, new defect classes. |
| CD-0001, 0004, 0006, 0007, 0011, 0019 | various | Not applicable to this scope | Concept matches only; affected files outside Section 9. |

New records added: **CD-0052** (one image per frame, Section 9), **CD-0053** (checklist labelling and description scoping, Section 9), **CD-0054** (SP 800-207 tenets, attribution, revocation semantics, §5 threats), **CD-0055** (cloud isolation and perimeter claims bounded by their conditions), **CD-0056** (fail-safe vs fail-open, layer independence, complete mediation alignment), **CD-0057** (rendering-hazard check extensions).

## Mechanical and rendered checks

| Check | Scope | Result | What this does not prove |
| --- | --- | --- | --- |
| `verify_writing_style.py` | 94 topic files | Pass | Structure only — no accuracy, attribution, or cross-format agreement. |
| `verify_rendering_hazards.py` (extended) | 94 topic files | Pass, 9 reused-image warnings in Sections 10–12 | Detects Markdown in block HTML and image reuse; not caption-to-diagram agreement or legibility. |
| `verify_content_decisions.py` | 57 decisions | Pass | Registry structure only, not technical correctness. |
| `verify_links.py --internal-only` | 94 page refs, 129 asset refs | Pass | Resolution only. |
| `verify_links.py` (external) | whole repo | Section 9 clean; 5 pre-existing failures elsewhere | The Saltzer dead link is resolved; remaining failures are in 1.1, 10.1, and historical register records. Not part of the CI gate. |
| Jekyll build | whole site, scratchpad destination | Pass | Build success only. |
| Rendered literal-Markdown scan | built HTML of all 94 pages, scripts excluded | 0 occurrences | Confirms kramdown parsed every emphasis span. |
| SVG geometry measurement | 8 Section 9 SVGs, 216 text nodes | 0 overflow past viewBox or panel strokes | Geometry only, not semantic correctness. |
| Rendered desktop, 1280 px | all 4 pages, full page | Inspected | Confirmed one image per frame and caption agreement. |
| Rendered mobile, 375 px | all 4 pages in-frame measurement | No horizontal overflow; 8/8 frames carry a "Full size ↗" link | Inline diagram text remains small at 375 px, which is why the openable affordance is the remedy. |
| Diagram frame audit | built HTML | 8 frames, 8 unique images, 8 openable links | — |

## Open required findings

None in scope. All 24 required corrections from the fresh review are implemented and re-verified against rendered output.

## Out-of-scope fixes made during remediation

Found by the extended check and the rendered-output scan, fixed because each was a one-line correction to a page that renders wrong:

- `topics/certificates.md` — literal `**Domain Validated (DV)**`, `**Organization Validated (OV)**`, `**Extended Validation (EV)**` in the lede.
- `topics/security-objectives-properties.md` — literal `*after*` in the lede.
- `topics/tls-ssl-handshake.md` — literal `*end state*` inside a callout paragraph.
- `topics/hash-collisions-length-extension.md` — two formulas whose `||` operators were counted as table delimiters, restructuring the paragraph into a table.
- `topics/key-exchange-derivation.md` — the HKDF-Expand block formula, same defect.

## Optional coverage not implemented

- 9.2: the CISA ZTMM five pillars and four maturity stages (the reference now states what it covers).
- 9.3: one-line definitions for k-anonymity, l-diversity, t-closeness; trusted execution environments and synthetic data as further PET families.
- 9.4: a per-tenant versus pooled cost and isolation trade-off row; rollback and multi-cloud portability.
- 9.1: nothing outstanding.
- Sections 10–12: nine reused diagram frames across eight pages, now reported by name on every check run.

## Limitations and uncertainty

- Rendered inspection used Chromium only (headless Chrome at 1280 px, in-frame measurement at 375 px). Safari and Firefox were not tested.
- SP 800-207 text was extracted from the PDF with a hand-written content-stream decoder because no PDF library was available. The seven tenets, component definitions, and §5 headings read cleanly and are mutually consistent, and section titles were independently recovered from the PDF outline, but not every character of the extraction was verified.
- `iso.org`, `cisa.gov`, and `ipc.on.ca` return 403 to automated fetches. ISO/IEC 27701:2025's edition and October 2025 date were verified through secondary sources rather than the ISO catalog page.
- No source-level detector was added for the pipe-reparsed-formula class. Both candidate patterns matched dozens of Liquid filter expressions and JavaScript logical-or operators, so the reliable detector is a rendered-output scan, which is not part of the CI gate.
- Sections 1–8 and 10–13 were not reviewed. Passing checks on those sections establishes structure, not accuracy.

## Closure attestation

- [x] Every in-scope artifact was inventoried and read in full.
- [x] Every material claim was entered in the ledger and dispositioned.
- [x] Every topic received a completeness classification for every category.
- [x] Every mandatory pass was completed separately.
- [x] Current primary sources were used for standards-sensitive and time-sensitive claims.
- [x] Prose, metadata, diagrams, captions, alt text, examples, summaries, navigation, and generators were reconciled.
- [x] Applicable mechanical and rendered checks passed or their limitations are recorded.
- [x] Applicable durable content decisions were reconciled after the independent claim review, and every extension is justified.
- [x] Residual exhaustion was completed after findings were assembled, and after remediation.
- [x] The review baseline remained frozen; remediation began only after the review closed, and the post-remediation state is identified above.
- [x] Required findings, optional coverage, and limitations are separated.

Closure conclusion: Section 9 has no open required findings at post-remediation state `34d58e103cbf85828882f1257abbb2c3c013be627178652ce3c29073133df813`. This record covers Section 9 only; it is not a closure claim for any other section.
