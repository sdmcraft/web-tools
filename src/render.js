import { fetchUrl } from './fetcher.js';

async function render(req, res) {
  const srcUrl = req.query.src;
  try {
    const result = await fetchUrl(srcUrl);
    const { contentType, responseData, status, redirectLocation } = result;
    res.setHeader('Content-Type', contentType);
    if (status >= 300 && status < 400) {
      res.setHeader('redirect-location', redirectLocation);
      res.status(status).send(responseData);
      return;
    }
    res.send(responseData);

  } catch (error) {
    console.error('Error rendering page:', error);
    res.status(500).json({ error: 'Error rendering page.' });
  }
}

export default render;
