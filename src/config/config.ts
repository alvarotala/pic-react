// Mobile app configuration using environment variables
const config = {
  server: {
    host: process.env.SERVER_HOST || '127.0.0.1',
    port: parseInt(process.env.SERVER_PORT || '3001', 10)
  }
};

// Helper function to get the full server URL
export const getServerUrl = (): string => {
  if (__DEV__) {
    // For development, try to get the server URL from environment or use config
    // You can override this by setting EXPO_PUBLIC_SERVER_URL in your .env file
    return process.env.EXPO_PUBLIC_SERVER_URL || `http://${config.server.host}:${config.server.port}`;
  }
  // For production, use your deployed server URL
  return 'https://your-production-server.com';
};

export const SERVER_URL = getServerUrl();
