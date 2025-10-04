## Firestore/Storage Rules Consolidation Plan

1. Canonical files:
   - Firestore: `firestore.rules`
   - Storage: `storage.rules`
2. Archive alternates:
   - Move `firestore.rules.dev`, `firestore.rules.improved` to `_archive/rules/` with README.
3. Ensure `firebase.json` references canonical files and `firestore.indexes.json`.
4. Add rules tests using `@firebase/rules-unit-testing` under `__tests__/services/`.
5. Gate deployments on rules tests in CI.
6. Document role-based access and data model invariants in `docs/DATA-STANDARDS-AND-CONVENTIONS.md`.


