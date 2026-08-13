---
title: "Authorization Models: RBAC, ABAC, ReBAC & Zero Trust"
description: How systems combine roles, attributes, relationships, policy decision points, and enforcement points to authorize each protected action.
permalink: /topics/authorization-models/
last_verified: 2026-08-13
---

<span class="eyebrow">Authentication & Authorization / Decision Guide</span>

# Authorization Models: RBAC, ABAC, ReBAC & Zero Trust

<p class="lede">Authentication establishes who or what is presenting a credential. Authorization decides whether that caller may perform a particular action on a particular resource in the current context. The decision is only effective when the application enforces it at every relevant path and fails closed when policy inputs or the decision service are unavailable.</p>

## Authorization is a decision-and-enforcement system

RBAC, ABAC, and ReBAC are three common models, not an exhaustive taxonomy. Access-control lists (ACLs), discretionary and mandatory access control (DAC and MAC), capability systems, and other policy-based approaches solve different problems or combine with them.

A practical authorization architecture separates four roles:

| Role | Responsibility | Failure to design for |
|---|---|---|
| **Policy Administration Point (PAP)** | Creates, reviews, versions, and publishes policy. | Unreviewed changes or an unclear source of authority. |
| **Policy Information Point (PIP)** | Supplies subject, resource, relationship, and environmental attributes. | Stale group membership, forged device posture, or ambiguous attribute provenance. |
| **Policy Decision Point (PDP)** | Evaluates the requested subject–action–resource tuple and context against policy. | Inconsistent decisions, unavailable dependencies, or unsafe defaults. |
| **Policy Enforcement Point (PEP)** | Intercepts the operation and enforces the PDP result. | Bypass paths such as bulk APIs, background workers, exports, or direct object references. |

The names come from policy-architecture conventions; products may combine the roles. The security boundary remains: trusted inputs reach a deterministic decision, and every protected path enforces it.

## Comparing three common models on one axis

### RBAC: permissions follow organizational roles

Role-Based Access Control links users to roles and roles to permissions (`User → Role → Permission`). It fits stable job functions such as `BillingApprover` or `SupportAgent`. Context-dependent rules can be layered around RBAC, but encoding every time, location, tenant, or device combination as another role causes role explosion.

### ABAC: policy evaluates attributes at decision time

**[NIST SP 800-162](https://csrc.nist.gov/pubs/sp/800/162/upd2/final)** defines Attribute-Based Access Control around subject, object, requested operation, and environmental conditions. ABAC fits rules such as “an assigned clinician may read this record from a managed device during an active shift.” Its risk is not simply policy syntax: correctness depends on attribute authority, freshness, normalization, and how missing values are handled.

### ReBAC: policy derives access from relationships

Relationship-Based Access Control represents facts such as `user:alice member-of team:blue` and `team:blue editor document:7`. Google's **Zanzibar** paper is an influential large-scale implementation of relationship-based authorization, not the origin of the model. ReBAC fits sharing, nested ownership, and multi-tenant object graphs; it introduces consistency, traversal, caching, and relationship-lifecycle decisions.

| Decision axis | RBAC | ABAC | ReBAC |
|---|---|---|---|
| **Primary input** | Assigned role | Trusted subject, resource, action, and environment attributes | Direct or inherited relationships |
| **Best fit** | Stable job functions and coarse privileges | Contextual or data-sensitive rules | Sharing, ownership, hierarchy, and tenancy |
| **Characteristic failure** | Excessive roles or over-broad role membership | Incorrect/stale attributes or policy interactions | Stale tuples, incorrect inheritance, or graph-consistency defects |
| **Operational evidence** | Role assignment and permission reviews | Policy tests plus attribute lineage/freshness | Tuple-change audit, consistency model, and graph tests |

AWS IAM is better treated as a policy-based hybrid: identity/resource policies can express role-like permissions and attribute-based conditions. OPA is a general policy engine, not synonymous with ABAC, and Zanzibar-inspired systems implement relationship-oriented authorization rather than defining ReBAC itself.

## Zero trust changes the trust assumption, not the policy model

**[NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)** rejects implicit trust based solely on network location and centers policy decisions on a subject and an enterprise resource. It does not prescribe one authorization model or require a literal remote PDP call for every HTTP request. A system can safely cache or embed decisions when the design preserves complete mediation, bounded freshness, revocation behavior, and equivalent policy enforcement.

The journal design rule is stronger and explicit: every protected operation must encounter an effective PEP, and an unhandled or indeterminate decision must deny unless a narrowly documented availability exception has a safer bounded behavior.

## Selection, testing, and lifecycle

1. **Write the decision tuple**: Identify subject, action, resource, tenant, and contextual inputs before choosing a model.
2. **Choose the simplest matching model**: Start with RBAC for stable duties, add ABAC for contextual conditions, and add ReBAC for ownership or sharing graphs. Hybrid policies are normal.
3. **Define input authority and freshness**: Record who can change each role, attribute, or relationship; how changes propagate; and how stale data affects decisions.
4. **Test positive and negative paths**: Cover object-level access, list/search filtering, bulk jobs, exports, administrative paths, cross-tenant identifiers, missing attributes, PDP timeout, and policy rollback.
5. **Observe decisions without leaking sensitive data**: Log policy/version, subject and resource identifiers, decision, reason, and request correlation while minimizing confidential attributes.
6. **Operate the lifecycle**: Review privileged grants, expire temporary access, remove relationships on transfer or termination, invalidate caches on revocation, and retain versioned policy evidence.
7. **Link identity lifecycle**: Provisioning and deprovisioning mechanics are covered in **[Identity Provisioning, Access Lifecycle & PAM]({{ '/topics/identity-provisioning-access-lifecycle-pam/' | relative_url }})**.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>RBAC, ABAC, and ReBAC are common decision models that can be combined. Security comes from trustworthy and fresh inputs, correct policy, complete enforcement on every protected path, safe failure behavior, and a tested grant-to-revocation lifecycle.</p>
</div>

## Primary references

- **[NIST SP 800-162, Guide to Attribute Based Access Control](https://csrc.nist.gov/pubs/sp/800/162/upd2/final)** — verified ABAC terminology and policy inputs.
- **[NIST SP 800-207, Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)** — verified the resource-centric policy model and removal of implicit network-location trust.
- **[Zanzibar: Google's Consistent, Global Authorization System](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/)** — verified the scope of Google's relationship-based authorization implementation.
- **[AWS IAM: RBAC and ABAC](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction_attribute-based-access-control.html)** — verified AWS IAM's role- and attribute-oriented policy capabilities.
