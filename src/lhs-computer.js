import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';
import psi from 'psi';
import { getFinalUrl } from './utils.js';
import { wait } from '../public/utils.js';

const PSI_KEY = process.env.psikey;

const jobCache = new NodeCache();
async function computeLHSWithRetry(url, maxAttempts = 3, minScoreThreshold = 90) {
  if (!url) {
    console.error('URL is required');
    return null;
  }
  console.log('Computing LHS with retry for:', url);
  let attempts = 0;
  let perfScore = 0;
  let testUrl = await getFinalUrl(url);
  if (testUrl) {
    testUrl = `${testUrl}${testUrl.includes('?') ? '&' : '?'}ck=${Math.random()}`;
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Computing LHS for ${testUrl}. Attempt ${attempts} of ${maxAttempts}`);
        if (PSI_KEY) {
          await psi(testUrl, { key: PSI_KEY, strategy: 'mobile' });
        }
        else {
          await psi(testUrl, { nokey: 'true', strategy: 'mobile' });
        }

        const { data } = await psi(testUrl, { nokey: 'true', strategy: 'mobile' });
        perfScore = data.lighthouseResult.categories.performance.score * 100;

        if (perfScore >= minScoreThreshold) {
          console.log(`Score ${perfScore} is more than or equal to threshold ${minScoreThreshold}.`);
          break; // Stop retrying if score meets the threshold
        } else if (attempts < maxAttempts) {
          //wait for 5 seconds before retrying
          console.log(`Score ${perfScore} is less than threshold ${minScoreThreshold}. Retrying.`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      } catch (e) {
        console.error(`Error computing LHS for ${testUrl}`, e);
        await wait(5000);
      }
    }
  }

  const result = {
    url,
    performanceScore: perfScore ? perfScore.toFixed(2) : 'NA',
    accessibilityScore: 'NA',
    bestPracticesScore: 'NA',
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}
async function buildLHSScoreboard(queryUrl, jobId, wainInterval = 5000) {
  while (jobsInProcess().length > 5) {
    console.log(`Too many jobs in process. Waiting for ${wainInterval} ms.`);
    await wait(wainInterval);
  }

  const job = jobCache.get(jobId);
  job.status = 'processing';
  jobCache.set(jobId, job);
  const result = await computeLHSWithRetry(queryUrl);
  job.result = result ?? {};
  job.status = 'complete';
  jobCache.set(jobId, job);
}

function jobsInProcess() {
  return jobCache.keys().filter((key) => jobCache.get(key).status === 'processing');
}

export function submitLHSJob(queryUrl) {
  const jobId = uuidv4();
  const job = {
    id: jobId,
    status: 'pending',
    queryUrl,
  };
  jobCache.set(jobId, job);
  buildLHSScoreboard(queryUrl, jobId);
  return jobId;
}

export function getLHSJob(jobId) {
  return jobCache.get(jobId);
}