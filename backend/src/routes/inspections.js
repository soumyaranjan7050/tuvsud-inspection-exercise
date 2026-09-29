const express = require('express');
const { defaultStore } = require('../models/inspectionStore');
const { httpError } = require('../middleware/errorHandler');

const router = express.Router();

let store = defaultStore;
router.setStore = (s) => { store = s; };

router.get('/', async (req, res, next) => {
  try {
    const { status, inspector } = req.query;
    res.json(await store.list({ status, inspector }));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const it = await store.get(req.params.id);
    if (!it) throw httpError(404, 'Inspection not found');
    res.json(it);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { elevatorId, site, inspector, inspectedAt } = req.body || {};
    if (!elevatorId || !site || !inspector) {
      throw httpError(400, 'elevatorId, site and inspector are required');
    }
    const it = await store.create({ elevatorId, site, inspector, inspectedAt });
    res.status(201).json(it);
  } catch (e) { next(e); }
});

router.post('/:id/findings', async (req, res, next) => {
  try {
    const { component, severity, description } = req.body || {};
    if (!component || !severity || !description) {
      throw httpError(400, 'component, severity and description are required');
    }
    const result = await store.addFinding(req.params.id, { component, severity, description });
    if (!result.ok && result.reason === 'not_found') throw httpError(404, 'Inspection not found');
    res.status(201).json(result.inspection);
  } catch (e) { next(e); }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    const result = await store.approve(req.params.id);
    if (!result.ok && result.reason === 'not_found') throw httpError(404, 'Inspection not found');
    res.json(result.inspection);
  } catch (e) { next(e); }
});

router.post('/:id/reject', async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    const result = await store.reject(req.params.id, reason);
    if (!result.ok && result.reason === 'not_found') throw httpError(404, 'Inspection not found');
    if (!result.ok && result.reason === 'reason_required') throw httpError(400, 'reason is required');
    res.json(result.inspection);
  } catch (e) { next(e); }
});

// -------------------------------------------------------------------------
// TODO (candidate): Compliance Certificate
//
//   POST /api/inspections/:id/certificate
//     - Only for APPROVED inspections (409 otherwise).
//     - Generate: certificateNumber (unique), issuedAt (ISO),
//       validUntil (12 months after issuedAt), elevatorId, inspector,
//       findings snapshot.
//     - Persist on the inspection. Re-issue policy is your call — document it.
//
//   GET /api/inspections/:id/certificate
//     - Return the persisted certificate JSON, or 404 if not yet issued.
//
// See README section "1. Add a Compliance Certificate feature".
// -------------------------------------------------------------------------

module.exports = router;
