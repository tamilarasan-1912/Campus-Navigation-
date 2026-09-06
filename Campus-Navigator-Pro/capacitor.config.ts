import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tamilarasan.campusnavigator',
  appName: 'Campus Live Map',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#07101d',
  },
};

export default config;
