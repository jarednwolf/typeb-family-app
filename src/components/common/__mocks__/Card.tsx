import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const CardBase: React.FC<any> = ({
  children,
  onPress,
  style,
  testID = 'card',
  title,
  subtitle,
  rightIcon,
  onRightIconPress,
  footer,
  variant = 'default',
  padding = 'medium',
  margin = 'medium',
  disabled,
  ...props
}) => {
  const paddingMap: any = { none: 0, small: 8, medium: 16, large: 24 };
  const marginMap: any = { none: 0, small: 4, medium: 16, large: 24 };
  const baseStyle: any = {
    backgroundColor: variant === 'outlined' ? 'transparent' : '#fff',
    borderWidth: variant === 'outlined' ? 1 : undefined,
    borderColor: variant === 'outlined' ? '#E5E5EA' : undefined,
    shadowColor: variant === 'elevated' ? '#000' : undefined,
    elevation: variant === 'elevated' ? 2 : undefined,
    borderRadius: 12,
    padding: paddingMap[padding],
    marginHorizontal: marginMap[margin],
    marginVertical: marginMap[margin] / 2,
  };

  const header = (title || subtitle || rightIcon) ? (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <View>
        {title ? <Text>{title}</Text> : null}
        {subtitle ? <Text>{subtitle}</Text> : null}
      </View>
      {rightIcon ? (
        <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress}>
          <Text>{`Icon: ${rightIcon}`}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  ) : null;

  const footerNode = footer ? (
    <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E5EA' }}>{footer}</View>
  ) : null;

  const content = (
    <View style={[baseStyle, style]} {...props}>
      {header}
      <View>{children}</View>
      {footerNode}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} testID={testID} accessibilityState={{ disabled }} style={[baseStyle, style]}>
        {content}
      </TouchableOpacity>
    );
  }
  return (
    <View testID={testID} accessibilityState={{ disabled }} style={[baseStyle, style]}>
      {content}
    </View>
  );
};

export const Card = CardBase;
export default CardBase;

export const InfoCard: React.FC<any> = ({ icon = 'info', title, description, onPress }) => (
  <CardBase onPress={onPress} padding="medium">
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ marginRight: 12 }}>
        <Text>{`Icon: ${icon}`}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text>{title}</Text>
        {description ? <Text>{description}</Text> : null}
      </View>
    </View>
  </CardBase>
);

export const ActionCard: React.FC<any> = ({ title, description, actionText, onAction, icon }) => (
  <CardBase padding="medium">
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {icon ? (
        <View testID="action-card-icon" style={{ marginRight: 12 }}>
          <Text>{`Icon: ${icon}`}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text>{title}</Text>
        {description ? <Text>{description}</Text> : null}
      </View>
      <TouchableOpacity onPress={onAction}>
        <Text>{actionText}</Text>
      </TouchableOpacity>
    </View>
  </CardBase>
);

