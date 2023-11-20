import fs from 'fs';

function readUrlsFromFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const urls = fileContent.split('\n').map(url => url.trim());
    return urls.filter(Boolean); // Remove empty lines
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    return [];
  }
}

async function makeHttpRequest(url) {
  try {
    const response = await fetch(url);
    if(response.status !== 200) {
        console.log(`URL: ${url} - Response Code: ${response.status}`);
    }
  } catch (error) {
    console.error(`URL: ${url} - Error: ${error.message}`);
  }
}

// Example usage
const filePath = '/Users/satyam/Desktop/urls.txt';
const urls = readUrlsFromFile(filePath);

if (urls.length > 0) {
  urls.forEach(async (url) => {
    if(url.indexOf('jp/healthy-thinking') === -1) {
        await makeHttpRequest(url);
    }
  });
} else {
  console.log('No valid URLs found in the file.');
}
