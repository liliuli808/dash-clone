import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const LEVELS_DIR = path.join(__dirname, '../public/levels');

// Ensure directory exists
if (!fs.existsSync(LEVELS_DIR)) {
    fs.mkdirSync(LEVELS_DIR, { recursive: true });
}

app.post('/api/save-level', (req, res) => {
    const { filename, data } = req.body;

    if (!filename || !data) {
        return res.status(400).json({ error: 'Missing filename or data' });
    }

    // Basic sanitization
    const safeFilename = path.basename(filename);
    const filePath = path.join(LEVELS_DIR, safeFilename);

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`[Server] Saved level to ${filePath}`);
        res.json({ success: true, message: 'Level saved successfully' });
    } catch (err) {
        console.error('Error saving file:', err);
        res.status(500).json({ error: 'Failed to save file' });
    }
});

app.listen(port, () => {
    console.log(`Save Server running on http://localhost:${port}`);
});
