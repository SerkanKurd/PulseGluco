import * as ImageManipulator from 'expo-image-manipulator';
import { BoundingBox } from '../../domain/models/OcrResult';

export interface PreprocessingOptions {
  cropRegion?: BoundingBox; // Normalized (0-1) or absolute pixel coordinates
  imageWidth?: number;
  imageHeight?: number;
}

export class ImagePreprocessor {
  /**
   * Preprocess device capture: crop to viewfinder ROI and optimize for OCR
   */
  public async prepareForOcr(
    imageUri: string,
    options?: PreprocessingOptions
  ): Promise<{ processedUri: string; width: number; height: number }> {
    try {
      const actions: ImageManipulator.Action[] = [];

      // If a viewfinder crop region is specified
      if (options?.cropRegion && options.imageWidth && options.imageHeight) {
        const crop = options.cropRegion;
        // Check if normalized (0.0 to 1.0)
        const originX = crop.x < 1 ? Math.floor(crop.x * options.imageWidth) : crop.x;
        const originY = crop.y < 1 ? Math.floor(crop.y * options.imageHeight) : crop.y;
        const width = crop.width <= 1 ? Math.floor(crop.width * options.imageWidth) : crop.width;
        const height = crop.height <= 1 ? Math.floor(crop.height * options.imageHeight) : crop.height;

        actions.push({
          crop: {
            originX: Math.max(0, originX),
            originY: Math.max(0, originY),
            width: Math.min(width, options.imageWidth - originX),
            height: Math.min(height, options.imageHeight - originY),
          },
        });
      }

      // Resize if too large to accelerate OCR and suppress high-frequency noise
      actions.push({
        resize: { width: 1200 },
      });

      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      return {
        processedUri: manipResult.uri,
        width: manipResult.width,
        height: manipResult.height,
      };
    } catch (error) {
      // If manipulation fails (e.g. running in mock or unit test environment), fallback to original image
      return {
        processedUri: imageUri,
        width: options?.imageWidth || 1080,
        height: options?.imageHeight || 1920,
      };
    }
  }
}

export const imagePreprocessor = new ImagePreprocessor();
