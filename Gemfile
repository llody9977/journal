source "https://rubygems.org"

# Match the GitHub Pages gem set currently shipped by
# actions/jekyll-build-pages@v1.0.13 in .github/workflows/deploy.yml. Keep this
# pin synchronized when that action image changes.
gem "github-pages", "= 232", group: :jekyll_plugins
gem "jekyll-include-cache", "= 0.2.1"
gem "jekyll-octicons", "~> 14.2"

# Keep live reload available for the repository's local preview command.
gem "jekyll-livereload"

# Ruby 3+ dropped webrick from the standard library; Jekyll's dev server
# still depends on it.
gem "webrick"
