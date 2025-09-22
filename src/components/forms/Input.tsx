/**
 * Input Component - Premium text input with animations
 * 
 * Features:
 * - Animated focus states
 * - Error and hint messages
 * - Icon support
 * - Password visibility toggle
 * - Clear button
 * - Character counter
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  showClearButton?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  icon,
  rightIcon,
  onRightIconPress,
  showClearButton = false,
  maxLength,
  showCharacterCount = false,
  required = false,
  style,
  value,
  onChangeText,
  onFocus,
  onBlur,
  secureTextEntry,
  editable = true,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const [showPassword, setShowPassword] = useState(false);
  const animatedBorder = useRef(new Animated.Value(0)).current;
  const animatedLabel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.parallel([
      Animated.timing(animatedBorder, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(animatedLabel, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.parallel([
      Animated.timing(animatedBorder, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(animatedLabel, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
    onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    setLocalValue(text);
    onChangeText?.(text);
  };

  const handleClear = () => {
    setLocalValue('');
    onChangeText?.('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const borderColor = animatedBorder.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.separator, error ? colors.error : colors.primary],
  });

  const labelColor = animatedLabel.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textSecondary, error ? colors.error : colors.primary],
  });

  const shouldShowClear = showClearButton && localValue.length > 0 && !rightIcon && editable;
  const shouldShowPasswordToggle = secureTextEntry && !rightIcon;
  const characterCount = localValue.length;

  return (
    <View style={styles.container}>
      {label && (
        <Animated.Text style={[styles.label, { color: labelColor }]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Animated.Text>
      )}
      
      <Animated.View 
        style={[
          styles.inputContainer,
          { borderColor: error ? colors.error : borderColor },
          !editable && styles.inputDisabled,
        ]}
      >
        {icon && (
          <View style={styles.iconLeft}>
            <Feather 
              name={icon} 
              size={20} 
              color={error ? colors.error : isFocused ? colors.primary : colors.textTertiary} 
            />
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            (rightIcon || shouldShowClear || shouldShowPasswordToggle) && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          testID={props.testID || 'input'}
          value={localValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !showPassword}
          editable={editable}
          maxLength={maxLength}
          {...props}
        />
        
        {shouldShowPasswordToggle && (
          <TouchableOpacity 
            style={styles.iconRight} 
            onPress={togglePasswordVisibility}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather 
              name={showPassword ? 'eye-off' : 'eye'} 
              size={20} 
              color={colors.textTertiary} 
            />
          </TouchableOpacity>
        )}
        
        {shouldShowClear && (
          <TouchableOpacity 
            style={styles.iconRight} 
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
        
        {rightIcon && (
          <TouchableOpacity 
            style={styles.iconRight} 
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather 
              name={rightIcon} 
              size={20} 
              color={error ? colors.error : colors.textTertiary} 
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {error && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={12} color={colors.error} />
              <Text style={styles.error}>{error}</Text>
            </View>
          )}
          {hint && !error && <Text style={styles.hint}>{hint}</Text>}
        </View>
        
        {showCharacterCount && maxLength && (
          <Text style={[
            styles.characterCount,
            characterCount >= maxLength && styles.characterCountMax
          ]}>
            {characterCount}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.S,
  },
  
  label: {
    ...typography.subheadline,
    color: colors.textPrimary,
    marginBottom: spacing.XS,
    fontWeight: '500',
  },
  
  required: {
    color: colors.error,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.separator,
    paddingHorizontal: spacing.S,
    height: 44,
  },
  
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: colors.backgroundTexture,
  },
  
  iconLeft: {
    marginRight: spacing.XS,
  },
  
  iconRight: {
    marginLeft: spacing.XS,
  },
  
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    height: '100%',
    paddingVertical: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
      default: {},
    }),
  },
  
  inputWithIcon: {
    paddingLeft: 0,
  },
  
  inputWithRightIcon: {
    paddingRight: 0,
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.XXS,
    minHeight: 16,
  },
  
  footerLeft: {
    flex: 1,
  },
  
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  error: {
    ...typography.caption1,
    color: colors.error,
    marginLeft: spacing.XXS,
  },
  
  hint: {
    ...typography.caption1,
    color: colors.textTertiary,
  },
  
  characterCount: {
    ...typography.caption1,
    color: colors.textTertiary,
    marginLeft: spacing.XS,
  },
  
  characterCountMax: {
    color: colors.warning,
  },
});

// Export specialized input variants
export const PasswordInput: React.FC<Omit<InputProps, 'secureTextEntry'>> = (props) => (
  <Input secureTextEntry {...props} />
);

export const EmailInput: React.FC<Omit<InputProps, 'keyboardType' | 'autoCapitalize'>> = (props) => (
  <Input 
    keyboardType="email-address" 
    autoCapitalize="none"
    autoCorrect={false}
    icon="mail"
    {...props} 
  />
);

export const SearchInput: React.FC<Omit<InputProps, 'icon' | 'showClearButton'>> = (props) => (
  <Input 
    icon="search" 
    showClearButton
    placeholder="Search..."
    {...props} 
  />
);

export default Input;