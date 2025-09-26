// Minimal Firebase config shim used by unit tests
export const firestore = {
  collection: (..._args: any[]) => ({}),
  doc: (..._args: any[]) => ({}),
};

export const storage = {} as any;

export const auth = {
  currentUser: null as any,
};


