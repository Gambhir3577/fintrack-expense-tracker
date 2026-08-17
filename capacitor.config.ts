import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aurix.app',
  appName: 'Aurix Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
