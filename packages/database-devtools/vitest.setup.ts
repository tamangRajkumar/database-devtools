import { createRequire } from 'node:module';
import { configureSqliteWasm } from './src/inspectors/sqlite/sqlModule';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const require = createRequire(import.meta.url);
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');

configureSqliteWasm(() => wasmPath);
