import https from 'https';
import asyncHandler from '../middleware/asyncHandler.js';

const createTransaction = asyncHandler(async (req, res) => {
  const params = JSON.stringify({
    email: req.body.email, // Use email from request body
    amount: req.body.amount * 100, // Convert amount to kobo (Naira x 100)
    callback_url: process.env.PAYSTACK_CALLBACK_URL,
  });

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/initialize',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  const paystackReq = https
    .request(options, (paystackRes) => {
      let data = '';

      // Collect data chunks
      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      // Handle response completion
      paystackRes.on('end', () => {
        const response = JSON.parse(data);

        if (response.status) {
          res.status(200).json({
            success: true,
            data: response.data,
          });
        } else {
          res.status(400).json({
            success: false,
            message: response.message,
          });
        }
      });
    })
    .on('error', (error) => {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    });

  paystackReq.write(params);
  paystackReq.end();
});


const confirmTransaction = asyncHandler(async (req, res) => {
  const reference = req.params.reference; // Extract reference from the route parameter

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: `/transaction/verify/${reference}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Use your Paystack secret key
    },
  };

  https
    .request(options, (paystackRes) => {
      let data = '';

      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      paystackRes.on('end', () => {
        const response = JSON.parse(data);

        if (response.status && response.data.status === 'success') {
          // Validate the amount paid
          if (response.data.amount === req.body.amount * 100) {
            res.status(200).json({
              success: true,
              message: 'Payment verified successfully',
              data: response.data,
            });
          } else {
            res.status(400).json({
              success: false,
              message: 'Payment amount mismatch',
            });
          }
        } else {
          res.status(400).json({
            success: false,
            message: response.message || 'Verification failed',
          });
        }
      });
    })
    .on('error', (error) => {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    })
    .end();
});

export { createTransaction, confirmTransaction };
