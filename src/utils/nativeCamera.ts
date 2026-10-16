import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

export interface CapturedPhoto {
  dataUrl: string;
  format: string;
}

export const isNative = Capacitor.isNativePlatform();

/**
 * Capture a photo using @capacitor/camera on native platforms,
 * or returns null on web platforms so caller can fallback to file input.
 */
export async function capturePhoto(source: 'camera' | 'photos' | 'prompt' = 'prompt'): Promise<CapturedPhoto | null> {
  if (!isNative) {
    return null;
  }

  const cameraSource =
    source === 'camera'
      ? CameraSource.Camera
      : source === 'photos'
      ? CameraSource.Photos
      : CameraSource.Prompt;

  try {
    const photo: Photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: cameraSource,
      saveToGallery: false,
    });

    if (!photo.dataUrl) {
      throw new Error('No image data returned from camera');
    }

    return {
      dataUrl: photo.dataUrl,
      format: photo.format || 'jpeg',
    };
  } catch (error: any) {
    // Check if the user cancelled the capture
    const msg = error?.message?.toLowerCase() || '';
    if (msg.includes('cancelled') || msg.includes('cancel') || msg.includes('dismissed')) {
      return null;
    }
    throw error;
  }
}
