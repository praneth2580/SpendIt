#!/usr/bin/env bash
# Build / run Android without opening Android Studio.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APK_DEBUG="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"

# shellcheck source=android-env.sh
source "$ROOT/scripts/android-env.sh"

require_sdk() {
  require_android_sdk
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
  npm run cap:android:apk      # build debug APK only
  npm run cap:android:keystore # create release keystore (once)
  npm run cap:android:release  # build signed release APK
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
