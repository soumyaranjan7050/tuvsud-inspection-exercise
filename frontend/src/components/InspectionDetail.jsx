import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function InspectionDetail({ id, onClose, onChanged }) {
  const [inspection, setInspection] = useState(null);
  const [error, setError] = useState(null);
  const [newFinding, setNewFinding] = useState({
    component: '', severity: 'low', description: ''
  });
  const [rejectReason, setRejectReason] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [certError, setCertError] = useState(null);
  const [issuing, setIssuing] = useState(false);

  const load = () => {
    setError(null);
    setCertificate(null);
    setCertError(null);
    api.get(id)
      .then(insp => {
        setInspection(insp);
        // Only approved inspections can have a certificate.
        if (insp.status === 'approved') {
          api.getCertificate(id)
            .then(setCertificate)
            .catch(() => setCertificate(null)); // 404 = not issued yet
        }
      })
      .catch(e => setError(e.message));
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
  const issueCertificate = async () => {
    setCertError(null);
    setIssuing(true);
    try {
      setCertificate(await api.issueCertificate(id));
      onChanged?.();
    } catch (err) { setCertError(err.message); }
    finally { setIssuing(false); }
  };

  const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });

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
             <p className="description">{f.description}</p>
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

      {inspection.status === 'approved' && (
        <>
          <h3>Compliance certificate</h3>
          {certError && <p className="error">Error: {certError}</p>}
          {!certificate && (
            <button className="approve" onClick={issueCertificate} disabled={issuing}>
              {issuing ? 'Issuing…' : 'Issue certificate'}
            </button>
          )}
          {certificate && (
            <div className="certificate">
              <div className="certificate-title">Certificate of Compliance</div>
              <div className="certificate-number">{certificate.certificateNumber}</div>
              <dl className="meta">
                <dt>Elevator</dt><dd>{certificate.elevatorId}</dd>
                <dt>Inspector</dt><dd>{certificate.inspector}</dd>
                <dt>Issued</dt><dd>{fmtDate(certificate.issuedAt)}</dd>
                <dt>Valid until</dt><dd>{fmtDate(certificate.validUntil)}</dd>
              </dl>
              <h4>Findings at issue ({certificate.findings.length})</h4>
              {certificate.findings.length === 0 && <p className="muted">No findings.</p>}
              <ul className="findings">
                {certificate.findings.map(f => (
                  <li key={f.id} className={`finding severity-${f.severity}`}>
                    <strong>{f.component}</strong> ({f.severity}): {f.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
