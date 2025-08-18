/**
 * Calendar Service
 * 
 * Manages family calendar events and scheduling
 * Promotes family togetherness and shared activities
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  CalendarEvent,
  EventCategory,
  EventStatus,
  EventAttendee,
  AttendeeStatus,
  EventReminder,
  RecurrenceRule,
  EventAttachment
} from '../types/community';
import { analyticsService } from './analytics';
import notificationService from './notifications';
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  differenceInMinutes
} from 'date-fns';

const EVENTS_COLLECTION = 'calendarEvents';
const MAX_ATTACHMENTS = 3;
const MAX_DESCRIPTION_LENGTH = 1000;
const DEFAULT_REMINDER_MINUTES = 30;
const MAX_RECURRENCE_COUNT = 100;

// Event colors by category
const EVENT_COLORS: { [key in EventCategory]: string } = {
  [EventCategory.APPOINTMENT]: '#4A90E2',
  [EventCategory.BIRTHDAY]: '#F5A623',
  [EventCategory.HOLIDAY]: '#BD10E0',
  [EventCategory.SCHOOL]: '#7ED321',
  [EventCategory.SPORTS]: '#50E3C2',
  [EventCategory.FAMILY_TIME]: '#F8E71C',
  [EventCategory.MEDICAL]: '#D0021B',
  [EventCategory.VACATION]: '#9013FE',
  [EventCategory.MILESTONE]: '#B8E986',
  [EventCategory.OTHER]: '#9B9B9B'
};

export class CalendarService {
  private static instance: CalendarService;

  private constructor() {}

  static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  /**
   * Create a new calendar event
   */
  async createEvent(
    familyId: string,
    data: {
      title: string;
      description?: string;
      startDate: Date;
      endDate: Date;
      isAllDay?: boolean;
      location?: string;
      category?: EventCategory;
      attendees?: string[]; // User IDs
      reminders?: number[]; // Minutes before event
      recurrence?: RecurrenceRule;
      attachments?: EventAttachment[];
      isPrivate?: boolean;
      metadata?: {
        goalId?: string;
        taskIds?: string[];
        announcementId?: string;
      };
    }
  ): Promise<CalendarEvent> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Validate dates
      if (isAfter(data.startDate, data.endDate)) {
        throw new Error('End date must be after start date');
      }

      // Validate description length
      if (data.description && data.description.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`Description exceeds ${MAX_DESCRIPTION_LENGTH} characters`);
      }

      // Validate attachments
      if (data.attachments && data.attachments.length > MAX_ATTACHMENTS) {
        throw new Error(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
      }

      // Get creator details
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      // Prepare attendees list
      const attendees: EventAttendee[] = [];
      if (data.attendees) {
        for (const userId of data.attendees) {
          const attendeeDoc = await getDoc(doc(db, 'users', userId));
          const attendeeData = attendeeDoc.data();
          
          attendees.push({
            userId,
            name: attendeeData?.displayName || 'Family Member',
            avatar: attendeeData?.avatar,
            status: userId === currentUser.uid ? AttendeeStatus.ACCEPTED : AttendeeStatus.PENDING,
            isRequired: false,
            responseTime: userId === currentUser.uid ? new Date() : undefined
          });
        }
      }

      // Add creator if not in attendees
      if (!attendees.find(a => a.userId === currentUser.uid)) {
        attendees.push({
          userId: currentUser.uid,
          name: userData?.displayName || 'Family Member',
          avatar: userData?.avatar,
          status: AttendeeStatus.ACCEPTED,
          isRequired: true,
          responseTime: new Date()
        });
      }

      // Prepare reminders
      const reminders: EventReminder[] = (data.reminders || [DEFAULT_REMINDER_MINUTES]).map(minutes => ({
        id: `${Date.now()}_${minutes}`,
        minutes,
        type: 'notification',
        sentTo: []
      }));

      // Create event
      const event: Omit<CalendarEvent, 'id'> = {
        familyId,
        creatorId: currentUser.uid,
        creatorName: userData?.displayName || 'Family Member',
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        isAllDay: data.isAllDay || false,
        location: data.location,
        category: data.category || EventCategory.OTHER,
        color: EVENT_COLORS[data.category || EventCategory.OTHER],
        attendees,
        reminders,
        recurrence: data.recurrence,
        attachments: data.attachments || [],
        isPrivate: data.isPrivate || false,
        status: EventStatus.CONFIRMED,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: data.metadata
      };

      const docRef = await addDoc(collection(db, EVENTS_COLLECTION), event);
      const createdEvent = {
        id: docRef.id,
        ...event
      };

      // Schedule reminders
      await this.scheduleEventReminders(createdEvent);

      // Notify attendees
      await this.notifyAttendees(createdEvent, 'invite');

      // Generate recurring events if needed
      if (data.recurrence) {
        await this.generateRecurringEvents(createdEvent);
      }

      // Log analytics
      await analyticsService.track('calendar_event_created' as any, {
        category: data.category,
        isRecurring: !!data.recurrence,
        attendeeCount: attendees.length,
        hasReminders: reminders.length > 0
      });

      return createdEvent;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Get events for a family
   */
  async getEvents(
    familyId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      category?: EventCategory;
      attendeeId?: string;
      includePrivate?: boolean;
      limit?: number;
    }
  ): Promise<CalendarEvent[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      let constraints: any[] = [
        where('familyId', '==', familyId)
      ];

      // Apply date filters
      if (options?.startDate) {
        constraints.push(where('startDate', '>=', Timestamp.fromDate(options.startDate)));
      }
      if (options?.endDate) {
        constraints.push(where('endDate', '<=', Timestamp.fromDate(options.endDate)));
      }

      // Apply category filter
      if (options?.category) {
        constraints.push(where('category', '==', options.category));
      }

      // Order by start date
      constraints.push(orderBy('startDate', 'asc'));

      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      const q = query(collection(db, EVENTS_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      let events = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as CalendarEvent[];

      // Filter by attendee if specified
      if (options?.attendeeId) {
        events = events.filter(e => 
          e.attendees.some(a => a.userId === options.attendeeId)
        );
      }

      // Filter private events
      if (!options?.includePrivate) {
        events = events.filter(e => 
          !e.isPrivate || 
          e.creatorId === currentUser.uid ||
          e.attendees.some(a => a.userId === currentUser.uid)
        );
      }

      // Filter cancelled events
      events = events.filter(e => e.status !== EventStatus.CANCELLED);

      return events;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  /**
   * Update event attendance status
   */
  async updateAttendance(
    eventId: string,
    status: AttendeeStatus,
    note?: string
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const eventDoc = await getDoc(doc(db, EVENTS_COLLECTION, eventId));
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const event = eventDoc.data() as CalendarEvent;
      
      // Find attendee
      const attendeeIndex = event.attendees.findIndex(a => a.userId === currentUser.uid);
      if (attendeeIndex === -1) {
        throw new Error('You are not invited to this event');
      }

      // Update attendee status
      event.attendees[attendeeIndex].status = status;
      event.attendees[attendeeIndex].responseTime = new Date();
      if (note) {
        event.attendees[attendeeIndex].note = note;
      }

      await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
        attendees: event.attendees,
        updatedAt: serverTimestamp()
      });

      // Notify event creator
      if (event.creatorId !== currentUser.uid) {
        await this.notifyCreator(event, status);
      }

      await analyticsService.track('calendar_attendance_updated' as any, {
        eventId,
        status
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  }

  /**
   * Update calendar event
   */
  async updateEvent(
    eventId: string,
    updates: Partial<{
      title: string;
      description: string;
      startDate: Date;
      endDate: Date;
      isAllDay: boolean;
      location: string;
      category: EventCategory;
      status: EventStatus;
    }>
  ): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Check permissions
      const eventDoc = await getDoc(doc(db, EVENTS_COLLECTION, eventId));
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const event = eventDoc.data() as CalendarEvent;
      if (event.creatorId !== currentUser.uid) {
        throw new Error('Only the event creator can update the event');
      }

      // Validate dates if updating
      if (updates.startDate && updates.endDate) {
        if (isAfter(updates.startDate, updates.endDate)) {
          throw new Error('End date must be after start date');
        }
      }

      // Update color if category changes
      if (updates.category) {
        (updates as any).color = EVENT_COLORS[updates.category];
      }

      await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Notify attendees of changes
      if (event.attendees.length > 1) {
        await this.notifyAttendees({ ...event, ...updates } as CalendarEvent, 'update');
      }

      await analyticsService.track('calendar_event_updated' as any, {
        eventId,
        updatedFields: Object.keys(updates)
      });
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Check permissions
      const eventDoc = await getDoc(doc(db, EVENTS_COLLECTION, eventId));
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const event = eventDoc.data() as CalendarEvent;
      
      // Check if user is creator or admin
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      const isCreator = event.creatorId === currentUser.uid;
      const isAdmin = userData?.role === 'parent';

      if (!isCreator && !isAdmin) {
        throw new Error('Insufficient permissions to delete event');
      }

      // Notify attendees of cancellation
      if (event.attendees.length > 0) {
        await this.notifyAttendees(event, 'cancel');
      }

      await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));

      await analyticsService.track('calendar_event_deleted' as any, { eventId });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Get upcoming events for a user
   */
  async getUpcomingEvents(
    userId: string,
    days: number = 7
  ): Promise<CalendarEvent[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Get user's family
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      if (!userData?.familyId) {
        return [];
      }

      const now = new Date();
      const endDate = addDays(now, days);

      const events = await this.getEvents(userData.familyId, {
        startDate: now,
        endDate,
        attendeeId: userId
      });

      // Filter to only events user is attending
      return events.filter(e => {
        const attendee = e.attendees.find(a => a.userId === userId);
        return attendee && attendee.status === AttendeeStatus.ACCEPTED;
      });
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      throw error;
    }
  }

  /**
   * Get events for a specific date range
   */
  async getEventsByDateRange(
    familyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ [date: string]: CalendarEvent[] }> {
    try {
      const events = await this.getEvents(familyId, {
        startDate,
        endDate
      });

      // Group events by date
      const eventsByDate: { [date: string]: CalendarEvent[] } = {};
      
      events.forEach(event => {
        const dateKey = format(event.startDate, 'yyyy-MM-dd');
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
      });

      return eventsByDate;
    } catch (error) {
      console.error('Error getting events by date range:', error);
      throw error;
    }
  }

  /**
   * Search events
   */
  async searchEvents(
    familyId: string,
    searchTerm: string
  ): Promise<CalendarEvent[]> {
    try {
      const events = await this.getEvents(familyId);
      
      const searchLower = searchTerm.toLowerCase();
      return events.filter(e => 
        e.title.toLowerCase().includes(searchLower) ||
        (e.description && e.description.toLowerCase().includes(searchLower)) ||
        (e.location && e.location.toLowerCase().includes(searchLower)) ||
        e.creatorName.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  }

  /**
   * Subscribe to calendar updates
   */
  subscribeToCalendar(
    familyId: string,
    callback: (events: CalendarEvent[]) => void
  ): () => void {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('familyId', '==', familyId),
      where('status', '!=', EventStatus.CANCELLED),
      orderBy('status'),
      orderBy('startDate', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const events = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as CalendarEvent[];
        
        callback(events);
      },
      (error) => {
        console.error('Error subscribing to calendar:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Private helper methods
   */
  
  private async scheduleEventReminders(event: CalendarEvent): Promise<void> {
    try {
      // Schedule reminders for accepted attendees
      const acceptedAttendees = event.attendees.filter(a => 
        a.status === AttendeeStatus.ACCEPTED
      );

      for (const reminder of event.reminders) {
        const reminderTime = new Date(event.startDate.getTime() - reminder.minutes * 60 * 1000);
        
        if (isAfter(reminderTime, new Date())) {
          // Schedule notification for each accepted attendee
          // This would integrate with your notification system
          console.log(`Reminder scheduled for ${reminderTime} for event ${event.id}`);
        }
      }
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  }

  private async notifyAttendees(
    event: CalendarEvent,
    type: 'invite' | 'update' | 'cancel'
  ): Promise<void> {
    try {
      const notifications = event.attendees
        .filter(a => a.userId !== event.creatorId)
        .map(async (attendee) => {
          let title = '';
          let body = '';
          
          switch (type) {
            case 'invite':
              title = '📅 New Event Invitation';
              body = `You're invited to "${event.title}" on ${format(event.startDate, 'MMM d, h:mm a')}`;
              break;
            case 'update':
              title = '📝 Event Updated';
              body = `"${event.title}" has been updated`;
              break;
            case 'cancel':
              title = '❌ Event Cancelled';
              body = `"${event.title}" has been cancelled`;
              break;
          }

          // Send notification
          console.log(`Notification to ${attendee.userId}:`, { title, body });
        });

      await Promise.all(notifications);
    } catch (error) {
      console.error('Error notifying attendees:', error);
    }
  }

  private async notifyCreator(event: CalendarEvent, status: AttendeeStatus): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      
      let statusText = '';
      switch (status) {
        case AttendeeStatus.ACCEPTED:
          statusText = 'accepted';
          break;
        case AttendeeStatus.DECLINED:
          statusText = 'declined';
          break;
        case AttendeeStatus.MAYBE:
          statusText = 'marked as maybe for';
          break;
      }

      const title = '📅 RSVP Update';
      const body = `${userData?.displayName || 'Someone'} ${statusText} "${event.title}"`;
      
      // Send notification to creator
      console.log(`Notification to ${event.creatorId}:`, { title, body });
    } catch (error) {
      console.error('Error notifying creator:', error);
    }
  }

  private async generateRecurringEvents(
    originalEvent: CalendarEvent
  ): Promise<void> {
    try {
      if (!originalEvent.recurrence) return;

      const { frequency, interval, endDate, occurrences } = originalEvent.recurrence;
      const events: CalendarEvent[] = [];
      let currentDate = originalEvent.startDate;
      let count = 0;

      while (
        count < (occurrences || MAX_RECURRENCE_COUNT) &&
        (!endDate || isBefore(currentDate, endDate))
      ) {
        // Calculate next occurrence
        switch (frequency) {
          case 'daily':
            currentDate = addDays(currentDate, interval);
            break;
          case 'weekly':
            currentDate = addWeeks(currentDate, interval);
            break;
          case 'monthly':
            currentDate = addMonths(currentDate, interval);
            break;
          case 'yearly':
            currentDate = addYears(currentDate, interval);
            break;
        }

        if (endDate && isAfter(currentDate, endDate)) {
          break;
        }

        // Create recurring event (without recurrence to avoid infinite loop)
        const duration = differenceInMinutes(originalEvent.endDate, originalEvent.startDate);
        const recurringEvent = {
          ...originalEvent,
          startDate: currentDate,
          endDate: new Date(currentDate.getTime() + duration * 60 * 1000),
          recurrence: undefined, // Don't copy recurrence
          metadata: {
            ...originalEvent.metadata,
            originalEventId: originalEvent.id
          }
        };

        delete (recurringEvent as any).id; // Remove ID for new document
        
        // Add to database
        await addDoc(collection(db, EVENTS_COLLECTION), recurringEvent);
        
        count++;
      }
    } catch (error) {
      console.error('Error generating recurring events:', error);
    }
  }
}

export const calendarService = CalendarService.getInstance();