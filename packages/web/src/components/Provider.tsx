'use client';
import { createConfig, injected, WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  scroll,
} from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { getAlchemyHttpTransport } from '@/lib/utils';
import { MixpanelProvider } from '@/context/MixpanelContext';
import { trpc } from '@/lib/trpc';
import { httpBatchLink } from '@trpc/client';
import Header from './Header/Header';
import { metaMask, walletConnect } from 'wagmi/connectors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: process.env.NODE_ENV === 'development',
      // throwOnError: false,
      retry: 3,
      // retry: 3,
      gcTime: 1000 * 60 * 60 * 24,
    },
    mutations: {
      throwOnError: process.env.NODE_ENV === 'development',
    },
  },
});

const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string;

const config = createConfig({
  chains: [mainnet, base, arbitrum, optimism, scroll],
  connectors: [
    injected(),
    walletConnect({ projectId: '55245de0fa3490c5cabb54e076b8f855' }),
    metaMask(),
  ],
  transports: {
    [mainnet.id]: getAlchemyHttpTransport({
      chainId: mainnet.id,
      apiKey: alchemyApiKey,
    }),
    [base.id]: getAlchemyHttpTransport({
      chainId: base.id,
      apiKey: alchemyApiKey,
    }),
    [arbitrum.id]: getAlchemyHttpTransport({
      chainId: arbitrum.id,
      apiKey: alchemyApiKey,
    }),
    [optimism.id]: getAlchemyHttpTransport({
      chainId: optimism.id,
      apiKey: alchemyApiKey,
    }),
    [polygon.id]: getAlchemyHttpTransport({
      chainId: polygon.id,
      apiKey: alchemyApiKey,
    }),
    [scroll.id]: getAlchemyHttpTransport({
      chainId: scroll.id,
      apiKey: alchemyApiKey,
    }),
  },
});

const Provider = ({ children }: { children: React.ReactNode }) => {
  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: process.env.NEXT_PUBLIC_API_URL as string,
        // You can pass any HTTP headers you wish here
        async headers() {
          return {
            'Access-Control-Allow-Origin': '*',
          };
        },
      }),
    ],
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <MixpanelProvider>
            <div className="max-w-[1440px] flex flex-col items-center mx-auto">
              <Header />
              {children}
            </div>
          </MixpanelProvider>
          <Toaster />
        </QueryClientProvider>
      </WagmiProvider>
    </trpc.Provider>
  );
};

export default Provider;
