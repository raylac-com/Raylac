import { useEffect, useState } from 'react';
import axios from 'axios';
import { Token } from '@raylac/shared';

interface CoingeckoTokenResponse {
  market_data: {
    price_change_percentage_24h: number;
  };
}

/**
 * Hook to fetch 24h price change percentage from Coingecko API
 * @param token Token object containing chain and contract information
 * @returns price change percentage or null if unavailable
 */
export default function useCoingeckoPriceChange(token: Token | null) {
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);

  useEffect(() => {
    if (!token || !token.addresses || token.addresses.length === 0) {
      setPriceChange24h(null);
      return;
    }

    // Get the first available address (we could make this smarter by checking specific chains)
    const tokenAddress = token.addresses[0];

    // Use contract address endpoint for more reliable lookup
    const url = `https://api.coingecko.com/api/v3/coins/ethereum/contract/${tokenAddress.address}`;

    let isMounted = true;

    const fetchPriceChange = async () => {
      try {
        const response = await axios.get<CoingeckoTokenResponse>(url);
        if (
          isMounted &&
          response.data.market_data?.price_change_percentage_24h != null
        ) {
          setPriceChange24h(
            response.data.market_data.price_change_percentage_24h
          );
        }
      } catch (_error) {
        if (isMounted) {
          setPriceChange24h(null);
        }
      }
    };

    // Initial fetch
    fetchPriceChange();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [token]);

  return priceChange24h;
}
