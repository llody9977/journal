// RETIRED LEGACY SCRIPT — DO NOT RUN.
//
// This was a one-time migration utility that stripped the OLD "What to
// remember" callout (a title string distinct from the current, canonical
// "What I need to remember" callout WRITING_STYLE.md specifies) and old
// "Foundational Security Engineering Topics" / "Foundational Reading
// Sequence" sections. It predates and has nothing to do with the current
// site-wide callout format used by every topic page today.
//
// Running this against the current tree would be a no-op for its own
// targeted pattern (the old title string no longer exists anywhere), but
// keeping it executable at all invites exactly the kind of confusion that
// caused this repo to be reviewed for it — so it now refuses to run.
//
// Moved to scripts/legacy/ and disabled. The original body is preserved
// below as line comments (not a block comment) because one of its own
// regex literals contains a literal `*/` sequence that would otherwise
// terminate a /* */ block comment early and reintroduce a syntax error.
//
// Original script body, preserved for historical reference only:
//
// import fs from "node:fs";
// import path from "node:path";
//
// const topicsDir = path.resolve("topics");
// const files = fs.readdirSync(topicsDir).filter(f => f.endsWith(".md"));
//
// let cleanedCount = 0;
//
// for (const file of files) {
//   const filePath = path.join(topicsDir, file);
//   let content = fs.readFileSync(filePath, "utf8");
//   let original = content;
//
//   // 1. Remove <div class="callout">...What to remember...</div>
//   content = content.replace(/<div class="callout">\s*<span class="callout-title">What to remember<\/span>[\s\S]*?<\/div>\s*/g, "");
//
//   // 2. Remove "## Foundational Security Engineering Topics" or "### Foundational Reading Sequence" sections
//   content = content.replace(/## Foundational Security Engineering Topics[\s\S]*?(?=##|\n---|\n#|$)/g, "");
//   content = content.replace(/### Foundational Reading Sequence[\s\S]*?(?=##|###|\n---|\n#|$)/g, "");
//
//   // 3. Clean up extra blank lines before Primary references or section breaks
//   content = content.replace(/\n{3,}/g, "\n\n");
//
//   if (content !== original) {
//     fs.writeFileSync(filePath, content, "utf8");
//     cleanedCount++;
//     console.log(`Cleaned: ${file}`);
//   }
// }
//
// console.log(`Total files cleaned: ${cleanedCount}`);

throw new Error(
  "purge-callouts-and-nav-blocks.mjs is a retired one-time legacy migration " +
  "script (see header). It must not be run against the current tree, which " +
  "uses the canonical callout/Primary-references format this script does " +
  "not know about. Refusing to execute.",
);
