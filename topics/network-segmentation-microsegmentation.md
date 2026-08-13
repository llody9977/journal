---
title: Network Segmentation & Microsegmentation
description: Zone and workload isolation using enforceable policy across on-premises, cloud, Kubernetes, eBPF, and service-mesh boundaries, with validation and recovery.
permalink: /topics/network-segmentation-microsegmentation/
last_verified: 2026-08-13
---

<span class="eyebrow">Network Security / Architecture</span>

# Network Segmentation & Microsegmentation

<p class="lede">Segmentation limits which communications may cross between security zones; microsegmentation applies the same idea at workload granularity. A VLAN, subnet, namespace, or label defines grouping, but isolation exists only when an enforcement point applies policy to every viable path.</p>

## Separate topology from enforcement

- **Security zone:** A group of assets with similar exposure, function, or protection requirements.
- **Segmentation:** Policy between zones, commonly enforced by routers, firewalls, cloud controls, or gateways.
- **Microsegmentation:** Finer policy between workloads, processes, interfaces, pods, or service identities.
- **Containment:** The resulting reduction in reachable targets after a compromise. It is an outcome to test, not an automatic property of having subnets.

A demilitarized zone (DMZ), application tier, and data tier are useful only if the allowed flows are explicit. If a public web workload may call an application service on one port, and only that service may call a database, compromise of the web workload does not directly create a permitted web-to-database path. The attacker can still abuse the allowed application path, steal a more privileged identity, exploit the enforcement plane, or find an alternate route.

<div class="diagram-frame">
  <img src="{{ '/assets/img/segmentation-enforcement-layers.svg' | relative_url }}" alt="Conceptual segmentation model with an internet entry zone, application zone, data zone, and management zone. Firewalls enforce the narrow flows between zones, while workload policy applies inside the application zone; telemetry observes every enforcement point.">
  <p class="diagram-caption">Conceptual model: topology groups assets; boundary and workload policy create isolation; telemetry validates the effective paths</p>
</div>

## Cloud controls are provider-specific

“Security group” and “network ACL” are AWS terms; do not project their semantics onto other clouds.

| Platform control | Scope and state | Rule/default behavior to remember |
|---|---|---|
| **AWS security group** | Stateful control associated with supported resource network interfaces | Allow rules only. A new security group starts with no inbound rules and an outbound allow-all rule; the VPC's **default** security group additionally has an inbound rule from itself. Return traffic for an allowed flow is tracked. |
| **AWS network ACL** | Stateless control associated with one or more subnets | Ordered allow and deny rules. The VPC **default** network ACL has numbered allow-all rules; a new **custom** network ACL begins with only terminal deny rules. Return traffic must be allowed explicitly. |
| **Google Cloud VPC firewall rule/policy** | Distributed, stateful enforcement for VM interfaces, configured at network or policy scope | Supports allow and deny with priorities; implied actions and pre-populated rules depend on the network and policy layer. Return traffic for an allowed connection is tracked, and some platform traffic is always allowed. |
| **Azure network security group (NSG)** | Stateful rules on supported subnet and network-interface boundaries | Ordered inbound and outbound security rules include Azure default rules. NSGs are not an AWS security-group/NACL pair, and Azure Firewall is a separate centralized service. |

For AWS stateless network ACLs, the return rule must cover the ephemeral port selected by the connection initiator. The correct range depends on that client or intermediary: AWS documents examples including Linux `32768–61000`, modern Windows `49152–65535`, and services that use `1024–65535`. Opening `1024–65535` can be an interoperability choice, not a universal operating-system range.

## Apply microsegmentation at more than one layer

| Layer | Stable policy signal | Main failure mode |
|---|---|---|
| Host / cloud interface | Workload group, service account, instance identity, address, protocol, port | Stale membership, unintended inherited rules, alternate interfaces, or direct endpoints. |
| Kubernetes `NetworkPolicy` | Pod and namespace selectors, CIDRs, protocol, port | The network plugin must implement the policy; without a selecting policy, pods are non-isolated for that direction. Ingress and egress allowances are additive, both ends may need to permit a flow, traffic between a pod and its node is always allowed by the API model, and `hostNetwork` behavior is implementation-specific. |
| eBPF-based enforcement | Implementation-specific workload identity and kernel datapath context | “eBPF” identifies a mechanism, not one policy model or guarantee. Coverage depends on the product, attach points, kernel, host-network handling, and observability configuration. |
| Service mesh | Authenticated workload identity and application/TCP attributes | Mutual TLS (mTLS) authenticates and encrypts peers but does not itself decide which peer may call which resource. Authorization policy, traffic capture, enrollment, and strict-mode coverage are separate. |

In Istio, permissive peer authentication accepts both plaintext and mTLS during migration. Move covered workloads to strict mode and apply explicit authorization policy before claiming identity-based isolation. A compromised sidecar-mode workload may send traffic outside its own proxy; destination-side enforcement and lower-layer network policy remain important. Health checks, host networking, excluded ports, egress, and traffic that bypasses injection need explicit treatment.

For Kubernetes, begin with default-deny ingress and egress policies only after allowing required DNS, control-plane, identity, telemetry, and update paths. Creating a `NetworkPolicy` object with a network plugin that does not implement it has no effect.

## Design, test, and operate the zone model

1. Inventory applications, data, administrators, automation, third parties, and infrastructure dependencies.
2. Draw all paths, including IPv6, peering/transit, load balancers, overlays, host networking, backup, monitoring, and emergency administration.
3. Group assets by exposure and impact; write an allow matrix with source, destination, identity, protocol/port, direction, purpose, owner, and expiration.
4. Apply coarse boundary controls and finer workload controls so one control-plane error does not expose every layer.
5. Deploy in observe or staged mode where available, then test allowed and denied flows from the real zones.
6. Alert on unexpected allows, repeated denies, direct-path attempts, policy/controller failure, rules with no owner, and topology drift.
7. Revalidate after scaling, failover, CNI or mesh upgrades, address-family changes, service discovery changes, and incident containment actions.

Segmentation changes can strand production or management traffic. Keep versioned policy, an out-of-band recovery path, staged rollback, and dependency-aware change windows. During incident containment, prefer narrowly blocking the confirmed path while preserving evidence, identity, DNS, time, and response communications required for recovery.

## Avoid false assurance

- A private subnet with no public address can still have reachable paths through load balancers, peering, VPNs, serverless connectors, proxies, or compromised internal workloads.
- “East-west inspection” does not prove authorization; an encrypted or unparsed flow may yield only metadata.
- A successful port scan samples one source, route, protocol, and time. Combine active tests with rule analysis, route analysis, logs, and alternate-path tests.
- Segmentation reduces reachable attack surface; it does not remove application authorization, identity, endpoint, or data-layer controls.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Zones and labels describe intended grouping; enforcement points create isolation. Use provider- and platform-specific semantics, combine boundary and workload policy, test every path and address family, and preserve a controlled rollback path when segmentation blocks a dependency.</p>
</div>

## Primary references

- **[NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)** and **[NIST SP 800-207A](https://csrc.nist.gov/pubs/sp/800/207/a/final)** — verified network-tier and identity-tier policy boundaries, zero-trust decision points, and cloud-native enforcement models.
- **[AWS VPC security groups](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html)** and **[network ACL comparison](https://docs.aws.amazon.com/vpc/latest/userguide/nacl-examples.html)** — verified scope, state, rule processing, return traffic, defaults, and ephemeral-port dependencies.
- **[Google Cloud VPC firewall rules](https://docs.cloud.google.com/firewall/docs/firewalls)** and **[Azure network security groups](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)** — verified provider-specific state, priority, direction, and default-rule semantics.
- **[Kubernetes NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/)** and **[Istio security best practices](https://istio.io/latest/docs/ops/best-practices/security/)** — verified policy prerequisites, additive isolation behavior, mTLS modes, and the boundary between peer authentication and authorization.
