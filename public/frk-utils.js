import { fetchProxy } from './utils.js';

export async function fetchUrls(indexUrl, responseParser = franklinIndexParser) {
    const content = await fetchProxy(indexUrl);
    if(!content.contentType.includes('application/json')) {
        throw new Error('Content is not JSON');
    }
    const json = JSON.parse(content.text);
    // console.log('here is the content' +  JSON.stringify(content.data, null, 2));
    const urls = responseParser(json, indexUrl);
    return urls;
}

export function franklinIndexParser(content, indexUrl) {
    const origin = new URL(indexUrl).origin;
    return content.data.map((child) => origin + child.path);
}