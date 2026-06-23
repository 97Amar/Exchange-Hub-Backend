import { RestClientV5, WebsocketClient } from 'bybit-api';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.BYBIT_API_KEY || '';
const API_SECRET = process.env.BYBIT_API_SECRET || '';
const TESTNET = process.env.BYBIT_TESTNET === 'true';

export const restClient = new RestClientV5({
  key: API_KEY,
  secret: API_SECRET,
  testnet: true,
  baseUrl: 'https://api-testnet.bybit.com',
});

/**
 * Singleton Private WebSocket Client
 */
let privateWsClient: WebsocketClient | null = null;

export const getPrivateWsClient = () => {
  if (!privateWsClient) {
    privateWsClient = new WebsocketClient({
      key: API_KEY,
      secret: API_SECRET,
      testnet: true,
      market: 'v5',
    });

    (privateWsClient as any).on('error', (err: any) => {
      console.error('❌ Bybit Private WS Error:', err);
    });

    (privateWsClient as any).on('reconnected', () => {
      console.log('✅ Bybit Private WS Reconnected');
    });
  }
  return privateWsClient;
};
