import { BatchProcessor } from "../batch-processor.js";
import { wait } from "../utils.js";
const inputForm = document.getElementById("inputForm");
const urlListInput = document.getElementById("urlList");
const tableBody = document.getElementById("scoreboardBody");
let results = {};
let summary = {};
let compareHostname;
const SPINNER = '<i class="fa fa-cog fa-spin" style="font-size:24px"></i>';
let hostname;

const BATCH_SIZE = 2;
const jobProcessor = new BatchProcessor(BATCH_SIZE);

jobProcessor.addEventListener('stateChange', () => {
  console.log(`Processing state changed.${jobProcessor.isProcessing ? ' Processing...' : ''}`);
  if (jobProcessor.isProcessing) {
    document.getElementById("spinnerRow").style.display = "table-row";
  } else {
    document.getElementById("spinnerRow").style.display = "none";
  }
});

function reset() {
  tableBody.innerHTML = '';
  document.getElementById("processedURLs").textContent = 0;
  document.getElementById("totalURLs").textContent = 0;
  document.getElementById("performanceImprovedURLs").textContent = 0;
  document.getElementById("performanceDeclinedURLs").textContent = 0;
  document.getElementById("invalidURLs").textContent = 0;
  document.getElementById("totalGains").textContent = 0;
  document.getElementById("averageGains").textContent = 0;
  results = {};
  summary = {};
}

inputForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  reset();
  compareHostname = document.getElementById("compareDomain").value;
  const urls = urlListInput.value.split('\n');
  for (const url of urls) {
    if (url) {
      updateTable({ url });
      const urlObj = new URL(url);
      if (!hostname) {
        hostname = urlObj.hostname;
      }
      document.getElementById("totalURLs").textContent++;
      await wait(5000);
      jobProcessor.addJob(submitLHS, url);
      if (compareHostname) {
        const compareUrl = new URL(url);
        compareUrl.hostname = compareHostname;
        jobProcessor.addJob(submitLHS, compareUrl.href);
      }
    }
  }
});

// Function to check if a URL already exists in the table
function hasUrlInTable(urlStr) {
  const url = new URL(urlStr);
  const tableRows = tableBody.querySelectorAll("tr");
  for (const row of tableRows) {
    const rowUrl = new URL(row.cells[0].textContent);
    if (rowUrl.pathname === url.pathname) {
      return row;
    }
  }
  return null;
}

function updateTable(item) {
  if (item.url) {
    try {
      let row = hasUrlInTable(item.url);
      let urlCell, gaugeCell, perfScoreCell, refPerfScoreCell;
      if (!row) {
        row = document.createElement("tr");

        urlCell = document.createElement("td");
        urlCell.setAttribute("data-url", '');
        urlCell.innerHTML = SPINNER;
        row.appendChild(urlCell);

        perfScoreCell = document.createElement("td");
        perfScoreCell.setAttribute("data-perf-score", '');
        perfScoreCell.innerHTML = SPINNER;
        row.appendChild(perfScoreCell);

        refPerfScoreCell = document.createElement("td");
        refPerfScoreCell.setAttribute("data-ref-perf-score", '');
        refPerfScoreCell.innerHTML = SPINNER;
        row.appendChild(refPerfScoreCell);

        gaugeCell = document.createElement("td");
        gaugeCell.setAttribute("data-gauge", '');
        gaugeCell.innerHTML = SPINNER;
        row.appendChild(gaugeCell);

        tableBody.appendChild(row);
      } else {
        urlCell = row.querySelector("td[data-url]");
        gaugeCell = row.querySelector("td[data-gauge]");
        perfScoreCell = row.querySelector("td[data-perf-score]");
        refPerfScoreCell = row.querySelector("td[data-ref-perf-score]");
      }

      if (item.url) {
        urlCell.textContent = item.url;
        urlCell.setAttribute("data-url", item.url);
      }

      if (item.perfScore) {
        perfScoreCell.textContent = item.perfScore;
        perfScoreCell.setAttribute("data-perf-score", item.perfScore);
      }

      if (item.refPerfScore) {
        refPerfScoreCell.textContent = item.refPerfScore;
        refPerfScoreCell.setAttribute("data-ref-perf-score", item.refPerfScore);
      }

      if (isFinite(item.perfScore) && isFinite(item.refPerfScore)) {
        const diffValue = item.perfScore - item.refPerfScore;
        const gauge = document.createElement("gauge-widget");
        gauge.setAttribute("value", diffValue);
        gaugeCell.innerHTML = '';
        gaugeCell.appendChild(gauge);
      }
    } catch (e) {
      console.error(`Unable to update table for ${item.url}`, e);
    }
  } else {
    console.error("Invalid item:", item);
  }
}

function translateUrl(src) {
  const srcUrl = new URL(src);
  if (srcUrl.hostname === hostname) {
    return src;
  } else {
    srcUrl.hostname = hostname;
    return srcUrl.href;
  }
}

function updateSummary() {
  document.getElementById("processedURLs").textContent = summary['processedURLs'] || 0;
  document.getElementById("performanceImprovedURLs").textContent = summary['performanceImprovedURLs'] || 0;
  document.getElementById("performanceDeclinedURLs").textContent = summary['performanceDeclinedURLs'] || 0;
  document.getElementById("invalidURLs").textContent = summary['invalidURLs'] || 0;
  document.getElementById("totalGains").textContent = summary['totalGains'] || 0;
  document.getElementById("averageGains").textContent = summary['averageGains'] || 0;
}

function handleResult(result) {
  const perfScore = result.performanceScore;
  const resUrl = translateUrl(result.url);
  const infoObj = results[resUrl] || {};
  infoObj['url'] = resUrl;
  if (resUrl !== result.url) {
    infoObj['refPerfScore'] = perfScore;
    infoObj['refUrl'] = result.url;
  } else {
    infoObj['perfScore'] = perfScore;
    summary['processedURLs'] = (summary['processedURLs'] || 0) + 1;
  }
  if (isFinite(infoObj['perfScore']) && isFinite(infoObj['refPerfScore'])) {
    const diffValue = infoObj['perfScore'] - infoObj['refPerfScore'];
    if (diffValue >= 0) {
      summary['performanceImprovedURLs'] = (summary['performanceImprovedURLs'] || 0) + 1;
    } else if (diffValue < 0) {
      summary['performanceDeclinedURLs'] = (summary['performanceDeclinedURLs'] || 0) + 1;
    }
    summary['totalGains'] = (summary['totalGains'] || 0) + diffValue;
    summary['averageGains'] = (summary['totalGains'] / summary['processedURLs']).toFixed(2);
  } else if (infoObj['perfScore'] === 'NA' && infoObj['refPerfScore'] === 'NA') {
    summary['invalidURLs'] = (summary['invalidURLs'] || 0) + 1;
  }
  results[resUrl] = infoObj;
  updateTable(infoObj);
  updateSummary();
}

async function getJobStatus(jobId) {
  const response = await fetch(`/lhs/${jobId}`);
  if (response.status === 200) {
    const data = await response.json();
    const jobStatus = data.status;
    if (jobStatus === 'pending') {
      await wait(5000);
      jobProcessor.addJob(getJobStatus, jobId);
    } else if (jobStatus === 'complete') {
      handleResult(data.result);
    } else {
      console.error("Unexpected server response:", response);
      summary['invalidURLs'] = (summary['invalidURLs'] || 0) + 1;
    }
  } else {
    console.error("Unexpected server response:", response);
  }
}

async function submitLHS(url) {
  let response = await fetch(`/lhs?queryUrl=${url}`);
  let data = await response.json();
  const jobId = data.jobId;
  jobProcessor.addJob(getJobStatus, jobId);
}

function sortTable(columnIndex, isAscending) {
  const rows = Array.from(tableBody.querySelectorAll("tr"));
  const sortType = rows[0].querySelectorAll("td")[columnIndex].getAttribute("data-sort");

  rows.sort((a, b) => {
    const aValue = a.querySelectorAll("td")[columnIndex].textContent;
    const bValue = b.querySelectorAll("td")[columnIndex].textContent;
    if (sortType === 'url') {
      return isAscending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      return isAscending ? aValue - bValue : bValue - aValue;
    }
  });

  tableBody.innerHTML = '';
  rows.forEach(row => {
    tableBody.appendChild(row);
  });

  const sortedDirection = isAscending ? 'asc' : 'desc';
  tableBody.dataset.sorted = columnIndex;
  tableBody.dataset.sortedDirection = sortedDirection;
}

const headers = document.querySelectorAll("th[data-sort]");
headers.forEach((header, index) => {
  header.addEventListener('click', () => {
    const currentSorted = tableBody.dataset.sorted;
    const isAscending = currentSorted === String(index) && tableBody.dataset.sortedDirection !== 'asc';
    sortTable(index, isAscending);
  });
});

// Event listener for the CSV download button
const downloadButton = document.getElementById("downloadCSV");
downloadButton.addEventListener("click", () => {
  downloadCSV();
});

// Function to download the table data as a CSV file
function downloadCSV() {
  const rows = Array.from(tableBody.querySelectorAll("tr"));
  const csvContent = rows.map(row => {
    const columns = Array.from(row.querySelectorAll("td")).map(cell => cell.textContent);
    return columns.join(",");
  }).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "scoreboard.csv";
  link.click();
}

