import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
    res.send(`<!DOCTYPE html>
        <html>
        <head>
            <title>Minibots</title>
            <meta charset="utf-8">
        </head>
            <body style="font-family: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;">
            <h1>Minibots</h1>
            <p>Version: 1.0.0 (Initial Release)</p>
            <p>©Momena Akhtar - 2025</p>
            <a href="/api/docs/">View API Documentation</a>
        </body>
        </html>`);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
