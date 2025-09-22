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
const firestore_1 = require("firebase-admin/firestore");
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
    if (before && after &&
        before.status !== 'completed' &&
        after.status === 'completed' &&
        after.photoValidationStatus === 'approved') {
        try {
            await db.runTransaction(async (transaction) => {
                const taskRef = change.after.ref;
                const memberRef = db.doc(`families/${familyId}/members/${after.assignedTo}`);
                const familyRef = db.doc(`families/${familyId}`);
                const memberDoc = await transaction.get(memberRef);
                const familyDoc = await transaction.get(familyRef);
                if (!memberDoc.exists || !familyDoc.exists) {
                    throw new Error('Member or family not found');
                }
                const memberData = memberDoc.data();
                const familyData = familyDoc.data();
                const approverId = after.photoValidatedBy;
                if (!Array.isArray(familyData.parentIds) || !familyData.parentIds.includes(approverId)) {
                    throw new Error('Only parents can approve tasks');
                }
                const pointsToAward = after.rewardPoints || 10;
                const currentPoints = typeof memberData.points === 'number' ? memberData.points : 0;
                const newPoints = currentPoints + pointsToAward;
                const currentTotalEarned = typeof memberData.totalPointsEarned === 'number' ? memberData.totalPointsEarned : 0;
                const currentTasksCompleted = typeof memberData.tasksCompleted === 'number' ? memberData.tasksCompleted : 0;
                const counters = (familyData.counters || {});
                const pendingTasks = typeof counters.pendingTasks === 'number' ? counters.pendingTasks : 0;
                const completedTasks = typeof counters.completedTasks === 'number' ? counters.completedTasks : 0;
                const totalPointsAwarded = typeof counters.totalPointsAwarded === 'number' ? counters.totalPointsAwarded : 0;
                const serverTime = firestore_1.FieldValue.serverTimestamp();
                transaction.update(memberRef, {
                    points: newPoints,
                    totalPointsEarned: currentTotalEarned + pointsToAward,
                    tasksCompleted: currentTasksCompleted + 1,
                    lastTaskCompletedAt: serverTime,
                    updatedAt: serverTime,
                });
                transaction.update(taskRef, {
                    pointsAwarded: pointsToAward,
                    pointsAwardedAt: serverTime,
                    updatedAt: serverTime,
                });
                transaction.update(familyRef, {
                    'counters.pendingTasks': pendingTasks - 1,
                    'counters.completedTasks': completedTasks + 1,
                    'counters.totalPointsAwarded': totalPointsAwarded + pointsToAward,
                    updatedAt: serverTime,
                });
                const auditRef = db.collection('auditLogs').doc();
                transaction.set(auditRef, {
                    action: 'TASK_APPROVED_POINTS_AWARDED',
                    familyId,
                    taskId,
                    memberId: after.assignedTo,
                    approverId,
                    pointsAwarded: pointsToAward,
                    timestamp: serverTime,
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
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { familyId, memberId, rewardId, pointCost } = data;
    const requesterId = context.auth.uid;
    if (!familyId || !memberId || !rewardId || !pointCost) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    try {
        const result = await db.runTransaction(async (transaction) => {
            const memberRef = db.doc(`families/${familyId}/members/${memberId}`);
            const familyRef = db.doc(`families/${familyId}`);
            const rewardRef = db.doc(`families/${familyId}/rewards/${rewardId}`);
            const memberDoc = await transaction.get(memberRef);
            const familyDoc = await transaction.get(familyRef);
            const rewardDoc = await transaction.get(rewardRef);
            if (!memberDoc.exists || !familyDoc.exists || !rewardDoc.exists) {
                throw new Error('Member, family, or reward not found');
            }
            const memberData = memberDoc.data();
            const familyData = familyDoc.data();
            const rewardData = rewardDoc.data();
            const isParent = Array.isArray(familyData.parentIds) && familyData.parentIds.includes(requesterId);
            const isSelf = memberId === requesterId;
            if (!isParent && !isSelf) {
                throw new Error('Permission denied');
            }
            const currentPoints = typeof memberData.points === 'number' ? memberData.points : 0;
            if (currentPoints < pointCost) {
                throw new Error(`Insufficient points. Has ${currentPoints}, needs ${pointCost}`);
            }
            const serverTime = firestore_1.FieldValue.serverTimestamp();
            const newPoints = currentPoints - pointCost;
            const currentTotalRedeemed = typeof memberData.totalPointsRedeemed === 'number' ? memberData.totalPointsRedeemed : 0;
            const counters = (familyData.counters || {});
            const totalPointsRedeemed = typeof counters.totalPointsRedeemed === 'number' ? counters.totalPointsRedeemed : 0;
            const pendingRedemptions = typeof counters.pendingRedemptions === 'number' ? counters.pendingRedemptions : 0;
            const redemptionRef = db.collection(`families/${familyId}/redemptions`).doc();
            const redemptionId = redemptionRef.id;
            transaction.update(memberRef, {
                points: newPoints,
                totalPointsRedeemed: currentTotalRedeemed + pointCost,
                lastRedemptionAt: serverTime,
                updatedAt: serverTime,
            });
            transaction.set(redemptionRef, {
                id: redemptionId,
                memberId,
                rewardId,
                rewardTitle: rewardData.title,
                pointCost,
                redeemedAt: serverTime,
                redeemedBy: requesterId,
                status: 'pending',
                familyId,
            });
            transaction.update(familyRef, {
                'counters.totalPointsRedeemed': totalPointsRedeemed + pointCost,
                'counters.pendingRedemptions': pendingRedemptions + 1,
                updatedAt: serverTime,
            });
            const auditRef = db.collection('auditLogs').doc();
            transaction.set(auditRef, {
                action: 'REWARD_REDEEMED',
                familyId,
                memberId,
                rewardId,
                pointCost,
                requesterId,
                timestamp: serverTime,
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