#!/usr/bin/env bash
set -euo pipefail

# Firestore/Storage backup script using gcloud. Requires:
# - GOOGLE_CLOUD_PROJECT env var set
# - gcloud authenticated with access to the project
# - A GCS bucket (e.g., gs://$GOOGLE_CLOUD_PROJECT-backups)

if [[ -z "${GOOGLE_CLOUD_PROJECT:-}" ]]; then
  echo "GOOGLE_CLOUD_PROJECT is not set" >&2
  exit 1
fi

BACKUP_BUCKET="gs://${GOOGLE_CLOUD_PROJECT}-backups"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
EXPORT_PATH="${BACKUP_BUCKET}/firestore-${TIMESTAMP}"

echo "Ensuring backup bucket exists: ${BACKUP_BUCKET}"
gsutil ls -b "${BACKUP_BUCKET}" >/dev/null 2>&1 || gsutil mb -p "${GOOGLE_CLOUD_PROJECT}" -l us-central1 "${BACKUP_BUCKET}"

echo "Exporting Firestore to ${EXPORT_PATH}"
gcloud firestore export "${EXPORT_PATH}" --async

echo "Exporting default Storage bucket to ${BACKUP_BUCKET}/storage-${TIMESTAMP}.tar.gz"
TMP_DIR="$(mktemp -d)"
pushd "${TMP_DIR}" >/dev/null
gsutil -m rsync -r "gs://${GOOGLE_CLOUD_PROJECT}.appspot.com" ./storage-export
tar -czf storage-${TIMESTAMP}.tar.gz storage-export
gsutil cp storage-${TIMESTAMP}.tar.gz "${BACKUP_BUCKET}/"
popd >/dev/null
rm -rf "${TMP_DIR}"

echo "Backup initiated. Monitor Firestore export in GCP console."


