// validationMiddleware.js
import { body } from 'express-validator';

const validateData = [
  body('fullName')
    .isLength({ min: 1 })
    .withMessage('Full name is required')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name should only contain letters and spaces'),

  body('msgTitle')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Inquiry Type is required')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Inquiry Type name should only contain letters and spaces'),
  body('msg')
    .isLength({ min: 1 })
    .withMessage('Message  is required')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Message should only contain letters and spaces'),

  body('email').optional().isEmail().withMessage('Invalid email format'),

  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
];

export { validateData };
