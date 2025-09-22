"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
const Sentry = __importStar(require("@sentry/node"));
if (!admin.apps.length) {
    admin.initializeApp();
}
// Ensure Firestore ignores undefined values in writes
try {
    admin.firestore().settings({ ignoreUndefinedProperties: true });
}
catch (_a) { }
// Initialize Sentry for Cloud Functions (no-op if DSN missing)
try {
    const sentryDsn = process.env.SENTRY_DSN_FUNCTIONS || process.env.SENTRY_DSN;
    if (sentryDsn) {
        Sentry.init({
            dsn: sentryDsn,
            environment: process.env.NODE_ENV || process.env.GCLOUD_PROJECT || 'local',
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
            profilesSampleRate: 0,
        });
    }
}
catch (_b) { }
//# sourceMappingURL=init.js.map