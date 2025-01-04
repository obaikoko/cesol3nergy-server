import asyncHandler from '../middleware/asyncHandler.js';
import { sendSingleMail } from '../utils/emailService.js';
import { validationResult } from 'express-validator';

const sendMsg = asyncHandler(async (req, res) => {
  const { fullName, email, phone, msg, msgTitle } = req.body;

  if (!fullName || !email || !phone || !msg || !msgTitle) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  sendSingleMail({
    email: process.env.ADMINMAIL,
    subject: `${msgTitle}`,
    text: `FullName: ${fullName}, Tel:${phone}, Email: ${email}, message: ${msg}`,
  });

  res.status(200);
  res.json('mail sent');
});

export { sendMsg };
