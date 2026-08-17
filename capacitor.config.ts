import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fintrack.app',
  appName: 'FinTrack Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
