#!/usr/bin/env bash
# Create a release keystore and android/keystore.properties for signed APK builds.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
KEYSTORE_NAME="${SPENDT_KEYSTORE_NAME:-spendt-release.keystore}"
KEYSTORE_PATH="${SPENDT_KEYSTORE_PATH:-$ANDROID_DIR/$KEYSTORE_NAME}"
PROPS_FILE="${SPENDT_KEYSTORE_PROPS:-$ANDROID_DIR/keystore.properties}"
KEY_ALIAS="${SPENDT_KEY_ALIAS:-spendt}"
VALIDITY_DAYS="${SPENDT_KEY_VALIDITY_DAYS:-10000}"

# shellcheck source=android-env.sh
source "$ROOT/scripts/android-env.sh"
configure_android_sdk

usage() {
  cat <<EOF
Usage: android-keystore.sh [options]

Creates a release keystore and $PROPS_FILE (gitignored).

Options:
  --force     Delete existing keystore and recreate (destructive)
  -h, --help  Show this help

Environment (optional, for non-interactive use):
  SPENDT_STORE_PASSWORD   Keystore password
  SPENDT_KEY_PASSWORD     Key password (defaults to store password)
  SPENDT_KEY_ALIAS        Key alias (default: spendt)
  SPENDT_KEYSTORE_PATH    Keystore file path
EOF
}

FORCE=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE=1; shift ;;
    -h | --help) usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -f "$KEYSTORE_PATH" ]]; then
  if [[ "$FORCE" -ne 1 ]]; then
    echo "Keystore already exists: $KEYSTORE_PATH" >&2
    echo "Use --force to recreate, or run: npm run cap:android:release" >&2
    exit 1
  fi
  rm -f "$KEYSTORE_PATH"
fi

prompt_secret() {
  local prompt="$1"
  local var_name="$2"
  local value="${!var_name:-}"
  if [[ -n "$value" ]]; then
    return 0
  fi
  read -rsp "$prompt" value
  echo
  if [[ -z "$value" ]]; then
    echo "Password cannot be empty." >&2
    exit 1
  fi
  printf -v "$var_name" '%s' "$value"
}

STORE_PASSWORD="${SPENDT_STORE_PASSWORD:-}"
KEY_PASSWORD="${SPENDT_KEY_PASSWORD:-}"

prompt_secret "Keystore password: " STORE_PASSWORD
# Keytool defaults to PKCS12 and does not support different store/key passwords.
# If a different key password is provided, keytool will ignore it and set keypass=storepass.
KEY_PASSWORD="$STORE_PASSWORD"

DNAME="${SPENDT_KEY_DNAME:-CN=Spendt, OU=Mobile, O=Spendt, L=Unknown, ST=Unknown, C=US}"

mkdir -p "$(dirname "$KEYSTORE_PATH")"

echo "Creating keystore at: $KEYSTORE_PATH"
keytool -genkeypair -v \
  -keystore "$KEYSTORE_PATH" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity "$VALIDITY_DAYS" \
  -storepass "$STORE_PASSWORD" \
  -keypass "$KEY_PASSWORD" \
  -dname "$DNAME"

# storeFile path relative to android/ (Gradle rootProject)
if [[ "$KEYSTORE_PATH" == "$ANDROID_DIR/"* ]]; then
  STORE_FILE_REL="${KEYSTORE_PATH#"$ANDROID_DIR/"}"
else
  STORE_FILE_REL="$KEYSTORE_PATH"
fi

cat >"$PROPS_FILE" <<EOF
storeFile=$STORE_FILE_REL
storePassword=$STORE_PASSWORD
keyAlias=$KEY_ALIAS
keyPassword=$KEY_PASSWORD
EOF

chmod 600 "$PROPS_FILE" 2>/dev/null || true

echo ""
echo "Done."
echo "  Keystore:  $KEYSTORE_PATH"
echo "  Properties: $PROPS_FILE"
echo ""
echo "Back up the keystore and passwords — you need them for every Play Store update."
echo "Build a signed release APK with: npm run cap:android:release"
