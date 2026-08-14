---
title: "Secure SDLC & Application Security Testing"
description: Technical reference for the NIST SSDF practice groups, what SAST, SCA, DAST, IAST, RASP, and fuzzing each can and cannot observe, reachability and VEX triage, and wiring the tools into CI/CD without unpinned actions or silent suppressions.
permalink: /topics/ssdlc-security-testing/
last_verified: 2026-08-14
---

<span class="eyebrow">Application Security / Software Engineering</span>

# Secure SDLC & Application Security Testing

<p class="lede">No application security tool sees the whole program. Static analysis reads code it never runs; dynamic analysis exercises a running system it cannot see inside; composition analysis knows a dependency's version but not whether the vulnerable function is ever called. Each modality has a blind spot that another covers, so the engineering question is not which scanner to buy but which observations the pipeline is missing — and what happens to a finding after it is produced, since a finding nobody triages is indistinguishable from one nobody found.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/ssdlc-security-testing.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the application security testing modalities diagram at full size">
    <img src="{{ '/assets/img/ssdlc-security-testing.svg' | relative_url }}" alt="Two panels. The NIST SSDF practice groups — Prepare the Organization, Protect the Software, Produce Well-Secured Software, and Respond to Vulnerabilities — shown as four groups rather than a phase sequence. Below, the testing modalities compared by what each one can observe: static analysis reads code without running it, composition analysis reads the dependency graph, dynamic analysis exercises a running system from outside, interactive analysis observes execution from inside during tests, fuzzing generates inputs to reach unhandled states, and runtime self-protection acts in production.">
  </a>
  <p class="diagram-caption">Four SSDF practice groups, and the six testing modalities distinguished by what each one can actually observe</p>
</div>

## What the SSDF actually specifies

The authoritative reference here is **[NIST SP 800-218, *Secure Software Development Framework (SSDF) Version 1.1*](https://csrc.nist.gov/pubs/sp/800/218/final)** (February 2022). Its structure is worth stating precisely, because it is frequently paraphrased as a lifecycle and it deliberately is not one. SSDF organizes practices into **four groups**, not phases:

| Group | Name | What it covers |
|---|---|---|
| **PO** | Prepare the Organization | People, process, and tooling readiness — security requirements, roles, toolchains, and the security of the development environment itself. |
| **PS** | Protect the Software | Protecting all software components from tampering and unauthorized access, including integrity verification for released software. |
| **PW** | Produce Well-Secured Software | Design review, secure coding, reuse of well-secured components, code review and testing, and default secure configuration. |
| **RV** | Respond to Vulnerabilities | Identifying, assessing, and remediating vulnerabilities after release, and analyzing them to prevent recurrence. |

The grouping is intentional: SSDF is written to apply to any development methodology, so it does not assume a waterfall sequence. **[NIST SP 800-218A](https://csrc.nist.gov/pubs/sp/800/218/a/final)** adds practices for generative AI and dual-use foundation models on top of the same structure.

### A phase view, as a working model

The mapping below is a **journal working model** for deciding where a control attaches in a typical delivery pipeline. It is not the SSDF's own structure and not a NIST-defined lifecycle; the SSDF practice group each activity serves is noted so the two can be reconciled.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/ssdlc-phase-tooling.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the pipeline phase to tooling map diagram at full size">
    <img src="{{ '/assets/img/ssdlc-phase-tooling.svg' | relative_url }}" alt="A five-stage pipeline running left to right — requirements, design, code and commit, build and test, and deploy and operate — with the security activity and tooling attached at each stage: security requirements and data classification; threat modeling against trust boundaries; IDE linters, secret scanning and pull-request static analysis; composition analysis, dynamic scanning, interactive analysis and fuzzing; then runtime protection, penetration testing and vulnerability disclosure. Each stage is tagged with the NIST SSDF practice group it serves, and a footer states that the phase view is a journal working model rather than the SSDF's own four-group structure.">
  </a>
  <p class="diagram-caption">Where each control attaches in a delivery pipeline, tagged with the SSDF practice group it serves</p>
</div>

1. **Requirements** *(PO)* — security and privacy requirements alongside functional ones, data classification, and the regulatory obligations that apply. See [Regulatory Mandates & Private-Sector Assurance]({{ '/topics/regulatory-compliance-mandates/' | relative_url }}).
2. **Design** *(PW)* — threat modeling against trust boundaries before code exists, since a design flaw is not something a scanner finds. See [Design-Time Architecture Threat Modeling]({{ '/topics/threat-modeling-design/' | relative_url }}) and [Trust Boundaries & Threat Modeling]({{ '/topics/trust-boundaries-threat-modeling/' | relative_url }}).
3. **Code and commit** *(PW)* — IDE linters, pre-commit secret scanning, static analysis on pull requests, and human review on security-relevant changes.
4. **Build and test** *(PW, PS)* — composition analysis, dynamic scanning against a deployed staging build, interactive analysis during functional tests, fuzzing for parsers and protocol handlers, and signing plus provenance on the artifact.
5. **Deploy and operate** *(RV)* — runtime protection where it earns its overhead, periodic penetration testing, a vulnerability disclosure policy, and a triage path that closes the loop back into the backlog.

## What each testing modality can and cannot observe

| Modality | How it runs | What it is good at | What it cannot see |
|---|---|---|---|
| **SAST** — static application security testing | Analyzes source or bytecode without executing it (*white box*). | Fast enough for pull requests; points at an exact file and line; finds injection and unsafe-API patterns before anything is deployed. | Runtime configuration, authentication state, and whether the path is reachable in production. Produces a high false-positive rate, and misses flaws that only exist in the deployed configuration. |
| **SCA** — software composition analysis | Resolves the dependency graph and matches components against vulnerability databases (OSV, NVD, GitHub Advisories). | Known CVEs in direct and transitive dependencies; license obligations; feeds the SBOM. | Whether the vulnerable code path is reachable from your application, which is why raw SCA output overstates real risk. Nothing about first-party code. |
| **DAST** — dynamic application security testing | Exercises a running deployment over HTTP from outside (*black box*). | Findings observed against a real system, so a confirmed finding is directly reproducible; sees the deployed configuration, TLS, headers, and WAF behavior. | The source location of the flaw. Requires working authentication and crawl coverage to reach anything past the login page. **False positives still occur**, particularly on authenticated flows, error-based checks, and WAF-fronted endpoints — "verified by observation" is not the same as "always right". |
| **IAST** — interactive application security testing | An agent inside the runtime (JVM, CLR, Node) observes execution while functional tests drive the application. | Combines a line number with runtime context, so precision is high and false positives are low. | Only the paths the test suite actually executes — coverage is the ceiling. Agent support is language-specific and adds test-run overhead. |
| **Fuzzing** | Generates and mutates inputs, often coverage-guided (AFL++, libFuzzer, OSS-Fuzz, Jazzer), watching for crashes and assertion failures. | Memory-safety bugs, parser and deserializer flaws, and unhandled states no one wrote a test for. The strongest tool for native code and any format parser. | Needs a harness and a defined oracle; finds crashes rather than logic or authorization flaws. Long-running by nature, so it fits nightly rather than per-pull-request. |
| **RASP** | An agent inside the production runtime intercepts calls and can block. | Application context at block time — it sees the actual query and the actual deserialization, not just the HTTP request. | It is a mitigation, not a fix; the flaw remains. Carries production performance overhead and its own availability and stability risk, which has to be weighed against the exposure it covers. |

Two more scanners belong in the same pipeline even though they are not usually listed as application testing:

- **Secret scanning** — pre-commit hooks plus a server-side scan on push, and a scan of full history rather than the tip commit. A committed credential is compromised from the moment it is pushed, so rotation, not deletion, is the remediation; rewriting history does not un-disclose it.
- **IaC and configuration scanning** — Terraform, Kubernetes manifests, and Dockerfiles carry the misconfigurations that become A02 in production. See [Infrastructure as Code (IaC) & Immutable Security]({{ '/topics/iac-immutable-security/' | relative_url }}).

## Reachability, and what VEX is for

The practical problem with SCA is volume: a mid-sized service can inherit hundreds of CVEs through transitive dependencies, most of which are not exploitable in that application because the vulnerable function is never on a reachable path.

- **Reachability analysis** narrows the list by asking whether a call path exists from application code to the vulnerable symbol. Treat the result as evidence, not proof — reflection, dynamic dispatch, and configuration-driven loading defeat static call-graph analysis, so "unreachable" is a working conclusion, not a guarantee.
- **VEX** (Vulnerability Exploitability eXchange) is the format for publishing that determination so downstream consumers can suppress a finding with a recorded justification instead of guessing. The statuses, the five `not_affected` justifications, and the carrying formats are covered in [Software Bill of Materials (SBOM) & VEX]({{ '/topics/sbom-dependency-management/' | relative_url }}).

The failure mode to avoid is a suppression with no recorded reason. A `.trivyignore` entry or a linter suppression comment without a justification and an expiry is an undocumented risk acceptance that outlives whoever accepted it.

## Wiring the tools into CI/CD

Gate policy matters as much as tool choice. A scanner that blocks on everything gets disabled within a sprint; one that blocks on nothing changes no behavior. A workable split: **block on new critical and high findings introduced by the change** (diff-aware), **report** on pre-existing findings, and track those separately against a remediation plan.

The pipeline itself is a production system with production credentials. Third-party actions run arbitrary code in a context that can reach your registry and your cloud, which is why they are pinned to immutable references here — see [CI/CD Pipeline Security & Workload Identity]({{ '/topics/cicd-pipeline-security/' | relative_url }}) for the full threat model, including poisoned pipeline execution.

```yaml
# Example GitHub Actions security stage.
# Every third-party action is pinned to a full 40-character commit SHA:
# a tag or branch reference is mutable and can be repointed by the
# publisher or by anyone who compromises that repository.
name: Security pipeline scan
on: [pull_request]

permissions:
  contents: read          # least privilege; add scopes per job, not globally

jobs:
  sast:
    runs-on: ubuntu-latest
    # Semgrep's own documented pattern is the published container image
    # running `semgrep ci`. The former returntocorp/semgrep-action is
    # deprecated by its maintainer and should not be used in new pipelines.
    # Pin the image by digest for the same reason actions are pinned by SHA.
    container:
      image: semgrep/semgrep@sha256:RESOLVE_DIGEST_AT_PIN_TIME
    steps:
      - name: Check out code
        uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
      - name: Run SAST
        run: semgrep ci
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}

  sca:
    runs-on: ubuntu-latest
    steps:
      - name: Check out code
        uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
      - name: Run SCA
        uses: aquasecurity/trivy-action@ed142fd0673e97e23eac54620cfb913e5ce36c25  # v0.36.0
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'
          # ignore-unfixed suppresses vulnerabilities with no vendor fix
          # available. That is a deliberate noise trade-off, not a safety
          # judgment: those findings are still exploitable, so track them
          # somewhere rather than dropping them silently.
          ignore-unfixed: true
          exit-code: '1'   # fail the job on a matching finding
```

Resolve every image digest and action SHA at pin time and record the version it corresponds to in a trailing comment, so the pin stays auditable and updatable. The digest above is written as a marker rather than a real value precisely because it must be resolved against the image you intend to run.

## Vulnerability management after the scan

Remediation timelines are **organizational policy, not a standard requirement**. A rule such as "critical within 7 days, high within 30" is a reasonable working default and should be recorded as a local decision, derived from exposure and exploitability rather than copied from a vendor slide. Where a regulator does impose a timeline — for example a sector rule or a contractual obligation — cite that instead of an internal number.

Useful properties of a working process, independent of the numbers chosen:

- Findings land in the **same backlog as functional work**, with the same visibility, rather than in a scanner console nobody opens.
- **Severity is adjusted for context** — an internet-reachable service and an internal batch job with the same CVE are not the same risk.
- **Risk acceptance is time-boxed and re-reviewed**, with a named owner.
- **A vulnerability disclosure policy exists** so external reporters have a path that is not a support ticket.
- **Recurrence is analyzed**, which is SSDF practice RV.3 — the same class appearing repeatedly is a control gap, not a series of coincidences.

## Measuring the program: OWASP SAMM

[OWASP SAMM](https://owaspsamm.org/) provides the assessment model this page's checklist does not. SAMM v2 defines **five business functions** — Governance, Design, Implementation, Verification, and Operations — and **fifteen security practices**, each split into two streams with **three maturity levels**. Its value is that it scores a program's practices rather than counting tools, and it makes an honest current-state assessment possible before target-setting. Broader maturity model comparison is in [Security Maturity Models]({{ '/topics/security-maturity-models/' | relative_url }}).

## Secure SDLC review checklist

The checklist below is a journal working model, not a published audit standard. When auditing a software engineering pipeline, evaluate these eight criteria:

| Diagnostic area | Evaluation question | Verification &amp; audit evidence |
|---|---|---|
| **Design-stage review** | Is threat modeling required for new services and for changes crossing a trust boundary, before implementation begins? | Threat model artifacts per service, the definition-of-done entry, architecture review records. |
| **Pull-request static analysis** | Does SAST run on every pull request diff-aware, and is the gate policy explicit about what blocks versus what reports? | Workflow definitions, branch protection required checks, the documented gate policy. |
| **Dependency and reachability triage** | Are dependencies scanned every build, and is there a reachability or VEX determination step rather than raw CVE counts driving work? | SCA run logs, reachability tool output, VEX statements, the suppression file with justifications and expiry dates. |
| **Runtime testing coverage** | Does DAST run against an authenticated staging deployment, and is its crawl coverage measured rather than assumed? | DAST configuration including authentication, coverage report, findings-to-endpoint mapping. |
| **Fuzzing where it applies** | For parsers, deserializers, and native code, is there a fuzzing harness running on a schedule with a corpus that persists between runs? | Harness source, scheduled job history, corpus storage, crash triage records. |
| **Secret hygiene** | Is secret scanning enforced pre-commit and server-side over full history, with rotation — not deletion — as the remediation? | Scanner configuration, push-protection setting, rotation records for past findings. |
| **Pipeline integrity** | Are all third-party actions and container images pinned to immutable digests, with least-privilege job permissions? | Workflow YAML showing 40-character SHAs and image digests, `permissions` blocks, an audit for mutable refs. |
| **Closing the loop** | Do findings enter the normal backlog with owners and time-boxed risk acceptance, and is recurrence analyzed? | Issue tracker queries, risk acceptance register with expiry, recurrence review notes. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>The SSDF is four practice groups — PO, PS, PW, RV — not a phase sequence; any phase mapping is a local working model. Choose testing modalities by what each can observe: SAST has no runtime, SCA has no reachability, DAST has no source location and <em>does</em> still produce false positives, IAST is capped by test coverage, fuzzing finds crashes rather than logic flaws, and RASP mitigates without fixing. Pin every third-party action to a full commit SHA and every container to a digest, since the pipeline holds production credentials. Remediation SLAs are local policy — record them as decisions, not as requirements.</p>
</div>

## Primary references

- **[NIST SP 800-218: Secure Software Development Framework v1.1](https://csrc.nist.gov/pubs/sp/800/218/final)** — verified February 2022 as the current version and the four practice groups PO, PS, PW, and RV, which are groups rather than lifecycle phases.
- **[NIST SP 800-218A: Secure Software Development Practices for Generative AI](https://csrc.nist.gov/pubs/sp/800/218/a/final)** — verified that it extends the same practice-group structure rather than replacing it.
- **[OWASP SAMM](https://owaspsamm.org/)** — verified five business functions, fifteen security practices, two streams per practice, and three maturity levels.
- **[Semgrep: sample CI configurations](https://docs.semgrep.dev/semgrep-ci/sample-ci-configs)** — verified that the documented GitHub Actions pattern is the `semgrep/semgrep` container running `semgrep ci`.
- **[semgrep-action repository](https://github.com/returntocorp/semgrep-action)** — verified the maintainer's deprecation notice directing users to the Semgrep project instead.
- **[Trivy Action](https://github.com/aquasecurity/trivy-action)** — verified the `ignore-unfixed` and `exit-code` options and the release tags the pinned SHA corresponds to.
- **[OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)** — verified the scope distinction between automated scanning and manual testing coverage.
