import { PLACEHOLDER_TABLES } from '../data/placeholders';
import { useDevTools } from '../context/DevToolsContext';
import { PlaceholderBanner } from '../components/PlaceholderBanner';

export function TablesPanel() {
  const { selectedDevice } = useDevTools();

  if (!selectedDevice) {
    return (
      <section className="panel">
        <h2 className="panel__title">Tables</h2>
        <div className="empty-state">
          <p className="empty-state__title">No device selected</p>
          <p className="empty-state__text">Select a connected device to view tables.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2 className="panel__title">Tables</h2>
      <p className="panel__subtitle mono">{selectedDevice.deviceId}</p>
      <PlaceholderBanner />

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Table</th>
              <th>Rows</th>
            </tr>
          </thead>
          <tbody>
            {PLACEHOLDER_TABLES.map((table) => (
              <tr key={table.name}>
                <td className="mono">{table.name}</td>
                <td>{table.rowCount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
