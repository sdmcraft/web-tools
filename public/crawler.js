const urlTable = document.getElementById('urlTable');
const loadingSpinner = document.getElementById('loadingSpinner');
const crawlingCompleteMessage = document.getElementById('crawlingCompleteMessage');
const visitedUrls = new Set();
let startDomain = '';

document.getElementById('crawlerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const startUrl = document.getElementById('startUrl').value;
    if (startUrl) {
        loadingSpinner.style.display = 'block';
        crawlingCompleteMessage.style.display = 'none';
        startDomain = new URL(startUrl).hostname;
        console.log('Starting crawl process for:', startUrl);
        await crawlWithStartUrl(startUrl);
        loadingSpinner.style.display = 'none';
        crawlingCompleteMessage.style.display = 'block';
        console.log('Crawl process completed.');
    }
});

async function crawlWithStartUrl(src) {
    if (src.endsWith('/')) {
        src = src.slice(0, -1);
    }
    addUrlToTable(src);
    visitedUrls.add(src);
    updateUrlCount();
    await crawlWebsite(src);

    console.log('Crawling completed for:', src);
}

async function crawlWebsite(src) {
    const maxRetries = 3; // Maximum number of retries
    let retries = 0;

    while (retries < maxRetries) {
        try {
            if (!src.endsWith('.pdf') && !src.endsWith('docx') && !src.endsWith('mp4')) {
                const renderUrl = `/render?src=${encodeURIComponent(src)}`; // Construct the render URL with "src"
                const response = await fetch(renderUrl); // Make a request to the /render endpoint
                const html = await response.text();

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const links = Array.from(doc.querySelectorAll('a')).map(element => element.getAttribute('href'));

                for (const link of links) {
                    let absoluteUrl = new URL(link, src).href;
                    if (absoluteUrl.includes('#')) {
                        absoluteUrl = absoluteUrl.split('#')[0]; // Strip anchor portion
                    }
                    if (absoluteUrl.endsWith('/')) {
                        absoluteUrl = absoluteUrl.slice(0, -1);
                    }
                    if (!visitedUrls.has(absoluteUrl) && new URL(absoluteUrl).hostname === startDomain) {
                        addUrlToTable(absoluteUrl);
                        visitedUrls.add(absoluteUrl);
                        updateUrlCount();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await crawlWebsite(absoluteUrl);
                    } else {
                        console.log('Skipping:', absoluteUrl);
                    }
                }
            }
            break; // Exit the retry loop if successful
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

function addUrlToTable(url) {
    const row = urlTable.insertRow();
    const cell = row.insertCell(0);
    cell.textContent = url;
}

function updateUrlCount() {
    const urlCountElement = document.getElementById('urlCount');
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

console.log('Crawler script loaded.');
    