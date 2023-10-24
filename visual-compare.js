import { chromium } from 'playwright';
import { getComparator } from 'playwright-core/lib/utils';
import { writeFile } from 'fs/promises';
import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';

const jobCache = new NodeCache({ useClones: false });


function getScreenshotPath(jobId, testPath, suffix) {
    const title = testPath.replace(/[/]/g, '-');
    return `public/screenshots/${jobId}/${(title.toLowerCase())}-${suffix}.png`;
}

/**
 * Wait for all images on document to be loaded.
 *
 * @param page {page}
 * @param timeout {number}: how many milliseconds to wait until reject and cancel the execution.
 * @param tickrate {number}: how many milliseconds to wait until recheck all images again.
 * @returns {Promise}
 *   A promise which resolve when all img on document gets fetched.
 *   The promise get rejected if it reach the @timeout time to execute.
 *
 *  Based on https://stackoverflow.com/a/51652947/79461
 */
async function allImagesLoaded(page, timeout = 15 * 1000, tickrate = 250) {
    const images = await page.locator('img').all();
    const startTime = new Date().getTime();

    return new Promise((resolve, reject) => {

        function checkImages() {
            const currentTime = new Date().getTime();

            if (currentTime - startTime > timeout) {
                reject({
                    message: `CheckImgReadyTimeoutException: images taking to loong to load.`
                });
            }

            if (images.every(img => img.evaluate(el => el.complete))) {
                resolve(images);
            } else {
                setTimeout(checkImages, tickrate);
            }
        }

        checkImages();
    });
}

async function loadAndScreenshot(jobId, page, url, testPath, suffix) {
    // load page and wait for network to be idle
    await page.goto(url, { waitUntil: 'networkidle' });
    // just to be sure, wait until footer is loaded
    await page.locator('footer div.footer.block[data-block-status="loaded"]').waitFor();

    // to be extra sure, also wait until all images are loaded
    await allImagesLoaded(page);

    return await page.screenshot({
        path: getScreenshotPath(jobId, testPath, suffix),
        fullPage: true
    });
}

async function compareUrls(sourceUrls, targetUrls, paths, branch, jobId) {
    const job = jobCache.get(jobId);
    if (sourceUrls.length !== targetUrls.length) {
        console.error('Source and target URL lists must have the same number of elements.');
        job.status = 'error';
        return;
    }
    job.status = 'in-progress';
    for (let i = 0; i < sourceUrls.length; i++) {
        try {
            const sourceUrl = sourceUrls[i];
            const targetUrl = targetUrls[i];
            const testPath = paths[i];

            job.results.push(`Comparing URLs: ${sourceUrl} and ${targetUrl}`);

            const browser = await chromium.launch();

            const page1 = await browser.newPage();
            const beforeImage = await loadAndScreenshot(jobId, page1, sourceUrl, testPath, MAIN);

            const page2 = await browser.newPage();
            const afterImage = await loadAndScreenshot(jobId, page2, targetUrl, testPath, branch);

            await browser.close();

            const comparator = getComparator('image/png');
            const result = comparator(beforeImage, afterImage, {
                maxDiffPixelRatio: 0.01,
            });
            if (result && result.errorMessage) {
                await writeFile(getScreenshotPath(jobId, testPath, 'diff'), result.diff);
                job.results.push(`Screenshots for URLs ${sourceUrl} and ${targetUrl} are different.`);
            }
        } catch (error) {
            job.results.push(`Error comparing URLs: ${sourceUrls[i]} and ${targetUrls[i]}`);
        }
    }
    job.status = 'complete';
    job.results.push(`Browse screenshots at /screenshots/${jobId}`);
}

const MAIN = 'main';

export function compare(paths, domain, branch) {
    debugger;
    const jobId = uuidv4();
    const job = {
        id: jobId,
        status: 'pending',
        results: [],
    };
    jobCache.set(jobId, job);

    const sourceUrls = [];
    const targetUrls = [];
    const branchDomain = domain.replace(MAIN, branch);
    paths.forEach((path) => {
        sourceUrls.push(`${domain}${path}`);
        targetUrls.push(`${branchDomain}${path}`);
    });

    compareUrls(sourceUrls, targetUrls, paths, branch, jobId);
    return jobId;
}

export function status(jobId) {
    const job = jobCache.get(jobId);
    return job;
}

