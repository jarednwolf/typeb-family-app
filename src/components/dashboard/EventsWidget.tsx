/**
 * Events Widget Component
 * Shows upcoming family events on dashboard
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { colors, typography, spacing } from '../../constants/themeExtended';
import { CalendarEvent } from '../../types/community';
import { useSelector } from 'react-redux';
import { selectFamily } from '../../store/slices/familySlice';

interface EventsWidgetProps {
  onEventPress?: (event: CalendarEvent) => void;
  onSeeAll?: () => void;
  maxEvents?: number;
}

const EventsWidget: React.FC<EventsWidgetProps> = ({
  onEventPress,
  onSeeAll,
  maxEvents = 3,
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const family = useSelector(selectFamily);

  useEffect(() => {
    loadUpcomingEvents();
  }, [family]);

  const loadUpcomingEvents = async () => {
    if (!family?.id) return;
    
    try {
      setIsLoading(true);
      // TODO: Replace with actual event service call
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          familyId: family.id,
          title: 'Family Movie Night',
          description: 'Watch the new animated movie together',
          date: new Date(),
          time: '19:00',
          color: '#FF9500',
          icon: 'film',
          createdBy: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
          isAllDay: false,
          reminder: true,
          reminderTime: 30,
          participants: ['user1', 'user2', 'user3'],
        },
        {
          id: '2',
          familyId: family.id,
          title: 'Soccer Practice',
          description: 'Emma\'s soccer practice at the park',
          date: new Date(Date.now() + 86400000), // Tomorrow
          time: '16:00',
          color: '#34C759',
          icon: 'activity',
          createdBy: 'user2',
          createdAt: new Date(),
          updatedAt: new Date(),
          isAllDay: false,
          reminder: true,
          reminderTime: 60,
          participants: ['user2', 'user3'],
        },
        {
          id: '3',
          familyId: family.id,
          title: 'Grandma\'s Birthday',
          description: 'Birthday celebration at home',
          date: new Date(Date.now() + 172800000), // 2 days from now
          time: '12:00',
          color: '#FF2D55',
          icon: 'gift',
          createdBy: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
          isAllDay: false,
          reminder: true,
          reminderTime: 1440,
          participants: ['user1', 'user2', 'user3', 'user4'],
        },
      ];
      
      setEvents(mockEvents.slice(0, maxEvents));
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventTimeLabel = (event: CalendarEvent): string => {
    const eventDate = new Date(event.date);
    
    if (isToday(eventDate)) {
      return `Today at ${event.time}`;
    } else if (isTomorrow(eventDate)) {
      return `Tomorrow at ${event.time}`;
    } else {
      const daysUntil = differenceInDays(eventDate, new Date());
      if (daysUntil <= 7) {
        return `${format(eventDate, 'EEEE')} at ${event.time}`;
      }
      return `${format(eventDate, 'MMM d')} at ${event.time}`;
    }
  };

  const renderEvent = (event: CalendarEvent) => {
    const isUpcoming = differenceInDays(new Date(event.date), new Date()) <= 1;
    
    return (
      <TouchableOpacity
        key={event.id}
        style={styles.eventItem}
        onPress={() => onEventPress?.(event)}
      >
        <View
          style={[
            styles.eventIcon,
            { backgroundColor: event.color + '20' },
          ]}
        >
          <Icon
            name={event.icon as any}
            size={18}
            color={event.color}
          />
        </View>
        
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventTime}>{getEventTimeLabel(event)}</Text>
          {event.participants && (
            <View style={styles.participantsContainer}>
              <Icon name="users" size={12} color={colors.gray400} />
              <Text style={styles.participantsCount}>
                {event.participants.length} attending
              </Text>
            </View>
          )}
        </View>
        
        {isUpcoming && (
          <View style={styles.upcomingBadge}>
            <Icon name="clock" size={12} color={colors.warning} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="calendar" size={18} color={colors.primary} />
          <Text style={styles.title}>Upcoming Events</Text>
        </View>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Icon name="calendar" size={24} color={colors.gray300} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="calendar" size={24} color={colors.gray300} />
          <Text style={styles.emptyText}>No upcoming events</Text>
          <Text style={styles.emptySubtext}>
            Add family events to stay organized
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.eventsList}
          showsVerticalScrollIndicator={false}
        >
          {events.map(renderEvent)}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...typography.h4,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  seeAll: {
    ...typography.caption,
    color: colors.primary,
  },
  eventsList: {
    maxHeight: 200,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    ...typography.bodySemibold,
    color: colors.text,
    fontSize: 14,
  },
  eventTime: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  participantsCount: {
    ...typography.caption,
    color: colors.gray400,
    marginLeft: 4,
    fontSize: 11,
  },
  upcomingBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.caption,
    color: colors.gray400,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodySemibold,
    color: colors.gray700,
    marginTop: spacing.xs,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.gray500,
    marginTop: 4,
  },
});

export default EventsWidget;