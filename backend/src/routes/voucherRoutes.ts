import express from 'express';
import { VoucherService } from '../services/voucherService';
import { authMiddleware } from '../middleware/authMiddleware';

const voucherRouter: express.Router = express.Router();

// User routes for voucher validation and usage
const validateVoucher: express.RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { code, targetTier } = req.body;

    if (!code) {
      res.status(400).json({ message: 'Voucher code is required' });
      return;
    }

    const result = await VoucherService.getInstance().validateVoucher(
      code,
      user.id,
      targetTier
    );

    if (result.valid) {
      res.json({
        valid: true,
        voucher: {
          id: result.voucher?._id,
          code: result.voucher?.code,
          tier: result.voucher?.tier,
          credits: result.voucher?.credits,
          maxUses: result.voucher?.maxUses,
          description: result.voucher?.description
        },
        credits: result.credits
      });
    } else {
      res.status(400).json({
        valid: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error validating voucher:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const useVoucher: express.RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ message: 'Voucher code is required' });
      return;
    }

    const result = await VoucherService.getInstance().useVoucher(code, user.id);
    
    if (result.success) {
      res.json({ 
        message: result.message,
        credits: result.credits
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error using voucher:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// User routes (protected by global auth middleware)
voucherRouter.post('/validate', authMiddleware, validateVoucher);
voucherRouter.post('/use', authMiddleware, useVoucher);

export default voucherRouter; 