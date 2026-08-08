import fs from "node:fs";
import path from "node:path";

const topicsDir = path.resolve("topics");
const files = fs.readdirSync(topicsDir).filter(f => f.endsWith(".md"));

let cleanedCount = 0;

for (const file of files) {
  const filePath = path.join(topicsDir, file);
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  // 1. Remove <div class="callout">...What to remember...</div>
  content = content.replace(/<div class="callout">\s*<span class="callout-title">What to remember<\/span>[\s\S]*?<\/div>\s*/g, "");

  // 2. Remove "## Foundational Security Engineering Topics" or "### Foundational Reading Sequence" sections
  content = content.replace(/## Foundational Security Engineering Topics[\s\S]*?(?=##|\n---|\n#|$)/g, "");
  content = content.replace(/### Foundational Reading Sequence[\s\S]*?(?=##|###|\n---|\n#|$)/g, "");

  // 3. Clean up extra blank lines before Primary references or section breaks
  content = content.replace(/\n{3,}/g, "\n\n");

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    cleanedCount++;
    console.log(`Cleaned: ${file}`);
  }
}

console.log(`Total files cleaned: ${cleanedCount}`);
