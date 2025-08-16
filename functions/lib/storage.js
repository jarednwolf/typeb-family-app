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
/**
 * Generate thumbnail when photo is uploaded
 * Follows TypeB performance guidelines - max 100KB for UI assets
 */
exports.generateThumbnail = functions.storage
    .object()
    .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;
    // Only process images
    if (!contentType.startsWith('image/')) {
        console.log('[generateThumbnail] Not an image, skipping');
        return null;
    }
    // Skip if already a thumbnail
    if (filePath.includes('_thumb')) {
        console.log('[generateThumbnail] Already a thumbnail, skipping');
        return null;
    }
    // Parse file path
    const fileName = path.basename(filePath);
    const fileDir = path.dirname(filePath);
    const fileExtension = path.extname(fileName);
    const fileNameWithoutExt = path.basename(fileName, fileExtension);
    // Generate thumbnail file name
    const thumbFileName = `${fileNameWithoutExt}_thumb${fileExtension}`;
    const thumbFilePath = path.join(fileDir, thumbFileName);
    // Download file to temp directory
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const tempThumbPath = path.join(os.tmpdir(), thumbFileName);
    const bucket = admin.storage().bucket(object.bucket);
    try {
        // Download original image
        await bucket.file(filePath).download({ destination: tempFilePath });
        console.log('[generateThumbnail] Image downloaded to', tempFilePath);
        // Generate thumbnail using sharp
        // Following TypeB design: 200x200 for list views, max 100KB
        await sharp(tempFilePath)
            .resize(200, 200, {
            fit: 'cover',
            position: 'center',
        })
            .jpeg({
            quality: 80,
            progressive: true,
        })
            .toFile(tempThumbPath);
        console.log('[generateThumbnail] Thumbnail created at', tempThumbPath);
        // Check file size
        const stats = fs.statSync(tempThumbPath);
        const fileSizeInKB = stats.size / 1024;
        if (fileSizeInKB > 100) {
            // Reduce quality if over 100KB
            await sharp(tempFilePath)
                .resize(200, 200, {
                fit: 'cover',
                position: 'center',
            })
                .jpeg({
                quality: 60,
                progressive: true,
            })
                .toFile(tempThumbPath);
        }
        // Upload thumbnail
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
        // Update Firestore with thumbnail URL
        // Parse family and task IDs from path (families/{familyId}/tasks/{taskId}/photo.jpg)
        const pathParts = filePath.split('/');
        if (pathParts[0] === 'families' && pathParts[2] === 'tasks') {
            const familyId = pathParts[1];
            const taskId = pathParts[3];
            // Get signed URLs
            const [originalUrl] = await bucket.file(filePath).getSignedUrl({
                action: 'read',
                expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            const [thumbUrl] = await bucket.file(thumbFilePath).getSignedUrl({
                action: 'read',
                expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            // Update task document
            await admin.firestore()
                .doc(`families/${familyId}/tasks/${taskId}`)
                .update({
                photoUrl: originalUrl,
                photoThumbUrl: thumbUrl,
                photoUploadedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        // Clean up temp files
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