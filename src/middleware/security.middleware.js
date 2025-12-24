import aj from '#src/config/arcjet.js';
import logger from '#config/logger.js';
import { slidingWindow } from '@arcjet/node';

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';

    let limit;

    switch (role) {
      case 'admin':
        limit = 20; // High limit for admins
        break;
      case 'user':
        limit = 10; // Moderate limit for regular users
        break;
      case 'guest':
      default:
        limit = 5; // Low limit for guests
        break;
    }

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    const decision = await client.protect(req);

    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Bot request blocked', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated request are not allowed.',
      });
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield blocked request', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
      });

      return res.status(403).json({
        error: 'Forbidden',
        message:
          'Request blocked due to security policy. If you believe this is an error, please contact support.',
      });
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
      });

      return res.status(429).json({
        error: 'Forbidden',
        message:
          'You have exceeded your request limit. Please try again later.',
      });
    }

    next();
  } catch (e) {
    console.error('Security middleware error:', e);
    res.status(500).json({
      error: 'Internal Server Error',
      message:
        'An error occurred while processing your request by security middleware.',
    });
  }
};

export default securityMiddleware;
