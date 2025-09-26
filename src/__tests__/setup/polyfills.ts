// Ensure undici in Node 20+/24 has required performance APIs before any imports
const g: any = globalThis as any;
g.performance = g.performance || {};
g.performance.markResourceTiming = g.performance.markResourceTiming || (() => {});
g.performance.clearResourceTimings = g.performance.clearResourceTimings || (() => {});



