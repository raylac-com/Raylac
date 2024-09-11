import { RelayGetQuoteRequestBody, RelayGetQuoteResponseBody } from './types';
import axios from 'axios';

export const relayClient = axios.create({
  baseURL: 'https://api.relay.link',
});

export const getQuote = async (options: RelayGetQuoteRequestBody) => {
  const result = await relayClient.post<RelayGetQuoteResponseBody>(
    '/quote',
    options
  );

  return result.data;
};

export const getCurrencies = async ({
  chainIds,
  term,
}: {
  chainIds: number[];
  term?: string;
}) => {
  const result = await relayClient.post<any[]>(
    '/currencies/v1',
    {
      chainIds,
      term,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return result.data;
};
