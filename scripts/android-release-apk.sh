#!/usr/bin/env bash
# Sync web assets and build a release-signed APK (requires keystore from android-keystore.sh).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
PROPS_FILE="$ANDROID_DIR/keystore.properties"
APK_RELEASE="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
APK_OUT="${SPENDT_RELEASE_APK_OUT:-$ANDROID_DIR/app/build/outputs/apk/release/SpendIt-release.apk}"

# shellcheck source=android-env.sh
source "$ROOT/scripts/android-env.sh"

usage() {
  cat <<EOF
Usage: android-release-apk.sh [options]

Builds a signed release APK (assembleRelease).

Options:
  --no-sync   Skip npm build + cap sync (only run Gradle)
  -h, --help  Show this help

Prerequisites:
  npm run cap:android:keystore   # once, to create keystore + keystore.properties
EOF
}

NO_SYNC=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-sync) NO_SYNC=1; shift ;;
    -h | --help) usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

require_android_sdk
require_android_project

if [[ ! -f "$PROPS_FILE" ]]; then
  echo "Missing $PROPS_FILE" >&2
  echo "Create a release keystore first: npm run cap:android:keystore" >&2
  exit 1
fi

if [[ "$NO_SYNC" -eq 0 ]]; then
  echo "Syncing web build into android/..."
  npm run build --prefix "$ROOT"
  bash "$ROOT/scripts/cap.sh" sync android
fi

echo "Building signed release APK..."
cd "$ANDROID_DIR"
./gradlew assembleRelease

if [[ ! -f "$APK_RELEASE" ]]; then
  echo "Release APK not found at: $APK_RELEASE" >&2
  exit 1
fi

cp -f "$APK_RELEASE" "$APK_OUT"

echo ""
echo "Signed release APK:"
echo "  $APK_RELEASE"
echo "  $APK_OUT"
echo ""
echo "Verify signature:"
echo "  apksigner verify --verbose \"$APK_OUT\""
