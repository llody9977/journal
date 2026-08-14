---
title: Container & Kubernetes Security
description: Comprehensive technical guide to container and Kubernetes security, Linux kernel primitives (Namespaces, cgroups, seccomp, AppArmor), Pod Security Standards (PSS), K8s RBAC, Network Policies, and Service Mesh mTLS.
permalink: /topics/container-kubernetes-security/
last_verified: 2026-08-13
---

<span class="eyebrow">Cloud-Native Security / Container Security</span>

# Container & Kubernetes Security

<p class="lede">Containers are not lightweight virtual machines; they are isolated Linux process groups sharing the host kernel. Securing containerized applications requires understanding underlying Linux kernel isolation primitives—Namespaces, Control Groups (cgroups), and system call filters (seccomp). In Kubernetes clusters, workload security requires layering Pod Security Standards (PSS), least-privilege K8s RBAC, declarative Network Policies, and Service Mesh mutual TLS (mTLS).</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/container-kubernetes-security.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the container and Kubernetes security architecture diagram at full size">
    <img src="{{ '/assets/img/container-kubernetes-security.svg' | relative_url }}" alt="Container &amp; Kubernetes Security diagram showing Linux Namespaces, cgroups, Pod Security Standards (PSS), K8s RBAC, and Network Policies.">
  </a>
  <p class="diagram-caption">Container &amp; Kubernetes Security Architecture: Linux Kernel Primitives &leftrightarrow; K8s Pod Security Admission &leftrightarrow; Service Mesh mTLS &amp; Network Policies</p>
</div>

## Linux Kernel Isolation Primitives

Containers rely on three primary Linux kernel features to establish process boundaries:

| Linux Kernel Primitive | Core Isolation Function | Security Hardening Mechanism |
|---|---|---|
| **Namespaces** | Isolates system resources per container (PID, net, mnt, ipc, uts, user). | Prevents a container process from seeing or signaling processes running in other containers. |
| **Control Groups (cgroups v2)** | Restricts and monitors resource consumption (CPU, memory, disk I/O, PIDs). | Prevents container denial-of-service (Fork bombs, memory exhaustion crashes). |
| **Seccomp (Secure Computing)** | Filters system calls available to a container process (*e.g. blocking `reboot`, `kexec_load`*). | Restricts kernel attack surface by blocking dangerous or unnecessary Linux syscalls. |
| **AppArmor / SELinux** | Enforces Mandatory Access Control (MAC) policies on file paths and capabilities. | Restricts container file access even if process acquires root privileges inside the container. |

## Kubernetes Pod Security Standards (PSS)

Kubernetes enforces workload isolation through **Pod Security Standards (PSS)**, built into the **Pod Security Admission** controller:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/pod-security-admission.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the Pod Security Admission evaluation diagram at full size">
    <img src="{{ '/assets/img/pod-security-admission.svg' | relative_url }}" alt="A left-to-right sequence. A pod manifest is submitted to the API server, which calls the built-in Pod Security Admission controller. The controller reads the pod-security.kubernetes.io labels on the destination namespace, which pair one of three modes — enforce, audit, and warn — with one of three levels — privileged, baseline, and restricted. The manifest is checked against the level, and the mode decides the consequence: enforce rejects the pod, audit records an annotation in the audit log, and warn returns a message to the client while still admitting. A footer notes that the three modes can be set simultaneously with different levels, that the labels are namespace-scoped so an unlabelled namespace is unrestricted, and that admission is a create-time check rather than a runtime control.">
  </a>
  <p class="diagram-caption">The level says what is checked; the mode says what happens when the check fails</p>
</div>

1. **Privileged Profile**: Unrestricted access. Disables security controls; intended only for system-level infrastructure pods (*e.g., CNI plugins, storage drivers*).
2. **Baseline Profile**: Minimum security policy for standard workloads. Prevents known privilege escalations (*blocks host namespaces, host ports, and capabilities*).
3. **Restricted Profile**: Heavily hardened security policy. Requires pods to run as non-root (`runAsNonRoot: true`), drop all capabilities (`drop: ["ALL"]`), enforce read-only root filesystems, and restrict volume types.

## Kubernetes Network Policies & Microsegmentation

By default, Kubernetes enforces flat network connectivity: any pod in a cluster can communicate with any other pod across namespaces.

**Kubernetes Network Policies** enforce declarative L3/L4 firewall microsegmentation:

```yaml
# Example Default-Deny Ingress & Egress Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

- **Default-Deny Ingress/Egress**: Block all pod-to-pod network traffic by default within a namespace.
- **Explicit Allow Rules**: Allow network traffic only between explicit label selectors (*e.g. allow Frontend pods to connect to Backend pods on port `8080`*).

## Service Mesh mTLS & SPIFFE Identity

For application-layer (L7) encryption and authentication, a **Service Mesh** (*Istio, Linkerd*) injects sidecar proxy containers alongside application pods:

- **Mutual TLS (mTLS)**: Automatically encrypts all pod-to-pod traffic in transit using short-lived X.509 certificates.
- **SPIFFE / SPIRE Identity**: Assigns cryptographically verifiable identities (`spiffe://cluster.local/ns/prod/sa/backend`) to workloads, enabling strong L7 authorization policies.

## Essential Container Security Diagnostic Checklist

When auditing a Kubernetes cluster and container pipeline, evaluate these 6 criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Non-Root Execution** | Are container workloads configured to run as non-root users (`runAsNonRoot: true`)? | K8s Pod Security Admission audit logs. |
| **Restricted PSS Profile** | Is the `Restricted` Pod Security Standard enforced across all application namespaces? | Namespace labels (`pod-security.kubernetes.io/enforce: restricted`). |
| **Default-Deny Network Policies** | Are default-deny ingress and egress NetworkPolicies deployed in all namespaces? | K8s NetworkPolicy manifests (`kubectl get netpol -A`). |
| **Minimal Base Images** | Are container images built using Distroless or Alpine base images without unneeded tools? | Container build manifests (`Dockerfile`) &amp; image scans. |
| **K8s RBAC Least Privilege** | Are ClusterRoleBindings restricted to prevent ServiceAccounts from managing cluster secrets? | K8s RBAC audit tool reports (e.g. `krane`, `r軌`). |
| **Seccomp Profile Binding** | Are default seccomp profiles (`RuntimeDefault`) bound to all running pod security contexts? | Pod spec securityContext JSON (`seccompProfile: {type: RuntimeDefault}`). |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Containers share the host Linux kernel. Harden workloads using kernel isolation (Namespaces, cgroups, seccomp), enforce Kubernetes Restricted Pod Security Standards, deploy default-deny Network Policies, and encrypt pod traffic using Service Mesh mTLS.</p>
</div>

## Primary references

- **Kubernetes Documentation**: *Pod Security Standards* — [Kubernetes Docs](https://kubernetes.io/docs/concepts/security/pod-security-standards/)
- **CIS Kubernetes Benchmark**: *CIS Benchmark v1.8.0* — [CISecurity](https://www.cisecurity.org/benchmark/kubernetes)
