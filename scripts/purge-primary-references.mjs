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
