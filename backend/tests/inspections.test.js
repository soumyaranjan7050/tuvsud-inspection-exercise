const request = require('supertest');
const { createApp } = require('../src/server');
const { InspectionStore } = require('../src/models/inspectionStore');
const inspectionsRouter = require('../src/routes/inspections');

function freshApp() {
  const store = new InspectionStore([
    {
      id: 'insp-001', elevatorId: 'LIFT-DE-4471', site: 'Munich',
      inspector: 'Anna Weber', inspectedAt: '2026-07-14T09:30:00Z',
      status: 'pending', findings: []
    },
    {
      id: 'insp-002', elevatorId: 'LIFT-DE-2201', site: 'Hamburg',
      inspector: 'Marco Rossi', inspectedAt: '2026-07-22T13:15:00Z',
      status: 'approved', findings: []
    },
    {
      id: 'insp-003', elevatorId: 'LIFT-DE-9182', site: 'Stuttgart',
      inspector: 'Anna Weber', inspectedAt: '2026-08-10T08:00:00Z',
      status: 'rejected', rejectionReason: 'Cable frayed', findings: []
    }
  ]);
  inspectionsRouter.setStore(store);
  return { app: createApp(), store };
}

describe('GET /api/inspections', () => {
  it('lists all seeded inspections', async () => {
    const { app } = freshApp();
    const res = await request(app).get('/api/inspections');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  it('filters by status', async () => {
    const { app } = freshApp();
    const res = await request(app).get('/api/inspections?status=approved');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('insp-002');
  });

  it('filters by inspector (case-insensitive, partial)', async () => {
    const { app } = freshApp();
    const res = await request(app).get('/api/inspections?inspector=weber');
    expect(res.body.map(i => i.id).sort()).toEqual(['insp-001', 'insp-003']);
  });
});

describe('POST /api/inspections/:id/findings', () => {
  it('adds a finding to a pending inspection', async () => {
    const { app } = freshApp();
    const res = await request(app)
      .post('/api/inspections/insp-001/findings')
      .send({ component: 'Door', severity: 'low', description: 'Slight rattle' });
    expect(res.status).toBe(201);
    expect(res.body.findings).toHaveLength(1);
  });
});

describe('POST /api/inspections/:id/approve', () => {
  it('approves a pending inspection', async () => {
    const { app } = freshApp();
    const res = await request(app).post('/api/inspections/insp-001/approve');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
    expect(res.body.approvedAt).toBeDefined();
  });
});


describe('POST /api/inspections/:id/certificate', () => {
  it('issues a certificate for an approved inspection (happy path)', async () => {
    const { app } = freshApp();
    const res = await request(app).post('/api/inspections/insp-002/certificate');
    expect(res.status).toBe(201);
    expect(res.body.certificateNumber).toMatch(/^CERT-\d{4}-\d{6}$/);
    expect(res.body.elevatorId).toBe('LIFT-DE-2201');
    expect(res.body.inspector).toBe('Marco Rossi');
    expect(Array.isArray(res.body.findings)).toBe(true);

    const issued = new Date(res.body.issuedAt);
    const until = new Date(res.body.validUntil);
    expect(until.getUTCFullYear() - issued.getUTCFullYear()).toBe(1);
    expect(until.getUTCMonth()).toBe(issued.getUTCMonth());
  });

  it('returns 409 for a non-approved inspection (edge case)', async () => {
    const { app } = freshApp();
    const pending = await request(app).post('/api/inspections/insp-001/certificate');
    const rejected = await request(app).post('/api/inspections/insp-003/certificate');
    expect(pending.status).toBe(409);
    expect(rejected.status).toBe(409);
  });

  it('returns 409 on re-issue and keeps the original certificate', async () => {
    const { app } = freshApp();
    const first = await request(app).post('/api/inspections/insp-002/certificate');
    const second = await request(app).post('/api/inspections/insp-002/certificate');
    expect(second.status).toBe(409);
    const got = await request(app).get('/api/inspections/insp-002/certificate');
    expect(got.body.certificateNumber).toBe(first.body.certificateNumber);
  });

  it('returns 404 for an unknown inspection', async () => {
    const { app } = freshApp();
    const res = await request(app).post('/api/inspections/nope/certificate');
    expect(res.status).toBe(404);
  });

  it('generates unique certificate numbers', async () => {
    const { app } = freshApp();
    await request(app).post('/api/inspections/insp-001/approve');
    const a = await request(app).post('/api/inspections/insp-001/certificate');
    const b = await request(app).post('/api/inspections/insp-002/certificate');
    expect(a.body.certificateNumber).not.toBe(b.body.certificateNumber);
  });

  it('snapshots findings (later changes do not alter the certificate)', async () => {
    const { app } = freshApp();
    await request(app).post('/api/inspections/insp-001/findings')
      .send({ component: 'Door', severity: 'low', description: 'Rattle' });
    await request(app).post('/api/inspections/insp-001/approve');
    const cert = await request(app).post('/api/inspections/insp-001/certificate');
    expect(cert.body.findings).toHaveLength(1);
    expect(cert.body.findings[0].component).toBe('Door');
  });
});

describe('GET /api/inspections/:id/certificate', () => {
  it('returns 404 when no certificate has been issued', async () => {
    const { app } = freshApp();
    const res = await request(app).get('/api/inspections/insp-002/certificate');
    expect(res.status).toBe(404);
  });

  it('returns the persisted certificate', async () => {
    const { app } = freshApp();
    const issued = await request(app).post('/api/inspections/insp-002/certificate');
    const res = await request(app).get('/api/inspections/insp-002/certificate');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(issued.body);
  });
});

// Regression tests for the bug: decisions were not guarded by status, so a
// rejected inspection could be approved (and then certified) and an approved
// one could be re-approved or modified.
describe('state transition guards (bug regression)', () => {
  it('cannot approve a rejected inspection', async () => {
    const { app } = freshApp();
    const res = await request(app).post('/api/inspections/insp-003/approve');
    expect(res.status).toBe(409);
    const after = await request(app).get('/api/inspections/insp-003');
    expect(after.body.status).toBe('rejected');
  });

  it('cannot approve twice (approvedAt must not change)', async () => {
    const { app } = freshApp();
    const first = await request(app).post('/api/inspections/insp-001/approve');
    const second = await request(app).post('/api/inspections/insp-001/approve');
    expect(second.status).toBe(409);
    const after = await request(app).get('/api/inspections/insp-001');
    expect(after.body.approvedAt).toBe(first.body.approvedAt);
  });

  it('cannot reject an approved inspection', async () => {
    const { app } = freshApp();
    const res = await request(app).post('/api/inspections/insp-002/reject').send({ reason: 'x' });
    expect(res.status).toBe(409);
  });

  it('cannot add findings to a finalised inspection', async () => {
    const { app } = freshApp();
    const res = await request(app).post('/api/inspections/insp-002/findings')
      .send({ component: 'Door', severity: 'low', description: 'late' });
    expect(res.status).toBe(409);
  });
});
