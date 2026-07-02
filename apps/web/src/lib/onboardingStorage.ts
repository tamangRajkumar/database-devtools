const DISMISSED_KEY = 'database-devtools-onboarding-dismissed';
const FIRST_QUERY_KEY = 'database-devtools-first-query-run';

export function isOnboardingDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function dismissOnboarding(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, 'true');
  } catch {
    // Ignore storage errors.
  }
}

export function hasRunFirstQuery(): boolean {
  try {
    return localStorage.getItem(FIRST_QUERY_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markFirstQueryRun(): void {
  try {
    localStorage.setItem(FIRST_QUERY_KEY, 'true');
  } catch {
    // Ignore storage errors.
  }
}
