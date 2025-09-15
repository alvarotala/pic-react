// Environment variables for web client
// Create React App automatically loads .env files and exposes REACT_APP_* variables
// We use simple SERVER_HOST and SERVER_PORT names for consistency

// Export environment variables with fallbacks
export const SERVER_HOST = process.env.SERVER_HOST || '127.0.0.1';
export const SERVER_PORT = process.env.SERVER_PORT || '3001';
