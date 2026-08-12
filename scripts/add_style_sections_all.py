import os

topics_dir = "/Users/llody/Documents/journal/topics"

sections_data = {
    "ai-llm-security.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Indirect prompt injection lets untrusted content from retrieved documents or web pages manipulate an LLM's behavior; pattern-based filtering alone doesn't fully mitigate it per OWASP LLM01:2025, so pair it with least-privilege tool access and human-in-the-loop approval. Never let an LLM execute a destructive side effect — a database delete, a wire transfer — without explicit human confirmation.</p>
</div>

## Primary references

- **OWASP Top 10 for Large Language Model Applications**: *OWASP LLM Security Project* — [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- **NIST AI Risk Management Framework (AI RMF 1.0)**: *Artificial Intelligence Risk Management Framework* — [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework)""",

    "api-security.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Machine-to-machine API authentication must match the caller and threat model: bearer credentials are replayable, while request signing, mTLS-bound tokens, and DPoP-bound tokens add sender proof under their stated verification preconditions. For JWT access tokens, validate the signature and algorithm plus every claim required by the applicable token profile and resource server, including issuer, audience, and time bounds. DPoP still permits limited same-endpoint proof replay unless single-use or nonce checks are enforced.</p>
</div>

## Primary references

- **OWASP API Security Top 10:2023**: *Top 10 API Security Risks* — [OWASP API Security Top 10](https://owasp.org/API-Security/)
- **RFC 7519**: *JSON Web Token (JWT)* — [IETF RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)
- **RFC 9449**: *OAuth 2.0 Demonstrating Proof of Possession (DPoP)*, verified §11.1's required proof-freshness (`iat`) acceptance window versus its optional nonce and `jti` replay-check mechanisms — [IETF RFC 9449](https://datatracker.ietf.org/doc/rfc9449/)""",

    "authorization-models.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>RBAC grants access by static role, ABAC evaluates dynamic attributes at request time, and ReBAC models access as graph relationships — pick the model that matches how the system's access decisions actually vary. Zero trust is an enforcement strategy layered on top of whichever model is chosen, not a fourth model, and every unhandled permission query must fail closed to deny.</p>
</div>

## Primary references

- **NIST SP 800-162**: *Guide to Attribute Based Access Control (ABAC) Definition and Consideration* — [NIST CSRC SP 800-162](https://csrc.nist.gov/pubs/sp/800/162/final)
- **Google Zanzibar Paper**: *Zanzibar: Google’s Consistent, Global Authorization System* — [Google Research Zanzibar](https://research.google/pubs/pub48190/)""",

    "cybersecurity-standards.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>ISO 27001 defines a management system, NIST SP 800-53 provides a technical control catalog, and hardening baselines like CIS Benchmarks give prescriptive per-system configuration — these operate at different altitudes and aren't interchangeable substitutes. Mapping controls to a unified framework and automating evidence collection is what makes satisfying multiple overlapping regimes tractable.</p>
</div>

## Primary references

- **NIST SP 800-53 Rev. 5**: *Security Controls for Information Systems* — [NIST CSRC SP 800-53](https://csrc.nist.gov/pubs/sp/800/53/r5/final)
- **ISO/IEC 27001:2022**: *Information security management systems requirements* — [ISO 27001 Standard](https://www.iso.org/standard/27001)""",

    "dns-security.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>When a validating resolver can build a chain from a configured trust anchor, DNSSEC authenticates signed RRsets and rejects forged data; unsigned zones and non-validating paths do not gain that protection. DNSSEC does not encrypt queries—DoH and DoT protect client-to-resolver transport confidentiality.</p>
</div>

## Primary references

- **RFC 4033**: *DNS Security Introduction and Requirements (DNSSEC)* — [IETF RFC 4033](https://www.rfc-editor.org/rfc/rfc4033)
- **RFC 4035**: *Protocol Modifications for DNS Security Extensions* — verified trust-anchor, validation, insecure-zone, and bogus-response behavior — [IETF RFC 4035](https://www.rfc-editor.org/rfc/rfc4035)
- **RFC 8484**: *DNS Queries over HTTPS (DoH)* — [IETF RFC 8484](https://www.rfc-editor.org/rfc/rfc8484)""",

    "grc-framework-strategy.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>One practical startup sequence is technical hygiene → shared risk vocabulary → product security → customer attestation → certification, adjusted to the organization's risks, obligations, and resources; it is not a universal maturity model. Governance roles and risk appetite guide those choices, while automated guardrails reduce policy drift without proving compliance.</p>
</div>

## Primary references

- **IIA Three Lines Model**: *The IIA's Three Lines Model for Governance* — [IIA Three Lines](https://www.theiia.org/en/content/position-papers/2020/the-iias-three-lines-model-an-update-of-the-three-lines-of-defense/)
- **NIST SP 800-39**: *Managing Information Security Risk: Organization, Mission, and Information System View* — [NIST CSRC SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final)""",

    "hsm-kms.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>An HSM protects cryptographic operations inside a module boundary; a KMS governs keys and metadata across a wider operational lifecycle. Verify the exact module certificate and deployment context, treat non-extractability as a bounded API property, and preserve every dependency needed to unwrap an encrypted DEK.</p>
</div>

## Primary references

- **[NIST FIPS 140-3: Security Requirements for Cryptographic Modules](https://csrc.nist.gov/pubs/fips/140-3/final)** — verified the validation scope, four-level model, and eleven requirement areas.
- **[NIST CMVP FAQ](https://csrc.nist.gov/Projects/cryptographic-module-validation-program/FAQs)** — verified certificate, version, operational-environment, approved-mode, and embedded-module caveats.
- **[NIST SP 800-57 Part 1 Rev. 5: Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)** — verified that key management extends beyond storage to lifecycle protection and operational controls.
- **[NIST SP 800-130: A Framework for Designing Cryptographic Key Management Systems](https://csrc.nist.gov/pubs/sp/800/130/final)** — verified the KMS boundary of policies, procedures, components, devices, keys, and metadata.
- **[NIST SP 800-133 Rev. 2: Recommendation for Cryptographic Key Generation](https://csrc.nist.gov/pubs/sp/800/133/r2/final)** — verified key-generation and random-bit-generator requirements in the NIST federal profile.
- **[NIST SP 800-38F: Recommendation for Block Cipher Modes of Operation—Methods for Key Wrapping](https://csrc.nist.gov/pubs/sp/800/38/f/final)** — verified approved AES key-wrapping methods.
- **[OASIS PKCS #11 v3.1](https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.1/os/pkcs11-spec-v3.1-os.html)** — verified the exact meanings of sensitive and extractability attributes.
- **[OASIS KMIP v2.1](https://docs.oasis-open.org/kmip/kmip-spec/v2.1/kmip-spec-v2.1.html)** — verified the broader managed-object lifecycle and metadata model used for interoperable key management.""",

    "http-auth-schemes.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>A bearer token authenticates whoever holds it, not a specific client — anyone possessing it can impersonate the subject, so pair it with TLS and short lifetimes. DPoP and mTLS instead bind a token to a client-held private key, so a stolen token alone can't be replayed.</p>
</div>

## Primary references

- **RFC 6750**: *The OAuth 2.0 Authorization Framework: Bearer Token Usage* — [IETF RFC 6750](https://www.rfc-editor.org/rfc/rfc6750)
- **RFC 9449**: *OAuth 2.0 Demonstrating Proof of Possession (DPoP)* — [IETF RFC 9449](https://www.rfc-editor.org/rfc/rfc9449)
- **NTLM overview**: *Microsoft Learn, Windows Server security* — [NTLM overview](https://learn.microsoft.com/en-us/windows-server/security/kerberos/ntlm-overview) — verified when a resource server contacts a domain controller vs. validates a domain/local account locally.""",

    "network-segmentation-microsegmentation.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Traditional segmentation uses firewalls, VLANs, and subnets at perimeter and internal zone boundaries; microsegmentation adds finer workload-to-workload policy. In dynamic environments, prefer stable workload identity where available and use network location as one policy signal rather than the sole trust basis.</p>
</div>

## Primary references

- **NIST SP 800-207**: *Zero Trust Architecture (Network Microsegmentation)* — [NIST CSRC SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)
- **CISA Zero Trust Maturity Model**: *Network Segment Guidance* — [CISA ZTMM](https://www.cisa.gov/zero-trust-maturity-model)""",

    "oauth-oidc.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>OAuth 2.0 is an authorization framework; OpenID Connect adds authentication and ID tokens. Use Authorization Code + PKCE—required for public clients and recommended for confidential clients by RFC 9700—and do not use the implicit grant for new clients. A resource server must validate an access token according to its format and authorization-server profile; for JWT access tokens, verify the signature and algorithm plus all required issuer, audience, time, and authorization claims.</p>
</div>

## Primary references

- **RFC 6749**: *The OAuth 2.0 Authorization Framework* — [IETF RFC 6749](https://www.rfc-editor.org/rfc/rfc6749)
- **RFC 7636**: *Proof Key for Code Exchange by OAuth Public Clients (PKCE)* — [IETF RFC 7636](https://www.rfc-editor.org/rfc/rfc7636)
- **RFC 9700**: *Best Current Practice for OAuth 2.0 Security* — [IETF RFC 9700](https://datatracker.ietf.org/doc/html/rfc9700) — verified PKCE requirement strength for public vs. confidential clients.
- **OpenID Connect Core 1.0**: *OpenID Connect Specification* — [OpenID Foundation](https://openid.net/specs/openid-connect-core-1_0.html)""",

    "owasp-web-security.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Broken Access Control remains OWASP's top web-application risk; enforce object-level authorization for every operation that uses a client-supplied object reference. Prevent SQL injection with parameterized values plus allowlisting where query structure must be dynamic; prevent XSS with context-appropriate encoding, safe sinks, and sanitization where HTML is allowed, using CSP as defense in depth. Apply HSTS site-wide over HTTPS, and apply <code>frame-ancestors</code> or X-Frame-Options where browser-rendered responses can be framed—not indiscriminately to JSON APIs.</p>
</div>

## Primary references

- **OWASP Top 10:2021**: *Top 10 Web Application Security Risks* — [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- **OWASP ASVS 4.0**: *Application Security Verification Standard* — [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- **OWASP SQL Injection Prevention Cheat Sheet** — verified parameterized values and allowlisting for query parts that cannot use bind variables — [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- **OWASP Cross Site Scripting Prevention Cheat Sheet** — verified context-specific encoding, safe sinks, sanitization, and CSP's defense-in-depth role — [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- **OWASP HTTP Headers Cheat Sheet** — verified the scope of HSTS and browser framing controls — [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)""",

    "saml.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>SAML assertions must be validated for element positioning, not just signature validity — XML Signature Wrapping attacks manipulate the DOM tree while keeping a valid signature block intact. Enforce tight <code>NotOnOrAfter</code> timestamps and track assertion IDs to prevent replay.</p>
</div>

## Primary references

- **OASIS SAML v2.0**: *SAML 2.0 Executive Overview* — [OASIS SAML 2.0 Standard](http://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- **OWASP SAML Security**: *SAML Security Cheat Sheet* — [OWASP SAML Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html)""",

    "security-certifications.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>A vendor's marketing claim ("FIPS compliant") is not a verified certificate — check the NIST CMVP database against the exact module name, version, operational environment, and approved mode before trusting it. FedRAMP applicability is scoped to the agency's specific use case, not a blanket requirement on the cloud service itself.</p>
</div>

## Primary references

- **AICPA SOC 2**: *Trust Services Criteria for Security, Availability, and Confidentiality* — [AICPA SOC 2](https://www.aicpa.org/topic/audit-assurance/audit-and-assurance-greater-than-soc-for-service-organizations)
- **FedRAMP Marketplace**: *Federal Risk and Authorization Management Program* — [FedRAMP Official](https://www.fedramp.gov/)""",

    "security-maturity-models.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>OWASP SAMM and CMMI are prescriptive maturity scales measuring how mature a program's practices are; BSIMM is descriptive, benchmarking against what real organizations actually do rather than defining a target state. SLSA's Build track (L0–L3, v1.2) is a separate, build-integrity-specific model — not a general maturity scale — and superseded the old numeric 1–4 scheme.</p>
</div>

## Primary references

- **OWASP SAMM v2.0**: *Software Assurance Maturity Model* — [OWASP SAMM](https://owaspsamm.org/)
- **BSIMM14**: *Building Security In Maturity Model* — [BSIMM Official](https://www.bsimm.com/)
- **SLSA v1.2**: *Supply-chain Levels for Software Artifacts* — [SLSA Official](https://slsa.dev/spec/v1.2/about)
- **CMMI V3.0**: *Model Quick Reference Guide* — [ISACA](https://www.isaca.org/resources/reference-guide/cmmi-model-quick-reference-guide)
- **NIST SP 1302**: *Quick-Start Guide for Using the CSF Tiers* — [NIST CSRC](https://csrc.nist.gov/pubs/sp/1302/final)""",

    "security-token-service.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>An STS exchanges security tokens for new tokens appropriate to another trust domain or resource; credential type and duration depend on the implementation and operation. RFC 8693's <code>act</code> claim can identify the current actor, and nested <code>act</code> claims can retain prior actors. That improves downstream attribution but does not replace audit logging or guarantee full auditability.</p>
</div>

## Primary references

- **AWS STS Documentation**: *Temporary security credentials in IAM* — [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html) — verified per-operation session duration ranges via the [AWS STS API Reference](https://docs.aws.amazon.com/STS/latest/APIReference/Welcome.html).
- **RFC 8693**: *OAuth 2.0 Token Exchange* — [IETF RFC 8693](https://www.rfc-editor.org/rfc/rfc8693) — verified the `act` claim is not restricted to delegation-labeled exchanges.""",

    "software-supply-chain-security.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>An SBOM tells you what's present; it takes an ongoing CVE cross-reference process for that to become vulnerability management, and it needs regenerating every build to stay current. SLSA provenance can show which source and builder produced an artifact and make some build tampering detectable — neither an SBOM nor SLSA proves the source itself was benign, as xz-utils demonstrated.</p>
</div>

## Primary references

- **SLSA Framework**: *Supply-chain Levels for Software Artifacts* — [SLSA Official](https://slsa.dev/)
- **Sigstore Project**: *Keyless Code Signing and Transparency* — [Sigstore Documentation](https://www.sigstore.dev/)""",

    "ssh.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Static keys scattered across <code>authorized_keys</code> files scale poorly and cause key sprawl; short-lived SSH certificates signed by a central CA let hosts verify against one CA public key instead. <code>ssh-keyscan</code> fetches a host key over the same network path being verified, so its output still needs independent out-of-band verification before it's trusted.</p>
</div>

## Primary references

- **OpenSSH Certificates**: *OpenSSH Certificate Architecture Protocol* — [OpenSSH Specs](https://www.openssh.com/specs.html)
- **RFC 4253**: *The Secure Shell (SSH) Transport Layer Protocol* — [IETF RFC 4253](https://www.rfc-editor.org/rfc/rfc4253)""",

    "step-up-authentication.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Step-up authentication challenges the user for a higher assurance level at the moment a high-risk action is attempted, using OIDC's standardized <code>acr_values</code>/<code>max_age</code> parameters, without terminating the base session. Prefer phishing-resistant WebAuthn/FIDO2 over OTP-based step-up factors to defeat adversary-in-the-middle relay attacks.</p>
</div>

## Primary references

- **OpenID Connect Core 1.0**: *Authentication Context Class Reference (acr_values)* — [OpenID Spec](https://openid.net/specs/openid-connect-core-1_0.html)
- **NIST SP 800-63B**: *Authenticator Assurance Levels (AAL1, AAL2, AAL3)* — [NIST CSRC SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)""",

    "threat-frameworks.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>Threat-modeling methods such as STRIDE, PASTA, and VAST primarily analyze architecture, while ATT&amp;CK and the Cyber Kill Chain organize observed or expected adversary behavior; both can inform design and operations. ATT&amp;CK technique mapping inventories intended coverage, but measured coverage requires relevant telemetry plus tested detections or adversary-emulation evidence.</p>
</div>

## Primary references

- **MITRE ATT&amp;CK**: *Adversary Tactics, Techniques, and Knowledge Base* — [MITRE ATT&amp;CK Official](https://attack.mitre.org/)
- **Lockheed Martin Cyber Kill Chain**: *Seven Steps of Cyber Kill Chain* — [Lockheed Martin](https://www.lockheedmartin.com/en-us/capabilities/cyber/cyber-kill-chain.html)""",

    "vpn-ipsec-wireguard.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>WireGuard is a lean option for new tunnels; IPsec/IKEv2 remains useful where standardized, OS-native VPN support is required. A VPN can be narrowly routed and firewalled, but many deployments expose broad network reachability; use per-peer routes and downstream policy, or ZTNA when per-application authorization is the goal.</p>
</div>

## Primary references

- **WireGuard Whitepaper**: *WireGuard: Next Generation Kernel Network Tunnel* — [WireGuard Official Paper](https://www.wireguard.com/papers/wireguard.pdf)
- **RFC 7296**: *Internet Key Exchange Protocol Version 2 (IKEv2)* — [IETF RFC 7296](https://www.rfc-editor.org/rfc/rfc7296)""",

    "webauthn-passkeys.md": """<div class="callout">
  <span class="callout-title">What I need to remember</span>
  <p>WebAuthn binds credentials to the exact origin they were registered for, defeating real-time credential-relay phishing — but it does not protect weaker account-recovery fallbacks, a post-authentication session compromise, or fraudulent credential registration. Synced passkeys trade non-extractable key custody for seamless cross-device UX; hardware keys keep the key non-exportable.</p>
</div>

## Primary references

- **W3C WebAuthn Level 3**: *Web Authentication: An API for accessing Public Key Credentials* — [W3C WebAuthn Spec](https://www.w3.org/TR/webauthn-3/)
- **FIDO Alliance Passkeys**: *Passkeys Standard & Specifications* — [FIDO Alliance](https://fidoalliance.org/passkeys/)
- **NIST SP 800-63B**: *Digital Identity Guidelines — Authentication and Authenticator Management*, verifier impersonation resistance definition — [NIST 800-63B](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/)""",
}

for fname, text_content in sections_data.items():
    fpath = os.path.join(topics_dir, fname)
    if not os.path.exists(fpath):
        continue
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    if 'callout-title">What I need to remember' not in content and "Primary references" not in content:
        new_content = content.rstrip() + "\n\n" + text_content + "\n"
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"ADDED TO {fname}")
    else:
        print(f"ALREADY HAS SECTIONS {fname}")
