// RETIRED LEGACY SCRIPT — DO NOT RUN.
//
// This was a one-time migration utility that deleted every "## Primary
// references" (or "## Primary References") section site-wide. The current
// style guide explicitly requires that section on every substantial page —
// running this now would strip mandatory content, not obsolete content.
//
// Moved to scripts/legacy/ and disabled so it cannot be run by accident and
// undo the canonical page-ending structure. Left as read-only history of a
// completed one-time migration, not an active or reusable utility.

throw new Error(
  "purge-primary-references.mjs is a retired one-time legacy migration " +
  "script (see header). The 'Primary references' section it deletes is " +
  "mandatory under the current style guide. Refusing to execute.",
);

/* Original script body, preserved for historical reference only:

import fs from "node:fs";
import path from "node:path";

const topicsDir = path.resolve("topics");
const files = fs.readdirSync(topicsDir).filter(f => f.endsWith(".md"));

let cleanedCount = 0;

for (const file of files) {
  const filePath = path.join(topicsDir, file);
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  // Remove ## Primary references or ## Primary References and everything under it until next header or end of file
  content = content.replace(/## Primary [Rr]eferences[\s\S]*?(?=##|\n---|\n#|$)/g, "");

  // Clean trailing empty lines
  content = content.trimEnd() + "\n";

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    cleanedCount++;
    console.log(`Purged Primary References from: ${file}`);
  }
}

console.log(`Total files updated: ${cleanedCount}`);

*/
