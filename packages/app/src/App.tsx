// 3. React Native needs crypto.getRandomValues polyfill and sha512
import 'react-native-get-random-values';
import { StatusBar } from 'expo-status-bar';
import { theme } from './lib/theme';
import {
  NativeStackNavigationProp,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamsList, RootTabsParamsList } from './navigation/types';
import Home from './screens/Home';
import SignUp from './screens/SignUp';
import {
  NavigationContainer,
  ThemeProvider,
  useNavigation,
} from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { trpc, rpcLinks } from './lib/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useIsSignedIn from './hooks/useIsSignedIn';
import { useEffect } from 'react';
import ConfirmDeposit from './screens/Deposit/ConfirmDeposit';
import SelectSend from './screens/Send/SelectSend';
import ConfirmSend from './screens/Send/ConfirmSend';
import Account from './screens/Account';
import Receive from './screens/Receive';
import SendToSutoriUser from './screens/Send/SendToSutoriUser';
import SendToNonSutoriUser from './screens/Send/SendToNonSutoriUser';
import Toast from 'react-native-toast-message';
import TransferHistory from './screens/TransferHistory';
import * as Sentry from '@sentry/react-native';
import SignIn from './screens/Start';
import EnterSendAmount from './screens/Send/EnterSendAmount';
import EnterDepositAmount from './screens/Deposit/EnterDepositAmount';

Sentry.init({
  dsn: 'https://adc4c437047fef7e4ebe5d0d77df3ff5@o1348995.ingest.us.sentry.io/4507536730030080',
  debug: process.env.NODE_ENV === 'development',
});

const Tab = createBottomTabNavigator<RootTabsParamsList>();
const RootStack = createNativeStackNavigator<RootStackParamsList>();

const Tabs = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <AntDesign name="home" size={24} color={color} />
          ),
        }}
      ></Tab.Screen>
      <Tab.Screen
        name="Account"
        component={Account}
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => (
            <AntDesign name="user" size={24} color={color} />
          ),
        }}
      ></Tab.Screen>
    </Tab.Navigator>
  );
};

const Screens = () => {
  const { data: isSignedIn } = useIsSignedIn();

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamsList>>();

  useEffect(() => {
    if (isSignedIn === false) {
      navigation.navigate('SignUp');
    }
  }, [isSignedIn]);

  if (!isSignedIn) {
    return null;
  }

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
          title: 'Sign in',
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
            title: 'Add money',
            headerBackVisible: true,
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="ConfirmDeposit"
          component={ConfirmDeposit}
          options={{
            title: 'Confirm deposit',
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
            title: 'Select recipient',
            headerBackVisible: true,
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="SendToSutoriUser"
          component={SendToSutoriUser}
          options={{
            title: 'Select recipient',
            headerBackVisible: true,
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="SendToNonSutoriUser"
          component={SendToNonSutoriUser}
          options={{
            title: 'Enter recipient details',
            headerBackVisible: true,
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="EnterSendAmount"
          component={EnterSendAmount}
          options={{
            title: 'Enter amount',
            headerBackVisible: true,
            headerBackTitle: 'Back',
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="ConfirmSend"
          component={ConfirmSend}
          options={{
            title: 'Confirm',
            headerBackVisible: true,
            headerBackTitle: 'Back',
          }}
        ></RootStack.Screen>
      </RootStack.Group>
      <RootStack.Screen
        name="Receive"
        component={Receive}
        options={{
          headerBackVisible: true,
        }}
      ></RootStack.Screen>
      <RootStack.Screen
        name="TransferHistory"
        component={TransferHistory}
        options={{
          title: 'Transfer history',
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
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <ThemeProvider value={NavigationTheme}>
            <Screens></Screens>
            <StatusBar style="light" />
            <Toast></Toast>
          </ThemeProvider>
        </NavigationContainer>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
