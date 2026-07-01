import {
  PLACEHOLDER_QUERY_RESULT,
  PLACEHOLDER_SAMPLE_SQL,
} from '../data/placeholders';
import { useDevTools } from '../context/DevToolsContext';
import { PlaceholderBanner } from '../components/PlaceholderBanner';

export function QueryPanel() {
  const { selectedDevice } = useDevTools();

  if (!selectedDevice) {
    return (
      <section className="panel">
        <h2 className="panel__title">Query</h2>
        <div className="empty-state">
          <p className="empty-state__title">No device selected</p>
          <p className="empty-state__text">Select a connected device to run queries.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2 className="panel__title">Query</h2>
      <p className="panel__subtitle mono">{selectedDevice.deviceId}</p>
      <PlaceholderBanner />

      <label className="field-label" htmlFor="sql-editor">
        SQL
      </label>
      <textarea
        id="sql-editor"
        className="sql-editor mono"
        readOnly
        rows={8}
        value={PLACEHOLDER_SAMPLE_SQL}
      />

      <h3 className="panel__section-title">Results</h3>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {PLACEHOLDER_QUERY_RESULT.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLACEHOLDER_QUERY_RESULT.rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
