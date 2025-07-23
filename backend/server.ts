import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { connectToDb } from "./src/config/db"; 

const nodeEnv = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${nodeEnv}` });

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
    res.send(`<!DOCTYPE html>
        <html>
        <head>
            <title>MenuBot</title>
            <meta charset="utf-8">
        </head>
            <body style="font-family: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;">
            <h1>MenuBot</h1>
            <p>Version: 1.0.0 (Initial Release)</p>
            <p>© Momena Akhtar - 2025</p>
            <p><strong>Environment:</strong> ${nodeEnv}</p>
            <a href="/api/docs/">View API Documentation</a>
        </body>
        </html>`);
});

connectToDb(); 
app.listen(PORT, () => {
    console.log(`[${nodeEnv}] Server is running on port ${PORT}`);
});
