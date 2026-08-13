# Field Journal

[![Deploy Journal to Pages](https://github.com/llody9977/journal/actions/workflows/deploy.yml/badge.svg)](https://github.com/llody9977/journal/actions/workflows/deploy.yml)

**Live site:** https://llody9977.github.io/journal/

## About

A personal, ever-growing technical journal — currently focused on security
(cryptography foundations, PKI, key management, authentication/authorization,
network security, and applied/emerging topics), with room for other subjects
as new main groups later. Built as new entries get written up, one at a time,
researched and verified rather than written from memory alone.

Published via GitHub Pages, built and deployed by the GitHub Actions workflow
above on every push to `main` — no manual build or deploy step required.

## Writing standard

All journal entries follow [`WRITING_STYLE.md`](WRITING_STYLE.md): a concise, recall-first personal voice, US English, primary references, and a writing framework selected for the topic.

All targeted verifications, fresh reviews, final passes, and gap assessments follow [`REVIEW_STANDARD.md`](REVIEW_STANDARD.md). Reviews are read-only by default and may claim complete closure only after satisfying its documented coverage and evidence requirements.

Fresh reviews freeze an exact baseline with [`scripts/capture_review_state.py`](scripts/capture_review_state.py) and use [`reviews/REVIEW_TEMPLATE.md`](reviews/REVIEW_TEMPLATE.md) to record scope, claims, completeness, independent review passes, checks, findings, and limitations. Targeted fix verification is deliberately kept separate from full-review closure.

Deliberate technical decisions are recorded in [`reviews/CONTENT_DECISIONS.yml`](reviews/CONTENT_DECISIONS.yml) under the workflow in [`reviews/CONTENT_DECISION_GUIDE.md`](reviews/CONTENT_DECISION_GUIDE.md). Reviewers evaluate current evidence first, then reconcile applicable records so an earlier decision is neither blindly inherited nor silently reversed.

## Structure

- `index.md` — landing page / overview
- `topics/*.md` — one deep-dive page per subtopic
- `_data/nav.yml` — sidebar navigation and site map; add an entry here (with
  a `url`) when a new topic page goes live, or without a `url` to list it as
  a planned "Soon" placeholder
- `_layouts/`, `_includes/` — shared page chrome (header, sidebar, footer)
- `assets/` — CSS and JS

## Adding a new topic

1. Create `topics/<slug>.md` with front matter:
   ```yaml
   ---
   title: Page Title
   description: One-line summary for <meta description>.
   ---
   ```
2. Add an entry (with `url: /topics/<slug>/`) under the relevant section in
   `_data/nav.yml`.
3. Commit and push — GitHub Pages rebuilds automatically.

## Local preview

```bash
bin/setup
bin/jekyll serve --livereload
```

The repository pins the Ruby version, Bundler version, and GitHub Pages gem
set used for local builds. `bin/setup` installs the locked gems under the
ignored `vendor/bundle` directory; `bin/jekyll` then uses that exact runtime.
If the required Ruby or Bundler version is missing, the setup command prints
the installation command or version-manager action needed before retrying.
