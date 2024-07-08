import type { ExpoConfig } from '@expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';

const config: ExpoConfig = {
  name: IS_DEV ? 'sutori-dev' : 'sutori',
  slug: 'sutori',
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
    bundleIdentifier: 'com.dantehrani.sutori',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: IS_DEV
        ? './assets/adaptive-icon-dev.png'
        : './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.dantehrani.sutori',
  },
  plugins: [
    [
      'expo-secure-store',
      {
        faceIDPermission: 'Allow Sutori to access your biometric data.',
      },
    ],
    'expo-asset',
    [
      '@sentry/react-native/expo',
      {
        organization: 'sutori',
        project: 'sutori',
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '8c208206-1d5b-45a4-9cf7-724b76fde97b',
    },
  },
  owner: 'dantehrani',
};

export default config;
