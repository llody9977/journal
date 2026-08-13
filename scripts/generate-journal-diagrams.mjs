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

// Derive the export set from the canonical directory. A hand-maintained list
// can silently omit a newly added or corrected diagram even though the live
// site references it.
const managedDiagrams = fs
  .readdirSync(canonicalDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".svg"))
  .map((entry) => entry.name)
  .sort();

if (managedDiagrams.length === 0) {
  throw new Error(`No canonical SVG diagrams found in ${canonicalDirectory}`);
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
