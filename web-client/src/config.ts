// Web client configuration using environment variables from root .env
import { SERVER_HOST, SERVER_PORT } from './env';

const config = {
  server: {
    host: SERVER_HOST,
    port: parseInt(SERVER_PORT, 10)
  }
};

// Helper function to get the full server URL
export const getServerUrl = (): string => {
  return `http://${config.server.host}:${config.server.port}`;
};

export const SERVER_URL = getServerUrl();
