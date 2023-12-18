import { fetchUrls, franklinIndexParser } from './utils.js';
import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';
import psi from 'psi';

const jobCache = new NodeCache();
async function computeLHSWithRetry(url, maxAttempts = 2, minScoreThreshold = 95) {
  console.log('Computing LHS with retry for:', url);

  let attempts = 0;
  let perfScore = 0;

  while (attempts < maxAttempts) {
    let testUrl = `${url}${url.includes('?') ? '&' : '?'}ck=${Math.random()}`;
    try {
      await psi(testUrl, { nokey: 'true', strategy: 'mobile' });
      const { data } = await psi(testUrl, { nokey: 'true', strategy: 'mobile' });
      perfScore = data.lighthouseResult.categories.performance.score * 100;
      attempts++;

      if (perfScore >= minScoreThreshold) {
        console.log(`Score ${perfScore} is more than or equal to threshold ${minScoreThreshold}. Stopping. Attempt ${attempts} of ${maxAttempts}`);
        break; // Stop retrying if score meets the threshold
      } else if (attempts < maxAttempts) {
        //wait for 5 seconds before retrying
        console.log(`Score ${perfScore} is less than threshold ${minScoreThreshold}. Retrying. Attempt ${attempts} of ${maxAttempts}`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (e) {
      console.error(`Error computing LHS for ${testUrl}. Attempt ${attempts} of ${maxAttempts}.`, e);
      attempts++;
    }
  }

  const result = {
    url,
    performanceScore: perfScore,
    accessibilityScore: 'NA',
    bestPracticesScore: 'NA',
  };

  console.log(JSON.stringify(result, null, 2));

  return result;
}
async function buildLHSScoreboard(queryUrl, jobId, isBulk) {
  debugger;
  const job = jobCache.get(jobId);
  let urls = [queryUrl];
  if (isBulk) {
    urls = await fetchUrls(queryUrl, franklinIndexParser);
  }

  for (const url of urls) {
    job.results.push(await computeLHSWithRetry(url));
    jobCache.set(jobId, job);
  }
  job.status = 'complete';
  jobCache.set(jobId, job);
}

export function submitLHSJob(queryUrl, isBulk = true) {
  const jobId = uuidv4();
  const job = {
    id: jobId,
    status: 'pending',
    queryUrl,
    results: [],
  };
  jobCache.set(jobId, job);
  buildLHSScoreboard(queryUrl, jobId, isBulk);
  return jobId;
}

export function getLHSJob(jobId) {
  return jobCache.get(jobId);
}