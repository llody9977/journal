---
title: Cloud & Distributed Secure Architecture Patterns
description: Technical reference for multi-tenant isolation layers and the assumptions they rest on, private endpoints, VPC Service Controls and egress allowlists with their documented limits, and the immutable infrastructure lifecycle.
permalink: /topics/cloud-secure-architecture-patterns/
last_verified: 2026-08-14
---

<span class="eyebrow">Security Architecture & Design Principles / Distributed Systems</span>

# Cloud & Distributed Secure Architecture Patterns

<p class="lede">Public cloud replaces a static network boundary with shared infrastructure and workloads whose addresses change every deploy. Three patterns carry most of the security weight: isolating tenants at compute, storage, cryptographic, and identity layers; constraining where traffic may originate and where it may go; and treating a running node as a disposable instance of a versioned artifact. Each pattern rests on an assumption that is easy to leave unstated, which is where the failures happen.</p>

Everything below assumes the **shared responsibility model**: the provider secures the infrastructure, and the customer secures configuration, identity, and data on top of it. A control the provider makes available but does not enforce — an unencrypted bucket, a wildcard IAM policy — is the customer's. [Cloud Security Architecture & IAM Perimeters]({{ '/topics/cloud-security-iam-perimeters/' | relative_url }}) covers that split and the organizational guardrails referenced here.

## Multi-tenant isolation, layer by layer

Preventing tenant A from reaching tenant B's data is the defining requirement of multi-tenant SaaS. Four layers each bound a different failure, and each holds only while a specific condition holds.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/cloud-secure-architecture-patterns.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the multi-tenant isolation layers diagram at full size">
    <img src="{{ '/assets/img/cloud-secure-architecture-patterns.svg' | relative_url }}" alt="Four rows — compute, storage, cryptographic, and identity isolation — each giving the mechanism and the condition it depends on: the hypervisor or sandbox not being escapable, every query path running as a tenant-scoped role, the calling role reaching one tenant's key rather than all, and the resource policy actually reading the tenant session tag.">
  </a>
  <p class="diagram-caption">Four isolation layers, each paired with the assumption it silently depends on</p>
</div>

| Isolation layer | Mechanism | What it bounds — and what has to hold |
|---|---|---|
| **Compute** | Hardware-virtualized microVMs (*AWS Firecracker, Kata Containers*) or a userspace application kernel (*gVisor*), or dedicated node pools per tenant. | Bounds how far a container escape reaches. It holds only while the hypervisor or sandbox itself is not escapable — these reduce the blast radius of a kernel bug, they do not eliminate escape. gVisor is not a microVM: it intercepts syscalls in userspace and acts as the guest kernel without hardware virtualization, which is a materially different threat model from Firecracker's. |
| **Storage & database** | Row-level security keyed on a tenant column, per-tenant schemas, or separate database instances. | Bounds what a query returns. Row-level security holds only while *every* query path runs as a tenant-scoped role — a migration job, analytics connection, or admin session that bypasses the policy sees every tenant. Separate instances remove that risk and add operational cost. |
| **Cryptographic** | Per-tenant KMS keys wrapping per-object data keys. | Bounds what stolen ciphertext yields: tenant A's objects cannot be decrypted with tenant B's key. It holds only while the calling role can reach one tenant's key rather than all of them — a single application role with decrypt on every tenant key moves the boundary back into the application. |
| **Identity** | Assume-role sessions carrying a tenant session tag, with resource policies keyed to that tag. | Bounds what the session may call. It holds only while the resource policy actually reads the tag; an untagged or wildcard policy grants the whole bucket regardless. |

The pattern across all four: state the condition, then verify it separately from the mechanism. Kernel-level isolation primitives — namespaces, cgroups, seccomp, and mandatory access control — are covered in [Container & Kubernetes Security]({{ '/topics/container-kubernetes-security/' | relative_url }}).

## Network and service perimeters

Reaching a managed service over its public endpoint is the default and is rarely what you want. Three controls narrow it, and each has a documented limit.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/cloud-service-perimeters.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the cloud service perimeters diagram at full size">
    <img src="{{ '/assets/img/cloud-service-perimeters.svg' | relative_url }}" alt="A path strip showing a workload reaching a provider service through a private interface with the public internet route crossed out, above three bands — private endpoint, service perimeter, and egress allowlist — each stating what the control does and what it explicitly does not do.">
  </a>
  <p class="diagram-caption">Private endpoints, service perimeters, and egress allowlists: what each stops, and what each does not</p>
</div>

- **AWS PrivateLink / Azure Private Link** reach a service over the provider backbone through an interface in your own network — an elastic network interface (ENI) on AWS, a *private endpoint* on Azure — so the request never transits the internet. It does **not** remove the service's own public endpoint, and it does not by itself restrict which accounts or buckets the workload may reach; that needs an endpoint policy.
- **GCP VPC Service Controls** define a perimeter around Google-managed API services and deny access originating outside it even when the IAM credential is valid, which mitigates stolen-credential and misconfigured-IAM exfiltration from outside. Google documents the limits: it covers supported services only, it "is not designed to enforce comprehensive controls on metadata movement," and it does not restrain a caller already inside the perimeter. The AWS analogue is not a single feature but a combination — service control policies and resource control policies in AWS Organizations, plus VPC endpoint policies and organization-ID condition keys.
- **Egress proxy allowlisting** routes outbound traffic through an inspecting proxy (*e.g. Envoy, Squid*) permitting only listed destinations, blocking command-and-control to unlisted hosts. It does **not** stop exfiltration to a destination that is on the list — a permitted SaaS domain or code-hosting service is a working channel.

All three answer *where did this request come from*. None answers *is this caller allowed to read this object*, which stays with IAM and the application.

## Immutable infrastructure and ephemeral workloads

Patching a running server over SSH produces configuration drift, un-audited change, and hosts whose software set matches no reviewed definition. Immutable infrastructure replaces live patching with atomic replacement.

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/immutable-infrastructure-lifecycle.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the immutable infrastructure lifecycle diagram at full size">
    <img src="{{ '/assets/img/immutable-infrastructure-lifecycle.svg' | relative_url }}" alt="A five-stage pipeline — Git commit, hardened image build recording a digest, scan and sign, launch a new node group from that digest, then shift traffic and terminate the old nodes — above a band listing what the pattern removes and a band on mounting writable scratch space with noexec explicitly.">
  </a>
  <p class="diagram-caption">Git commit to node retirement: the artifact is the only thing anyone edits</p>
</div>

1. **No live patching.** Instances and container nodes are never modified in place; a change is a new commit, a new image digest, and a new node group.
2. **Bounded workload lifespan.** Recycling nodes on a schedule caps how long an undetected foothold survives on disk. Any specific interval is a local operational policy, not a standard requirement — pick it from restart cost and how long a foothold is tolerable, not from a number copied out of a blog post.
3. **Read-only root filesystems.** Mount the root read-only (`--read-only`, or `readOnlyRootFilesystem: true`) and grant scratch space explicitly with its options set — `--tmpfs /tmp:rw,noexec,nosuid`. **Neither Docker's `--tmpfs` nor a Kubernetes memory-backed `emptyDir` applies `noexec` by default**, so a read-only root alone still leaves an executable writable path.

What replacement does not fix: a foothold that reappears through the image, the build pipeline, or stored data comes back with every new node. Pipeline integrity is a separate control — see [CI/CD Pipeline Security & Workload Identity]({{ '/topics/cicd-pipeline-security/' | relative_url }}) and [Infrastructure as Code (IaC) & Immutable Security]({{ '/topics/iac-immutable-security/' | relative_url }}), which covers drift detection and policy-as-code enforcement on the definitions themselves.

## Cloud architecture review checklist

The checklist below is a journal working model, not a published audit standard. When auditing a cloud application architecture, evaluate these six criteria:

| Diagnostic area | Evaluation question | Verification &amp; audit evidence |
|---|---|---|
| **Tenant key scoping** | Are tenant objects encrypted under per-tenant keys, and is the application role scoped to one tenant's key per request rather than to all of them? | KMS key policies, role session tagging, envelope encryption code path. |
| **Query path coverage** | Does *every* database connection — including migrations, analytics, and admin — run as a tenant-scoped role, or can one bypass row-level security? | Database role inventory, row-level security policy definitions, connection audit. |
| **Private access plus endpoint policy** | Are managed-service APIs reached through private endpoints, *and* is an endpoint policy restricting which accounts and resources are reachable? | VPC endpoint configuration and attached policies, route tables. |
| **Perimeter coverage gaps** | Which services in the protected projects are unsupported by the service perimeter, and what covers them instead? | Perimeter configuration, supported-service list, compensating IAM policy. |
| **Writable scratch options** | Are containers deployed read-only with tmpfs mounts that explicitly set `noexec`, rather than relying on defaults? | Pod security admission policy, container run arguments, mount options. |
| **No interactive production access** | Is SSH to production instances closed in favor of session-manager style brokered access, with the session recorded? | Security group ingress rules, session manager logs, break-glass procedure. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Each isolation layer bounds a different failure and holds only while a specific condition does — a single application role with decrypt on every tenant key removes cryptographic isolation entirely. Private endpoints, service perimeters, and egress allowlists all answer where a request came from, never whether the caller is authorized. Immutable replacement removes on-disk persistence, not a foothold that returns through the image or pipeline; and a read-only root still needs tmpfs mounted with <code>noexec</code> set explicitly.</p>
</div>

## Primary references

- **[AWS Well-Architected Framework: Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html)** — verified the shared responsibility split, identity perimeter guidance, and private connectivity patterns used here.
- **[Google Cloud VPC Service Controls overview](https://cloud.google.com/vpc-service-controls/docs/overview)** — verified what Google claims the perimeter mitigates, and its stated limits on supported services, metadata movement, and callers inside the perimeter.
- **[Azure Private Link overview](https://learn.microsoft.com/en-us/azure/private-link/private-link-overview)** — verified that Azure's construct is a private endpoint in a virtual network and that instance-level mapping is what provides the leakage protection.
- **[gVisor: What is gVisor?](https://gvisor.dev/docs/)** — verified that gVisor is an application kernel intercepting syscalls in userspace and is explicitly not a virtual machine.
- **[Docker: tmpfs mounts](https://docs.docker.com/engine/storage/tmpfs/)** — verified that `noexec` is not a default tmpfs mount option and must be set explicitly.
