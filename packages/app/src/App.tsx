// 3. React Native needs crypto.getRandomValues polyfill and sha512
import 'react-native-get-random-values';
import { StatusBar } from 'expo-status-bar';
import colors from './lib/styles/colors';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamsList, RootTabsParamsList } from './navigation/types';
import Home from './screens/Home/Home';
import Swap from './screens/Swap/Swap';
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
import useFetchUpdates from './hooks/useFetchUpdates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import History from './screens/History/History';
import Start from './screens/Start/Start';
import SaveBackupPhrase from './screens/SaveBackupPhrase/SaveBackupPhrase';
import ConfirmBackupPhrase from './screens/ConfirmBackupPhrase/ConfirmBackupPhrase';
import ImportAccount from './screens/ImportAccount/ImportAccount';
import Settings from './screens/Settings/Settings';
import { Keyboard } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SelectRecipient from './screens/Send/SelectRecipient';
import ConfirmSend from './screens/Send/ConfirmSend';
import SelectAmount from './screens/Send/SelectAmount';
import SelectToken from './screens/Send/SelectToken';
import SelectChain from './screens/Send/SelectChain';

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
        component={Swap}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => (
            <AntDesign name="swap" size={24} color={color} />
          ),
          tabBarShowLabel: false,
        }}
      ></Tab.Screen>
      <Tab.Screen
        name="History"
        component={History}
        options={{
          tabBarLabel: () => null,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <AntDesign name="clockcircle" size={24} color={color} />
          ),
        }}
      ></Tab.Screen>
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{
          tabBarLabel: () => null,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <AntDesign name="setting" size={24} color={color} />
          ),
        }}
      ></Tab.Screen>
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
    <TouchableWithoutFeedback
      accessible={false}
      style={{ flex: 1, backgroundColor: 'blue' }}
      onPress={() => {
        Keyboard.dismiss();
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootStack.Navigator initialRouteName="Tabs">
          <RootStack.Screen
            name="Tabs"
            component={Tabs}
            options={{
              headerShown: false,
            }}
          ></RootStack.Screen>
          <RootStack.Screen
            name="Start"
            component={Start}
            options={{
              headerShown: false,
            }}
          ></RootStack.Screen>
          <RootStack.Screen
            name="SaveBackupPhrase"
            component={SaveBackupPhrase}
            options={{
              title: 'Save Backup Phrase',
              headerBackVisible: true,
              headerBackTitle: 'Back',
            }}
          ></RootStack.Screen>
          <RootStack.Screen
            name="ConfirmBackupPhrase"
            component={ConfirmBackupPhrase}
            options={{
              title: 'Confirm Backup Phrase',
              headerBackVisible: true,
            }}
          ></RootStack.Screen>
          <RootStack.Screen
            name="ImportAccount"
            component={ImportAccount}
            options={{
              title: 'Import Account',
              headerBackVisible: true,
            }}
          ></RootStack.Screen>
          <RootStack.Group
            screenOptions={{
              headerBackTitle: 'Back',
            }}
          >
            <RootStack.Screen
              name="SelectRecipient"
              component={SelectRecipient}
              options={{
                title: 'Select Recipient',
                headerBackVisible: true,
              }}
            ></RootStack.Screen>
            <RootStack.Screen
              name="SelectToken"
              component={SelectToken}
              options={{
                title: 'Select Token',
                headerBackVisible: true,
                headerBackTitle: 'Back',
              }}
            ></RootStack.Screen>
            <RootStack.Screen
              name="SelectAmount"
              component={SelectAmount}
              options={{
                title: 'Select Amount',
                headerBackVisible: true,
                headerBackTitle: 'Back',
              }}
            ></RootStack.Screen>
            <RootStack.Screen
              name="SelectChain"
              component={SelectChain}
              options={{
                title: 'Select Chain',
                headerBackVisible: true,
                headerBackTitle: 'Back',
              }}
            ></RootStack.Screen>
            <RootStack.Screen
              name="ConfirmSend"
              component={ConfirmSend}
              options={{
                title: 'Confirm Send',
                headerBackVisible: true,
                headerBackTitle: 'Back',
              }}
            ></RootStack.Screen>
          </RootStack.Group>
        </RootStack.Navigator>
        <Toast></Toast>
      </GestureHandlerRootView>
    </TouchableWithoutFeedback>
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

  const { isFetchingUpdates } = useFetchUpdates();

  if (!loaded) {
    // eslint-disable-next-line no-console
    console.log('loading fonts');
    return null;
  }

  if (isFetchingUpdates) {
    // eslint-disable-next-line no-console
    console.log('isFetchingUpdates', isFetchingUpdates);
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
          persistOptions={{
            persister: asyncStoragePersister,
            buster: process.env.EXPO_PUBLIC_CACHE_BUSTER || '0',
          }}
        >
          <ThemeProvider value={NavigationTheme}>
            <SafeAreaProvider>
              <Screens></Screens>
              <StatusBar style="dark" />
            </SafeAreaProvider>
          </ThemeProvider>
        </PersistQueryClientProvider>
      </trpc.Provider>
    </NavigationContainer>
  );
};

let AppEntryPoint = App;

if (Constants.expoConfig?.extra?.storybookEnabled === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AppEntryPoint = require('../.storybook').default;
}

export default Sentry.wrap(AppEntryPoint);
