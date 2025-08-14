import express from 'express';
import User from '../models/user';
import Admin from '../models/admin';
import { signToken } from '../services/authService';
import { COOKIE_OPTIONS } from '../config/auth';
import { authMiddleware } from '../middleware/authMiddleware';

const authRouter: express.Router = express.Router();

const FIXED_COOKIE_OPTIONS = { ...COOKIE_OPTIONS, sameSite: 'lax' as const };

// Register handler
const registerHandler: express.RequestHandler = async (req, res) => {
  const { 
    username, 
    email, 
    password, 
    role, 
    userType,
    usageType,
    agencyName, 
    services, 
    website, 
    pricingPackages, 
    currentOffers,
    caseStudies, 
    clientsServed, 
    targetAudience,
    idealClientProfile,
    offer, 
    bigBrands, 
    stepByStepProcess, 
    timelineToResults, 
    leadSources, 
    monthlyRevenue 
  } = req.body;
    
  if (!email || !password || !role) {
    res.status(400).json({ message: 'Email, password, and role are required' });
    return;
  }
  if (role === 'user' && !username) {
    res.status(400).json({ message: 'Username is required for user registration' });
    return;
  }
  if (role === 'user' && !userType) {
    res.status(400).json({ message: 'User type (agency/freelancer) is required' });
    return;
  }
  if (role === 'user' && !usageType) {
    res.status(400).json({ message: 'Usage type (personal/clients) is required' });
    return;
  }
  
  try {
    let user;
    if (role === 'admin') {
      user = new Admin({ email, password });
      await user.save();
    } else {
      user = new User({ 
        username, 
        email, 
        password,
        userType,
        usageType,
        agencyName: agencyName || '', 
        services: services || [], 
        website: website || '', 
        pricingPackages: pricingPackages || [], 
        currentOffers: currentOffers || [],
        caseStudies: caseStudies || '', 
        clientsServed: clientsServed || 0, 
        targetAudience: targetAudience || '',
        idealClientProfile: idealClientProfile || '',
        offer: offer || '', 
        bigBrands: bigBrands || '', 
        stepByStepProcess: stepByStepProcess || [], 
        timelineToResults: timelineToResults || [], 
        leadSources: leadSources || [], 
        monthlyRevenue: monthlyRevenue || 0 
      });
      await user.save();
    }
    const token = signToken({ id: user._id, role });
    res.cookie('token', token, FIXED_COOKIE_OPTIONS);
    res.status(201).json({ 
      message: 'Registered successfully', 
      user: { 
        id: user._id, 
        email, 
        role, 
        ...(role === 'user' ? { 
          username,
          userType: user.userType,
          usageType: user.usageType,
          tier: user.tier,
          totalCredits: user.totalCredits,
          usedCredits: user.usedCredits,
          agencyName: user.agencyName,
          services: user.services,
          website: user.website,
          pricingPackages: user.pricingPackages,
          currentOffers: user.currentOffers,
          caseStudies: user.caseStudies,
          clientsServed: user.clientsServed,
          targetAudience: user.targetAudience,
          idealClientProfile: user.idealClientProfile,
          offer: user.offer,
          bigBrands: user.bigBrands,
          stepByStepProcess: user.stepByStepProcess,
          timelineToResults: user.timelineToResults,
          leadSources: user.leadSources,
          monthlyRevenue: user.monthlyRevenue
        } : {}) 
      } 
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    
    // Handle specific MongoDB errors
    if (err.code === 11000) {
      if (err.keyPattern?.email) {
        res.status(400).json({ message: 'Email already exists' });
      } else if (err.keyPattern?.username) {
        res.status(400).json({ message: 'Username already exists' });
      } else {
        res.status(400).json({ message: 'Duplicate key error' });
      }
      return;
    }
    
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map((e: any) => e.message);
      res.status(400).json({ message: 'Validation failed', errors: validationErrors });
      return;
    }
    
    res.status(500).json({ message: 'Registration failed', error: err.message || 'Unknown error' });
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
    res.json({ 
      message: 'Login successful', 
      user: { 
        id: user._id, 
        email, 
        role, 
        ...(role === 'user' ? { 
          username: user.username,
          userType: user.userType,
          usageType: user.usageType,
          tier: user.tier,
          totalCredits: user.totalCredits,
          usedCredits: user.usedCredits,
          agencyName: user.agencyName,
          services: user.services,
          website: user.website,
          pricingPackages: user.pricingPackages,
          currentOffers: user.currentOffers,
          caseStudies: user.caseStudies,
          clientsServed: user.clientsServed,
          targetAudience: user.targetAudience,
          idealClientProfile: user.idealClientProfile,
          offer: user.offer,
          bigBrands: user.bigBrands,
          stepByStepProcess: user.stepByStepProcess,
          timelineToResults: user.timelineToResults,
          leadSources: user.leadSources,
          monthlyRevenue: user.monthlyRevenue
        } : {}) 
      } 
    });
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

// Get current user info
authRouter.get('/me', authMiddleware, (req, res) => {
  // Only support users for now
  if ((req as any).user) {
    const { _id, email, username, picture, tier, totalCredits, usedCredits, userType, usageType, agencyName, services, website, pricingPackages, currentOffers, caseStudies, clientsServed, targetAudience, idealClientProfile, offer, bigBrands, stepByStepProcess, timelineToResults, leadSources, monthlyRevenue } = (req as any).user;
    res.json({ 
      id: _id, 
      email, 
      username, 
      picture, 
      tier,
      totalCredits,
      usedCredits,
      userType,
      usageType,
      agencyName,
      services,
      website,
      pricingPackages,
      currentOffers,
      caseStudies,
      clientsServed,
      targetAudience,
      idealClientProfile,
      offer,
      bigBrands,
      stepByStepProcess,
      timelineToResults,
      leadSources,
      monthlyRevenue
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

export default authRouter; 