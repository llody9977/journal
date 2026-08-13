# Fresh review record: Section 1 (1.1–1.9) and local Jekyll toolchain

## Status and baseline

- Status: Complete with no open findings
- Review mode: Fresh review followed by implementation and final-state closure review
- Review date: 2026-08-13
- Reviewer: Codex
- Branch: `codex/deep-review-baseline`
- Commit: `5e27bcd8efe43878bedd3fd4bfa600209e1f3c33`
- Worktree: Dirty; the complete status is recorded in the external state capture identified below
- Review state ID: `4225db2239fea3ab914c9c7c835e4c43d30a5e847370b9d138e4b1f72b1fc53f`
- Scoped content fingerprint: `daf66d77f890194928a8ff797603443fd0b05537787f38873e0f12350f991034` (37 files)
- State-capture command: recorded after the final in-scope files were stable with `python3 scripts/capture_review_state.py` and explicit repeated `--scope` arguments; JSON saved outside the repository
- Baseline changed during review: Yes. Findings were implemented first; applicable semantic, consistency, mechanical, generator, link, accessibility, and rendered passes were repeated against the final state identified above.

## Scope inventory

| Artifact | Type | Direct dependents or generated counterpart | Inspected |
| --- | --- | --- | --- |
| `topics/security-fundamentals.md` | Topic 1.1 | Two diagrams, nav, rendered page | Yes |
| `topics/where-should-i-start.md` | Topic 1.2 | Program-roadmap diagram, nav, rendered page | Yes |
| `topics/security-objectives-properties.md` | Topic 1.3 | Properties matrix, nav, rendered page | Yes |
| `topics/trust-boundaries-threat-modeling.md` | Topic 1.4 | Trust-boundary DFD, nav, rendered page | Yes |
| `topics/risk-fundamentals.md` | Topic 1.5 | Risk-engine diagram, nav, rendered page | Yes |
| `topics/security-controls-defense-in-depth.md` | Topic 1.6 | Defense-in-depth diagram, nav, rendered page | Yes |
| `topics/identity-access-fundamentals.md` | Topic 1.7 | IAM diagram, nav, rendered page | Yes |
| `topics/incident-response-operational-learning.md` | Topic 1.8 | Incident-response diagram, nav, rendered page | Yes |
| `topics/operational-resilience-business-continuity-disaster-recovery.md` | Topic 1.9 | BCDR diagram, nav, rendered page | Yes |
| `assets/img/security-domains-overlap.svg` | Topic 1.1 diagram | Alt text and caption in 1.1; exporter | Yes, source and browser render |
| `assets/img/risk-management-lifecycle.svg` | Topic 1.1 diagram | Alt text and caption in 1.1; exporter | Yes, source and browser render |
| `assets/img/security-program-implementation-roadmap.svg` | Topic 1.2 diagram | Alt text and caption in 1.2; exporter | Yes, source and browser render |
| `assets/img/security-objectives-properties-matrix.svg` | Topic 1.3 diagram | Alt text and caption in 1.3; exporter | Yes, source and browser render |
| `assets/img/trust-boundaries-threat-modeling.svg` | Topic 1.4 diagram | Alt text and caption in 1.4; exporter | Yes, source and browser render |
| `assets/img/risk-fundamentals-engine.svg` | Topic 1.5 diagram | Alt text and caption in 1.5; exporter | Yes, source and browser render |
| `assets/img/defense-in-depth-architecture.svg` | Topic 1.6 diagram | Alt text and caption in 1.6; exporter | Yes, source and browser render |
| `assets/img/identity-access-architecture.svg` | Topic 1.7 diagram | Alt text and caption in 1.7; exporter | Yes, source and browser render |
| `assets/img/incident-response-lifecycle.svg` | Topic 1.8 diagram | Alt text and caption in 1.8; exporter | Yes, source and browser render |
| `assets/img/operational-resilience-bcdr.svg` | Topic 1.9 diagram | Alt text and caption in 1.9; exporter | Yes, source and browser render |
| `_data/nav.yml`, `_includes/nav.html`, `_includes/topic-nav.html`, `index.md` | Navigation | Section sequence and 1.9→2.1 boundary | Yes |
| `_layouts/default.html`, `assets/css/style.css`, `assets/js/main.js` | Shared presentation | All nine rendered pages and tables | Yes |
| `scripts/generate-journal-diagrams.mjs` | Diagram exporter | All canonical SVG files | Yes, two clean exports |
| `.github/workflows/deploy.yml`, `_config.yml` | Pages build configuration | GitHub Pages and local build | Yes |
| `.ruby-version`, `Gemfile`, `Gemfile.lock` | Ruby dependency contract | Local setup and Pages gem-set alignment | Yes |
| `bin/setup`, `bin/jekyll`, `scripts/ruby_runtime.sh`, `scripts/ruby_compat_shim.rb` | Local build launchers | Locked setup, build, and preview | Yes, syntax and execution |
| `README.md` | Contributor instructions | Local Jekyll setup and preview | Yes |

Out-of-scope boundaries and reason: Sections 2–8 were checked only where Section 1 navigation or a direct cross-link depended on them. Their independent topic claims were outside this Section 1 review. Deployment itself was not triggered; the local build and the existing deployment workflow were inspected.

## Review passes

| Pass | Complete | Evidence or notes |
| --- | --- | --- |
| Factual and technical correctness | Yes | All nine current topic sources and ten diagrams were assessed; corrections were reapplied to the final changed units. |
| Evidence, authority, version, date, jurisdiction, and applicability | Yes | Standards-sensitive claims were checked against current NIST, FIRST, IETF, ISO metadata, AWS, PCI SSC, EU, SEC, and other primary sources cited by the pages. |
| Adversarial wording, assumptions, attacker state, and counterexamples | Yes | Overclaims were bounded for control substitution, reachability, dependency types, replication, recovery, containment, and emergency access. |
| Terminology, taxonomy, and conceptual boundaries | Yes | Risk responses, control-classification axes, incident/continuity/DR ownership, identity assurance, and third-party dependency types were reconciled. |
| Cross-format consistency | Yes | Prose, front matter, tables, callouts, captions, alt text, SVG title/description/visible labels, and exporter output were compared. |
| Cross-page consistency, prerequisites, sequence, and duplication | Yes | 1.1–1.9 sequence, navigation, repeated risk/control language, operating loop, and 1.9→2.1 transition were checked. |
| Topic completeness | Yes | The matrix below was completed; required operational gaps were added rather than left as optional notes. |
| Mechanical, link, generator, executable, and rendered-output validation | Yes | The checks below passed against the final state. |
| Residual exhaustion | Yes | Residual searches and a rendered recheck caught and closed the last grouped response phrase and an SVG label overflow. |

## Material-claim ledger

Claim families are grouped at paragraph, table, diagram-region, or section granularity. Every material statement in each listed family was dispositioned; grouping avoids repeating the same source for adjacent rows that form one claim.

| ID | Artifact and location | Material claim family | Classification | Primary source or verification | Repetitions checked | Result |
| --- | --- | --- | --- | --- | --- | --- |
| C-001 | 1.1, security-domain table and diagram | InfoSec, cybersecurity, generic security, and system-security-engineering scope boundaries | Standards scope | FISMA, NIST CSF 2.0, ISO/IEC TS 27100 metadata, SP 800-160 | Table, lede, SVG, caption, alt | Closed |
| C-002 | 1.1, CIA and extended properties | CIA definitions and the boundaries of authenticity, accountability, privacy, safety, and resilience | Definition | FIPS 199, SP 800-63-4, SP 800-92, Privacy Framework, SP 800-160 | Prose, SVG, summary | Closed |
| C-003 | 1.1, lifecycle | Risk inputs, assessment, five response types, execution, and continuous monitoring | Journal synthesis with normative components | SP 800-30, SP 800-39, SP 800-37, SP 800-137 | Table, diagram, caption, checklist | Closed |
| C-004 | 1.1/1.5/1.6 | Share and transfer are distinct; compensating and deterrent are distinct classification axes | Taxonomy | SP 800-39; NIST compensating-controls glossary | Three pages and two diagrams | Closed |
| C-005 | 1.2, program pathways | Technical and governance entry paths converge on operation, response, recovery, and learning | Journal organizing model | CSF 2.0 and linked Section 1 sources | Prose, diagram, alt, caption, summary | Closed |
| C-006 | 1.2, mission context and applicability tables | FIPS, PCI DSS, GDPR, and framework scope depends on the stated system or jurisdictional trigger | Applicability | FIPS/NIST, PCI SSC, GDPR Article 3 | Tables, examples, summary | Closed |
| C-007 | 1.3, categorization | FIPS 199 categorizes information/information systems; FIPS 200 selects a system-wide baseline from SP 800-53B | Standard sequence | FIPS 199, FIPS 200, SP 800-53B | Prose, table, matrix, summary | Closed |
| C-008 | 1.3, traceability chain | Objectives require system-specific requirements, selected controls, verification evidence, and an explicit residual-risk decision | Journal engineering model | SP 800-53/53A concepts and Section 1 risk model | Table, checklist, summary | Closed |
| C-009 | 1.3, verification examples | SAST detects modeled static patterns but cannot prove absence across runtime behavior; detective logging is not automatically compensating | Capability boundary | NIST control definitions and compensating-controls glossary | Table, checklist | Closed |
| C-010 | 1.4, DFD elements | External entities are outside the modeled system boundary, not necessarily outside the organization; boundaries are verification transitions | Threat-model boundary | OWASP threat modeling and Microsoft SDL concepts | Prose, DFD, caption, alt | Closed |
| C-011 | 1.4, threat methods | STRIDE, PASTA, VAST, LINDDUN, attack trees, and misuse cases have distinct purposes and are not mandatory universal stages | Method taxonomy | OWASP and method-owner sources cited by page | Tables and summary | Closed |
| C-012 | 1.4, dependencies | Hosted-service dependencies and software-artifact dependencies require different assurance, continuity, integrity, and exit evidence | Completeness/boundary | SP 800-161, SP 800-218, SLSA 1.2 | Element table, checklist, references | Closed |
| C-013 | 1.5, risk model | Risk requires a plausible circumstance/threat, exposure, consequence, control context, and uncertainty; severity is not risk | Risk definition | SP 800-30, SP 800-39, FIRST CVSS | Definitions, examples, diagram, summary | Closed |
| C-014 | 1.5, aggregation | Individually acceptable risks may combine or concentrate through shared dependencies and exceed appetite | Completeness | NISTIR 8286B update 1 | New section, checklist, summary | Closed |
| C-015 | 1.5, scoring | CVSS, EPSS, KEV, environmental context, and reachability have distinct meanings; an unsupported call graph does not prove zero reachability | Tool boundary | FIRST CVSS 4.0, FIRST EPSS, CISA KEV | Scoring table, scenario, checklist | Closed |
| C-016 | 1.5, treatments | Accept, avoid, mitigate, share, and transfer are five separate responses and do not erase accountability | Taxonomy | SP 800-39 | Definition table, response table, diagram, summary, 1.1/1.3 repetitions | Closed |
| C-017 | 1.6, control labels | Operational role, compensating relationship, deterrent effect, and implementation domain are overlapping axes | Taxonomy | SP 800-53 and NIST glossary | Prose, tables, 1.1 diagram, checklist, summary | Closed |
| C-018 | 1.6, defense in depth | Useful layers have sufficiently independent failure modes; duplicate controls at one boundary can share bypasses | Architecture | SP 800-160 resilience concepts; documented journal example | Prose, diagram, checklist | Closed |
| C-019 | 1.6, concrete controls | WAF/schema validation, IDS/IPS, RTBH/FlowSpec, cryptography, and recovery controls have scoped mechanisms and residual limits | Mechanism/boundary | RFC 8955, RFC 5635, NIST sources cited by page | Tables, examples, diagram | Closed |
| C-020 | 1.6, lifecycle and exceptions | Design, implementation, operating effectiveness, change, retirement, approved exceptions, and revalidation are separate obligations | Lifecycle | SP 800-53/53A concepts | Lifecycle sections, checklist, summary | Closed |
| C-021 | 1.7, assurance | IAL, AAL, and FAL answer distinct questions and their levels must not be conflated | Identity taxonomy | SP 800-63-4 | Prose, assurance table, diagram | Closed |
| C-022 | 1.7, access control | Authentication, authorization, RBAC, ABAC, ReBAC, PEP/PDP, sessions, and workload identities have distinct responsibilities | Architecture | SP 800-63-4, SP 800-207, RFC 9449 | Tables, diagram, checklist | Closed |
| C-023 | 1.7, lifecycle and emergency access | Identity security includes proofing through revocation plus a controlled, tested emergency administrative path and return to normal | Completeness/lifecycle | SP 800-53 AC-2 and linked identity standards | Principles, lifecycle table, checklist, summary | Closed |
| C-024 | 1.8, incident lifecycle | Monitoring signals, detection/declaration, response, recovery, learning, and governance feedback are distinct but continuous | Lifecycle | SP 800-61 Rev. 3 and CSF 2.0 | Prose, diagram, caption, alt, summary | Closed |
| C-025 | 1.8, notification and roles | Notification clocks depend on the actual SEC/GDPR trigger; incident decisions require named authority and records | Applicability/operations | SEC disclosure rule, GDPR Article 33 | Readiness section and checklist | Closed |
| C-026 | 1.8, containment trade-off | Containment, volatile evidence, and critical-service continuity require threat-state, authority, alternative, and time-bound decisions | Completeness/adversarial | SP 800-61 Rev. 3 risk-management framing and forensic/continuity practices | New section, checklist, summary | Closed |
| C-027 | 1.8, severity and learning | Local severity tiers are illustrative; recovery and corrective-action closure require evidence and feedback | Boundary/evidence | SP 800-61 Rev. 3, CSF 2.0 | Tables, checklist, diagram | Closed |
| C-028 | 1.9, discipline boundaries | Operational resilience, business continuity, DR, and incident response have coordinated but distinct outcomes and owners | Definition/boundary | ISO 22301 metadata, ISO/IEC 27031 metadata, NIST sources | Prose, diagram, summary | Closed |
| C-029 | 1.9, BIA and objectives | BIA establishes critical services, dependencies, MTD, RTO, RPO, and recovery order; targets are not test evidence | Mechanism/evidence | SP 800-34 Rev. 1 | Prose, diagram, checklist | Closed |
| C-030 | 1.9, recovery patterns | AWS's four named patterns do not make active/passive a fifth named AWS strategy; recovery outcomes remain implementation-dependent | Version/scope | AWS Well-Architected | Strategy table, diagram, references | Closed |
| C-031 | 1.9, replication and cyber recovery | Replication can propagate corruption; isolated recovery administration, known-good sources, and validation address different failure modes | Adversarial boundary | SP 800-34, SP 800-53 and cited AWS guidance | Prose, safeguards, checklist | Closed |
| C-032 | 1.9, exercises and maintenance | Recovery claims require measured exercises; plans need cadence and change-triggered review, versioning, distribution, obsolete-copy retirement, and retest | Lifecycle/completeness | SP 800-34, SP 800-53 CP-2 | Exercise table, maintenance section, diagram, checklist, summary | Closed |
| C-033 | Shared mobile UI | Only overflowing tables become keyboard regions; the closed mobile navigation is inert/hidden and traps focus while open | Accessibility/behavior | Rendered browser behavior and DOM state | CSS, JS, layout, all nine pages | Closed |
| C-034 | Local Jekyll toolchain | Repository pins match the current Pages action gem set; local dependencies stay ignored and are excluded from published output | Build reproducibility | Current action image source, locked dependency resolution, clean local build | Workflow, Gem files, launchers, README, generated site | Closed |

## Topic completeness matrix

Each “Covered” result was checked in the page itself or in a clearly linked neighboring Section 1 page. It does not imply that every page needs a heading for every column.

| Topic | Definition | Boundaries | Actors/components | Mechanism/sequence | Assumptions/dependencies | Threats/failures | Limits/residual risk | Selection/use | Operations/evidence | Recovery/lifecycle | Interoperability/migration | Unsafe alternatives |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1 What Is Security? | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered through 1.8/1.9 | Covered through domain overlap | Covered |
| 1.2 Where Should I Start? | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered through pathway convergence | Covered |
| 1.3 Security Objectives & Properties | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered through traceability | Covered through requirement mapping | Covered |
| 1.4 Trust Boundaries & Threat Modeling | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered through maintenance checklist | Covered through dependency/exit evidence | Covered |
| 1.5 Threats, Vulnerabilities & Risk | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered through monitoring/review triggers | Covered through aggregation/dependencies | Covered |
| 1.6 Security Controls & Defense in Depth | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered through change/retirement | Covered |
| 1.7 Identity & Access Fundamentals | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered through federation/lifecycle | Covered |
| 1.8 Monitoring, Incident Response & Operational Learning | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered through communications/dependencies | Covered |
| 1.9 Operational Resilience, BCDR | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered through failover/failback, supplier loss, and change control | Covered |

## Cross-format and cross-page ledger

| Concept or claim | Representations compared | Result |
| --- | --- | --- |
| Five risk responses | 1.1 prose/table/diagram; 1.3 residual decision; 1.5 prose/table/diagram/summary | Separate Accept, Avoid, Mitigate, Share, and Transfer everywhere | Closed |
| Control classification axes | 1.1 table/diagram; 1.6 definitions/tables/checklist/summary | Compensating and deterrent no longer presented as one control type | Closed |
| Operational loop completeness | 1.2 prose/diagram/alt/caption and 1.8/1.9 destinations | Governance and technical paths continue into operation, response, recovery, and learning | Closed |
| Third-party dependencies | 1.4 table/checklist/references and 1.9 supplier/continuity material | Artifact and hosted-service risks receive distinct evidence | Closed |
| Incident/continuity/DR ownership | 1.8 roles and containment decisions; 1.9 discipline boundary, activation, exercises | Responsibilities and decision authority remain distinct and coordinated | Closed |
| Emergency identity access | 1.7 principles/lifecycle/checklist/summary and IAM diagram context | Controlled path and return-to-normal requirements are present | Closed |
| BCDR maintenance feedback | 1.9 prose/checklist/callout, diagram visible labels/description, alt, caption | Change-triggered maintenance and obsolete-copy handling agree | Closed |
| Navigation | Nav data, rendered sidebar, topic footer, homepage, 1.9→2.1 transition | Ordering and both directions agree | Closed |
| Diagram generation | Ten Section 1 SVG sources and all exporter outputs | Canonical exports are byte-identical and non-destructive | Closed |
| Jekyll dependency placement | Root contracts, `bin`, `scripts`, ignored `vendor/bundle`, `_config.yml`, generated output | Source/runtime files remain in conventional locations; local dependencies and internal docs are not published | Closed |

## Mechanical and rendered checks

| Check | Scope | Result | What this does not prove |
| --- | --- | --- | --- |
| `scripts/verify_writing_style.py` | All 59 topic pages | Passed | Does not prove factual correctness or completeness |
| Locked Jekyll setup and version | Ruby 3.3.12, Bundler 4.0.16, five direct dependencies | Passed; Jekyll 3.10.0 | Does not execute GitHub's hosted runner |
| Jekyll production build | Complete repository | Passed | Does not deploy Pages |
| Generated-site leak check | Build output | No tooling, dependency folders, or internal review/style files published | Does not assess remote CDN behavior |
| Local link/asset/anchor checker | 60 generated HTML pages, 3,959 references | Passed | Does not prove external-link uptime or source correctness |
| XML parse | All 80 canonical SVG files | Passed | Does not prove visual layout |
| Diagram exporter | Two clean output directories plus canonical comparison | All 80 SVGs byte-identical | Does not prove semantic correctness by itself |
| Browser render, desktop | All nine Section 1 pages and ten diagrams at a 1,440/1,280-class viewport | No document/image overflow; tables not needlessly focusable; diagrams visually clear | Chromium result does not prove identical rendering in every browser |
| Browser render, phone | All nine Section 1 pages at 375 px | No page overflow/cropped images; table canvases bounded to 704–809 px with wrapped cells | Does not replace testing on every physical device |
| Mobile navigation interaction | Phone viewport | Closed menu hidden/inert; open focus moves inside; last-item Tab wraps; Escape closes and returns focus | Does not replace a complete assistive-technology certification |
| Browser console | Fresh page tab | No page warnings or errors | Screenshot tooling emitted separate internal errors while capturing raw SVG tabs; a clean page tab confirmed they were not site errors |
| Shell/Ruby syntax and diff whitespace | New launchers, compatibility shim, repository diff | Passed | Does not prove every future Ruby patch release will remain compatible |

## Open required findings

None.

## Optional coverage

None left open from this review. The optional mobile-readability, navigation-accessibility, diagram-clarity, and completeness additions were implemented and verified.

## Limitations and uncertainty

- Rendered validation used Chromium through the in-app browser at desktop and 375 px phone widths; Safari and Firefox were not separate target environments for this repository.
- ISO full standards text is licensed. ISO version and scope statements were checked against ISO's official public metadata; detailed mechanisms were anchored in public NIST/AWS sources where applicable.
- External links were assessed as sources during the semantic review, but the mechanical link checker intentionally validated only generated local links, assets, and anchors.
- The current GitHub Pages action supplies its own build image. The repository lock reproduces that published gem set locally, but only an actual hosted workflow run can prove future runner behavior after an action-image update.

## Closure attestation

- [x] Every in-scope artifact was inventoried and read in full.
- [x] Every material claim was entered in the ledger and dispositioned.
- [x] Every topic received a completeness classification for every category.
- [x] Every mandatory pass was completed separately.
- [x] Current primary sources were used for standards-sensitive and time-sensitive claims.
- [x] Prose, metadata, diagrams, captions, alt text, examples, summaries, navigation, and generators were reconciled.
- [x] Applicable mechanical and rendered checks passed or their limitations are recorded.
- [x] Residual exhaustion was completed after findings were assembled.
- [x] The baseline remained frozen after the final capture; earlier edits and repeated passes are documented above.
- [x] Required findings, optional coverage, and limitations are separated.

Closure conclusion: Complete with no open required or optional Section 1 findings for the captured final worktree state. This conclusion applies only to the recorded fingerprint and does not transfer automatically to later edits or dependency/action updates.
