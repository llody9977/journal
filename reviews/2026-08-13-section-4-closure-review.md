# Fresh review record: Section 4 — Authentication & Authorization

## Status and baseline

- Status: Complete with no open findings
- Review mode: Fresh-review closure after implementation
- Review date: 2026-08-13
- Reviewer: Codex
- Branch: `codex/section-4-complete-remediation`
- Reviewed content commit: `de7132da21eee844aa5966c177a81c6947b059be`
- Worktree at review freeze: Clean
- Review state ID: `250e3d2a572b0bd63de96e9bef4c9e62abfaa2945c68fd4b395c75188c5976ed`
- Scoped content fingerprint: `96dc4a1d90bddbae0fd7e1161270169bf151f5750c583c0a6db931f9fa7dbf02`
- State-capture command: `python3 scripts/capture_review_state.py` with the 40 artifacts listed below passed through repeated `--scope` arguments
- Baseline changed during review: No. This record was added only after the clean implementation commit passed the repeated closure checks.

## Scope inventory

| Artifact | Type | Direct dependents or generated counterpart | Inspected |
| --- | --- | --- | --- |
| `topics/digital-identity-assurance-levels.md` | Topic | AAL diagram, WebAuthn and step-up selection | Yes |
| `topics/authorization-models.md` | Topic | Identity lifecycle and API authorization | Yes |
| `topics/webauthn-passkeys.md` | Topic | WebAuthn diagram and assurance guidance | Yes |
| `topics/step-up-authentication.md` | Topic | AAL and RFC 9470 diagrams | Yes |
| `topics/oauth-oidc.md` | Topic, runnable JWS example | OAuth flow diagram and token consumers | Yes |
| `topics/saml.md` | Topic, XML example | SAML browser-flow diagram | Yes |
| `topics/http-auth-schemes.md` | Topic, Basic example | HTTP challenge diagram and MCP handoff | Yes |
| `topics/mcp-authorization.md` | New topic | MCP discovery diagram and OAuth prerequisites | Yes |
| `topics/ssh.md` | Topic, shell examples | SSH trust and user-CA diagrams | Yes |
| `topics/security-token-service.md` | Topic, HTTP example | Generic and AWS STS diagrams | Yes |
| `topics/api-security.md` | Topic, runnable SigV4 example | Sender-constrained-token diagram | Yes |
| `topics/workload-identity-federation.md` | New topic | STS, OIDC, SPIFFE, and cloud federation | Yes |
| `topics/identity-provisioning-access-lifecycle-pam.md` | New topic | Authorization, SCIM, JML, JIT, and PAM | Yes |
| Twelve Section 4 SVG files | Canonical diagrams | Topic images and canonical exporter | Yes |
| `_data/nav.yml`, `_includes/topic-nav.html` | Navigation | 3.11 → 4.1–4.13 → 5.1 | Yes |
| `_layouts/default.html`, CSS, JavaScript, and `_config.yml` | Shared rendering | Desktop and mobile topic output | Yes |
| `scripts/generate-journal-diagrams.mjs`, `scripts/generate_topic_nav.py` | Generators | Canonical SVG export and previous/next navigation | Yes |
| `scripts/add_style_sections_all.py` | Ending validator | All topic summaries and primary references | Yes |
| Writing, decision, and review validators | Review controls | Structure, decisions, and state capture | Yes |
| `reviews/CONTENT_DECISIONS.yml` | Durable decision register | Decisions CD-0019–CD-0023 | Yes |
| `WRITING_STYLE.md`, `REVIEW_STANDARD.md`, `Gemfile` | Instructions and build support | Review method and Jekyll build | Yes |

Out-of-scope boundaries: Chapter 3.11 and Chapter 5.1 bodies were inspected only for navigation and conceptual handoff. Unrelated content in other chapters was not reopened. All 62 topics were included in mechanical structure and built-link checks, but only the thirteen Section 4 topics received complete semantic review.

## Review passes

| Pass | Complete | Evidence or notes |
| --- | --- | --- |
| Factual and technical correctness | Yes | All thirteen topic sources, twelve linked SVGs, examples, captions, and summaries were reread after remediation. |
| Evidence, authority, version, date, jurisdiction, and applicability | Yes | Current NIST Rev. 4, W3C, IETF/RFC, OASIS, OpenSSH, Microsoft, MCP, SPIFFE, and cloud-provider primary sources were checked directly. |
| Adversarial wording, assumptions, attacker state, and counterexamples | Yes | Product-to-assurance shortcuts, bearer replay, signature-only validation, token passthrough, stale identity state, weak recovery, and revocation propagation were challenged separately. |
| Terminology, taxonomy, and conceptual boundaries | Yes | IAL/AAL/FAL, authentication/authorization, OAuth/OIDC, token format/profile, mTLS authentication/binding, DPoP, SAML protection, STS, and SCIM/PAM boundaries remain distinct. |
| Cross-format consistency | Yes | Metadata, prose, tables, examples, diagrams, SVG descriptions, alt text, captions, summaries, navigation, and generators were reconciled. |
| Cross-page consistency, prerequisites, sequence, and duplication | Yes | Cross-links and terminology now form one sequence from assurance through human and workload protocols to provisioning and revocation. |
| Topic completeness | Yes | The matrix below contains no required gap or optional extension. |
| Mechanical, link, generator, executable, and rendered-output validation | Yes | Checks are recorded below. |
| Durable content-decision reconciliation | Yes | CD-0019 was reaffirmed and CD-0020–CD-0023 were implemented and validated. |
| Residual exhaustion | Yes | Earlier findings and semantic variants were searched after freeze; neighboring claims were reread using the same reasoning. |

## Material-claim ledger

| ID | Artifact and location | Material claim | Classification | Primary source or verification | Repetitions checked | Result |
| --- | --- | --- | --- | --- | --- | --- |
| C-001 | 4.1 assurance dimensions | IAL, AAL, and FAL measure independent proofing, authentication, and federation boundaries | Taxonomy/applicability | NIST SP 800-63-4, 63A-4, 63B-4, 63C-4 | Lede, table, summary, cross-links | Closed |
| C-002 | 4.1 IAL | Rev. 4 IAL requirements and proofing modes depend on the complete evidence and verification pathway | Standards/currentness | NIST SP 800-63A-4 | Table, selection guidance | Closed |
| C-003 | 4.1/4.4 AAL | A product name does not establish AAL2 or AAL3; the complete authenticator and verifier deployment does | Assurance/applicability | NIST SP 800-63B-4 | Two topics, AAL SVG, captions, summaries | Closed |
| C-004 | 4.1 FAL | FAL2 is still bearer assertion use; FAL3 requires holder-of-key or RP-bound proof under a suitable profile | Federation/standards | NIST SP 800-63C-4 | Table and selection text | Closed |
| C-005 | 4.2 authorization architecture | Policy administration, information, decision, and enforcement roles must preserve complete mediation and safe failure | Architecture/security | NIST SP 800-162, SP 800-207 | Lede, role table, lifecycle, summary | Closed |
| C-006 | 4.2 model taxonomy | RBAC, ABAC, and ReBAC are common composable models; Zanzibar is an implementation, and zero trust is not a fourth model | Taxonomy | NIST SP 800-162, Zanzibar paper, SP 800-207 | Model sections, table, summary | Closed |
| C-007 | 4.3 WebAuthn ceremony | The authenticator signs `authenticatorData || SHA-256(clientDataJSON)` and RP validation supplies verifier-name-bound phishing resistance | Protocol/security property | W3C WebAuthn Level 3 | Prose, SVG, alt text, checklist, summary | Closed |
| C-008 | 4.3 passkeys | Attestation, registration, authentication, sync, device binding, conditional UI, and hybrid transport have separate meanings and residual risks | Protocol/lifecycle | W3C WebAuthn Level 3, FIDO, NIST SP 800-63B-4 | Tables, lifecycle, summary | Closed |
| C-009 | 4.4 AAL sessions | Rev. 4 overall and inactivity timeout language has different normative strength at each AAL | Numerical/standards | NIST SP 800-63B-4 | Table and references | Closed |
| C-010 | 4.4 step-up | RFC 9470 communicates unmet authentication context but does not guarantee satisfaction, session termination, transaction signing, or authorization | Protocol/boundary | RFC 9470, OIDC Core | Sequence, SVG, caption, transaction controls | Closed |
| C-011 | 4.5 OAuth/OIDC | OAuth authorization credentials serve resource servers; OIDC ID Tokens are authentication assertions for clients | Protocol/taxonomy | RFC 6749, OIDC Core | Lede, comparison, roles, summary | Closed |
| C-012 | 4.5 PKCE/currentness | PKCE binds code redemption; RFC 9700 requires it for public code clients while OAuth 2.1 remains an Internet-Draft | Protocol/currentness | RFC 9700, OAuth 2.1 draft 15 | Prose, flow SVG, caption, references | Closed |
| C-013 | 4.5 token validation | Access tokens may be opaque or structured; signature validity alone is not authorization or complete JWT validation | Token/security | OIDC Core, RFC 9068, runnable JWS example | Token section, checklist, example, summary | Closed |
| C-014 | 4.5 advanced OAuth | PAR, JAR, JARM, FAPI 2.0, Device Grant, and CIBA solve narrower risks only when their complete profiles are applied | Profile/selection | RFC 9126, RFC 9101, FAPI 2.0, RFC 8628, CIBA | Advanced table and references | Closed |
| C-015 | 4.6 SAML flow | SP-initiated and unsolicited SAML responses have different correlation evidence; browser carriage does not establish trust | Protocol/threat | OASIS SAML Core and Profiles | Prose, table, SVG, alt text, caption | Closed |
| C-016 | 4.6 SAML validation | The SP must validate the exact protected element plus issuer/key, structure, destination, recipient, audience, time, correlation, and replay state | Critical security | OASIS SAML Core, Profiles, Metadata, Security Considerations | XML example, checklist, summary | Closed |
| C-017 | 4.7 HTTP/Windows auth | Basic, Bearer, Digest, and Negotiate carry different credential properties; successful authentication is not authorization | Protocol/taxonomy | RFC 9110, RFC 7617, RFC 7616, RFC 4559 | Scheme table, diagram, example, summary | Closed |
| C-018 | 4.7 Kerberos/NTLM/AD FS | Negotiate can select Kerberos or NTLM; NTLM deprecation, KDC use, delegation, and AD FS federation require separate treatment | Platform/currentness | RFC 4120, Microsoft NTLM and AD FS documentation | Comparison, lifecycle, summary | Closed |
| C-019 | 4.8 MCP | The 2025-11-25 HTTP profile uses protected-resource discovery, registration choices, and resource indicators; stdio and tool safety are separate | Protocol/currentness | MCP Authorization and Transports, RFC 9728, RFC 8707 | Prose, SVG, caption, summary | Closed |
| C-020 | 4.8 MCP token boundary | MCP access tokens target one resource and must not be passed through to unrelated upstream APIs | Critical security | MCP Authorization 2025-11-25 | Sequence, checklist, summary | Closed |
| C-021 | 4.9 SSH trust | Server host authentication precedes user authentication; first-use prompts and `ssh-keyscan` do not independently authenticate a host key | Protocol/trust | RFC 4253, OpenSSH manuals | Prose, trust SVG, commands, summary | Closed |
| C-022 | 4.9 SSH algorithms/lifecycle | Key type and signature algorithm are separate; certificates, KRLs, forwarded agents, FIDO keys, and hybrid KEX retain explicit lifecycle boundaries | Protocol/operations | OpenSSH specifications/manuals, RFC 6979, RFC 4255 | Tables, CA SVG, operations, summary | Closed |
| C-023 | 4.10 STS | An STS issues under local policy and does not inherently shorten, down-scope, or revoke input authority | Architecture/token | WS-Trust, AWS STS, RFC 8693 | Lede, generic SVG, token-exchange section, summary | Closed |
| C-024 | 4.10 AWS/RFC 8693 | AWS role chaining has a one-hour limit; RFC 8693 subject/actor semantics and output constraints require explicit policy | Provider/protocol | AWS STS API, RFC 8693 | Prose, diagrams, HTTP example, table | Closed |
| C-025 | 4.11 API authentication | Client authentication, token binding, request integrity, replay defense, and API authorization are independent controls | Architecture/security | RFC 6749, RFC 8705, RFC 9449 | Mechanism table, SVG, lifecycle, summary | Closed |
| C-026 | 4.11 DPoP/SigV4 | DPoP baseline freshness differs from nonce/duplicate tracking; a SigV4 derived key signs multiple scoped requests | Protocol/implementation | RFC 9449, AWS SigV4, runnable key derivation | Prose, diagram, code/output | Closed |
| C-027 | 4.12 workload federation | Federation replaces target secrets with a source-identity, attestation, mapping, target-policy, and temporary-issuance trust chain | Architecture/lifecycle | SPIFFE, SPIFFE Workload API, cloud-provider docs | Flow, table, lifecycle, summary | Closed |
| C-028 | 4.13 identity lifecycle | JML requires target-state reconciliation; SCIM does not define governance, and JIT, PAM, and break-glass controls solve different problems | Operations/taxonomy | RFC 7643, RFC 7644, SP 800-53, SP 800-63B-4 | Tables, lifecycle, failure tests, summary | Closed |
| C-029 | Chapter navigation and presentation | The complete chapter remains reachable, responsive, accessible at the SVG boundary, and free of broken local references | Mechanical/rendering | Built-site checker and browser sweep | All 13 pages, 12 diagrams, navigation, CSS/JS | Closed |
| C-030 | Semantic helper | Reviewed topic endings are canonical; the compatibility helper validates but does not reinsert stale security text | Generator/content integrity | Source inspection and validator run | All 62 topics, CD-0023 | Closed |

## Topic completeness matrix

`C` means covered locally or through an explicit, sufficient neighboring-page link.

| Topic | Definition | Boundaries | Actors/components | Mechanism/sequence | Assumptions/dependencies | Threats/failures | Limits/residual risk | Selection/use | Operations/evidence | Recovery/lifecycle | Interoperability/migration | Unsafe alternatives |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4.1 Identity assurance | C | C | C | C | C | C | C | C | C | C | C | C |
| 4.2 Authorization models | C | C | C | C | C | C | C | C | C | C | C | C |
| 4.3 WebAuthn/passkeys | C | C | C | C | C | C | C | C | C | C | C | C |
| 4.4 Step-up/MFA | C | C | C | C | C | C | C | C | C | C | C | C |
| 4.5 OAuth/OIDC | C | C | C | C | C | C | C | C | C | C | C | C |
| 4.6 SAML | C | C | C | C | C | C | C | C | C | C | C | C |
| 4.7 HTTP/Windows auth | C | C | C | C | C | C | C | C | C | C | C | C |
| 4.8 MCP authorization | C | C | C | C | C | C | C | C | C | C | C | C |
| 4.9 SSH | C | C | C | C | C | C | C | C | C | C | C | C |
| 4.10 STS | C | C | C | C | C | C | C | C | C | C | C | C |
| 4.11 M2M API authentication | C | C | C | C | C | C | C | C | C | C | C | C |
| 4.12 Workload federation | C | C | C | C | C | C | C | C | C | C | C | C |
| 4.13 Provisioning/lifecycle/PAM | C | C | C | C | C | C | C | C | C | C | C | C |

## Cross-format and cross-page ledger

| Concept or claim | Representations compared | Result |
| --- | --- | --- |
| Assurance levels | 4.1 prose/table/summary, 4.4 table, shared AAL SVG, WebAuthn deployment table | Consistent |
| Authentication versus authorization | 4.2 architecture, 4.4 final decision, 4.5 token consumers, 4.7 challenge flow, 4.11 API lifecycle | Consistent |
| WebAuthn ceremony | 4.3 sequence, component SVG, alt text, caption, validation list, 4.4 selection table | Consistent |
| OAuth and OIDC | 4.5 definitions, roles, pure OAuth PKCE SVG, JWS example, summary, STS/API cross-links | Consistent |
| SAML trust | 4.6 prose, XML example, validation checklist, browser-flow SVG, SVG description, alt text, caption | Consistent |
| MCP profile | 4.7 handoff, 4.8 metadata, sequence, discovery SVG, caption, summary | Consistent |
| SSH trust and algorithms | 4.9 tables, two SVGs, captions, commands, summary, Chapter 3.11 prerequisite | Consistent |
| STS and workload federation | 4.10 generic/AWS flows, RFC 8693 example, 4.11 selection, 4.12 trust chain | Consistent |
| Sender constraints | 4.5 token boundary, 4.10 issuance policy, 4.11 mTLS/DPoP table, SVG, validation text | Consistent |
| Identity lifecycle | 4.2 enforcement lifecycle, 4.3 credential lifecycle, 4.12 workload retirement, 4.13 JML/SCIM/PAM | Consistent |
| Navigation/presentation | Nav data, generated footer navigation, layout, CSS, JavaScript, all topic links, diagrams | Consistent |
| Semantic endings | Thirteen summaries/references, all-topic validator, durable decision CD-0023 | Consistent |

## Applicable durable content decisions

| Decision ID | Affected concept | Disposition | Current evidence and rationale |
| --- | --- | --- | --- |
| CD-0019 | Token semantics | Reaffirmed | OAuth, OIDC, STS, SAML, workload federation, and API pages describe credentials/assertions by their governing protocol instead of treating delegation as universal. |
| CD-0020 | NIST assurance mapping | Implemented | 4.1, 4.3, and 4.4 require complete deployment evidence and no longer assign AAL/FAL from a product label. |
| CD-0021 | OAuth/OIDC/token/sender-constraint boundaries | Implemented | The pure OAuth diagram and 4.5/4.10/4.11 prose distinguish every layer and validator. |
| CD-0022 | Dedicated evolving and lifecycle topics | Implemented | MCP, workload federation, and provisioning/lifecycle/PAM are separate 4.8, 4.12, and 4.13 pages with stable navigation. |
| CD-0023 | Canonical semantic endings | Implemented | The helper is repository-relative, contains no copied security conclusions, and validates rather than mutates all 62 topic endings. |

## Mechanical and rendered checks

| Check | Scope | Result | What this does not prove |
| --- | --- | --- | --- |
| Writing-structure verifier | All 62 topic files | Passed | Does not prove technical correctness |
| Ending validator | All 62 topic files | Passed | Does not prove each summary's semantic accuracy |
| Decision-register validator | 23 decisions | Passed | Does not prove the decisions' technical rationale |
| Python syntax check | Ending validator | Passed | Does not prove runtime semantics beyond compilation |
| Jekyll build | Complete site with Ruby 3.3 bundle outside the repository | Passed without warnings | Does not prove browser layout or source accuracy |
| Local link, asset, and anchor scan | 63 generated HTML files | Zero errors | Does not prove external-source authority |
| External source retrieval | 67 unique Section 4 Markdown source links | 66 returned 2xx; the official FIDO passkeys page blocked automated retrieval with 403 | Does not prove every statement supported by each page |
| XML validation | All 83 canonical SVG files | Passed | Does not prove visual clarity |
| Canonical diagram exporter | 83 SVGs, two clean output directories | Byte-identical to each other and to canonical SVG assets | Does not prove semantic correctness |
| Navigation generator | 61 ordered topic links | Generated include matches nav data | Does not prove topic correctness |
| Runnable JWS example | HS256 illustrative integrity and time checks | Printed `True` and `True` | Deliberately not a production JWT validator |
| Runnable SigV4 derivation | Date/region/service signing-key example | Printed 32 bytes and 64 hexadecimal characters | Does not implement the canonical request or final signature |
| Desktop browser sweep | All 13 pages at 1440×900 | Zero document overflow, uncontained wide content, broken images, duplicate IDs, nav errors, or diagram-link mismatches | Does not test every browser engine |
| Mobile browser sweep | All 13 pages at 375×812 | Same zero-error result; wide tables and code remain inside intentional scroll containers | Does not cover every viewport or font override |
| Clean browser-console sweep | All 13 pages | Zero warnings or errors in a fresh tab | Does not prove every interactive input sequence |
| Diagram rendering | Twelve linked SVGs loaded; eight changed diagrams visually inspected and all have title/description/role labeling | Passed | No assistive-technology screen-reader session was run |
| Navigation boundaries | 3.11 → 4.1–4.13 → 5.1 | Passed | Does not prove content correctness |
| Ignored-file gate | Git tracked files versus `.gitignore` | Zero ignored files tracked; local bundle/cache/lock files remain untracked | Does not inspect external user-cache contents |

## Open required findings

None.

## Optional coverage

All optional items from the Section 4 fresh review were implemented:

1. OAuth now covers PAR, JAR, JARM, FAPI 2.0, Device Authorization Grant, and CIBA boundaries.
2. WebAuthn now covers conditional UI and hybrid/cross-device authentication.
3. SSH now covers FIDO-backed credentials and negotiated hybrid post-quantum key exchange.
4. MCP authorization is a dedicated current-specification topic.
5. Workload identity federation, SPIFFE/SPIRE, cloud mapping, revocation, and static-secret migration are a dedicated topic.
6. SCIM, joiner-mover-leaver reconciliation, JIT, PAM, and break-glass lifecycle are a dedicated topic.

## Limitations and uncertainty

- The official FIDO Alliance passkeys landing page returned HTTP 403 to automated retrieval. The link remains correct, and the overlapping protocol and assurance claims were verified through accessible W3C WebAuthn and NIST primary sources.
- Rendered automation used Chromium at two representative viewport sizes. Safari, Firefox, forced-colors mode, enlarged-text reflow, and a screen-reader session were not run; these are disclosed environment limitations, not open content findings.

## Closure attestation

- [x] Every in-scope artifact was inventoried and read in full.
- [x] Every material claim was entered in the ledger and dispositioned.
- [x] Every topic received a completeness classification for every category.
- [x] Every mandatory pass was completed separately.
- [x] Current primary sources were used for standards-sensitive and time-sensitive claims.
- [x] Prose, metadata, diagrams, captions, alt text, examples, summaries, navigation, and generators were reconciled.
- [x] Applicable mechanical and rendered checks passed or their limitations are recorded.
- [x] Applicable durable content decisions were reconciled after the independent claim review.
- [x] Residual exhaustion was completed after findings were assembled.
- [x] The reviewed content baseline remained frozen.
- [x] Required findings, optional coverage, and limitations are separated.

Closure conclusion: Section 4 has no open required finding or optional coverage item on the reviewed content commit and fingerprint above.
