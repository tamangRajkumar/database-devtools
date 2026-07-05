import { DevToolsProvider } from './context/DevToolsContext';
import { EditModeProvider } from './context/EditModeContext';
import { ExplorerProvider } from './context/ExplorerContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { SqlWorkspaceProvider } from './context/SqlWorkspaceContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { DevToolsShell } from './components/layout/DevToolsShell';

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DevToolsProvider>
          <OnboardingProvider>
            <EditModeProvider>
              <ExplorerProvider>
                <WorkspaceProvider>
                  <SqlWorkspaceProvider>
                    <DevToolsShell />
                  </SqlWorkspaceProvider>
                </WorkspaceProvider>
              </ExplorerProvider>
            </EditModeProvider>
          </OnboardingProvider>
        </DevToolsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
