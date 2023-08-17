import { parseURL } from "./common-utils.js";

const form = document.getElementById("url-form");
const urlInput = document.getElementById("url-input");
const tableBody = document.getElementById("table-body");

async function fetchData(url) {
    try {
        const urlData = parseURL(url);
        const adminApi = `https://admin.hlx.page/status/${urlData.org}/${urlData.repo}/${urlData.branch}/${urlData.path}?editUrl=auto`;
        const response = await fetch(adminApi);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching data for URL ${url}:`, error);
        return null;
    }
}

async function updateTable(urls) {
    for (const url of urls) {
        const data = await fetchData(url);
        if (data) {
            const newRow = document.createElement("tr");
            newRow.innerHTML = `
      <td>${url}</td>
      <td>${data.edit.lastModified}</td>
      <td>${data.preview.lastModified}</td>
      <td>${data.live.lastModified}</td>
      <td class="status-icon">${getStatusIcon(
                data.edit.lastModified,
                data.preview.lastModified,
                data.live.lastModified
            )}</td>
    `;
            tableBody.appendChild(newRow);
        }
    }
}

function getStatusIcon(editDate, previewDate, liveDate) {
    const editModified = new Date(editDate);
    const previewModified = new Date(previewDate);
    const liveModified = new Date(liveDate);

    if (editModified < previewModified && previewModified < liveModified) {
        return '<span class="green">&#10004;</span>';
    } else {
        return '<span class="orange">&#9888;</span>';
    }
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const urls = urlInput.value.split('\n').map(url => url.trim()).filter(url => url !== '');
    updateTable(urls);
});
