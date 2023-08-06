const frkActions = [ 'preview', 'live'];
let count = 0;
const MAX_COUNT = 1000;

function parseURL(url) {
  const regex = /^https:\/\/([\w-]+)--([\w-]+)--([\w-]+)\.hlx\.page\/([\w\/-]+(\.\w+)?)$/;
  const matches = url.match(regex);

  if (matches) {
    const [, branch, repo, org, path, extension] = matches;
    const result = {
      branch: branch,
      repo: repo,
      org: org,
      path: path,
    };
    return result;
  } else {
    return null;
  }
}


async function postData(url, action) {
  const json = parseURL(url);
  const postUrl = `https://admin.hlx.page/${frkActions[action - 1]}/${json.org}/${json.repo}/${json.branch}/${json.path}`;

  try {
    console.log('Posting to', postUrl);
    const response = await fetch(postUrl, { method: 'POST' });
    console.log('Response:', response.status);
  } catch (error) {
    // Handle any errors that occurred during the request
    console.error('Error:', error);
  }
}

async function traverseCurrentFolder() {
  const URLs = [];
  const [prefix] = window.location.href.split('/Shared%20Documents/');
  const usp = new URLSearchParams(window.location.search);
  const rootPath = usp.get('id').split('/Shared Documents')[1];
  const omittedItems = window.omitFolders.split(',').map(item => item.trim()) || [];
  omittedItems.push('import-report.xlsx');
  omittedItems.push('query-index.xlsx');
  omittedItems.push('_drafts');
  const action = window.action;
  const domainPrefix = window.domainPrefix.endsWith('/') ? window.domainPrefix.substring(0, window.domainPrefix.length - 1) : window.domainPrefix;

  const traverseFolder = async (path) => {
    if(count > MAX_COUNT) return;
    for (let i = 0; i < omittedItems.length; i += 1) {
      if (path.endsWith(omittedItems[i])) {
        console.log(`Skipping ${path}`);
        return;
      }
    }
    const getDirEntries = async (path, type) => {
      const apiURL = `${prefix}/_api/web/GetFolderByServerRelativeUrl('Shared%20Documents${path}')/${type}`;
      const resp = await fetch(apiURL);
      const xml = await resp.text();
      const dp = new DOMParser();
      const dom = dp.parseFromString(xml, 'text/xml');
      const entries = [...dom.querySelectorAll('ServerRelativeUrl')];
      return entries.map((e) => e.textContent.split('Shared Documents')[1]);
    }

    const getFiles = async (path) => await getDirEntries(path, 'Files');
    const getFolders = async (path) => await getDirEntries(path, 'Folders');
    const files = await getFiles(path);
    files.every((file) => {
      for (let i = 0; i < omittedItems.length; i += 1) {
        if (file.endsWith(omittedItems[i])) {
          console.log(`Skipping ${file}`);
          return true;
        }
      }
      let cleanPath = '';
      const lastDotIndex = file.lastIndexOf('.');
      if (file.endsWith('.docx')) cleanPath = (lastDotIndex !== -1 ? file.substring(0, lastDotIndex) : file).substring(rootPath.length);
      if (file.endsWith('.xlsx')) cleanPath = (lastDotIndex !== -1 ? file.substring(0, lastDotIndex) : file).substring(rootPath.length) + '.json';
      if (file.endsWith('.pdf')) cleanPath = (lastDotIndex !== -1 ? file.substring(0, lastDotIndex) : file).substring(rootPath.length) + '.pdf';
      if (file.endsWith('.svg')) cleanPath = (lastDotIndex !== -1 ? file.substring(0, lastDotIndex) : file).substring(rootPath.length) + '.svg';

      cleanPath = cleanPath.toLowerCase();
      cleanPath = cleanPath.replaceAll(' ', '-');
      cleanPath = cleanPath.replaceAll('&', '-');
      cleanPath = cleanPath.replaceAll('\'', '-');
      cleanPath = cleanPath.replaceAll('--', '-');
      cleanPath = cleanPath.replaceAll('--', '-');
      cleanPath = cleanPath.replaceAll('--', '-');
      if (cleanPath.trim() !== '') {
        count += 1;
        URLs.push(`${domainPrefix}${cleanPath}`);
      }
      return count < MAX_COUNT;

    });

    const folders = await getFolders(path);
    for (let i = 0; i < folders.length; i += 1) {
      const folder = folders[i];
      await traverseFolder(folder);
      console.log(`Collected ${URLs.length} urls`);
    }
  }
  await traverseFolder(rootPath);
  console.log(URLs.join('\n'));
  for (let i = 0; i < URLs.length; i += 1) {
    await postData(URLs[i], action);
    console.log(`Posted ${i + 1} of ${URLs.length}`);
  }
}

traverseCurrentFolder();