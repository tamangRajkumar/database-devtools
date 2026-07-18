import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const mocksDir = path.join(packageRoot, 'vitest/mocks');

export default defineConfig({
  resolve: {
    alias: {
      'react-native': path.join(mocksDir, 'react-native.ts'),
      'expo-constants': path.join(mocksDir, 'expo-constants.ts'),
      '@react-native-async-storage/async-storage': path.join(
        mocksDir,
        'async-storage.ts',
      ),
      '@expo/vector-icons/MaterialCommunityIcons': path.join(
        mocksDir,
        'material-community-icons.ts',
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
