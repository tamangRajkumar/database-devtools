import { DevToolsProvider } from './context/DevToolsContext';
import { ExplorerProvider } from './context/ExplorerContext';
import { ThemeProvider } from './context/ThemeContext';
import { DevToolsShell } from './components/layout/DevToolsShell';

export function App() {
  return (
    <ThemeProvider>
      <DevToolsProvider>
        <ExplorerProvider>
          <DevToolsShell />
        </ExplorerProvider>
      </DevToolsProvider>
    </ThemeProvider>
  );
}
