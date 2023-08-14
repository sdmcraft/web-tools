const inputForm = document.getElementById("inputForm");
const queryUrlInput = document.getElementById("queryUrl");
const tableBody = document.getElementById("scoreboardBody");

inputForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const csvUrl = queryUrlInput.value.trim();

  if (!csvUrl) {
    alert("Please enter a valid CSV URL.");
    return;
  }

  startPollingForData(csvUrl);
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

      // Add columns for each attribute
      const urlCell = document.createElement("td");
      urlCell.textContent = item.url;
      row.appendChild(urlCell);

      // const accessibilityScoreCell = document.createElement("td");
      // accessibilityScoreCell.textContent = item.accessibilityScore;
      // row.appendChild(accessibilityScoreCell);

      // const bestPracticesScoreCell = document.createElement("td");
      // bestPracticesScoreCell.textContent = item.bestPracticesScore;
      // row.appendChild(bestPracticesScoreCell);

      const performanceScoreCell = document.createElement("td");
      performanceScoreCell.textContent = item.performanceScore;
      row.appendChild(performanceScoreCell);

      // const totalScoreCell = document.createElement("td");
      // totalScoreCell.textContent = item.performanceScore + item.bestPracticesScore + item.accessibilityScore;
      // row.appendChild(totalScoreCell);

      // Add the row to the table body
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
    jobId = null; // Reset jobId when all data is received
  } else {
    console.error("Unexpected server response:", response);
    alert("Error fetching LHS Scoreboard. Please check the URL and try again.");
    jobId = null;
  }
}

async function pollForData(jobId) {
  if (!jobId) {
    return;
  }

  // Show the spinner while polling is ongoing
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
      }, 2000); // Poll every 2 seconds
    } else if (data.status === 'completed') {
      console.log('job completed');
      jobId = null; // Reset jobId when all data is received
      spinnerRow.style.display = "none";
    } else {
      console.error("Unexpected server response:", response);
      alert("Error fetching CSV data. Please check the URL and try again.");
      jobId = null; // Reset jobId when all data is received
    }
  }
}

function sortTable(columnIndex) {
  const rows = Array.from(tableBody.querySelectorAll("tr"));
  const isAscending = columnIndex !== tableBody.dataset.sorted || tableBody.dataset.sortedDirection === 'desc';
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

  // Append sorted rows to the table
  tableBody.innerHTML = '';
  rows.forEach(row => {
    tableBody.appendChild(row);
  });

  tableBody.dataset.sorted = columnIndex;
  tableBody.dataset.sortedDirection = isAscending ? 'asc' : 'desc';
}

const headers = tableBody.querySelectorAll("th[data-sort]");
headers.forEach((header, index) => {
  header.addEventListener('click', () => {
    sortTable(index);
  });
});