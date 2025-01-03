import type { ExpoConfig } from '@expo/config';

const APP_VARIANT = process.env.APP_VARIANT;

let name: string;
let bundleIdentifier: string;
let icon: string;
let adaptiveIcon: string;

switch (APP_VARIANT) {
  case 'development':
    name = 'Raylac (dev)';
    bundleIdentifier = 'com.raylac.dev';
    icon = './assets/icon-dev.png';
    adaptiveIcon = './assets/adaptive-icon-dev.png';
    break;
  case 'staging':
    name = 'Raylac (staging)';
    bundleIdentifier = 'com.raylac.staging';
    icon = './assets/icon-staging.png';
    adaptiveIcon = './assets/adaptive-icon-staging.png';
    break;
  case 'production':
    name = 'Raylac';
    bundleIdentifier = 'com.raylac.app';
    icon = './assets/icon.png';
    adaptiveIcon = './assets/adaptive-icon.png';
    break;
  default:
    throw new Error(`Unknown app variant: ${APP_VARIANT}`);
}

const config: ExpoConfig = {
  newArchEnabled: true,
  name,
  slug: 'raylac',
  version: '1.2.0',
  orientation: 'portrait',
  icon,
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
    bundleIdentifier,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: adaptiveIcon,
      backgroundColor: '#ffffff',
    },
    package: bundleIdentifier,
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
    ['expo-localization'],
    [
      'expo-font',
      {
        fonts: ['./assets/Nunito-Regular.ttf', './assets/Nunito-Bold.ttf'],
      },
    ],
  ],
  extra: {
    eas: {
      projectId: 'f1bcc97f-3192-41c1-a32e-5b1dd12049cd',
    },
    storybookEnabled: process.env.STORYBOOK_ENABLED,
  },
  updates: {
    url: 'https://u.expo.dev/f1bcc97f-3192-41c1-a32e-5b1dd12049cd',
  },
  runtimeVersion: '1.2.0',
  owner: 'raylac',
};

export default config;
