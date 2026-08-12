---
title: "Authorization Models: RBAC, ABAC, ReBAC & Zero Trust"
description: How an application actually decides what an authenticated caller can do — roles, attributes, relationships, policy engines, and the zero trust principles tying them together.
permalink: /topics/authorization-models/
last_verified: 2026-08-05
---

<span class="eyebrow">Authentication & Authorization / Decision Guide</span>

# Authorization Models: RBAC, ABAC, ReBAC & Zero Trust

<p class="lede">Authentication mechanisms (SAML, OAuth/OIDC, Kerberos) answer <em>who is calling</em>. None of them answer <em>what this specific, authenticated caller is allowed to do to this specific resource</em>. That is an authorization decision. Selecting the wrong authorization model leads directly to unmaintainable permission tables or broken access control vulnerabilities (BOLA/IDOR).</p>

## The authorization boundary: authentication vs authorization

Authentication and authorization establish two distinct security boundaries:

- **Authentication**: Verifies caller identity and issues a session or token.
- **Authorization**: Evaluates caller identity against permissions, attributes, and relationships to decide `allow` or `deny` on a specific resource action.

Three primary authorization paradigms exist: **Role-Based Access Control (RBAC)**, **Attribute-Based Access Control (ABAC)**, and **Relationship-Based Access Control (ReBAC)**.

## Mechanisms and trade-offs: comparing the three models

### 1. RBAC: permissions assigned to static roles

Standardized as **[ANSI/INCITS 359](https://blog.ansi.org/ansi/role-based-access-control-rbac-incits-359/)**, RBAC links users to roles, and roles to permissions. A user's access is the union of their assigned roles (`User → Role → Permission`).

- **Best Fit**: Stable organizational job functions (e.g., `Billing Admin`, `Support Agent Tier 1`).
- **Limitation**: Fails when access depends on dynamic request context (time of day, region, IP). Attempting to model context in RBAC causes **role explosion** (`Support-Agent-EU-BusinessHours`).

### 2. ABAC: permissions computed from request-time attributes

Defined in **[NIST SP 800-162](https://csrc.nist.gov/pubs/sp/800/162/final)**, ABAC evaluates rules against attributes of the subject, resource, action, and environment at runtime (`Policy(Subject, Resource, Action, Environment) → Allow/Deny`).

- **Best Fit**: Solves RBAC's context limitation. Environmental conditions ("only during business hours") are evaluated dynamically as policy attributes.
- **Limitation**: Policy correctness becomes the primary risk surface. A flawed ABAC policy (e.g., written in **[Open Policy Agent (OPA)](https://www.openpolicyagent.org/)** Rego) applies globally and misjudges all matching requests.

### 3. ReBAC: permissions derived from graph relationships

Pioneered at scale by Google's **Zanzibar** paper, ReBAC evaluates access based on explicit or inherited relationships in a tuple graph (`User → Group → Folder → Resource`).

- **Best Fit**: Essential for nested ownership and sharing (e.g., Google Drive: "Can User A edit Document B?"). Access is derived from graph traversal rather than flat roles.
- **Limitation**: Introduces graph traversal latency overhead (mitigated by systems like OpenFGA or Ory Keto) and is unnecessary for flat permission structures.

### Comparison matrix

| Dimension | RBAC | ABAC | ReBAC |
|---|---|---|---|
| **Access Decision Basis** | Assigned static roles | Request-time attributes & environment | Graph relationships & inheritance |
| **Best Fit** | Coarse organizational job functions | Contextual security rules (time, location, IP) | Shared objects, nested folders, team hierarchies |
| **Primary Failure Mode** | Role explosion under complex rules | Policy misconfigurations apply globally | Graph query latency & operational complexity |
| **Common Implementation** | Framework IAM (AWS IAM, Spring Security) | OPA (Rego), XACML | Zanzibar engines (OpenFGA, Ory Keto) |

## Zero Trust: the underlying operating principle

**[NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)** defines Zero Trust Architecture as removing implicit trust based on network location. Zero trust is not a fourth authorization model; it is the requirement that whichever authorization model is used (RBAC, ABAC, or ReBAC) must be explicitly evaluated **per request, per resource**, regardless of whether traffic originates inside a VPN or internal network segment.

## Authorization Model Selection Matrix

When designing access control for a system or service:

1. **RBAC**: Apply for coarse-grained administrative roles and baseline system privileges.
2. **ABAC**: Layer when access depends on dynamic context (time, location, device health, risk score).
3. **ReBAC**: Choose when building multi-tenant SaaS, document sharing, or nested team ownership structures.
4. **Zero Trust Integration**: Enforce authorization decisions at the resource gateway on every request.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>RBAC grants access by static role, ABAC evaluates dynamic attributes at request time, and ReBAC models access as graph relationships — pick the model that matches how the system's access decisions actually vary. Zero trust is an enforcement strategy layered on top of whichever model is chosen, not a fourth model, and every unhandled permission query must fail closed to deny.</p>
</div>

## Primary references

- **NIST SP 800-162**: *Guide to Attribute Based Access Control (ABAC) Definition and Consideration* — [NIST CSRC SP 800-162](https://csrc.nist.gov/pubs/sp/800/162/final)
- **Google Zanzibar Paper**: *Zanzibar: Google’s Consistent, Global Authorization System* — [Google Research Zanzibar](https://research.google/pubs/pub48190/)
