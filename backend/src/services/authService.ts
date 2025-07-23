import jwt from 'jsonwebtoken';
import User from '../models/user';
import Admin from '../models/admin';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = '7d';

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function getUserOrAdminById(id: string, role: 'user' | 'admin') {
  if (role === 'admin') {
    return Admin.findById(id);
  }
  return User.findById(id);
} 