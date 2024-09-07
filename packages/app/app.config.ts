import type { ExpoConfig } from '@expo/config';

//const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_DEV = true;
// console.log('process.env.APP_VARIANT', process.env.APP_VARIANT);

const config: ExpoConfig = {
  name: IS_DEV ? 'Raylac (dev)' : 'Raylac',
  slug: 'raylac',
  version: '1.0.0',
  orientation: 'portrait',
  icon: IS_DEV ? './assets/icon-dev.png' : './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    config: {
      usesNonExemptEncryption: false,
    },
    bundleIdentifier: 'com.raylac',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: IS_DEV
        ? './assets/adaptive-icon-dev.png'
        : './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.raylac',
  },
  plugins: [
    [
      'expo-secure-store',
      {
        faceIDPermission: 'Allow Raylac to access your biometric data.',
      },
    ],
    'expo-asset',
    [
      '@sentry/react-native/expo',
      {
        organization: 'raylac',
        project: 'raylac',
      },
    ],
    [
      'react-native-cloud-storage',
      {
        iCloudContainerEnvironment: IS_DEV ? 'Development' : 'Production',
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '8c208206-1d5b-45a4-9cf7-724b76fde97b',
    },
  },
  owner: 'raylac',
};

export default config;
