# Firebase Setup

## Projects
- Staging: typeb-family-app-staging (proposed)
- Production: typeb-family-app

## Env variables
- Web: NEXT_PUBLIC_FIREBASE_*
- Mobile: EXPO_PUBLIC_FIREBASE_*

## Emulators
```bash
firebase emulators:start --only firestore,auth,storage
```

## Rules/Indexes
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```
