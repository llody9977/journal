---
title: "Authorization Models: RBAC, ABAC, ReBAC & Zero Trust"
description: How an application actually decides what an authenticated caller can do — roles, attributes, relationships, policy engines, and the zero trust principles tying them together.
permalink: /topics/authorization-models/
last_verified: 2026-08-05
---

<span class="eyebrow">Authentication & Authorization / Decision Guide</span>

# Authorization Models: RBAC, ABAC, ReBAC & Zero Trust

<p class="lede">Everything else in this section — <a href="{{ '/topics/saml/' | relative_url }}">SAML</a>, <a href="{{ '/topics/oauth-oidc/' | relative_url }}">OAuth/OIDC</a>, <a href="{{ '/topics/http-auth-schemes/' | relative_url }}#kerberos-active-directorys-actual-default">Kerberos</a> — answers "who is calling." None of it answers "what is this specific, already-authenticated caller allowed to do to this specific resource." That's a separate decision, made by a separate model, and picking the wrong one is a common source of either an unmaintainable permission system or an access-control bug.</p>

## RBAC: permissions attached to roles, roles attached to users

Formalized by NIST researchers in 1992 and standardized as [ANSI/INCITS 359](https://blog.ansi.org/ansi/role-based-access-control-rbac-incits-359/), a role is "a job function within the context of an organization with some associated semantics regarding the authority and responsibility conferred on the user assigned to the role." The model is a chain: users are assigned roles, roles are granted permissions, and a user's effective access is the union of whatever their roles allow.

This works well when job functions map cleanly onto access needs and don't change per-request — "Billing Admin," "Support Agent Tier 1." It breaks down when access actually depends on *context* rather than job title: "only during business hours," "only for records in the caller's own region," "only if the resource isn't flagged confidential" — none of that fits into a static role without either exploding the role count (a role per context combination) or falling back to ad hoc code-level checks bolted on top of the role system.

## ABAC: permissions computed from attributes at request time

[NIST SP 800-162](https://csrc.nist.gov/pubs/sp/800/162/final) defines ABAC as evaluating "authorization to perform a set of operations... by evaluating attributes associated with the subject, object, requested operations, and, in some cases, environment conditions against policy, rules, or relationships." Instead of a static role-to-permission table, a policy engine evaluates a rule against whatever's true right now — the caller's department, the resource's classification, the time of day, the caller's location — and returns allow/deny per request.

This directly answers RBAC's breaking point: "only during business hours" is just another attribute in the policy, not a new role. The cost is that the policy logic itself becomes the thing that has to be correct, tested, and auditable — a wrong ABAC rule silently misjudges every request that matches it, rather than being caught by inspecting a fixed role list.

**[Open Policy Agent (OPA)](https://www.openpolicyagent.org/docs/latest/)** is one implementation of an external policy decision point. An application sends structured input about the caller, resource, action, and context; OPA evaluates policy written in Rego and returns a decision. This can reduce duplicated policy logic, but the application still has to enforce the returned decision correctly. **XACML** is an OASIS standard for a related policy-language and decision architecture.

## ReBAC: permissions derived from relationships in a graph

Relationship-Based Access Control asks a different question entirely: not "what role does this user have" or "what attributes match," but "what's this user's relationship to this specific object, possibly transitively through other objects." Google's own description of **Zanzibar**, the system underpinning this pattern at scale, frames it directly: it "provides a uniform data model and configuration language for expressing a wide range of access control policies from hundreds of client services at Google," scaling "to trillions of access control lists and millions of authorization requests per second" with sub-10ms 95th-percentile latency.

The canonical example is exactly what Google Drive or Docs sharing needs: "can user X view document Y" isn't answerable from X's role or attributes alone — it depends on whether X is an owner, was directly shared the document, or inherited access by being a member of a group that was shared the parent folder. That's a graph traversal (user → group → folder → document), not a lookup table. Open-source systems modeled directly on the Zanzibar paper (OpenFGA, Ory Keto, and similar) exist specifically because this pattern recurs constantly in any product with nested ownership, sharing, or team/organization structures — RBAC and ABAC alone don't model "membership implies access" cleanly.

## Comparing the three

| | RBAC | ABAC | ReBAC |
|---|---|---|---|
| Access is a function of | Assigned role(s) | Attributes evaluated at request time | Relationships in a graph, possibly transitive |
| Good fit | Stable job functions, coarse permission tiers | Context-dependent rules (time, location, classification) | Sharing, nesting, ownership, team/org structures |
| Where it strains | Contextual exceptions force a role explosion | Policy correctness becomes the whole risk surface | Overkill for a flat, small permission model |
| Concrete implementation | Most IAM/RBAC libraries and built-in framework roles | OPA/Rego, XACML | Zanzibar-model systems: OpenFGA, Ory Keto |

Real systems very often layer these rather than pick exactly one: a coarse RBAC tier (admin/member/viewer) for the broad strokes, with ABAC or ReBAC handling the specific exceptions RBAC alone can't express cleanly.

## Zero Trust: the principle these models operate inside

[NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) defines zero trust as a shift that "move[s] defenses from static, network-based perimeters to focus on users, assets, and resources," explicitly rejecting the idea that anything should be trusted "based solely on their physical or network location... or based on asset ownership." Concretely, it requires that "authentication and authorization (both subject and device) are discrete functions performed before a session to an enterprise resource is established" — not once at the network edge, but per resource, every time.

Zero trust isn't a fourth authorization model alongside RBAC/ABAC/ReBAC — it's the operating principle that whichever model an organization uses has to actually be *checked*, on every request, rather than assumed once network access was granted. Being on the corporate VPN, or inside the office network, stops being a substitute for a real authorization decision.

## Common pitfalls

- **Baking context into role names instead of using ABAC** — "Support-Agent-EU-BusinessHours" as a distinct role from "Support-Agent-EU" is the role explosion RBAC is prone to when it's asked to do ABAC's job.
- **Implementing ReBAC-shaped sharing with RBAC** — trying to represent "shared with this folder, which is shared with this team" as a set of static roles usually produces either overly broad access or a maintenance nightmare as nesting grows.
- **Treating network location as an implicit authorization signal** — "it came from inside the VPN" is exactly the assumption NIST SP 800-207 says to stop making.
- **Writing ABAC policy without testing it like code** — a policy engine that's wrong is wrong for every single request that matches the flawed rule, silently, until someone notices.

<div class="callout">
  <span class="callout-title">Reference</span>
  <p><strong><a href="https://webstore.ansi.org/standards/incits/incits3592012r2022">ANSI/INCITS 359</a></strong> defines RBAC. <strong><a href="https://csrc.nist.gov/pubs/sp/800/162/final">NIST SP 800-162</a></strong> defines ABAC. Google's <a href="https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/">Zanzibar paper</a> defines the ReBAC pattern at scale. <strong><a href="https://csrc.nist.gov/pubs/sp/800/207/final">NIST SP 800-207</a></strong> defines Zero Trust Architecture. <a href="https://www.openpolicyagent.org/docs/latest/">Open Policy Agent</a> is the common policy-engine implementation for ABAC-style decisions today.</p>
</div>
