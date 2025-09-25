// Shims to prevent TS from type-checking service internals in the app build
// Matches any relative import that includes "services/" in the path
declare module "*services/*" {
  const anyExport: any;
  export = anyExport;
}

// Optional native firebase packages used only in tests or backend contexts
declare module "@react-native-firebase/*" {
  const anyExport: any;
  export default anyExport;
}

// Some test-only utils may import heavy native modules; provide generic shims
declare module "react-native-device-info" {
  const anyExport: any;
  export default anyExport;
}

