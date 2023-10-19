const { crawlWithStartUrl, crawlWebsite } = require('./crawlingLogic');
const {
  addUrlToTable,
  updateUrlCount,
  showSpinner,
  hideSpinner,
  initHtmlHandling,
  finalizeHtmlHandling,
} = require('./htmlHandling');

document.getElementById('crawlerForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const startUrl = document.getElementById('startUrl').value;
  const omitPatternVal = document.getElementById('omitPatterns').value;
  let omitPatterns;
  if (omitPatternVal) {
    omitPatterns = document.getElementById('omitPatterns').value.split(',').map(pattern => pattern.trim());
  }
  if (startUrl) {
    initHtmlHandling(startUrl, omitPatterns);
    await crawlWithStartUrl(startUrl, omitPatterns);
    finalizeHtmlHandling();
  }
});

// Rest of your main script
console.log('Crawler script loaded.');
