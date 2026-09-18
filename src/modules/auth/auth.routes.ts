import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireCsrf } from '../../middleware/csrf.js';
import {
  csrfController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController
} from './auth.controller.js';

const router = Router();

router.get('/csrf', csrfController);
router.post('/register', registerController);
router.post('/login', loginController);
router.post('/logout', logoutController);
router.post('/refresh', refreshController);
router.get('/me', requireAuth, meController);
router.post('/protected-check', requireAuth, requireCsrf, (_req, res) => res.json({ success: true, message: 'Protected route verified' }));

export default router;
