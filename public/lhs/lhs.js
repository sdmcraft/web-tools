const inputForm = document.getElementById("inputForm");
const queryUrlInput = document.getElementById("queryUrl");
const tableBody = document.getElementById("scoreboardBody");

inputForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const csvUrl = queryUrlInput.value.trim();

  if (!csvUrl) {
    alert("Please enter a valid CSV URL.");
    return;
  }

  await startPollingForData(csvUrl);
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

async function startPollingForData(url) {
  const response = await fetch(`/lhs?queryUrl=${url}`);
  if (response.status === 202) {
    const data = await response.json();
    const jobId = data.jobId;
    setTimeout(() => {
      pollForData(jobId)
    }, 2000); // Poll every 2 seconds
  } else if (response.status === 200) {
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      appendToTable(data.results);
    }
  } else {
    console.error("Unexpected server response:", response);
    alert("Error fetching LHS Scoreboard. Please check the URL and try again.");
  }
}

async function pollForData(jobId) {
  if (!jobId) {
    return;
  }

  const spinnerRow = document.getElementById("spinnerRow");
  spinnerRow.style.display = "table-row";

  const response = await fetch(`/lhs/${jobId}`);
  if (response.status === 200) {
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      appendToTable(data.results);
    }
    if (data.status === 'pending') {
      setTimeout(() => {
        pollForData(jobId)
      }, 2000);
    } else if (data.status === 'completed') {
      console.log('job completed');
      spinnerRow.style.display = "none";
    } else {
      console.error("Unexpected server response:", response);
      alert("Error fetching CSV data. Please check the URL and try again.");
    }
  }
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

