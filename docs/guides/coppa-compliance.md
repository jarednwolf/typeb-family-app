# COPPA Compliance Implementation Guide

**CRITICAL**: This must be implemented before US launch to avoid legal liability.

## What is COPPA?

The Children's Online Privacy Protection Act (COPPA) is a US federal law that protects the privacy of children under 13. Since TypeB collects information from children for task management, COPPA compliance is **mandatory**.

## COPPA Requirements for TypeB

### 1. Parental Consent (REQUIRED)

Before collecting any information from children under 13, you must:
- Obtain verifiable parental consent
- Provide notice of data collection practices
- Allow parents to review and delete data
- Not condition participation on data disclosure

### 2. Data Minimization

Only collect necessary information from children:

**Allowed to Collect**:
- First name only (no last name)
- Avatar selection (no photo uploads of child)
- Task completion status
- Points/rewards data
- Task validation photos (auto-delete after 90 days)

**NOT Allowed Without Extra Consent**:
- Full name
- Home address
- Email address
- Phone number
- Social media handles
- Geolocation data
- Persistent identifiers for tracking

### 3. Data Retention & Deletion

- Photos: Auto-delete after 90 days
- Account data: Delete on request
- No data sharing with third parties
- Secure storage with encryption

## Implementation Steps

### Step 1: Age Gate Implementation

```typescript
// src/screens/auth/AgeGateScreen.tsx
interface AgeGateData {
  birthDate: Date;
  isUnder13: boolean;
  requiresParentalConsent: boolean;
}

const AgeGateScreen = () => {
  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleAgeSubmit = async (birthDate: Date) => {
    const age = calculateAge(birthDate);
    
    if (age < 13) {
      // Redirect to parental consent flow
      navigation.navigate('ParentalConsent');
    } else {
      // Continue normal registration
      navigation.navigate('Registration');
    }
  };
  
  return (
    // Age verification UI
  );
};
```

### Step 2: Parental Consent Flow

```typescript
// src/screens/auth/ParentalConsentScreen.tsx
interface ParentalConsent {
  parentEmail: string;
  consentGiven: boolean;
  consentDate: Timestamp;
  verificationMethod: 'email' | 'credit_card' | 'id_upload';
  childInfo: {
    firstName: string;
    birthDate: Date;
  };
}

const ParentalConsentFlow = () => {
  // Step 1: Collect parent email
  // Step 2: Send verification email
  // Step 3: Verify parent identity
  // Step 4: Record consent
  // Step 5: Create child account with restrictions
};
```

### Step 3: Firebase Security Rules Update

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Children under 13 - restricted data access
    match /users/{userId} {
      allow read: if request.auth.uid == userId ||
                     isParentOf(userId);
      allow write: if request.auth.uid == userId && 
                      !isUnder13(userId) ||
                      isParentOf(userId);
      
      // Restrict certain fields for children
      allow update: if request.auth.uid == userId &&
                       isUnder13(userId) &&
                       !('email' in request.resource.data) &&
                       !('phone' in request.resource.data) &&
                       !('address' in request.resource.data);
    }
    
    // Parental consent records
    match /parental_consent/{consentId} {
      allow read: if request.auth.uid == resource.data.parentId;
      allow create: if request.auth.uid == request.resource.data.parentId;
      allow delete: if false; // Never delete consent records
    }
    
    // Helper functions
    function isUnder13(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data.isUnder13 == true;
    }
    
    function isParentOf(childId) {
      return exists(/databases/$(database)/documents/parental_consent/$(request.auth.uid + '_' + childId));
    }
  }
}
```

### Step 4: Privacy Policy Updates

Add to privacy policy:

```markdown
## Children's Privacy (COPPA Compliance)

TypeB takes children's privacy seriously and complies with COPPA.

### Information We Collect from Children Under 13
- First name only
- Avatar selection
- Task completion data
- Points and rewards earned
- Task validation photos (deleted after 90 days)

### Parental Rights
Parents of children under 13 have the right to:
- Review their child's personal information
- Request deletion of their child's information
- Refuse further collection or use of their child's information
- Provide consent for collection

### Parental Consent
We require verifiable parental consent before collecting information from children under 13. Parents will be contacted via email to provide consent.

### Contact for COPPA Inquiries
Email: privacy@typebapp.com
Phone: [Required phone number]
Mail: [Required mailing address]
```

### Step 5: Data Handling Service

```typescript
// src/services/coppa/CoppaService.ts
export class CoppaService {
  static async checkAge(birthDate: Date): Promise<boolean> {
    const age = this.calculateAge(birthDate);
    return age >= 13;
  }

  static async requestParentalConsent(childData: ChildData, parentEmail: string) {
    // 1. Create pending consent record
    const consentId = await firestore.collection('pending_consents').add({
      childData,
      parentEmail,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // 2. Send verification email
    await this.sendConsentEmail(parentEmail, consentId);
    
    // 3. Return consent tracking ID
    return consentId;
  }

  static async verifyParentalConsent(consentId: string, verificationData: any) {
    // Implement verification logic
    // Options: email link, credit card verification, ID upload
  }

  static async createChildAccount(childData: ChildData, consentId: string) {
    // Create restricted account
    const account = {
      ...childData,
      isUnder13: true,
      parentConsentId: consentId,
      restrictions: {
        noEmailCollection: true,
        noLocationTracking: true,
        noThirdPartySharing: true,
        autoDeletePhotos: true,
      },
    };
    
    return await firestore.collection('users').add(account);
  }

  static async enforceDataRetention() {
    // Run daily to delete old photos
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const oldPhotos = await firestore
      .collection('photos')
      .where('createdAt', '<', ninetyDaysAgo)
      .get();
    
    const batch = firestore.batch();
    oldPhotos.forEach(doc => {
      batch.delete(doc.ref);
      // Also delete from Storage
      storage.ref(doc.data().path).delete();
    });
    
    await batch.commit();
  }
}
```

### Step 6: Cloud Function for Compliance

```typescript
// functions/src/coppa.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Daily cleanup of old photos
export const enforceDataRetention = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    // Delete old photos
    const oldPhotos = await admin.firestore()
      .collection('photos')
      .where('createdAt', '<', ninetyDaysAgo)
      .get();
    
    const promises = oldPhotos.docs.map(async (doc) => {
      // Delete from Firestore
      await doc.ref.delete();
      
      // Delete from Storage
      const path = doc.data().path;
      if (path) {
        await admin.storage().bucket().file(path).delete();
      }
    });
    
    await Promise.all(promises);
    console.log(`Deleted ${oldPhotos.size} old photos`);
  });

// Monitor consent expiration
export const checkConsentExpiration = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const now = new Date();
    
    const expiredConsents = await admin.firestore()
      .collection('parental_consent')
      .where('expiresAt', '<', now)
      .get();
    
    // Notify parents of expiring consent
    // Disable child accounts if consent expires
  });
```

### Step 7: UI Components

```tsx
// src/components/coppa/ParentalConsentBanner.tsx
export const ParentalConsentBanner: React.FC = () => {
  return (
    <View style={styles.banner}>
      <Icon name="shield-check" size={20} />
      <Text>This account requires parental supervision</Text>
      <TouchableOpacity onPress={openParentalControls}>
        <Text style={styles.link}>Manage Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

// src/components/coppa/DataCollectionNotice.tsx
export const DataCollectionNotice: React.FC = () => {
  return (
    <View style={styles.notice}>
      <Text style={styles.title}>Information We Collect</Text>
      <Text>• First name only</Text>
      <Text>• Task completion data</Text>
      <Text>• Photos are deleted after 90 days</Text>
      <Text>• We never share data with third parties</Text>
      <TouchableOpacity onPress={viewFullPrivacyPolicy}>
        <Text style={styles.link}>View Full Privacy Policy</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## Testing Checklist

### Functional Testing
- [ ] Age gate prevents under-13 registration without consent
- [ ] Parental consent email is sent correctly
- [ ] Consent verification works (all methods)
- [ ] Child accounts have proper restrictions
- [ ] Parents can review child data
- [ ] Parents can delete child data
- [ ] Photos auto-delete after 90 days

### Security Testing
- [ ] Cannot bypass age gate
- [ ] Cannot modify age after account creation
- [ ] Children cannot access restricted features
- [ ] Parental consent cannot be forged
- [ ] Data encryption working

### Compliance Testing
- [ ] Privacy policy includes COPPA section
- [ ] All required disclosures present
- [ ] Data minimization enforced
- [ ] No prohibited data collected
- [ ] Audit trail maintained

## Legal Requirements Checklist

### Must Have Before Launch
- [x] Age verification mechanism
- [ ] Parental consent flow
- [ ] Privacy policy with COPPA section
- [ ] Data deletion capability
- [ ] Parental access to child data
- [ ] 90-day photo retention limit
- [ ] Secure data storage

### Should Have
- [ ] Multiple verification methods
- [ ] Consent renewal reminders
- [ ] Detailed audit logs
- [ ] Parental dashboard
- [ ] Regular compliance audits

## Resources

### Official COPPA Resources
- [FTC COPPA FAQ](https://www.ftc.gov/tips-advice/business-center/guidance/complying-coppa-frequently-asked-questions)
- [COPPA Rule Text](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312)
- [Safe Harbor Provisions](https://www.ftc.gov/safe-harbor-program)

### Implementation Examples
- [Firebase COPPA Guide](https://firebase.google.com/docs/auth/web/coppa)
- [Apple COPPA Guidelines](https://developer.apple.com/app-store/kids-apps/)
- [Google Play Families Policy](https://support.google.com/googleplay/android-developer/answer/9893335)

## Support

For COPPA compliance questions:
- Email: legal@typebapp.com
- Slack: #coppa-compliance
- Legal Counsel: [Contact Information]

---

**Critical**: Do not launch without completing all items in the "Must Have Before Launch" section. COPPA violations can result in fines up to $43,792 per violation.

**Last Updated**: January 2025  
**Review Required**: Before each release  
**Owner**: Legal & Engineering Teams