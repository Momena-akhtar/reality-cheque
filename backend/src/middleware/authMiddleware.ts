import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserOrAdminById } from '../services/authService';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Try to get token from multiple sources
    let token = req.cookies?.token; // For users (cookie-based)
    
    //Authorization header (for admins)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !('id' in decoded) || !('role' in decoded)) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    const { id, role } = decoded as { id: string; role: 'user' | 'admin' };
    const userOrAdmin = await getUserOrAdminById(id, role);
    
    if (!userOrAdmin) {
      res.status(401).json({ message: 'User/Admin not found' });
      return;
    }

    if (role === 'admin') {
      (req as any).admin = userOrAdmin;
    } else {
      (req as any).user = userOrAdmin;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}