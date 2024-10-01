import type { ExpoConfig } from '@expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';

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
        url: 'https://sentry.io/',
        organization: 'raylac',
        project: 'raylac-app',
      },
    ],
    [
      'react-native-cloud-storage',
      {
        iCloudContainerEnvironment: IS_DEV ? 'Development' : 'Production',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'The app accesses your photos to set your profile picture.',
      },
    ],
  ],
  extra: {
    eas: {
      projectId: 'f1bcc97f-3192-41c1-a32e-5b1dd12049cd',
    },
  },
  updates: {
    url: 'https://u.expo.dev/f1bcc97f-3192-41c1-a32e-5b1dd12049cd',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  owner: 'raylac',
};

export default config;
