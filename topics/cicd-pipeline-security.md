---
title: "CI/CD Pipeline Security & Workload Identity"
description: Technical reference for CI/CD build pipeline security, the OWASP Top 10 CI/CD Security Risks (2022), the three Poisoned Pipeline Execution vectors, and passwordless OIDC workload identity federation.
permalink: /topics/cicd-pipeline-security/
last_verified: 2026-08-14
---

<span class="eyebrow">Software Supply Chain Security / Pipeline Security</span>

# CI/CD Pipeline Security & Workload Identity

<p class="lede">In modern software development, the CI/CD build pipeline is a high-privilege execution environment. Build runners execute arbitrary code, pull third-party packages, and possess credentials to deploy artifacts into production cloud environments. If an attacker compromises the build pipeline, they can inject malicious code into trusted software releases without modifying source repositories. Securing CI/CD requires defending against OWASP CI/CD risks, preventing Poisoned Pipeline Execution (PPE), and replacing static cloud keys with passwordless OIDC workload identity federation.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/cicd-pipeline-security.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the CI/CD pipeline security architecture diagram at full size">
    <img src="{{ '/assets/img/cicd-pipeline-security.svg' | relative_url }}" alt="Three panels. OWASP CI/CD risks: CICD-SEC-4 Poisoned Pipeline Execution with its three vectors, CICD-SEC-6 static cloud keys in secret stores, and CICD-SEC-3 dependency chain abuse. OIDC workload identity: the runner requests a short-lived JWT, exchanges it via AssumeRoleWithWebIdentity, the trust policy pins aud and sub rather than repository alone, and credentials last one hour by default. Pipeline hardening: branch protection contains D-PPE and I-PPE, a fork approval gate contains 3PE, plus ephemeral runners and SHA-pinned actions.">
  </a>
  <p class="diagram-caption">CI/CD pipeline security architecture: OWASP risks, the OIDC token exchange, and which hardening control reaches which attacker</p>
</div>

## OWASP Top 10 CI/CD Security Risks (2022 edition)

OWASP published the **Top 10 CI/CD Security Risks** in 2022, drawing directly from major software supply chain breaches (*e.g. SolarWinds, Codecov*). It remains the current edition:

| Risk ID | Risk title | Operational failure mode &amp; real-world impact |
|---|---|---|
| **CICD-SEC-1** | **Insufficient Flow Control Mechanisms** | Unreviewed code merged or built directly into production release artifacts. |
| **CICD-SEC-2** | **Inadequate Identity and Access Management** | Over-privileged build runner service accounts with global cloud admin rights. |
| **CICD-SEC-3** | **Dependency Chain Abuse** | Dependency confusion, typosquatting, or compromised upstream package versions. |
| **CICD-SEC-4** | **Poisoned Pipeline Execution (PPE)** | Attackers cause the pipeline to execute code they control, via the CI configuration file or a file it calls. |
| **CICD-SEC-5** | **Insufficient PBAC (Pipeline-Based Access Controls)** | Unrestricted pipeline access to sensitive execution environments or deployment targets. |
| **CICD-SEC-6** | **Insufficient Credential Hygiene** | Long-lived cloud access keys stored in pipeline secret stores, exposed via logs or PR builds. |
| **CICD-SEC-7** | **Insecure System Configuration** | Unpatched build platform servers, unauthenticated runner controllers, permissive network access. |
| **CICD-SEC-8** | **Ungoverned Usage of 3rd Party Services** | Third-party CI marketplace actions/plugins with unpinned versions executing malicious code. |
| **CICD-SEC-9** | **Improper Artifact Integrity Validation** | Downstream environments deploy container images without verifying digital signatures or hashes. |
| **CICD-SEC-10** | **Insufficient Logging and Visibility** | Missing audit logs for pipeline configuration changes, secret access, or runner execution steps. |

## The three Poisoned Pipeline Execution vectors

**Poisoned Pipeline Execution (PPE)** occurs when an attacker causes the pipeline to run code they control. OWASP separates it into three sub-types, and the distinction is not academic: they start from different levels of access, so a control that stops one leaves the others open.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/ppe-vectors.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the Poisoned Pipeline Execution vectors diagram at full size">
    <img src="{{ '/assets/img/ppe-vectors.svg' | relative_url }}" alt="Three rows comparing PPE sub-types by the access the attacker already holds. Direct PPE requires repository write access and edits the CI configuration file itself. Indirect PPE also requires write access but edits a file the pipeline executes, such as a Makefile or build script, leaving the workflow file untouched. Public PPE requires no access at all; an anonymous fork pull request against a public repository triggers it. A footer notes branch protection contains the first two, only a fork approval gate contains the third, and applying the fork gate alone leaves the first two open.">
  </a>
  <p class="diagram-caption">The three PPE vectors, separated by the access the attacker already holds</p>
</div>

1. **Direct PPE (D-PPE)**: an attacker who can already write to the repository modifies the pipeline configuration file itself — either by pushing to an unprotected branch or by submitting a pull request carrying the change — and the platform runs the modified definition.
2. **Indirect PPE (I-PPE)**: the configuration file is protected or stored outside the repository, so the attacker instead modifies a file the pipeline executes: a Makefile, build script, test file, or linter configuration. The workflow file is untouched, so a review that only diffs workflow files passes it.
3. **Public PPE (3PE)**: a public repository runs unreviewed code proposed by anonymous contributors, so an attacker with no repository access at all poisons the pipeline through a fork pull request. On GitHub this is acute for `pull_request_target` workflows, which run against the base repository's secrets while checking out the fork's code.

**Mitigation is layered, not singular.** Branch protection, mandatory multi-person review, and tight control over who holds write access contain D-PPE and I-PPE. Requiring maintainer approval before workflows run on external-fork pull requests contains 3PE. Applying only the fork gate leaves D-PPE and I-PPE fully open, because those attackers never open a fork.

## Passwordless OIDC workload identity federation

Storing static, long-lived cloud credentials (*e.g. AWS IAM access keys*) in CI/CD secret stores is a severe weakness (CICD-SEC-6). If a runner is compromised or log sanitization fails, long-lived keys are exfiltrated and remain valid until someone notices.

The alternative is **OpenID Connect (OIDC) workload identity federation** (e.g. AWS STS via `AssumeRoleWithWebIdentity`, GCP Workload Identity, Azure Federated Credentials):

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/oidc-workload-token-exchange.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the OIDC workload identity token exchange diagram at full size">
    <img src="{{ '/assets/img/oidc-workload-token-exchange.svg' | relative_url }}" alt="A build runner requests a short-lived JWT from the CI platform's OIDC provider, then presents it to the cloud Security Token Service, which validates it and returns temporary credentials. Two panels compare the token's claims — iss, aud, sub, repository, ref — against the trust policy, which must pin aud and sub. A warning states that conditioning on the repository claim alone is satisfied by any branch or workflow in that repository. A residual-risk footer notes a short lifetime bounds but does not prevent theft, and does not guarantee revocation.">
  </a>
  <p class="diagram-caption">The OIDC exchange, and the claim the trust policy has to pin for it to mean anything</p>
</div>

1. **OIDC token request**: the build runner requests a short-lived JSON Web Token (JWT) from the CI platform's OIDC provider. The token carries standard claims (`iss`, `aud`, `sub`) alongside platform-specific ones (on GitHub, `repository` and `ref`).
2. **Token exchange**: the runner passes the JWT to the cloud provider's Security Token Service (STS).
3. **Claim validation**: the cloud provider validates the JWT signature against the issuer's JWKS, checks `aud`, and evaluates the trust policy against `sub`. **Condition on `sub`, not on the repository alone.** The `sub` claim encodes repository *plus* branch, tag, environment, or reusable workflow; a repository-only condition is satisfied by any branch or workflow in that repository. It then returns temporary credentials — one hour by default, configurable from 15 minutes up to the role's maximum session duration.

### What federation does not solve

Removing the static key removes a stored secret, but it relocates the entire security decision into the trust policy:

- A repository-only trust condition means **any** pipeline poisoning that achieves execution in that repository, on any branch, mints production credentials. On this page that is not a hypothetical — it is the direct payoff of the PPE vectors above.
- A short lifetime bounds how long a stolen token or credential stays useful. It does not prevent theft, and it does not guarantee revocation: credentials already issued normally remain valid until they expire, even after the trust rule is removed.
- The workload identity is only as trustworthy as the claims it asserts. Do not use mutable display names or unqualified repository names as sole trust selectors.

For the general model — attestation, claim mapping, issuer key rollover, and revocation behavior across platforms — see **[Workload Identity Federation]({{ '/topics/workload-identity-federation/' | relative_url }})**.

## CI/CD pipeline security diagnostic checklist

The checklist below is a journal working model, not a published audit standard. When auditing build pipelines and CI/CD platforms, evaluate these six criteria:

| Diagnostic area | Architectural evaluation question | Verification &amp; audit evidence |
|---|---|---|
| **OIDC trust-policy scoping** | Are cloud deployment steps authenticated via OIDC, with the trust policy pinning `aud` and `sub` rather than the repository alone? | Pipeline YAML files &amp; the IAM trust relationship JSON condition block. |
| **Fork PR execution gates** | Do workflow runs on pull requests from external forks require explicit approval by maintainers, and are `pull_request_target` workflows audited? | GitHub/GitLab repository action settings. |
| **Action &amp; plugin pinning** | Are third-party CI marketplace actions pinned to explicit full commit SHAs rather than mutable tags? | Workflow YAML carrying a complete 40-character SHA (`uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11`). |
| **Ephemeral runner isolation** | Do build jobs run inside isolated, ephemeral container instances destroyed immediately after job completion? | Runner controller architecture &amp; container lifespan configs. |
| **Secret exfiltration shield** | Are pipeline secrets masked in console logs and withheld from unprivileged PR contexts? | Secret store configurations &amp; build log audit samples. |
| **Branch protection rules** | Are direct pushes to main/production branches blocked by mandatory multi-person code review rules? | GitHub/GitLab branch protection rule settings. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>CI/CD build pipelines are high-privilege targets. PPE has three vectors that start from different access levels — branch protection contains D-PPE and I-PPE, only a fork approval gate contains 3PE. Pin third-party actions to full commit SHAs, and when replacing static keys with OIDC, condition the trust policy on <code>sub</code>, never on the repository alone.</p>
</div>

## Primary references

- **[OWASP Top 10 CI/CD Security Risks](https://owasp.org/www-project-top-10-ci-cd-security-risks/)** — verified the ten risk identifiers and their exact titles, and the 2022 edition status.
- **[OWASP CICD-SEC-04: Poisoned Pipeline Execution](https://owasp.org/www-project-top-10-ci-cd-security-risks/CICD-SEC-04-Poisoned-Pipeline-Execution)** — verified the definitions of Direct, Indirect, and Public PPE and the access each requires.
- **[AWS STS AssumeRoleWithWebIdentity](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html)** — verified the one-hour default session duration and the 15-minute to 12-hour configurable range.
- **[GitHub Actions OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect)** — verified the token claim set and trust-condition guidance.
