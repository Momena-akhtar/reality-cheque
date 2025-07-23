import express from 'express';
import User from '../models/user';
import Admin from '../models/admin';
import { signToken } from '../services/authService';
import { COOKIE_OPTIONS } from '../config/auth';

const authRouter: express.Router = express.Router();

const FIXED_COOKIE_OPTIONS = { ...COOKIE_OPTIONS, sameSite: 'lax' as const };

// Register handler
const registerHandler: express.RequestHandler = async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!email || !password || !role) {
    res.status(400).json({ message: 'Email, password, and role are required' });
    return;
  }
  if (role === 'user' && !username) {
    res.status(400).json({ message: 'Username is required for user registration' });
    return;
  }
  try {
    let user;
    if (role === 'admin') {
      user = new Admin({ email, password });
      await user.save();
    } else {
      user = new User({ username, email, password });
      await user.save();
    }
    const token = signToken({ id: user._id, role });
    res.cookie('token', token, FIXED_COOKIE_OPTIONS);
    res.status(201).json({ message: 'Registered successfully', user: { id: user._id, email, role, ...(role === 'user' ? { username } : {}) } });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err });
  }
};

authRouter.post('/register', registerHandler);

// Login handler
const loginHandler: express.RequestHandler = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    res.status(400).json({ message: 'Email, password, and role are required' });
    return;
  }
  try {
    const Model = role === 'admin' ? Admin : User;
    const user = await Model.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const token = signToken({ id: user._id, role });
    res.cookie('token', token, FIXED_COOKIE_OPTIONS);
    res.json({ message: 'Login successful', user: { id: user._id, email, role, ...(role === 'user' ? { username: user.username } : {}) } });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err });
  }
};

authRouter.post('/login', loginHandler);

// Logout handler
const logoutHandler: express.RequestHandler = (req, res) => {
  res.clearCookie('token', FIXED_COOKIE_OPTIONS);
  res.json({ message: 'Logged out successfully' });
};

authRouter.post('/logout', logoutHandler);

export default authRouter; 