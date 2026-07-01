import { useDevTools } from '../context/DevToolsContext';
import { PlaceholderBanner } from '../components/PlaceholderBanner';

export function TablesPanel() {
  const { selectedDevice, hasDatabase, tables } = useDevTools();

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
      {!hasDatabase && <PlaceholderBanner message="Click Refresh to load tables from the device database." />}

      {hasDatabase && tables.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__title">No tables</p>
          <p className="empty-state__text">This database has no user tables.</p>
        </div>
      )}

      {hasDatabase && tables.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Table</th>
                <th>Rows</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => (
                <tr key={table.name}>
                  <td className="mono">{table.name}</td>
                  <td>{table.rowCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
