// Import centralized config
const { config, getServerUrl: getConfigServerUrl } = require('../../config.js');

// Server configuration for different environments
export const getServerUrl = () => {
  if (__DEV__) {
    // For development, try to get the server URL from environment or use centralized config
    // You can override this by setting EXPO_PUBLIC_SERVER_URL in your .env file
    return process.env.EXPO_PUBLIC_SERVER_URL || getConfigServerUrl();
  }
  // For production, use your deployed server URL
  return 'https://your-production-server.com';
};

export const SERVER_URL = getServerUrl();
