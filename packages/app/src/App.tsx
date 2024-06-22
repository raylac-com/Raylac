import AntDesign from '@expo/vector-icons/AntDesign';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import 'fastestsmallesttextencoderdecoder';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { Feather, Ionicons } from '@expo/vector-icons';
import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { theme } from './lib/theme';
import { RootStackParamsList, RootTabsParamsList } from './navigation/types';
import SignIn from './screens/SignIn';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from '@react-navigation/native';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

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
          tabBarIcon: props => (
            <Ionicons name="people-sharp" size={24} color={props.color} />
          ),
          headerRight: () => (
            <Link
              to={{
                screen: 'NewGroup',
              }}
            >
              <AntDesign
                name="plus"
                size={24}
                color={theme.color}
                style={{
                  marginRight: 12,
                }}
              />
            </Link>
          ),
        }}
      ></Tab.Screen>
    </Tab.Navigator>
  );
};

const Screens = () => {
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
        name="SignIn"
        component={SignIn}
        options={{
          headerBackVisible: false,
        }}
      ></Stack.Screen>
    </Stack.Navigator>
  );
};

const NavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    card: theme.background,
    primary: theme.orange,
  },
};

const App = () => {
  return (
    <NavigationContainer>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <ThemeProvider value={NavigationTheme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Screens></Screens>
            <StatusBar style="light" />
            <Toast></Toast>
          </GestureHandlerRootView>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </NavigationContainer>
  );
};

export default App;
