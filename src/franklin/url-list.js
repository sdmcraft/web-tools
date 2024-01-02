import { fetchUrls, franklinIndexParser } from '../utils.js';
export async function getUrlList(indexUrl) {
    try {
        return fetchUrls(indexUrl, franklinIndexParser);
    } catch (error) {
        console.error('Error during fetch:', error);
        return [];
    }
}