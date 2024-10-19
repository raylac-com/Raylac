import axios from 'axios';

export const get0xClient = () => {
  const apiKey = process.env.ZEROEX_API_KEY;

  if (!apiKey) {
    throw new Error('ZEROEX_API_KEY is not set');
  }

  return axios.create({
    baseURL: 'http://api.0x.org',
    headers: {
      '0x-api-key': apiKey,
      '0x-version': 'v2',
    },
  });
};
