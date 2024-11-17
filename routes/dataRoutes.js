import express from 'express';
import { accountData } from '../controllers/dataController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();
router.route('/').get(protect, admin, accountData);

export default router;
