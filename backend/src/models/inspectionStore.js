const fs = require('fs');
const path = require('path');

/**
 * In-memory inspection store. Async to mimic real I/O.
 */
class InspectionStore {
  constructor(seed = []) {
    this.inspections = new Map();
    for (const it of seed) this.inspections.set(it.id, structuredClone(it));
  }

  static fromSeedFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return new InspectionStore(JSON.parse(raw));
  }

  async list({ status, inspector } = {}) {
    return new Promise(resolve => setImmediate(() => {
      let out = Array.from(this.inspections.values());
      if (status) out = out.filter(i => i.status === status);
      if (inspector) {
        const q = inspector.toLowerCase();
        out = out.filter(i => i.inspector && i.inspector.toLowerCase().includes(q));
      }
      out.sort((a, b) => a.inspectedAt.localeCompare(b.inspectedAt));
      resolve(out.map(v => this._view(v)));
    }));
  }

  async get(id) {
    return new Promise(resolve => setImmediate(() => {
      const it = this.inspections.get(id);
      resolve(it ? this._view(it) : null);
    }));
  }

  async create({ elevatorId, site, inspector, inspectedAt }) {
    return new Promise(resolve => setImmediate(() => {
      const id = `insp-${String(this.inspections.size + 1).padStart(3, '0')}`;
      const it = {
        id, elevatorId, site, inspector,
        inspectedAt: inspectedAt || new Date().toISOString(),
        status: 'pending',
        findings: []
      };
      this.inspections.set(id, it);
      resolve(this._view(it));
    }));
  }

  async addFinding(id, { component, severity, description }) {
    return new Promise(resolve => setImmediate(() => {
      const it = this.inspections.get(id);
      if (!it) return resolve({ ok: false, reason: 'not_found' });
      const finding = {
        id: `f${it.findings.length + 1}-${id}`,
        component, severity, description
      };
      it.findings.push(finding);
      resolve({ ok: true, inspection: this._view(it) });
    }));
  }

  async approve(id) {
    return new Promise(resolve => setImmediate(() => {
      const it = this.inspections.get(id);
      if (!it) return resolve({ ok: false, reason: 'not_found' });
      it.status = 'approved';
      it.approvedAt = new Date().toISOString();
      resolve({ ok: true, inspection: this._view(it) });
    }));
  }

  async reject(id, reason) {
    return new Promise(resolve => setImmediate(() => {
      const it = this.inspections.get(id);
      if (!it) return resolve({ ok: false, reason: 'not_found' });
      if (!reason) return resolve({ ok: false, reason: 'reason_required' });
      it.status = 'rejected';
      it.rejectionReason = reason;
      it.rejectedAt = new Date().toISOString();
      resolve({ ok: true, inspection: this._view(it) });
    }));
  }

  // Candidate: certificate methods live here.

  _view(it) {
    return JSON.parse(JSON.stringify(it));
  }
}

module.exports = { InspectionStore };

module.exports.defaultStore = InspectionStore.fromSeedFile(
  path.join(__dirname, '..', '..', 'data', 'seed.json')
);
