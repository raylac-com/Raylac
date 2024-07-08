// 3. React Native needs crypto.getRandomValues polyfill and sha512
import 'react-native-get-random-values';
import { StatusBar } from 'expo-status-bar';
import { theme } from './lib/theme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamsList, RootTabsParamsList } from './navigation/types';
import Home from './screens/Home';
import SignUp from './screens/SignUp';
import { NavigationContainer, ThemeProvider } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { trpc, rpcLinks } from './lib/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConfirmDeposit from './screens/Deposit/ConfirmDeposit';
import SelectSend from './screens/Send/SelectSend';
import ConfirmSend from './screens/Send/ConfirmSend';
import Account from './screens/Account';
import SendToSutoriUser from './screens/Send/SendToSutoriUser';
import SendToNonSutoriUser from './screens/Send/SendToNonSutoriUser';
import Toast from 'react-native-toast-message';
import TransferHistory from './screens/TransferHistory';
import * as Sentry from '@sentry/react-native';
import SignIn from './screens/Start';
import EnterSendAmount from './screens/Send/EnterSendAmount';
import EnterDepositAmount from './screens/Deposit/EnterDepositAmount';
import { useTranslation } from 'react-i18next';
import './i18n';

Sentry.init({
  dsn: 'https://adc4c437047fef7e4ebe5d0d77df3ff5@o1348995.ingest.us.sentry.io/4507536730030080',
  debug: process.env.NODE_ENV === 'development',
});

const Tab = createBottomTabNavigator<RootTabsParamsList>();
const RootStack = createNativeStackNavigator<RootStackParamsList>();

const Tabs = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          title: t('title', { ns: 'Home' }),
          tabBarIcon: ({ color }) => (
            <AntDesign name="home" size={24} color={color} />
          ),
        }}
      ></Tab.Screen>
      <Tab.Screen
        name="Account"
        component={Account}
        options={{
          title: t('title', { ns: 'Account' }),
          tabBarIcon: ({ color }) => (
            <AntDesign name="user" size={24} color={color} />
          ),
        }}
      ></Tab.Screen>
    </Tab.Navigator>
  );
};

const Screens = () => {
  const { t } = useTranslation();

  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="Tabs"
        component={Tabs}
        options={{
          headerShown: false,
        }}
      ></RootStack.Screen>
      <RootStack.Screen
        name="SignUp"
        component={SignUp}
        options={{
          headerBackVisible: false,
        }}
      ></RootStack.Screen>
      <RootStack.Screen
        name="SignIn"
        component={SignIn}
        options={{
          title: t('title', { ns: 'SignIn' }),
          headerBackVisible: false,
        }}
      ></RootStack.Screen>
      <RootStack.Group
        screenOptions={{
          headerBackTitle: 'Back',
        }}
      >
        <RootStack.Screen
          name="EnterDepositAmount"
          component={EnterDepositAmount}
          options={{
            title: t('title', { ns: 'EnterDepositAmount' }),
            headerBackVisible: true,
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="ConfirmDeposit"
          component={ConfirmDeposit}
          options={{
            title: t('title', { ns: 'ConfirmDeposit' }),
            headerBackVisible: true,
          }}
        ></RootStack.Screen>
      </RootStack.Group>
      <RootStack.Group
        screenOptions={{
          headerBackTitle: 'Back',
        }}
      >
        <RootStack.Screen
          name="SelectSend"
          component={SelectSend}
          options={{
            title: t('title', { ns: 'SelectSend' }),
            headerBackVisible: true,
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="SendToSutoriUser"
          component={SendToSutoriUser}
          options={{
            title: t('title', { ns: 'SendToSutoriUser' }),
            headerBackVisible: true,
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="SendToNonSutoriUser"
          component={SendToNonSutoriUser}
          options={{
            title: t('title', { ns: 'SendToNonSutoriUser' }),
            headerBackVisible: true,
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="EnterSendAmount"
          component={EnterSendAmount}
          options={{
            title: t('title', { ns: 'EnterSendAmount' }),
            headerBackVisible: true,
            headerBackTitle: 'Back',
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="ConfirmSend"
          component={ConfirmSend}
          options={{
            title: t('title', { ns: 'ConfirmSend' }),
            headerBackVisible: true,
            headerBackTitle: 'Back',
          }}
        ></RootStack.Screen>
      </RootStack.Group>
      <RootStack.Screen
        name="TransferHistory"
        component={TransferHistory}
        options={{
            title: t('title', { ns: 'TransferHistory' }),
          headerBackVisible: true,
        }}
      ></RootStack.Screen>
    </RootStack.Navigator>
  );
};

const NavigationTheme = {
  dark: true,
  colors: theme,
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: process.env.NODE_ENV === 'development',
      retry: process.env.NODE_ENV === 'development' ? false : 3,
      gcTime: 1000 * 60 * 60 * 24,
    },
    mutations: {
      throwOnError: process.env.NODE_ENV === 'development',
    },
  },
});

export default function App() {
  const trpcClient = trpc.createClient({
    links: rpcLinks,
  });

  return (
    <NavigationContainer>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={NavigationTheme}>
            <Screens></Screens>
            <StatusBar style="light" />
            <Toast></Toast>
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </NavigationContainer>
  );
}
