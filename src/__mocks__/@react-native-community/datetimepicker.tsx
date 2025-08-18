import React from 'react';
import { View, Text } from 'react-native';

const DateTimePicker = React.forwardRef((props: any, ref: any) => {
  return (
    <View ref={ref}>
      <Text>DateTimePicker Mock</Text>
    </View>
  );
});

DateTimePicker.displayName = 'DateTimePicker';

export default DateTimePicker;