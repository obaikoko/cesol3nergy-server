import express from 'express';
import {
  createTransaction,
  confirmTransaction,
} from '../controllers/transactionController.js';
const router = express.Router();

router.route('/initialize').post(createTransaction);
router.route('/verify/:reference').get(confirmTransaction);

export default router;
