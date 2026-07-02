import { useOnboarding } from '../../context/OnboardingContext';
import { useDevTools } from '../../context/DevToolsContext';

type GettingStartedChecklistProps = {
  onOpenWorkspace?: () => void;
};

export function GettingStartedChecklist({ onOpenWorkspace }: GettingStartedChecklistProps) {
  const { visible, steps, dismiss } = useOnboarding();
  const { refresh, hasDatabase, refreshState } = useDevTools();

  if (!visible) {
    return null;
  }

  return (
    <aside className="getting-started" aria-label="Getting started checklist">
      <div className="getting-started__header">
        <h2 className="getting-started__title">Getting started</h2>
        <button type="button" className="getting-started__dismiss" onClick={dismiss}>
          Dismiss
        </button>
      </div>
      <ol className="getting-started__list">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`getting-started__item ${step.done ? 'getting-started__item--done' : ''}`}
          >
            <span className="getting-started__marker" aria-hidden>
              {step.done ? '✓' : '○'}
            </span>
            <span>{step.label}</span>
          </li>
        ))}
      </ol>
      <div className="getting-started__actions">
        {!hasDatabase && (
          <button
            type="button"
            className="refresh-button"
            disabled={refreshState === 'refreshing'}
            onClick={refresh}
          >
            {refreshState === 'refreshing' ? 'Refreshing…' : 'Refresh database'}
          </button>
        )}
        {hasDatabase && onOpenWorkspace && (
          <button type="button" className="sql-toolbar__secondary" onClick={onOpenWorkspace}>
            Open Workspace
          </button>
        )}
      </div>
    </aside>
  );
}
