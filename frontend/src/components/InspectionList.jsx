import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function InspectionList({ selectedId, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', inspector: '' });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.list(filters)
      .then(data => { if (!cancelled) setItems(data); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const onFilterChange = (key) => (e) =>
    setFilters(f => ({ ...f, [key]: e.target.value }));

  return (
    <div>
      <h2>Inspections</h2>
      <div className="filters">
        <select value={filters.status} onChange={onFilterChange('status')}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <input
          type="text"
          value={filters.inspector}
          onChange={onFilterChange('inspector')}
          placeholder="Inspector name"
        />
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && items.length === 0 && <p>No inspections match your filters.</p>}

      <ul className="inspection-list">
        {items.map(it => (
          <li
            key={it.id}
            className={`inspection-list-item status-${it.status} ${it.id === selectedId ? 'selected' : ''}`}
            onClick={() => onSelect(it.id)}
          >
            <div className="row">
              <strong>{it.elevatorId}</strong>
              <span className={`badge badge-${it.status}`}>{it.status}</span>
            </div>
            <div className="row muted">
              <span>{it.site}</span>
              <span>{new Date(it.inspectedAt).toLocaleDateString()}</span>
            </div>
            <div className="row muted">
              <span>Inspector: {it.inspector}</span>
              <span>{it.findings.length} finding(s)</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
