import { submitLHSJob, getLHSJob } from './lhs-computer.js';
import render from './render.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeCache from 'node-cache';
import cors from 'cors';
import fs from 'fs/promises';
import bodyParser from "body-parser";
import { compare, status } from './visual-compare.js';
import serveIndex from 'serve-index';
import find from './finder.js';

const resultCache = new NodeCache();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

const ASSET_BIN = 'asset-bin';

// Middleware for access logging
app.use((req, res, next) => {
  const accessLog = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
  fs.appendFile('access.log', accessLog, 'utf8', () => { });
  next();
});

app.use(cors({
  origin: '*',
}));

app.use(bodyParser.json());

app.use('/screenshots', express.static('public/screenshots'), serveIndex('public/screenshots', { 'icons': true }))

// Handle the image URL and save it locally
app.get('/asset-bin', async (req, res) => {
  const imageUrl = req.query.src;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is missing.' });
  }

  try {
    const fetchHeaders = new Headers();
    fetchHeaders.set('Authorization', req.header('Authorization'));
    fetchHeaders.set('x-api-key', req.header('x-api-key'));

    const response = await fetch(imageUrl, { headers: fetchHeaders });

    if (!response.ok) {
      throw new Error('Image request failed');
    }

    const imageBuffer = await response.arrayBuffer();
    const imageFileName = `${Date.now()}_${path.basename(imageUrl)}`;
    const imagePath = path.join(__dirname, `/public/${ASSET_BIN}/`, imageFileName);

    await fs.writeFile(imagePath, Buffer.from(imageBuffer));

    const localImageUrl = `/${ASSET_BIN}/${imageFileName}`;
    const completeUrl = `${req.protocol}://${req.get('host')}${localImageUrl}`;

    res.json({ 'asset-url': completeUrl });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Error processing image.' });
  }
});

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
  if (req.query.useCache === 'true' && resultCache.has(queryUrl)) {
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
    res.json(jobResult);
  } else {
    res.status(404).json({ error: 'Job result not found. Please try again later.' });
  }
});

app.get('/render', async (req, res) => {
  const srcUrl = req.query.src;

  if (!srcUrl) {
    return res.status(400).send('Please provide a valid "src" parameter.');
  }

  try {
    await render(req, res);
  } catch (error) {
    console.error(error);
  }
});

app.get('/find', async (req, res) => {
  const srcUrl = req.query.src;
  const selector = req.query.selector;

  if (!srcUrl) {
    return res.status(400).send('Please provide a valid "src" parameter.');
  }

  if (!selector) {
    return res.status(400).send('Please provide a valid "selector" parameter.');
  }

  try {
    const result = await find(srcUrl, selector);
    res.json({ result });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error finding element.');
  }
});

app.post("/visual-compare", (req, res) => {
  debugger;
  const { path, domain, branch } = req.body;
  const jobId = compare(path, domain, branch);
  res.status(202).json({ job_id: jobId });
});

app.get("/visual-compare-status", (req, res) => {
  const jobId = req.query.jobId; // Retrieve the jobId from the request
  console.log("Received polling request with jobId:", jobId);
  const job = status(jobId);
  if (job.status === 'complete' || job.status === 'in-progress' || job.status === 'pending') {
    res.status(200).json(job);
  } else {
    res.status(500).json(job);
  }
});

app.get('/browse', (req, res) => {
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading directory');
    }

    // Generate an HTML list of files with links.
    const fileList = files.map((file) => {
      return `<li><a href="/${file}" target="_blank">${file}</a></li>`;
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Directory Browser</title>
      </head>
      <body>
        <h1>Directory Browser</h1>
        <ul>${fileList.join('')}</ul>
      </body>
      </html>
    `;

    res.send(html);
  });
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
