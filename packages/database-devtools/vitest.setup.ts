import { createRequire } from 'node:module';
import { configureSqliteWasm } from './src/inspectors/sqlite/sqlModule';

const require = createRequire(import.meta.url);
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');

configureSqliteWasm(() => wasmPath);
