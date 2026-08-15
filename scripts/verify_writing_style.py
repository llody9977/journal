#!/usr/bin/env python3
import os
import sys
import re

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
topics_dir = os.path.join(repo_root, "topics")

files = sorted([f for f in os.listdir(topics_dir) if f.endswith(".md")])

# WRITING_STYLE.md requires US spelling throughout. Nothing enforced it, so
# British forms survived on pages that spell the same word the US way elsewhere.
# Only unambiguous pairs are listed: words like "analyses" (the correct US plural
# of "analysis") and "practice" are excluded because both spellings are valid US
# English depending on part of speech.
US_SPELLING = {
    "organisation": "organization", "organisations": "organizations",
    "organise": "organize", "organised": "organized", "organising": "organizing",
    "authorise": "authorize", "authorised": "authorized", "authorising": "authorizing",
    "authorisation": "authorization", "authorisations": "authorizations",
    "categorise": "categorize", "categorised": "categorized",
    "categorisation": "categorization",
    "behaviour": "behavior", "behaviours": "behaviors", "behavioural": "behavioral",
    "colour": "color", "colours": "colors",
    "centre": "center", "centres": "centers", "centred": "centered",
    "defence": "defense", "defences": "defenses",
    "recognise": "recognize", "recognised": "recognized",
    "minimise": "minimize", "minimised": "minimized",
    "maximise": "maximize", "maximised": "maximized",
    "normalise": "normalize", "normalised": "normalized",
    "utilise": "utilize", "utilised": "utilized",
    "prioritise": "prioritize", "prioritised": "prioritized",
    "summarise": "summarize", "summarised": "summarized",
    "emphasise": "emphasize", "emphasised": "emphasized",
    "optimise": "optimize", "optimised": "optimized",
    "standardise": "standardize", "standardised": "standardized",
    "specialise": "specialize", "specialised": "specialized",
    "synchronise": "synchronize", "synchronised": "synchronized",
    "catalogue": "catalog", "catalogues": "catalogs", "catalogued": "cataloged",
    "artefact": "artifact", "artefacts": "artifacts",
    "labelled": "labeled", "labelling": "labeling",
    "modelling": "modeling", "travelling": "traveling",
    "fulfil": "fulfill", "enrolment": "enrollment",
    "programme": "program", "programmes": "programs",
    "judgement": "judgment", "judgements": "judgments",
    "ageing": "aging", "offence": "offense", "offences": "offenses",
    "sceptic": "skeptic", "sceptical": "skeptical",
    "whilst": "while", "amongst": "among", "learnt": "learned",
}

# Proper nouns and URL paths legitimately carry non-US spellings.
SPELLING_EXEMPT = re.compile(
    r"https?://\S+"
    r"|Canadian Centre for Cyber Security"
    r"|National Cyber Security Centre"
    r"|Centre for Cyber Security"
)

print(f"Running automated page-structure checks across {len(files)} topic files...\n")

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

    # 5. US spelling (WRITING_STYLE.md). Proper nouns and URLs are exempt.
    spell_text = SPELLING_EXEMPT.sub(" ", content)
    for line_number, line in enumerate(spell_text.splitlines(), start=1):
        for british, american in US_SPELLING.items():
            for match in re.finditer(r"\b" + british + r"\b", line, re.I):
                file_errors.append(
                    f"line {line_number}: non-US spelling '{match.group(0)}' "
                    f"— use '{american}'"
                )

    if file_errors:
        errors.append((fname, file_errors))

if errors:
    print(f"❌ Quality gate FAILED with errors in {len(errors)} file(s):\n")
    for fname, errs in errors:
        print(f"  File: {fname}")
        for err in errs:
            print(f"    - {err}")
    sys.exit(1)

print(f"✅ All {len(files)} topic files passed the automated structural checks.")
print("ℹ️  These checks do not verify factual accuracy, standards applicability, semantic completeness, or cross-format consistency.")
sys.exit(0)
