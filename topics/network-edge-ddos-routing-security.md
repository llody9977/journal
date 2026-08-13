---
title: Network Edge, DDoS & Routing Security
description: Internet-edge resilience against DDoS, source spoofing, BGP origin errors and hijacks, with provider coordination, validation, migration, and recovery.
permalink: /topics/network-edge-ddos-routing-security/
last_verified: 2026-08-13
---

<span class="eyebrow">Network Security / Internet Edge</span>

# Network Edge, DDoS & Routing Security

<p class="lede">Internet-edge security must preserve both reachability and routing integrity under failure or attack. Distributed denial of service (DDoS) exhausts capacity or state; Border Gateway Protocol (BGP) mistakes and abuse can misdirect prefixes. Controls must exist upstream of the exhausted or misrouted resource to remain effective.</p>

## Separate the failure planes

| Threat | Resource or decision attacked | Examples | Control boundary |
|---|---|---|---|
| **Volumetric DDoS** | Link or provider capacity | Reflection/amplification, botnet floods | Any scrubbing or filtering must occur before the constrained link. |
| **Protocol/state exhaustion** | Load balancer, firewall, server, or protocol state | Connection floods, fragmented-packet abuse | Stateless edge filters, SYN/state protections, capacity, and upstream mitigation. |
| **Application-layer DDoS** | Expensive application functions and dependencies | Cache-bypass requests, login/search/API abuse | CDN/cache, rate and concurrency controls, application degradation, identity and abuse defenses. |
| **BGP prefix hijack** | Which autonomous system is authorized to originate a prefix | Unauthorized origin announcement | Route Origin Authorization (ROA), Route Origin Validation (ROV), prefix filters, monitoring, and provider response. |
| **Route leak** | Propagation of a route beyond intended relationships | Customer or peer exports routes incorrectly | Import/export policy, relationship-aware filtering, monitoring, and coordination; origin validation alone may not detect a leak with a valid origin. |
| **Source-address spoofing** | Claimed source of an IP packet | Reflection and obscured origin | Source Address Validation (SAV), ingress/egress ACLs, and appropriate unicast Reverse Path Forwarding (uRPF). |

DDoS is an availability problem, not proof of intrusion. A routing anomaly can cause denial, interception opportunities, or performance degradation without changing the destination's own configuration.

## Build layered edge capacity and policy

1. Inventory public prefixes, autonomous system numbers, Domain Name System (DNS), authoritative route objects/ROAs, transit and peering providers, content-delivery or scrubbing services, load balancers, firewalls, applications, and emergency contacts.
2. Minimize exposed services and remove unused UDP services that can be abused as amplifiers. Apply response-rate and application controls appropriate to each protocol.
3. Put caching, anycast, rate limiting, and scrubbing where they can absorb traffic before the protected link or stateful device is saturated.
4. Separate network, protocol, and application thresholds. A fixed requests-per-second number without client identity, cost, burst, and dependency context can block legitimate peaks while missing expensive low-rate abuse.
5. Preauthorize and test upstream actions such as traffic diversion, remotely triggered black hole (RTBH), or Flow Specification (Flowspec). These can restore broader capacity by intentionally dropping selected traffic; scope errors can extend the outage.
6. Maintain degraded application modes that shed optional work, preserve critical operations, protect shared dependencies, and communicate status.

## Validate routes and source addresses

Resource Public Key Infrastructure (RPKI) lets a prefix holder publish a **ROA** naming an authorized origin autonomous system and maximum prefix length. A router performing **ROV** classifies a received route as valid, invalid, or not found relative to available validated ROA payloads. That result informs local routing policy; RPKI does not cryptographically validate the entire AS path or automatically prevent every leak.

- Publish narrowly correct ROAs before enabling invalid-route rejection, and include intended more-specific announcements without making `maxLength` broader than necessary.
- Monitor ROA expiry, repository/validator health, stale data, unexpected origins, more-specifics, withdrawals, path changes, and reachability from diverse external vantage points.
- Keep prefix and autonomous-system filters aligned with customers, peers, registries, and routing intent.
- Apply source validation at customer and network edges. Strict reverse-path checks can drop legitimate asymmetric or multihomed traffic; feasible-path or carefully maintained ACL approaches may fit those topologies better.

## Detect and respond with upstream coordination

Baseline traffic by service, protocol, source distribution, packet size, connection state, cache result, and application cost. During an event, determine whether the first constrained resource is transit, edge device, load balancer, application, dependency, DNS, or routing.

1. Preserve flow, packet samples, routing updates, provider notices, application metrics, and time synchronization evidence.
2. Contact providers through prevalidated channels; state prefixes, destinations, protocols, observed start time, capacity, and requested action.
3. Apply the narrowest safe mitigation and observe collateral impact from independent networks.
4. Protect management, DNS, identity, status, and incident-response paths from the same bottleneck.
5. Withdraw emergency advertisements, blackholes, filters, or rate limits through change control after the event; validate route convergence and service reachability.

Test with provider-approved simulations and tabletop exercises. Load tests establish behavior only up to the authorized volume and scenario; they do not prove resistance to a larger, distributed, protocol-diverse attack or provider outage.

## Plan migration and recovery

- Stage ROV from monitoring to policy enforcement after correcting invalid announcements and confirming fail behavior for validator/repository outages.
- Migrate public services behind a DDoS provider only after testing original-IP exposure, DNS TTLs, certificate and health-check behavior, direct-origin firewall policy, and bypass routes.
- Keep at least one authenticated emergency communication path that does not depend on the affected public service.
- Review capacity and contracts after architecture or traffic changes; purchased mitigation is not useful if onboarding, route authorization, contacts, or diversion cannot operate during the event.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Edge controls must act before the scarce link, state table, application dependency, or routing decision fails. Keep ROAs and filters aligned with routing intent, coordinate upstream mitigation in advance, test collateral impact, and remove emergency controls only after independent reachability checks.</p>
</div>

## Primary references

- **[NIST SP 800-189: Resilient Interdomain Traffic Exchange](https://csrc.nist.gov/pubs/sp/800/189/final)** — verified BGP origin validation, RPKI, prefix filtering, route leaks, source validation, RTBH, Flowspec, and DDoS mitigation boundaries.
- **[RFC 6811: BGP Prefix Origin Validation](https://www.rfc-editor.org/rfc/rfc6811.html)** and its **[RFC 8481 clarifications](https://www.rfc-editor.org/rfc/rfc8481.html)** — verified valid, invalid, and not-found origin-validation states, local policy use, and handling across BGP inputs.
- **[BCP 38 / RFC 2827](https://www.rfc-editor.org/rfc/rfc2827.html)** and **[RFC 8704: Enhanced Feasible-Path uRPF](https://www.rfc-editor.org/rfc/rfc8704.html)** — verified source-address validation goals and multihoming/asymmetric-path constraints.
- **[CISA: Understanding and Responding to DDoS Attacks](https://www.cisa.gov/sites/default/files/publications/understanding-and-responding-to-ddos-attacks_508c.pdf)** — verified DDoS categories, preparation, third-party coordination, and response considerations.
