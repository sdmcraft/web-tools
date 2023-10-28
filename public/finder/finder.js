/* eslint-disable no-console */

import { fetchUrls } from "../frk-utils.js";

function wait(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
}

async function searchForElement(url, selector, resultList, promises) {
    try {
        const renderUrl = `/find?src=${encodeURIComponent(url)}&selector=${encodeURIComponent(selector)}`;
        const response = await fetch(renderUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const res = await response.json();
        const hasElement = res.result;
        document.querySelector('#processedCount').textContent = parseInt(document.querySelector('#processedCount').textContent) + 1;
        if (hasElement) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = url;
            a.textContent = url;
            a.target = '_blank';
            li.appendChild(a);
            resultList.appendChild(li);
            document.querySelector('#matchedCount').textContent = parseInt(document.querySelector('#matchedCount').textContent) + 1;
        }
        delete promises[url];
    } catch (error) {
        console.error(`Error searching for element on ${url}:`, error);
    }
}

async function filterUrlsWithElement(urls, selector, resultList) {
    // eslint-disable-next-line no-restricted-syntax
    const BATCH_SIZE = 10;
    let promises = {};
    for (let i = 0; i < urls.length; i++) {
        try {
            const url = urls[i];
            while (Object.keys(promises).length >= BATCH_SIZE) {
                await wait(1);
            }
            promises[url] = searchForElement(url, selector, resultList, promises);
        } catch (error) {
            console.error(`Error searching for element on ${url}:`, error);
        }
    }
}

document.querySelector('#filterForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.target;
    const input = form.elements.desiredSelector;
    const desiredSelector = input.value;
    if (!desiredSelector) {
        alert('You must enter a selector!');
        return;
    }
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
