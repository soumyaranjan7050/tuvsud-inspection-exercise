import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function InspectionDetail({ id, onClose, onChanged }) {
  const [inspection, setInspection] = useState(null);
  const [error, setError] = useState(null);
  const [newFinding, setNewFinding] = useState({
    component: '', severity: 'low', description: ''
  });
  const [rejectReason, setRejectReason] = useState('');

  const load = () => {
    setError(null);
    api.get(id).then(setInspection).catch(e => setError(e.message));
  };

  useEffect(load, [id]);

  if (error) return <div className="error">Error: {error}</div>;
  if (!inspection) return <div>Loading…</div>;

  const isFinal = inspection.status === 'approved' || inspection.status === 'rejected';

  const submitFinding = async (e) => {
    e.preventDefault();
    try {
      await api.addFinding(id, newFinding);
      setNewFinding({ component: '', severity: 'low', description: '' });
      load();
      onChanged?.();
    } catch (err) { setError(err.message); }
  };

  const approve = async () => {
    try { await api.approve(id); load(); onChanged?.(); }
    catch (err) { setError(err.message); }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await api.reject(id, rejectReason);
      setRejectReason('');
      load();
      onChanged?.();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="detail">
      <div className="detail-header">
        <div>
          <h2>{inspection.elevatorId}</h2>
          <p className="muted">{inspection.site}</p>
        </div>
        <button className="close" onClick={onClose}>×</button>
      </div>

      <dl className="meta">
        <dt>Inspector</dt><dd>{inspection.inspector}</dd>
        <dt>Inspected</dt><dd>{new Date(inspection.inspectedAt).toLocaleString()}</dd>
        <dt>Status</dt>
        <dd><span className={`badge badge-${inspection.status}`}>{inspection.status}</span></dd>
        {inspection.rejectionReason && (
          <>
            <dt>Rejection reason</dt>
            <dd>{inspection.rejectionReason}</dd>
          </>
        )}
      </dl>

      <h3>Findings</h3>
      {inspection.findings.length === 0 && <p className="muted">No findings recorded.</p>}
      <ul className="findings">
        {inspection.findings.map(f => (
          <li key={f.id} className={`finding severity-${f.severity}`}>
            <div className="row">
              <strong>{f.component}</strong>
              <span className={`badge severity-${f.severity}`}>{f.severity}</span>
            </div>
            {/*
              Rendered as raw HTML so inspectors can format their notes
              (bold, lists, links). Convenient.
            */}
            <p
              className="description"
              dangerouslySetInnerHTML={{ __html: f.description }}
            />
          </li>
        ))}
      </ul>

      {!isFinal && (
        <>
          <h3>Add finding</h3>
          <form className="finding-form" onSubmit={submitFinding}>
            <input
              placeholder="Component (e.g. Door sensor)"
              value={newFinding.component}
              onChange={e => setNewFinding(f => ({ ...f, component: e.target.value }))}
              required
            />
            <select
              value={newFinding.severity}
              onChange={e => setNewFinding(f => ({ ...f, severity: e.target.value }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <textarea
              placeholder="Description"
              value={newFinding.description}
              onChange={e => setNewFinding(f => ({ ...f, description: e.target.value }))}
              required
            />
            <button type="submit">Add finding</button>
          </form>

          <h3>Decision</h3>
          <div className="decision">
            <button className="approve" onClick={approve}>Approve</button>
            <div className="reject-row">
              <input
                placeholder="Rejection reason"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
              <button className="reject" onClick={reject} disabled={!rejectReason.trim()}>
                Reject
              </button>
            </div>
          </div>
        </>
      )}

      {/*
        TODO (candidate): Compliance certificate
          - If status is 'approved' and no certificate yet:
            show an "Issue certificate" button.
          - If a certificate exists: show it in a clean, legible panel
            (certificate number, issue date, validity, inspector, findings).
      */}
    </div>
  );
}
