import { submitLHSJob, getLHSJob } from './lhs.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeCache from 'node-cache';
import cors from 'cors';

const resultCache = new NodeCache();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());

// Set up middleware to parse request bodies
app.use(express.urlencoded({ extended: true }));

// Serve the static files in the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/lhs', (req, res) => {
  const queryUrl = req.query.queryUrl;
  if (req.query.useCache === true && resultCache.has(queryUrl)) {
    res.json(resultCache.get(queryUrl));
  } else {
    const jobId = submitLHSJob(queryUrl);
    res.status(202).json({ jobId });
  }
});

// Endpoint to check job status and get results
app.get('/lhs/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const jobResult = getLHSJob(jobId);

  if (jobResult !== undefined) {
    // Job result found in the cache
    res.json(jobResult);
  } else {
    // Job result not yet available
    res.status(404).json({ error: 'Job result not found. Please try again later.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
