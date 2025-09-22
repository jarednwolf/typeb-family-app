import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

const Button: React.FC<any> = ({ title, children, onPress, ...props }) => (
  <TouchableOpacity onPress={onPress} {...props}>
    <Text>{title || children}</Text>
  </TouchableOpacity>
);

export default Button;


