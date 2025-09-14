import { Router, Request, Response } from "express";
import { sendOTPEmail, verifyOTP } from "../services/emailService";

const emailRouter = Router();

emailRouter.post("/send-otp", async (req: Request, res: Response) : Promise<any> => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: "Email is required" 
            });
        }

        const otp = await sendOTPEmail(email);
        
        res.status(200).json({ 
            success: true, 
            message: "OTP sent successfully",
        });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to send OTP" 
        });
    }
});

emailRouter.post("/verify-otp", async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return res.status(400).json({ 
                success: false, 
                message: "Email and OTP are required" 
            });
        }

        const isValid = await verifyOTP(email, otp);
        
        if (isValid) {
            res.status(200).json({ 
                success: true, 
                message: "OTP verified successfully" 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: "Invalid or expired OTP" 
            });
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to verify OTP" 
        });
    }
});

export default emailRouter;