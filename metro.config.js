const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .riv files to asset extensions
config.resolver.assetExts.push('riv');

module.exports = config;
