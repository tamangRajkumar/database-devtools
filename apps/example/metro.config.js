const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const corePackageRoot = path.resolve(monorepoRoot, 'packages/database-devtools');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Watch the workspace packages in the monorepo.
config.watchFolders = [monorepoRoot];

// Force a single react-native instance — duplicate copies cause
// "PlatformConstants could not be found" at runtime in Expo Go.
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'database-devtools': path.resolve(corePackageRoot, 'src/native.ts'),
  'database-devtools/adapter': path.resolve(corePackageRoot, 'src/adapter/index.ts'),
};

module.exports = config;
