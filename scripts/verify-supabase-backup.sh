#!/usr/bin/env bash
set -euo pipefail

umask 077

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command is missing: $1" >&2
    exit 1
  }
}

for command_name in age tar sha256sum node; do
  require_command "${command_name}"
done

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 ENCRYPTED_ARCHIVE CHECKSUM_FILE" >&2
  exit 1
fi

: "${BACKUP_AGE_IDENTITY_FILE:?BACKUP_AGE_IDENTITY_FILE is required}"

readonly ENCRYPTED_ARCHIVE="$(realpath "$1")"
readonly CHECKSUM_FILE="$(realpath "$2")"
readonly TEMPORARY_DIRECTORY="$(mktemp -d)"
readonly DECRYPTED_ARCHIVE="${TEMPORARY_DIRECTORY}/backup.tar.gz"

cleanup() {
  rm -rf -- "${TEMPORARY_DIRECTORY}"
}
trap cleanup EXIT INT TERM

(
  cd "$(dirname "${ENCRYPTED_ARCHIVE}")"
  sha256sum --check "${CHECKSUM_FILE}"
)

age --decrypt --identity "${BACKUP_AGE_IDENTITY_FILE}" \
  --output "${DECRYPTED_ARCHIVE}" "${ENCRYPTED_ARCHIVE}"
tar -xzf "${DECRYPTED_ARCHIVE}" -C "${TEMPORARY_DIRECTORY}"

for required_file in \
  backup-manifest.json roles.sql schema.sql data.sql \
  migration-history-schema.sql migration-history-data.sql storage/inventory.json; do
  if [[ ! -f "${TEMPORARY_DIRECTORY}/${required_file}" ]]; then
    echo "Backup verification failed: missing ${required_file}" >&2
    exit 1
  fi
done

node -e "JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8')); JSON.parse(require('node:fs').readFileSync(process.argv[2], 'utf8'));" \
  "${TEMPORARY_DIRECTORY}/backup-manifest.json" \
  "${TEMPORARY_DIRECTORY}/storage/inventory.json"

echo "Checksum, decryption, archive structure, and JSON inventories verified."
