import rateLimit from 'express-rate-limit';

// Rate Limiter to prevent abuse

const userRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 100 requests per window
  handler: (req, res) => {
    res.status(429).json({
      status: 429, // HTTP status code for Too Many Requests
      message: 'Too many requests, please try again after 1 hour',
    });
  },
});

export { userRateLimit };
