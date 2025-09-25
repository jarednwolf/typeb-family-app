// Minimal stub to satisfy imports in tests not targeting RN Firebase
const firestore = {
  collection: () => ({ doc: () => ({}) }),
};
export default firestore;


