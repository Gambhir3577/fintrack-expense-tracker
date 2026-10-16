import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';

export const isNative = Capacitor.isNativePlatform();

export interface PickedContact {
  name: string;
  phone?: string;
  email?: string;
  upiId?: string;
}

/**
 * Checks whether contact picking is supported on this platform
 */
export function isContactPickerSupported(): boolean {
  if (isNative) return true;
  return typeof navigator !== 'undefined' && 'contacts' in navigator && 'select' in (navigator as any).contacts;
}

/**
 * Pick a single contact from the device contacts book
 * Requests runtime permission just-in-time if not already granted.
 */
export async function pickContact(): Promise<PickedContact | null> {
  // 1. Native Android / iOS via Capacitor Contacts
  if (isNative) {
    try {
      const perm = await Contacts.checkPermissions();
      if (perm.contacts !== 'granted') {
        const req = await Contacts.requestPermissions();
        if (req.contacts !== 'granted') {
          throw new Error('Contacts permission was denied');
        }
      }

      const res = await Contacts.pickContact({
        projection: {
          name: true,
          phones: true,
          emails: true,
        },
      });

      if (!res?.contact) return null;

      const c = res.contact;
      const displayName =
        c.name?.display ||
        [c.name?.given, c.name?.family].filter(Boolean).join(' ') ||
        'Friend';

      const phoneRaw = c.phones?.[0]?.number || '';
      const cleanPhone = phoneRaw.replace(/[^\d]/g, '').slice(-10);
      const email = c.emails?.[0]?.address || '';

      // Generate suggested UPI ID if valid 10-digit phone found
      const upiId = cleanPhone.length === 10 ? `${cleanPhone}@upi` : '';

      return {
        name: displayName,
        phone: phoneRaw,
        email,
        upiId,
      };
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('cancel') || msg.includes('dismissed')) {
        return null;
      }
      throw err;
    }
  }

  // 2. Web Contact Picker API (Chrome Android)
  if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'select' in (navigator as any).contacts) {
    try {
      const contactsApi = (navigator as any).contacts;
      const contacts = await contactsApi.select(['name', 'tel', 'email'], { multiple: false });

      if (!contacts || contacts.length === 0) return null;

      const c = contacts[0];
      const name = c.name?.[0] || 'Friend';
      const phone = c.tel?.[0] || '';
      const cleanPhone = phone.replace(/[^\d]/g, '').slice(-10);
      const email = c.email?.[0] || '';
      const upiId = cleanPhone.length === 10 ? `${cleanPhone}@upi` : '';

      return {
        name,
        phone,
        email,
        upiId,
      };
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('cancel') || msg.includes('abort')) {
        return null;
      }
      throw err;
    }
  }

  return null;
}
