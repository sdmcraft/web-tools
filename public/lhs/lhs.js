import { BatchProcessor } from "../batch-processor.js";
import { wait } from "../utils.js";
const inputForm = document.getElementById("inputForm");
const urlListInput = document.getElementById("urlList");
const tableBody = document.getElementById("scoreboardBody");
const compareDomainInput = document.getElementById("compareDomain");

const BATCH_SIZE = 5;
const jobProcessor = new BatchProcessor(BATCH_SIZE);

jobProcessor.addEventListener('stateChange', () => {
  console.log(`Processing state changed.${jobProcessor.isProcessing ? ' Processing...' : ''}`);
  if (jobProcessor.isProcessing) {
    document.getElementById("spinnerRow").style.display = "table-row";
  } else {
    document.getElementById("spinnerRow").style.display = "none";
  }
});

inputForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const urls = urlListInput.value.split('\n');
  for (const url of urls) {
    jobProcessor.addJob(submitLHS, url);
    if (compareDomainInput.value) {
      const compareUrl = new URL(url);
      compareUrl.hostname = compareDomainInput.value;
      jobProcessor.addJob(submitLHS, compareUrl.href);
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

function appendToTable(item) {
  const row = hasUrlInTable(item.url);
  if (row) {
    const rowUrl = new URL(row.cells[0].textContent);
    const itemUrl = new URL(item.url);
    if (rowUrl.hostname !== itemUrl.hostname) {
      const compareCell = document.createElement("td");
      const gauge = document.createElement("gauge-widget");
      if (compareDomainInput.value === itemUrl.hostname) {
        gauge.setAttribute("value", row.cells[1].textContent - item.performanceScore);
      } else {
        gauge.setAttribute("value", item.performanceScore - row.cells[1].textContent);
      }
      compareCell.textContent = item.performanceScore;
      row.appendChild(compareCell);
      const gaugeCell = document.createElement("td");
      gaugeCell.appendChild(gauge);
      row.appendChild(gaugeCell);
    }
  } else {
    const row = document.createElement("tr");
    const urlCell = document.createElement("td");
    urlCell.textContent = item.url;
    row.appendChild(urlCell);

    const performanceScoreCell = document.createElement("td");
    performanceScoreCell.textContent = item.performanceScore;
    row.appendChild(performanceScoreCell);

    tableBody.appendChild(row);
  }

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
      appendToTable(data.result);
    } else {
      console.error("Unexpected server response:", response);
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

