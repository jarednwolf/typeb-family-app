/**
 * Modal Component - Premium modal presentation
 * 
 * Features:
 * - Smooth slide-up animation
 * - Backdrop with fade
 * - Swipe to dismiss
 * - Header with close button
 * - Footer actions
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  PanResponder,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../constants/theme';
import { Button, TextButton } from './Button';
import { useTheme } from '../../contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  fullScreen?: boolean;
  scrollable?: boolean;
  primaryAction?: {
    label: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  showCloseButton = true,
  closeOnBackdrop = true,
  fullScreen = false,
  scrollable = true,
  primaryAction,
  secondaryAction,
}) => {
  const { theme, isDarkMode } = useTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Pan responder for swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10 && !fullScreen;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Show modal
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide modal
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      translateY.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const ContentWrapper = scrollable ? ScrollView : View;
  const contentWrapperProps = scrollable
    ? {
        showsVerticalScrollIndicator: false,
        bounces: false,
        overScrollMode: 'never' as const,
        alwaysBounceVertical: false,
        contentContainerStyle: styles.scrollContent,
      }
    : {};

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeOnBackdrop ? handleClose : undefined}
          />
        </Animated.View>

        {/* Modal Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <Animated.View
            style={[
              styles.modal,
              fullScreen && styles.modalFullScreen,
              {
                transform: [
                  { translateY: slideAnim },
                  { translateY: translateY },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
            {/* Drag Indicator */}
            {!fullScreen && (
              <View style={styles.dragIndicatorContainer}>
                <View style={styles.dragIndicator} />
              </View>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <View style={styles.header}>
                <View style={styles.headerText}>
                  {title && <Text style={styles.title}>{title}</Text>}
                  {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
                {showCloseButton && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="x" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Content */}
            <ContentWrapper style={styles.content} {...contentWrapperProps}>
              {children}
            </ContentWrapper>

            {/* Footer */}
            {(footer || primaryAction || secondaryAction) && (
              <View style={styles.footer}>
                {footer || (
                  <View style={styles.actions}>
                    {secondaryAction && (
                      <TextButton
                        title={secondaryAction.label}
                        onPress={secondaryAction.onPress}
                        style={styles.secondaryButton}
                      />
                    )}
                    {primaryAction && (
                      <Button
                        title={primaryAction.label}
                        onPress={primaryAction.onPress}
                        loading={primaryAction.loading}
                        disabled={primaryAction.disabled}
                        style={styles.primaryButton}
                      />
                    )}
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
};

// Bottom Sheet Modal variant
export const BottomSheet: React.FC<Omit<ModalProps, 'fullScreen'>> = (props) => (
  <Modal {...props} fullScreen={false} />
);

// Full Screen Modal variant
export const FullScreenModal: React.FC<Omit<ModalProps, 'fullScreen'>> = (props) => (
  <Modal {...props} fullScreen={true} />
);

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
  },
  
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  
  modal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: borderRadius.xlarge,
    borderTopRightRadius: borderRadius.xlarge,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0, // Safe area for iPhone X+
  },
  
  modalFullScreen: {
    maxHeight: SCREEN_HEIGHT,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.XS,
  },
  
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: theme.colors.separator,
    borderRadius: borderRadius.round,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.M,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  
  headerText: {
    flex: 1,
  },
  
  title: {
    ...typography.headline,
    color: theme.colors.textPrimary,
  },
  
  subtitle: {
    ...typography.caption1,
    color: theme.colors.textSecondary,
    marginTop: spacing.XXS,
  },
  
  closeButton: {
    marginLeft: spacing.M,
  },
  
  content: {
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.L,
    minHeight: 100,
  },
  
  scrollContent: {
    paddingBottom: spacing.L,
    flexGrow: 1,
  },
  
  footer: {
    paddingHorizontal: spacing.M,
    paddingVertical: spacing.M,
    borderTopWidth: 1,
    borderTopColor: theme.colors.separator,
  },
  
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  
  secondaryButton: {
    marginRight: spacing.S,
  },
  
  primaryButton: {
    minWidth: 100,
  },
});

export default Modal;