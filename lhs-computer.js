import { fetchUrls, franklinIndexParser } from './utils.js';
import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';
import psi from 'psi';

const jobCache = new NodeCache();
const MAX_TRIALS = 1;
async function computLHS(url) {
  console.log('Computing LHS for:', url);
  const perfScores = [];
  for(let i = 0; i < MAX_TRIALS; i++) {
    const { data } = await psi(url, { nokey: 'true', strategy: 'mobile' });
    perfScores.push(data.lighthouseResult.categories.performance.score * 100);
  }
  const perfScore = perfScores.reduce((a, b) => a + b, 0) / perfScores.length;
  const result = {
    url,
    performanceScore: perfScore,
    accessibilityScore: 'NA',
    bestPracticesScore: 'NA',
  };

  console.log(JSON.stringify(result, null, 2));

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
