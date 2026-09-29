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

// TODO (candidate):
//   - Tests for POST /api/inspections/:id/certificate (happy path + edge case)
//   - Tests for GET /api/inspections/:id/certificate
//   - A test that would have caught the bug you fixed
