## Backups and Disaster Recovery

### Prereqs
- gcloud CLI authenticated and configured
- `GOOGLE_CLOUD_PROJECT` env set
- IAM permissions for Firestore/Storage export

### Run backup
```bash
./scripts/firestore-backup.sh
```

### Restore Firestore
```bash
gcloud firestore import gs://<bucket>/firestore-<timestamp>
```

### Restore Storage
```bash
# Download tarball and sync to bucket
gsutil cp gs://<bucket>/storage-<timestamp>.tar.gz ./
tar -xzf storage-<timestamp>.tar.gz
gsutil -m rsync -r ./storage-export gs://<project>.appspot.com
```

### Runbook
- Verify latest backup
- Communicate maintenance window
- Disable write traffic if needed
- Perform restore and validate integrity
- Re-enable traffic and monitor


