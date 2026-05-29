#!/usr/bin/env bash
# Restore a release keystore from a backup folder (another PC / USB / cloud).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
KEYSTORE_NAME="${SPENDT_KEYSTORE_NAME:-spendt-release.keystore}"
DEST_KEYSTORE="$ANDROID_DIR/$KEYSTORE_NAME"
DEST_PROPS="$ANDROID_DIR/keystore.properties"
KEY_ALIAS="${SPENDT_KEY_ALIAS:-spendt}"

usage() {
  cat <<EOF
Usage: android-keystore-import.sh <backup-folder> [--force]

Copies spendt-release.keystore (and keystore.properties if present) into android/.

Example:
  npm run cap:android:keystore:import -- ./spendt-keystore-backup

Options:
  --force   Overwrite existing keystore in android/
EOF
}

FORCE=0
BACKUP_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE=1; shift ;;
    -h | --help) usage; exit 0 ;;
    -*)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
    *)
      if [[ -z "$BACKUP_DIR" ]]; then
        BACKUP_DIR="$1"
        shift
      else
        echo "Unexpected argument: $1" >&2
        usage
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$BACKUP_DIR" ]]; then
  usage
  exit 1
fi

if [[ ! -d "$BACKUP_DIR" ]]; then
  echo "Backup folder not found: $BACKUP_DIR" >&2
  exit 1
fi

# Find keystore in backup (support custom names)
SRC_KEYSTORE=""
for candidate in "$BACKUP_DIR/$KEYSTORE_NAME" "$BACKUP_DIR"/*.keystore; do
  if [[ -f "$candidate" ]]; then
    SRC_KEYSTORE="$candidate"
    break
  fi
done

if [[ -z "$SRC_KEYSTORE" ]]; then
  echo "No .keystore file found in: $BACKUP_DIR" >&2
  exit 1
fi

if [[ -f "$DEST_KEYSTORE" && "$FORCE" -ne 1 ]]; then
  echo "Keystore already exists: $DEST_KEYSTORE" >&2
  echo "Use --force to overwrite." >&2
  exit 1
fi

mkdir -p "$ANDROID_DIR"
cp -f "$SRC_KEYSTORE" "$DEST_KEYSTORE"
echo "Installed keystore: $DEST_KEYSTORE"

SRC_PROPS="$BACKUP_DIR/keystore.properties"
if [[ -f "$SRC_PROPS" ]]; then
  cp -f "$SRC_PROPS" "$DEST_PROPS"
  chmod 600 "$DEST_PROPS" 2>/dev/null || true
  echo "Installed properties: $DEST_PROPS"
  echo ""
  echo "Ready. Build signed APK: npm run cap:android:release"
  exit 0
fi

# No properties file — create one interactively
if [[ -f "$DEST_PROPS" ]]; then
  echo "keystore.properties already exists; leaving it unchanged."
  echo "Build signed APK: npm run cap:android:release"
  exit 0
fi

echo ""
echo "No keystore.properties in backup. Create android/keystore.properties now."
read -rsp "Keystore password: " STORE_PASSWORD
echo
# Keytool defaults to PKCS12 and does not support different store/key passwords.
KEY_PASSWORD="$STORE_PASSWORD"

cat >"$DEST_PROPS" <<EOF
storeFile=$KEYSTORE_NAME
storePassword=$STORE_PASSWORD
keyAlias=$KEY_ALIAS
keyPassword=$KEY_PASSWORD
EOF

chmod 600 "$DEST_PROPS" 2>/dev/null || true
echo "Wrote: $DEST_PROPS"
echo ""
echo "Ready. Build signed APK: npm run cap:android:release"
