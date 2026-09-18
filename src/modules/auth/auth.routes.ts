import { Router } from 'express';
import { csrfController } from './auth.controller.js';
import { requireCsrf } from '../../middleware/csrf.js';

const router = Router();
router.get('/csrf', csrfController);
router.post('/protected-check', requireCsrf, (_req, res) => res.json({ success: true }));
export default router;
