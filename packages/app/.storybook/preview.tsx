import React from 'react';
import type { Preview } from '@storybook/react';
import { trpc } from '../src/lib/trpc';
import { getRpcLinks } from '../src/lib/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { SheetProvider } from 'react-native-actions-sheet';

const Provider = ({ children }: { children: React.ReactNode }) => {
  const [loaded, _error] = useFonts({
    'Lato-Regular': require('../assets/Lato-Regular.ttf'),
    'Lato-Bold': require('../assets/Lato-Bold.ttf'),
  });

  if (!loaded) {
    return null;
  }

  const queryClient = new QueryClient();
  const trpcClient = trpc.createClient({
    links: getRpcLinks(),
  });

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <SheetProvider>{children}</SheetProvider>
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