import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import { URL } from 'url';

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
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.goto(srcUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }); // 30 seconds timeout

      // You can adjust the waiting time based on your needs
      await page.waitForTimeout(2000);

      // Remove all script tags
      await page.evaluate(() => {
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => script.remove());
      });

      const content = await page.content();
      await browser.close();

      // Replace attributes with absolute URLs
      const domain = new URL(srcUrl).origin;
      const modifiedContent = await replaceAttributesWithAbsoluteUrls(content, domain);

      return modifiedContent;
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed: ${error.message}`);
      retries++;
    }
  }

  console.error(`Max retries reached. Unable to render the page.`);
  throw new Error('Navigation timeout');
}

async function render(req, res) {
  const srcUrl = req.query.src;
  if(srcUrl.endsWith('.html')) {
    const response = renderPage(srcUrl);
    res.setHeader('Content-Type', 'text/html');
    res.send(response);
  } else {
    const response = await fetch(srcUrl);
    // Get the content type from the response headers
    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType);

    const responseData = await response.text();
    res.send(responseData);
  }
}

export default render;
