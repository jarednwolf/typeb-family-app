import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
const sharp = require('sharp');

export const generateThumbnail = functions.storage
  .object()
  .onFinalize(async (object: any) => {
    const filePath = object.name!;
    const contentType = object.contentType!;
    
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
        
        const isEmulator =
          process.env.FUNCTIONS_EMULATOR === 'true' ||
          !!process.env.STORAGE_EMULATOR_HOST ||
          !!process.env.FIREBASE_STORAGE_EMULATOR_HOST;

        let originalUrl: string;
        let thumbUrl: string;

        if (isEmulator) {
          const rawHost = process.env.STORAGE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9200';
          const hasScheme = rawHost.startsWith('http://') || rawHost.startsWith('https://');
          const base = hasScheme ? rawHost : `http://${rawHost}`;
          const bucketName = object.bucket || admin.storage().bucket().name;
          const encode = (p: string) => encodeURIComponent(p);
          originalUrl = `${base}/v0/b/${bucketName}/o/${encode(filePath)}?alt=media`;
          thumbUrl = `${base}/v0/b/${bucketName}/o/${encode(thumbFilePath)}?alt=media`;
          console.log('[generateThumbnail] Using emulator URLs', { originalUrl, thumbUrl });
        } else {
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
          } catch (signErr) {
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
      
    } catch (error) {
      console.error('[generateThumbnail] Error:', error);
      throw error;
    }
  });
