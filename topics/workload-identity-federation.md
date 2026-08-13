---
title: Workload Identity Federation
description: Short-lived workload credentials through OIDC and cloud federation, SPIFFE/SPIRE identities, attestation, claim mapping, rotation, revocation, and migration.
permalink: /topics/workload-identity-federation/
last_verified: 2026-08-13
---

<span class="eyebrow">Authentication & Authorization / Architecture</span>

# Workload Identity Federation

<p class="lede">Workload identity federation lets software obtain target-platform credentials from an already trusted workload identity instead of storing a long-lived target secret. The exchange reduces secret distribution, but it moves trust into the source issuer, workload attestation, claim mapping, federation policy, short-lived credential service, and revocation behavior.</p>

## Identity, attestation, federation, and authorization are separate

- **Workload identity**: A name for a specific executable workload, service, job, or deployment—not merely its host or network address.
- **Attestation**: Evidence used by an issuer to decide that the running workload is entitled to an identity. Evidence might include platform, cluster, namespace, service account, image, hardware, or cloud-instance facts.
- **Federation**: A target trust domain accepts a source assertion and maps it into a target principal or temporary credential.
- **Authorization**: Target policy decides what that mapped principal may do. Successful federation must not imply broad access.

## Common operating models

| Model | Source identity | Target result | Main trust boundary |
|---|---|---|---|
| **CI/CD OIDC federation** | Signed OIDC token issued for a repository, workflow, branch, tag, or environment. | Cloud role/session credentials. | Workflow integrity and exact `iss`/`aud`/`sub` trust conditions. |
| **Cloud workload federation** | External IdP assertion or another cloud/platform identity. | Mapped cloud principal or service-account impersonation credential. | Attribute mapping and conditions must prevent unrelated tenants/workloads from matching. |
| **SPIFFE/SPIRE** | Attested workload receives a SPIFFE ID represented by an X.509-SVID or JWT-SVID. | Workload authentication inside or across configured trust domains; an STS can exchange it for another ecosystem credential. | Node/workload attestation, registration entries, trust bundles, workload API access, and SVID validation. |

SPIFFE defines identity and credential formats; SPIRE is one implementation that performs attestation and issuance. Neither automatically grants application authorization or establishes cloud-federation policy.

## Federation flow and policy

1. A source issuer authenticates or attests the workload and issues a short-lived assertion.
2. The workload presents that assertion to a target Security Token Service or federation endpoint.
3. The target validates issuer, signature/key, audience, time, token type, and source-specific claims.
4. Target policy maps immutable, trustworthy claims to a target principal and applies conditions.
5. The service issues a target credential with bounded audience, permissions, and lifetime.
6. The target API validates the new credential and performs resource-level authorization.

Avoid mutable display names, unqualified repository names, or user-controlled attributes as sole trust selectors. Bind the policy to stable tenant/organization identifiers and the narrowest workload context available. In GitHub Actions-to-AWS federation, validate `aud` and restrict `sub` to the intended repository and branch, tag, environment, or reusable workflow pattern.

## Rotation, revocation, and failure modes

Short lifetime limits how long an already stolen assertion or target credential remains useful; it does not prevent theft or guarantee immediate revocation. Disabling the source workload, removing a trust rule, or rotating an issuer key may not invalidate target credentials already issued.

- Define issuer-key overlap, JWKS/trust-bundle refresh, cache maximums, clock-skew policy, and behavior when metadata is unavailable.
- Remove source identities and target mappings on workload retirement. Confirm that outstanding credentials expire or are explicitly revoked where supported.
- Protect node agents and workload APIs: a compromised host or overly broad socket permission can let one workload request another workload's identity.
- Detect subject/audience mismatch, unusual exchange location, claim-mapping drift, repeated failed exchanges, credential use after workload retirement, and unexpected target roles.
- Test source compromise, target STS outage, issuer-key rollover, trust-bundle rollback, stale mapping, cross-tenant claims, clock drift, and emergency trust removal.

## Migration from static secrets

Inventory each secret's caller, target, permissions, storage, rotation, and fallback first. Create the federated identity and least-privilege policy, run both paths during a bounded migration window, observe successful target authorization, remove the static credential, and verify that it no longer works. Do not retain an undocumented permanent fallback that recreates the original exposure.

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Workload federation replaces distributed target secrets with a chain of source identity, attestation, claim mapping, target policy, and short-lived issuance. Restrict every link to one workload and audience, then test rollover, revocation, host compromise, and removal of the old secret.</p>
</div>

## Primary references

- **[SPIFFE overview and concepts](https://spiffe.io/docs/latest/spiffe-about/overview/)** — verified SPIFFE ID, SVID, trust-domain, bundle, and workload-attestation boundaries.
- **[SPIFFE Workload API](https://github.com/spiffe/spiffe/blob/main/standards/SPIFFE_Workload_API.md)** — verified workload credential delivery and rotation semantics.
- **[Google Cloud Workload Identity Federation](https://docs.cloud.google.com/iam/docs/workload-identity-federation)** — verified external identity mapping and short-lived cloud access model.
- **[AWS IAM OIDC federation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html)** and **[GitHub OIDC for AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)** — verified audience/subject trust conditions for CI/CD federation.
