// 3. React Native needs crypto.getRandomValues polyfill and sha512
import 'react-native-get-random-values';
import { StatusBar } from 'expo-status-bar';
import colors from './lib/styles/colors';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamsList, RootTabsParamsList } from './navigation/types';
import Home from './screens/Home/Home';
import { NavigationContainer, ThemeProvider } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { trpc, getRpcLinks } from './lib/trpc';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import Toast from 'react-native-toast-message';
import * as Sentry from '@sentry/react-native';
import { useTranslation } from 'react-i18next';
import './i18n';
import { useEffect } from 'react';
import { getSelectedLanguage } from './i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { SheetManager, SheetProvider } from 'react-native-actions-sheet';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import './Sheets';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';

Sentry.init({
  dsn: 'https://5ea0839843bd5707f84b4e437e38d385@o4507910178799616.ingest.us.sentry.io/4507978572496896',
  debug: false,
  enabled: process.env.NODE_ENV !== 'development',
});

const Tab = createBottomTabNavigator<RootTabsParamsList>();
const RootStack = createNativeStackNavigator<RootStackParamsList>();

const Tabs = () => {
  return (
    <Tab.Navigator initialRouteName="Home">
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => (
            <AntDesign name="home" size={24} color={color} />
          ),
        }}
      ></Tab.Screen>
      <Tab.Screen
        name="Swap"
        component={Home}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIconStyle: {
            color: colors.primary,
          },
          tabBarIcon: () => (
            <AntDesign
              name="swap"
              size={24}
              color={colors.primary}
              onPress={() => SheetManager.show('swap-sheet')}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const Screens = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    (async () => {
      const lang = await getSelectedLanguage();

      if (lang) {
        i18n.changeLanguage(lang);
      } else {
        const locales = Localization.getLocales();
        if (locales.length > 0) {
          i18n.changeLanguage(locales[0].languageCode ?? 'en');
        }
      }
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
      >
        <SheetProvider>
          <RootStack.Navigator initialRouteName="Tabs">
            <RootStack.Screen
              name="Tabs"
              component={Tabs}
              options={{
                headerShown: false,
              }}
            ></RootStack.Screen>
          </RootStack.Navigator>
          <Toast></Toast>
        </SheetProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const NavigationTheme = {
  dark: false,
  colors,
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: process.env.NODE_ENV === 'development',
      // throwOnError: false,
      retry: process.env.NODE_ENV === 'development' ? false : 3,
      // retry: 3,
      gcTime: 1000 * 60 * 60 * 24,
    },
    mutations: {
      throwOnError: process.env.NODE_ENV === 'development',
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

const App = () => {
  const [loaded, error] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'Lato-Regular': require('../assets/Lato-Regular.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'Lato-Bold': require('../assets/Lato-Bold.ttf'),
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  if (!loaded) {
    return null;
  }

  const trpcClient = trpc.createClient({
    links: getRpcLinks(),
  });

  return (
    <NavigationContainer>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister, buster: '42' }}
        >
          <ThemeProvider value={NavigationTheme}>
            <Screens></Screens>
            <StatusBar style="light" />
          </ThemeProvider>
        </PersistQueryClientProvider>
      </trpc.Provider>
    </NavigationContainer>
  );
};

let AppEntryPoint = App;

if (Constants.expoConfig.extra.storybookEnabled === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AppEntryPoint = require('../.storybook').default;
}

export default Sentry.wrap(AppEntryPoint);
