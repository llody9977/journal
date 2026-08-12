import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The reviewed SVGs under assets/img are the canonical diagram sources. Earlier
// versions of this utility also contained independent drawing definitions; those
// definitions drifted from hand-reviewed accessibility and layout corrections and
// could silently overwrite approved artwork. This exporter now copies the exact
// managed asset set, so clean builds are deterministic and repository runs are
// non-destructive.
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const canonicalDirectory = path.join(repositoryRoot, "assets", "img");
const outputDirectory = process.env.JOURNAL_DIAGRAM_OUTPUT_DIR
  ? path.resolve(process.env.JOURNAL_DIAGRAM_OUTPUT_DIR)
  : canonicalDirectory;

const managedDiagrams = [
  "aes-round-operations.svg",
  "authentication-assurance-levels.svg",
  "aws-sts-mechanisms.svg",
  "blockchain-cryptography-layers.svg",
  "cbc-bitflip.svg",
  "certificate-lifecycle.svg",
  "certificate-lifetime-timeline.svg",
  "certificate-transparency-merkle-tree.svg",
  "cis-implementation-groups.svg",
  "cmmi-maturity-levels.svg",
  "common-criteria-eal.svg",
  "cryptography-threats.svg",
  "ctr-two-time-pad.svg",
  "defense-in-depth-architecture.svg",
  "defense-in-depth-layers.svg",
  "dns-cache-poisoning.svg",
  "ecb-openssl-block-leak.svg",
  "envelope-encryption.svg",
  "full-disk-encryption-scope.svg",
  "grc-framework-stack.svg",
  "hash-security-properties.svg",
  "hkdf-extract-expand.svg",
  "http-authentication-challenge.svg",
  "hybrid-public-key-encryption.svg",
  "identity-access-architecture.svg",
  "iso-27001-27002-relationship.svg",
  "mcp-oauth-discovery.svg",
  "nist-csf-functions.svg",
  "operational-resilience-bcdr.svg",
  "owasp-guides-compared.svg",
  "owasp-samm-functions.svg",
  "quantum-algorithm-impact.svg",
  "risk-fundamentals-engine.svg",
  "risk-management-lifecycle.svg",
  "risk-scenario-breakdown.svg",
  "saml-sp-initiated-flow.svg",
  "sct-flow.svg",
  "security-domains-overlap.svg",
  "security-objectives-properties-matrix.svg",
  "security-program-implementation-roadmap.svg",
  "security-program-roadmap.svg",
  "security-token-service-flow.svg",
  "sender-constrained-tokens.svg",
  "ssh-user-ca.svg",
  "step-up-authentication-flow.svg",
  "threat-frameworks-architecture.svg",
  "threat-modeling-questions.svg",
  "tls-cryptography-layers.svg",
  "trust-boundaries-threat-modeling.svg",
  "webauthn-components.svg",
];

const missingDiagrams = managedDiagrams.filter(
  (filename) => !fs.existsSync(path.join(canonicalDirectory, filename)),
);

if (missingDiagrams.length > 0) {
  throw new Error(
    `Missing canonical journal diagrams: ${missingDiagrams.join(", ")}`,
  );
}

if (outputDirectory !== canonicalDirectory) {
  fs.mkdirSync(outputDirectory, { recursive: true });
  for (const filename of managedDiagrams) {
    fs.copyFileSync(
      path.join(canonicalDirectory, filename),
      path.join(outputDirectory, filename),
    );
  }
  console.log(
    `Exported ${managedDiagrams.length} canonical journal SVG diagrams to ${outputDirectory}`,
  );
} else {
  console.log(
    `Verified ${managedDiagrams.length} canonical journal SVG diagrams in ${canonicalDirectory}`,
  );
}
