---
title: Cloud Security Architecture & IAM Perimeters
description: Technical reference for the shared responsibility split across IaaS, PaaS and SaaS, what CSPM, CIEM and CWPP each observe and are blind to, AWS Service Control Policies and permissions boundaries against the Google Cloud Organization Policy equivalent, and the attacker model a stolen cloud credential creates.
permalink: /topics/cloud-security-iam-perimeters/
last_verified: 2026-08-15
---

<span class="eyebrow">Cloud-Native Security / Infrastructure Architecture</span>

# Cloud Security Architecture & IAM Perimeters

<p class="lede">A cloud environment has no cable to unplug. Every action is an authenticated API call, so the boundary that used to be a datacenter wall is now the set of identities that can call the control plane and what those identities are permitted to do. That shift changes the failure mode: a compromise rarely looks like an intrusion across a network edge, it looks like a valid credential making valid API calls. This page covers how responsibility is split with the provider, what the three cloud security tool categories can and cannot see, and how guardrail policies bound an identity's maximum reachable permissions.</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/cloud-security-iam-perimeters.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the cloud security architecture diagram at full size">
    <img src="{{ '/assets/img/cloud-security-iam-perimeters.svg' | relative_url }}" alt="Cloud Security Architecture diagram showing Shared Responsibility Model across IaaS/PaaS/SaaS, CSPM, CIEM, and CWPP.">
  </a>
  <p class="diagram-caption">Cloud Security Architecture: Shared Responsibility Model Boundaries &leftrightarrow; CSPM / CIEM / CWPP Tooling Triad &leftrightarrow; IAM Perimeter Control</p>
</div>

## Who secures what, by delivery model

The provider secures the substrate; the customer secures what they configure on top of it. The line moves as the service abstracts more away, and the customer's share never reaches zero — data classification and access management stay with the customer in every model.

| Cloud Delivery Model | Cloud Provider Responsibility | Customer Responsibility |
|---|---|---|
| **IaaS (Infrastructure)** | Physical datacenters, server hardware, hypervisors, physical networking. | OS patching, network firewall rules, IAM roles, middleware, app security, data encryption. |
| **PaaS (Platform)** | Hardware, hypervisor, OS maintenance, database engine updates, network infrastructure. | Application code, API security, data classification, IAM access policies, customer data. |
| **SaaS (Software)** | Hardware, infrastructure, OS, application software, database, network routing. | User access management, data classification, endpoint security, session management. |

The useful test is not which row a service sits in but whether the provider *enforces* a control or merely *offers* it. A provider that makes bucket encryption available and leaves it off by default has discharged its responsibility; an unencrypted bucket is the customer's finding. [Cloud & Distributed Secure Architecture Patterns]({{ '/topics/cloud-secure-architecture-patterns/' | relative_url }}) works through the isolation patterns built on top of this split.

## What a stolen cloud credential actually gets

The threat model worth holding in mind is not a network intrusion. It is an attacker holding a valid credential — a leaked access key, a token exfiltrated from a compromised workload, or an over-trusting cross-account role — and calling the same APIs a legitimate operator would.

- **Passive reconnaissance first.** With read-only access an attacker enumerates the account: `iam:ListRoles`, `iam:GetPolicy`, storage inventories, and the tags and trust policies that reveal which roles are worth pivoting to. These calls are indistinguishable from tooling traffic in most audit logs, which is why the CIEM view of *who could reach what* matters more than any single alert.
- **Privilege escalation through the IAM graph.** The valuable finding is rarely a directly admin-equivalent key. It is a chain: a principal that may pass a role to a service, edit a policy attached to itself, or assume a role whose trust policy is over-broad. Each hop is an authorized API call.
- **Cross-account trust as the entry path.** A role trusting a third party's account with no external-ID condition is exploitable by anyone who can persuade that third party to make a call on their behalf — the confused-deputy problem. AWS's mitigation is an `sts:ExternalId` condition agreed out of band; the analogous discipline in any provider is to condition trust on something the caller cannot choose for itself.
- **What the attacker still lacks.** A control-plane credential does not by itself grant plaintext of data encrypted under a key the principal cannot use, and it does not grant code execution inside a running workload. Those require separate grants — which is exactly why key policies and workload runtime protection are distinct controls rather than restatements of IAM.

Guardrails below bound the damage from every step above by capping what any principal in the account can do, regardless of what its own policy says.

## The cloud security tooling triad: CSPM, CIEM & CWPP

Managing cloud security posture requires three complementary security technology categories. They are frequently sold together as a **Cloud-Native Application Protection Platform (CNAPP)** — a market bundle rather than a distinct technical capability, so evaluate a CNAPP by which of the three functions it actually performs rather than by the label.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/cloud-security-tooling-triad.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the CSPM, CIEM and CWPP comparison diagram at full size">
    <img src="{{ '/assets/img/cloud-security-tooling-triad.svg' | relative_url }}" alt="Three columns, one per tool category. CSPM inspects resource configuration through the provider control plane and answers whether a resource is configured safely; it does not see identity reachability or process behavior. CIEM inspects identity policies, roles, and trust relationships and answers who could reach what; it does not see workload behavior. CWPP inspects the running workload from inside and answers what the workload is actually doing; it does not see estate-wide misconfiguration. A footer notes that the three answer different questions on different planes and that no one of them substitutes for another.">
  </a>
  <p class="diagram-caption">What each of the three can observe — and what each one is blind to</p>
</div>

1. **Cloud Security Posture Management (CSPM)**:
   - Continuously scans cloud infrastructure configurations against benchmarks and control frameworks (*CIS Benchmarks, NIST CSF, PCI DSS*).
   - Detects misconfigurations like publicly readable S3 buckets, unencrypted EBS volumes, or open security groups (`0.0.0.0/0`).
2. **Cloud Infrastructure Entitlement Management (CIEM)**:
   - Analyzes IAM roles, policies, and principal entitlements across multi-cloud environments.
   - Identifies over-privileged service accounts, unused permissions, and risky cross-account trust relationships to enforce least privilege.
3. **Cloud Workload Protection Platform (CWPP)**:
   - Provides runtime security monitoring, vulnerability management, and behavioral threat detection for virtual machines, container pods, and serverless functions.

## Guardrail policies and their provider-specific names

Identity is the primary boundary, and guardrails work by capping the maximum permissions a principal can hold — a ceiling that an over-permissive identity policy cannot raise. The mechanisms are genuinely provider-specific, and the terminology does not port between clouds.

- **Service Control Policies (SCPs)** are an **AWS Organizations** construct. They set the maximum available permissions for principals in the accounts they apply to, and an SCP that does not allow an action means no principal in that account can perform it regardless of its own IAM policy. Typical uses are denying root-user actions or preventing CloudTrail from being disabled across every member account.
- **Resource Control Policies (RCPs)** are the AWS counterpart applied to *resources* rather than principals, capping who may access a resource in the organization even from outside it.
- **Permissions boundaries** are an AWS IAM feature that caps the maximum permissions of a single user or role. They let a delegated administrator create roles without being able to create one more privileged than the boundary permits.
- **Google Cloud has no "SCP."** The equivalent layer is the **Organization Policy Service** in Resource Manager, which applies *constraints* through *organization policies* across the resource hierarchy. It is a different mechanism with a different policy language, and it is also distinct from **VPC Service Controls**, which draws a network and API perimeter around services rather than capping permissions.
- **Attribute-Based Access Control (ABAC)** authorizes dynamically by matching resource tags against principal tags (*e.g. a principal tagged `Project=Alpha` may access buckets tagged `Project=Alpha`*). Its correctness depends entirely on tag integrity, so restrict who may set the tags the policy reads.

## Cloud security review checklist

The checklist below is a journal working model, not a published audit standard. When auditing a cloud infrastructure deployment, evaluate these six criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Organizational guardrails** | Are top-level guardrails deployed to block root access and prevent audit-log deletion across every account? | AWS Organizations SCP and RCP JSON, or GCP organization policy constraints. |
| **Automated CSPM Scanning** | Is a CSPM tool continuously auditing cloud resource configurations against CIS Benchmarks? | CSPM dashboard reports &amp; automated alert logs. |
| **CIEM Entitlement Pruning** | Are unused IAM permissions and over-privileged roles automatically flagged and pruned by a CIEM tool? | CIEM entitlement analysis logs &amp; IAM policy diffs. |
| **Cross-account trust conditions** | Does every role trusted by an external account carry an external-ID or equivalent condition the caller cannot choose for itself? | Role trust policy documents, third-party integration records. |
| **Centralized Cloud Audit Logging** | Are cloud management API logs (CloudTrail / Audit Logs) encrypted and streamed to a tamper-proof central account? | CloudTrail S3 bucket policies &amp; KMS key settings. |
| **MFA for Console Access** | Is Multi-Factor Authentication mandatory for all cloud management console user accounts? | IAM credential report (`mfa_active = true`). |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>The cloud perimeter is the set of identities that can call the control plane, so the realistic attack is a valid credential making valid API calls and walking the IAM graph — not a network breach. CSPM, CIEM and CWPP answer three different questions on two different planes and none substitutes for another. Guardrails cap what a principal can ever do: SCPs, RCPs and permissions boundaries are AWS constructs, and Google Cloud's equivalent is the Organization Policy Service, not an "SCP."</p>
</div>

## Primary references

- **[NIST SP 800-145: The NIST Definition of Cloud Computing](https://csrc.nist.gov/pubs/sp/800/145/final)** — verified the IaaS, PaaS, and SaaS service-model definitions used to frame the responsibility split.
- **[AWS Organizations: Service control policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)** — verified that SCPs set the maximum available permissions for accounts and that SCPs are an AWS Organizations feature.
- **[AWS Organizations: Resource control policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_rcps.html)** — verified that RCPs apply a permissions ceiling to resources rather than principals.
- **[AWS IAM: Permissions boundaries for IAM entities](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html)** — verified that a permissions boundary caps the maximum permissions of a user or role without granting any.
- **[Google Cloud: Organization Policy Service overview](https://docs.cloud.google.com/resource-manager/docs/organization-policy/overview)** — verified that Google Cloud's hierarchy-wide guardrail layer is the Organization Policy Service using constraints and organization policies, and that "Service Control Policy" is not Google Cloud terminology.
- **[CIS Amazon Web Services Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services)** — the configuration baseline CSPM tools most commonly assess AWS accounts against. Check the current version on this page before citing a specific revision; the benchmark is revised frequently.
