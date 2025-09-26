import React from 'react';
import { View, TextInput, Text } from 'react-native';

const InputBase: React.FC<any> = ({ label, value, onChangeText, placeholder, testID, style, ...props }) => {
  return (
    <View>
      {label ? <Text>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        testID={testID || 'input'}
        style={style}
        {...props}
      />
    </View>
  );
};

export const Input = InputBase;
export default InputBase;

