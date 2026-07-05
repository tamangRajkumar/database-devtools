import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureSqliteWasm, registerSqliteInspector } from 'database-devtools/inspector-sqlite';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { App } from './App';
import './styles/index.css';

configureSqliteWasm(() => sqlWasmUrl);
registerSqliteInspector();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
