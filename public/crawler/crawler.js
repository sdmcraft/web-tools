const urlTable = document.getElementById('urlTable');
const spinnerContainer = document.getElementById('spinnerContainer');
const crawlingCompleteMessage = document.getElementById('crawlingCompleteMessage');
const urlCountElement = document.getElementById('urlCount');
const visitedUrls = new Set();
let startDomain = '';

document.getElementById('crawlerForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const startUrl = document.getElementById('startUrl').value;
  const omitPatternVal = document.getElementById('omitPatterns').value;
  let omitPatterns;
  if (omitPatternVal) {
    omitPatterns = document.getElementById('omitPatterns').value.split(',').map(pattern => pattern.trim());
  }
  if (startUrl) {
    showSpinner();
    crawlingCompleteMessage.style.display = 'none';
    startDomain = new URL(startUrl).hostname;
    console.log('Starting crawl process for:', startUrl);
    await crawlWithStartUrl(startUrl, omitPatterns);
    hideSpinner();
    crawlingCompleteMessage.style.display = 'block';
    console.log('Crawl process completed.');
  }
});

async function crawlWithStartUrl(src, omitPatterns) {
  if (src.endsWith('/')) {
    src = src.slice(0, -1);
  }

  await crawlWebsite(src, src, omitPatterns);
}

async function crawlWebsite(src, parentUrl, omitPatterns) {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {

      const renderUrl = `/render?src=${encodeURIComponent(src)}`;
      const response = await fetch(renderUrl);
      const html = await response.text();
      visitedUrls.add(src);
      updateUrlCount();
      if (response.status >= 300 && response.status < 400 && response.headers.get('redirect-location')) {

        // If the difference between the redirect URL and the original URL is just a trailing slash, ignore it
        const redirectUrl = response.headers.get('redirect-location').endsWith('/') ? response.headers.get('redirect-location').slice(0, -1) : response.headers.get('redirect-location');
        const originalUrl = src.endsWith('/') ? src.slice(0, -1) : src;

        if (redirectUrl !== originalUrl) {
          addUrlToTable(src, parentUrl, response.status, 'Redirects to ' + response.headers.get('redirect-location'));
        }
        await crawlWebsite(response.headers.get('redirect-location'), src, omitPatterns);
        return;
      }

      // If the page is not found, throw an error to retry
      if (response.status === 404 && retries < maxRetries) {
        throw new Error('404');
      }
      addUrlToTable(src, parentUrl, response.status);
      if (response.status !== 200) {
        return;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.trim().toLowerCase().includes('text/html')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const links = Array.from(doc.querySelectorAll('a')).map(element => element.getAttribute('href'));

        for (const link of links) {
          if (link) {
            let absoluteUrl = new URL(link, src).href;
            if (absoluteUrl.includes('#')) {
              absoluteUrl = absoluteUrl.split('#')[0];
            }
            if (absoluteUrl.endsWith('/')) {
              absoluteUrl = absoluteUrl.slice(0, -1);
            }
            if (!visitedUrls.has(absoluteUrl) && new URL(absoluteUrl).hostname === startDomain) {
              visitedUrls.add(absoluteUrl);
              if (!omitPatterns || !omitPatterns.some(pattern => absoluteUrl.includes(pattern))) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await crawlWebsite(absoluteUrl, src, omitPatterns);
              } else {
                console.log('Skipping (omitted pattern):', absoluteUrl);
              }
            } else {
              console.log('Skipping:', absoluteUrl);
            }
          }
        }
        break;
      } else {
        break
      }
    } catch (error) {
      retries++;
      console.error(`Error crawling ${src} (Attempt ${retries}/${maxRetries}):`, error);
      if (retries === maxRetries) {
        console.error(`Max retries reached for ${src}.`);
      } else {
        console.log(`Retrying (${retries}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

function addUrlToTable(url, parentUrl, status, note = '') {
  const row = urlTable.insertRow();

  const urlCell = row.insertCell(0);
  urlCell.textContent = url;

  const parentCell = row.insertCell(1);
  parentCell.textContent = parentUrl;

  const statusCell = row.insertCell(2);
  statusCell.textContent = status;

  const noteCell = row.insertCell(3);
  noteCell.textContent = note;

}

function updateUrlCount() {
  const rowCount = urlTable.rows.length - 1;
  urlCountElement.textContent = rowCount;
}

function sortTable(column) {
  const rows = Array.from(urlTable.rows);
  const headerRow = rows.shift();

  rows.sort((rowA, rowB) => {
    const textA = rowA.cells[column].textContent;
    const textB = rowB.cells[column].textContent;
    return textA.localeCompare(textB);
  });

  urlTable.innerHTML = '';
  urlTable.appendChild(headerRow);

  rows.forEach((row) => {
    urlTable.appendChild(row);
  });

  const headerCell = headerRow.cells[column];
  headerCell.classList.toggle('sorted');
}

function downloadCsv() {
  const rows = Array.from(urlTable.rows);
  const csvContent = [
    ['URL', 'Parent', 'Status'],
    ...rows.slice(1).map(row => [row.cells[0].textContent, row.cells[1].textContent, row.cells[2].textContent, row.cells[3].textContent])
  ]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'crawled_urls.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function showSpinner() {
  spinnerContainer.style.display = 'block';
}

function hideSpinner() {
  spinnerContainer.style.display = 'none';
}

console.log('Crawler script loaded.');
