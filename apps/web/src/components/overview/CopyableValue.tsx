import { useState } from 'react';

type CopyableValueProps = {
  value: string;
  label?: string;
  mono?: boolean;
};

export function CopyableValue({ value, label = 'Copy', mono = false }: CopyableValueProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className="copyable-value">
      <span className={mono ? 'mono' : undefined}>{value}</span>
      <button type="button" className="copyable-value__button" onClick={() => void copy()}>
        {copied ? 'Copied' : label}
      </button>
    </span>
  );
}
