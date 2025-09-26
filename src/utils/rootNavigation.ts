import * as React from 'react';
import { NavigationContainerRef } from '@react-navigation/native';

export const navigationRef: React.RefObject<NavigationContainerRef<any>> = React.createRef();

export function navigate(name: string, params?: any) {
  navigationRef.current?.navigate(name as never, params as never);
}

export default { navigate, navigationRef };


