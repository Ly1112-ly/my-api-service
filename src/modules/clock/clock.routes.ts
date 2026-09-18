import { Router } from 'express';
import { clockController } from './clock.controller.js';

const router = Router();
router.get('/', clockController);

export default router;
