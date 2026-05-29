#!/usr/bin/env bash
# Package release keystore (+ optional properties) for use on another machine.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
KEYSTORE_PATH="${SPENDT_KEYSTORE_PATH:-$ANDROID_DIR/spendt-release.keystore}"
PROPS_FILE="${SPENDT_KEYSTORE_PROPS:-$ANDROID_DIR/keystore.properties}"
OUT_DIR="${1:-$ROOT/spendt-keystore-backup}"

usage() {
  cat <<EOF
Usage: android-keystore-export.sh [output-directory]

Copies your release keystore into a folder you can move to another PC
(USB drive, encrypted cloud, password manager file attachment, etc.).

Default output: $ROOT/spendt-keystore-backup/

On the other machine run:
  npm run cap:android:keystore:import -- <that-folder>

Never commit this folder to git. Store passwords separately from the files.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ ! -f "$KEYSTORE_PATH" ]]; then
  echo "Keystore not found: $KEYSTORE_PATH" >&2
  echo "Create one first: npm run cap:android:keystore" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
cp -f "$KEYSTORE_PATH" "$OUT_DIR/"

INCLUDE_PROPS=0
if [[ -f "$PROPS_FILE" ]]; then
  read -rp "Include keystore.properties (contains passwords in plain text)? [y/N] " ans
  if [[ "${ans,,}" == "y" || "${ans,,}" == "yes" ]]; then
    cp -f "$PROPS_FILE" "$OUT_DIR/"
    INCLUDE_PROPS=1
  fi
fi

cat >"$OUT_DIR/README.txt" <<EOF
Spendt Android release keystore backup
======================================

Files:
  - $(basename "$KEYSTORE_PATH")  (required — keep this safe forever)

Import on another computer:
  cd /path/to/spendt
  npm run cap:android:keystore:import -- "$OUT_DIR"

If you did NOT copy keystore.properties, re-run the import script and it will
help you recreate android/keystore.properties with the same passwords.

Play Store: you must use this same keystore for all future app updates.

End-user phones do NOT need this file — only your build machines do.
EOF

echo ""
echo "Exported to: $OUT_DIR"
ls -la "$OUT_DIR"
echo ""
if [[ "$INCLUDE_PROPS" -eq 1 ]]; then
  echo "Warning: keystore.properties contains plaintext passwords. Encrypt the folder if you share it."
else
  echo "Remember to save your keystore password and key alias (default: spendt) somewhere secure."
fi
