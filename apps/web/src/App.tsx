import { DevToolsProvider } from './context/DevToolsContext';
import { EditModeProvider } from './context/EditModeContext';
import { ExplorerProvider } from './context/ExplorerContext';
import { SqlWorkspaceProvider } from './context/SqlWorkspaceContext';
import { ThemeProvider } from './context/ThemeContext';
import { DevToolsShell } from './components/layout/DevToolsShell';

export function App() {
  return (
    <ThemeProvider>
      <DevToolsProvider>
        <EditModeProvider>
          <ExplorerProvider>
            <SqlWorkspaceProvider>
              <DevToolsShell />
            </SqlWorkspaceProvider>
          </ExplorerProvider>
        </EditModeProvider>
      </DevToolsProvider>
    </ThemeProvider>
  );
}
