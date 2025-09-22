# TypeB Family App - Day 3 Production Sprint

**Date**: Day 3 of 7-day sprint  
**Focus**: Core Features, Premium Implementation & User Experience  
**Duration**: 6 hours  

---

## CONTEXT

I'm on Day 3 of a 7-day production sprint for TypeB Family App - a React Native task management app with photo validation for families. On Day 2, I successfully implemented Google SSO, RevenueCat integration, security hardening with rate limiting, and Sentry error monitoring.

### Current State
- **Repository**: https://github.com/jarednwolf/typeb-family-app (monorepo structure)
- **Firebase Project**: `tybeb-staging` (configured with enhanced security rules)
- **Web App**: Live at https://typebapp.com (Next.js on Vercel with Google SSO)
- **Mobile App**: React Native with Expo SDK 51 (Google Sign-In integrated)
- **Authentication**: Email/Password + Google SSO configured
- **Payments**: RevenueCat SDK integrated (products pending configuration)
- **Security**: Firebase rules with rate limiting and validation
- **Monitoring**: Sentry error tracking configured
- **CI/CD**: GitHub Actions pipeline active

### Tech Stack Recap
- **Frontend**: React Native (Expo SDK 51), Next.js 15.4
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **State**: Redux Toolkit
- **Payments**: RevenueCat (integrated, awaiting product IDs)
- **Auth**: Firebase Auth with Google SSO
- **Error Tracking**: Sentry
- **Build**: EAS Build (mobile), Vercel (web)

### Day 2 Accomplishments
✅ Google SSO fully integrated (mobile + web)
✅ RevenueCat SDK configured with Paywall component
✅ Firebase Security Rules with rate limiting
✅ Sentry error monitoring active
✅ Error boundaries implemented

## DAY 3 OBJECTIVES

Complete these tasks in order of priority:

### 1. Photo Validation System (2.5 hours)
- [ ] Implement camera integration for task photo capture
- [ ] Create photo upload service with Firebase Storage
- [ ] Build photo validation UI for parents
- [ ] Add AI-powered photo verification (using Firebase ML or Vision API)
- [ ] Implement photo approval/rejection workflow
- [ ] Add photo compression and optimization

### 2. Premium Features Implementation (1.5 hours)
- [ ] Gate premium features behind RevenueCat checks
- [ ] Implement custom task categories (premium only)
- [ ] Add unlimited family members for premium
- [ ] Create premium analytics dashboard
- [ ] Build export functionality for task history
- [ ] Add premium badge UI components

### 3. Real-time Family Sync (1 hour)
- [ ] Implement Firestore real-time listeners for family data
- [ ] Add optimistic UI updates for better UX
- [ ] Create conflict resolution for concurrent edits
- [ ] Build offline support with sync queue
- [ ] Add connection status indicator

### 4. Notification System (1 hour)
- [ ] Configure push notifications with Expo
- [ ] Implement task reminder notifications
- [ ] Add family activity notifications
- [ ] Create notification preferences screen
- [ ] Set up notification scheduling
- [ ] Add in-app notification center

## SPECIFIC IMPLEMENTATION REQUIREMENTS

### Photo Validation Implementation

#### Camera Service (typeb-family-app/src/services/camera.ts):
```typescript
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export class CameraService {
  async requestPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  async capturePhoto(): Promise<string | null> {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      return await this.compressImage(result.assets[0].uri);
    }
    return null;
  }

  private async compressImage(uri: string): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  }

  async uploadPhoto(uri: string, taskId: string, userId: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const filename = `tasks/${taskId}/${userId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  }
}
```

#### Photo Validation Component (PhotoValidation.tsx):
```typescript
interface PhotoValidationProps {
  task: Task;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

const PhotoValidation: React.FC<PhotoValidationProps> = ({ task, onApprove, onReject }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  const analyzePhoto = async () => {
    setIsAnalyzing(true);
    // Call Vision API or ML Kit for analysis
    const confidence = await photoAnalysisService.analyze(task.photoUrl);
    setAiConfidence(confidence);
    setIsAnalyzing(false);
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: task.photoUrl }} style={styles.photo} />
      {aiConfidence && (
        <Text>AI Confidence: {(aiConfidence * 100).toFixed(1)}%</Text>
      )}
      <View style={styles.actions}>
        <TouchableOpacity onPress={onApprove} style={styles.approveButton}>
          <Text>Approve ✓</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onReject('Not completed properly')} style={styles.rejectButton}>
          <Text>Reject ✗</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

### Premium Features Gate

#### Premium Hook (usePremium.ts):
```typescript
import { useEffect, useState } from 'react';
import revenueCatService from '../services/revenueCat';

export const usePremium = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const status = await revenueCatService.isPremium();
      setIsPremium(status);
    } catch (error) {
      console.error('Error checking premium status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { isPremium, isLoading, refresh: checkPremiumStatus };
};

// Usage in component
const CustomCategories = () => {
  const { isPremium } = usePremium();
  
  if (!isPremium) {
    return <PremiumUpgradePrompt feature="custom categories" />;
  }
  
  return <CustomCategoriesManager />;
};
```

### Real-time Sync Implementation

#### Realtime Sync Service:
```typescript
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  QuerySnapshot,
  DocumentData 
} from 'firebase/firestore';

class RealtimeSyncService {
  private listeners: Map<string, () => void> = new Map();

  subscribeFamilyTasks(familyId: string, callback: (tasks: Task[]) => void) {
    const q = query(
      collection(db, 'tasks'),
      where('familyId', '==', familyId)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Task));
        callback(tasks);
      },
      (error) => {
        console.error('Realtime sync error:', error);
        errorMonitoring.captureException(error);
      }
    );

    this.listeners.set(`family-tasks-${familyId}`, unsubscribe);
    return unsubscribe;
  }

  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}
```

### Push Notifications Setup

#### Notification Service Enhancement:
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const setupPushNotifications = async () => {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    throw new Error('Permission not granted for push notifications');
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  // Save token to Firestore
  await saveNotificationToken(token);
  
  return token;
};
```

## FILE STRUCTURE TO WORK WITH

```
/typeb-family-app/
  /src/
    /services/
      - camera.ts (create new)
      - photoAnalysis.ts (create new)
      - realtimeSync.ts (enhance existing)
      - notifications.ts (enhance existing)
    /components/
      /tasks/
        - PhotoCapture.tsx (create new)
        - PhotoValidation.tsx (create new)
        - TaskCard.tsx (enhance with photo)
      /premium/
        - PremiumGate.tsx (create new)
        - PremiumBadge.tsx (create new)
        - CustomCategories.tsx (create new)
    /screens/
      /tasks/
        - TaskDetailScreen.tsx (add photo validation)
        - CreateTaskScreen.tsx (add photo requirement option)
      /settings/
        - NotificationSettings.tsx (create new)
        - PremiumScreen.tsx (create new)
    /hooks/
      - usePremium.ts (create new)
      - useRealtimeSync.ts (enhance existing)
      - useNotifications.ts (create new)
```

## TESTING REQUIREMENTS

### Photo Validation Testing
1. Test camera permissions on iOS and Android
2. Test photo capture and compression
3. Test upload to Firebase Storage
4. Test photo validation workflow
5. Test offline photo queue

### Premium Features Testing
1. Test premium gate for non-subscribers
2. Test feature unlock after purchase
3. Test premium status persistence
4. Test subscription restoration
5. Test family member limits

### Real-time Sync Testing
1. Test multi-device sync
2. Test offline mode and sync recovery
3. Test conflict resolution
4. Test large family data sets
5. Test connection status indicator

### Notification Testing
1. Test permission requests
2. Test local notifications
3. Test push notification delivery
4. Test notification scheduling
5. Test notification preferences

## DEPLOYMENT CHECKLIST

After implementing each feature:

```bash
# Run tests
cd typeb-family-app
npm test

# Test on physical device
npx expo run:ios --device
# or
npx expo run:android --device

# Commit with conventional commits
git add -A
git commit -m "feat: add photo validation system with AI analysis"
git commit -m "feat: implement premium features with RevenueCat gating"
git commit -m "feat: add real-time family sync with offline support"
git commit -m "feat: configure push notifications with scheduling"

# Push to trigger CI/CD
git push origin main

# Deploy functions if needed
firebase deploy --only functions --project tybeb-staging

# Update Firestore indexes if needed
firebase deploy --only firestore:indexes --project tybeb-staging

# Check deployment
gh run list --limit 5
```

## KNOWN ISSUES TO WATCH

1. **Camera Permissions**: iOS requires clear usage descriptions in Info.plist
2. **Storage CORS**: Configure CORS for Firebase Storage if uploading from web
3. **Notification Tokens**: Handle token refresh and multiple devices per user
4. **Premium Caching**: Cache premium status to avoid repeated API calls
5. **Photo Size**: Implement progressive loading for large photos
6. **Offline Queue**: Ensure proper error handling for failed uploads

## SUCCESS METRICS

By end of Day 3, you should have:
- [ ] Working photo capture and validation system
- [ ] Premium features properly gated
- [ ] Real-time sync across family devices
- [ ] Push notifications configured and working
- [ ] All tests passing
- [ ] No critical errors in production

## HELPFUL COMMANDS

```bash
# Install new dependencies
npm install expo-image-picker expo-image-manipulator expo-notifications

# Test camera on simulator (limited functionality)
npx expo start --ios

# Test on physical device (recommended for camera)
npx expo run:ios --device

# Monitor Firestore usage
firebase firestore:indexes --project tybeb-staging

# Check Storage usage
gsutil du -sh gs://tybeb-staging.appspot.com

# View function logs
firebase functions:log --project tybeb-staging

# Test push notifications
curl -H "Content-Type: application/json" -X POST \
  -d '{"to":"ExponentPushToken[...]","title":"Test","body":"Test notification"}' \
  https://exp.host/--/api/v2/push/send
```

## RESOURCES

- Expo Camera Docs: https://docs.expo.dev/versions/latest/sdk/imagepicker/
- Firebase Storage: https://firebase.google.com/docs/storage/web/start
- RevenueCat Gating: https://www.revenuecat.com/docs/subscriber-attributes
- Expo Notifications: https://docs.expo.dev/push-notifications/overview/
- Firebase ML Kit: https://firebase.google.com/docs/ml
- Vision API: https://cloud.google.com/vision/docs

## QUESTIONS TO ASK IF STUCK

1. "How do I handle camera permissions denial gracefully?"
2. "What's the best way to queue photos for upload when offline?"
3. "How do I implement optimistic UI updates with Firestore?"
4. "What's the proper way to handle notification token refresh?"
5. "How do I test push notifications in development?"

## ARCHITECTURE DECISIONS

1. **Photo Storage**: Use Firebase Storage with CDN for performance
2. **AI Analysis**: Start with basic image validation, add ML later
3. **Premium Logic**: Check at app level, enforce at backend
4. **Sync Strategy**: Use Firestore listeners with local cache
5. **Notification Delivery**: Use Expo Push Service for simplicity

---

**IMPORTANT**: Focus on user experience and reliability. Photo validation is a core feature that must work smoothly. Premium features should feel valuable and worth the subscription.

**Time Budget**: 
- Morning (2.5 hrs): Photo validation system
- Midday (1.5 hrs): Premium features
- Afternoon (1 hr): Real-time sync
- Late afternoon (1 hr): Notifications

Start with photo validation as it's the most complex and core to your app's value proposition. Good luck with Day 3!
