import { useMemo, useState } from 'react';
import { useOnboarding } from '../../context/OnboardingContext';

type GettingStartedChecklistProps = {
  onOpenWorkspace?: () => void;
};

export function GettingStartedChecklist(_props: GettingStartedChecklistProps) {
  const { visible, steps, dismiss } = useOnboarding();
  const [expanded, setExpanded] = useState(false);

  const doneCount = useMemo(() => steps.filter((step) => step.done).length, [steps]);
  const compact = doneCount >= 3;

  if (!visible) {
    return null;
  }

  if (compact && !expanded) {
    return (
      <aside className="getting-started getting-started--compact" aria-label="Getting started progress">
        <div className="getting-started__compact-row">
          <span className="getting-started__compact-label">
            Getting started: {doneCount}/{steps.length} complete
          </span>
          <div className="getting-started__compact-actions">
            <button type="button" className="getting-started__dismiss" onClick={() => setExpanded(true)}>
              Show steps
            </button>
            <button type="button" className="getting-started__dismiss" onClick={dismiss}>
              Dismiss
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="getting-started" aria-label="Getting started checklist">
      <div className="getting-started__header">
        <h2 className="getting-started__title">
          Getting started <span className="getting-started__progress">({doneCount}/{steps.length})</span>
        </h2>
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
      <p className="getting-started__hint">
        Use the status card below for Refresh and Open Workspace actions.
      </p>
    </aside>
  );
}
