// Type patches for third-party modules

declare module 'react-native' {
  export type TextStyle = any;
  export type ViewStyle = any;
  export const Platform: any;
  export const Animated: any;
  export const Dimensions: any;
  export const ActivityIndicator: any;
  export const Alert: any;
  export const Image: any;
  export const KeyboardAvoidingView: any;
  export const Linking: any;
  export const Modal: any;
  export const PanResponder: any;
  export const Pressable: any;
  export const RefreshControl: any;
  export const ScrollView: any;
  export const StyleSheet: any;
  export const Text: any;
  export const TextInput: any;
  export type TextInputProps = any;
  export const TouchableOpacity: any;
  export const View: any;
  export const FlatList: any;
  export function useColorScheme(): 'light' | 'dark' | null;
  export const AccessibilityInfo: {
    isScreenReaderEnabled: () => Promise<boolean>;
    isReduceMotionEnabled?: () => Promise<boolean>;
    addEventListener?: (
      eventName: string,
      listener: (value: boolean) => void
    ) => { remove: () => void };
    announceForAccessibility: (msg: string) => void;
  };
}

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
    textColor?: string;
  }

  const DateTimePicker: ComponentType<DateTimePickerProps>;
  export default DateTimePicker;
}

export {};

declare global {
  // Minimal NodeJS namespace to satisfy Timeout references without @types/node
  namespace NodeJS {
    interface Timeout {}
  }

  // Minimal process/global declarations for Expo env vars and globals
  const process: { env?: Record<string, string | undefined> };
  const global: any;
}
