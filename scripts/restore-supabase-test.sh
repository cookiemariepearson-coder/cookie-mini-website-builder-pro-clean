#!/usr/bin/env bash
set -euo pipefail

umask 077

readonly PRODUCTION_PROJECT_REF="ghugpztxhrrdonaerwms"
readonly COOKIE_CONNECT_PROJECT_REF="bxwcyrhnesqajlxopvzy"

if [[ "${ALLOW_ISOLATED_RESTORE:-}" != "YES" ]]; then
  echo "Set ALLOW_ISOLATED_RESTORE=YES only for an approved isolated test project." >&2
  exit 1
fi

for variable_name in \
  RESTORE_TARGET_PROJECT_REF \
  RESTORE_TARGET_DB_URL \
  RESTORE_TARGET_SUPABASE_URL \
  RESTORE_TARGET_SERVICE_ROLE_KEY \
  BACKUP_AGE_IDENTITY_FILE; do
  if [[ -z "${!variable_name:-}" ]]; then
    echo "Required environment variable is missing: ${variable_name}" >&2
    exit 1
  fi
done

if [[ "${RESTORE_TARGET_PROJECT_REF}" == "${PRODUCTION_PROJECT_REF}" || "${RESTORE_TARGET_PROJECT_REF}" == "${COOKIE_CONNECT_PROJECT_REF}" ]]; then
  echo "Refusing to restore into a protected live Supabase project." >&2
  exit 1
fi

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 ENCRYPTED_ARCHIVE CHECKSUM_FILE" >&2
  exit 1
fi

for command_name in age node psql sha256sum tar realpath; do
  command -v "${command_name}" >/dev/null 2>&1 || {
    echo "Required command is missing: ${command_name}" >&2
    exit 1
  }
done

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
  if [[ ! -s "${TEMPORARY_DIRECTORY}/${required_file}" ]]; then
    echo "Restore refused: missing or empty ${required_file}." >&2
    exit 1
  fi
done

node - "${TEMPORARY_DIRECTORY}/backup-manifest.json" "${TEMPORARY_DIRECTORY}/storage/inventory.json" "${PRODUCTION_PROJECT_REF}" <<'NODE'
const { readFileSync } = require('node:fs');
const [manifestPath, storagePath, expectedRef] = process.argv.slice(2);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
JSON.parse(readFileSync(storagePath, 'utf8'));
if (manifest.projectRef !== expectedRef || manifest.encrypted !== true) {
  throw new Error('Restore refused: archive manifest does not identify the encrypted production backup.');
}
NODE

psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file "${TEMPORARY_DIRECTORY}/roles.sql" \
  --file "${TEMPORARY_DIRECTORY}/schema.sql" \
  --command 'SET session_replication_role = replica' \
  --file "${TEMPORARY_DIRECTORY}/data.sql" \
  --dbname "${RESTORE_TARGET_DB_URL}"

psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file "${TEMPORARY_DIRECTORY}/migration-history-schema.sql" \
  --file "${TEMPORARY_DIRECTORY}/migration-history-data.sql" \
  --dbname "${RESTORE_TARGET_DB_URL}"

node "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/restore-supabase-storage.mjs" \
  --input "${TEMPORARY_DIRECTORY}/storage"

echo "Database and Storage restore completed and verified in isolated project ${RESTORE_TARGET_PROJECT_REF}."
