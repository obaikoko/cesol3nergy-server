import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  forgetPassword,
  resetPassword,
  deleteAccount,
} from '../controllers/userController.js';
import { userRateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

router.route('/').post(registerUser).get(protect, admin, getUsers);
router.route('/delete-account').delete(protect, deleteAccount);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router.route('/forget-password').post(userRateLimit, forgetPassword);
router.route('/reset-password').put(userRateLimit, resetPassword);

router.post('/auth', authUser);
router.post('/auth', authUser);
router.post('/logout', logoutUser);
router
.route('/:id')
.get(protect, admin, getUserById)
.put(protect, admin, updateUser)
.delete(protect, admin, deleteUser);

export default router;
