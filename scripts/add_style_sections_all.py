import os

topics_dir = "/Users/llody/Documents/journal/topics"

sections_data = {
    "ai-llm-security.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>AI &amp; LLM Security Summary</strong>
    <ul>
      <li><strong>OWASP Top 10 for LLMs</strong>: Primary risks include Prompt Injection (direct/indirect), Insecure Output Handling, Training Data Poisoning, and Model Denial of Service.</li>
      <li><strong>Indirect Prompt Injection</strong>: Untrusted inputs from websites, emails, or PDFs manipulate LLM behavior during RAG/retrieval ops. Always sanitize LLM context.</li>
      <li><strong>Human-in-the-Loop</strong>: Never allow LLMs to execute destructive side-effects (database deletes, wire transfers) without explicit human confirmation.</li>
    </ul>
  </div>
</div>

## Primary References

- **OWASP Top 10 for Large Language Model Applications**: *OWASP LLM Security Project* — [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- **NIST AI Risk Management Framework (AI RMF 1.0)**: *Artificial Intelligence Risk Management Framework* — [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework)""",

    "api-security.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>API Security Summary</strong>
    <ul>
      <li><strong>BOLA / IDOR (#1 Risk)</strong>: Broken Object Level Authorization happens when APIs rely on user-supplied IDs without verifying object ownership.</li>
      <li><strong>Token Validation</strong>: Always validate JWT signature, expiration (<code>exp</code>), audience (<code>aud</code>), and issuer (<code>iss</code>) on every API request.</li>
      <li><strong>Rate Limiting &amp; Throttling</strong>: Enforce token-bucket or leaky-bucket rate limits per client IP / API key to prevent DoS and credential stuffing.</li>
    </ul>
  </div>
</div>

## Primary References

- **OWASP API Security Top 10:2023**: *Top 10 API Security Risks* — [OWASP API Security Top 10](https://owasp.org/API-Security/)
- **RFC 7519**: *JSON Web Token (JWT)* — [IETF RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)""",

    "authorization-models.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Authorization Models Summary</strong>
    <ul>
      <li><strong>RBAC vs. ABAC vs. ReBAC</strong>: RBAC grants access based on static roles; ABAC evaluates dynamic attributes (time, IP, user location); ReBAC models graph relationship edges (Google Zanzibar).</li>
      <li><strong>Centralized Authorization Engines</strong>: Decouple authorization logic from application code using Open Policy Agent (OPA) or Cedar.</li>
      <li><strong>Default Deny</strong>: Always enforce explicit allow policies; unhandled permission queries must fail closed to deny.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-162**: *Guide to Attribute Based Access Control (ABAC) Definition and Consideration* — [NIST CSRC SP 800-162](https://csrc.nist.gov/pubs/sp/800/162/final)
- **Google Zanzibar Paper**: *Zanzibar: Google’s Consistent, Global Authorization System* — [Google Research Zanzibar](https://research.google/pubs/pub48190/)""",

    "cybersecurity-standards.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Cybersecurity Standards Summary</strong>
    <ul>
      <li><strong>Framework Hierarchy</strong>: ISO 27001 provides management systems (ISMS); NIST SP 800-53 provides technical controls; PCI-DSS governs payment security.</li>
      <li><strong>Cross-Framework Mapping</strong>: Map enterprise controls to a unified control framework (UCF) to satisfy multi-regulation audits (SOC 2, ISO 27001, HIPAA).</li>
      <li><strong>Continuous Evidence Collection</strong>: Automate compliance verification via continuous monitoring tools rather than annual point-in-time audits.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-53 Rev. 5**: *Security Controls for Information Systems* — [NIST CSRC SP 800-53](https://csrc.nist.gov/pubs/sp/800/53/r5/final)
- **ISO/IEC 27001:2022**: *Information security management systems requirements* — [ISO 27001 Standard](https://www.iso.org/standard/27001)""",

    "dns-security.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>DNS Security Summary</strong>
    <ul>
      <li><strong>DNS Cache Poisoning</strong>: Attackers spoof DNS responses to redirect user traffic. Mitigated by source port randomization and DNSSEC.</li>
      <li><strong>DNSSEC Validation</strong>: Cryptographically signs DNS resource records (RRSIG, DNSKEY, DS) to prove origin authenticity and integrity.</li>
      <li><strong>DoH &amp; DoT Transport Security</strong>: DNS over HTTPS (DoH / RFC 8484) and DNS over TLS (DoT / RFC 7858) encrypt DNS queries against network eavesdropping.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 4033**: *DNS Security Introduction and Requirements (DNSSEC)* — [IETF RFC 4033](https://www.rfc-editor.org/rfc/rfc4033)
- **RFC 8484**: *DNS Queries over HTTPS (DoH)* — [IETF RFC 8484](https://www.rfc-editor.org/rfc/rfc8484)""",

    "grc-framework-strategy.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>GRC &amp; Strategy Summary</strong>
    <ul>
      <li><strong>Three Lines Model</strong>: Line 1 (Operational Management), Line 2 (Risk &amp; Compliance Oversight), Line 3 (Internal Audit).</li>
      <li><strong>Risk Appetite &amp; Tolerance</strong>: Establish quantitative risk thresholds approved by board governance before defining technical policies.</li>
      <li><strong>Policy Enforcement</strong>: Policies must map directly to automated technical guardrails (AWS SCPs, OPA policies) to guarantee compliance.</li>
    </ul>
  </div>
</div>

## Primary References

- **IIA Three Lines Model**: *The IIA's Three Lines Model for Governance* — [IIA Three Lines](https://www.theiia.org/en/content/position-papers/2020/the-iias-three-lines-model-an-update-of-the-three-lines-of-defense/)
- **NIST SP 800-39**: *Managing Information Security Risk: Organization, Mission, and Information System View* — [NIST CSRC SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final)""",

    "hsm-kms.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>HSM &amp; KMS Summary</strong>
    <ul>
      <li><strong>FIPS 140-3 Levels</strong>: Level 1 (software), Level 2 (tamper-evident), Level 3 (tamper-resistant zeroization), Level 4 (environmental protection).</li>
      <li><strong>Non-Extractable Keys</strong>: PKCS#11 attributes (<code>CKA_SENSITIVE=TRUE</code>, <code>CKA_EXTRACTABLE=FALSE</code>) guarantee key bytes never leave HSM RAM.</li>
      <li><strong>Envelope Encryption</strong>: KMS wraps small DEK (AES Key Wrap RFC 3394); application encrypts bulk data locally with DEK.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST FIPS 140-3**: *Security Requirements for Cryptographic Modules* — [NIST CSRC FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final)
- **RFC 3394**: *Advanced Encryption Standard (AES) Key Wrap Algorithm* — [IETF RFC 3394](https://www.rfc-editor.org/rfc/rfc3394)""",

    "http-auth-schemes.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>HTTP Authentication Summary</strong>
    <ul>
      <li><strong>Bearer Token Hazard</strong>: Anyone possessing a Bearer token (RFC 6750) can impersonate the subject. Always combine with TLS and short lifetimes.</li>
      <li><strong>Sender-Constrained Tokens</strong>: DPoP (RFC 9449) and mTLS (RFC 8705) bind tokens to client private keys, preventing stolen token replay.</li>
      <li><strong>Basic Auth Deprecation</strong>: Basic Authentication sends base64 credentials in cleartext; restrict strictly to local debug or replace with OAuth2.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 6750**: *The OAuth 2.0 Authorization Framework: Bearer Token Usage* — [IETF RFC 6750](https://www.rfc-editor.org/rfc/rfc6750)
- **RFC 9449**: *OAuth 2.0 Demonstrating Proof of Possession (DPoP)* — [IETF RFC 9449](https://www.rfc-editor.org/rfc/rfc9449)""",

    "network-segmentation-microsegmentation.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Network Microsegmentation Summary</strong>
    <ul>
      <li><strong>Perimeter vs. Microsegmentation</strong>: Traditional firewalls protect VLAN perimeters; microsegmentation enforces workload-to-workload policies (Layer 7).</li>
      <li><strong>Identity-Based Policies</strong>: Enforce traffic filtering based on cryptographic identity (SPIFFE IDs, mTLS) rather than fragile IP subnets.</li>
      <li><strong>Zero Trust Network Architecture</strong>: Assume lateral movement will occur; default-deny all inter-service communications.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-207**: *Zero Trust Architecture (Network Microsegmentation)* — [NIST CSRC SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)
- **CISA Zero Trust Maturity Model**: *Network Segment Guidance* — [CISA ZTMM](https://www.cisa.gov/zero-trust-maturity-model)""",

    "oauth-oidc.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>OAuth 2.0 &amp; OIDC Summary</strong>
    <ul>
      <li><strong>OAuth vs. OIDC</strong>: OAuth 2.0 is an <em>Authorization framework</em> (Access Tokens); OIDC is an <em>Authentication layer</em> built on OAuth 2.0 (ID Tokens).</li>
      <li><strong>Mandatory PKCE (RFC 7636)</strong>: Authorization Code Flow with PKCE is required for all clients (mobile, SPA, backend) to defeat code interception attacks.</li>
      <li><strong>Implicit Flow Deprecated</strong>: Never use OAuth 2.0 Implicit Flow (returns access tokens in URL hash fragment).</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 6749**: *The OAuth 2.0 Authorization Framework* — [IETF RFC 6749](https://www.rfc-editor.org/rfc/rfc6749)
- **RFC 7636**: *Proof Key for Code Exchange by OAuth Public Clients (PKCE)* — [IETF RFC 7636](https://www.rfc-editor.org/rfc/rfc7636)
- **OpenID Connect Core 1.0**: *OpenID Connect Specification* — [OpenID Foundation](https://openid.net/specs/openid-connect-core-1_0.html)""",

    "owasp-web-security.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>OWASP Web Security Summary</strong>
    <ul>
      <li><strong>Top Web Vulnerabilities</strong>: Broken Access Control (#1), Cryptographic Failures (#2), Injection (#3), Insecure Design (#4).</li>
      <li><strong>Defense Against Injection</strong>: Parameterized SQL queries, contextual output encoding (XSS defense), and CSP headers.</li>
      <li><strong>Security Headers</strong>: Enforce Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), and X-Frame-Options across all endpoints.</li>
    </ul>
  </div>
</div>

## Primary References

- **OWASP Top 10:2021**: *Top 10 Web Application Security Risks* — [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- **OWASP ASVS 4.0**: *Application Security Verification Standard* — [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)""",

    "saml.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>SAML 2.0 Summary</strong>
    <ul>
      <li><strong>XML Signature Wrapping (XSW)</strong>: Attackers manipulate XML DOM trees to alter assertions while keeping valid signature blocks. Always validate element positioning.</li>
      <li><strong>SP-Initiated Flow</strong>: User accesses Service Provider first, receives SAML Request, authenticates at Identity Provider, and posts SAML Response.</li>
      <li><strong>Clock Skew &amp; Replay</strong>: Enforce tight <code>NotOnOrAfter</code> timestamps and track assertion <code>ID</code>s to prevent replay attacks.</li>
    </ul>
  </div>
</div>

## Primary References

- **OASIS SAML v2.0**: *SAML 2.0 Executive Overview* — [OASIS SAML 2.0 Standard](http://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- **OWASP SAML Security**: *SAML Security Cheat Sheet* — [OWASP SAML Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html)""",

    "security-certifications.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Security Certifications Summary</strong>
    <ul>
      <li><strong>ISO 27001 vs. SOC 2</strong>: ISO 27001 is a globally recognized cert auditing ISMS processes; SOC 2 Type II is a U.S. report evaluating trust principles over 6+ months.</li>
      <li><strong>FedRAMP High/Moderate</strong>: Mandatory authorization for U.S. federal cloud providers based on NIST SP 800-53 controls.</li>
      <li><strong>Common Criteria (CC)</strong>: Evaluates hardware/software assurance levels (EAL1 to EAL7) against defined protection profiles.</li>
    </ul>
  </div>
</div>

## Primary References

- **AICPA SOC 2**: *Trust Services Criteria for Security, Availability, and Confidentiality* — [AICPA SOC 2](https://www.aicpa.org/topic/audit-assurance/audit-and-assurance-greater-than-soc-for-service-organizations)
- **FedRAMP Marketplace**: *Federal Risk and Authorization Management Program* — [FedRAMP Official](https://www.fedramp.gov/)""",

    "security-maturity-models.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Security Maturity Summary</strong>
    <ul>
      <li><strong>OWASP SAMM 2.0</strong>: Evaluates software security across Governance, Design, Implementation, Verification, and Operations (Levels 1–3).</li>
      <li><strong>BSIMM Framework</strong>: Descriptive model benchmarking software security practices against real-world industry observations.</li>
      <li><strong>CMMI Levels</strong>: Level 1 (Initial/Ad-hoc) to Level 5 (Optimizing/Continuous Improvement).</li>
    </ul>
  </div>
</div>

## Primary References

- **OWASP SAMM v2.0**: *Software Assurance Maturity Model* — [OWASP SAMM](https://owaspsamm.org/)
- **BSIMM14**: *Building Security In Maturity Model* — [BSIMM Official](https://www.bsimm.com/)""",

    "security-token-service.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Security Token Service (STS) Summary</strong>
    <ul>
      <li><strong>Token Exchange Pattern</strong>: STS exchanges long-lived enterprise credentials or SAML assertions for short-lived AWS/cloud IAM security tokens.</li>
      <li><strong>AWS STS AssumeRole</strong>: Returns temporary access key, secret key, and session token with maximum lifetime constraints (1–12 hours).</li>
      <li><strong>RFC 8693 OAuth Token Exchange</strong>: Standardized API for requesting delegation tokens across microservice boundaries.</li>
    </ul>
  </div>
</div>

## Primary References

- **AWS STS Documentation**: *AWS Security Token Service User Guide* — [AWS STS Docs](https://docs.aws.amazon.com/STS/latest/UsingSTS/welcome.html)
- **RFC 8693**: *OAuth 2.0 Token Exchange* — [IETF RFC 8693](https://www.rfc-editor.org/rfc/rfc8693)""",

    "software-supply-chain-security.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Supply Chain Security Summary</strong>
    <ul>
      <li><strong>Software Bill of Materials (SBOM)</strong>: Machine-readable inventory of software components (CycloneDX, SPDX) mandatory under Executive Order 14028.</li>
      <li><strong>SLSA Framework (Levels 1–4)</strong>: Defines build integrity requirements (provenance generation, isolated build environments).</li>
      <li><strong>Code Signing &amp; Sigstore</strong>: Sign container images and binaries using keyless signing (Cosign / Fulcio / Rekor) to prevent artifact tampering.</li>
    </ul>
  </div>
</div>

## Primary References

- **SLSA Framework**: *Supply-chain Levels for Software Artifacts* — [SLSA Official](https://slsa.dev/)
- **Sigstore Project**: *Keyless Code Signing and Transparency* — [Sigstore Documentation](https://www.sigstore.dev/)""",

    "ssh.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>SSH &amp; Key Management Summary</strong>
    <ul>
      <li><strong>Deprecate Static Authorized_Keys</strong>: Managing static public keys on host disk scale poorly and causes key sprawl.</li>
      <li><strong>SSH User Certificates (OpenSSH CA)</strong>: Sign short-lived SSH user certificates using a central SSH CA key; hosts verify signatures against CA public key.</li>
      <li><strong>Modern Key Algorithms</strong>: Enforce Ed25519 (<code>ssh-ed25519</code>) or RSA-4096; disable legacy <code>ssh-rsa</code> (SHA-1 signature scheme).</li>
    </ul>
  </div>
</div>

## Primary References

- **OpenSSH Certificates**: *OpenSSH Certificate Architecture Protocol* — [OpenSSH Specs](https://www.openssh.com/specs.html)
- **RFC 4253**: *The Secure Shell (SSH) Transport Layer Protocol* — [IETF RFC 4253](https://www.rfc-editor.org/rfc/rfc4253)""",

    "step-up-authentication.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Step-Up Authentication Summary</strong>
    <ul>
      <li><strong>Contextual Re-Authentication</strong>: Challenge users for additional MFA factors when accessing high-risk actions (wire transfers, password reset).</li>
      <li><strong>OIDC <code>acr_values</code> / <code>max_age</code></strong>: Standardized parameters requesting higher Authentication Context Class Reference levels.</li>
      <li><strong>FIDO2 / WebAuthn Priority</strong>: Prefer hardware security keys (YubiKey) for step-up auth to defeat adversary-in-the-middle phishing attacks.</li>
    </ul>
  </div>
</div>

## Primary References

- **OpenID Connect Core 1.0**: *Authentication Context Class Reference (acr_values)* — [OpenID Spec](https://openid.net/specs/openid-connect-core-1_0.html)
- **NIST SP 800-63B**: *Authenticator Assurance Levels (AAL1, AAL2, AAL3)* — [NIST CSRC SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)""",

    "threat-frameworks.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Threat Frameworks Summary</strong>
    <ul>
      <li><strong>MITRE ATT&amp;CK Matrix</strong>: Categorizes real-world adversary behavior into Tactics, Techniques, and Procedures (TTPs).</li>
      <li><strong>Cyber Kill Chain</strong>: 7-stage attack flow (Reconnaissance, Weaponization, Delivery, Exploitation, Installation, Command &amp; Control, Actions on Objectives).</li>
      <li><strong>Detection Mapping</strong>: Map SIEM/EDR detection rules directly to MITRE ATT&amp;CK technique IDs to measure coverage gaps.</li>
    </ul>
  </div>
</div>

## Primary References

- **MITRE ATT&amp;CK**: *Adversary Tactics, Techniques, and Knowledge Base* — [MITRE ATT&amp;CK Official](https://attack.mitre.org/)
- **Lockheed Martin Cyber Kill Chain**: *Seven Steps of Cyber Kill Chain* — [Lockheed Martin](https://www.lockheedmartin.com/en-us/capabilities/cyber/cyber-kill-chain.html)""",

    "vpn-ipsec-wireguard.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>VPN, IPsec &amp; WireGuard Summary</strong>
    <ul>
      <li><strong>WireGuard Architecture</strong>: Modern, lightweight VPN protocol using Noise protocol framework, Curve25519, ChaCha20-Poly1305, and BLAKE2s (~4,000 LOC).</li>
      <li><strong>IPsec IKEv2</strong>: Enterprise standard for site-to-site tunnels; encrypts IP packets using ESP (Encapsulating Security Payload) mode.</li>
      <li><strong>Zero Trust Network Access (ZTNA)</strong>: Replaces perimeter VPN access with identity-aware application proxies to prevent lateral network movement.</li>
    </ul>
  </div>
</div>

## Primary References

- **WireGuard Whitepaper**: *WireGuard: Next Generation Kernel Network Tunnel* — [WireGuard Official Paper](https://www.wireguard.com/papers/wireguard.pdf)
- **RFC 7296**: *Internet Key Exchange Protocol Version 2 (IKEv2)* — [IETF RFC 7296](https://www.rfc-editor.org/rfc/rfc7296)""",

    "webauthn-passkeys.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>WebAuthn &amp; Passkeys Summary</strong>
    <ul>
      <li><strong>Phishing-Resistant FIDO2</strong>: WebAuthn binds public keys directly to origin domain names (<code>origin</code> field), completely immune to credential harvesting sites.</li>
      <li><strong>Hardware Signature Verification</strong>: Authenticator signs server <code>challenge</code> using device private key; server verifies signature with stored public key.</li>
      <li><strong>Passkeys (Synced vs. Hardware)</strong>: Synced passkeys (iCloud Keychain, 1Password) provide seamless UX; Hardware keys (YubiKey) provide non-extractable key custody.</li>
    </ul>
  </div>
</div>

## Primary References

- **W3C WebAuthn Level 3**: *Web Authentication: An API for accessing Public Key Credentials* — [W3C WebAuthn Spec](https://www.w3.org/TR/webauthn-3/)
- **FIDO Alliance Passkeys**: *Passkeys Standard & Specifications* — [FIDO Alliance](https://fidoalliance.org/passkeys/)""",
}

for fname, text_content in sections_data.items():
    fpath = os.path.join(topics_dir, fname)
    if not os.path.exists(fpath):
        continue
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "What I Need to Remember" not in content and "Primary References" not in content:
        new_content = content.rstrip() + "\n\n" + text_content + "\n"
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"ADDED TO {fname}")
    else:
        print(f"ALREADY HAS SECTIONS {fname}")
