// 3. React Native needs crypto.getRandomValues polyfill and sha512
import 'react-native-get-random-values';
import { StatusBar } from 'expo-status-bar';
import { theme } from './lib/theme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamsList, RootTabsParamsList } from './navigation/types';
import Home from './screens/Home';
import SignUp from './screens/SignUp';
import SignIn from './screens/SignIn';
import { NavigationContainer, ThemeProvider } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { trpc, rpcLinks } from './lib/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Deposit from './screens/Deposit';
import ConfirmSend from './screens/Send/ConfirmSend';
import Account from './screens/Account';
import SelectRecipient from './screens/Send/SelectRecipient';
import Toast from 'react-native-toast-message';
import TransferHistory from './screens/TransferHistory';
import * as Sentry from '@sentry/react-native';
import Start from './screens/Start';
import EnterSendAmount from './screens/Send/EnterSendAmount';
import { useTranslation } from 'react-i18next';
import './i18n';
import BackupAccount from './screens/BackupAccount';
import SelectLanguage from './screens/SelectLanguage';
import SendSuccess from './screens/Send/SendSuccess';
import { useEffect } from 'react';
import { getSelectedLanguage } from './i18n';
import AccountInfo from './screens/AccountInfo/AccountInfo';
import UpdateDisplayName from './screens/AccountInfo/UpdateDisplayName';
import UpdateUsername from './screens/AccountInfo/UpdateUsername';
import useSignedInUser from './hooks/useSignedInUser';
import useTypedNavigation from './hooks/useTypedNavigation';
import useFetchUpdates from './hooks/useFetchUpdates';
import Addresses from './screens/Addresses';
import RaylacTransferDetails from './screens/RaylacTransferDetails';
import NativeTransferDetails from './screens/NativeTransferDetails';
import Advanced from './screens/Advanced';
import ConfirmBackupPhrase from './screens/ConfirmBackupPhrase';
import { isBackupVerificationComplete } from './lib/key';
import SaveBackupPhrase from './screens/SaveBackupPhrase';
import { SafeAreaView } from 'react-native';
import Receive from './screens/Receive';
import IncomingERC20TransferDetails from './screens/IncomingERC20TransferDetails';

Sentry.init({
  dsn: 'https://5ea0839843bd5707f84b4e437e38d385@o4507910178799616.ingest.us.sentry.io/4507978572496896',
  debug: false,
  enabled: process.env.NODE_ENV !== 'development',
});

const Tab = createBottomTabNavigator<RootTabsParamsList>();
const RootStack = createNativeStackNavigator<RootStackParamsList>();

const Tabs = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator initialRouteName="Home">
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

  const { data: signedInUser, isLoading: isLoadingUser } = useSignedInUser();

  const navigation = useTypedNavigation();

  const { i18n } = useTranslation();

  useFetchUpdates();

  useEffect(() => {
    (async () => {
      const lang = await getSelectedLanguage();
      i18n.changeLanguage(lang);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (signedInUser === null && !isLoadingUser) {
        navigation.navigate('Start');
      } else if (signedInUser && !(await isBackupVerificationComplete())) {
        navigation.navigate('SaveBackupPhrase');
      }
    })();
  }, [signedInUser, isLoadingUser]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      <RootStack.Navigator initialRouteName="Tabs">
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
            title: t('title', { ns: 'SignUp' }),
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="SignIn"
          component={SignIn}
          options={{
            headerBackVisible: true,
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="Start"
          component={Start}
          options={{
            title: t('title', { ns: 'Start' }),
            headerBackVisible: false,
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="Addresses"
          component={Addresses}
          options={{
            title: t('title', { ns: 'Addresses' }),
            headerBackVisible: true,
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="BackupAccount"
          component={BackupAccount}
          options={{
            title: t('title', { ns: 'BackupAccount' }),
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="Advanced"
          component={Advanced}
          options={{
            title: t('title', { ns: 'Advanced' }),
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="Receive"
          component={Receive}
          options={{
            title: t('title', { ns: 'Receive' }),
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Group
          screenOptions={{
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        >
          <RootStack.Screen
            name="Deposit"
            component={Deposit}
            options={{
              title: t('title', { ns: 'Deposit' }),
              headerBackVisible: true,
              headerBackTitle: t('headerBackTitle', { ns: 'common' }),
            }}
          ></RootStack.Screen>
        </RootStack.Group>
        <RootStack.Group
          screenOptions={{
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        >
          <RootStack.Screen
            name="SelectRecipient"
            component={SelectRecipient}
            options={{
              title: t('title', { ns: 'SelectRecipient' }),
              headerBackVisible: true,
            }}
          ></RootStack.Screen>
          <RootStack.Screen
            name="EnterSendAmount"
            component={EnterSendAmount}
            options={{
              title: t('title', { ns: 'EnterSendAmount' }),
              headerBackVisible: true,
              headerBackTitle: t('headerBackTitle', { ns: 'common' }),
            }}
          ></RootStack.Screen>
          <RootStack.Screen
            name="ConfirmSend"
            component={ConfirmSend}
            options={{
              title: t('title', { ns: 'ConfirmSend' }),
              headerBackVisible: true,
              headerBackTitle: t('headerBackTitle', { ns: 'common' }),
            }}
          ></RootStack.Screen>
        </RootStack.Group>
        <RootStack.Screen
          name="TransferHistory"
          component={TransferHistory}
          options={{
            title: t('title', { ns: 'TransferHistory' }),
            headerBackVisible: true,
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="RaylacTransferDetails"
          component={RaylacTransferDetails}
          options={{
            title: t('title', { ns: 'RaylacTransferDetails' }),
            headerBackVisible: true,
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="NativeTransferDetails"
          component={NativeTransferDetails}
          options={{
            title: t('title', { ns: 'NativeTransferDetails' }),
            headerBackVisible: true,
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="IncomingERC20TransferDetails"
          component={IncomingERC20TransferDetails}
          options={{
            title: t('title', { ns: 'IncomingERC20TransferDetails' }),
            headerBackVisible: true,
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="SelectLanguage"
          component={SelectLanguage}
          options={{
            title: t('title', { ns: 'SelectLanguage' }),
            headerBackVisible: true,
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="SendSuccess"
          component={SendSuccess}
          options={{
            title: t('title', { ns: 'SendSuccess' }),
            headerBackVisible: true,
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="AccountInfo"
          component={AccountInfo}
          options={{
            title: t('title', { ns: 'AccountInfo' }),
            headerBackVisible: true,
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="UpdateDisplayName"
          component={UpdateDisplayName}
          options={{
            title: t('title', { ns: 'UpdateDisplayName' }),
            headerBackVisible: true,
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="UpdateUsername"
          component={UpdateUsername}
          options={{
            title: t('title', { ns: 'UpdateUsername' }),
            headerBackVisible: true,
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="SaveBackupPhrase"
          component={SaveBackupPhrase}
          options={{
            title: t('title', { ns: 'SaveBackupPhrase' }),
            headerBackVisible: false,
          }}
        ></RootStack.Screen>
        <RootStack.Screen
          name="ConfirmBackupPhrase"
          component={ConfirmBackupPhrase}
          options={{
            title: t('title', { ns: 'ConfirmBackupPhrase' }),
            headerBackVisible: true,
            headerBackTitle: t('headerBackTitle', { ns: 'common' }),
          }}
        ></RootStack.Screen>
      </RootStack.Navigator>
      <Toast></Toast>
    </SafeAreaView>
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

const App = () => {
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
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </NavigationContainer>
  );
};

export default Sentry.wrap(App);
