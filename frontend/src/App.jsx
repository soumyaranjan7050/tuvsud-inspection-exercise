import { useState } from 'react';
import InspectionList from './components/InspectionList.jsx';
import InspectionDetail from './components/InspectionDetail.jsx';

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="app">
      <header className="app-header">
        <h1>TÜV SÜD — Elevator Inspection Records</h1>
        <p className="subtitle">Internal tool · Prototype</p>
      </header>
      <main className={selectedId ? 'app-main with-detail' : 'app-main'}>
        <section className="pane list-pane">
          <InspectionList
            key={refreshKey}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>
        {selectedId && (
          <section className="pane detail-pane">
            <InspectionDetail
              id={selectedId}
              onClose={() => setSelectedId(null)}
              onChanged={refresh}
            />
          </section>
        )}
      </main>
    </div>
  );
}
