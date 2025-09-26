import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import realtimeSyncService, { SyncStatus as RealtimeSyncStatus } from '../../services/realtimeSyncEnhanced';
import * as Haptics from 'expo-haptics';

export const ConnectionStatus: React.FC = () => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [syncStatus, setSyncStatus] = useState<RealtimeSyncStatus>(
    realtimeSyncService.getSyncStatus()
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Subscribe to sync status updates
    const unsubscribe = realtimeSyncService.subscribeSyncStatus(setSyncStatus);

    // Show indicator when offline or syncing
    if (!syncStatus.isOnline || syncStatus.isSyncing || syncStatus.pendingChanges > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    // Pulse animation when syncing
    if (syncStatus.isSyncing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => unsubscribe();
  }, [syncStatus.isOnline, syncStatus.isSyncing, syncStatus.pendingChanges]);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  const handleForceSync = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await realtimeSyncService.forceSync();
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return { name: 'cloud-offline', color: colors.error };
    }
    if (syncStatus.isSyncing) {
      return { name: 'sync', color: colors.warning };
    }
    if (syncStatus.pendingChanges > 0) {
      return { name: 'cloud-upload', color: colors.warning };
    }
    return { name: 'cloud-done', color: colors.success };
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return 'Offline';
    }
    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }
    if (syncStatus.pendingChanges > 0) {
      return `${syncStatus.pendingChanges} pending`;
    }
    return 'Synced';
  };

  const formatLastSyncTime = () => {
    if (!syncStatus.lastSyncTime) {
      return 'Never synced';
    }

    const now = new Date();
    const lastSync = new Date(syncStatus.lastSyncTime);
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const statusIcon = getStatusIcon();

  // Don't show if online and synced
  if (syncStatus.isOnline && !syncStatus.isSyncing && syncStatus.pendingChanges === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.indicator,
          {
            backgroundColor: colors.surface,
            borderColor: statusIcon.color,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Ionicons
          name={statusIcon.name as any}
          size={16}
          color={statusIcon.color}
        />
        <Text style={[styles.statusText, { color: colors.textPrimary }]}>
          {getStatusText()}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View
          style={[
            styles.expandedContent,
            { backgroundColor: colors.surface },
          ]}
        >
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Connection:
            </Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Last sync:
            </Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {formatLastSyncTime()}
            </Text>
          </View>

          {syncStatus.pendingChanges > 0 && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Pending changes:
              </Text>
              <Text style={[styles.detailValue, { color: colors.warning }]}>
                {syncStatus.pendingChanges}
              </Text>
            </View>
          )}

          {syncStatus.error && (
            <View style={styles.errorRow}>
              <Ionicons
                name="warning"
                size={16}
                color={colors.error}
              />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {syncStatus.error}
              </Text>
            </View>
          )}

          {!syncStatus.isOnline && syncStatus.pendingChanges > 0 && (
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              Your changes will be synced when you're back online
            </Text>
          )}

          {syncStatus.isOnline && syncStatus.pendingChanges > 0 && !syncStatus.isSyncing && (
            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: colors.primary }]}
              onPress={handleForceSync}
            >
              <Ionicons name="sync" size={16} color="#FFFFFF" />
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
};

// Minimal inline indicator for headers
export const ConnectionStatusBadge: React.FC = () => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [syncStatus, setSyncStatus] = useState<RealtimeSyncStatus>(
    realtimeSyncService.getSyncStatus()
  );

  useEffect(() => {
    const unsubscribe = realtimeSyncService.subscribeSyncStatus(setSyncStatus);
    return () => unsubscribe();
  }, []);

  if (syncStatus.isOnline && !syncStatus.isSyncing && syncStatus.pendingChanges === 0) {
    return null;
  }

  const getColor = () => {
    if (!syncStatus.isOnline) return colors.error;
    if (syncStatus.isSyncing) return colors.warning;
    if (syncStatus.pendingChanges > 0) return colors.warning;
    return colors.success;
  };

  return (
    <View style={[styles.badge, { backgroundColor: getColor() }]}> 
      {syncStatus.isSyncing && (
        <Ionicons name="sync" size={10} color="#FFFFFF" />
      )}
      {!syncStatus.isOnline && (
        <Ionicons name="cloud-offline" size={10} color="#FFFFFF" />
      )}
      {syncStatus.pendingChanges > 0 && !syncStatus.isSyncing && (
        <Text style={styles.badgeText}>{syncStatus.pendingChanges}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 16,
    zIndex: 1000,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    flex: 1,
  },
  helpText: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
