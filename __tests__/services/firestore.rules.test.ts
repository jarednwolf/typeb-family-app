import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const rules = readFileSync('firestore.rules', 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-typeb',
    firestore: { rules },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

it('denies unauthenticated writes', async () => {
  const ctx = testEnv.unauthenticatedContext();
  const db = ctx.firestore();
  await expect(db.collection('families').doc('x').set({ ownerId: 'u' })).rejects.toThrow();
});


