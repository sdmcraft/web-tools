import { chromium } from 'playwright';
import cheerio from 'cheerio';
import NodeCache from 'node-cache';

const resultCache = new NodeCache();

async function fetchPage(url) {
    console.log(`Fetching ${url}`);
    if (resultCache.has(url)) {
        return resultCache.get(url);
    }
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const html = await page.content();
    await browser.close();
    resultCache.set(url, { html, 'content-type': 'text/html' });
    return html;
}
export default async function find(srcUrl, selector) {
    console.log(`Finding ${selector} in ${srcUrl}`);
    if (resultCache.has(srcUrl)) {
        const result = resultCache.get(srcUrl);
        if (result['content-type'] !== 'text/html') {
            return false;
        } else {
            const $ = cheerio.load(result.html);
            const elements = $(selector);
            return elements && elements.length > 0;
        }
    } else {
        const resp = await fetch(srcUrl);
        await resp.text();
        if (!resp.headers.get('content-type').trim().toLowerCase().includes('text/html')) {
            resultCache.set(srcUrl, {});
            return false;
        } else {
            const html = await fetchPage(srcUrl);
            debugger;
            const $ = cheerio.load(html);
            const elements = $(selector);
            return elements && elements.length > 0;
        }
    }
}
