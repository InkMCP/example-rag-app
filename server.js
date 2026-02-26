require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const { ingest, generate } = require('./lib/rag');
const { listDocuments, deleteDocument } = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// File upload config — store in memory for text extraction
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.md', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(', ')}`));
    }
  }
});

// Upload and ingest a document
app.post('/api/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let text;

    if (ext === '.pdf') {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else {
      text = req.file.buffer.toString('utf-8');
    }

    if (!text.trim()) {
      return res.status(400).json({ error: 'File contains no text' });
    }

    const result = await ingest(req.file.originalname, text);
    res.json({
      message: `Ingested "${req.file.originalname}" — ${result.chunks} chunks`,
      ...result
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// List documents
app.get('/api/documents', (req, res) => {
  try {
    const docs = listDocuments();
    res.json(docs);
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a document
app.delete('/api/documents/:id', (req, res) => {
  try {
    deleteDocument(Number(req.params.id));
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Query
app.post('/api/query', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    const result = await generate(question);
    res.json(result);
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`RAG app running at http://localhost:${PORT}`);
});
