import React from 'react';
import type { Preview } from '@storybook/react';
import { trpc } from '../src/lib/trpc';
import { getRpcLinks } from '../src/lib/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import colors from '../src/lib/styles/colors';
import Toast from 'react-native-toast-message';
import { NavigationContainer } from '@react-navigation/native';

const Provider = ({ children }: { children: React.ReactNode }) => {
  const [loaded, _error] = useFonts({
    'Nunito-Regular': require('../assets/Nunito-Regular.ttf'),
    'Nunito-Bold': require('../assets/Nunito-Bold.ttf'),
  });

  if (!loaded) {
    return null;
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0,
        retry: false,
        throwOnError: true,
      },
    },
  });
  const trpcClient = trpc.createClient({
    links: getRpcLinks(),
  });

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <NavigationContainer>
          <SafeAreaProvider>
            <SafeAreaView
              style={{
                flex: 1,
                backgroundColor: colors.background,
              }}
            >
              {children}
            </SafeAreaView>
            <Toast></Toast>
          </SafeAreaProvider>
        </NavigationContainer>
      </trpc.Provider>
    </QueryClientProvider>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    Story => (
      <Provider>
        <Story />
      </Provider>
    ),
  ],
};

export default preview;
