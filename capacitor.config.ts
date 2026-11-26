import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anuradhaweera.oneline', // change before the first store upload; it can never change afterwards
  appName: 'One Line',
  webDir: 'dist',
  backgroundColor: '#0f3d44',
  android: { backgroundColor: '#0f3d44' },
  ios: { backgroundColor: '#0f3d44', contentInset: 'never' },
};

export default config;
