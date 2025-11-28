/**
 * Image compression utility to handle Google Sheets cell limit (50K characters)
 * Converts base64 images to smaller, compressed versions
 */

/**
 * Compress image by reducing quality and size
 * Target output: ~40KB base64 string (~30K characters) to stay under 50K limit
 * @param base64Image - Original base64 image string
 * @param maxWidth - Maximum width in pixels (default 640)
 * @param quality - JPEG quality 0-1 (default 0.6 for ~60% quality)
 * @returns Compressed base64 image string
 */
export async function compressImage(
  base64Image: string,
  maxWidth: number = 640,
  quality: number = 0.6
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create image element
      const img = new Image();
      img.onload = () => {
        try {
          // Create canvas with reduced dimensions
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > maxWidth) {
            height = Math.round((maxWidth / width) * height);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not get canvas context");

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to compressed JPEG
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      // Start loading image
      img.src = base64Image;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Check if base64 image is within Google Sheets cell limit
 * @param base64Image - Base64 image string
 * @param limitCharacters - Character limit (default 50000)
 * @returns true if within limit, false if too large
 */
export function isImageWithinLimit(
  base64Image: string,
  limitCharacters: number = 50000
): boolean {
  return base64Image.length <= limitCharacters;
}

/**
 * Get estimated size in KB from base64 string
 * @param base64Image - Base64 image string
 * @returns Size in KB
 */
export function getBase64SizeKB(base64Image: string): number {
  return Math.round(base64Image.length / 1024);
}

/**
 * Compress image iteratively until it fits within limit
 * @param base64Image - Original base64 image string
 * @param targetLimitCharacters - Target character limit (default 45000 for safety margin)
 * @returns Compressed base64 image string
 */
export async function compressImageToFitLimit(
  base64Image: string,
  targetLimitCharacters: number = 45000
): Promise<string> {
  let current = base64Image;
  let quality = 0.8;
  let maxWidth = 800;

  // First check if already fits
  if (current.length <= targetLimitCharacters) {
    return current;
  }

  // Iteratively compress
  while (quality > 0.2 && current.length > targetLimitCharacters) {
    current = await compressImage(base64Image, maxWidth, quality);
    quality -= 0.1;
    maxWidth = Math.max(320, maxWidth - 160);
  }

  // If still too large, reduce width more aggressively
  if (current.length > targetLimitCharacters) {
    current = await compressImage(base64Image, 320, 0.4);
  }

  // Final fallback: very aggressive compression
  if (current.length > targetLimitCharacters) {
    current = await compressImage(base64Image, 240, 0.3);
  }

  return current;
}
