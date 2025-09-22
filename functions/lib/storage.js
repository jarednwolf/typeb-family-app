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
exports.generateThumbnail = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const sharp = require('sharp');
exports.generateThumbnail = functions.storage
    .object()
    .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;
    if (!contentType.startsWith('image/')) {
        console.log('[generateThumbnail] Not an image, skipping');
        return null;
    }
    if (filePath.includes('_thumb')) {
        console.log('[generateThumbnail] Already a thumbnail, skipping');
        return null;
    }
    const fileName = path.basename(filePath);
    const fileDir = path.dirname(filePath);
    const fileExtension = path.extname(fileName);
    const fileNameWithoutExt = path.basename(fileName, fileExtension);
    const thumbFileName = `${fileNameWithoutExt}_thumb${fileExtension}`;
    const thumbFilePath = path.join(fileDir, thumbFileName);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const tempThumbPath = path.join(os.tmpdir(), thumbFileName);
    const bucket = admin.storage().bucket(object.bucket);
    try {
        await bucket.file(filePath).download({ destination: tempFilePath });
        console.log('[generateThumbnail] Image downloaded to', tempFilePath);
        await sharp(tempFilePath)
            .resize(200, 200, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80, progressive: true })
            .toFile(tempThumbPath);
        console.log('[generateThumbnail] Thumbnail created at', tempThumbPath);
        const stats = fs.statSync(tempThumbPath);
        const fileSizeInKB = stats.size / 1024;
        if (fileSizeInKB > 100) {
            await sharp(tempFilePath)
                .resize(200, 200, { fit: 'cover', position: 'center' })
                .jpeg({ quality: 60, progressive: true })
                .toFile(tempThumbPath);
        }
        await bucket.upload(tempThumbPath, {
            destination: thumbFilePath,
            metadata: {
                contentType: 'image/jpeg',
                metadata: {
                    isThumb: 'true',
                    originalFile: filePath,
                },
            },
        });
        console.log('[generateThumbnail] Thumbnail uploaded to', thumbFilePath);
        const pathParts = filePath.split('/');
        if (pathParts[0] === 'families' && pathParts[2] === 'tasks') {
            const familyId = pathParts[1];
            const taskId = pathParts[3];
            const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' ||
                !!process.env.STORAGE_EMULATOR_HOST ||
                !!process.env.FIREBASE_STORAGE_EMULATOR_HOST;
            let originalUrl;
            let thumbUrl;
            if (isEmulator) {
                const rawHost = process.env.STORAGE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9200';
                const hasScheme = rawHost.startsWith('http://') || rawHost.startsWith('https://');
                const base = hasScheme ? rawHost : `http://${rawHost}`;
                const bucketName = object.bucket || admin.storage().bucket().name;
                const encode = (p) => encodeURIComponent(p);
                originalUrl = `${base}/v0/b/${bucketName}/o/${encode(filePath)}?alt=media`;
                thumbUrl = `${base}/v0/b/${bucketName}/o/${encode(thumbFilePath)}?alt=media`;
                console.log('[generateThumbnail] Using emulator URLs', { originalUrl, thumbUrl });
            }
            else {
                try {
                    const [o] = await bucket.file(filePath).getSignedUrl({
                        action: 'read',
                        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
                    });
                    const [t] = await bucket.file(thumbFilePath).getSignedUrl({
                        action: 'read',
                        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
                    });
                    originalUrl = o;
                    thumbUrl = t;
                }
                catch (signErr) {
                    console.error('[generateThumbnail] Failed to create signed URLs (prod). Ensure service account is configured.', signErr);
                    throw signErr;
                }
            }
            await admin.firestore()
                .doc(`families/${familyId}/tasks/${taskId}`)
                .update({
                photoUrl: originalUrl,
                photoThumbUrl: thumbUrl,
                photoUploadedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        fs.unlinkSync(tempFilePath);
        fs.unlinkSync(tempThumbPath);
        return null;
    }
    catch (error) {
        console.error('[generateThumbnail] Error:', error);
        throw error;
    }
});
//# sourceMappingURL=storage.js.map