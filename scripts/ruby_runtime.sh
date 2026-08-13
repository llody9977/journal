#!/usr/bin/env bash

# Shared runtime resolution for the repository-local Jekyll commands.
# Source this file, then call resolve_journal_ruby <repository-root>.

resolve_journal_ruby() {
  local project_root="$1"
  local version_file="${project_root}/.ruby-version"
  local required_version
  local candidate
  local candidate_version
  local candidate_dir
  local bundle_version
  local -a candidates

  if [[ ! -f "${version_file}" ]]; then
    echo "Missing ${version_file}; cannot select the repository Ruby runtime." >&2
    return 1
  fi

  required_version="$(tr -d '[:space:]' < "${version_file}")"
  required_version="${required_version#ruby-}"
  if [[ -z "${required_version}" ]]; then
    echo "${version_file} does not contain a Ruby version." >&2
    return 1
  fi

  candidates=()
  if [[ -n "${JOURNAL_RUBY_BIN:-}" ]]; then
    candidates+=("${JOURNAL_RUBY_BIN}")
  fi
  if command -v ruby >/dev/null 2>&1; then
    candidates+=("$(command -v ruby)")
  fi
  candidates+=(
    "/opt/homebrew/opt/ruby@3.3/bin/ruby"
    "/usr/local/opt/ruby@3.3/bin/ruby"
    "/opt/homebrew/opt/ruby/bin/ruby"
    "/usr/local/opt/ruby/bin/ruby"
    "/opt/homebrew/bin/ruby"
    "/usr/local/bin/ruby"
  )

  JOURNAL_RUBY_BIN=""
  JOURNAL_BUNDLE_BIN=""
  for candidate in "${candidates[@]}"; do
    [[ -x "${candidate}" ]] || continue
    candidate_version="$("${candidate}" -e 'print RUBY_VERSION' 2>/dev/null || true)"
    [[ "${candidate_version}" == "${required_version}" ]] || continue

    candidate_dir="$(cd "$(dirname "${candidate}")" && pwd)"
    if [[ -x "${candidate_dir}/bundle" ]]; then
      JOURNAL_RUBY_BIN="${candidate}"
      JOURNAL_BUNDLE_BIN="${candidate_dir}/bundle"
      break
    fi
  done

  if [[ -z "${JOURNAL_RUBY_BIN}" ]]; then
    cat >&2 <<EOF
Ruby ${required_version} with Bundler was not found.

Install the version in .ruby-version with a Ruby version manager, or on macOS
with Homebrew, then rerun bin/setup. To use a non-standard executable, set:

  JOURNAL_RUBY_BIN=/absolute/path/to/ruby bin/setup
EOF
    return 1
  fi

  bundle_version="$(awk '/^BUNDLED WITH$/ { getline; gsub(/^[[:space:]]+|[[:space:]]+$/, ""); print; exit }' "${project_root}/Gemfile.lock")"
  if [[ -z "${bundle_version}" ]]; then
    echo "Gemfile.lock does not declare a BUNDLED WITH version." >&2
    return 1
  fi

  if ! "${JOURNAL_BUNDLE_BIN}" "_${bundle_version}_" --version >/dev/null 2>&1; then
    cat >&2 <<EOF
Ruby ${required_version} is available, but Bundler ${bundle_version} is not.
Install it for the selected runtime, then rerun bin/setup:

  "${JOURNAL_RUBY_BIN}" -S gem install bundler:${bundle_version}
EOF
    return 1
  fi

  JOURNAL_RUBY_VERSION="${required_version}"
  JOURNAL_BUNDLER_VERSION="${bundle_version}"
  export JOURNAL_RUBY_BIN JOURNAL_BUNDLE_BIN JOURNAL_RUBY_VERSION JOURNAL_BUNDLER_VERSION
}
