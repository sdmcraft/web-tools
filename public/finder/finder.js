/* eslint-disable no-console */

import { fetchUrls } from "../frk-utils.js";
import { fetchHtml } from "../utils.js";

async function searchForElement(url, selector) {
    const doc = await fetchHtml(url);
    // Modify the selector and condition based on your requirements
    const matchingElements = doc.querySelectorAll(selector);
    return !!matchingElements && matchingElements.length > 0;
}

async function filterUrlsWithElement(urls, selector, resultList) {
    // eslint-disable-next-line no-restricted-syntax
    for (const url of urls) {
        // eslint-disable-next-line no-await-in-loop
        const hasElement = await searchForElement(url, selector);
        document.querySelector('#processedCount').textContent = parseInt(document.querySelector('#processedCount').textContent) + 1;
        if (hasElement) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = url;
            a.textContent = url;
            li.appendChild(a);
            resultList.appendChild(li);
            document.querySelector('#matchedCount').textContent = parseInt(document.querySelector('#matchedCount').textContent) + 1;
        }
    }
}

document.querySelector('#filterForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.target;
    const input = form.elements.desiredSelector;
    const desiredSelector = input.value;

    const frkIndexUrl = form.elements.frkIndexUrl.value;
    // Check if the "List of URLs" field has a value
    const urlListInput = form.elements.urlList;
    let urlList = [];
    if (urlListInput.value) {
        // Split the input using a regular expression to handle commas, spaces, and newlines
        urlList = urlListInput.value.split(/,|\s|\n/).map(url => url.trim()).filter(url => url !== '');
    } else {
        // If the "List of URLs" field is empty, fetch the list from the Franklin Index URL
        const frkIndexUrl = form.elements.frkIndexUrl.value;
        urlList = await fetchUrls(frkIndexUrl);
    }

    const container = document.getElementById('resultContainer');
    container.innerHTML = `
    <h2>Results</h2>
    <h3>Total Pages / Processed / Matches : ${urlList.length} / <span id=processedCount>0</span> / <span id=matchedCount>0</span> </h3>
    `;
    const spinner = document.getElementById('spinner');
    spinner.style.display = 'block';

    const resultList = document.createElement('ul');
    resultList.textContent = 'Filtered URLs:';
    container.appendChild(resultList);
    await filterUrlsWithElement(urlList, desiredSelector, resultList);
    spinner.style.display = 'none';
});
