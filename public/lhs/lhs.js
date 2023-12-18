const inputForm = document.getElementById("inputForm");
const indexUrlInput = document.getElementById("indexUrl");
const urlListInput = document.getElementById("urlList");
const tableBody = document.getElementById("scoreboardBody");

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

inputForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const indexUrl = indexUrlInput.value.trim();

  if (indexUrl) {
    await fetchLHS(indexUrl, true);
  } else if (urlListInput.value) {
    const urls = urlListInput.value.split('\n');
    for (const url of urls) {
      console.log(`Awaiting data for ${url}...`); // eslint-disable-line no-console
      await fetchLHS(url, false);
      console.log(`Data received for ${url}`); // eslint-disable-line no-console
    }
  }

  return void 0;
});

// Function to check if a URL already exists in the table
function hasUrlInTable(url) {
  const tableRows = tableBody.querySelectorAll("tr");
  for (const row of tableRows) {
    const rowUrl = row.cells[0].textContent;
    if (rowUrl === url) {
      return true;
    }
  }
  return false;
}

function appendToTable(data) {
  data.forEach(item => {
    if (!hasUrlInTable(item.url)) {
      const row = document.createElement("tr");

      const urlCell = document.createElement("td");
      urlCell.textContent = item.url;
      row.appendChild(urlCell);

      const performanceScoreCell = document.createElement("td");
      performanceScoreCell.textContent = item.performanceScore;
      row.appendChild(performanceScoreCell);

      tableBody.appendChild(row);
    }
  });
}

async function getJobStatus(jobId) {
  const response = await fetch(`/lhs/${jobId}`);
  if (response.status === 200) {
    const data = await response.json();
    return data;
  } else {
    return null;
  }
}

async function fetchLHS(url, isBulk = true) {
  const spinnerRow = document.getElementById("spinnerRow");
  spinnerRow.style.display = "table-row";

  let response = await fetch(`/lhs?queryUrl=${url}&bulk=${isBulk}`);
  let data = await response.json();
  const jobId = data.jobId;
  let jobStatus = data.status;
  while (!jobStatus || jobStatus === 'pending') {
    await wait(2000);
    data = await getJobStatus(jobId);
    jobStatus = data.status;
  }
  if (jobStatus === 'complete' && data.results && data.results.length > 0) {
    appendToTable(data.results);
  } else {
    console.error("Unexpected server response:", response);
  }
  spinnerRow.style.display = "none";
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

