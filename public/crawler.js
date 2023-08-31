const urlTable = document.getElementById('urlTable');
const spinnerContainer = document.getElementById('spinnerContainer');
const crawlingCompleteMessage = document.getElementById('crawlingCompleteMessage');
const urlCountElement = document.getElementById('urlCount');
const visitedUrls = new Set();
let startDomain = '';

document.getElementById('crawlerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const startUrl = document.getElementById('startUrl').value;
    if (startUrl) {
        showSpinner();
        crawlingCompleteMessage.style.display = 'none';
        startDomain = new URL(startUrl).hostname;
        console.log('Starting crawl process for:', startUrl);
        await crawlWithStartUrl(startUrl);
        hideSpinner();
        crawlingCompleteMessage.style.display = 'block';
        console.log('Crawl process completed.');
    }
});

async function crawlWithStartUrl(src) {
    if (src.endsWith('/')) {
        src = src.slice(0, -1);
    }
    addUrlToTable(src, '');
    visitedUrls.add(src);
    updateUrlCount();
    await crawlWebsite(src, src); // Pass the parent URL as well

    console.log('Crawling completed for:', src);
}

async function crawlWebsite(src, parentUrl) {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            if (!src.endsWith('.pdf') && !src.endsWith('docx') && !src.endsWith('mp4')) {
                const renderUrl = `/render?src=${encodeURIComponent(src)}`;
                const response = await fetch(renderUrl);
                const html = await response.text();

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const links = Array.from(doc.querySelectorAll('a')).map(element => element.getAttribute('href'));

                for (const link of links) {
                    if (link) {
                        let absoluteUrl = new URL(link, src).href;
                        if (absoluteUrl.includes('#')) {
                            absoluteUrl = absoluteUrl.split('#')[0]; // Strip anchor portion
                        }
                        if (absoluteUrl.endsWith('/')) {
                            absoluteUrl = absoluteUrl.slice(0, -1);
                        }
                        if (!visitedUrls.has(absoluteUrl) && new URL(absoluteUrl).hostname === startDomain) {
                            addUrlToTable(absoluteUrl, parentUrl);
                            visitedUrls.add(absoluteUrl);
                            updateUrlCount();
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            await crawlWebsite(absoluteUrl, src); // Pass the parent URL
                        } else {
                            console.log('Skipping:', absoluteUrl);
                        }
                    }
                }
            }
            break;
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

function addUrlToTable(url, parentUrl) {
    const row = urlTable.insertRow();

    const urlCell = row.insertCell(0);
    urlCell.textContent = url;

    const parentCell = row.insertCell(1);
    parentCell.textContent = parentUrl;
}

function updateUrlCount() {
    const rowCount = urlTable.rows.length - 1; // Exclude header row
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
        ['URL', 'Parent'], // CSV header
        ...rows.slice(1).map(row => [row.cells[0].textContent, row.cells[1].textContent])
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
