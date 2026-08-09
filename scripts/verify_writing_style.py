#!/usr/bin/env python3
import os
import sys
import re

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
topics_dir = os.path.join(repo_root, "topics")

files = sorted([f for f in os.listdir(topics_dir) if f.endswith(".md")])

print(f"Running WRITING_STYLE.md automated quality gate across {len(files)} topic files...\n")

errors = []

for fname in files:
    fpath = os.path.join(topics_dir, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    
    file_errors = []
    
    # 1. Check last_verified in frontmatter
    if not re.search(r"last_verified:\s*\d{4}-\d{2}-\d{2}", content):
        file_errors.append("Missing valid 'last_verified: YYYY-MM-DD' in frontmatter")
    
    # 2. Check 'What I Need to Remember'
    if "What I Need to Remember" not in content and "What I need to remember" not in content:
        file_errors.append("Missing '## What I Need to Remember' recall section")
        
    # 3. Check 'Primary References'
    if "Primary References" not in content and "Primary references" not in content:
        file_errors.append("Missing '## Primary References' section")
    else:
        # Check that it contains at least one markdown link [Text](http...)
        refs_section = content.split("Primary References")[-1] if "Primary References" in content else content.split("Primary references")[-1]
        if not re.search(r"\[.+\]\(https?://.+\)", refs_section):
            file_errors.append("'Primary References' section contains no valid primary source HTTP links")
            
    # 4. Check for TODO, FIXME, TBD, or unfulfilled bracket placeholders (ignoring HTML placeholder="...")
    # Strip HTML placeholder attributes first before testing
    clean_text = re.sub(r'placeholder="[^"]*"', '', content)
    if re.search(r"\b(TODO|FIXME|TBD|PLACEHOLDER_[A-Z0-9]+)\b", clean_text):
        file_errors.append("Contains unfulfilled TODO / FIXME / TBD / PLACEHOLDER text")
        
    if file_errors:
        errors.append((fname, file_errors))

if errors:
    print(f"❌ Quality gate FAILED with errors in {len(errors)} file(s):\n")
    for fname, errs in errors:
        print(f"  File: {fname}")
        for err in errs:
            print(f"    - {err}")
    sys.exit(1)

print(f"✅ All {len(files)} topic files passed the WRITING_STYLE.md quality gate perfectly!")
sys.exit(0)
