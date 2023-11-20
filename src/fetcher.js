import NodeCache from 'node-cache';
import { chromium } from 'playwright';
import cheerio from 'cheerio';
import { URL } from 'url';
import fs from 'fs';

const resultCache = new NodeCache();
const diskCache = process.env.cache ?? 'cache.json';

import fetch from "node-fetch";

function loadCache(diskCache) {
    try {
        if (fs.existsSync(diskCache)) {
            // Read the file synchronously
            const jsonData = fs.readFileSync(diskCache, 'utf8');
            // Parse the JSON data
            const parsedData = JSON.parse(jsonData);
            Object.keys(parsedData).forEach(key => {
                resultCache.set(key, parsedData[key]['v']);
            });
        }
    } catch (error) {
        console.error(`Error reading JSON file: ${error.message}`);
        return null;
    }
}

function saveCache(diskCache) {
    if (saveNeeded) {
        try {
            // Convert the cache to JSON data
            const jsonData = JSON.stringify(resultCache.data);
            // Write the file synchronously
            fs.writeFileSync(diskCache, jsonData, 'utf8');
            saveNeeded = false;
        } catch (error) {
            console.error(`Error writing JSON file: ${error.message}`);
        }
    }
}

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
        const browser = await chromium.launch();
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


export async function fetchUrl(srcUrl) {
    if (resultCache.get(srcUrl)) {
        return resultCache.get(srcUrl);
    }
    const result = {};
    const response = await fetch(srcUrl, {
        method: 'GET',
        redirect: 'manual',
    });
    result.responseData = await response.text();
    result.contentType = response.headers.get('content-type');
    result.status = response.status;
    result.redirectLocation = null;
    if (result.status >= 300 && result.status < 400) {
        const locationHeader = [...response.headers.entries()].find(([key, value]) => key.toLowerCase().trim() === 'location');
        if (locationHeader && locationHeader[1]) {
            result.redirectLocation = locationHeader[1];
        }
        resultCache.set(srcUrl, result);
        saveNeeded = true;
        return result;
    }
    if (result.contentType && result.contentType.trim().toLowerCase().includes('text/html')) {
        result.responseData = await renderPage(srcUrl);
    }
    resultCache.set(srcUrl, result);
    saveNeeded = true;
    return result;
}

loadCache(diskCache);
let saveNeeded = false;
setInterval(() => {
    saveCache(diskCache);
}, 60000);