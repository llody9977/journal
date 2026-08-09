import os

topics_dir = "/Users/llody/Documents/journal/topics"

sections_data = {
    "security-fundamentals.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Security Fundamentals Summary</strong>
    <ul>
      <li><strong>Security Objectives</strong>: Core goals are Confidentiality, Integrity, Authenticity, Non-Repudiation, and Availability.</li>
      <li><strong>Risk-Driven Architecture</strong>: Security controls must be selected based on threat modeling and risk assessments, not checkbox compliance.</li>
      <li><strong>Defense in Depth</strong>: Layer controls across physical, network, identity, application, and data layers so no single point of failure exists.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-53 Rev. 5**: *Security and Privacy Controls for Information Systems and Organizations* — [NIST CSRC SP 800-53](https://csrc.nist.gov/pubs/sp/800/53/r5/final)
- **ISO/IEC 27001:2022**: *Information security, cybersecurity and privacy protection — Information security management systems* — [ISO 27001 Overview](https://www.iso.org/standard/27001)""",

    "where-should-i-start.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Practitioner Roadmap Summary</strong>
    <ul>
      <li><strong>Start with Threat Modeling</strong>: Map assets, data flows, and trust boundaries before choosing security controls.</li>
      <li><strong>Enforce Standardized Controls</strong>: Rely on peer-reviewed frameworks (NIST CSF 2.0, OWASP Top 10) rather than custom solutions.</li>
      <li><strong>Measure Security Maturity</strong>: Track progress using established maturity models (CMMI, OWASP SAMM, CIS Implementation Groups).</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST Cybersecurity Framework 2.0**: *Framework for Improving Critical Infrastructure Cybersecurity* — [NIST CSF 2.0](https://www.nist.gov/cyberframework)
- **OWASP Top 10:2021**: *The Ten Most Critical Web Application Security Risks* — [OWASP Top 10](https://owasp.org/www-project-top-ten/)""",

    "security-objectives-properties.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Security Objectives Summary</strong>
    <ul>
      <li><strong>CIA Triad + Extensions</strong>: Confidentiality (secrecy), Integrity (tamper-proofing), Availability (uptime), plus Authenticity and Non-Repudiation.</li>
      <li><strong>Authenticity vs. Non-Repudiation</strong>: Authenticity proves who sent the message; Non-repudiation prevents the sender from denying the action to third parties.</li>
      <li><strong>Privacy as a Distinct Objective</strong>: Privacy enforces data minimization, consent, and access restrictions over personal data (PII).</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-33**: *Underlying Technical Models for Information Technology Security* — [NIST CSRC SP 800-33](https://csrc.nist.gov/pubs/sp/800/33/final)
- **ISO/IEC 27000:2020**: *Overview and vocabulary for Information Security Management Systems* — [ISO 27000](https://www.iso.org/standard/73906.html)""",

    "trust-boundaries-threat-modeling.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Threat Modeling Summary</strong>
    <ul>
      <li><strong>STRIDE Model</strong>: Categorizes threats into Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege.</li>
      <li><strong>NIST CSF 2.0 Functions</strong>: Enforces six core functions: <em>GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER</em>.</li>
      <li><strong>Trust Boundaries</strong>: Identify every interface where data transitions between different privilege levels or untrusted networks.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST Cybersecurity Framework 2.0**: *NIST CSF 2.0 Governance and Core Functions* — [NIST CSF 2.0 Final](https://www.nist.gov/cyberframework)
- **OWASP Threat Modeling**: *Threat Modeling Process & STRIDE Framework* — [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)""",

    "risk-fundamentals.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Risk Fundamentals Summary</strong>
    <ul>
      <li><strong>Risk Formula</strong>: Risk = Threat × Vulnerability × Impact. Reducing any component lowers overall residual risk.</li>
      <li><strong>Risk Treatment Strategies</strong>: Four primary responses: Mitigate (controls), Transfer (insurance/cloud), Avoid (eliminate feature), Accept (formal risk sign-off).</li>
      <li><strong>FAIR Methodology</strong>: Enables quantitative financial modeling of loss event frequency and magnitude.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-30 Rev. 1**: *Guide for Conducting Risk Assessments* — [NIST CSRC SP 800-30](https://csrc.nist.gov/pubs/sp/800/30/r1/final)
- **ISO 31000:2018**: *Risk management — Guidelines* — [ISO 31000](https://www.iso.org/standard/65694.html)""",

    "identity-access-fundamentals.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Identity &amp; Access Summary</strong>
    <ul>
      <li><strong>Authentication vs. Authorization</strong>: Authentication verifies identity ("Who are you?"); Authorization determines permissions ("What can you do?").</li>
      <li><strong>Zero Trust Architecture (NIST SP 800-207)</strong>: Never trust, always verify. Enforce explicit authentication and authorization per request regardless of network location.</li>
      <li><strong>Principle of Least Privilege</strong>: Grant entities only the minimum permissions required to perform their explicit function.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-207**: *Zero Trust Architecture* — [NIST CSRC SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)
- **NIST SP 800-63-3**: *Digital Identity Guidelines* — [NIST CSRC SP 800-63-3](https://pages.nist.gov/800-63-3/)""",

    "security-controls-defense-in-depth.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Security Controls Summary</strong>
    <ul>
      <li><strong>Control Categories</strong>: Preventive (stops attack), Detective (alerts on attack), Corrective (fixes impact), Compensating (alternate protection).</li>
      <li><strong>Defense in Depth Layers</strong>: Overlapping controls across Perimeter, Network, Host, Application, Data, and IAM boundaries.</li>
      <li><strong>CIS Implementation Groups</strong>: Tiered control deployment (IG1 baseline, IG2 enterprise, IG3 high-assurance).</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-53 Rev. 5**: *Security Control Families and Catalog* — [NIST CSRC SP 800-53](https://csrc.nist.gov/pubs/sp/800/53/r5/final)
- **CIS Controls v8**: *Center for Internet Security Critical Security Controls* — [CIS Controls](https://www.cisecurity.org/controls/v8)""",

    "cryptography-overview.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Cryptographic Foundations Summary</strong>
    <ul>
      <li><strong>CSPRNG Requirement</strong>: Cryptographic keys, nonces, and tokens must use OS CSPRNG APIs (<code>secrets.token_bytes()</code>, <code>crypto.randomBytes()</code>). Never use non-cryptographic PRNGs (<code>Math.random()</code>).</li>
      <li><strong>Enforce AEAD</strong>: Always use Authenticated Encryption with Associated Data (AES-GCM, ChaCha20-Poly1305) to prevent padding oracle attacks.</li>
      <li><strong>Protocol Composition</strong>: Production protocols combine asymmetric signatures (authentication), ephemeral ECDH (key agreement), and symmetric AEAD (bulk data).</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-90A Rev. 1**: *Recommendation for Random Number Generation Using Deterministic Random Bit Generators* — [NIST CSRC SP 800-90A](https://csrc.nist.gov/pubs/sp/800/90/a/r1/final)
- **RFC 8446**: *The Transport Layer Security (TLS) Protocol Version 1.3* — [IETF RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)""",

    "symmetric-cryptography.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Symmetric Cryptography Summary</strong>
    <ul>
      <li><strong>AES-256-GCM Standard</strong>: Universal AEAD cipher for data in transit and at rest. Provides 128-bit quantum security against Grover's algorithm.</li>
      <li><strong>Nonce Uniqueness Rule</strong>: Reusing a 96-bit GCM nonce under the same key destroys authenticity and allows plaintext recovery.</li>
      <li><strong>ChaCha20-Poly1305 Alternative</strong>: Software-optimized AEAD stream cipher providing exceptional speed on hardware lacking AES-NI acceleration.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-38D**: *Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM)* — [NIST CSRC SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final)
- **RFC 8439**: *ChaCha20 and Poly1305 for IETF Protocols* — [IETF RFC 8439](https://www.rfc-editor.org/rfc/rfc8439)""",

    "symmetric-mode-attacks.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Symmetric Mode Vulnerabilities Summary</strong>
    <ul>
      <li><strong>ECB Block Leakage</strong>: Identical plaintext blocks produce identical ciphertext blocks. Never use ECB for multi-block payloads.</li>
      <li><strong>CBC Bit-Flipping</strong>: Modifying ciphertext block <em>C₁</em> flips corresponding bits in decrypted plaintext block <em>P₂</em>. Always enforce AEAD or HMAC.</li>
      <li><strong>CTR Two-Time Pad</strong>: Reusing a counter/nonce exposes <em>C₁ ⊕ C₂ = P₁ ⊕ P₂</em>, allowing adversaries to recover cleartext payloads.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-38A**: *Recommendation for Block Cipher Modes of Operation* — [NIST CSRC SP 800-38A](https://csrc.nist.gov/pubs/sp/800/38/a/final)
- **RFC 8452**: *AES-GCM-SIV: Nonce-Misuse-Resistant Authenticated Encryption* — [IETF RFC 8452](https://www.rfc-editor.org/rfc/rfc8452)""",

    "asymmetric-cryptography.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Asymmetric Cryptography Summary</strong>
    <ul>
      <li><strong>Private Keys Cannot Encrypt Data</strong>: Private keys are used for Digital Signing. Asymmetric encryption locks data under a recipient's Public Key (HPKE / RSA-OAEP).</li>
      <li><strong>RSA vs. ECC Efficiency</strong>: 256-bit Elliptic Curve keys (Curve25519 / P-256) provide equivalent security to 3072-bit RSA with 12× smaller key sizes.</li>
      <li><strong>HPKE (RFC 9180)</strong>: Standardized hybrid public-key encryption API combining KEM key exchange, HKDF expansion, and AEAD encryption.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 9180**: *Hybrid Public Key Encryption (HPKE)* — [IETF RFC 9180](https://www.rfc-editor.org/rfc/rfc9180)
- **NIST SP 800-56B Rev. 2**: *Recommendation for Pair-Wise Key-Establishment Schemes Using Integer Factorization Cryptography* — [NIST CSRC SP 800-56B](https://csrc.nist.gov/pubs/sp/800/56/b/r2/final)""",

    "symmetric-vs-asymmetric.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Symmetric vs. Asymmetric Summary</strong>
    <ul>
      <li><strong>Performance Trade-off</strong>: Symmetric encryption (AES-256) is ~1000× faster than asymmetric algorithms (RSA/ECC) and processes arbitrary payload sizes.</li>
      <li><strong>Key Distribution Problem</strong>: Asymmetric cryptography solves secret key distribution without requiring an out-of-band secret channel.</li>
      <li><strong>Hybrid Architecture</strong>: Production systems use asymmetric keys to negotiate or wrap a single-use symmetric DEK, which encrypts bulk data.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-57 Part 1 Rev. 5**: *Recommendation for Key Management: General* — [NIST CSRC SP 800-57](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)
- **RFC 8446**: *The Transport Layer Security (TLS) Protocol Version 1.3* — [IETF RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)""",

    "hash-functions-macs.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Hash &amp; MAC Summary</strong>
    <ul>
      <li><strong>Three Security Properties</strong>: Preimage resistance (one-way), Second-preimage resistance (target substitution proof), Collision resistance (any match proof).</li>
      <li><strong>HMAC Construction</strong>: HMAC uses double-nested key hashing (<code>ipad</code> / <code>opad</code>) to prevent Merkle–Damgård length-extension attacks.</li>
      <li><strong>Modern Sponge MACs</strong>: KMAC (SP 800-185) and BLAKE3 are inherently immune to length extension by design.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST FIPS 180-4**: *Secure Hash Standard (SHS)* — [NIST CSRC FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/final)
- **NIST FIPS 198-1**: *The Keyed-Hash Message Authentication Code (HMAC)* — [NIST CSRC FIPS 198-1](https://csrc.nist.gov/pubs/fips/198-1/final)
- **NIST SP 800-185**: *SHA-3 Derived Functions: cSHAKE, KMAC, TupleHash, and ParallelHash* — [NIST CSRC SP 800-185](https://csrc.nist.gov/pubs/sp/800/185/final)""",

    "hash-collisions-length-extension.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Hash Attacks Summary</strong>
    <ul>
      <li><strong>Broken Hashes</strong>: MD5 and SHA-1 have broken collision resistance. Never use MD5 or SHA-1 for digital signatures or security integrity.</li>
      <li><strong>Length-Extension Vulnerability</strong>: Naive MACs like <code>H(key \|\| message)</code> allow attackers to append data and forge valid tags without learning the key.</li>
      <li><strong>Mitigation Standard</strong>: Deploy HMAC-SHA256, KMAC, or SHA-3 to guarantee resistance against length extension.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-131A Rev. 2**: *Transitioning the Use of Cryptographic Algorithms and Key Lengths* — [NIST CSRC SP 800-131A](https://csrc.nist.gov/pubs/sp/800/131/a/r2/final)
- **SHAttered Attack**: *First Practical SHA-1 Collision Announcement* — [SHAttered Google/CWI Paper](https://shattered.io/)""",

    "key-exchange-derivation.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Key Exchange &amp; PFS Summary</strong>
    <ul>
      <li><strong>No Key Transmitted</strong>: Diffie-Hellman math derives matching shared secrets locally in RAM; no secret key ever crosses the network.</li>
      <li><strong>Perfect Forward Secrecy (PFS)</strong>: Ephemeral keys (ECDHE / X25519) are generated in RAM per connection and erased when done. Stealing a server disk key later cannot decrypt past recorded sessions.</li>
      <li><strong>HKDF Pipeline (RFC 5869)</strong>: Extracts raw Diffie-Hellman secrets into a master key (Extract) and expands independent sub-keys for client/server encryption (Expand).</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 7748**: *Elliptic Curves for Security (X25519)* — [IETF RFC 7748](https://www.rfc-editor.org/rfc/rfc7748)
- **RFC 5869**: *HMAC-based Extract-and-Expand Key Derivation Function (HKDF)* — [IETF RFC 5869](https://www.rfc-editor.org/rfc/rfc5869)
- **RFC 8446**: *The Transport Layer Security (TLS) Protocol Version 1.3* — [IETF RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)""",

    "digital-signatures.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Digital Signatures Summary</strong>
    <ul>
      <li><strong>Signature Pipeline</strong>: Signatures sign a cryptographic hash digest (<code>H(M)</code>) using <code>K<sub>priv</sub></code>; verifiers check the signature tag against <code>K<sub>pub</sub></code>.</li>
      <li><strong>ECDSA Nonce Hazard</strong>: Reusing a random nonce <code>k</code> across two ECDSA signatures leaks the private key. Use RFC 6979 deterministic nonces or Ed25519.</li>
      <li><strong>Post-Quantum Signatures</strong>: FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA) are finalized post-quantum signature standards.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST FIPS 186-5**: *Digital Signature Standard (DSS)* — [NIST CSRC FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final)
- **RFC 8032**: *Edwards-Curve Digital Signature Algorithm (EdDSA / Ed25519)* — [IETF RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)
- **RFC 6979**: *Deterministic Usage of the Digital Signature Algorithm (DSA) and ECDSA* — [IETF RFC 6979](https://www.rfc-editor.org/rfc/rfc6979)""",

    "certificates.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Certificates &amp; PKI Summary</strong>
    <ul>
      <li><strong>X.509 Trust Chain</strong>: Root CAs sign Intermediate CAs, which sign short-lived Leaf certificates (SAN fields enforce domain matching).</li>
      <li><strong>Automated ACME &amp; ARI</strong>: Cert lifespans are shrinking to 47–90 days; automated renewal via ACME (RFC 8555) and ARI is mandatory.</li>
      <li><strong>Pinning Trade-offs</strong>: Certificate/SPKI pinning protects mobile native apps against rogue CAs, but introduces self-inflicted DoS risks if backup pins are omitted. HPKP is deprecated in web browsers.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 5280**: *Internet X.509 Public Key Infrastructure Certificate and CRL Profile* — [IETF RFC 5280](https://www.rfc-editor.org/rfc/rfc5280)
- **RFC 8555**: *Automatic Certificate Management Environment (ACME)* — [IETF RFC 8555](https://www.rfc-editor.org/rfc/rfc8555)
- **RFC 7469**: *Public Key Pinning Extension for HTTP (Deprecation Notice)* — [IETF RFC 7469](https://www.rfc-editor.org/rfc/rfc7469)""",

    "tls-ssl-handshake.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>TLS Handshake Summary</strong>
    <ul>
      <li><strong>TLS 1.3 1-RTT Speed</strong>: Reduces handshake latency to 1 round-trip time; mandates AEAD ciphers and ephemeral key exchange (ECDHE).</li>
      <li><strong>Encrypted Client Hello (ECH)</strong>: Encrypts the SNI domain name header in <code>ClientHello</code> to defeat network surveillance.</li>
      <li><strong>0-RTT Replay Warning</strong>: 0-RTT early data is vulnerable to replay attacks; restrict 0-RTT strictly to idempotent <code>GET</code> requests.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 8446**: *The Transport Layer Security (TLS) Protocol Version 1.3* — [IETF RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)
- **RFC 8996**: *Deprecating TLS 1.0 and TLS 1.1* — [IETF RFC 8996](https://www.rfc-editor.org/rfc/rfc8996)""",

    "certificate-transparency.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Certificate Transparency Summary</strong>
    <ul>
      <li><strong>Public Append-Only Logs</strong>: CAs must log pre-certificates to public Merkle tree logs before issuing certificates.</li>
      <li><strong>Signed Certificate Timestamps (SCTs)</strong>: CAs receive SCT promises from CT logs and deliver them via X.509 extensions, TLS extensions, or OCSP stapling.</li>
      <li><strong>Browser Enforcement</strong>: Chrome and Safari reject TLS connections unless at least 2 independent SCTs from diverse log operators are presented.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 6962**: *Certificate Transparency* — [IETF RFC 6962](https://www.rfc-editor.org/rfc/rfc6962)
- **RFC 9162**: *Certificate Transparency Version 2.0* — [IETF RFC 9162](https://www.rfc-editor.org/rfc/rfc9162)""",

    "password-storage.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Password Storage Summary</strong>
    <ul>
      <li><strong>Argon2id (RFC 9106)</strong>: Winner of Password Hashing Competition; primary recommendation for password storage (memory-hard against GPU/ASIC attacks).</li>
      <li><strong>Bcrypt 72-Byte Truncation Limit</strong>: Bcrypt silently ignores characters beyond byte 72. Pre-hash long inputs with SHA-256 before passing to bcrypt.</li>
      <li><strong>Salts &amp; Peppers</strong>: 128-bit CSPRNG unique salt per user prevents rainbow tables; HSM pepper protects against database exfiltration.</li>
    </ul>
  </div>
</div>

## Primary References

- **RFC 9106**: *Argon2 Memory-Hard Function for Password Hashing and Proof-of-Work Applications* — [IETF RFC 9106](https://www.rfc-editor.org/rfc/rfc9106)
- **NIST SP 800-63B**: *Digital Identity Guidelines: Authentication and Lifecycle Management* — [NIST CSRC SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)""",

    "full-disk-file-encryption.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Disk &amp; File Encryption Summary</strong>
    <ul>
      <li><strong>IEEE 1619 AES-XTS</strong>: Standard sector block cipher mode preventing pattern leakage without altering sector size.</li>
      <li><strong>LUKS2 &amp; Argon2id</strong>: Linux disk encryption header format using Argon2id KDF to protect volume master keys.</li>
      <li><strong>Envelope Key Rotation</strong>: Key rotation rotates the Master KEK/CMEK inside KMS—NOT the bulk data. Older data is decrypted seamlessly via key version headers.</li>
    </ul>
  </div>
</div>

## Primary References

- **IEEE 1619-2018**: *IEEE Standard for Cryptographic Protection of Data on Block-Oriented Storage Devices* — [IEEE 1619 Standard](https://standards.ieee.org/ieee/1619/6966/)
- **NIST SP 800-38E**: *Recommendation for Block Cipher Modes of Operation: The XTS-AES Mode for Confidentiality on Storage Devices* — [NIST CSRC SP 800-38E](https://csrc.nist.gov/pubs/sp/800/38/e/final)
- **RFC 3394**: *Advanced Encryption Standard (AES) Key Wrap Algorithm* — [IETF RFC 3394](https://www.rfc-editor.org/rfc/rfc3394)""",

    "blockchain-cryptography.md": """## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Blockchain Cryptography Summary</strong>
    <ul>
      <li><strong>Hash Chains &amp; Immutability</strong>: Embedding block header hashes <code>H(Block<sub>n-1</sub>)</code> creates an immutable sequential ledger.</li>
      <li><strong>Merkle SPV Proofs</strong>: Light clients verify transaction inclusion in <code>O(log₂ N)</code> time without downloading full blocks.</li>
      <li><strong>Signature Schemes</strong>: Bitcoin uses secp256k1 ECDSA and Schnorr (BIP 340); Ethereum consensus uses BLS12-381 signature aggregation.</li>
    </ul>
  </div>
</div>

## Primary References

- **Bitcoin BIP 340**: *Schnorr Signatures for secp256k1* — [Bitcoin BIP 340 Specification](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)
- **BLS Signatures Draft**: *BLS Signatures IETF Draft Standard* — [draft-irtf-cfrg-bls-signature-05](https://datatracker.ietf.org/doc/draft-irtf-cfrg-bls-signature/)""",
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
