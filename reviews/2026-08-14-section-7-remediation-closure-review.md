# Remediation closure record: Section 7 (AI & LLM Security)

## Status and baseline

- Status: Complete with no open findings from the originating review; see Limitations for what this record does **not** claim
- Review mode: Remediation of a fresh review, followed by closure verification against the resulting frozen state
- Review date: 2026-08-14
- Reviewer: llody9977
- Branch: `main`
- Pre-remediation commit: `1314cabe37b8865cb8effe36b799eecd62907285` (clean)
- Pre-remediation review state ID: `5a85c5d5e16672e720a0a2f2560a5b472c178e22c52227a306f5b557a4afa438`
- Pre-remediation scoped fingerprint: `50f403fbca722a4616358e8c1f5f8203a88f7678aaa0abfcb4ca65b9d153b2b5`
- Post-remediation scoped fingerprint: `48aa90d7000b999bf9c7d91e72675aac1be3c516294f8a1b5e88fbeda010baf1` (24 files)
- Post-remediation review state ID: `6df92fa5bcaa15dede46651301f202aafa42a4282ebcf73cb7dca1e424466ed3`
- State-capture command: `python3 scripts/capture_review_state.py --scope <each in-scope path> --output <outside repo>`
- Baseline changed during review: Yes, by design. The originating fresh review closed against `50f403fb…`; every edit below was then applied, the resulting state was frozen at `48aa90d7…`, and the verification passes in this record were run against that frozen state.

The originating fresh review is the source of the finding identifiers (R1–R36, O1–O12) used below. It recorded 36 required corrections and 12 optional items across five pages and five diagrams.

## Scope inventory

| Artifact | Type | Direct dependents or generated counterpart | Inspected |
| --- | --- | --- | --- |
| `topics/ai-risk-management.md` | Page (7.1) | 3 diagram frames, nav, rendered page | Yes |
| `topics/prompt-injection-defense.md` | Page (7.2) | 3 diagram frames, nav, rendered page | Yes |
| `topics/mcp-security-agentics.md` | Page (7.3) | 4 diagram frames, nav, rendered page | Yes |
| `topics/ai-model-supply-chain.md` | Page (7.4) | 2 diagram frames, nav, rendered page | Yes |
| `topics/federated-learning-privacy.md` | Page (7.5) | 1 diagram frame, nav, rendered page | Yes |
| `assets/img/ai-risk-management.svg` | Diagram (rewritten) | 7.1 frame 1 | Yes |
| `assets/img/nist-ai-rmf-functions.svg` | Diagram (new) | 7.1 frame 2 | Yes |
| `assets/img/mitre-atlas-matrix.svg` | Diagram (new) | 7.1 frame 3 | Yes |
| `assets/img/prompt-injection.svg` | Diagram (title/desc added) | 7.2 frame 1 | Yes |
| `assets/img/dual-llm-pattern.svg` | Diagram (new) | 7.2 frame 2 | Yes |
| `assets/img/rag-context-isolation.svg` | Diagram (new) | 7.2 frame 3 | Yes |
| `assets/img/mcp-tool-poisoning.svg` | Diagram (title/desc added) | 7.3 frame 1 | Yes |
| `assets/img/mcp-tool-discovery-flow.svg` | Diagram (new) | 7.3 frame 2 | Yes |
| `assets/img/mcp-resource-indicators.svg` | Diagram (new) | 7.3 frame 3 | Yes |
| `assets/img/mcp-hitl-gate.svg` | Diagram (new) | 7.3 frame 4 | Yes |
| `assets/img/ai-model-supply-chain.svg` | Diagram (edited) | 7.4 frame 1 | Yes |
| `assets/img/pickle-rce-mechanism.svg` | Diagram (new) | 7.4 frame 2 | Yes |
| `assets/img/federated-learning-privacy.svg` | Diagram (edited) | 7.5 frame 1 | Yes |
| `_data/nav.yml`, `_includes/topic-nav.html`, `_includes/nav-list.html` | Navigation | Section 7 chain | Yes, unchanged |
| `_layouts/default.html`, `assets/css/style.css`, `assets/js/main.js` | Shared presentation | All frames | Yes, unchanged |
| `scripts/verify_rendering_hazards.py` | Check (widened) | Deploy quality gate | Yes |
| `topics/recommended-algorithms.md` | Page (2.11) | Surfaced by the widened check | Yes, single line changed |
| `reviews/CONTENT_DECISIONS.yml` | Decision register | CD-0038 – CD-0044 added | Yes |

Out-of-scope boundaries and reason: `topics/mcp-authorization.md` (4.8) was read for cross-page reconciliation and left unchanged — its own currency against MCP `2026-07-28` is a Section 4 matter. `topics/privacy-by-design-pets.md` (9.3) was read for terminology reconciliation and left unchanged; its differential-privacy "guarantees … no information" wording remains an open Section 9 item. The `Comprehensive technical guide to …` front-matter formula was corrected on the five Section 7 pages only; 22 other pages journal-wide still use it.

## Review passes

| Pass | Complete | Evidence or notes |
| --- | --- | --- |
| Factual and technical correctness | Yes | Every replacement claim checked against a primary source before it was written; see the ledger. |
| Evidence, authority, version, date, jurisdiction, and applicability | Yes | MCP `2026-07-28`, PyTorch 2.6 default and its condition, NIST AI RMF voluntary status and January 2023 date, NIST SP 800-226 final March 2025, OWASP edition availability. |
| Adversarial wording, assumptions, attacker state, and counterexamples | Yes | Removed "ZERO RCE RISK", "eliminates … completely", "prevent Sybil node creation", unconditional MUST, and the unsourced ε ≤ 1.0; added residual-risk sections to 7.2, 7.3, and 7.4. |
| Terminology, taxonomy, and conceptual boundaries | Yes | Dual LLM roles restored to source naming; confused deputy separated from audience validation failure; SMPC separated from homomorphic encryption; cross-device separated from cross-silo. |
| Cross-format consistency | Yes | All 13 frames re-verified image ↔ caption ↔ alt; SVG `<title>`/`<desc>` rewritten where content changed. |
| Cross-page consistency, prerequisites, sequence, and duplication | Yes | 7.3 transport claim now agrees with 4.8; 7.5 primitive taxonomy now agrees with 9.3; cross-links added 7.1→7.2, 7.3→4.8, 7.5→9.3. Nav chain re-verified unchanged. |
| Topic completeness | Yes | All twelve required gaps from the originating review closed; see matrix. |
| Mechanical, link, generator, executable, and rendered-output validation | Yes | See checks table. |
| Durable content-decision reconciliation | Yes | CD-0022, CD-0027, CD-0029, CD-0033, CD-0034 dispositioned; CD-0038 – CD-0044 added. |
| Residual exhaustion | Yes | The widened hazard check surfaced one further instance of the same defect class in Topic 2.11, which was fixed in the same change. |

## Material-claim ledger

Summarized. The originating review recorded 208 claims; this record tracks the 48 that were changed or newly written, plus the 35 externally verified.

| ID | Artifact and location | Material claim | Classification | Primary source or verification | Repetitions checked | Result |
| --- | --- | --- | --- | --- | --- | --- |
| C-101 | 7.1 table, SVG panel 2, refs | OWASP entries are the **2025** edition, edition-suffixed | Official guidance | `genai.owasp.org/llm-top-10/` per-risk pages | Table, SVG, refs, 7.3 body | Closed |
| C-102 | 7.1 "Edition currency" | A 2026 edition exists, published August 2026 | Official guidance | `genai.owasp.org/resource/owasp-genai-llm-top-10-2026/` | SVG footer | Closed, with disclosed source limit |
| C-103 | 7.1 AI RMF section | AI RMF 1.0 is **voluntary**, published January 2023 | Official guidance | NIST AI RMF page | Body, SVG, callout | Closed |
| C-104 | 7.1 model retirement | Retirement triggers | Journal working model | Labelled as such in a blockquote | Body only | Closed |
| C-105 | 7.2 dual LLM | Quarantined LLM holds no tools; privileged LLM reads no raw text; controller substitutes handles | Established practice | Willison, dual LLM pattern | Body, SVG, callout | Closed |
| C-106 | 7.2 residual risk | Fool-proof prevention is not established | Official guidance | OWASP LLM01:2025 | Body, callout | Closed |
| C-107 | 7.2 Llama Guard | Hazard categories S1 / S7 / S14 | Vendor documentation | Meta PurpleLlama model cards | Body, refs | Closed |
| C-108 | 7.2 | Latency claim removed | — | Unsourced claim deleted | Body | Closed |
| C-109 | 7.3 transports | stdio and Streamable HTTP are the two standard bindings | Normative specification | MCP 2026-07-28 transports | Body, refs, 4.8 | Closed |
| C-110 | 7.3 annotations | Clients MUST consider **annotations** untrusted **unless from trusted servers** | Normative specification | MCP 2026-07-28 tools | Body | Closed |
| C-111 | 7.3 HITL | Specification says SHOULD; three-class table is a journal model | Normative + working model | MCP 2026-07-28 tools | Body, table, SVG | Closed |
| C-112 | 7.3 RFC 8707 | `resource` required on both requests; servers must reject foreign-audience tokens | Normative specification | MCP 2026-07-28 authorization; RFC 8707 | Body, SVG, refs | Closed |
| C-113 | 7.3 confused deputy | Reserved for the proxy static-client-ID consent-cookie attack | Normative specification | MCP security best practices | Body, checklist | Closed |
| C-114 | 7.3 local servers | Local MCP server is arbitrary code with client privileges | Normative specification | MCP security best practices | Body, lede, checklist, callout | Closed |
| C-115 | 7.4 safetensors | No code-execution path in the format; audit found no critical vulnerability; three medium issues fixed | Original research | Trail of Bits / EleutherAI / HF audit | Body, table, SVG | Closed |
| C-116 | 7.4 safetensors | Protects the container, not the weights | Journal analysis | Derived from C-115 scope | Body, table, SVG, callout | Closed |
| C-117 | 7.4 `weights_only` | Default from 2.6 **when `pickle_module` is not passed**; `weights_only=False` recommended for legacy `nn.Module` | Vendor documentation | PyTorch serialization notes | Body, checklist, callout | Closed |
| C-118 | 7.4 ModelScan | Flag is `-p` / `--path`; formats include scikit-learn, XGBoost, cloudpickle, dill, joblib | Vendor documentation | ModelScan README | Two code blocks, SVG, refs | Closed |
| C-119 | 7.5 SecAgg | Pairwise masking + secret-shared dropout recovery; honest-but-curious, non-collusion threshold | Original research | Bonawitz et al., arXiv:1611.04482 | Body, table, SVG, callout | Closed |
| C-120 | 7.5 DP mechanism | (ε, δ) pairs with the Gaussian mechanism | Established practice | DP mechanism definitions; agrees with 9.3 | SVG, table | Closed |
| C-121 | 7.5 ε | No universal threshold; any value is a recorded local decision | Official guidance | NIST SP 800-226 | Body, checklist | Closed |
| C-122 | 7.5 robust aggregation | Krum, Trimmed Mean, **Bulyan** | Established practice | FL robust-aggregation literature | Body, SVG, callout | Closed |
| C-123 | 7.5 conflict | Robust aggregation must rank individual updates; plain SecAgg hides them | Journal analysis | Derived from C-119 and C-122 | Body, SVG, checklist, callout | Closed |
| C-124 | 7.5 Sybil | Authentication raises cost; does not prevent | Journal working rule | Stated as such | Body, checklist | Closed |
| C-125 | 7.5 regimes | Cross-device vs cross-silo differ in scale, availability, state, identity, threat | Established practice | Standard FL taxonomy | Body table, checklist | Closed |
| C-126 | 7.5 NIST SP 800-226 | Real title, final March 2025, DOI | Official guidance | `doi.org/10.6028/NIST.SP.800-226` | Refs | Closed |

## Topic completeness matrix

**C** covered · **OE** optional extension · **n/a** not applicable with reason. Every category that the originating review marked a **required gap** is now covered.

| Topic | Definition | Boundaries | Actors/components | Mechanism/sequence | Assumptions/dependencies | Threats/failures | Limits/residual risk | Selection/use | Operations/evidence | Recovery/lifecycle | Interoperability/migration | Unsafe alternatives |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7.1 AI risk frameworks | C | C (voluntary status stated) | C | C | OE | C | C ("What these frameworks do not cover") | C (three questions framing) | C | C (retirement, labelled) | n/a — single-framework scope | C (edition supersession stated) |
| 7.2 Prompt injection | C | C | C | C | C (controller assumptions) | C | C ("What none of this fixes") | C (enforced vs advisory) | C | n/a — no lifecycle artifact | n/a | C (string filtering marked inadequate) |
| 7.3 MCP & agentic | C | C (transports corrected) | C | C | C (local server trust) | C | C ("What remains after all of this") | C (privilege classes, labelled) | C | OE | C (revision currency stated) | C (HTTP+SSE marked superseded) |
| 7.4 Model supply chain | C | C | C | C | C | C | C (container vs weights) | C | C (runnable commands) | OE | C (migration to safetensors) | C (pickle marked legacy) |
| 7.5 Federated learning | C | C (cross-device vs cross-silo) | C | C | C (honest-but-curious, non-collusion) | C | C (SecAgg/robust conflict, operational cost) | OE | C | OE | n/a — single-architecture scope | OE |

## Cross-format and cross-page ledger

| Concept or claim | Representations compared | Result |
| --- | --- | --- |
| Every diagram's subject | 13 images × caption × alt × SVG `<title>`/`<desc>` | Agree; no image used twice on a page |
| OWASP edition | 7.1 table, 7.1 SVG panel, 7.1 refs, 7.3 body link | All say 2025 with explicit suffix |
| MCP transport model | 7.3 body, 7.3 refs, 4.8 body line 17, 4.8 refs | Agree: stdio + Streamable HTTP; HTTP+SSE superseded |
| SMPC vs homomorphic encryption | 7.5 table, 7.5 SVG, 9.3 PET table | Agree: distinct primitives |
| DP noise mechanism | 7.5 SVG, 9.3 table | Agree: Gaussian for (ε, δ); 9.3 already said "Laplacian or Gaussian" |
| Robust aggregation rules | 7.5 body, 7.5 SVG, 7.5 callout | Agree: Krum, Trimmed Mean, Bulyan |
| Safetensors guarantee | 7.4 lede, table, SVG, callout | Agree: no code-execution path; container not weights |
| `weights_only` scope | 7.4 body, checklist, callout | Agree, including the `pickle_module` condition |
| Section 7 nav chain | `_data/nav.yml`, `_includes/topic-nav.html`, five H1s | Agree, unchanged |

## Applicable durable content decisions

| Decision ID | Affected concept | Disposition | Current evidence and rationale |
| --- | --- | --- | --- |
| CD-0022 | MCP dedicated pages, transport model | Not applicable to this scope; invalidation condition noted | Its recorded condition "a new MCP specification materially changes the transport or authorization model" is now met by `2026-07-28`. Topic 4.8 was not changed here; flagged for a Section 4 review. |
| CD-0027 | Section 7 structure | Reaffirmed | Navigation, permalinks, numbering, and prev/next chain verified correct and unchanged. |
| CD-0029 | Topic 7.5 addition | Reaffirmed, with a source correction recorded | The record credits arXiv:1602.05629 with "FedAvg **and SecAgg** mechanics"; that paper covers FedAvg only. CD-0043 records the correct SecAgg source. |
| CD-0033 | One purpose-built image per frame; alt/caption agreement; full-size affordance; mobile legibility | Reaffirmed, scope extended by CD-0038 | Not reversed. Its file scope was Section 6 only, so the identical defect class survived in Section 7 and is now closed there. |
| CD-0034 | Formulas as literal text; mechanical enforcement | Reaffirmed, detector widened by CD-0042 | Not reversed. Its approved outcome was unmet on `topics/federated-learning-privacy.md` because the detector required a backslash command. The convention held; the enforcement did not. |
| CD-0038 – CD-0044 | This remediation | Added, accepted, implemented | Validated by `scripts/verify_content_decisions.py` (44 records). |

## Mechanical and rendered checks

| Check | Scope | Result | What this does not prove |
| --- | --- | --- | --- |
| `scripts/verify_writing_style.py` | 94 topic files | Pass | Structure only; not accuracy or completeness |
| `scripts/verify_rendering_hazards.py` (widened) | 94 topic files | Pass, after fixing 7.5 and 2.11 | Detects known hazard shapes; not diagram/caption agreement or legibility |
| Widened-pattern self-test | 6 positive, 5 negative cases | 11/11 correct | Regex behavior only |
| `scripts/verify_links.py` | 21 unique links across 5 pages | All resolve; one DOI redirect (expected) | A 200 does not prove the page supports the claim |
| `scripts/verify_content_decisions.py` | 44 records | Pass | Structure and references, not technical correctness |
| Jekyll build (github-pages 232) | Whole site | Success, 0 warnings | Generation only |
| Rendered frame audit | 13 frames across 5 pages | No image reused; all 13 openable; all captions/alt match | — |
| Rendered regression assertions | 5 pages | No LaTeX leak, no `LLM0x:2026`, no `SSE/HTTP`, no `Bruma`, no `ZERO RCE`, no `modelscan -d`, no `Privileged Input LLM`, no `2025-06-18` | String absence only |
| SVG geometry (`getBBox()` vs panels and viewBox) | All 13 Section 7 diagrams | No text crosses a panel edge or the viewBox | Chromium on macOS font stack only |
| Rendered desktop (1280 px) | 5 pages | No horizontal overflow; tables in `.table-scroll`; `<pre>` scrolls internally | — |
| Rendered mobile (375 px) | 5 pages | No overflow (`scrollWidth` 375 = `innerWidth`); "Full size ↗" affordance present and `zoom-in` | Wide diagrams remain small inline; the full-size link is the remedy |
| Visual inspection at full size | New diagrams incl. dual LLM, HITL gate, FL | Correct, legible, roles the right way round | — |

## Open required findings

None. All 36 required corrections (R1–R36) from the originating review were applied and verified against the frozen post-remediation state.

## Optional coverage

All 12 optional items (O1–O12) were applied, except as scoped below:

- O11 (`Comprehensive technical guide to …`) was corrected on the five Section 7 pages. It remains on 22 other pages journal-wide and is not a Section 7 defect.
- O5 (MCP tool "rug pull") was added as a definition-mutation paragraph rather than as a separate section, because the specification does not name the attack.

## Limitations and uncertainty

1. **This record does not claim a fresh review of the rewritten text.** Four of the five pages were substantially rewritten. The mandatory dimensions were applied to the replacement text as it was authored, and every material claim in it was verified against a primary source, but a genuinely independent fresh review of the new prose — by a reviewer who did not write it — has not been performed. That is a separate exercise.
2. **The OWASP 2026 ranking could not be read from a primary source.** The document is behind a registration form ("No Access"), and `genai.owasp.org/llmrisk2026/…` still serves 2025 content. CD-0039 records the deliberate choice to enumerate the primary-verifiable 2025 edition instead. Revisit when OWASP publishes the 2026 entries ungated.
3. **SVG geometry was measured in one engine.** Chromium on macOS, resolving `-apple-system`. A platform falling back to Segoe UI or Arial could differ by a few pixels.
4. **Rendered checks covered 1280 px and 375 px in one browser.** No tablet breakpoint, no Firefox or Safari, no print stylesheet, no forced-colors mode. No screen-reader test was run; alt-text accuracy was verified by comparing strings against SVG content.
5. **`verify_links.py` still cannot detect a citation whose URL resolves but does not support the claim.** This is how the fabricated NIST SP 800-226 title survived. No mechanical fix was attempted; content verification during review remains the only control.
6. **Two out-of-scope items were identified and left open**: Topic 4.8's currency against MCP `2026-07-28`, and Topic 9.3's overclaiming differential-privacy wording.

## Closure attestation

- [x] Every in-scope artifact was inventoried and read in full.
- [x] Every material claim changed by this remediation was entered in the ledger and dispositioned.
- [x] Every topic received a completeness classification for every category.
- [x] Every mandatory pass was completed separately.
- [x] Current primary sources were used for standards-sensitive and time-sensitive claims, except as disclosed in Limitations item 2.
- [x] Prose, metadata, diagrams, captions, alt text, examples, summaries, navigation, and generators were reconciled.
- [x] Applicable mechanical and rendered checks passed or their limitations are recorded.
- [x] Applicable durable content decisions were reconciled after the independent claim review, and no decision was reversed.
- [x] Residual exhaustion was completed after findings were assembled — it surfaced the Topic 2.11 instance, fixed in the same change.
- [x] The baseline change is documented, with the resulting state frozen and re-verified.
- [x] Required findings, optional coverage, and limitations are separated.

Closure conclusion: every finding raised by the 2026-08-14 fresh review of Section 7 is closed against scoped content fingerprint `48aa90d7000b999bf9c7d91e72675aac1be3c516294f8a1b5e88fbeda010baf1`. This is closure of the *originating findings*, not a gap-free assertion about the rewritten content — see Limitations item 1.

---

## Follow-up: the two out-of-scope items

Requested after the Section 7 remediation shipped. Both were identified by the originating review and deliberately excluded from its scope; they are closed here.

### Topic 4.8 — [mcp-authorization.md](../topics/mcp-authorization.md)

Refreshed from MCP `2025-11-25` to `2026-07-28`. Reading the current revision to make that change surfaced more than a version bump, so the following were added rather than only relabelled:

- Authorization is **optional** for an MCP implementation; the profile applies where HTTP authorization is used.
- Protected-resource discovery has a **client-side priority**: the `WWW-Authenticate` `resource_metadata` URL when present, falling back to well-known probing (sub-path form, then root). The page previously presented the two as symmetric alternatives.
- **Authorization-server metadata probing order** (OAuth AS Metadata before OIDC Discovery, with path-insertion rules) and the requirement to reject a document whose `issuer` does not match the URL it was fetched from.
- **Dynamic Client Registration is deprecated**, retained only for backwards compatibility. The registration priority is pre-registration → Client ID Metadata Documents → DCR → prompt. The previous table presented all three neutrally, which would have led a reader to the wrong default.
- **Authorization-server binding**: client credentials are keyed to the issuing AS and must not be reused when the AS changes; CIMD client IDs are portable.
- **RFC 9207 `iss` validation** on the authorization response, by exact string comparison with no normalization, including on error responses. PKCE alone does not prevent the mix-up attack this mitigates.
- **Scope selection and step-up**, including the union rule on re-authorization and `insufficient_scope`.
- Localhost redirect URIs cannot be attributed to a process; statelessness means a state handle is not proof of identity.
- Cross-links added in both directions between 4.8 and 7.3.
- `assets/img/mcp-oauth-discovery.svg`: subtitle and step-2 label aligned with the discovery priority, and a footer band added for the three validations the client owns.

### Topic 9.3 — [privacy-by-design-pets.md](../topics/privacy-by-design-pets.md)

The reported item was the differential-privacy overclaim. Applying the fix-verification rule to the whole affected content unit surfaced three neighbouring claims failing under the same rule, all corrected together:

- **Differential privacy** "guarantees that query outputs reveal no information about any single individual" → a bound set by ε on how much any record can change the output. Now consistent with 7.5.
- **Anonymization** "irreversible by any party under any circumstances" → judged by GDPR Recital 26's *means reasonably likely to be used* test, with the note that published re-identification research has recovered individuals from datasets released as anonymous.
- **GDPR Article 25** — the seven principles were described as "embedded into" it. Separated: the principles are a design framework, Article 25 is the binding obligation, and satisfying one does not satisfy the other.
- **FHE and SMPC** were adjacent rows but merged in the diagram; now stated as distinct primitives, consistent with 7.5. Each PET gained an assumption-or-cost column.
- ISO/IEC 27701 citation given its real title and second-edition (October 2025) status; NIST SP 800-226 added as the source for the DP bounding language.
- The diagram frame gained the `diagram-frame-openable` pattern, and the diagram's own overclaims were corrected to match.

### A third finding, surfaced by the fix

Reading 9.3 revealed four further literal LaTeX spans that the CD-0042 detector still missed, because it required subscript/superscript/brace notation: `$k$`, `$l$`, `$t$` and `$zk-SNARKs / zk-STARKs$` on 9.3, `$+$` on Topic 13.2, and `$S$` on Topic 8.3. All four fixed. The detector was widened a second time (CD-0047) to report any dollar-delimited span containing no digit with no whitespace against either delimiter — validated against 15 cases and the full 94-file corpus with no false positives.

**This is the second escape of the same defect class from a detector written for it.** Both earlier patterns were drawn around the instances then in hand rather than around the rendering behavior, which affects every dollar-delimited span regardless of content. The current rule excludes non-math structurally rather than by enumerating math.

### Follow-up checks

| Check | Result |
| --- | --- |
| `verify_rendering_hazards.py` (widened again) | 94/94 pass after fixing 4 instances in 3 files |
| Widened-pattern self-test | 15/15 correct (8 positive shapes, 7 negative) |
| `verify_writing_style.py` | 94/94 pass |
| `verify_links.py` on the 4 touched files | 17/17 verifiable links resolve; 2 hosts (`iso.org`, `ipc.on.ca`) return 403 to automated requests and were confirmed by hand |
| `verify_content_decisions.py` | 47 records validated |
| Rendered assertions | No LaTeX leak, no `2025-11-25`, no DP-guarantee wording, no anonymization absolute |
| SVG geometry | `mcp-oauth-discovery.svg` footer clean; three sub-pixel overhangs on pre-existing decorative label chips confirmed visually invisible |

### Follow-up decisions

CD-0045 (4.8 currency), CD-0046 (9.3 PET framing), CD-0047 (detector widening). CD-0022 is **reaffirmed** — its invalidation condition was met and triggered this refresh, but the dedicated-page structure it approved is unchanged.

### Still open

- The `Comprehensive technical guide to …` front-matter formula on 22 pages outside Section 7.

---

## Follow-up 2: OWASP 2026 enumeration closed against the primary document

The user supplied `OWASP-GenAI-LLM-Top-10-2026-v1.0.pdf` (122 pages, CC BY-SA 4.0), meeting CD-0039's recorded reopen condition exactly. CD-0039 is **superseded by CD-0048**; the earlier record is preserved.

The document confirms the ordering CD-0039 declined to publish from secondary summaries, so the earlier caution was correct but no longer necessary. Verified from its own table of contents and per-entry description pages:

| ID | Name | Doc. page |
| --- | --- | ---: |
| LLM01:2026 | Prompt Injection | 10 |
| LLM02:2026 | Sensitive Information Disclosure | 18 |
| LLM03:2026 | Excessive Agency | 23 |
| LLM04:2026 | Supply Chain | 27 |
| LLM05:2026 | Data and Model Poisoning | 33 |
| LLM06:2026 | Unbounded Consumption | 38 |
| LLM07:2026 | Misinformation | 43 |
| LLM08:2026 | Hidden Context Exposure | 46 |
| LLM09:2026 | Vector and Embedding Weaknesses | 50 |
| LLM10:2026 | Improper Output Handling | 55 |

Reading it supplied three things the secondary sources did not:

1. **Ranking methodology and its bias.** The community vote carries three-quarters of the weight against an incident corpus of 7,714 reports, 6,639 of which carried enough detail to classify. Prompt injection falls out of the top ten on raw incident count yet holds first place — a defense effect, since well-defended risks generate fewer public reports. Added to 7.1 as both a methodology note and a limitation.
2. **A scope boundary that matters for 7.3.** The list owns the model *as a component*; once it becomes an *actor* with tools and cross-session memory, risk moves to the OWASP Agentic Top 10 and its `ASI` identifiers. An MCP deployment sits on that boundary, so 7.3 now points at both.
3. **Stronger support for 7.2 than it previously had.** The 2026 LLM01 entry states that prompt injection is intrinsic to current generative AI and that **no reliable prevention mechanism exists today**, that defense is therefore architectural rather than interceptive, and it separates controls that reduce attack success — expected to degrade against adaptive attackers — from controls that bound blast radius, which are what survive. It also records that provenance marking reduces attack success in non-adaptive tests only. That is the enforced-versus-advisory split 7.2 already argued, now carrying a primary citation, and the injection scope widened to multimodal input, intermediate reasoning, and persistent memory.

Changes: 7.1's table, methodology note, limitations, callout and references; 7.1's diagram; 7.3's identifier, agentic boundary and references; 7.2's identifier, payload-source row, residual-risk section and references.

**A caveat on the document itself:** the copy read carries `[Publication date to be set]` on its title page and `[2026 release date] Version 2026 Release` in its revision history. The journal therefore cites the edition as 2026 without asserting a precise publication date from the document. That is recorded as an invalidation condition on CD-0048.

Verification: all ten identifiers and names render correctly and match the document; no 2025-era identifier or per-risk 2025 URL survives except the one deliberate migration note mapping `LLM06:2025` → `LLM03:2026` and `LLM07:2025` → `LLM08:2026`. Gate clean — structure 94/94, hazards 94/94, links 12/12 on the touched files, register 48 records.
