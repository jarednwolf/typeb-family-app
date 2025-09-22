# Data Model

This document describes core Firestore collections and fields used by TypeB.

## Collections

- users/{userId}
- families/{familyId}
- tasks/{taskId}
- subscriptions/{userId}
- parental_consent/{consentId}
- notifications/{id}
- task_photos/{photoId}

See `apps/web/firestore.rules` for authorization constraints.
