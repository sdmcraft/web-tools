import { chromium } from 'playwright';
import cheerio from 'cheerio';
import NodeCache from 'node-cache';

const resultCache = new NodeCache();

async function fetchPage(url) {
    console.log(`Fetching ${url}`);
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const html = await page.content();
    await browser.close();
    return html;
}
export default async function find(srcUrl, selector) {
    console.log(`Finding ${selector} in ${srcUrl}`);
    if (!resultCache.has(srcUrl)) {
        const resp = await fetch(srcUrl);
        await resp.text();
        if (!resp.headers.get('content-type').trim().toLowerCase().includes('text/html')) {
            resultCache.set(srcUrl, {});
        } else {
            const html = await fetchPage(srcUrl);
            resultCache.set(srcUrl, { html, 'content-type': 'text/html' });
        }
    }

    const result = resultCache.get(srcUrl);
    if (result['content-type'] !== 'text/html') {
        return false;
    } else if (selector.startsWith('"') && selector.endsWith('"')) {
        const searchText = selector.substring(1, selector.length - 1);
        return result.html.includes(searchText);
    } else {
        const $ = cheerio.load(result.html);
        const elements = $(selector);
        return elements && elements.length > 0;
    }
}
