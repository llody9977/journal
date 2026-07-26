# Field Journal

Personal, ever-growing technical journal — currently focused on security
(cryptography foundations, PKI, key management, authentication/authorization,
network security, and applied/emerging topics), with room for other subjects
as new main groups later. Built as new entries get written up, one at a time.

Published via GitHub Pages (Jekyll, built in automatically by GitHub — no
build step to run manually).

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
bundle exec jekyll serve
```

Requires Ruby + Bundler. First run: `bundle init && bundle add jekyll` (or
add a `Gemfile` with `gem "github-pages", group: :jekyll_plugins`) if you
don't already have a Gemfile.
