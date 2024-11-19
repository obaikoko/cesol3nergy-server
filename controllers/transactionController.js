import https from 'https';
import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/orderModel.js';

const createTransaction = asyncHandler(async (req, res) => {
  const { email, amount, orderId } = req.body; // Get order details from request

  const params = JSON.stringify({
    email,
    amount: amount * 100, // Convert to kobo (Naira x 100)
    callback_url: `${process.env.PAYSTACK_CALLBACK_URL}/order/${orderId}`,
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

  const paystackReq = https.request(options, (paystackRes) => {
    let data = '';

    paystackRes.on('data', (chunk) => {
      data += chunk;
    });

    paystackRes.on('end', async () => {
      const response = JSON.parse(data);

      if (response.status) {
        try {
          // Save reference to the database
          const order = await Order.findById(orderId);
          if (!order) {
            return res
              .status(404)
              .json({ success: false, message: 'Order not found' });
          }

          order.transactionReference = response.data.reference; // Save the reference
          await order.save();

          res.status(200).json({
            success: true,
            data: {
              authorization_url: response.data.authorization_url,
              reference: response.data.reference,
            },
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({
            success: false,
            message: 'Failed to save transaction reference',
          });
        }
      } else {
        res.status(400).json({
          success: false,
          message: response.message,
        });
      }
    });
  });

  paystackReq.on('error', (error) => {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  paystackReq.write(params);
  paystackReq.end();
});

const confirmTransaction = asyncHandler(async (req, res) => {
  const reference = req.query.reference; // Extract reference from query

  if (!reference) {
    return res.status(400).json({
      success: false,
      message: 'Transaction reference is required',
    });
  }

  // Fetch the transaction/order from the database
  const order = await Order.findOne({ transactionReference: reference }); // Adjust field to match your schema

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found for this transaction reference',
    });
  }

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: `/transaction/verify/${reference}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Your secret key
    },
  };

  const paystackReq = https.request(options, (paystackRes) => {
    let data = '';

    paystackRes.on('data', (chunk) => {
      data += chunk;
    });

    paystackRes.on('end', async () => {
      const response = JSON.parse(data);

      if (response.status && response.data.status === 'success') {
        // Validate the amount from Paystack matches the database value
        if (response.data.amount === order.totalPrice * 100) {
          // Update order status to reflect successful payment
          order.isPaid = true;
          order.paidAt = new Date();
          await order.save();

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
          message: response.message || 'Payment verification failed',
        });
      }
    });
  });

  paystackReq.on('error', (error) => {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  });

  paystackReq.end();
});

export { createTransaction, confirmTransaction };
