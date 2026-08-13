---
title: Code Signing, Binary Integrity & Sigstore
description: Comprehensive technical guide to code signing architectures, keyless signing via Sigstore (Fulcio, Rekor, Cosign), OpenID Connect authentication, and the xz-utils release tarball backdoor case study (CVE-2024-3094).
permalink: /topics/code-signing-sigstore/
last_verified: 2026-08-13
---

<span class="eyebrow">Software Supply Chain Security / Binary Assurance</span>

# Code Signing, Binary Integrity & Sigstore

<p class="lede">Traditional code signing requires software developers or build systems to manage long-lived private signing keys. If a private key is leaked, stolen, or improperly stored in a CI/CD secret store, attackers can sign malicious software binaries with trusted vendor identities. Sigstore revolutionizes software signing by introducing keyless code signing: leveraging short-lived X.509 certificates issued via OpenID Connect (Fulcio), immutable Merkle tree transparency logs (Rekor), and OCI container image verification (Cosign).</p>

<div class="diagram-frame">
  <img src="{{ '/assets/img/sigstore-code-signing.svg' | relative_url }}" alt="Sigstore diagram showing Fulcio OIDC short-lived certificates, Rekor immutable transparency log, Cosign binary signing, and xz-utils case study.">
  <p class="diagram-caption">Sigstore Keyless Signing &amp; Verification Architecture: Fulcio Short-Lived OIDC Certs &leftrightarrow; Rekor Immutable Merkle Transparency Log &leftrightarrow; Cosign Verification &amp; xz-utils Case Study</p>
</div>

## The Failure Modes of Traditional Key Management

Traditional code signing relies on long-lived asymmetric key pairs (*e.g. RSA or ECDSA private keys stored in PKCS#12 files or Hardware Security Modules*):

<div class="diagram-frame">
  <img src="{{ '/assets/img/sigstore-code-signing.svg' | relative_url }}" alt="Long-Lived Private Key Leakage Vector diagram.">
  <p class="diagram-caption">Legacy Code Signing Vulnerability: Long-Lived Key Storage &leftrightarrow; Key Exfiltration &leftrightarrow; Unauthorized Malware Signing</p>
</div>

- **Key Loss & Leakage**: Private keys stored in CI secret stores or developer workstations are vulnerable to exfiltration via compromised build scripts or developer laptop compromises.
- **Key Revocation Complexity**: Revoking a compromised key invalidates all legitimate past software releases signed by that key unless complex timestamping authorities (TSAs) were properly configured.

## Sigstore Keyless Signing Architecture

**Sigstore** (a Linux Foundation project) eliminates long-lived signing keys entirely by introducing **Keyless Signing**:

<div class="diagram-frame">
  <img src="{{ '/assets/img/sigstore-code-signing.svg' | relative_url }}" alt="Sigstore Keyless Signing Architecture diagram.">
  <p class="diagram-caption">Sigstore Keyless Architecture: OIDC Auth &leftrightarrow; Fulcio Short-Lived Cert (10-min) &leftrightarrow; Rekor Transparency Log</p>
</div>

### The Three Core Sigstore Components

1. **Fulcio (Short-Lived Certificate Authority)**:
   - Authenticates the developer or build runner using OpenID Connect (OIDC) (*e.g., GitHub Actions identity token, Google OIDC*).
   - Generates an ephemeral asymmetric key pair locally on the runner, submits the public key to Fulcio, and receives a short-lived X.509 certificate valid for **only 10 minutes**.
   - The certificate binds the ephemeral public key to the authenticated OIDC identity string (*e.g. `https://github.com/example/repo/.github/workflows/release.yml@refs/heads/main`*).

2. **Rekor (Immutable Transparency Log)**:
   - An append-only cryptographic Merkle tree transparency log (similar to Certificate Transparency).
   - Records the artifact hash, signature, Fulcio certificate, and timestamp.
   - Returns a **Signed Entry Timestamp (SET)** proving that the signature was generated during the certificate's valid 10-minute window.
   - Makes all signature events publicly auditable, preventing secret key misuse without detection.

3. **Cosign (Container & Blob Signing Tool)**:
   - Command-line tool used to sign and verify OCI container images, SBOMs, SLSA attestations, and arbitrary binary blobs.
   - Stores signatures and attestations directly inside OCI container registries as OCI artifacts.

## Verification Workflow via Cosign

When a Kubernetes cluster or server downloads a container image, Cosign verifies its signature against the public Rekor transparency log:

```bash
# Verify an OCI container image signed keylessly via GitHub Actions
cosign verify \
  --certificate-identity-regexp "https://github.com/example/repo/.*" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  ghcr.io/example/app:v1.0.0
```

1. Extract the short-lived X.509 certificate attached to the container artifact.
2. Verify that the certificate was issued by Fulcio and matches the expected OIDC issuer and repository identity.
3. Query Rekor to verify the Signed Entry Timestamp (SET), proving the signature was recorded while the certificate was valid.

## Case Study: The xz-utils Backdoor (CVE-2024-3094)

In March 2024, a sophisticated supply chain backdoor was discovered in `xz-utils` (versions 5.6.0 and 5.6.1), a core compression utility in Linux distributions:

<div class="diagram-frame">
  <img src="{{ '/assets/img/sigstore-code-signing.svg' | relative_url }}" alt="xz-utils Supply Chain Backdoor Vector diagram.">
  <p class="diagram-caption">xz-utils Backdoor Vector: Maintainer Account Compromise &leftrightarrow; Release Tarball Injection &leftrightarrow; OpenSSH Target Compromise</p>
</div>

- **Attack Vector**: A compromised maintainer (`Jia Tan`) spent years building trust before injecting obfuscated payload files (`bad-3-corrupt_lzma2.xz`) into official **release tarballs** generated during the `m4` build phase. The malicious code was **not present** in plain Git repository source checkouts.
- **Operational Impact**: Under specific build environments, the backdoored `liblzma` library hooked OpenSSH's `sshd` authentication via systemd linkage, enabling unauthorized remote code execution.
- **Supply Chain Lessons**:
  1. **Tarball vs. Git Discrepancy**: Building release tarballs outside of verifiable, hermetic CI pipelines allows maintainers to tamper with output artifacts.
  2. **Signing Intent Limit**: Even if `xz-utils` tarballs were signed with valid PGP keys, the signature only proved that the trusted maintainer created the file—it did not prove the code was safe.

## Essential Code Signing & Sigstore Diagnostic Checklist

When auditing code signing architectures and binary deployment integrity, evaluate these 6 criteria:

| Diagnostic Area | Architectural Evaluation Question | Verification &amp; Audit Evidence |
|---|---|---|
| **Keyless Sigstore Adoption** | Are container images and release binaries signed using keyless Sigstore (Fulcio/Rekor) instead of long-lived keys? | CI/CD build scripts &amp; Cosign sign commands. |
| **Rekor SET Verification** | Does the binary verification policy check Rekor Signed Entry Timestamps (SET) to validate ephemeral cert windows? | Deployment policy files &amp; Kyverno admission controller rules. |
| **OIDC SAN Match Rules** | Does verification enforce strict regex matching on the certificate Subject Alternative Name (SAN) repository URI? | Cosign verify command flags (`--certificate-identity-regexp`). |
| **Tarball Build Hermeticity** | Are release tarballs compiled directly from Git commit tags inside isolated CI runners rather than developer laptops? | CI release workflow YAML definitions &amp; SLSA L3 provenance. |
| **Kubernetes Admission Control** | Is a Kubernetes admission controller (Kyverno / Policy Controller) deployed to block unsigned container images? | Kubernetes admission webhook manifests &amp; block logs. |
| **Reproducible Tarball Audits** | Are release tarball contents diff-inspected against source repository checkouts automatically before publishing? | Release audit script code &amp; CI diff check logs. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Sigstore eliminates long-lived signing keys by pairing short-lived OIDC certificates (Fulcio) with immutable Merkle transparency logs (Rekor). Cosign verifies container binary identity. The xz-utils backdoor proves that signing validates identity, not code intent.</p>
</div>

## Primary references

- **Sigstore Project**: *Keyless Code Signing and Transparency Documentation* — [Sigstore Official](https://www.sigstore.dev/)
- **Cosign Documentation**: *Container Signing and Verification* — [Cosign GitHub](https://github.com/sigstore/cosign)
- **CVE-2024-3094**: *XZ Utils Backdoor Analysis* — [CISA Advisory](https://www.cisa.gov/news-events/alerts/2024/03/29/reported-supply-chain-compromise-affecting-xz-utils-data-compression-library-cve-2024-3094)
