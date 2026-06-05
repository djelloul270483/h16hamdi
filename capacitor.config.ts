import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.project.app',
  appName: 'ResidenceApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
