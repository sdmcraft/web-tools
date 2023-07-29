export function convertJSONToCSV(data) {
  const separator = ',';
  const keys = Object.keys(data[0]);
  const csvContent = [keys.join(separator)];

  data.forEach((item) => {
    const values = keys.map((key) => {
      const value = item[key];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvContent.push(values.join(separator));
  });

  return csvContent.join('\n');
}


// Sample CSV data in a JavaScript array
const csvData = [
  ["https://example.com/page1", 85, 90, 80, 85],
  ["https://example.com/page2", 75, 95, 70, 80],
  ["https://example.com/page3", 90, 85, 75, 90],
  // Add more rows as needed
];

const tableBody = document.getElementById("csvBody");

function displayCSVData() {
  let tableRows = "";

  for (const row of csvData) {
    tableRows += `<tr>
        <td>${row[0]}</td>
        <td>${row[1]}</td>
        <td>${row[2]}</td>
        <td>${row[3]}</td>
        <td>${row[4]}</td>
      </tr>`;
  }

  tableBody.innerHTML = tableRows;
}

function sortTable(columnIndex) {
  const dataType = columnIndex === 0 ? "string" : "number";
  const sortOrder = this.sortedOrder === "asc" ? 1 : -1;

  csvData.sort((a, b) => {
    const valA = dataType === "string" ? a[columnIndex].toLowerCase() : a[columnIndex];
    const valB = dataType === "string" ? b[columnIndex].toLowerCase() : b[columnIndex];

    if (valA < valB) return -sortOrder;
    if (valA > valB) return sortOrder;
    return 0;
  });

  this.sortedOrder = this.sortedOrder === "asc" ? "desc" : "asc";
  const th = document.getElementsByTagName("th")[columnIndex];
  th.className = `sorted-${this.sortedOrder}`;
  displayCSVData();
}

// Initial display of the CSV data
displayCSVData();
