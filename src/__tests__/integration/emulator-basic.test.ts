/**
 * Basic Firebase Emulator Test
 * 
 * This test verifies that Firebase emulators are properly configured
 * and can be used for integration testing with minimal security rules.
 */

import {
  initializeTestApp,
  clearFirestoreData,
  cleanupTestApp,
  waitForEmulators,
  getTestApp
} from '../../test-utils/firebase-test-helpers';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { 
  ref, 
  uploadString, 
  getDownloadURL 
} from 'firebase/storage';

describe('Basic Firebase Emulator Test', () => {
  let testApp: any;

  beforeAll(async () => {
    // Wait for emulators to be ready
    await waitForEmulators();
    
    // Initialize test app
    testApp = await initializeTestApp('test-project');
  }, 30000);

  beforeEach(async () => {
    // Clear all data before each test
    await clearFirestoreData();
    
    // Clear auth users by recreating the app
    await cleanupTestApp();
    testApp = await initializeTestApp('test-project');
  });

  afterAll(async () => {
    // Clean up test app
    await cleanupTestApp();
  });

  describe('Auth Emulator', () => {
    it('should create and authenticate a user', async () => {
      const email = `test-${Date.now()}@example.com`;
      const password = 'Test123!';

      // Create user
      const userCredential = await createUserWithEmailAndPassword(
        testApp.auth,
        email,
        password
      );

      expect(userCredential.user).toBeDefined();
      expect(userCredential.user.email).toBe(email);

      // Sign out
      await signOut(testApp.auth);

      // Sign back in
      const signInCredential = await signInWithEmailAndPassword(
        testApp.auth,
        email,
        password
      );

      expect(signInCredential.user).toBeDefined();
      expect(signInCredential.user.email).toBe(email);
    });

    it('should reject invalid credentials', async () => {
      const email = `test-${Date.now()}@example.com`;
      const password = 'Test123!';

      // Create user
      await createUserWithEmailAndPassword(testApp.auth, email, password);

      // Try to sign in with wrong password
      await expect(
        signInWithEmailAndPassword(testApp.auth, email, 'WrongPassword')
      ).rejects.toThrow();
    });
  });

  describe('Firestore Emulator', () => {
    it('should create and retrieve a document', async () => {
      // Create a user first
      const email = `test-${Date.now()}@example.com`;
      const userCredential = await createUserWithEmailAndPassword(
        testApp.auth,
        email,
        'Test123!'
      );

      // Create a user profile document
      const userDoc = {
        id: userCredential.user.uid,
        email: email,
        displayName: 'Test User',
        role: 'parent',
        createdAt: new Date().toISOString()
      };

      await setDoc(
        doc(testApp.firestore, 'users', userCredential.user.uid),
        userDoc
      );

      // Retrieve the document
      const docSnap = await getDoc(
        doc(testApp.firestore, 'users', userCredential.user.uid)
      );

      expect(docSnap.exists()).toBe(true);
      expect(docSnap.data()).toMatchObject({
        email: email,
        displayName: 'Test User',
        role: 'parent'
      });
    });

    it('should query documents', async () => {
      // Create a user
      const email = `test-${Date.now()}@example.com`;
      await createUserWithEmailAndPassword(testApp.auth, email, 'Test123!');

      // Create test collection without security rules
      const testCollection = collection(testApp.firestore, 'test-collection');
      
      // Add multiple documents
      const docs = await Promise.all([
        addDoc(testCollection, { name: 'Doc 1', type: 'test', value: 10 }),
        addDoc(testCollection, { name: 'Doc 2', type: 'test', value: 20 }),
        addDoc(testCollection, { name: 'Doc 3', type: 'other', value: 30 })
      ]);

      expect(docs).toHaveLength(3);

      // Query documents
      const q = query(testCollection, where('type', '==', 'test'));
      const querySnapshot = await getDocs(q);

      expect(querySnapshot.size).toBe(2);
      
      const results: any[] = [];
      querySnapshot.forEach((doc) => {
        results.push(doc.data());
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.type === 'test')).toBe(true);
    });
  });

  describe('Storage Emulator', () => {
    it('should upload and retrieve a file', async () => {
      // Create a user
      const email = `test-${Date.now()}@example.com`;
      await createUserWithEmailAndPassword(testApp.auth, email, 'Test123!');

      // Upload to test path (allowed by rules)
      const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const storageRef = ref(testApp.storage, `test/test-image-${Date.now()}.png`);

      // Upload file
      const uploadResult = await uploadString(storageRef, testImageData, 'data_url');
      expect(uploadResult).toBeDefined();

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      expect(downloadURL).toBeDefined();
      expect(downloadURL).toContain('localhost:9199');
    });
  });

  describe('Emulator Integration', () => {
    it('should work with Auth, Firestore, and Storage together', async () => {
      // Create a user
      const email = `test-${Date.now()}@example.com`;
      const userCredential = await createUserWithEmailAndPassword(
        testApp.auth,
        email,
        'Test123!'
      );

      const userId = userCredential.user.uid;

      // Create user profile in Firestore
      await setDoc(doc(testApp.firestore, 'users', userId), {
        id: userId,
        email: email,
        displayName: 'Integration Test User',
        role: 'parent',
        createdAt: new Date().toISOString()
      });

      // Upload profile image to Storage
      const imageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const storageRef = ref(testApp.storage, `test/profile-${userId}.png`);
      await uploadString(storageRef, imageData, 'data_url');

      // Verify everything works together
      const userDoc = await getDoc(doc(testApp.firestore, 'users', userId));
      expect(userDoc.exists()).toBe(true);

      const downloadURL = await getDownloadURL(storageRef);
      expect(downloadURL).toBeDefined();

      expect(testApp.auth.currentUser).toBeDefined();
      expect(testApp.auth.currentUser?.uid).toBe(userId);
    });
  });
});