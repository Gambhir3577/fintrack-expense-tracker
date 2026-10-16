import { Capacitor } from '@capacitor/core';
import {
  BiometricAuth,
  BiometryType,
  AndroidBiometryStrength,
  getBiometryName,
} from '@aparajita/capacitor-biometric-auth';

export const isNative = Capacitor.isNativePlatform();

export interface BiometricAvailability {
  isAvailable: boolean;
  biometryType: BiometryType;
  biometryTitle: string;
}

/**
 * Check if the device hardware supports biometrics and has enrolled credentials
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  if (!isNative) {
    return {
      isAvailable: false,
      biometryType: BiometryType.none,
      biometryTitle: 'PIN / Password (Web)',
    };
  }

  try {
    const result = await BiometricAuth.checkBiometry();
    const biometryTitle = result.isAvailable
      ? getBiometryName(result.biometryType)
      : 'Biometrics Not Available';

    return {
      isAvailable: result.isAvailable,
      biometryType: result.biometryType,
      biometryTitle: biometryTitle || 'Fingerprint / Face Unlock',
    };
  } catch (err) {
    console.warn('Biometric availability check failed:', err);
    return {
      isAvailable: false,
      biometryType: BiometryType.none,
      biometryTitle: 'Biometrics Unavailable',
    };
  }
}

/**
 * Prompt user for biometric authentication
 */
export async function authenticateWithBiometrics(reason = 'Unlock FinTrack to access your finances'): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isNative) {
    return { success: true };
  }

  try {
    await BiometricAuth.authenticate({
      reason,
      androidTitle: 'FinTrack Security',
      androidSubtitle: 'Confirm your fingerprint or face to continue',
      cancelTitle: 'Cancel',
      androidBiometryStrength: AndroidBiometryStrength.weak,
      allowDeviceCredential: true, // allows system PIN/pattern fallback on Android
    });

    return { success: true };
  } catch (err: any) {
    console.warn('Biometric authentication failed or cancelled:', err?.message || err);
    return {
      success: false,
      error: err?.message || 'Biometric authentication was cancelled or failed',
    };
  }
}
