const BASE = '/api';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  list: (q = {}) => {
    const search = new URLSearchParams(
      Object.entries(q).filter(([, v]) => v !== '' && v != null)
    ).toString();
    return req(`/inspections${search ? '?' + search : ''}`);
  },
  get: (id) => req(`/inspections/${id}`),
  addFinding: (id, f) => req(`/inspections/${id}/findings`, {
    method: 'POST', body: JSON.stringify(f)
  }),
  approve: (id) => req(`/inspections/${id}/approve`, { method: 'POST' }),
  reject: (id, reason) => req(`/inspections/${id}/reject`, {
    method: 'POST', body: JSON.stringify({ reason })
  }),
  // TODO (candidate): certificate endpoints
  //   issueCertificate: (id) => req(`/inspections/${id}/certificate`, { method: 'POST' }),
  //   getCertificate:   (id) => req(`/inspections/${id}/certificate`)
};
