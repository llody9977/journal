---
title: "Infrastructure as Code (IaC) & Immutable Security"
description: Technical reference for what a static IaC template scan catches versus what only a plan evaluation catches, writing Rego against the right input shape under OPA 1.0 syntax, why state and saved plan files are secret-bearing artifacts, and why a pipeline gate binds only what passes through it.
permalink: /topics/iac-immutable-security/
last_verified: 2026-08-15
---

<span class="eyebrow">Cloud-Native Security / Infrastructure Automation</span>

# Infrastructure as Code (IaC) & Immutable Security

<p class="lede">Infrastructure as Code moves provisioning into version-controlled templates (Terraform, CloudFormation, Bicep, Helm). The security consequence is leverage in both directions: a reviewed, scanned template applies a correct configuration to hundreds of environments, and a single bad default propagates just as widely. Securing it means scanning templates before merge, evaluating the resolved plan for what those templates will actually create, treating state and plan files as secret-bearing artifacts, and replacing drifted infrastructure rather than patching it in place.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/iac-immutable-security.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the Infrastructure as Code security architecture diagram at full size">
    <img src="{{ '/assets/img/iac-immutable-security.svg' | relative_url }}" alt="IaC Security diagram showing Checkov and Trivy static scanning, plan-stage policy evaluation, drift detection, and immutable infrastructure replacement.">
  </a>
  <p class="diagram-caption">Infrastructure as Code Security Architecture: Template Scans &leftrightarrow; Plan-Stage Policy Evaluation &leftrightarrow; Drift Detection &amp; Immutable Replacement</p>
</div>

## Static IaC security scanning

Static IaC tools analyze infrastructure code manifests before deployment, catching security defects at review time rather than after provisioning:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/iac-pipeline-scan-gate.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the Infrastructure as Code pipeline scan gate diagram at full size">
    <img src="{{ '/assets/img/iac-pipeline-scan-gate.svg' | relative_url }}" alt="A left-to-right pipeline. A Terraform commit opens a pull request; static analyzers such as Checkov and Trivy read the template source; terraform plan produces a saved plan which terraform show converts to JSON for a policy engine to evaluate against Rego rules; the gate then either fails the build or allows terraform apply to reach the cloud provider. Two callouts distinguish the template scan, which reads the code as written, from the plan evaluation, which reads the resolved resource set after variables and modules are expanded. A footer notes that a pipeline gate is bypassed by anyone applying locally, so drift detection is what catches changes that never passed the gate.">
  </a>
  <p class="diagram-caption">Template scan and plan evaluation catch different things, and the gate binds only what passes through it</p>
</div>

**Tool status matters here.** Checkov and Trivy are actively developed. **tfsec has been folded into Trivy**: Aqua consolidated its scanning efforts into Trivy, tfsec receives no new misconfiguration checks, and its final release was v1.28.14 in May 2025. Existing tfsec checks still run, so an established pipeline is not broken, but resources and rules published since then are not covered — prefer `trivy config` for new work.

### Common IaC misconfiguration patterns
- **Overly Permissive Ingress**: Security groups configured with `0.0.0.0/0` on sensitive ports (*SSH 22, RDP 3389, Database 5432*).
- **Unencrypted Data Storage**: Volumes or databases created without the encryption flags the provider requires.
- **Public Resource Exposure**: S3 buckets or ECR container registries lacking explicit public access block configurations.
- **Missing Audit Logging**: Buckets or VPCs created without enabling access logging or VPC Flow Logs.

## Policy-as-Code with OPA and Rego

**Policy-as-Code** expresses compliance rules as executable code using **Open Policy Agent (OPA)** and **Rego**. The critical detail is *which input the policy is written against*, because the two scanning stages above expose completely different structures.

A policy evaluating **parsed template source** (the shape Conftest produces from `.tf` files) sees resources under `input.resource`:

```rego
# Template-level policy, evaluated by Conftest against parsed .tf source.
# OPA 1.0 syntax: `contains` for partial sets, `if` before the rule body.
package terraform.template

deny contains msg if {
    some name
    resource := input.resource.aws_s3_bucket[name]
    not resource.server_side_encryption_configuration
    msg := sprintf("S3 bucket '%v' has no server-side encryption configuration", [name])
}
```

A policy evaluating the **resolved plan** sees a different document entirely — planned resources live under `planned_values`, and proposed changes under `resource_changes`:

```rego
# Plan-level policy, evaluated against `terraform show -json` output.
package terraform.plan

deny contains msg if {
    some change in input.resource_changes
    change.type == "aws_s3_bucket"
    "create" in change.change.actions
    not change.change.after.server_side_encryption_configuration
    msg := sprintf("S3 bucket '%v' would be created without encryption", [change.address])
}
```

Two things routinely go wrong here:

- **Syntax version.** OPA v1.0 requires the `if` keyword before a rule body and `contains` for partial set rules. The older `deny[msg] { ... }` form now fails with *"`contains` keyword is required for partial set rules"*. Policies written before OPA 1.0 need migrating, not just copying.
- **`terraform plan -out` does not produce JSON.** The `-out` file is an opaque format that Terraform explicitly documents as not intended for consumption by other software; naming it `plan.json` does not change that. Convert it in a second step:

```sh
terraform plan -out=tfplan
terraform show -json tfplan > plan.json
opa eval --input plan.json --data policy/ 'data.terraform.plan.deny'
```

## State files and saved plans are secret-bearing artifacts

This is the exposure most easily missed, because it is created by Terraform itself rather than written by an engineer.

Terraform records resolved attribute values in state, and its documentation states plainly that local state is a plaintext file that includes any secret values defined in the configuration. A database password fetched cleanly from a secret manager still lands in state as plaintext once it is an attribute of a managed resource. Saved plan files have the same property — Terraform warns that a plan file contains sensitive data in cleartext and should be treated accordingly.

Practical consequences:

- **Never commit state or plan files.** `.tfstate`, `.tfstate.backup`, and saved plans belong in `.gitignore`, not in the repository that the pipeline reads.
- **Use a remote backend with encryption at rest and state locking** (S3 with `encrypt` and a lock mechanism, GCS with CMEK, or HCP Terraform, which encrypts at rest and in transit).
- **Treat backend access as privileged.** Read access to the state bucket is read access to every secret in the estate; scope it to the pipeline role and audit it like a credential store.
- **Expire plan artifacts.** CI systems retain build artifacts by default; a saved plan sitting in a public build log is a credential leak with a long tail.

## Module and provider supply chain

IaC templates pull in third-party code the same way an application does. A module sourced from a public registry runs with the pipeline's cloud credentials at apply time, and a provider binary executes on the runner.

- **Pin module and provider versions.** Use exact versions or tight constraints rather than floating references, and commit the dependency lock file (`.terraform.lock.hcl`) so provider checksums are verified on every run.
- **Prefer sources you control or vendor.** A `git` reference to a moving branch re-resolves on each init; a registry version does not.
- **Scan modules, not just your own code.** A template scan that only reads root-module files misses everything a module generates — which is precisely the gap the plan evaluation closes.

The same reasoning applied to application dependencies is covered in [Software Bill of Materials (SBOM) & VEX]({{ '/topics/sbom-dependency-management/' | relative_url }}), and pipeline identity in [CI/CD Pipeline Security & Workload Identity]({{ '/topics/cicd-pipeline-security/' | relative_url }}).

## Drift detection and GitOps reconciliation

**Infrastructure Drift** occurs when cloud resources are modified out-of-band (*e.g. an engineer editing a security group rule in the console*) without updating the underlying IaC code:

<p class="formula"><strong>Drift:</strong> actual runtime cloud state &ne; declared IaC repository state</p>

Drift detection is not a nicety bolted onto the pipeline — it is the control that covers the pipeline's own blind spot. **A pipeline gate binds only the changes that pass through the pipeline.** Anyone with credentials who runs `terraform apply` locally, or edits a resource in the console, bypasses every scan and policy check described above. Nothing in CI can prevent that; only detection after the fact catches it.

- **Continuous Drift Scanning**: Run scheduled `terraform plan` jobs or use drift detection tooling (*driftctl, AWS Config*) to alert when runtime state diverges from code.
- **GitOps Auto-Reconciliation**: GitOps controllers (*Argo CD, Flux*) continuously compare live cluster state against the Git repository. Automatic correction is not the default — Argo CD reverts manual changes only when automated sync is enabled *with* self-healing turned on, so verify the sync policy rather than assuming reconciliation is active.
- **Close the loop with permissions.** The durable fix for console drift is removing the ability to make it: restrict human write access to production and route changes through the pipeline role.

## IaC security review checklist

The checklist below is a journal working model, not a published audit standard. When auditing Infrastructure as Code repositories and deployment pipelines, evaluate these six criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **CI/CD IaC Static Scanning** | Are all Terraform/Helm changes scanned automatically on pull requests by a maintained scanner? | CI/CD build scripts &amp; PR status check logs. |
| **Policy-as-Code Enforcement** | Are compliance rules enforced against the resolved plan JSON before `terraform apply`, using current Rego syntax? | OPA policy repository, `terraform show -json` step, CI evaluation output. |
| **State and plan handling** | Is state held in an encrypted, access-controlled remote backend, with state and plan files excluded from Git and expired from CI artifacts? | Backend configuration, `.gitignore`, bucket policy, artifact retention settings. |
| **Dependency pinning** | Are module and provider versions pinned and is `.terraform.lock.hcl` committed? | Module source blocks, version constraints, lock file in the repository. |
| **Automated Drift Detection** | Is runtime infrastructure continuously monitored for out-of-band change, given that the gate cannot prevent it? | Drift job schedule and alerts, GitOps sync policy showing self-heal state. |
| **Git Branch Access Control** | Are direct pushes to main infrastructure branches blocked by mandatory code review gates? | Repository branch protection rule settings. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>A template scan reads the code as written; only a plan evaluation sees what variables and modules actually resolve to — and <code>terraform plan -out</code> emits an opaque file, so <code>terraform show -json</code> is the step that produces policy input. Write Rego in OPA 1.0 form (<code>deny contains msg if</code>) against the input shape the stage actually provides. State and saved plan files hold secrets in cleartext, so the backend is a credential store. And a pipeline gate binds only what goes through the pipeline: a local apply bypasses it entirely, which is the whole reason drift detection exists.</p>
</div>

## Primary references

- **[Terraform: `terraform plan` command](https://developer.hashicorp.com/terraform/cli/commands/plan)** — verified that `-out` writes a file that is not in any standard format intended for consumption by other software, and that saved plans contain sensitive values in cleartext.
- **[Terraform: `terraform show` command](https://developer.hashicorp.com/terraform/cli/commands/show)** — verified that `-json` on a saved plan is the supported way to produce machine-readable plan output.
- **[Terraform: Sensitive data in state](https://developer.hashicorp.com/terraform/language/state/sensitive-data)** — verified that local state is stored as plaintext including secret values, and the remote-backend encryption and access-control guidance.
- **[Open Policy Agent: Policy language](https://www.openpolicyagent.org/docs/policy-language)** — verified the OPA 1.0 requirement for `if` before rule bodies and `contains` for partial set rules.
- **[Checkov](https://www.checkov.io/)** — static analysis for Terraform, CloudFormation, Kubernetes and Helm manifests; the template-scan stage described above.
- **[tfsec repository](https://github.com/aquasecurity/tfsec)** — verified that Aqua consolidated its scanning efforts into Trivy and that tfsec is no longer the maintained path for new work.
