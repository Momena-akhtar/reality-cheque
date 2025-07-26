import express from 'express';
import { AdminService } from '../services/adminService';
import { verifyToken } from '../services/authService';

const adminRouter: express.Router = express.Router();

const adminLoginHandler: express.RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }
  
  const result = await AdminService.getInstance().authenticateAdmin(email, password);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json({ message: result.message });
  }
};

const adminLogoutHandler: express.RequestHandler = async (req, res) => {
  // For session-based auth, we just return success
  // The frontend will clear the token
  res.json({ message: 'Admin logout successful' });
};

const adminRefreshHandler: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(401).json({ message: 'Admin not authenticated' });
    return;
  }
  
  const result = await AdminService.getInstance().refreshAdminToken(admin._id);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json({ message: result.message });
  }
};

const getAdminInfo: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(401).json({ message: 'Admin not authenticated' });
    return;
  }
  
  const adminData = await AdminService.getInstance().getAdminById(admin._id);
  
  if (adminData) {
    res.json(adminData);
  } else {
    res.status(404).json({ message: 'Admin not found' });
  }
};

const adminAuthMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No admin token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !('id' in decoded) || !('role' in decoded)) {
      res.status(401).json({ message: 'Invalid admin token' });
      return;
    }

    const { id, role } = decoded as { id: string; role: string };
    if (role !== 'admin') {
      res.status(401).json({ message: 'Not an admin token' });
      return;
    }

    const admin = await AdminService.getInstance().getAdminById(id);
    if (!admin) {
      res.status(401).json({ message: 'Admin not found' });
      return;
    }

    (req as any).admin = admin;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

adminRouter.post('/login', adminLoginHandler);
adminRouter.post('/logout', adminLogoutHandler);
adminRouter.post('/refresh', adminAuthMiddleware, adminRefreshHandler);
adminRouter.get('/me', adminAuthMiddleware, getAdminInfo);

export default adminRouter; 