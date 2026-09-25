import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required: missing Bearer token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // If mock token is passed
    if (token.startsWith('mock_jwt_token_')) {
      const decodedUser = JSON.parse(Buffer.from(token.replace('mock_jwt_token_', ''), 'base64').toString());
      req.user = decodedUser;
      return next();
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired authorization token' });
  }
};
