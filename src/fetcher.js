import NodeCache from 'node-cache';
import { chromium } from 'playwright';
import cheerio from 'cheerio';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';

const resultCache = new NodeCache();
const diskCache = process.env.cache ?? 'cache';

import fetch from "node-fetch";

function readFileIfExistsSync(folder, filename) {
    const filePath = path.join(folder, filename);

    try {
        // Check if the file exists
        if (fs.existsSync(filePath)) {
            // Read the contents of the file and return it
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return fileContent;
        } else {
            console.log(`File "${filename}" not found in "${folder}".`);
            return null;
        }
    } catch (error) {
        console.error(`Error reading file "${filename}": ${error.message}`);
        return null;
    }
}

function writeToFileSync(folder, filename, text) {
    // Create the full path by joining the folder and filename
    const filePath = path.join(folder, filename);

    try {
        // Create the folder if it doesn't exist
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
            console.log(`Folder "${folder}" created.`);
        }

        // Write the text content to the file
        fs.writeFileSync(filePath, text);
        console.log(`File "${filename}" successfully written to "${folder}".`);
    } catch (error) {
        console.error(`Error writing to file "${filename}": ${error.message}`);
    }
}


function convertUrlToFilename(url) {
    // Remove protocol and replace non-alphanumeric characters with underscores
    const filename = url.replace(/^(https?|ftp):\/\//, '').replace(/[^a-zA-Z0-9]+/g, '_');

    // Optionally, limit the length of the filename
    const maxLength = 100; // You can adjust this based on your requirements
    const truncatedFilename = filename.substring(0, maxLength);

    return truncatedFilename;
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

            await page.goto(srcUrl, { waitUntil: 'networkidle', timeout: 10000 }); // 10 seconds timeout
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
    const cachedResult = resultCache.get(convertUrlToFilename(srcUrl));
    if (cachedResult) {
        console.log(`Cache hit for ${srcUrl}`);
        return { responseData: cachedResult, contentType: 'text/html' };
    }
    const savedResult = readFileIfExistsSync(diskCache, convertUrlToFilename(srcUrl));
    if (savedResult) {
        console.log(`Disk cache hit for ${srcUrl}`);
        resultCache.set(convertUrlToFilename(srcUrl), savedResult);
        return { responseData: savedResult, contentType: 'text/html' };
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
        if (locationHeader?.[1]) {
            if (locationHeader[1].startsWith('/')) {
                result.redirectLocation = `${new URL(srcUrl).origin}${locationHeader[1]}`;
            } else {
                result.redirectLocation = locationHeader[1];
            }
        }
    }
    if (result.contentType?.trim().toLowerCase().includes('text/html')) {
        result.responseData = await renderPage(srcUrl);
        resultCache.set(convertUrlToFilename(srcUrl), result.responseData);
        writeToFileSync(diskCache, convertUrlToFilename(srcUrl), result.responseData);
    }
    return result;
}

export async function fetchRequestedUrl(req, res) {
    const srcUrl = req.query.src;
    if (!srcUrl) {
        res.status(400).send('You must provide a src URL');
        return;
    }
    const result = await fetchUrl(srcUrl);
    if (result.redirectLocation) {
        res.setHeader('redirect-location', result.redirectLocation);
    }
    res.setHeader('Content-Type', result.contentType);
    res.send(result.responseData);
}