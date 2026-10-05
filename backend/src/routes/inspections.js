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
    if (!result.ok && result.reason === 'not_pending') {
      throw httpError(409, 'Findings can only be added to a pending inspection');
    }
    res.status(201).json(result.inspection);
  } catch (e) { next(e); }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    const result = await store.approve(req.params.id);
    if (!result.ok && result.reason === 'not_found') throw httpError(404, 'Inspection not found');
    if (!result.ok && result.reason === 'not_pending') {
      throw httpError(409, 'Only a pending inspection can be approved');
    }
    res.json(result.inspection);
  } catch (e) { next(e); }
});

router.post('/:id/reject', async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    const result = await store.reject(req.params.id, reason);
    if (!result.ok && result.reason === 'not_found') throw httpError(404, 'Inspection not found');
    if (!result.ok && result.reason === 'not_pending') {
      throw httpError(409, 'Only a pending inspection can be rejected');
    }
    if (!result.ok && result.reason === 'reason_required') throw httpError(400, 'reason is required');
    res.json(result.inspection);
  } catch (e) { next(e); }
});

router.post('/:id/certificate', async (req, res, next) => {
  try {
    const result = await store.issueCertificate(req.params.id);
    if (!result.ok && result.reason === 'not_found') throw httpError(404, 'Inspection not found');
    if (!result.ok && result.reason === 'not_approved') {
      throw httpError(409, 'Certificate can only be issued for an approved inspection');
    }
    if (!result.ok && result.reason === 'already_issued') {
      throw httpError(409, 'A certificate has already been issued for this inspection');
    }
    res.status(201).json(result.certificate);
  } catch (e) { next(e); }
});

router.get('/:id/certificate', async (req, res, next) => {
  try {
    const result = await store.getCertificate(req.params.id);
    if (!result.ok && result.reason === 'not_found') throw httpError(404, 'Inspection not found');
    if (!result.ok && result.reason === 'no_certificate') throw httpError(404, 'No certificate issued yet');
    res.json(result.certificate);
  } catch (e) { next(e); }
});

module.exports = router;
