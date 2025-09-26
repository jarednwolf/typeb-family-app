/**
 * Community Service
 * 
 * Central service for all community features
 * Integrates announcements, calendar, goals, and planning
 */

import { announcementService } from './announcements';
import { calendarService } from './calendar';
import { goalsService } from './goals';
import { planningService } from './planning';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { analyticsService } from './analytics';
import {
  CommunityAnalytics,
  CommunityPermissions,
  CommunityNotificationSettings,
  AnnouncementCategory,
  AnnouncementPriority,
  EventCategory,
  GoalCategory,
  PlanningType
} from '../types/community';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COMMUNITY_SETTINGS_KEY = 'community_notification_settings';

export class CommunityService {
  private static instance: CommunityService;
  private notificationSettings: CommunityNotificationSettings | null = null;

  private constructor() {
    this.loadNotificationSettings();
  }

  static getInstance(): CommunityService {
    if (!CommunityService.instance) {
      CommunityService.instance = new CommunityService();
    }
    return CommunityService.instance;
  }

  /**
   * Get user's community permissions based on role
   */
  async getUserPermissions(): Promise<CommunityPermissions> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      const isParent = userData?.role === 'parent';

      return {
        canCreateAnnouncements: true, // All family members can create announcements
        canPinAnnouncements: isParent,
        canCreateEvents: true, // All family members can create events
        canManageAllEvents: isParent,
        canCreateGoals: true, // All family members can create goals
        canInitiatePlanning: true, // All family members can initiate planning
        canMakeDecisions: isParent,
        canModerateContent: isParent
      };
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return {
        canCreateAnnouncements: false,
        canPinAnnouncements: false,
        canCreateEvents: false,
        canManageAllEvents: false,
        canCreateGoals: false,
        canInitiatePlanning: false,
        canMakeDecisions: false,
        canModerateContent: false
      };
    }
  }

  /**
   * Get community activity feed for a family
   */
  async getActivityFeed(
    familyId: string,
    limit: number = 20
  ): Promise<Array<{
    id: string;
    type: 'announcement' | 'event' | 'goal' | 'planning';
    title: string;
    description: string;
    timestamp: Date;
    icon: string;
    color: string;
    data: any;
  }>> {
    try {
      const activities: any[] = [];

      // Get recent announcements
      const announcements = await announcementService.getAnnouncements(familyId, { 
        limit: 5 
      });
      announcements.forEach(announcement => {
        activities.push({
          id: `announcement_${announcement.id}`,
          type: 'announcement',
          title: announcement.title,
          description: announcement.content.substring(0, 100),
          timestamp: announcement.createdAt,
          icon: '📢',
          color: '#2196F3',
          data: announcement
        });
      });

      // Get upcoming events
      const events = await calendarService.getUpcomingEvents(auth.currentUser?.uid || '', 7);
      events.forEach(event => {
        activities.push({
          id: `event_${event.id}`,
          type: 'event',
          title: event.title,
          description: event.description || 'No description',
          timestamp: event.startDate,
          icon: '📅',
          color: event.color,
          data: event
        });
      });

      // Get active goals
      const goals = await goalsService.getGoals(familyId, {
        status: 'in_progress' as any,
        limit: 5
      });
      goals.forEach(goal => {
        activities.push({
          id: `goal_${goal.id}`,
          type: 'goal',
          title: goal.title,
          description: `Progress: ${goal.progress}%`,
          timestamp: goal.updatedAt,
          icon: '🎯',
          color: '#4CAF50',
          data: goal
        });
      });

      // Get active planning sessions
      const sessions = await planningService.getPlanningSessions(familyId, {
        status: 'brainstorming' as any,
        limit: 5
      });
      sessions.forEach(session => {
        activities.push({
          id: `planning_${session.id}`,
          type: 'planning',
          title: session.title,
          description: session.description.substring(0, 100),
          timestamp: session.createdAt,
          icon: '📋',
          color: '#FF9800',
          data: session
        });
      });

      // Sort by timestamp (most recent first)
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Return limited results
      return activities.slice(0, limit);
    } catch (error) {
      console.error('Error getting activity feed:', error);
      return [];
    }
  }

  /**
   * Get community analytics for a family
   */
  async getAnalytics(
    familyId: string,
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<CommunityAnalytics> {
    try {
      // Get announcement stats
      const announcementStats = await announcementService.getAnnouncementStats(familyId);
      
      // Get events
      const events = await calendarService.getEvents(familyId);
      const upcomingEvents = events.filter(e => e.startDate > new Date());
      const eventsByCategory: { [key in EventCategory]?: number } = {};
      events.forEach(e => {
        eventsByCategory[e.category] = (eventsByCategory[e.category] || 0) + 1;
      });

      // Calculate attendance rate
      let totalAttendees = 0;
      let acceptedAttendees = 0;
      events.forEach(e => {
        e.attendees.forEach(a => {
          totalAttendees++;
          if (a.status === 'accepted') acceptedAttendees++;
        });
      });
      const attendanceRate = totalAttendees > 0 
        ? Math.round((acceptedAttendees / totalAttendees) * 100)
        : 0;

      // Get goal stats
      const goalStats = await goalsService.getGoalStats(familyId);
      
      // Get planning sessions
      const sessions = await planningService.getPlanningSessions(familyId);
      const completedSessions = sessions.filter(s => s.status === 'completed' as any);
      
      // Calculate average participation
      let totalParticipants = 0;
      let totalPossibleParticipants = 0;
      sessions.forEach(s => {
        totalParticipants += s.participants.filter(p => p.hasVoted).length;
        totalPossibleParticipants += s.participants.length;
      });
      const averageParticipation = totalPossibleParticipants > 0
        ? Math.round((totalParticipants / totalPossibleParticipants) * 100)
        : 0;

      // Count decisions reached
      const decisionsReached = sessions.reduce((sum, s) => sum + s.decisions.length, 0);

      // Calculate engagement scores
      const activeUsers = new Set<string>();
      Object.entries(announcementStats.byCategory || {}).forEach(([_, count]) => {
        if (count > 0) activeUsers.add(auth.currentUser?.uid || '');
      });
      goalStats.activeParticipants.forEach(uid => activeUsers.add(uid));
      
      const totalInteractions = 
        announcementStats.total + 
        events.length + 
        goalStats.total + 
        sessions.length;

      // Calculate collaboration and support scores (0-100)
      const collaborationScore = Math.min(100, Math.round(
        (goalStats.activeParticipants.size * 20) + 
        (averageParticipation * 0.5) +
        (goalStats.averageProgress * 0.3)
      ));
      
      const supportScore = Math.min(100, Math.round(
        (announcementStats.averageReadRate * 0.4) +
        (attendanceRate * 0.3) +
        (goalStats.completionRate * 0.3)
      ));

      return {
        familyId,
        period,
        announcements: {
          total: announcementStats.total,
          byCategory: announcementStats.byCategory,
          averageReadRate: announcementStats.averageReadRate,
          mostActive: Array.from(activeUsers).slice(0, 3)
        },
        calendar: {
          totalEvents: events.length,
          byCategory: eventsByCategory,
          attendanceRate,
          upcomingCount: upcomingEvents.length
        },
        goals: {
          active: goalStats.byStatus?.in_progress || 0,
          completed: goalStats.byStatus?.completed || 0,
          averageProgress: goalStats.averageProgress,
          participationRate: goalStats.activeParticipants.size > 0 ? 100 : 0,
          byCategory: goalStats.byCategory
        },
        planning: {
          totalSessions: sessions.length,
          completedSessions: completedSessions.length,
          averageParticipation,
          decisionsReached
        },
        engagement: {
          activeUsers: activeUsers.size,
          totalInteractions,
          collaborationScore,
          supportScore
        }
      };
    } catch (error) {
      console.error('Error getting community analytics:', error);
      throw error;
    }
  }

  /**
   * Load notification settings
   */
  private async loadNotificationSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(COMMUNITY_SETTINGS_KEY);
      if (stored) {
        this.notificationSettings = JSON.parse(stored);
      } else {
        // Set default settings
        this.notificationSettings = {
          announcements: {
            enabled: true,
            categories: Object.values(AnnouncementCategory),
            priorities: [AnnouncementPriority.HIGH, AnnouncementPriority.URGENT]
          },
          calendar: {
            enabled: true,
            reminderTimes: [30, 15], // 30 and 15 minutes before
            categories: Object.values(EventCategory)
          },
          goals: {
            enabled: true,
            milestoneUpdates: true,
            progressUpdates: true,
            celebrations: true
          },
          planning: {
            enabled: true,
            newSessions: true,
            votingReminders: true,
            decisions: true
          }
        };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    settings: Partial<CommunityNotificationSettings>
  ): Promise<void> {
    try {
      this.notificationSettings = {
        ...this.notificationSettings!,
        ...settings
      };
      
      await AsyncStorage.setItem(
        COMMUNITY_SETTINGS_KEY,
        JSON.stringify(this.notificationSettings)
      );

      await analyticsService.track('community_settings_updated' as any, {
        updatedSections: Object.keys(settings)
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  /**
   * Get notification settings
   */
  getNotificationSettings(): CommunityNotificationSettings | null {
    return this.notificationSettings;
  }

  /**
   * Search across all community features
   */
  async searchCommunity(
    familyId: string,
    searchTerm: string
  ): Promise<{
    announcements: any[];
    events: any[];
    goals: any[];
    sessions: any[];
  }> {
    try {
      const [announcements, events, goals, sessions] = await Promise.all([
        announcementService.searchAnnouncements(familyId, searchTerm),
        calendarService.searchEvents(familyId, searchTerm),
        goalsService.getGoals(familyId), // Filter in memory
        planningService.getPlanningSessions(familyId) // Filter in memory
      ]);

      const searchLower = searchTerm.toLowerCase();
      
      // Filter goals by search term
      const filteredGoals = goals.filter(g =>
        g.title.toLowerCase().includes(searchLower) ||
        g.description.toLowerCase().includes(searchLower)
      );

      // Filter planning sessions by search term
      const filteredSessions = sessions.filter(s =>
        s.title.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower)
      );

      return {
        announcements,
        events,
        goals: filteredGoals,
        sessions: filteredSessions
      };
    } catch (error) {
      console.error('Error searching community:', error);
      return {
        announcements: [],
        events: [],
        goals: [],
        sessions: []
      };
    }
  }

  /**
   * Get upcoming items for dashboard
   */
  async getUpcomingItems(familyId: string): Promise<{
    nextEvent?: any;
    activeGoal?: any;
    activeSession?: any;
    unreadAnnouncements: number;
  }> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Get next upcoming event
      const upcomingEvents = await calendarService.getUpcomingEvents(currentUser.uid, 7);
      const nextEvent = upcomingEvents[0];

      // Get most active goal
      const goals = await goalsService.getGoals(familyId, {
        status: 'in_progress' as any,
        limit: 1
      });
      const activeGoal = goals[0];

      // Get active planning session
      const sessions = await planningService.getPlanningSessions(familyId, {
        status: 'voting' as any,
        limit: 1
      });
      const activeSession = sessions[0];

      // Count unread announcements
      const unreadAnnouncements = (await announcementService.getAnnouncements(familyId, {
        unreadOnly: true
      })).length;

      return {
        nextEvent,
        activeGoal,
        activeSession,
        unreadAnnouncements
      };
    } catch (error) {
      console.error('Error getting upcoming items:', error);
      return {
        unreadAnnouncements: 0
      };
    }
  }

  /**
   * Initialize all community services
   */
  async initialize(): Promise<void> {
    try {
      await this.loadNotificationSettings();
      
      // Log initialization
      await analyticsService.track('community_services_initialized' as any, {
        hasSettings: !!this.notificationSettings
      });
    } catch (error) {
      console.error('Error initializing community services:', error);
    }
  }
}

// Export singleton instance
export const communityService = CommunityService.getInstance();

// Re-export individual services for direct access
export { 
  announcementService,
  calendarService,
  goalsService,
  planningService
};