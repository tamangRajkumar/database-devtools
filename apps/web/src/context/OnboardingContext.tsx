import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  dismissOnboarding as dismissStoredOnboarding,
  hasRunFirstQuery,
  isOnboardingDismissed,
  markFirstQueryRun,
} from '../lib/onboardingStorage';
import { useDevTools } from './DevToolsContext';

export type OnboardingStep = {
  id: string;
  label: string;
  done: boolean;
};

type OnboardingContextValue = {
  visible: boolean;
  steps: OnboardingStep[];
  dismiss: () => void;
  markQueryRun: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { connectionState, selectedDeviceId, hasDatabase } = useDevTools();
  const [dismissed, setDismissed] = useState(isOnboardingDismissed);
  const [queryRun, setQueryRun] = useState(hasRunFirstQuery);

  const steps = useMemo<OnboardingStep[]>(
    () => [
      {
        id: 'hub',
        label: 'Connect to the DevTools hub',
        done: connectionState === 'connected',
      },
      {
        id: 'device',
        label: 'Select a mobile device',
        done: Boolean(selectedDeviceId),
      },
      {
        id: 'refresh',
        label: 'Refresh the database snapshot',
        done: hasDatabase,
      },
      {
        id: 'query',
        label: 'Run your first SQL query',
        done: queryRun,
      },
    ],
    [connectionState, selectedDeviceId, hasDatabase, queryRun],
  );

  const allDone = steps.every((step) => step.done);
  const visible = !dismissed && !allDone;

  const dismiss = useCallback(() => {
    dismissStoredOnboarding();
    setDismissed(true);
  }, []);

  const markQueryRun = useCallback(() => {
    markFirstQueryRun();
    setQueryRun(true);
  }, []);

  const value = useMemo(
    () => ({
      visible,
      steps,
      dismiss,
      markQueryRun,
    }),
    [visible, steps, dismiss, markQueryRun],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }

  return context;
}
