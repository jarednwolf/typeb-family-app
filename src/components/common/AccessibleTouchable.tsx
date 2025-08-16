import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  AccessibilityRole,
  AccessibilityState,
  Platform,
} from 'react-native';

interface AccessibleTouchableProps extends TouchableOpacityProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  children: React.ReactNode;
  // Custom props for common patterns
  isButton?: boolean;
  isLink?: boolean;
  isTab?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
}

/**
 * AccessibleTouchable - A wrapper around TouchableOpacity that provides
 * default accessibility props and ensures all interactive elements are
 * properly accessible to screen readers.
 */
export const AccessibleTouchable: React.FC<AccessibleTouchableProps> = ({
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  children,
  isButton = false,
  isLink = false,
  isTab = false,
  isSelected = false,
  isDisabled = false,
  disabled,
  onPress,
  ...props
}) => {
  // Determine the appropriate role
  const getRole = (): AccessibilityRole | undefined => {
    if (accessibilityRole) return accessibilityRole;
    if (isButton) return 'button';
    if (isLink) return 'link';
    if (isTab) return 'tab';
    return 'button'; // Default to button for all touchable elements
  };

  // Build the accessibility state
  const getAccessibilityState = (): AccessibilityState => {
    const state: AccessibilityState = {
      ...accessibilityState,
    };

    if (isDisabled || disabled) {
      state.disabled = true;
    }

    if (isSelected !== undefined) {
      state.selected = isSelected;
    }

    return state;
  };

  // Generate a default hint if not provided
  const getAccessibilityHint = (): string | undefined => {
    if (accessibilityHint) return accessibilityHint;
    
    if (!onPress) return undefined;
    
    if (isLink) return 'Double tap to navigate';
    if (isTab) return 'Double tap to switch to this tab';
    return 'Double tap to activate';
  };

  return (
    <TouchableOpacity
      {...props}
      accessible={true}
      accessibilityRole={getRole()}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={getAccessibilityHint()}
      accessibilityState={getAccessibilityState()}
      disabled={disabled || isDisabled}
      onPress={onPress}
      // Ensure minimum touch target size
      style={[
        {
          minWidth: 44,
          minHeight: 44,
          justifyContent: 'center',
          alignItems: 'center',
        },
        props.style,
      ]}
      // Add haptic feedback on press for better user experience
      activeOpacity={props.activeOpacity ?? 0.7}
    >
      {children}
    </TouchableOpacity>
  );
};

// Export convenience components for common patterns
export const AccessibleButton: React.FC<AccessibleTouchableProps> = (props) => (
  <AccessibleTouchable {...props} isButton={true} />
);

export const AccessibleLink: React.FC<AccessibleTouchableProps> = (props) => (
  <AccessibleTouchable {...props} isLink={true} />
);

export const AccessibleTab: React.FC<AccessibleTouchableProps> = (props) => (
  <AccessibleTouchable {...props} isTab={true} />
);