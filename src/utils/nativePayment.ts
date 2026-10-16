import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();

export interface UPIPaymentResult {
  opened: boolean;
  copied: boolean;
  message: string;
}

/**
 * Opens a native UPI payment app (Google Pay, PhonePe, Paytm, BHIM, Cred)
 * on Android, falling back gracefully to clipboard copy on web.
 */
export async function launchUPIPayment(upiUrl: string): Promise<UPIPaymentResult> {
  if (!upiUrl || !upiUrl.startsWith('upi://')) {
    return {
      opened: false,
      copied: false,
      message: 'Invalid UPI payment link',
    };
  }

  // Always copy to clipboard for convenience
  let copied = false;
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(upiUrl);
      copied = true;
    } catch {
      // Clipboard write optional
    }
  }

  if (isNative) {
    try {
      // On Capacitor Android, setting location.href triggers the OS intent chooser for upi://
      window.location.href = upiUrl;
      return {
        opened: true,
        copied,
        message: 'Opening UPI payment app...',
      };
    } catch (err: any) {
      console.warn('Native UPI intent failed, link copied to clipboard:', err);
      return {
        opened: false,
        copied: true,
        message: 'Could not open UPI app directly. Link copied to clipboard.',
      };
    }
  }

  // On Web / Desktop Browser
  try {
    window.open(upiUrl, '_blank');
  } catch {
    // Ignore web pop-up blocks
  }

  return {
    opened: false,
    copied: true,
    message: 'UPI payment link copied to clipboard! Paste into your UPI payment app.',
  };
}
