import { DevToolsProvider } from './context/DevToolsContext';
import { ThemeProvider } from './context/ThemeContext';
import { DevToolsShell } from './components/layout/DevToolsShell';

export function App() {
  return (
    <ThemeProvider>
      <DevToolsProvider>
        <DevToolsShell />
      </DevToolsProvider>
    </ThemeProvider>
  );
}
