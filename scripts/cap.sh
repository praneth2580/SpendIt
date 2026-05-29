#!/usr/bin/env bash
# Capacitor 8 requires Node.js >= 22. Use nvm when the active Node is too old.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

required_major=22

node_major() {
  node -p "Number(process.versions.node.split('.')[0])"
}

# Use an already-installed nvm Node 22 without loading nvm.sh (avoids prefix conflicts).
activate_nvm_node22_from_disk() {
  local nvm_dir="${NVM_DIR:-$HOME/.nvm}"
  local versions_dir="$nvm_dir/versions/node"
  local version_dir

  [[ -d "$versions_dir" ]] || return 1

  version_dir="$(ls -1d "$versions_dir"/v22.* 2>/dev/null | sort -V | tail -1)"
  [[ -n "$version_dir" && -x "$version_dir/bin/node" ]] || return 1

  export PATH="$version_dir/bin:$PATH"
  hash -r
  return 0
}

use_nvm_node() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

  if activate_nvm_node22_from_disk && [[ "$(node_major)" -ge required_major ]]; then
    return 0
  fi

  if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
    echo "Capacitor CLI requires Node.js >= ${required_major}. Current: $(node -v)" >&2
    echo "Install Node ${required_major} LTS: https://nodejs.org/" >&2
    echo "Or install nvm: https://github.com/nvm-sh/nvm" >&2
    exit 1
  fi

  # nvm breaks when npm_config_prefix points at system npm (common on Linux).
  unset npm_config_prefix

  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"

  if [[ -f "$ROOT/.nvmrc" ]]; then
    nvm install --no-progress
    nvm use --silent
  else
    nvm install --no-progress "$required_major"
    nvm use --silent "$required_major"
  fi
}

if [[ "$(node_major)" -lt required_major ]]; then
  use_nvm_node
fi

if [[ "$(node_major)" -lt required_major ]]; then
  echo "Capacitor CLI requires Node.js >= ${required_major}. Current: $(node -v)" >&2
  exit 1
fi

# Optional local overrides (not committed).
if [[ -f "$ROOT/.env.capacitor.local" ]]; then
  set -a
  # shellcheck source=/dev/null
  . "$ROOT/.env.capacitor.local"
  set +a
fi

configure_android_env() {
  # shellcheck source=android-java.sh
  source "$ROOT/scripts/android-java.sh"
  configure_java_for_android

  if [[ -z "${ANDROID_HOME:-}" && -d "$HOME/Android/Sdk" ]]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
  fi

  if [[ -n "${ANDROID_HOME:-}" ]]; then
    export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
  fi

  # CLI-only workflow — do not auto-launch Android Studio.
  unset CAPACITOR_ANDROID_STUDIO_PATH
}

configure_android_env

exec npx cap "$@"
