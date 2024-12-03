import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import colors from 'colors';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import userRoute from './routes/userRoutes.js';
import productRoute from './routes/productRoutes.js';
import orderRoute from './routes/orderRoutes.js';
import dataRoute from './routes/dataRoutes.js';
import transactionRoute from './routes/transactionRoutes.js';

dotenv.config();
const port = process.env.PORT || 5000;

connectDB();
const app = express();
const corsOptions = {
  // origin: 'http://localhost:3000',
  origin: 'https://cesol3nergy.vercel.app',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/api/users', userRoute);
app.use('/api/products', productRoute);
app.use('/api/orders', orderRoute);
app.use('/api/data', dataRoute);
app.use('/api/transaction', transactionRoute);

// Endpoint to verify payment
app.post('/api/verify-payment', async (req, res) => {
  const { reference } = req.body;

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status && response.data.data.status === 'success') {
      // Payment was successful
      res.json({ success: true, data: response.data.data });
    } else {
      // Payment failed or incomplete
      res.status(400).json({ success: false, message: 'Payment not verified' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.use(errorHandler);
app.use(notFound);
app.listen(port, () => console.log(`Server running on ${port}`));
