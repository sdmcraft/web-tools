import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { fetchUrls, franklinIndexParser } from './utils.js';
import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';

const jobCache = new NodeCache();

async function computLHS(url) {
  console.log('Computing LHS for:', url);
  // Launch a headless Chrome instance
  const chrome = await launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices'], // You can add more categories here if needed
    port: chrome.port,
  };

  // Run Lighthouse
  const report = await lighthouse(url, options);

  const result = {
    url,
    performanceScore: report.lhr.categories.performance.score * 100,
    accessibilityScore: report.lhr.categories.accessibility.score * 100,
    bestPracticesScore: report.lhr.categories['best-practices'].score * 100,
  };

  console.log(JSON.stringify(result, null, 2));

  // Close the Chrome instance
  await chrome.kill();
  return result;
}

async function buildLHSScoreboard(queryUrl, jobId) {
  const job = jobCache.get(jobId);
  const urls = await fetchUrls(queryUrl, franklinIndexParser);
  for (const url of urls) {
    job.results.push(await computLHS(url));
    jobCache.set(jobId, job);
  }
  job.status = 'complete';
}

export function submitLHSJob(queryUrl) {
  const jobId = uuidv4();
  const job = {
    id: jobId,
    status: 'pending',
    queryUrl,
    results: [],
  };
  jobCache.set(jobId, job);
  buildLHSScoreboard(queryUrl, jobId);
  return jobId;
}

export function getLHSJob(jobId) {
  return jobCache.get(jobId);
}

// const urls = await fetchUrls('https://main--sunstar-engineering--hlxsites.hlx.live/query-index.json', franklinIndexParser);
// const results = [];
// let i = 0;
// for (const url of urls) {
//     results.push(await computLHS(url));
//     i++;
//     if (i > 5) {
//         break;
//     }
// }

// const csv = convertJSONToCSV(results);
// console.log(csv);
