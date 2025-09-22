/**
 * Image Optimization Service
 * 
 * Handles image caching, lazy loading, and optimization for better performance:
 * - Local caching with Expo FileSystem
 * - Image preloading and prefetching
 * - Size management and cleanup
 * - Progressive loading support
 */

import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry {
  url: string;
  localUri: string;
  size: number;
  lastAccessed: number;
  downloadTime: number;
}

interface ImageDimensions {
  width: number;
  height: number;
}

interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: SaveFormat;
}

class ImageOptimizationService {
  private cache: Map<string, CacheEntry> = new Map();
  private preloadQueue: string[] = [];
  private isProcessingQueue = false;
  private readonly cacheDir = `${FileSystem.cacheDirectory}images/`;
  private readonly maxCacheSize = 100 * 1024 * 1024; // 100MB
  private readonly cacheMetadataKey = 'image_cache_metadata';

  constructor() {
    this.initializeCache();
  }

  /**
   * Initialize cache directory and load metadata
   */
  private async initializeCache(): Promise<void> {
    try {
      // Ensure cache directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }

      // Load cache metadata from AsyncStorage
      const metadata = await AsyncStorage.getItem(this.cacheMetadataKey);
      if (metadata) {
        const entries = JSON.parse(metadata) as CacheEntry[];
        entries.forEach(entry => {
          this.cache.set(entry.url, entry);
        });
      }

      // Clean up old cache entries
      await this.cleanupOldCache();
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  /**
   * Cache an image from URL
   */
  async cacheImage(url: string, options?: OptimizationOptions): Promise<string> {
    // Check if already cached
    if (this.cache.has(url)) {
      const entry = this.cache.get(url)!;
      entry.lastAccessed = Date.now();
      await this.saveCacheMetadata();
      return entry.localUri;
    }

    const filename = this.generateFilename(url);
    const localUri = `${this.cacheDir}${filename}`;

    try {
      // Check if file already exists locally
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        // Update cache metadata
        const cacheEntry: CacheEntry = {
          url,
          localUri,
          size: fileInfo.size || 0,
          lastAccessed: Date.now(),
          downloadTime: Date.now(),
        };
        this.cache.set(url, cacheEntry);
        await this.saveCacheMetadata();
        return localUri;
      }

      // Download image
      const startTime = Date.now();
      const downloadResult = await FileSystem.downloadAsync(url, localUri);
      const downloadTime = Date.now() - startTime;

      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download image: ${downloadResult.status}`);
      }

      // Optimize image if options provided
      let finalUri = localUri;
      if (options) {
        finalUri = await this.optimizeImage(localUri, options);
      }

      // Get file size
      const finalFileInfo = await FileSystem.getInfoAsync(finalUri);
      
      // Create cache entry
      const cacheEntry: CacheEntry = {
        url,
        localUri: finalUri,
        size: finalFileInfo.size || 0,
        lastAccessed: Date.now(),
        downloadTime,
      };

      this.cache.set(url, cacheEntry);
      await this.saveCacheMetadata();

      // Check cache size and cleanup if needed
      await this.checkCacheSize();

      return finalUri;
    } catch (error) {
      console.error('Failed to cache image:', error);
      // Fallback to remote URL
      return url;
    }
  }

  /**
   * Optimize an image with given options
   */
  private async optimizeImage(uri: string, options: OptimizationOptions): Promise<string> {
    try {
      const actions = [];

      // Resize if dimensions provided
      if (options.maxWidth || options.maxHeight) {
        actions.push({
          resize: {
            width: options.maxWidth,
            height: options.maxHeight,
          },
        });
      }

      // Apply optimizations
      const result = await manipulateAsync(
        uri,
        actions,
        {
          compress: options.quality || 0.8,
          format: options.format || SaveFormat.JPEG,
        }
      );

      // Delete original if different from result
      if (result.uri !== uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }

      return result.uri;
    } catch (error) {
      console.error('Failed to optimize image:', error);
      return uri; // Return original if optimization fails
    }
  }

  /**
   * Preload multiple images
   */
  preloadImages(urls: string[], options?: OptimizationOptions): void {
    // Add to preload queue
    urls.forEach(url => {
      if (!this.preloadQueue.includes(url) && !this.cache.has(url)) {
        this.preloadQueue.push(url);
      }
    });

    // Start processing if not already running
    if (!this.isProcessingQueue) {
      this.processPreloadQueue(options);
    }
  }

  /**
   * Process preload queue in background
   */
  private async processPreloadQueue(options?: OptimizationOptions): Promise<void> {
    this.isProcessingQueue = true;

    while (this.preloadQueue.length > 0) {
      const url = this.preloadQueue.shift();
      if (url) {
        try {
          // Cache image with lower priority
          await this.cacheImage(url, options);
          // Also prefetch for React Native Image cache
          await Image.prefetch(url);
        } catch (error) {
          console.warn(`Failed to preload image: ${url}`, error);
        }

        // Add small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Get cached image URI or download if not cached
   */
  async getCachedImage(url: string, options?: OptimizationOptions): Promise<string> {
    return this.cacheImage(url, options);
  }

  /**
   * Check if image is cached
   */
  isCached(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalSize: number;
    itemCount: number;
    oldestItem: number;
    newestItem: number;
  }> {
    let totalSize = 0;
    let oldestItem = Date.now();
    let newestItem = 0;

    this.cache.forEach(entry => {
      totalSize += entry.size;
      oldestItem = Math.min(oldestItem, entry.downloadTime);
      newestItem = Math.max(newestItem, entry.downloadTime);
    });

    return {
      totalSize,
      itemCount: this.cache.size,
      oldestItem,
      newestItem,
    };
  }

  /**
   * Clear entire cache
   */
  async clearCache(): Promise<void> {
    try {
      // Delete cache directory
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
      
      // Recreate cache directory
      await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      
      // Clear memory cache
      this.cache.clear();
      
      // Clear metadata
      await AsyncStorage.removeItem(this.cacheMetadataKey);
      
      console.log('Image cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  }

  /**
   * Remove specific image from cache
   */
  async removeFromCache(url: string): Promise<void> {
    const entry = this.cache.get(url);
    if (entry) {
      try {
        await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
        this.cache.delete(url);
        await this.saveCacheMetadata();
      } catch (error) {
        console.error('Failed to remove image from cache:', error);
      }
    }
  }

  /**
   * Clean up old cache entries based on LRU
   */
  private async cleanupOldCache(): Promise<void> {
    const stats = await this.getCacheStats();
    
    // Skip if cache is within limits
    if (stats.totalSize <= this.maxCacheSize * 0.9) {
      return;
    }

    // Sort entries by last accessed time
    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].lastAccessed - b[1].lastAccessed
    );

    let currentSize = stats.totalSize;
    const targetSize = this.maxCacheSize * 0.7; // Clean up to 70% of max

    // Remove oldest entries until we reach target size
    for (const [url, entry] of entries) {
      if (currentSize <= targetSize) {
        break;
      }

      try {
        await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
        this.cache.delete(url);
        currentSize -= entry.size;
      } catch (error) {
        console.error('Failed to cleanup cache entry:', error);
      }
    }

    await this.saveCacheMetadata();
  }

  /**
   * Check cache size and trigger cleanup if needed
   */
  private async checkCacheSize(): Promise<void> {
    const stats = await this.getCacheStats();
    
    if (stats.totalSize > this.maxCacheSize) {
      await this.cleanupOldCache();
    }
  }

  /**
   * Save cache metadata to AsyncStorage
   */
  private async saveCacheMetadata(): Promise<void> {
    try {
      const entries = Array.from(this.cache.values());
      await AsyncStorage.setItem(this.cacheMetadataKey, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save cache metadata:', error);
    }
  }

  /**
   * Generate unique filename from URL
   */
  private generateFilename(url: string): string {
    // Extract file extension
    const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
    
    // Create hash from URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `img_${Math.abs(hash)}.${extension}`;
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(uri: string): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        reject
      );
    });
  }

  /**
   * Optimize image for thumbnail
   */
  async getThumbnail(url: string, size: number = 150): Promise<string> {
    return this.cacheImage(url, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
      format: SaveFormat.JPEG,
    });
  }

  /**
   * Batch cache images
   */
  async batchCache(urls: string[], options?: OptimizationOptions): Promise<string[]> {
    const promises = urls.map(url => this.cacheImage(url, options));
    return Promise.all(promises);
  }
}

// Export singleton instance
export default new ImageOptimizationService();
