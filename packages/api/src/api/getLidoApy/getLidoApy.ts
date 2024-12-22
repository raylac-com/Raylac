import { LidoApyResponse } from '@raylac/shared';
import axios from 'axios';

const getLidoApy = async () => {
  const response = await axios.get<LidoApyResponse>(
    'https://eth-api.lido.fi/v1/protocol/steth/apr/last'
  );

  return response.data.data.apr;
};

export default getLidoApy;
