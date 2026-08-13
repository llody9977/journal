---
title: "CI/CD Pipeline Security & Workload Identity"
description: Comprehensive technical guide to CI/CD build pipeline security, OWASP Top 10 CI/CD Security Risks (2022), Poisoned Pipeline Execution (PPE), and passwordless OIDC workload identity federation.
permalink: /topics/cicd-pipeline-security/
last_verified: 2026-08-13
---

<span class="eyebrow">Software Supply Chain Security / Pipeline Security</span>

# CI/CD Pipeline Security & Workload Identity

<p class="lede">In modern software development, the CI/CD build pipeline is a high-privilege execution environment. Build runners execute arbitrary code, pull third-party packages, and possess credentials to deploy artifacts into production cloud environments. If an attacker compromises the build pipeline, they can inject malicious code into trusted software releases without modifying source repositories. Securing CI/CD requires defending against OWASP CI/CD risks, preventing Poisoned Pipeline Execution (PPE), and replacing static cloud keys with passwordless OIDC workload identity federation.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/cicd-pipeline-security.svg' | relative_url }}" alt="CI/CD Security diagram showing OWASP Top 10 CI/CD Security Risks, Poisoned Pipeline Execution (PPE), and OIDC workload identity federation.">
  <p class="diagram-caption">CI/CD Pipeline Security Architecture: OWASP CI/CD Top 10 Risks &leftrightarrow; Ephemeral Isolated Build Runners &leftrightarrow; OIDC Passwordless Workload Identity Token Exchange</p>
</div>

## OWASP Top 10 CI/CD Security Risks (2022 Edition)

OWASP published the **Top 10 CI/CD Security Risks**, drawing directly from major software supply chain breaches (*e.g. SolarWinds, Codecov*):

| Risk ID | Risk Title | Operational Failure Mode &amp; Real-World Impact |
|---|---|---|
| **CICD-SEC-1** | **Insufficient Flow Control** | Unreviewed code merged or built directly into production release artifacts. |
| **CICD-SEC-2** | **Inadequate IAM** | Over-privileged build runner service accounts with global cloud admin rights. |
| **CICD-SEC-3** | **Dependency Chain Abuse** | Dependency confusion, typosquatting, or compromised upstream package versions. |
| **CICD-SEC-4** | **Poisoned Pipeline Execution (PPE)** | Attackers modify pipeline definition files (`.github/workflows/*.yml`) in PRs to execute arbitrary commands. |
| **CICD-SEC-5** | **Insufficient PBAC** | Unrestricted pipeline access to sensitive execution environments or deployment targets. |
| **CICD-SEC-6** | **Insufficient Credential Hygiene** | Long-lived cloud access keys stored in pipeline secret stores, exposed via logs or PR builds. |
| **CICD-SEC-7** | **Insecure System Configuration** | Unpatched build platform servers, unauthenticated runner controllers, permissive network access. |
| **CICD-SEC-8** | **Ungoverned Usage of 3rd-Party Services** | Third-party CI marketplace actions/plugins with unpinned versions executing malicious code. |
| **CICD-SEC-9** | **Improper Artifact Validation** | Downstream environments deploy container images without verifying digital signatures or hashes. |
| **CICD-SEC-10** | **Insufficient Logging &amp; Visibility** | Missing audit logs for pipeline configuration changes, secret access, or runner execution steps. |

## Poisoned Pipeline Execution (PPE) Vectors

**Poisoned Pipeline Execution (PPE)** occurs when an attacker weaponizes the CI/CD pipeline configuration file itself:

```
Attacker Fork ──> Modifies .github/workflows/build.yml ──> Opens Pull Request ──> CI Runner Executes Payload
```

1. **Direct PPE**: The pipeline automatically runs workflow files contained within an unreviewed pull request from a public fork. The modified workflow extracts pipeline secrets (*e.g., `AWS_ACCESS_KEY_ID`*) and posts them to an attacker server.
2. **Indirect PPE**: The workflow file calls a script or Makefile contained in the repository. The attacker modifies the Makefile without altering the workflow file itself.
3. **Mitigation**: Configure pipeline platforms to require manual approval from repository maintainers before executing workflows on pull requests originating from external forks.

## Passwordless OIDC Workload Identity Federation

Storing static, long-lived cloud credentials (*e.g. AWS IAM Access Keys*) in CI/CD secret stores is a severe vulnerability (CICD-SEC-6). If a runner is compromised or log sanitization fails, long-lived keys are exfiltrated.

The solution is **OpenID Connect (OIDC) Workload Identity Federation** (e.g. AWS STS via `AssumeRoleWithWebIdentity`, GCP Workload Identity, Azure Federated Credentials):

```
[ CI/CD Runner (GitHub Actions) ] ──( 1. Request Short-Lived JWT Token )──> [ GitHub OIDC Provider ]
                                                                                   │
[ CI/CD Runner ] <──( 3. Issue Temporary Cloud Credentials )── [ Cloud Provider (AWS STS) ] <──( 2. Validate JWT )
```

1. **OIDC Token Request**: The build runner requests a short-lived JSON Web Token (JWT) from the CI platform's OIDC Provider. The token contains cryptographic claims (`sub`, `aud`, `repository`, `ref`).
2. **Token Exchange**: The runner passes the JWT to the cloud provider's Security Token Service (STS).
3. **Claim Validation**: The cloud provider validates the JWT signature and verifies that the `repository` claim matches the configured trust policy before returning temporary (1-hour) cloud credentials.

## Essential CI/CD Pipeline Security Diagnostic Checklist

When auditing build pipelines and CI/CD platforms, evaluate these 6 criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **OIDC Workload Identity** | Are all cloud deployment steps authenticated via passwordless OIDC instead of static access keys? | Pipeline YAML files &amp; AWS IAM trust relationship JSONs. |
| **Fork PR Execution Gates** | Do workflow runs on pull requests from external forks require explicit approval by maintainers? | GitHub/GitLab repository action settings. |
| **Action &amp; Plugin Pinning** | Are third-party CI marketplace actions pinned to explicit full SHA-1 commit hashes rather than mutable tags? | Workflow YAML code (`uses: actions/checkout@b4ffde65f463d6ab...`). |
| **Ephemeral Runner Isolation** | Do build jobs run inside isolated, ephemeral container instances destroyed immediately after job completion? | Runner controller architecture &amp; container lifespan configs. |
| **Secret Exfiltration Shield** | Are pipeline secrets masked in console logs and forbidden from passing into unprivileged PR contexts? | Secret store configurations &amp; build log audit samples. |
| **Branch Protection Rules** | Are direct pushes to main/production branches blocked by mandatory multi-person code review rules? | GitHub/GitLab branch protection rule settings. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>CI/CD build pipelines are high-privilege targets. Protect against Poisoned Pipeline Execution (PPE) by requiring approval for fork PRs, pin third-party actions to full SHA-1 hashes, and replace static secrets with passwordless OIDC Workload Identity Federation.</p>
</div>

## Primary references

- **OWASP Top 10 CI/CD Security Risks**: *OWASP CI/CD Security Project* — [OWASP CI/CD Project](https://owasp.org/www-project-top-10-ci-cd-security-risks/)
- **GitHub Actions OIDC Documentation**: *About Security Hardening with OpenID Connect* — [GitHub OIDC Docs](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
