// Lightweight shims for UI-facing modules to keep app type-check lean

declare module 'react-redux' {
  export const Provider: any;
  export interface DefaultRootState {}
  export type TypedUseSelectorHook<TState> = (selector: (state: TState) => any) => any;
  export function useSelector<TSelected = any>(selector: (state: any) => TSelected): TSelected;
  export function useDispatch<TDispatch = any>(): TDispatch;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  };
  export default AsyncStorage;
}

declare module '@react-navigation/native' {
  export function useNavigation(): any;
  export function useRoute(): any;
  export function useFocusEffect(effect: () => void | (() => void)): void;
}

declare module '@sentry/react-native' {
  export const ReactNativeTracing: any;
  export const ReactNavigationInstrumentation: any;
  export function captureException(error: any): void;
  export function captureMessage(message: string): void;
  export function withScope(callback: (scope: any) => void): void;
  export function addBreadcrumb(breadcrumb: any): void;
  export function setUser(user: any): void;
  export function setContext(name: string, context: any): void;
  export function startTransaction(options: any): any;
  export function flush(timeout?: number): Promise<boolean>;
  export function close(timeout?: number): Promise<boolean>;
  const Sentry: any;
  export default Sentry;
}

// Wildcard shims for app-internal modules we don't want to fully type-check here
declare module '*store/*' {
  export const store: any;
  export type RootState = any;
  const anyExport: any;
  export default anyExport;
}

declare module '*store/slices/*' {
  export const setIsDarkMode: any;
  export const loadThemeFromStorage: any;
  const anyExport: any;
  export default anyExport;
}


