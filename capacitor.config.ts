import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fintrack.app',
  appName: 'FinTrack AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
