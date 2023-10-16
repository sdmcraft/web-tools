import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import { URL } from 'url';
import fetch from "node-fetch";

async function replaceAttributesWithAbsoluteUrls(content, domain) {
  const $ = cheerio.load(content);

  $('*').each((_, element) => {
    Object.keys(element.attribs).forEach(attrName => {
      let attrValue = element.attribs[attrName];

      // Replace attributes with absolute URLs
      if (attrValue.startsWith('/')) {
        attrValue = `${domain}${attrValue}`;
      } else if (attrValue.startsWith('./')) {
        attrValue = `${domain}${attrValue.slice(1)}`;
      }

      element.attribs[attrName] = attrValue;
    });
  });

  return $.html();
}

async function renderPage(srcUrl) {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    const browser = await puppeteer.launch();
    try {
      const page = await browser.newPage();

      const response = await page.goto(srcUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }); // 30 seconds timeout
      //console.log(`Status code: ${response.status()} for ${srcUrl}`);

      // You can adjust the waiting time based on your needs
      await page.waitForTimeout(2000);

      // Remove all script tags
      await page.evaluate(() => {
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => script.remove());
      });

      const content = await page.content();

      // Replace attributes with absolute URLs
      const domain = new URL(srcUrl).origin;
      const modifiedContent = await replaceAttributesWithAbsoluteUrls(content, domain);

      return modifiedContent;
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed: ${error.message}`);
      retries++;
    } finally {
      await browser.close();
    }
  }

  console.error(`Max retries reached. Unable to render the page.`);
  throw new Error('Navigation timeout');
}

async function render(req, res) {
  debugger;
  const srcUrl = req.query.src;
  try {
    const response = await fetch(srcUrl, {
      method: 'GET',
      redirect: 'manual',
    });
    let responseData = await response.text();
    const contentType = response.headers.get('content-type');
    if (response.status >= 300 && response.status < 400) {
      res.setHeader('Content-Type', 'text/html');
      const locationHeader = [...response.headers.entries()].find(([key, value]) => key.toLowerCase().trim() === 'location');
      if (locationHeader && locationHeader[1]) {
        res.setHeader('redirect-location', locationHeader[1]);
      }
      res.status(response.status).send(responseData);
      return;
    }
    if (contentType && contentType.trim().toLowerCase().includes('text/html')) {
      responseData = await renderPage(srcUrl);
    } else {
      responseData = await response.text();
    }
    res.send(responseData);

  } catch (error) {
    console.error('Error rendering page:', error);
    res.status(500).json({ error: 'Error rendering page.' });
  }
}

export default render;
