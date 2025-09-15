// Centralized server configuration
const config = {
  server: {
    host: '192.168.100.203',
    port: 3001
  }
};

// Helper function to get the full server URL
const getServerUrl = () => {
  return `http://${config.server.host}:${config.server.port}`;
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment (server)
  module.exports = {
    config,
    getServerUrl
  };
} else if (typeof window !== 'undefined') {
  // Browser environment (web client)
  window.config = config;
  window.getServerUrl = getServerUrl;
} else {
  // React Native environment (mobile app)
  global.config = config;
  global.getServerUrl = getServerUrl;
}
