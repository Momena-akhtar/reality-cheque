import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { connectToDb } from "./src/config/db"; 
import authRouter from './src/routes/authRoutes';
import userRouter from './src/routes/userRoutes';
import adminRouter from './src/routes/adminRoutes';
import stripeRouter from './src/routes/stripeRoutes';
import voucherRouter from './src/routes/voucherRoutes';
import aiModelRouter from './src/routes/aiModelRoutes';
import generateRouter from './src/routes/generateRoutes';
import emailRouter from "./src/routes/emailRoutes";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectRedis } from "./src/config/redis";
const nodeEnv = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${nodeEnv}` });

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
    res.setTimeout(300000, () => {
      console.log('Request timed out');
      res.status(504).send('Request timed out');
    });
    next();
  });
const PORT = process.env.PORT || 3000;

connectToDb(); 
connectRedis().catch((err) => {
    console.error("Failed to connect to Redis:", err);
});

app.get("/", (req: Request, res: Response) => {
    res.send(`<!DOCTYPE html>
        <html>
        <head>
            <title>Reality Cheque</title>
            <meta charset="utf-8">
        </head>
            <body style="font-family: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;">
            <h1>Reality Cheque</h1>
            <p>Version: 1.0.0 (Initial Release)</p>
            <p>© Momena Akhtar - 2025</p>
            <p><strong>Environment:</strong> ${nodeEnv}</p>
            <a href="/api/docs/">View API Documentation</a>
        </body>
        </html>`);
});

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
// app.use('/api/stripe', stripeRouter);
app.use('/api/voucher', voucherRouter);
app.use('/api/ai-models', aiModelRouter);
app.use('/api/generate', generateRouter);
app.use('/api/email', emailRouter);

app.listen(PORT, () => {
    console.log(`[${nodeEnv}] Server is running on port ${PORT}`);
});
