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
  DefaultTheme,
  NavigationContainer,
  ThemeProvider,
  useNavigation,
} from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { trpc, rpcLinks } from './lib/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useIsSignedIn from './hooks/useIsSignedIn';
import { useEffect } from 'react';
import EnterDepositInfo from './screens/Deposit/EnterDepositInfo';
import ConfirmDeposit from './screens/Deposit/ConfirmDeposit';
import SelectSend from './screens/Send/SelectSend';
import Account from './screens/Account';
import Receive from './screens/Receive';
import SendToSutoriUser from './screens/Send/SendToSutoriUser';
import SendToNonSutoriUser from './screens/Send/SendToNonSutoriUser';
import Toast from 'react-native-toast-message';
import { deleteSignedInUser } from './lib/utils';

const Tab = createBottomTabNavigator<RootTabsParamsList>();
const Stack = createNativeStackNavigator<RootStackParamsList>();

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

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={Tabs}
        options={{
          headerShown: false,
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="SignUp"
        component={SignUp}
        options={{
          headerBackVisible: false,
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="EnterDepositInfo"
        component={EnterDepositInfo}
        options={{
          title: 'Add money',
          headerBackVisible: true,
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="ConfirmDeposit"
        component={ConfirmDeposit}
        options={{
          title: 'Confirm deposit',
          headerBackVisible: true,
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="Send"
        component={SelectSend}
        options={{
          title: 'Send',
          headerBackVisible: true,
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="SendToSutoriUser"
        component={SendToSutoriUser}
        options={{
          title: 'Send',
          headerBackVisible: true,
          headerBackTitle: 'Back',
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="SendToNonSutoriUser"
        component={SendToNonSutoriUser}
        options={{
          headerBackVisible: true,
          headerBackTitle: 'Back',
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="Receive"
        component={Receive}
        options={{
          headerBackVisible: true,
        }}
      ></Stack.Screen>
    </Stack.Navigator>
  );
};

const NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    card: theme.background,
    primary: theme.orange,
  },
};

const queryClient = new QueryClient({
  // TODO:
  defaultOptions: {
    queries: {
      throwOnError: true,
      retry: false,
      gcTime: 1000 * 60 * 60 * 24,
    },
    mutations: {
      throwOnError: true,
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
            <StatusBar style="auto" />
            <Toast></Toast>
          </ThemeProvider>
        </NavigationContainer>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
