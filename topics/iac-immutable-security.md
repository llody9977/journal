---
title: "Infrastructure as Code (IaC) & Immutable Security"
description: Comprehensive technical guide to Infrastructure as Code (IaC) security scanning, static code analysis (Checkov/tfsec), Policy-as-Code (OPA/Rego), Drift Detection, and Immutable Infrastructure patterns.
permalink: /topics/iac-immutable-security/
last_verified: 2026-08-13
---

<span class="eyebrow">Cloud-Native Security / Infrastructure Automation</span>

# Infrastructure as Code (IaC) & Immutable Security

<p class="lede">Infrastructure as Code (IaC) shifts infrastructure provisioning into software code repositories (Terraform, CloudFormation, Bicep, Helm). While IaC enables rapid automation, misconfigurations written into IaC code templates propagate misconfigurations to hundreds of cloud environments simultaneously. Securing cloud infrastructure requires scanning IaC templates in CI/CD pipelines using static security analyzers (Checkov, tfsec), enforcing Policy-as-Code (OPA/Rego), detecting runtime configuration drift, and deploying immutable infrastructure.</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/iac-immutable-security.svg' | relative_url }}" alt="IaC Security diagram showing Checkov/tfsec static scanning, Drift Detection, Immutable Infrastructure, and Ephemeral Workloads.">
  <p class="diagram-caption">Infrastructure as Code Security Architecture: Static IaC Template Scans &leftrightarrow; GitOps Auto-Reconciliation &leftrightarrow; Immutable Workload Replacement</p>
</div>

## Static IaC Security Scanning (Checkov & tfsec)

Static IaC security tools analyze infrastructure code manifests before deployment, catching security defects early in the SDLC:

<div class="diagram-frame">
  <img src="{{ '/assets/img/iac-immutable-security.svg' | relative_url }}" alt="Static Infrastructure as Code security scanning pipeline diagram.">
  <p class="diagram-caption">IaC CI/CD Security Pipeline: Terraform Commit &leftrightarrow; Static Scan Gate &leftrightarrow; Terraform Apply</p>
</div>

### Common IaC Misconfiguration Patterns
- **Overly Permissive Ingress**: Security groups configured with `0.0.0.0/0` on sensitive ports (*SSH 22, RDP 3389, Database 5432*).
- **Unencrypted Data Storage**: S3 buckets, EBS volumes, or RDS databases created without mandatory KMS encryption flags (`encrypted = true`).
- **Public Resource Exposure**: S3 buckets or ECR container registries lacking explicit public access block configurations.
- **Missing Audit Logging**: S3 buckets or VPCs created without enabling access logging or VPC Flow Logs.

## Policy-as-Code via Open Policy Agent (OPA) & Rego

**Policy-as-Code** decouples security policy logic from application code, allowing security teams to express compliance rules as executable code using **Open Policy Agent (OPA)** and **Rego**:

```rego
# Rego Policy Example: Deny S3 Buckets without Encryption
package main

deny[msg] {
    resource := input.resource.aws_s3_bucket[name]
    not resource.server_side_encryption_configuration
    msg := sprintf("S3 Bucket '%v' must have server-side encryption enabled", [name])
}
```

By passing `terraform plan -out=plan.json` into OPA during CI/CD execution, organizations enforce non-bypassable organizational compliance rules.

## Runtime Drift Detection & GitOps Reconciliation

**Infrastructure Drift** occurs when cloud resources are modified manually out-of-band (*e.g. an engineer modifying a security group rule via the AWS Management Console*) without updating the underlying IaC code:

<p class="formula"><strong>Drift:</strong> actual runtime cloud state &ne; declared IaC repository state</p>

### Mitigating Drift via GitOps
- **Continuous Drift Scanning**: Run scheduled daily `terraform plan` jobs or use drift detection tools (*Driftctl, AWS Config*) to alert when runtime drift occurs.
- **GitOps Auto-Reconciliation**: Deploy GitOps controllers (*ArgoCD, Flux*) that continuously monitor live Kubernetes/Cloud clusters and automatically overwrite manual runtime changes to match the Git repository state.

## Essential IaC Security Diagnostic Checklist

When auditing Infrastructure as Code repositories and deployment pipelines, evaluate these 6 criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **CI/CD IaC Static Scanning** | Are all Terraform/Helm code changes scanned automatically via Checkov or tfsec on pull requests? | CI/CD build scripts &amp; PR status check logs. |
| **Policy-as-Code Enforcement** | Are organizational compliance rules enforced via OPA/Rego gates before `terraform apply`? | OPA Rego policy repository &amp; CI scan outputs. |
| **Automated Drift Detection** | Is runtime cloud infrastructure continuously monitored for manual out-of-band configuration drift? | GitOps controller logs &amp; AWS Config drift alerts. |
| **No Hardcoded Secrets** | Are API keys, passwords, and private keys excluded from IaC files and injected via Secret Managers? | Secret scanner logs (TruffleHog / GitGuardian). |
| **Immutable Golden Images** | Are VM instances built from CIS-hardened golden AMI pipelines (Packer) rather than manual setup? | Packer build manifests &amp; AMI pipeline logs. |
| **Git Branch Access Control** | Are direct pushes to main infrastructure branches blocked by mandatory code review gates? | Repository branch protection rule settings. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Infrastructure as Code automates provisioning, but code misconfigurations scale risks rapidly. Scan IaC templates in CI/CD via Checkov/tfsec, enforce Policy-as-Code via OPA/Rego, and continuously reconcile runtime drift using GitOps.</p>
</div>

## Primary references

- **Checkov Documentation**: *Infrastructure as Code Static Analysis Tool* — [Checkov Docs](https://www.checkov.io/)
- **Open Policy Agent**: *OPA / Rego Policy Documentation* — [Open Policy Agent](https://www.openpolicyagent.org/)
