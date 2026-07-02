import { DevToolsProvider } from './context/DevToolsContext';
import { EditModeProvider } from './context/EditModeContext';
import { ExplorerProvider } from './context/ExplorerContext';
import { SqlWorkspaceProvider } from './context/SqlWorkspaceContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { DevToolsShell } from './components/layout/DevToolsShell';

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DevToolsProvider>
          <EditModeProvider>
            <ExplorerProvider>
              <SqlWorkspaceProvider>
                <DevToolsShell />
              </SqlWorkspaceProvider>
            </ExplorerProvider>
          </EditModeProvider>
        </DevToolsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
