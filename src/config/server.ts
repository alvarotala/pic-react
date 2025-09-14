// Server configuration for different environments
export const getServerUrl = () => {
  if (__DEV__) {
    // For development, try to get the server URL from environment or use default
    // You can override this by setting EXPO_PUBLIC_SERVER_URL in your .env file
    return process.env.EXPO_PUBLIC_SERVER_URL || 'http://192.168.100.203:3001';
  }
  // For production, use your deployed server URL
  return 'https://your-production-server.com';
};

export const SERVER_URL = getServerUrl();
