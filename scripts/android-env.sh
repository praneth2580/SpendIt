#!/usr/bin/env bash
# Shared Android SDK / Java setup for Gradle scripts.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

configure_android_sdk() {
  if [[ -f "$ROOT/.env.capacitor.local" ]]; then
    set -a
    # shellcheck source=/dev/null
    . "$ROOT/.env.capacitor.local"
    set +a
  fi

  # shellcheck source=android-java.sh
  source "$ROOT/scripts/android-java.sh"
  configure_java_for_android

  if [[ -z "${ANDROID_HOME:-}" && -d "$HOME/Android/Sdk" ]]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
  fi

  if [[ -n "${ANDROID_HOME:-}" ]]; then
    export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
  fi

  unset CAPACITOR_ANDROID_STUDIO_PATH
}

require_android_sdk() {
  configure_android_sdk
  if [[ -z "${ANDROID_HOME:-}" || ! -d "$ANDROID_HOME" ]]; then
    echo "ANDROID_HOME is not set and ~/Android/Sdk was not found." >&2
    exit 1
  fi
}

require_android_project() {
  if [[ ! -d "$ROOT/android" ]]; then
    echo "android/ folder missing. Run: npm run cap:sync" >&2
    exit 1
  fi
}
