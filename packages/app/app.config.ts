import type { ExpoConfig } from '@expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';

const config: ExpoConfig = {
  scheme: IS_DEV ? 'credchat.dev' : 'credchat',
  name: 'creddd chat',
  slug: 'credchat',
  version: '1.0.0',
  orientation: 'portrait',
  icon: IS_DEV ? './assets/icon-dev.png' : './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    backgroundColor: '#1E1E1E',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_DEV
      ? 'com.personae.credchat.dev'
      : 'com.personae.credchat',
  },
  android: {
    package: IS_DEV ? 'com.personae.credchat.dev' : 'com.personae.credchat',
    adaptiveIcon: IS_DEV
      ? {
          foregroundImage: './assets/adaptive-icon-dev.png',
          backgroundColor: '#E1E4E8',
        }
      : {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#1E1E1E',
        },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    [
      '@sentry/react-native/expo',
      {
        organization: 'personae-labs',
        project: 'credchat',
      },
    ],
    [
      'expo-notifications',
      IS_DEV
        ? {
            icon: './assets/icon-dev.png',
            color: '#FFFFFF',
          }
        : {
            icon: './assets/icon.png',
            color: '#000000',
          },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'The app accesses your photos to set profile pictures',
      },
    ],
  ],
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: '40b66962-c4f3-4d66-b641-88901659526f',
    },
  },
  updates: {
    url: 'https://u.expo.dev/40b66962-c4f3-4d66-b641-88901659526f',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  owner: 'personae',
};

export default config;
