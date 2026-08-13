# Fresh review record: Section 3 — Key Management

## Status and baseline

- Status: Complete with no open findings
- Review mode: Fresh-review closure after implementation
- Review date: 2026-08-13
- Reviewer: Codex
- Branch: `main`
- Reviewed content commit: `99440e3f23a3a3e8eec6435ddc163d4b24019be7`
- Worktree at review freeze: Clean
- Review state ID: `d0328bfbc5c0b014b652648a51be73b833d74ced37e8c9a81c68c3d9aa142a54`
- Scoped content fingerprint: `550e35ce5197a2bca6959ecb1859321d0a236242454dc5a0c1d5ca116a80642c`
- State-capture command: `python3 scripts/capture_review_state.py` with the 26 artifacts listed below passed through repeated `--scope` arguments
- Baseline changed during review: No. This record was added only after the clean content state had passed closure.

## Scope inventory

| Artifact | Type | Direct dependents or generated counterpart | Inspected |
| --- | --- | --- | --- |
| `topics/hsm-kms.md` | Topic, two browser demonstrations | Envelope diagrams, CSS, ending template | Yes |
| `topics/key-inventory-classification-ownership.md` | Topic | Rotation, compromise, and agility pages | Yes |
| `topics/key-lifecycle-cryptoperiods.md` | Topic | Lifecycle diagram and retirement workflows | Yes |
| `topics/secure-key-generation-provisioning.md` | Topic | NIST 90-series generation boundary | Yes |
| `topics/key-rotation-versioning-rewrapping-reencryption.md` | Topic | Inventory, envelope, recovery, and provider models | Yes |
| `topics/key-authorization-administration-audit.md` | Topic | Incident, recovery, and architecture controls | Yes |
| `topics/key-backup-recovery-destruction.md` | Topic | Rotation and compromise workflows | Yes |
| `topics/key-compromise-emergency-rekeying.md` | Topic | Emergency-rekeying decision tree | Yes |
| `topics/kms-architecture-interoperability.md` | Topic | Portability registry and envelope formats | Yes |
| `topics/cryptographic-agility-pqc-operations.md` | Topic | Chapter 2 algorithm choices and SP 800-208 | Yes |
| `topics/keys-vs-secrets-certificates-tokens.md` | Topic | OAuth, federation, certificate, and STS boundaries | Yes |
| Four Chapter 3 SVG files | Canonical diagrams | Topic images and canonical exporter | Yes |
| `_data/nav.yml`, navigation includes | Navigation | 2.17 → 3.1–3.11 → 4.1 | Yes |
| Layout, CSS, JavaScript, and `_config.yml` | Shared rendering | Desktop and mobile topic output | Yes |
| `scripts/generate-journal-diagrams.mjs` | Canonical SVG exporter | All 83 SVG files | Yes |
| `scripts/add_style_sections_all.py` | Ending-section template | HSM & KMS summary and references | Yes |
| `reviews/CONTENT_DECISIONS.yml` | Durable decision register | Decisions CD-0010 and CD-0015–CD-0019 | Yes |

Out-of-scope boundaries: Chapter 2 and Chapter 4 topic bodies were inspected only where a Chapter 3 claim depended on them. Their unrelated content was not reopened.

## Review passes

| Pass | Complete | Evidence or notes |
| --- | --- | --- |
| Factual and technical correctness | Yes | All Chapter 3 pages and changed diagrams/demonstrations were reread against current primary sources. |
| Evidence, authority, version, date, jurisdiction, and applicability | Yes | NIST, OASIS, RFC, AWS, and Google sources were checked directly; changed pages use `last_verified: 2026-08-13`. |
| Adversarial wording, assumptions, attacker state, and counterexamples | Yes | Rewrap-only AAD, opaque rotation, compromised KEKs, stateful signatures, token semantics, and destruction claims were challenged separately. |
| Terminology, taxonomy, and conceptual boundaries | Yes | HSM/KMS, DEK/KEK, RBG components, rotation models, stateful/stateless signatures, and keys/secrets/certificates/tokens remain distinct. |
| Cross-format consistency | Yes | Prose, summaries, demonstrations, diagrams, captions, alt text, metadata, and template text were reconciled. |
| Cross-page consistency, prerequisites, sequence, and duplication | Yes | Inventory, lifecycle, rotation, recovery, compromise, portability, and PQC operations now use the same dependency and retirement rules. |
| Topic completeness | Yes | Matrix below contains no required or optional gap. |
| Mechanical, link, generator, executable, and rendered-output validation | Yes | Checks are recorded below. |
| Durable content-decision reconciliation | Yes | CD-0010 and CD-0015 reaffirmed; CD-0016–CD-0019 implemented and validated. |
| Residual exhaustion | Yes | Finding terms and their semantic variants were searched after the final edits; neighboring claims were reread using the same reasoning. |

## Material-claim ledger

| ID | Artifact and location | Material claim | Classification | Primary source or verification | Repetitions checked | Result |
| --- | --- | --- | --- | --- | --- | --- |
| C-001 | 3.1 HSM/KMS boundary | An HSM is a module boundary; a KMS is a wider management system | Taxonomy/applicability | FIPS 140-3, SP 800-130, CMVP | Lede, table, summary | Closed |
| C-002 | 3.1 PKCS #11 attributes | Non-extractability constrains the interface without proving hardware custody | Interface/security boundary | PKCS #11 v3.1, browser export test | Table, simulator, summary | Closed |
| C-003 | 3.1 envelope flow | Mutable wrapping metadata cannot change as payload AAD during rewrap-only updates | AEAD/integrity | SP 800-38D and SP 800-38F | Prose, demo, desktop/mobile SVG | Closed |
| C-004 | 3.1 browser envelope demo | An unwrapped decrypt-only DEK need not be exportable | Executable/API behavior | W3C Web Cryptography API, runtime decrypt | Source, displayed output | Closed |
| C-005 | 3.2 inventory summary | Rotation can start before final dependency retirement | Lifecycle/operability | SP 800-57 and Chapter 3.5 sequence | Lede, workflow, summary | Closed |
| C-006 | 3.3 lifecycle | Reversible suspension, deactivation, compromise, recovery, and destruction have different gates | Lifecycle/taxonomy | SP 800-57, KMIP | Table, diagram, caption, summary | Closed |
| C-007 | 3.4 RBG architecture | SP 800-90B, 90A, and 90C cover entropy sources, DRBG mechanisms, and complete RBG constructions respectively | Standards boundary | SP 800-90A/B/C, SP 800-133 | Body and references | Closed |
| C-008 | 3.4 provisioning | BYOK changes provenance and exposure without establishing exclusive custody | Custody/assumption | SP 800-133, SP 800-38F | Table, prose, summary | Closed |
| C-009 | 3.5 rotation models | Opaque in-place material rotation and explicit version rotation expose different controls | Provider behavior/operability | AWS and Google Cloud KMS documentation | Lede, model table, workflow, summary | Closed |
| C-010 | 3.5 rewrap versus re-encrypt | Rewrap is sufficient only while the DEK and content construction remain trusted | Security decision | SP 800-38F, cross-page compromise analysis | Table, prose, summary, 3.8 | Closed |
| C-011 | 3.6 authorization | Policy mutation can convey indirect key-use power | Authorization/threat | SP 800-130, SP 800-53 | Roles, break-glass, audit, summary | Closed |
| C-012 | 3.7 recovery/destruction | Recoverability and destruction depend on key purpose and complete dependency evidence | Lifecycle/residual risk | SP 800-57, AWS and Google deletion guidance | Tables, workflow, summary | Closed |
| C-013 | 3.8 emergency rekeying | Remediation follows compromised key purpose and occurrence window; rotation alone is insufficient | Incident/threat | SP 800-57, KMIP, SP 800-61 | Prose, table, decision tree, caption | Closed |
| C-014 | 3.9 portability | Interface compatibility and serialization do not preserve key material, envelope, policy, or identity portability | Interoperability | SP 800-130, PKCS #11, KMIP | Comparison, registry, summary | Closed |
| C-015 | 3.10 crypto agility | Algorithm support alone does not establish production migration readiness | Migration/applicability | CSWP 39upd1, NIST PQC migration material | Lede, workflow, testing, summary | Closed |
| C-016 | 3.10 LMS/XMSS | Stateful signing state must advance durably and cannot be cloned or rolled back | Critical security/operations | SP 800-208 | Migration table, state section, references | Closed |
| C-017 | 3.10 PQC status | ML-KEM, ML-DSA, and SLH-DSA are final while current errata notices remain relevant | Version/currentness | FIPS 203–205 publication pages | Body and references | Closed |
| C-018 | 3.11 object taxonomy | Tokens can convey issued authorization, credentials, or assertions and are not universally delegation | Taxonomy/protocol | RFC 6749, SP 800-63C-4 | Lede, table, selection rule, summary | Closed |
| C-019 | Chapter navigation and presentation | The complete chapter remains reachable, responsive, and free of broken local references | Mechanical/rendering | Built-site checker and browser sweep | All 11 pages, navigation, CSS | Closed |

## Topic completeness matrix

`C` means covered locally or through an explicit, sufficient neighboring-page link.

| Topic | Definition | Boundaries | Actors/components | Mechanism/sequence | Assumptions/dependencies | Threats/failures | Limits/residual risk | Selection/use | Operations/evidence | Recovery/lifecycle | Interoperability/migration | Unsafe alternatives |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3.1 HSM & KMS | C | C | C | C | C | C | C | C | C | C | C | C |
| 3.2 Inventory | C | C | C | C | C | C | C | C | C | C | C | C |
| 3.3 Lifecycle | C | C | C | C | C | C | C | C | C | C | C | C |
| 3.4 Generation | C | C | C | C | C | C | C | C | C | C | C | C |
| 3.5 Rotation | C | C | C | C | C | C | C | C | C | C | C | C |
| 3.6 Authorization | C | C | C | C | C | C | C | C | C | C | C | C |
| 3.7 Recovery/destruction | C | C | C | C | C | C | C | C | C | C | C | C |
| 3.8 Compromise | C | C | C | C | C | C | C | C | C | C | C | C |
| 3.9 Architecture | C | C | C | C | C | C | C | C | C | C | C | C |
| 3.10 Agility/PQC | C | C | C | C | C | C | C | C | C | C | C | C |
| 3.11 Object boundaries | C | C | C | C | C | C | C | C | C | C | C | C |

## Cross-format and cross-page ledger

| Concept or claim | Representations compared | Result |
| --- | --- | --- |
| Envelope AAD and rewrapping | 3.1 prose, demonstration, output, two SVGs, 3.5 rewrap table, 3.8 incident guidance | Consistent |
| Key rotation and retirement | 3.2 summary, 3.3 lifecycle, 3.5 provider models/workflow/summary, 3.7 destruction | Consistent |
| RBG architecture | 3.4 body/references and Chapter 2 prerequisite terminology | Consistent |
| Emergency compromise flow | 3.8 lede, impact table, decision tree, remediation list, summary | Consistent |
| Portability | 3.9 boundary table, exit workflow, registry, summary | Consistent |
| PQC operations | 3.10 metadata, migration table, stateful-signature section, workflow, summary, Chapter 2 algorithm choices | Consistent |
| Token semantics | 3.11 metadata, lede, comparison table, selection rule, summary, linked OAuth/STS/federation pages | Consistent |
| Presentation and generation | Canonical SVGs, responsive `<picture>`, captions, alt text, CSS, exporter, ending template | Consistent |

## Applicable durable content decisions

| Decision ID | Affected concept | Disposition | Current evidence and rationale |
| --- | --- | --- | --- |
| CD-0010 | Key establishment taxonomy | Reaffirmed | Chapter 3.4 and 3.10 preserve agreement, KEM, derivation, wrapping, and payload encryption boundaries. |
| CD-0015 | Canonical SVG source | Reaffirmed | Both clean exports produced 83 byte-identical canonical SVG files; no independent active drawing definition was introduced. |
| CD-0016 | Payload AAD versus wrapping metadata | Implemented | Prose, demo, and diagrams now preserve rewrap-only semantics and disclose the demo's missing production header integrity. |
| CD-0017 | Opaque versus explicit rotation | Implemented | AWS automatic/manual and Google explicit-version behavior are separately scoped. |
| CD-0018 | Stateful signature recovery | Implemented | LMS/XMSS monotonic state, crash, cloning, backup, HA, and exhaustion constraints are present. |
| CD-0019 | Token semantics | Implemented | Delegation is no longer treated as universal to issued credentials or assertions. |

## Mechanical and rendered checks

| Check | Scope | Result | What this does not prove |
| --- | --- | --- | --- |
| Writing-structure verifier | All 59 topic files | Passed | Does not prove technical correctness |
| Decision-register validator | 19 decisions | Passed | Does not prove the decisions' technical rationale |
| Jekyll build | Complete site | Passed | Does not prove browser layout or source accuracy |
| Local link, asset, and anchor scan | 60 HTML pages, 3,963 local references | Zero errors | Does not prove external-source authority |
| External URL retrieval | 28 changed-topic URLs | 27 returned 200; one NCCoE landing page blocked automation with 403 while its official linked PDF returned 200 | Does not prove every statement supported by the page |
| XML validation | Four changed/new SVG files | Passed | Does not prove visual clarity |
| Canonical exporter | 83 SVGs, two clean outputs | Byte-identical to each other and canonical assets | Does not prove semantic correctness |
| Envelope demonstration | Encrypt, display AAD/metadata boundary, unwrap, decrypt | Passed; payload restored with non-extractable decrypt-only DEK | Browser simulation is not KMS/HSM custody |
| Non-extractability demonstration | Generate and export-rejection path | Export rejection passed; limitations remain explicit | Does not prove hardware backing or PKCS #11 conformance |
| Desktop browser sweep | All 11 pages | Correct titles/navigation, zero content overflow, broken images, or normal console errors | Does not test every browser engine |
| 375 px browser sweep | All 11 pages | `scrollWidth == clientWidth`; mobile diagram selected and all new diagrams visually readable | Does not cover every device width or font override |
| Navigation boundaries | 2.17 → 3.1–3.11 → 4.1 | Passed | Does not prove content correctness |

## Open required findings

None.

## Optional coverage

All optional items from the Chapter 3 fresh review were implemented:

1. A lifecycle-state diagram was added to 3.3.
2. An emergency-rekeying decision tree was added to 3.8.
3. A portability registry was added to 3.9.

## Limitations and uncertainty

- The in-app automation environment does not support JavaScript `prompt()`, so the final PIN-gated signing click could not be driven automatically. Its WebCrypto sign/verify code and limitation labels were inspected; the key-generation and export-rejection branches were executed. This is a test-environment limitation, not an open content finding.
- The NCCoE PQC migration landing page returned HTTP 403 to automated retrieval. Its official source URL remains in place, and the directly linked official NIST/NCCoE material used for the affected claims was accessible.

## Closure attestation

- [x] Every in-scope artifact was inventoried and read in full.
- [x] Every material claim was entered in the ledger and dispositioned.
- [x] Every topic received a completeness classification for every category.
- [x] Every mandatory pass was completed separately.
- [x] Current primary sources were used for standards-sensitive and time-sensitive claims.
- [x] Prose, metadata, diagrams, captions, alt text, examples, summaries, navigation, and generators were reconciled.
- [x] Applicable mechanical and rendered checks passed or their limitations are recorded.
- [x] Applicable durable content decisions were reconciled and every material recurring choice was recorded.
- [x] Residual exhaustion was completed after findings were assembled.
- [x] The reviewed content baseline remained frozen.
- [x] Required findings, optional coverage, and limitations are separated.

Closure conclusion: Chapter 3 has no open required finding or optional coverage item on the reviewed content commit and fingerprint above.
