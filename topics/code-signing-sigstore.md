---
title: Code Signing, Binary Integrity & Sigstore
description: Technical reference for code signing architectures, keyless signing via Sigstore (Fulcio, Rekor, Cosign), RFC 3161 timestamping after Rekor v2, and the xz-utils release tarball backdoor (CVE-2024-3094).
permalink: /topics/code-signing-sigstore/
last_verified: 2026-08-14
---

<span class="eyebrow">Software Supply Chain Security / Binary Assurance</span>

# Code Signing, Binary Integrity & Sigstore

<p class="lede">Traditional code signing requires software developers or build systems to manage long-lived private signing keys. If a private key is leaked, stolen, or improperly stored in a CI/CD secret store, attackers can sign malicious software binaries with trusted vendor identities. Sigstore removes long-lived signing keys from the model entirely by introducing keyless code signing: short-lived X.509 certificates issued against an OpenID Connect identity (Fulcio), an append-only, tamper-evident Merkle transparency log (Rekor), and OCI container image signing and verification (Cosign).</p>

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/sigstore-code-signing.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the Sigstore architecture and xz-utils case study diagram at full size">
    <img src="{{ '/assets/img/sigstore-code-signing.svg' | relative_url }}" alt="Three component panels and a case study. Fulcio authenticates via OpenID Connect and issues an ephemeral certificate valid about ten minutes, with expiry replacing revocation. Rekor is an append-only tamper-evident Merkle log that stores signature, certificate and artifact digest and returns an inclusion proof against a co-signed checkpoint, noting v2 issues no Signed Entry Timestamp so an RFC 3161 timestamp authority is used. Cosign signs images and blobs, stores signatures as OCI artifacts, and pins an exact or anchored identity. The case study panel records that the xz payload fixtures were in Git while only the modified build-to-host.m4 shipped in the tarball, and that the maintainer account was earned rather than stolen.">
  </a>
  <p class="diagram-caption">Sigstore keyless signing architecture: Fulcio, Rekor, Cosign, and the xz-utils case study</p>
</div>

## The failure modes of traditional key management

Traditional code signing relies on long-lived asymmetric key pairs (*e.g. RSA or ECDSA private keys stored in PKCS#12 files or hardware security modules*):

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/code-signing-key-exposure.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the long-lived signing key exposure diagram at full size">
    <img src="{{ '/assets/img/code-signing-key-exposure.svg' | relative_url }}" alt="A long-lived RSA or ECDSA private signing key, valid for months or years, branches to three exposure surfaces: a CI secret store reachable by any job that runs, a developer workstation one endpoint compromise away, and a build script or log pipeline where masking can fail. All three converge on one outcome: an attacker signs malicious binaries under the vendor's own identity and clients accept them because the key is the only thing checked. A footer explains that revocation calls every past signature into question unless a timestamping authority recorded when each signature was made.">
  </a>
  <p class="diagram-caption">One long-lived key, three places it can leave from, and one indistinguishable outcome</p>
</div>

- **Key loss & leakage**: private keys stored in CI secret stores or on developer workstations are vulnerable to exfiltration via compromised build scripts or endpoint compromise. The key's value to an attacker never expires on its own.
- **No record of use**: nothing distinguishes an attacker's signature from a legitimate one, because the only thing verified is possession of the key — not who used it, or when.
- **Revocation complexity**: revoking a compromised key calls every signature it ever made into question, including every legitimate release, unless a timestamping authority independently recorded when each signature was produced so verifiers can honor the ones made before the compromise. Teams that lack that evidence delay revoking, which extends the exposure window rather than closing it.

## Sigstore keyless signing architecture

**Sigstore** (an OpenSSF project under the Linux Foundation) eliminates long-lived signing keys by introducing **keyless signing**:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/sigstore-keyless-flow.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the Sigstore keyless signing flow diagram at full size">
    <img src="{{ '/assets/img/sigstore-keyless-flow.svg' | relative_url }}" alt="Six steps. The runner authenticates and receives an OIDC identity token naming the repository, workflow file, and ref. It generates an ephemeral key pair in memory. Fulcio validates the token and issues a certificate valid about ten minutes binding the public key to the identity in the SAN. The runner signs the artifact digest and Rekor returns an inclusion proof against a co-signed checkpoint. The client obtains an RFC 3161 timestamp from a timestamp authority because Rekor v2 no longer returns Signed Entry Timestamps. The result is a bundle carrying certificate, signature, inclusion proof, and timestamp, with the private key discarded.">
  </a>
  <p class="diagram-caption">Keyless signing end to end: the private key exists only for the length of one build step</p>
</div>

### The three core Sigstore components

1. **Fulcio (short-lived certificate authority)**:
   - Authenticates the developer or build runner using OpenID Connect (OIDC) (*e.g. a GitHub Actions identity token, or a Google OIDC identity*).
   - The client generates an ephemeral asymmetric key pair locally, submits the public key to Fulcio, and receives a short-lived X.509 certificate valid for roughly **10 minutes**.
   - The certificate binds the ephemeral public key to the authenticated OIDC identity string in its subject alternative name (*e.g. `https://github.com/example/repo/.github/workflows/release.yml@refs/heads/main`*).
   - Because the certificate expires in minutes, expiry does the work that revocation lists and OCSP do elsewhere.

2. **Rekor (transparency log)**:
   - An append-only, tamper-evident Merkle tree transparency log, structurally similar to **[Certificate Transparency]({{ '/topics/certificate-transparency/' | relative_url }})**.
   - Records the artifact digest, signature, and Fulcio certificate, and returns an **inclusion proof against a co-signed checkpoint** on upload.
   - **Rekor v2 (generally available since October 2025) no longer returns Signed Entry Timestamps or integrated time.** Clients obtain an **RFC 3161 signed timestamp** from a trusted timestamp authority — Sigstore operates one at `timestamp.sigstore.dev` — and carry it in the bundle. Together the inclusion proof and the timestamp establish that the signature existed while the short-lived certificate was still valid.
   - Makes signature events publicly discoverable, so misuse of a signing identity is *detectable by anyone monitoring the log*. As with Certificate Transparency, that detection depends on monitors and auditors comparing checkpoints; the log structure alone does not prevent an operator from serving a split view.

3. **Cosign (container & blob signing tool)**:
   - Command-line tool used to sign and verify OCI container images, SBOMs, SLSA attestations, and arbitrary binary blobs.
   - Stores signatures and attestations directly inside OCI container registries as OCI artifacts.

## Verification workflow via Cosign

When a Kubernetes cluster or server pulls a container image, Cosign verifies its signature and the identity that produced it:

```bash
# Verify an OCI container image signed keylessly via GitHub Actions.
# Pin the digest, not the tag: a tag resolves at verification time and can move.
cosign verify \
  --certificate-identity "https://github.com/example/repo/.github/workflows/release.yml@refs/heads/main" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  ghcr.io/example/app@sha256:3f79bb7b435b05321651daefd374cdc681dc06faa65e374e38337b88ca046dea
```

1. Extract the short-lived X.509 certificate attached to the container artifact.
2. Verify that the certificate chains to Fulcio and that its OIDC issuer and SAN identity match what the policy expects.
3. Verify the Rekor inclusion proof against a co-signed checkpoint, and verify the RFC 3161 timestamp, establishing that the signature was produced while the certificate was valid.

**Prefer `--certificate-identity` over `--certificate-identity-regexp`.** Cosign documents the plain flag as the strict matcher; the regexp variant is the non-strict alternative and its pattern is applied **unanchored**, so it matches any identity merely *containing* the pattern. If a regexp is genuinely needed, anchor it:

```bash
--certificate-identity-regexp "^https://github\.com/example/repo/\.github/workflows/release\.yml@refs/heads/.+$"
```

**What this proves and what it does not.** These steps establish which identity produced the artifact and that the signature was logged while the certificate was valid. They prove nothing about the code's behavior — which is exactly the boundary the next section illustrates.

## Case study: the xz-utils backdoor (CVE-2024-3094)

In March 2024, a supply chain backdoor was discovered in `xz-utils` versions 5.6.0 and 5.6.1, a compression library present across Linux distributions:

<div class="diagram-frame diagram-frame-openable">
  <a class="diagram-open-link" href="{{ '/assets/img/xz-utils-tarball-divergence.svg' | relative_url }}" target="_blank" rel="noopener" aria-label="Open the xz-utils Git versus release tarball divergence diagram at full size">
    <img src="{{ '/assets/img/xz-utils-tarball-divergence.svg' | relative_url }}" alt="Two panels compare the public Git tree with the release tarball. Both contained the payload test fixtures bad-3-corrupt_lzma2.xz and good-large_compressed.lzma, committed openly as corrupt-input test data. The Git tree held a benign build-to-host.m4; the tarball held a modified one that existed nowhere in Git. A four-step chain follows: configure runs the modified macro, a sed pipeline extracts the staged script, liblzma is patched during compilation on glibc x86-64 RPM and DEB builds only, and distribution-patched sshd reaches it because it links libsystemd. A footer notes the maintainer account was earned over roughly two years rather than stolen.">
  </a>
  <p class="diagram-caption">The divergence was one file: the payload sat in Git openly, and only the macro that activated it shipped in the tarball</p>
</div>

- **Attack vector**: an account operating as `Jia Tan` contributed to xz for roughly two to two-and-a-half years, obtained commit access, then release-manager rights, and used that standing to publish release tarballs that differed from the public Git tree. The obfuscated payload files (`tests/files/bad-3-corrupt_lzma2.xz`, `tests/files/good-large_compressed.lzma`) **were committed openly in Git**, disguised as corrupt-input test fixtures. What appeared *only* in the release tarball was a modified `m4/build-to-host.m4` whose `sed` pipeline extracted and executed the staged payload during `./configure`. This was earned maintainer trust, not a stolen account — no credential control would have prevented it.
- **Operational impact**: the patched `liblzma` was produced only under narrow conditions — glibc, x86-64, and an RPM or DEB packaging build. Distribution-patched `sshd` reaches it because those builds link `libsystemd`, which pulls in `liblzma`; upstream OpenSSH does not link `liblzma` at all. The backdoor hooked the authentication path, enabling remote code execution for an actor holding the corresponding key.
- **Supply chain lessons**:
  1. **Tarball vs. Git divergence**: building release artifacts outside a verifiable pipeline lets a maintainer ship something the source tree never contained. A build that produced the tarball from the tagged commit, publishing **[SLSA provenance]({{ '/topics/slsa-provenance-attestation/' | relative_url }})** saying so, would have made the single divergent file visible.
  2. **Signing intent limit**: had those tarballs been signed with valid PGP keys, the signature would have proved only that the trusted maintainer created the file. It would not have shown that the code was safe.

## Code signing & Sigstore diagnostic checklist

The checklist below is a journal working model, not a published audit standard. When auditing code signing architectures and binary deployment integrity, evaluate these six criteria:

| Diagnostic area | Architectural evaluation question | Verification &amp; audit evidence |
|---|---|---|
| **Keyless Sigstore adoption** | Are container images and release binaries signed using keyless Sigstore rather than long-lived keys? | CI/CD build scripts &amp; Cosign sign commands. |
| **Timestamp verification** | Does the verification policy check the Rekor inclusion proof **and** an RFC 3161 timestamp, rather than a Signed Entry Timestamp that Rekor v2 no longer issues? | Deployment policy files &amp; Kyverno admission controller rules. |
| **Identity match strictness** | Does verification pin an exact certificate identity, or an anchored regexp, rather than an unanchored pattern? | Cosign verify flags (`--certificate-identity`, or an anchored `--certificate-identity-regexp`). |
| **Digest-pinned verification** | Are images verified and admitted by digest rather than by a mutable tag? | Deployment manifests and admission policy referencing `@sha256:`. |
| **Kubernetes admission control** | Is an admission controller (Kyverno / Policy Controller) deployed to block unsigned container images? | Kubernetes admission webhook manifests &amp; block logs. |
| **Release artifact reproducibility** | Are release tarballs produced from the tagged commit inside CI, and diffed against the source tree before publishing? | Release workflow definitions, provenance attestations &amp; CI diff check logs. |

<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Sigstore replaces long-lived signing keys with a 10-minute OIDC-bound certificate (Fulcio) plus an append-only, tamper-evident log (Rekor). Since Rekor v2 there is no Signed Entry Timestamp — verification uses an inclusion proof plus an RFC 3161 timestamp. Pin an exact identity and a digest, not a regexp and a tag. The xz-utils backdoor shows signing proves who produced an artifact, not that its contents are safe.</p>
</div>

## Primary references

- **[Sigstore project](https://www.sigstore.dev/)** — verified the keyless signing architecture and the roles of Fulcio, Rekor, and Cosign.
- **[Rekor v2 client guidance](https://github.com/sigstore/rekor-tiles/blob/main/CLIENTS.md)** — verified that Rekor v2 no longer returns Signed Entry Timestamps or integrated time, and that clients must use an RFC 3161 timestamp authority.
- **[Cosign](https://github.com/sigstore/cosign)** — verified the verification flags, and that the identity regexp is applied unanchored while `--certificate-identity` is the strict matcher.
- **[CISA advisory on CVE-2024-3094](https://www.cisa.gov/news-events/alerts/2024/03/29/reported-supply-chain-compromise-affecting-xz-utils-data-compression-library-cve-2024-3094)** — verified the affected versions and the nature of the compromise.
