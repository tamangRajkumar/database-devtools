const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const corePackageRoot = path.resolve(monorepoRoot, 'packages/database-devtools');
const useBuiltPackage = process.env.DATABASE_DEVTOOLS_USE_DIST === '1';

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Watch the workspace packages in the monorepo.
config.watchFolders = [monorepoRoot];

// pnpm hoists most deps under the app package — search both trees.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force a single react-native instance — duplicate copies cause
// "PlatformConstants could not be found" at runtime in Expo Go.
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  '@react-native-async-storage/async-storage': path.resolve(
    projectRoot,
    'node_modules/@react-native-async-storage/async-storage',
  ),
  'database-devtools': path.resolve(
    corePackageRoot,
    useBuiltPackage ? 'dist/native.js' : 'src/native.ts',
  ),
  'database-devtools/adapter': path.resolve(corePackageRoot, 'src/adapter/index.ts'),
};

module.exports = config;
