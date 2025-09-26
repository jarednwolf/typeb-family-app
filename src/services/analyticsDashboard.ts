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