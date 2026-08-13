# Ruby-version compatibility shim for running the `github-pages` gem
# locally on a modern Ruby — not a project dependency, not a Jekyll plugin.
#
# `github-pages` pins Jekyll 3.10.x / Liquid 4.0.x to match GitHub Pages'
# actual production build. Those gems still call String#tainted? (part of
# Ruby's old taint-checking mechanism, deprecated in 2.7 and removed in
# 3.2+), which crashes every build on modern local Rubies with:
#   undefined method 'tainted?' for an instance of String (NoMethodError)
#
# github-pages also forces Jekyll's safe mode, which ignores custom
# _plugins/ files, and defining this at the top of the Gemfile does not
# reliably survive into the process `bundle exec` actually runs the target
# command in. Loading it via `-r` at Ruby startup (see bin/jekyll) is the
# one mechanism confirmed to work.
#
# Only defines these when genuinely missing, so this is a no-op on any
# Ruby that still has them — including whatever actions/jekyll-build-pages
# runs in CI — and only bridges the gap locally.
unless String.method_defined?(:tainted?)
  class Object
    def tainted?
      false
    end

    def taint
      self
    end

    def untaint
      self
    end
  end
end
