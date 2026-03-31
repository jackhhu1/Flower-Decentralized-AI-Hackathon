import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Image processing utilities for skin cancer detection
 * Handles image preprocessing to match model requirements
 */

class ImageProcessor {
  constructor() {
    // Dermamnist model requirements
    this.targetSize = 28; // 28x28 pixels
    this.targetFormat = 'JPEG';
    this.quality = 80;
  }

  /**
   * Process image for federated learning model
   * @param {string} imageUri - Local image URI
   * @returns {Promise<Object>} Processed image data
   */
  async processImage(imageUri) {
    try {
      console.log('Starting image processing for:', imageUri);
      
      // Step 1: Resize image to model input size
      const resizedImage = await this.resizeImage(imageUri);
      
      // Step 2: Convert to base64 for API transmission
      const base64Data = await this.convertToBase64(resizedImage.uri);
      
      // Step 3: Validate image data
      const processedData = await this.validateImageData({
        uri: resizedImage.uri,
        base64: base64Data,
        width: resizedImage.width,
        height: resizedImage.height,
        originalUri: imageUri
      });

      console.log('Image processing completed successfully');
      return processedData;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Resize image to model requirements
   * @param {string} imageUri - Source image URI
   * @returns {Promise<Object>} Resized image data
   */
  async resizeImage(imageUri) {
    try {
      const resizedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: this.targetSize,
              height: this.targetSize,
            },
          },
        ],
        {
          compress: this.quality / 100,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return {
        uri: resizedImage.uri,
        width: resizedImage.width,
        height: resizedImage.height,
        size: resizedImage.size || 0
      };
    } catch (error) {
      console.error('Error resizing image:', error);
      throw new Error(`Failed to resize image: ${error.message}`);
    }
  }

  /**
   * Convert image to base64 string
   * @param {string} imageUri - Image URI
   * @returns {Promise<string>} Base64 encoded image
   */
  async convertToBase64(imageUri) {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return base64;
    } catch (error) {
      console.error('Error converting to base64:', error);
      throw new Error(`Failed to convert image to base64: ${error.message}`);
    }
  }

  /**
   * Validate processed image data
   * @param {Object} imageData - Processed image data
   * @returns {Promise<Object>} Validated image data
   */
  async validateImageData(imageData) {
    const { uri, base64, width, height, originalUri } = imageData;

    // Validate dimensions
    if (width !== this.targetSize || height !== this.targetSize) {
      throw new Error(`Invalid image dimensions: ${width}x${height}. Expected: ${this.targetSize}x${this.targetSize}`);
    }

    // Validate base64 data
    if (!base64 || base64.length === 0) {
      throw new Error('Invalid base64 data');
    }

    // Validate file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Processed image file not found');
    }

    // Calculate file size in KB
    const fileSizeKB = Math.round(fileInfo.size / 1024);

    return {
      uri,
      base64,
      width,
      height,
      originalUri,
      fileSize: fileInfo.size,
      fileSizeKB,
      format: this.targetFormat,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Create image metadata for tracking
   * @param {Object} imageData - Processed image data
   * @param {Object} captureInfo - Camera capture information
   * @returns {Object} Image metadata
   */
  createImageMetadata(imageData, captureInfo = {}) {
    return {
      id: this.generateImageId(),
      originalUri: imageData.originalUri,
      processedUri: imageData.uri,
      dimensions: {
        width: imageData.width,
        height: imageData.height
      },
      fileSize: imageData.fileSize,
      format: imageData.format,
      processedAt: imageData.processedAt,
      captureInfo: {
        timestamp: captureInfo.timestamp || new Date().toISOString(),
        deviceInfo: captureInfo.deviceInfo || 'Unknown',
        cameraSettings: captureInfo.cameraSettings || {}
      }
    };
  }

  /**
   * Generate unique image ID
   * @returns {string} Unique image identifier
   */
  generateImageId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `img_${timestamp}_${random}`;
  }

  /**
   * Clean up temporary files
   * @param {Array<string>} fileUris - Array of file URIs to delete
   * @returns {Promise<void>}
   */
  async cleanupFiles(fileUris) {
    try {
      const deletePromises = fileUris.map(uri => 
        FileSystem.deleteAsync(uri, { idempotent: true })
      );
      
      await Promise.all(deletePromises);
      console.log('Temporary files cleaned up successfully');
    } catch (error) {
      console.warn('Error cleaning up files:', error);
      // Don't throw error for cleanup failures
    }
  }

  /**
   * Get image file information
   * @param {string} imageUri - Image URI
   * @returns {Promise<Object>} File information
   */
  async getImageInfo(imageUri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      
      if (!fileInfo.exists) {
        throw new Error('Image file not found');
      }

      return {
        exists: fileInfo.exists,
        size: fileInfo.size,
        sizeKB: Math.round(fileInfo.size / 1024),
        sizeMB: Math.round(fileInfo.size / (1024 * 1024) * 100) / 100,
        uri: fileInfo.uri,
        isDirectory: fileInfo.isDirectory,
        modificationTime: fileInfo.modificationTime
      };
    } catch (error) {
      console.error('Error getting image info:', error);
      throw new Error(`Failed to get image information: ${error.message}`);
    }
  }

  /**
   * Validate image before processing
   * @param {string} imageUri - Image URI to validate
   * @returns {Promise<boolean>} Validation result
   */
  async validateImage(imageUri) {
    try {
      const imageInfo = await this.getImageInfo(imageUri);
      
      // Check if file exists
      if (!imageInfo.exists) {
        throw new Error('Image file does not exist');
      }

      // Check file size (max 10MB)
      const maxSizeBytes = 10 * 1024 * 1024; // 10MB
      if (imageInfo.size > maxSizeBytes) {
        throw new Error(`Image too large: ${imageInfo.sizeMB}MB. Maximum size: 10MB`);
      }

      // Check if it's a file (not directory)
      if (imageInfo.isDirectory) {
        throw new Error('Path points to a directory, not an image file');
      }

      return true;
    } catch (error) {
      console.error('Image validation failed:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const imageProcessor = new ImageProcessor();
export default imageProcessor;
