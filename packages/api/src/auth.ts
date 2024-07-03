import jwt from 'jsonwebtoken';
import { JWT_PRIV_KEY } from './utils';

export const getUserIdFromToken = (token: string): number => {
  const decoded: any = jwt.verify(token, JWT_PRIV_KEY);

  if (!decoded.userId) {
    throw new Error('Invalid token');
  }

  return parseInt(decoded.userId);
};
