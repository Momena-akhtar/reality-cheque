import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserOrAdminById } from '../services/authService';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const decoded = verifyToken(token);
  if (!decoded || typeof decoded !== 'object' || !('id' in decoded) || !('role' in decoded)) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  const { id, role } = decoded as { id: string; role: 'user' | 'admin' };
  const userOrAdmin = await getUserOrAdminById(id, role);
  if (!userOrAdmin) {
    return res.status(401).json({ message: 'User/Admin not found' });
  }
  if (role === 'admin') {
    (req as any).admin = userOrAdmin;
  } else {
    (req as any).user = userOrAdmin;
  }
  next();
} 