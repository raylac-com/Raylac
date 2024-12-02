import axios from 'axios';

export const relayApi = axios.create({
  baseURL: 'https://api.relay.link',
  headers: {
    'Content-Type': 'application/json',
  },
});
