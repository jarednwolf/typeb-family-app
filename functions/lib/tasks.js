"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.redeemReward = exports.approveTaskAndAwardPoints = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Atomically approve a task and award points
 * Follows TypeB data standards - uses 'parent'/'child' roles internally
 */
exports.approveTaskAndAwardPoints = functions.firestore
    .document('families/{familyId}/tasks/{taskId}')
    .onUpdate(async (change, context) => {
    const { familyId, taskId } = context.params;
    const before = change.before.data();
    const after = change.after.data();
    // Only process if status changed to 'completed' and validation approved
    if (before && after &&
        before.status !== 'completed' &&
        after.status === 'completed' &&
        after.photoValidationStatus === 'approved') {
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
                const memberData = memberDoc.data();
                const familyData = familyDoc.data();
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
        }
        catch (error) {
            console.error('[approveTaskAndAwardPoints] Transaction failed:', error);
            throw new functions.https.HttpsError('internal', 'Failed to approve task and award points');
        }
    }
});
/**
 * Atomically redeem reward points
 * Ensures points can't be double-spent
 */
exports.redeemReward = functions.https.onCall(async (data, context) => {
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
            const memberData = memberDoc.data();
            const familyData = familyDoc.data();
            const rewardData = rewardDoc.data();
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
    }
    catch (error) {
        console.error('[redeemReward] Transaction failed:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to redeem reward');
    }
});
//# sourceMappingURL=tasks.js.map