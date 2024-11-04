import { fetchProxy } from './utils.js';

export async function fetchUrls(indexUrl, responseParser = franklinIndexParser) {
    const content = await fetchProxy(indexUrl);
    // console.log('here is the content' +  JSON.stringify(content.data, null, 2));
    const urls = responseParser(content, indexUrl);
    return urls;
}

export function franklinIndexParser(content, indexUrl) {
    if (!content.contentType.includes('application/json')) {
        throw new Error('Content is not JSON');
    }
    const json = JSON.parse(content.text);
    const origin = new URL(indexUrl).origin;
    return json.data.map((child) => origin + child.path);
}

export function sitemapParser(content) {
    if (!content.contentType.includes('application/xml')) {
        throw new Error('Content is not xml');
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content.text, "application/xml");

    // Extract all <loc> elements (URLs)
    const urls = Array.from(xmlDoc.getElementsByTagName("loc")).map(loc => loc.textContent);
    return urls;
}