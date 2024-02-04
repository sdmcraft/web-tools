import cheerio from 'cheerio';
import { fetchUrl } from './fetcher.js';

export default async function find(srcUrl, selector) {
    console.log(`Finding ${selector} in ${srcUrl}`);
    const result = await fetchUrl(srcUrl);
    if (!result.contentType.includes('text/html')) {
        return false;
    } else if (selector.startsWith('"') && selector.endsWith('"')) {
        const searchText = selector.substring(1, selector.length - 1);
        return result.responseData.includes(searchText);
    } else {
        const $ = cheerio.load(result.responseData);
        const elements = $(selector);
        return elements && elements.length > 0;
    }
}
