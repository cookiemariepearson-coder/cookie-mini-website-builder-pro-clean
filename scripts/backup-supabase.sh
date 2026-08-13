#!/usr/bin/env bash
set -euo pipefail

umask 077

readonly EXPECTED_PROJECT_REF="ghugpztxhrrdonaerwms"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPOSITORY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command is missing: $1" >&2
    exit 1
  }
}

require_variable() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Required environment variable is missing: ${name}" >&2
    exit 1
  fi
}

for command_name in supabase node age tar sha256sum realpath; do
  require_command "${command_name}"
done

for variable_name in \
  SUPABASE_DB_URL \
  SUPABASE_URL \
  SUPABASE_SERVICE_ROLE_KEY \
  SUPABASE_PROJECT_REF \
  BACKUP_DESTINATION \
  BACKUP_AGE_RECIPIENT; do
  require_variable "${variable_name}"
done

if [[ "${SUPABASE_PROJECT_REF}" != "${EXPECTED_PROJECT_REF}" ]]; then
  echo "Refusing to back up an unexpected Supabase project." >&2
  exit 1
fi

mkdir -p "${BACKUP_DESTINATION}"
readonly RESOLVED_DESTINATION="$(realpath "${BACKUP_DESTINATION}")"
readonly RESOLVED_REPOSITORY="$(realpath "${REPOSITORY_ROOT}")"

case "${RESOLVED_DESTINATION}/" in
  "${RESOLVED_REPOSITORY}/"*)
    echo "Backup destination must be outside the Git repository." >&2
    exit 1
    ;;
esac

readonly TIMESTAMP="${BACKUP_TIMESTAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
if [[ ! "${TIMESTAMP}" =~ ^[0-9]{8}T[0-9]{6}Z$ ]]; then
  echo "BACKUP_TIMESTAMP must use YYYYMMDDTHHMMSSZ." >&2
  exit 1
fi

readonly ARCHIVE_BASENAME="mini-builder-supabase-${TIMESTAMP}.backup.tar.gz.age"
readonly ENCRYPTED_ARCHIVE="${RESOLVED_DESTINATION}/${ARCHIVE_BASENAME}"
readonly CHECKSUM_FILE="${ENCRYPTED_ARCHIVE}.sha256"
readonly STAGING_DIR="$(mktemp -d)"

cleanup() {
  rm -rf -- "${STAGING_DIR}"
}
trap cleanup EXIT INT TERM

echo "Creating a private logical backup for project ${EXPECTED_PROJECT_REF}..."

supabase db dump --db-url "${SUPABASE_DB_URL}" \
  -f "${STAGING_DIR}/roles.sql" --role-only
supabase db dump --db-url "${SUPABASE_DB_URL}" \
  -f "${STAGING_DIR}/schema.sql"
supabase db dump --db-url "${SUPABASE_DB_URL}" \
  -f "${STAGING_DIR}/data.sql" --use-copy --data-only \
  -x "storage.buckets_vectors" -x "storage.vector_indexes"
supabase db dump --db-url "${SUPABASE_DB_URL}" \
  -f "${STAGING_DIR}/migration-history-schema.sql" --schema supabase_migrations
supabase db dump --db-url "${SUPABASE_DB_URL}" \
  -f "${STAGING_DIR}/migration-history-data.sql" --use-copy --data-only \
  --schema supabase_migrations

node "${SCRIPT_DIR}/export-supabase-storage.mjs" \
  --output "${STAGING_DIR}/storage"

node - "${STAGING_DIR}/backup-manifest.json" "${TIMESTAMP}" "${EXPECTED_PROJECT_REF}" <<'NODE'
const { writeFileSync } = require('node:fs');
const [output, createdAt, projectRef] = process.argv.slice(2);
writeFileSync(output, `${JSON.stringify({
  formatVersion: 1,
  createdAt,
  projectRef,
  encrypted: true,
  database: ['roles.sql', 'schema.sql', 'data.sql'],
  migrationHistory: ['migration-history-schema.sql', 'migration-history-data.sql'],
  storage: 'storage/inventory.json'
}, null, 2)}\n`, { mode: 0o600 });
NODE

tar -C "${STAGING_DIR}" -czf - . \
  | age --encrypt --recipient "${BACKUP_AGE_RECIPIENT}" \
      --output "${ENCRYPTED_ARCHIVE}"

(
  cd "${RESOLVED_DESTINATION}"
  sha256sum "${ARCHIVE_BASENAME}" > "${ARCHIVE_BASENAME}.sha256"
)

echo "Encrypted backup created: ${ENCRYPTED_ARCHIVE}"
echo "Checksum created: ${CHECKSUM_FILE}"
echo "No plaintext dump was retained."
