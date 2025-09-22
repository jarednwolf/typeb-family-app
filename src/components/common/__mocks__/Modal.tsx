import React from 'react';
import { View, Text } from 'react-native';

const Modal: React.FC<any> = ({ title, visible = true, children }) => {
  if (!visible) return null;
  return (
    <View>
      {title ? <Text>{title}</Text> : null}
      <View>{children}</View>
    </View>
  );
};

export default Modal;


