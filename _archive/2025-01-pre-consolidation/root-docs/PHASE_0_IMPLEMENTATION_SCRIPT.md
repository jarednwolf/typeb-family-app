# Phase 0 Implementation Script for TypeB

## Overview
This script provides step-by-step instructions for implementing Phase 0 (Foundations & Guardrails) following TypeB's design system, development standards, and data conventions.

## Prerequisites
- Firebase project configured
- Monorepo structure in place
- Development environment set up
- Access to Firebase Console

## Implementation Tasks

### Task 1: Set Up Firebase Remote Config & Feature Flags

#### 1.1 Create Feature Flag Service
```typescript
// File: typeb-family-app/src/services/featureFlags.ts

import { getRemoteConfig, fetchAndActivate, getValue, RemoteConfig } from 'firebase/remote-config';
import { app } from './firebase';
import { analyticsService } from './analytics';

/**
 * Feature flag service for A/B testing and controlled rollouts
 * @remarks
 * Follows TypeB development standards - no emojis, comprehensive documentation
 */
class FeatureFlagService {
  private remoteConfig: RemoteConfig;
  private isInitialized = false;
  private defaultValues = {
    // Phase 0 flags
    enableThumbnailGeneration: false,
    enableCloudFunctions: false,
    enableAnalyticsDashboard: false,
    enableDenormalizedCounters: false,
    
    // Phase 1 flags (for future)
    enableNewHeroSection: false,
    enableDemoVideo: false,
    enableTestimonials: false,
    enableEmailCaptureModal: false,
    
    // Kill switches
    killSwitchTaskCreation: false,
    killSwitchPhotoUpload: false,
    killSwitchNotifications: false,
  };

  constructor() {
    this.remoteConfig = getRemoteConfig(app);
    this.initialize();
  }

  /**
   * Initialize Remote Config with default values
   * @throws {Error} If Remote Config fails to initialize
   */
  private async initialize(): Promise<void> {
    try {
      // Set default values
      this.remoteConfig.defaultConfig = this.defaultValues;
      
      // Set minimum fetch interval (5 minutes for production, 0 for dev)
      this.remoteConfig.settings.minimumFetchIntervalMillis = 
        __DEV__ ? 0 : 5 * 60 * 1000;
      
      // Fetch and activate
      await fetchAndActivate(this.remoteConfig);
      this.isInitialized = true;
      
      // Track initialization
      analyticsService.track('remote_config_initialized');
      
      console.log('[FeatureFlags] Remote Config initialized successfully');
    } catch (error) {
      console.error('[FeatureFlags] Failed to initialize:', error);
      analyticsService.trackError(error as Error, false);
      // Use defaults if Remote Config fails
      this.isInitialized = false;
    }
  }

  /**
   * Check if a feature flag is enabled
   * @param flag - Feature flag key
   * @returns boolean indicating if feature is enabled
   */
  async isEnabled(flag: keyof typeof this.defaultValues): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        // Return default value if not initialized
        return this.defaultValues[flag] as boolean;
      }
      
      const value = getValue(this.remoteConfig, flag);
      const isEnabled = value.asBoolean();
      
      // Track feature flag check
      analyticsService.track('feature_flag_checked', {
        flag,
        enabled: isEnabled,
      });
      
      return isEnabled;
    } catch (error) {
      console.error(`[FeatureFlags] Error checking flag ${flag}:`, error);
      return this.defaultValues[flag] as boolean;
    }
  }

  /**
   * Get all active feature flags (for debugging)
   * @returns Object with all flag values
   */
  async getAllFlags(): Promise<Record<string, boolean>> {
    const flags: Record<string, boolean> = {};
    
    for (const key of Object.keys(this.defaultValues)) {
      flags[key] = await this.isEnabled(key as keyof typeof this.defaultValues);
    }
    
    return flags;
  }

  /**
   * Force refresh Remote Config values
   * @returns Promise that resolves when refresh is complete
   */
  async refresh(): Promise<void> {
    try {
      await fetchAndActivate(this.remoteConfig);
      analyticsService.track('remote_config_refreshed');
    } catch (error) {
      console.error('[FeatureFlags] Failed to refresh:', error);
      analyticsService.trackError(error as Error, false);
    }
  }
}

// Export singleton instance
export const featureFlagService = new FeatureFlagService();

// Export types
export type FeatureFlag = keyof typeof featureFlagService['defaultValues'];
```

#### 1.2 Add Feature Flag Hook
```typescript
// File: typeb-family-app/src/hooks/useFeatureFlag.ts

import { useState, useEffect } from 'react';
import { featureFlagService, FeatureFlag } from '../services/featureFlags';

/**
 * Hook to check feature flag status
 * @param flag - Feature flag to check
 * @param defaultValue - Default value while loading
 * @returns Tuple of [isEnabled, isLoading]
 */
export function useFeatureFlag(
  flag: FeatureFlag,
  defaultValue = false
): [boolean, boolean] {
  const [isEnabled, setIsEnabled] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFlag = async () => {
      try {
        const enabled = await featureFlagService.isEnabled(flag);
        setIsEnabled(enabled);
      } catch (error) {
        console.error(`[useFeatureFlag] Error checking ${flag}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    checkFlag();
  }, [flag]);

  return [isEnabled, isLoading];
}
```

### Task 2: Create Cloud Functions for Atomic Operations

#### 2.1 Set Up Cloud Functions Project
```bash
# Terminal commands
cd typeb-family-app
mkdir -p functions/src
cd functions
npm init -y
npm install firebase-functions firebase-admin
npm install -D typescript @types/node
```

#### 2.2 Create TypeScript Configuration
```json
// File: typeb-family-app/functions/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "compileOnSave": true,
  "include": [
    "src"
  ]
}
```

#### 2.3 Implement Atomic Task Approval Function
```typescript
// File: typeb-family-app/functions/src/tasks.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Atomically approve a task and award points
 * Follows TypeB data standards - uses 'parent'/'child' roles internally
 */
export const approveTaskAndAwardPoints = functions.firestore
  .document('families/{familyId}/tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const { familyId, taskId } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    // Only process if status changed to 'completed' and validation approved
    if (
      before.status !== 'completed' &&
      after.status === 'completed' &&
      after.photoValidationStatus === 'approved'
    ) {
      try {
        // Use transaction for atomic operation
        await db.runTransaction(async (transaction) => {
          // Get references
          const taskRef = change.after.ref;
          const memberRef = db.doc(`families/${familyId}/members/${after.assignedTo}`);
          const familyRef = db.doc(`families/${familyId}`);
          
          // Get current data
          const memberDoc = await transaction.get(memberRef);
          const familyDoc = await transaction.get(familyRef);
          
          if (!memberDoc.exists || !familyDoc.exists) {
            throw new Error('Member or family not found');
          }
          
          const memberData = memberDoc.data()!;
          const familyData = familyDoc.data()!;
          
          // Validate approver is a parent
          const approverId = after.photoValidatedBy;
          if (!familyData.parentIds.includes(approverId)) {
            throw new Error('Only parents can approve tasks');
          }
          
          // Calculate points
          const pointsToAward = after.rewardPoints || 10; // Default 10 points
          const currentPoints = memberData.points || 0;
          const newPoints = currentPoints + pointsToAward;
          
          // Update member points
          transaction.update(memberRef, {
            points: newPoints,
            totalPointsEarned: admin.firestore.FieldValue.increment(pointsToAward),
            tasksCompleted: admin.firestore.FieldValue.increment(1),
            lastTaskCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          // Update task with completion details
          transaction.update(taskRef, {
            pointsAwarded: pointsToAward,
            pointsAwardedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          // Update denormalized family counters
          transaction.update(familyRef, {
            'counters.pendingTasks': admin.firestore.FieldValue.increment(-1),
            'counters.completedTasks': admin.firestore.FieldValue.increment(1),
            'counters.totalPointsAwarded': admin.firestore.FieldValue.increment(pointsToAward),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          // Log to audit trail
          const auditRef = db.collection('auditLogs').doc();
          transaction.set(auditRef, {
            action: 'TASK_APPROVED_POINTS_AWARDED',
            familyId,
            taskId,
            memberId: after.assignedTo,
            approverId,
            pointsAwarded: pointsToAward,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        
        console.log(`[approveTaskAndAwardPoints] Task ${taskId} approved, ${after.rewardPoints} points awarded`);
        
      } catch (error) {
        console.error('[approveTaskAndAwardPoints] Transaction failed:', error);
        throw new functions.https.HttpsError('internal', 'Failed to approve task and award points');
      }
    }
  });

/**
 * Atomically redeem reward points
 * Ensures points can't be double-spent
 */
export const redeemReward = functions.https.onCall(async (data, context) => {
  // Validate authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { familyId, memberId, rewardId, pointCost } = data;
  const requesterId = context.auth.uid;
  
  // Validate input
  if (!familyId || !memberId || !rewardId || !pointCost) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }
  
  try {
    const result = await db.runTransaction(async (transaction) => {
      // Get references
      const memberRef = db.doc(`families/${familyId}/members/${memberId}`);
      const familyRef = db.doc(`families/${familyId}`);
      const rewardRef = db.doc(`families/${familyId}/rewards/${rewardId}`);
      
      // Get current data
      const memberDoc = await transaction.get(memberRef);
      const familyDoc = await transaction.get(familyRef);
      const rewardDoc = await transaction.get(rewardRef);
      
      if (!memberDoc.exists || !familyDoc.exists || !rewardDoc.exists) {
        throw new Error('Member, family, or reward not found');
      }
      
      const memberData = memberDoc.data()!;
      const familyData = familyDoc.data()!;
      const rewardData = rewardDoc.data()!;
      
      // Validate requester is the member or a parent
      const isParent = familyData.parentIds.includes(requesterId);
      const isSelf = memberId === requesterId;
      
      if (!isParent && !isSelf) {
        throw new Error('Permission denied');
      }
      
      // Check sufficient points
      const currentPoints = memberData.points || 0;
      if (currentPoints < pointCost) {
        throw new Error(`Insufficient points. Has ${currentPoints}, needs ${pointCost}`);
      }
      
      // Deduct points
      const newPoints = currentPoints - pointCost;
      
      // Create redemption record
      const redemptionRef = db.collection(`families/${familyId}/redemptions`).doc();
      const redemptionId = redemptionRef.id;
      
      // Update member points
      transaction.update(memberRef, {
        points: newPoints,
        totalPointsRedeemed: admin.firestore.FieldValue.increment(pointCost),
        lastRedemptionAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Create redemption record
      transaction.set(redemptionRef, {
        id: redemptionId,
        memberId,
        rewardId,
        rewardTitle: rewardData.title,
        pointCost,
        redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
        redeemedBy: requesterId,
        status: 'pending', // Parent needs to fulfill
        familyId,
      });
      
      // Update family counters
      transaction.update(familyRef, {
        'counters.totalPointsRedeemed': admin.firestore.FieldValue.increment(pointCost),
        'counters.pendingRedemptions': admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Log to audit trail
      const auditRef = db.collection('auditLogs').doc();
      transaction.set(auditRef, {
        action: 'REWARD_REDEEMED',
        familyId,
        memberId,
        rewardId,
        pointCost,
        requesterId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      return { redemptionId, newPoints };
    });
    
    return {
      success: true,
      redemptionId: result.redemptionId,
      remainingPoints: result.newPoints,
    };
    
  } catch (error: any) {
    console.error('[redeemReward] Transaction failed:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to redeem reward');
  }
});
```

### Task 3: Implement Thumbnail Pipeline

#### 3.1 Create Thumbnail Generation Function
```typescript
// File: typeb-family-app/functions/src/storage.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as sharp from 'sharp'; // npm install sharp

const storage = admin.storage();

/**
 * Generate thumbnail when photo is uploaded
 * Follows TypeB performance guidelines - max 100KB for UI assets
 */
export const generateThumbnail = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name!;
    const contentType = object.contentType!;
    
    // Only process images
    if (!contentType.startsWith('image/')) {
      console.log('[generateThumbnail] Not an image, skipping');
      return null;
    }
    
    // Skip if already a thumbnail
    if (filePath.includes('_thumb')) {
      console.log('[generateThumbnail] Already a thumbnail, skipping');
      return null;
    }
    
    // Parse file path
    const fileName = path.basename(filePath);
    const fileDir = path.dirname(filePath);
    const fileExtension = path.extname(fileName);
    const fileNameWithoutExt = path.basename(fileName, fileExtension);
    
    // Generate thumbnail file name
    const thumbFileName = `${fileNameWithoutExt}_thumb${fileExtension}`;
    const thumbFilePath = path.join(fileDir, thumbFileName);
    
    // Download file to temp directory
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const tempThumbPath = path.join(os.tmpdir(), thumbFileName);
    
    const bucket = storage.bucket(object.bucket);
    
    try {
      // Download original image
      await bucket.file(filePath).download({ destination: tempFilePath });
      
      console.log('[generateThumbnail] Image downloaded to', tempFilePath);
      
      // Generate thumbnail using sharp
      // Following TypeB design: 200x200 for list views, max 100KB
      await sharp(tempFilePath)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({
          quality: 80,
          progressive: true,
        })
        .toFile(tempThumbPath);
      
      console.log('[generateThumbnail] Thumbnail created at', tempThumbPath);
      
      // Check file size
      const stats = fs.statSync(tempThumbPath);
      const fileSizeInKB = stats.size / 1024;
      
      if (fileSizeInKB > 100) {
        // Reduce quality if over 100KB
        await sharp(tempFilePath)
          .resize(200, 200, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({
            quality: 60,
            progressive: true,
          })
          .toFile(tempThumbPath);
      }
      
      // Upload thumbnail
      await bucket.upload(tempThumbPath, {
        destination: thumbFilePath,
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            isThumb: 'true',
            originalFile: filePath,
          },
        },
      });
      
      console.log('[generateThumbnail] Thumbnail uploaded to', thumbFilePath);
      
      // Update Firestore with thumbnail URL
      // Parse family and task IDs from path (families/{familyId}/tasks/{taskId}/photo.jpg)
      const pathParts = filePath.split('/');
      if (pathParts[0] === 'families' && pathParts[2] === 'tasks') {
        const familyId = pathParts[1];
        const taskId = pathParts[3];
        
        // Get signed URLs
        const [originalUrl] = await bucket.file(filePath).getSignedUrl({
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        
        const [thumbUrl] = await bucket.file(thumbFilePath).getSignedUrl({
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        
        // Update task document
        await admin.firestore()
          .doc(`families/${familyId}/tasks/${taskId}`)
          .update({
            photoUrl: originalUrl,
            photoThumbUrl: thumbUrl,
            photoUploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      }
      
      // Clean up temp files
      fs.unlinkSync(tempFilePath);
      fs.unlinkSync(tempThumbPath);
      
      return null;
      
    } catch (error) {
      console.error('[generateThumbnail] Error:', error);
      throw error;
    }
  });
```

### Task 4: Set Up Analytics Dashboards

#### 4.1 Create Analytics Dashboard Configuration
```typescript
// File: typeb-family-app/src/services/analyticsDashboard.ts

import { analyticsService } from './analytics';
import { db } from './firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

/**
 * Analytics Dashboard Service
 * Provides metrics for conversion, activation, engagement, and retention
 */
class AnalyticsDashboardService {
  /**
   * Get conversion metrics (Visit → Signup)
   * @param startDate - Start of date range
   * @param endDate - End of date range
   */
  async getConversionMetrics(startDate: Date, endDate: Date) {
    try {
      // This would typically query BigQuery or Analytics API
      // For now, we'll use Firestore aggregations
      
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );
      
      const snapshot = await getDocs(q);
      const signups = snapshot.size;
      
      // Track dashboard view
      analyticsService.track('analytics_dashboard_viewed', {
        dashboard: 'conversion',
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
      });
      
      return {
        signups,
        // These would come from web analytics
        visits: 0, // Placeholder - integrate with web analytics
        conversionRate: 0, // Placeholder
      };
    } catch (error) {
      console.error('[AnalyticsDashboard] Error getting conversion metrics:', error);
      throw error;
    }
  }
  
  /**
   * Get activation metrics (First approval within 48h)
   * @param startDate - Start of date range
   * @param endDate - End of date range
   */
  async getActivationMetrics(startDate: Date, endDate: Date) {
    try {
      const familiesRef = collection(db, 'families');
      const q = query(
        familiesRef,
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );
      
      const snapshot = await getDocs(q);
      let activatedCount = 0;
      let totalFamilies = snapshot.size;
      
      // Check each family for first approval time
      for (const doc of snapshot.docs) {
        const familyData = doc.data();
        const familyId = doc.id;
        
        // Query first approved task
        const tasksRef = collection(db, `families/${familyId}/tasks`);
        const tasksQuery = query(
          tasksRef,
          where('photoValidationStatus', '==', 'approved')
        );
        
        const tasksSnapshot = await getDocs(tasksQuery);
        if (!tasksSnapshot.empty) {
          // Check if first approval was within 48 hours
          const firstTask = tasksSnapshot.docs[0].data();
          const createdAt = familyData.createdAt.toDate();
          const approvedAt = firstTask.photoValidatedAt?.toDate();
          
          if (approvedAt) {
            const hoursDiff = (approvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
            if (hoursDiff <= 48) {
              activatedCount++;
            }
          }
        }
      }
      
      return {
        totalFamilies,
        activatedFamilies: activatedCount,
        activationRate: totalFamilies > 0 ? (activatedCount / totalFamilies) * 100 : 0,
        medianTimeToFirstApproval: 0, // Placeholder - calculate from data
      };
    } catch (error) {
      console.error('[AnalyticsDashboard] Error getting activation metrics:', error);
      throw error;
    }
  }
  
  /**
   * Get engagement metrics (DAU, DAU/WAU)
   * @param date - Date to check
   */
  async getEngagementMetrics(date: Date) {
    try {
      // Calculate DAU (Daily Active Users)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // This would typically query activity logs
      // For now, we'll use a simplified approach
      const activitiesRef = collection(db, 'activities');
      const dauQuery = query(
        activitiesRef,
        where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
        where('timestamp', '<=', Timestamp.fromDate(endOfDay))
      );
      
      const dauSnapshot = await getDocs(dauQuery);
      const uniqueUsers = new Set(dauSnapshot.docs.map(doc => doc.data().userId));
      const dau = uniqueUsers.size;
      
      // Calculate WAU (Weekly Active Users)
      const weekAgo = new Date(date);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const wauQuery = query(
        activitiesRef,
        where('timestamp', '>=', Timestamp.fromDate(weekAgo)),
        where('timestamp', '<=', Timestamp.fromDate(endOfDay))
      );
      
      const wauSnapshot = await getDocs(wauQuery);
      const weeklyUsers = new Set(wauSnapshot.docs.map(doc => doc.data().userId));
      const wau = weeklyUsers.size;
      
      return {
        dau,
        wau,
        stickiness: wau > 0 ? (dau / wau) * 100 : 0,
        avgSessionsPerUser: 0, // Placeholder
        avgSessionDuration: 0, // Placeholder
      };
    } catch (error) {
      console.error('[AnalyticsDashboard] Error getting engagement metrics:', error);
      throw error;
    }
  }
  
  /**
   * Get retention metrics (W2, W4)
   * @param cohortStartDate - Start date of cohort
   */
  async getRetentionMetrics(cohortStartDate: Date) {
    try {
      const cohortEndDate = new Date(cohortStartDate);
      cohortEndDate.setDate(cohortEndDate.getDate() + 7);
      
      // Get cohort users
      const usersRef = collection(db, 'users');
      const cohortQuery = query(
        usersRef,
        where('createdAt', '>=', Timestamp.fromDate(cohortStartDate)),
        where('createdAt', '<', Timestamp.fromDate(cohortEndDate))
      );
      
      const cohortSnapshot = await getDocs(cohortQuery);
      const cohortUserIds = cohortSnapshot.docs.map(doc => doc.id);
      const cohortSize = cohortUserIds.length;
      
      // Check W2 retention (active in week 2)
      const w2Start = new Date(cohortStartDate);
      w2Start.setDate(w2Start.getDate() + 7);
      const w2End = new Date(cohortStartDate);
      w2End.setDate(w2End.getDate() + 14);
      
      const w2ActiveUsers = await this.getActiveUsersInPeriod(
        cohortUserIds,
        w2Start,
        w2End
      );
      
      // Check W4 retention (active in week 4)
      const w4Start = new Date(cohortStartDate);
      w4Start.setDate(w4Start.getDate() + 21);
      const w4End = new Date(cohortStartDate);
      w4End.setDate(w4End.getDate() + 28);
      
      const w4ActiveUsers = await this.getActiveUsersInPeriod(
        cohortUserIds,
        w4Start,
        w4End
      );
      
      return {
        cohortSize,
        w2Retention: cohortSize > 0 ? (w2ActiveUsers / cohortSize) * 100 : 0,
        w4Retention: cohortSize > 0 ? (w4ActiveUsers / cohortSize) * 100 : 0,
      };
    } catch (error) {
      console.error('[AnalyticsDashboard] Error getting retention metrics:', error);
      throw error;
    }
  }
  
  /**
   * Helper to get active users in a period
   */
  private async getActiveUsersInPeriod(
    userIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const activitiesRef = collection(db, 'activities');
    const q = query(
      activitiesRef,
      where('userId', 'in', userIds.slice(0, 10)), // Firestore 'in' limit
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate))
    );
    
    const snapshot = await getDocs(q);
    const activeUsers = new Set(snapshot.docs.map(doc => doc.data().userId));
    return activeUsers.size;
  }
}

// Export singleton instance
export const analyticsDashboardService = new AnalyticsDashboardService();
```

### Task 5: Implement Denormalized Counters

#### 5.1 Update Firestore Rules
```javascript
// File: apps/web/firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isFamilyMember(familyId) {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/families/$(familyId)).data.memberIds.hasAny([request.auth.uid]);
    }
    
    function isFamilyParent(familyId) {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/families/$(familyId)).data.parentIds.hasAny([request.auth.uid]);
    }
    
    // Families collection
    match /families/{familyId} {
      allow read: if isFamilyMember(familyId);
      allow create: if isAuthenticated();
      allow update: if isFamilyParent(familyId) && 
        // Prevent direct counter manipulation
        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['counters']);
      allow delete: if false; // Never allow deletion