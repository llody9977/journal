---
title: Network Segmentation & Microsegmentation
description: How I isolate network workloads using subnets, Security Groups, NACLs, DMZs, and Zero Trust microsegmentation to restrict lateral movement.
permalink: /topics/network-segmentation-microsegmentation/
last_verified: 2026-08-06
---

<span class="eyebrow">Network Security / Architecture</span>

# Network Segmentation & Microsegmentation

<p class="lede">Flat networks are a major security vulnerability. When every service inside a network boundary can talk to every other service, a single compromised web server or developer laptop grants an attacker access to internal databases, domain controllers, and backup systems. Network segmentation creates boundaries that enforce least privilege at the network layer.</p>

## What is network segmentation: dividing the trust domain

Network segmentation breaks a monolithic network into smaller, isolated sub-networks (**security zones**), enforcing strict access control rules at each boundary to contain breaches and prevent lateral movement.

In traditional network architecture, segmentation relies on **perimeter firewalls** and **VLANs**:

1. **Demilitarized Zone (DMZ)**: A perimeter zone containing public-facing systems (web servers, reverse proxies, load balancers).
2. **Application Tier**: Internal zone containing business logic APIs, accessible only from the DMZ on specific ports.
3. **Database Tier**: Highly restricted internal zone containing persistent databases, accessible only from specific application IPs.

If an attacker compromises a web server in the DMZ, the firewall prevents direct connections from the DMZ to the Database tier, containing the initial intrusion.

## Security Groups vs Network ACLs (NACLs) in Cloud Networks

In cloud environments (AWS VPC, GCP VPC, Azure VNet), segmentation relies on two complementary firewall mechanisms operating at different layers:

| Dimension | Security Groups (SGs) | Network ACLs (NACLs) |
|---|---|---|
| **Enforcement Point** | Instance / Network Interface (ENI) level | Subnet boundary level |
| **State Tracking** | **Stateful** (allowed inbound traffic automatically allows response outbound) | **Stateless** (inbound and outbound rules must be defined explicitly) |
| **Rule Processing** | Evaluates **all rules** before allowing traffic; allow-only rules | Evaluates rules in **numerical order**; supports allow and deny rules |
| **Granularity** | Micro-segmentation per workload / instance group | Coarse boundary per subnet |
| **Default Policy** | Deny all inbound, allow all outbound (by default) | Allow all inbound/outbound (default NACL) |

### Stateless NACL trap: return ephemeral ports
Because NACLs are stateless, allowing inbound traffic on TCP port 443 requires explicitly allowing outbound traffic on **ephemeral ports** (typically TCP 1024–65535) so the response packet can reach the client. Security Groups handle state tracking automatically, eliminating this configuration risk.

## Microsegmentation: Zero Trust inside the perimeter

Traditional VLAN and subnet segmentation is too coarse for modern cloud-native architectures. If fifty microservices share a single application subnet, an attacker compromising Service A can still scan and exploit Service B.

**Microsegmentation** applies identity-aware access controls down to individual workloads, containers, or IP addresses:

- **Identity-based rules**: Traffic policies match workload identity tags (e.g., `app=checkout` can call `app=payment` on TCP 8443) rather than static IP ranges.
- **Service Mesh MTLS**: Frameworks like Envoy and Istio enforce mutual TLS authentication and authorization policy transparently between pods, regardless of underlying network topology.

## Network Segmentation Review Checklist

When designing or reviewing network architecture:

1. **Isolate public entry points**: Are public-facing endpoints strictly confined to a DMZ/public subnet with no direct access to data stores?
2. **Default-deny inbound**: Are Security Groups and firewalls configured with a default-deny policy, explicitly allowing only necessary ports and peer identity tags?
3. **Separate database environments**: Are production databases placed in isolated subnets with no internet gateway route (`igw`) or direct external IP?
4. **Enforce East-West inspection**: Is internal service-to-service traffic ("East-West") authenticated and restricted, or assumed trusted because it is inside the perimeter?
