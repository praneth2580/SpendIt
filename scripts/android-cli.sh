#!/usr/bin/env bash
# Build / run Android without opening Android Studio.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APK_DEBUG="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"

# shellcheck source=android-java.sh
source "$ROOT/scripts/android-java.sh"

configure_android_sdk() {
  if [[ -f "$ROOT/.env.capacitor.local" ]]; then
    set -a
    # shellcheck source=/dev/null
    . "$ROOT/.env.capacitor.local"
    set +a
  fi

  configure_java_for_android

  if [[ -z "${ANDROID_HOME:-}" && -d "$HOME/Android/Sdk" ]]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
  fi

  if [[ -n "${ANDROID_HOME:-}" ]]; then
    export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
  fi

  # Never launch Android Studio from Capacitor CLI.
  unset CAPACITOR_ANDROID_STUDIO_PATH
}

require_sdk() {
  configure_android_sdk
  if [[ -z "${ANDROID_HOME:-}" || ! -d "$ANDROID_HOME" ]]; then
    echo "ANDROID_HOME is not set and ~/Android/Sdk was not found." >&2
    exit 1
  fi
}

cmd_build() {
  require_sdk
  if [[ ! -d "$ROOT/android" ]]; then
    echo "android/ folder missing. Run: npm run cap:sync" >&2
    exit 1
  fi
  cd "$ROOT/android"
  ./gradlew assembleDebug
  echo ""
  echo "Debug APK: $APK_DEBUG"
}

cmd_install() {
  require_sdk
  if [[ ! -f "$APK_DEBUG" ]]; then
    echo "APK not found. Run: npm run cap:android:apk" >&2
    exit 1
  fi
  adb install -r "$APK_DEBUG"
}

cmd_devices() {
  require_sdk
  adb devices -l
}

cmd_run() {
  require_sdk
  exec bash "$ROOT/scripts/cap.sh" run android "${@:1}"
}

usage() {
  cat <<'EOF'
Usage: android-cli.sh <command>

  build     Gradle assembleDebug (APK only)
  install   adb install debug APK (device must be connected)
  run       cap run android (build, install, launch on device/emulator)
  devices   List connected adb devices

Examples:
  npm run cap:android          # sync web assets + run on device
  npm run cap:android:apk      # build APK only
  npm run cap:android:install  # install last debug APK
EOF
}

case "${1:-}" in
  build) cmd_build ;;
  install) cmd_install ;;
  run) shift; cmd_run "$@" ;;
  devices) cmd_devices ;;
  -h | --help | help) usage ;;
  *)
    echo "Unknown command: ${1:-}" >&2
    usage
    exit 1
    ;;
esac
