import React from 'react';
import { Pressable, Text, View } from 'react-native';

const BaseButton: React.FC<any> = ({
  title,
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
  variant = 'primary',
  size = 'large',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  style: styleProp,
  ...props
}) => {
  const styles: any = {};
  if (variant === 'primary') styles.backgroundColor = '#0A0A0A';
  if (variant === 'secondary') {
    styles.backgroundColor = '#FAF8F5';
    styles.borderWidth = 1;
  }
  if (variant === 'text') styles.backgroundColor = 'transparent';
  if (variant === 'danger') styles.backgroundColor = '#FF3B30';
  if (size === 'large') styles.height = 50;
  if (size === 'medium') styles.height = 44;
  if (size === 'small') styles.height = 36;
  if (fullWidth) styles.width = '100%';
  if (disabled || loading) styles.opacity = 0.5;

  const handlePress = () => {
    if (disabled || loading) return;
    onPress && onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      testID={testID}
      accessibilityState={{ disabled: !!disabled }}
      style={{ ...styles, ...(styleProp || {}) }}
      {...props}
    >
      {loading ? null : (
        <View style={{ flexDirection: 'row' }}>
          {icon && iconPosition === 'left' ? <Text>{`Icon: ${icon}`}</Text> : null}
          <Text numberOfLines={1} onPress={handlePress} accessibilityState={{ disabled: !!disabled }}>
            {title || children}
          </Text>
          {icon && iconPosition === 'right' ? <Text>{`Icon: ${icon}`}</Text> : null}
        </View>
      )}
    </Pressable>
  );
};

export const Button = BaseButton;
export default BaseButton;

export const TextButton: React.FC<any> = (props) => <BaseButton variant="text" {...props} />;
export const PrimaryButton: React.FC<any> = (props) => <BaseButton variant="primary" {...props} />;
export const SecondaryButton: React.FC<any> = (props) => <BaseButton variant="secondary" {...props} />;
export const DangerButton: React.FC<any> = (props) => <BaseButton variant="danger" {...props} />;


