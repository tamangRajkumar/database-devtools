import { PLACEHOLDER_SCHEMA } from '../data/placeholders';
import { useDevTools } from '../context/DevToolsContext';
import { PlaceholderBanner } from '../components/PlaceholderBanner';

export function SchemaPanel() {
  const { selectedDevice } = useDevTools();

  if (!selectedDevice) {
    return (
      <section className="panel">
        <h2 className="panel__title">Schema</h2>
        <div className="empty-state">
          <p className="empty-state__title">No device selected</p>
          <p className="empty-state__text">Select a connected device to browse schema.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2 className="panel__title">Schema</h2>
      <p className="panel__subtitle mono">{selectedDevice.deviceId}</p>
      <PlaceholderBanner />

      <div className="schema-tree">
        {PLACEHOLDER_SCHEMA.map((table) => (
          <details key={table.name} className="schema-tree__table" open>
            <summary className="schema-tree__summary mono">{table.name}</summary>
            <ul className="schema-tree__columns">
              {table.columns.map((column) => (
                <li key={column.name} className="schema-tree__column">
                  <span className="mono">{column.name}</span>
                  <span className="schema-tree__type">{column.type}</span>
                  {!column.nullable && <span className="schema-tree__badge">NOT NULL</span>}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
