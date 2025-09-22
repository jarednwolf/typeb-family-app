// Type patches for third-party modules

declare module '@react-native-community/datetimepicker' {
  import { ComponentType } from 'react';
  import { ViewStyle } from 'react-native';

  export interface DateTimePickerProps {
    value: Date;
    mode?: 'date' | 'time' | 'datetime';
    display?: 'default' | 'spinner' | 'calendar' | 'clock';
    onChange?: (event: any, date?: Date) => void;
    maximumDate?: Date;
    minimumDate?: Date;
    style?: ViewStyle;
  }

  const DateTimePicker: ComponentType<DateTimePickerProps>;
  export default DateTimePicker;
}

// Extend ScrollView props if needed
declare module 'react-native' {
  interface ScrollViewProps {
    refreshing?: boolean;
  }
}
