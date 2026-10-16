import { registerPlugin, Capacitor } from '@capacitor/core';
import { RawSmsMessage } from './smsParser';

export const isNative = Capacitor.isNativePlatform();

interface SmsReaderPlugin {
  getRecentSms(options?: { limit?: number }): Promise<{ messages: RawSmsMessage[] }>;
}

const SmsReader = registerPlugin<SmsReaderPlugin>('SmsReader');

// Simulated bank messages for web testing and demonstration
export const DEMO_BANK_SMS: RawSmsMessage[] = [
  {
    id: 'demo-sms-1',
    sender: 'VM-HDFCBK',
    body: 'Dear Customer, INR 450.00 debited from A/C ending 4901 on 16-OCT-26 to Swiggy. Avl Bal: INR 34,210.00.',
    date: Date.now() - 3600000,
  },
  {
    id: 'demo-sms-2',
    sender: 'SBIUPI',
    body: 'Your a/c no. XX9876 is debited by Rs. 850.00 on 16Oct26 towards Uber India ref no 341291. Avl bal INR 18,500.',
    date: Date.now() - 7200000,
  },
  {
    id: 'demo-sms-3',
    sender: 'ICICIB',
    body: 'Your Acct XX4321 is credited with INR 75,000.00 on 16-Oct-26 by Salary Oct 2026. Available Balance is INR 1,12,000.',
    date: Date.now() - 86400000,
  },
  {
    id: 'demo-sms-4',
    sender: 'AMAZON',
    body: '492019 is your OTP for transaction of Rs. 1,499.00 at Amazon Pay. Do not share this OTP with anyone.',
    date: Date.now() - 90000000,
  },
  {
    id: 'demo-sms-5',
    sender: 'AXISBK',
    body: 'Rs. 2,199.00 spent on Axis Bank Credit Card ending 7781 at Blinkit Groceries on 15-Oct-26.',
    date: Date.now() - 120000000,
  },
];

/**
 * Reads recent SMS messages from Android device inbox,
 * or returns simulated bank SMS on web environments.
 */
export async function fetchRecentSms(limit = 100): Promise<{
  messages: RawSmsMessage[];
  isSimulated: boolean;
}> {
  if (isNative) {
    try {
      const res = await SmsReader.getRecentSms({ limit });
      return {
        messages: res?.messages || [],
        isSimulated: false,
      };
    } catch (err: any) {
      console.warn('Native SMS read error:', err);
      throw err;
    }
  }

  // Web environment fallback with demo bank messages
  return {
    messages: DEMO_BANK_SMS,
    isSimulated: true,
  };
}
