import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/userModel.js';
import { sendSingleMail } from '../utils/emailService.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';

// @description This is to authenticate users
// @Route POST /api/users/auth
// privacy Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please add all field');
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error('invalid username or password');
  }

  if (user && (await user.matchPassword(password))) {
    res.status(200);
    generateToken(res, user._id);
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(400);
    throw new Error('Invalid credentials');
  }
});

// @description Verify Email
// @Route POST /api/users/
// privacy Public

const verifyEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const verificationToken = crypto.randomBytes(32).toString('hex');
  if (!email) {
    res.status(400);
    throw new Error('Please add a valid email address');
  }

  // Check if the user already exists
  const existingUser = await User.findOne({ email, isVerified: true });
  const unverifiedUser = await User.findOne({ email, isVerified: false });
  if (existingUser) {
    res.status(400);
    throw new Error('User with this email already exists.');
  }
  if (unverifiedUser) {
    unverifiedUser.verificationToken = verificationToken;
    await unverifiedUser.save();

    const verificationUrl = `${process.env.PUBLIC_DOMAIN}/register/?token=${verificationToken}`;

    sendSingleMail({
      email,
      subject: 'Email Verification',
      text: `Please use the link below to complete your account creation: ${verificationUrl}`,
    });
    res.status(400);
    throw new Error(
      'Account creation already in progress, follow the link in your email to complete the account creation.'
    );
  }

  // Save the user temporarily with verification token
  const newUser = await User.create({
    email,
    verificationToken,
    isVerified: false, // Mark as not verified
  });
  const verificationUrl = `${process.env.PUBLIC_DOMAIN}/register/?token=${verificationToken}`;

  sendSingleMail({
    email,
    subject: 'Email Verification',
    text: ` Please use the link below to complete your account creation: ${verificationUrl}`,
  });
  res.status(200).json({
    message: 'Verification email sent. Please check your inbox.',
  });
});

// @description Verify token
// @Route POST /api/users/verify-token
// privacy Public
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, address, password } = req.body;
  if (!firstName || !lastName || !phone || !address || !password) {
    res.status(400);
    throw new Error('Please add all field');
  }
  const { token } = req.params;

  // Find the user with the token
  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired token.');
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.phone = phone;
  user.address = address;
  user.password = password;
  user.isVerified = true;
  user.verificationToken = null; // Clear the token
  await user.save();
  generateToken(res, user._id);

  res.status(200);
  res.json({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    isAdmin: user.isAdmin,
  });
});

// @description This is to logout user
// @Route POST /api/users/logout
// privacy Private
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logout User ' });
});

// @description This is to authenticate users
// @Route GET /api/users
// privacy Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      address: user.address,
      phone: user.phone,
      isAdmin: user.isAdmin,
    });
  }
});

// @description This is to authenticate users
// @Route PUT /api/users/
// privacy Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      address: updatedUser.address,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @description This is to delete a user
// @Route DELETE /api/users/:id
// privacy Private
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error('Can not delete admin user');
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @description This is to delete a user
// @Route DELETE /api/users/
// privacy Private
const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @description This is to get all users
// @Route GET /api/users
// privacy Private
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// @description This is to get user by ID
// @Route POST /api/users/:id
// privacy Private
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @description This is to update user
// @Route POST /api/users/:id
// privacy Private
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.firstName;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    // user.isAdmin = Boolean(req.body.isAdmin);

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      address: updatedUser.address,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc Send reset password link
// @route POST api/users/forget-password
// @privacy Public
const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the reset token before saving to the database
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set reset token and expiration
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour from now

  await user.save();

  // Create reset URL to send in email
  const resetUrl = `${process.env.PUBLIC_DOMAIN}/reset-password?token=${resetToken}`;

  // Send the email
  await sendSingleMail({
    email,
    subject: 'Password Reset',
    text: `You requested a password reset. Please go to this link to reset your password: ${resetUrl}`,
  });

  res.status(200);
  res.json('Password reset link has been sent to your email');
});
// @desc Reset password
// @route PUT api/users/reset-password
// @privacy Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const { newPassword } = req.body;

  // Password validation regex
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/;

  // Ensure token is a string
  if (typeof token !== 'string') {
    res.status(400);
    throw new Error('Invalid token format');
  }

  // Hash the token provided by the user
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find the user with the matching reset token and ensure it's not expired
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  // Check if the new password meets the strength criteria
  if (!passwordRegex.test(newPassword)) {
    res.status(400);
    throw new Error(
      'Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character.'
    );
  }

  // Update the user's password and clear the reset token fields
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.status(200);
  res.json('Password has been reset successfully');
  sendSingleMail({
    email: user.email,
    subject: `Password reset successful`,
    text: `You have successfully reset your password. </br> NOTE if you did not initiate this process quickly change your password or contact the admin.`,
  });
});

export {
  verifyEmail,
  registerUser,
  authUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  deleteAccount,
  getUserById,
  updateUser,
  forgetPassword,
  resetPassword,
};
