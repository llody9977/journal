# Fresh review record: Section 2 (2.1–2.17)

## Status and baseline

- Status: Complete with no open required or optional findings
- Review mode: Fresh review followed by remediation and final-state closure review
- Review date: 2026-08-13
- Reviewer: Codex
- Branch: `main`
- Starting commit: `fe766319862270f397632f4cbeb271c561177ea8`
- Worktree: Dirty; the complete status is recorded in the state capture identified below
- Initial review state ID: `d8a2ec35e126c9a95cae3b6b2c558a85e13f37815e2e597e5b31b094120a9a88`
- Initial scoped content fingerprint: `28e606d125190f2b9fef1f295c19f6a9e824acaa3901b3c923d37a7a1cc8feb1` (58 files)
- Final review state ID: `74292a3ad2b2ba21d3b2b65ba0c63fc76aec177b2c23574e854ea96818211331`
- Final scoped content fingerprint: `5df5029ef77867f246b8154bb755a556a6e55f87fec11fa1ead746778681b9c1` (62 files)
- State-capture command: `python3 scripts/capture_review_state.py` with an explicit scope manifest after all in-scope files were stable; JSON saved outside the repository
- Baseline changed during review: Yes. All changed topic, diagram, registry, generator-policy, build, interaction, and rendered units were rechecked against the final state.
- Administrative-record boundary: This review record is outside the reviewed content fingerprint. It was created before the final capture, so its untracked path was already present in the captured Git status; only its placeholder values were updated afterward.

## Scope inventory

| Artifact | Type | Direct dependents or generated counterpart | Inspected |
| --- | --- | --- | --- |
| `topics/cryptography-overview.md` | Topic 2.1 | Threat and TLS-layer diagrams, demos, navigation | Yes |
| `topics/symmetric-cryptography.md` | Topic 2.2 | Symmetric-flow, AES-round, and ECB diagrams; demo | Yes |
| `topics/symmetric-mode-attacks.md` | Topic 2.3 | ECB, CBC bit-flip, and CTR reuse diagrams; demos | Yes |
| `topics/asymmetric-cryptography.md` | Topic 2.4 | Asymmetric-flow and key-size diagrams; RSA demo | Yes |
| `topics/symmetric-vs-asymmetric.md` | Topic 2.5 | Hybrid public-key-encryption diagram | Yes |
| `topics/post-quantum-cryptography.md` | Topic 2.6 | Quantum-impact diagram and standards tables | Yes |
| `topics/hash-functions-macs.md` | Topic 2.7 | Hash-property, avalanche, and HMAC diagrams; demo | Yes |
| `topics/hash-collisions-length-extension.md` | Topic 2.8 | Collision files and interactive demonstrations | Yes |
| `topics/key-exchange-derivation.md` | Topic 2.9 | Diffie–Hellman and HKDF diagrams; demo | Yes |
| `topics/digital-signatures.md` | Topic 2.10 | Signature-pipeline diagram and demo | Yes |
| `topics/recommended-algorithms.md` | Topic 2.11 | Quantum-impact diagram and regional-profile tables | Yes |
| `topics/certificates.md` | Topic 2.12 | CA, lifecycle, and lifetime diagrams; OpenSSL examples | Yes |
| `topics/tls-ssl-handshake.md` | Topic 2.13 | TLS-handshake diagram and protocol matrix | Yes |
| `topics/certificate-transparency.md` | Topic 2.14 | Merkle-tree and SCT-flow diagrams | Yes |
| `topics/password-storage.md` | Topic 2.15 | Password-hash comparison and interactive demo | Yes |
| `topics/full-disk-file-encryption.md` | Topic 2.16 | Encryption-scope and DEK/KEK diagrams | Yes |
| `topics/blockchain-cryptography.md` | Topic 2.17 | Blockchain-layer diagram and migration guidance | Yes |
| 28 unique SVG files referenced by Section 2 | Diagram sources | Topic prose, alt text, captions, exporter | Yes, source plus representative and changed browser renders |
| Four collision demonstration downloads | GIF/PDF evidence assets | Topic 2.8 | Yes, reference, presence, and render/link path |
| `_data/nav.yml`, `_includes/nav.html`, `_includes/topic-nav.html`, `index.md` | Navigation | Section sequence and 1.9→2.1→…2.17→3.1 boundaries | Yes |
| `_layouts/default.html`, `assets/css/style.css`, `assets/js/main.js`, `_config.yml` | Shared presentation/build | All 17 rendered pages and interactive demonstrations | Yes |
| `scripts/generate-journal-diagrams.mjs` | Canonical SVG exporter | All 80 repository SVG assets | Yes, two clean deterministic exports |
| Three Section 2 one-time SVG rewrite utilities | Retired historical scripts | Could otherwise overwrite reviewed SVG sources | Yes; moved to `scripts/legacy/` and guarded against execution |
| `reviews/CONTENT_DECISIONS.yml` | Durable semantic-decision registry | Future review comparison and flip-flop prevention | Yes; seven new decisions validated |

Out-of-scope boundaries and reason: Sections 1 and 3–8 were checked only at navigation boundaries or where a Section 2 claim directly depended on them. Their independent topic claims were outside this Section 2 review. The hosted deployment was not triggered; the repository build and existing local presentation contract were tested.

## Review passes

| Pass | Complete | Evidence or notes |
| --- | --- | --- |
| Factual and technical correctness | Yes | All 17 topic sources, referenced assets, examples, and interactive-result claims were reviewed; corrected units received a final semantic pass. |
| Evidence, authority, version, date, jurisdiction, and applicability | Yes | Standards-sensitive claims were checked against current NIST/FIPS, NSA, BSI, IETF/RFC, CA/B Forum, and other primary authorities used by the pages. |
| Adversarial wording, assumptions, attacker state, and counterexamples | Yes | Quantum-cost, collision, HMAC-origin, PFS, erasure, revocation, nonce, replay, and protocol-negotiation claims were bounded. |
| Terminology, taxonomy, and conceptual boundaries | Yes | Agreement, KEM, KDF, key wrapping, AEAD, signatures, certificates, PKI, ECH, PFS, and lifecycle terms were separated. |
| Cross-format consistency | Yes | Prose, front matter, tables, formulas, demonstrations, captions, alt text, SVG metadata, visible labels, and exported SVGs were compared. |
| Cross-page consistency, prerequisites, sequence, and duplication | Yes | Repeated quantum, hybrid-encryption, TLS, HMAC, key-establishment, certificate, and algorithm-profile claims were reconciled across the chapter. |
| Topic completeness | Yes | The matrix below was completed for every topic; the optional blockchain post-quantum migration gap was implemented. |
| Mechanical, generator, executable, link, and rendered-output validation | Yes | Final checks are recorded below and passed against the final state. |
| Residual exhaustion | Yes | Residual phrase searches and visual inspection found and closed a final HMAC-formula rendering defect. |

## Material-claim ledger

Claim families are grouped at paragraph, table, demonstration, or diagram-region granularity. Grouping avoids repeating the same primary source for adjacent statements that make one claim.

| ID | Artifact and location | Material claim family | Classification | Primary source or verification | Repetitions checked | Result |
| --- | --- | --- | --- | --- | --- | --- |
| C-001 | 2.1, cryptographic goals and layer model | Confidentiality, integrity, authentication, non-repudiation, primitive roles, and protocol composition have distinct guarantees | Definition/boundary | NIST cryptographic standards and protocol sources cited by page | Lede, tables, TLS-layer diagram, summary | Closed |
| C-002 | 2.1/2.2/2.5/2.9/2.13 | TLS establishes shared keying material and derives traffic secrets/keys; it does not transmit a pre-existing AES traffic key | Protocol mechanism | RFC 9846 and RFC 5869 | Five pages and three diagrams | Closed |
| C-003 | 2.2, AES round structure | Initial AddRoundKey, repeated full rounds, and final round without MixColumns are separate stages | Algorithm mechanism | FIPS 197 | Prose, alt, caption, SVG | Closed |
| C-004 | 2.2/2.6/2.11, quantum effect on symmetric primitives | Grover gives an ideal query exponent, not a concrete practical strength rating or universal key-doubling mandate | Security model/boundary | NIST PQC evaluation criteria and primary quantum-algorithm literature | Three pages, tables, diagram, captions | Closed |
| C-005 | 2.2/2.3, mode and nonce behavior | ECB pattern leakage, CBC malleability/oracles, CTR/GCM reuse, authentication, and directional nonce spaces fail in different ways | Mechanism/adversarial | NIST SP 800-38 series and linked attack sources | Tables, diagrams, demos, summaries | Closed |
| C-006 | 2.4, asymmetric primitive roles | Encryption and signing use distinct RSA key pairs and operations; the demonstration must identify which public key is displayed and verified | Demonstration integrity | PKCS #1 / RFC 8017 and browser execution | Page title, labels, output, error text, demo execution | Closed |
| C-007 | 2.4/2.12, asymmetric cryptography versus PKI | Asymmetric primitives do not themselves supply the full certificate/identity trust system | Conceptual boundary | RFC 5280 and page cross-link | Title, lede, certificate handoff | Closed |
| C-008 | 2.5, hybrid construction taxonomy | Agreement, KEM encapsulation, DEK wrapping, and protocol-derived single-use traffic keys are related but not interchangeable mechanisms | Taxonomy/mechanism | FIPS 203, RFC 5869, RFC 9846, envelope-encryption references | Tables, diagram, summary, neighboring pages | Closed |
| C-009 | 2.6, quantum threat and migration | Shor changes public-key asymptotics; harvest-now-decrypt-later depends on exposure lifetime; PQ transition requires inventory and agility | Threat/lifecycle | NIST PQC program and standards | Prose, diagram, tables, checklist, summary | Closed |
| C-010 | 2.6, ML-KEM mechanics | Encapsulation creates a ciphertext and shared secret; decapsulation recovers that secret; a KDF/AEAD composition handles payload protection | Algorithm mechanism | FIPS 203 | Standards table, HNDL text, 2.5/2.13 repetitions | Closed |
| C-011 | 2.7, hash security properties | Preimage, second-preimage, and collision resistance describe different attacker search problems and bounds | Definition/security model | FIPS 180-4, FIPS 202, cryptographic literature | Prose, table, diagram, summary | Closed |
| C-012 | 2.7, HMAC | A valid HMAC authenticates creation by some shared-key holder, not one uniquely attributable sender; its nested construction prevents length extension | Boundary/mechanism | FIPS 198-1 and RFC 2104 | Lede, formula, diagram, result UI, prose | Closed |
| C-013 | 2.8, collision demonstrations | Demonstrated MD5/SHA-1 collision pairs are jointly crafted; they do not prove arbitrary substitution for an attacker-chosen fixed target | Attacker state/counterexample | Published collision artifacts and browser demonstration | Prose, files, executable output, summary | Closed |
| C-014 | 2.8, length extension | Merkle–Damgård prefix-MAC constructions have a different failure mode from collisions; HMAC and sponge-based constructions address it differently | Mechanism/boundary | RFC 2104, FIPS 202 | Prose, demo, 2.7 cross-page claim | Closed |
| C-015 | 2.9, agreement, KDF, and PFS | Static and ephemeral agreement, PSK-only operation, HKDF, transcript context, directional traffic keys, and PFS have distinct preconditions | Protocol/taxonomy | SP 800-56A/C, RFC 5869, RFC 9846 | Tables, diagrams, roles, demo | Closed |
| C-016 | 2.9, secret erasure | Application-level buffer clearing is best effort and cannot prove that runtimes, copies, swap, or hardware retain no secret material | Operational boundary | Runtime behavior and cryptographic key-lifecycle practice | Prose and demo result | Closed |
| C-017 | 2.10, digital signatures | Hashing, signature generation, verification, algorithm identifiers, and encoding are separate steps; signatures do not encrypt content | Mechanism/boundary | FIPS 186-5 and RFC 8032/8017 | Pipeline, tables, demo, summary | Closed |
| C-018 | 2.11, algorithm selection | Algorithm approval, protocol support, validated-module status, jurisdiction, security strength, and protection lifetime are separate constraints | Applicability/selection | NIST standards, IETF specifications, regional authorities | Matrix, workflow, summary | Closed |
| C-019 | 2.11, CNSA 2.0 | CNSA 2.0 is NSS-specific; its advisory names and final NIST names require a crosswalk; P-384 is a CNSA 1.0 transition choice, not the end state | Scope/version/migration | NSA CNSA 2.0 advisory and FIPS 203/204 | New section, matrix row, workflow, references | Closed |
| C-020 | 2.11, BSI and ShangMi | Regional recommendations and mandates depend on the named profile, system classification, jurisdiction, and version | Applicability/version | BSI TR-02102-1 and official Chinese standard records | Regional sections, tables, summary | Closed |
| C-021 | 2.12, certificate validation | Chain construction, name binding, time, key use, policy, revocation signals, and relying-party behavior are distinct checks | Protocol/lifecycle | RFC 5280 and CA/browser ecosystem sources | Prose, tables, diagrams, examples | Closed |
| C-022 | 2.12, automated lifecycle and revocation | ACME/ARI automate issuance and renewal; revocation is a layered emergency signal whose coverage, freshness, and failure behavior vary by client | Lifecycle/boundary | RFC 8555, CA/B Forum requirements, client mechanisms cited by page | Lifecycle SVG, alt, caption, prose, revocation section | Closed |
| C-023 | 2.13, TLS 1.3 handshake | Full certificate-authenticated TLS 1.3 is normally 1-RTT; group-dependent shares, HKDF, encrypted authentication, and AEAD negotiation occur in a defined sequence | Protocol mechanism | RFC 9846 | Lede, five-stage SVG, alt, caption, table, summary | Closed |
| C-024 | 2.13, hybrid groups and ECH | X25519 and hybrid ECDHE+ML-KEM shares have different contents; ECH is a separate ClientHello extension rather than the key-establishment share | Protocol taxonomy | RFC 9846 and current hybrid/ECH specifications cited by page | Prose, diagram, matrix, caption | Closed |
| C-025 | 2.14, Certificate Transparency | SCT delivery, append-only Merkle logs, monitoring, and inclusion/consistency evidence provide auditability but not certificate authorization by themselves | Mechanism/residual risk | RFC 6962 and current CT ecosystem sources | Prose, two diagrams, tables, summary | Closed |
| C-026 | 2.15, password storage | Salt, memory-hard KDF choice, work factors, peppering, verification, migration, and rate limiting address different risks | Mechanism/operations | NIST SP 800-63B and OWASP guidance cited by page | Tables, diagram, demo, checklist | Closed |
| C-027 | 2.16, disk and file encryption | FDE, file/application encryption, envelope encryption, DEK/KEK separation, recovery, rotation, and unlocked-endpoint exposure have distinct boundaries | Architecture/lifecycle | NIST storage-encryption and key-management guidance | Prose, two diagrams, tables, summary | Closed |
| C-028 | 2.17, blockchain cryptography | Hashes, signatures, consensus, addresses, custody, and smart-contract behavior are separate security layers | Architecture/boundary | Protocol and standards sources cited by page | Prose, diagram, tables, summary | Closed |
| C-029 | 2.17, post-quantum migration | Replacing a signature primitive can change addresses, transaction formats, custody, consensus, and treatment of dormant assets; no universal migration rule exists | Completeness/migration | FIPS 204/205 plus protocol-specific governance boundary | New section, five-step criteria, summary, references | Closed |
| C-030 | Shared SVG source policy | Reviewed files under `assets/img` are canonical; independent stale rewrite scripts must not remain executable | Generator integrity | Deterministic two-directory export and canonical byte comparison | Exporter, three retired scripts, decision registry | Closed |

## Topic completeness matrix

Each result was checked in the topic itself or in an explicit, nearby Section 2 prerequisite/destination. “Linked” means the page deliberately delegates depth and identifies the destination rather than silently omitting the category.

| Topic | Definition | Boundaries | Actors/components | Mechanism/sequence | Assumptions/dependencies | Threats/failures | Limits/residual risk | Selection/use | Operations/evidence | Recovery/lifecycle | Interoperability/migration | Unsafe alternatives |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2.1 What Is Cryptography? | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Linked to 2.9/2.12/2.16 | Covered | Covered |
| 2.2 Symmetric Cryptography | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered |
| 2.3 Symmetric Mode Attacks | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered through migration guidance | Covered | Covered |
| 2.4 Asymmetric Cryptography | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Linked to 2.12 | Covered | Covered |
| 2.5 Symmetric vs Asymmetric | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered |
| 2.6 Post-Quantum Cryptography | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered |
| 2.7 Hash Functions & MACs | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered |
| 2.8 Collisions & Length Extension | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered |
| 2.9 Key Exchange & Derivation | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered |
| 2.10 Digital Signatures | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered |
| 2.11 Recommended Algorithms | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered |
| 2.12 Certificates | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered |
| 2.13 TLS Handshake | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered |
| 2.14 Certificate Transparency | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered |
| 2.15 Password Storage | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered |
| 2.16 Full-Disk & File Encryption | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered |
| 2.17 Blockchain Cryptography | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered |

## Cross-format and cross-page ledger

| Concept or claim | Representations compared | Result |
| --- | --- | --- |
| AES round sequence | 2.2 prose, alt, caption, visible SVG labels and description | Initial and final-round distinctions agree | Closed |
| Quantum security wording | 2.2, 2.6, 2.11 prose/tables; shared diagram; alt/captions | Ideal query exponents are not concrete attack budgets | Closed |
| Hybrid-encryption vocabulary | 2.1, 2.5, 2.6, 2.9, 2.13; three diagrams | Agreement, KEM, KDF, wrapping, and AEAD roles agree | Closed |
| HMAC attribution | 2.2 and 2.7 prose, formula, diagram, caption, alt, demo output | Some shared-key holder, never unique sender attribution | Closed |
| Collision attacker state | 2.8 source files, prose, demo output and summary | Jointly crafted-pair prerequisite is explicit | Closed |
| PFS and erasure | 2.9 roles/tables/diagram/demo and 2.13 matrix | Preconditions and best-effort erasure boundaries agree | Closed |
| CNSA 2.0 | 2.6/2.11 tables, workflow, references, decision registry | NSS scope, transition algorithms, crosswalk, and dates agree | Closed |
| Certificate lifecycle | 2.12 prose, SVG title/description/labels, alt and caption | Issuance/renewal and variable revocation behavior agree | Closed |
| TLS 1.3 sequence | 2.1, 2.9, 2.13 prose/tables and two diagrams | Shares, HKDF, authentication, ECH, and traffic-key derivation agree | Closed |
| Blockchain PQ migration | 2.6 prerequisites and 2.17 new section/summary/references | Primitive replacement is tied to consensus and asset lifecycle | Closed |
| Navigation | Nav data, sidebar, footer links, homepage, chapter boundaries | All 17 pages render in the intended order | Closed |
| SVG generation | Canonical assets, exporter output, retired scripts | Two exports are deterministic and byte-identical to all 80 canonical SVGs | Closed |

## Mechanical, executable, and rendered checks

| Check | Scope | Result | What this does not prove |
| --- | --- | --- | --- |
| `scripts/verify_writing_style.py` | All 59 topic pages | Passed | Does not prove factual correctness or completeness |
| `scripts/verify_content_decisions.py` | 15 durable decisions | Passed | Does not prove that each decision remains technically correct forever |
| Jekyll build via `bin/jekyll` | Complete repository | Passed with the pinned repository runtime | Does not deploy GitHub Pages |
| Local links/assets/anchors | 60 generated HTML files, 3,960 local references | Passed | Does not test external-link uptime |
| XML parse | All 80 canonical SVG files | Passed | Does not prove visual clarity |
| Diagram exporter | Two clean output directories and canonical comparison | 80 SVGs in each; byte-identical | Does not independently prove semantic correctness |
| Retired rewrite utilities | Three historical Section 2 scripts | Each refuses execution before imports or writes | Does not remove their historical source text |
| Browser render, desktop | All 17 pages at 1280×900 | No broken images, duplicate IDs, document overflow, or console errors | Chromium does not prove every browser is identical |
| Browser render, phone | All 17 pages at 375×812 | No page/image overflow; formula and changed diagrams remain readable | Does not replace physical-device testing |
| Changed-diagram visual inspection | AES, quantum, TLS, HMAC, certificate lifecycle | Labels, arrows, boundaries, and captions are contained and legible | Unchanged diagrams received automated and prior full-page checks, not a new screenshot each |
| Interactive demonstrations | RSA, HMAC success/failure, MD5 collision | Corrected outputs and negative paths executed successfully | Browser demonstrations are educational, not formal cryptographic test suites |
| Residual phrase search, whitespace, and diff checks | Active topics, assets, scripts, decision registry | Passed; remaining matches are intentional bounded statements or historical decision context | Cannot anticipate every future wording regression |

## Remediation completed

1. Corrected AES, quantum-cost, HMAC-origin, collision-attacker-state, PFS/erasure, certificate-revocation, RSA-demo, hybrid-encryption, ML-KEM, CNSA 2.0, and TLS-handshake claims.
2. Reconciled each correction across prose, tables, summaries, demonstrations, alt text, captions, SVG descriptions, and visible diagram labels.
3. Added the optional blockchain post-quantum migration section and its operational decision sequence.
4. Registered seven durable decisions, CD-0009 through CD-0015, so future reviews must reassess the recorded rationale instead of reversing wording casually.
5. Retired and guarded three stale one-time SVG rewrite scripts; canonical SVG assets now have one deterministic exporter.
6. Corrected the HMAC formula's rendered HTML after visual inspection showed Markdown treating concatenation symbols as table delimiters.

## Open required findings

None.

## Optional coverage

None left open. The blockchain post-quantum migration extension and all optional diagram/presentation clarifications identified by the review were implemented and verified.

## Limitations and uncertainty

- Rendered validation used Chromium at desktop and 375 px phone widths; Safari and Firefox were not separate target environments.
- Standards and regional profiles remain time-sensitive. The recorded conclusion applies to the versions and dates cited by the pages on 2026-08-13.
- External sources were used during semantic verification, while the final mechanical checker intentionally validates only generated local links, assets, and anchors.
- Cryptographic demonstrations illustrate mechanisms and failure modes; they are not production implementations or conformance suites.

## Closure attestation

- [x] Every in-scope artifact was inventoried and read in full.
- [x] Every material claim family was entered in the ledger and dispositioned.
- [x] Every topic received a completeness classification for every category.
- [x] Every mandatory review pass was completed separately.
- [x] Current primary sources were used for standards-sensitive and time-sensitive claims.
- [x] Prose, metadata, tables, formulas, diagrams, captions, alt text, demonstrations, summaries, navigation, and generators were reconciled.
- [x] Applicable mechanical, executable, and rendered checks passed or their limitations are recorded.
- [x] Residual exhaustion was repeated after all remediation, including the final formula-rendering correction.
- [x] The final state was frozen and captured after all in-scope files were stable.
- [x] Required findings, optional coverage, and limitations are separated.

Closure conclusion: Complete with no open required or optional Section 2 findings for the captured final worktree state. This conclusion applies only to the recorded fingerprint and does not transfer automatically to later edits, standards revisions, or dependency changes.
