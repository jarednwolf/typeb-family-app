import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { theme } from '../../constants/theme';
import notificationService from '../../services/notifications';

interface NotificationPermissionHandlerProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  showCard?: boolean;
}

export const NotificationPermissionHandler: React.FC<NotificationPermissionHandlerProps> = ({
  onPermissionGranted,
  onPermissionDenied,
  showCard = true,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    setIsChecking(true);
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        onPermissionGranted?.();
      } else if (status === 'denied') {
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const requestPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        onPermissionGranted?.();
        Alert.alert(
          '✅ Notifications Enabled',
          'You\'ll now receive reminders for your tasks!',
          [{ text: 'Great!' }]
        );
      } else if (status === 'denied') {
        onPermissionDenied?.();
        showSettingsAlert();
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      Alert.alert(
        'Error',
        'Failed to request notification permissions. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const showSettingsAlert = () => {
    Alert.alert(
      '🔔 Enable Notifications',
      'To receive task reminders, please enable notifications in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }
        },
      ]
    );
  };

  if (isChecking) {
    return null;
  }

  if (permissionStatus === 'granted') {
    return null; // Permissions already granted, no need to show anything
  }

  const content = (
    <>
      <View style={styles.iconContainer}>
        <Feather name="bell" size={48} color={theme.colors.primary} />
      </View>
      
      <Text style={styles.title}>Enable Notifications</Text>
      
      <Text style={styles.description}>
        Get timely reminders for your tasks so you never miss what's important.
      </Text>
      
      <View style={styles.benefitsList}>
        <View style={styles.benefitItem}>
          <Feather name="check-circle" size={20} color={theme.colors.success} />
          <Text style={styles.benefitText}>Smart reminders before tasks are due</Text>
        </View>
        
        <View style={styles.benefitItem}>
          <Feather name="check-circle" size={20} color={theme.colors.success} />
          <Text style={styles.benefitText}>Gentle escalation if you forget</Text>
        </View>
        
        <View style={styles.benefitItem}>
          <Feather name="check-circle" size={20} color={theme.colors.success} />
          <Text style={styles.benefitText}>Respect your quiet hours</Text>
        </View>
      </View>
      
      <Button
        title="Enable Notifications"
        onPress={requestPermission}
        variant="primary"
        icon="bell"
        style={styles.enableButton}
      />
      
      {permissionStatus === 'denied' && (
        <Button
          title="Open Settings"
          onPress={() => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }}
          variant="text"
          style={styles.settingsButton}
        />
      )}
    </>
  );

  if (!showCard) {
    return <View style={styles.container}>{content}</View>;
  }

  return (
    <Card style={styles.card}>
      {content}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.L,
  },
  card: {
    margin: theme.spacing.M,
    padding: theme.spacing.L,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.L,
  },
  title: {
    fontSize: theme.typography.title2.fontSize,
    fontWeight: '600' as const,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.S,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.L,
    lineHeight: 22,
  },
  benefitsList: {
    width: '100%',
    marginBottom: theme.spacing.XL,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.S,
  },
  benefitText: {
    fontSize: theme.typography.subheadline.fontSize,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.S,
    flex: 1,
  },
  enableButton: {
    width: '100%',
    marginBottom: theme.spacing.S,
  },
  settingsButton: {
    width: '100%',
  },
});