import express from 'express';
import { sendMsg } from '../controllers/contactController.js';
import { userRateLimit } from '../middleware/rateLimiter.js';
import { validateData } from '../middleware/validateMiddleware.js';

const router = express.Router();
router.route('/').post(validateData, userRateLimit, sendMsg);

export default router;
