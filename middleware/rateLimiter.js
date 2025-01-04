import rateLimit from 'express-rate-limit';

const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyGenerator: (req) => {
    const ip = req.ip;
    const username = req.body.studentId || req.body.email || 'unknown';
    return `${ip}-${username}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 429,
      message: 'Too many attempts. Please try again later.',
    });
  },
});

export { userRateLimit };
