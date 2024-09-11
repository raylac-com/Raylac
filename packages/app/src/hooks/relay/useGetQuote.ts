import { relayClient } from '@/lib/relay';
import {
  RelayGetQuoteRequestBody,
  RelayGetQuoteResponseBody,
} from '@raylac/shared';
import { useQuery } from '@tanstack/react-query';

const useGetQuote = (options: RelayGetQuoteRequestBody) => {
  return useQuery({
    queryKey: ['quote'],
    queryFn: async () => {
      const result = await relayClient.post<RelayGetQuoteResponseBody>(
        '/quote',
        {
          data: options,
        }
      );

      return result.data;
    },
  });
};

export default useGetQuote;
