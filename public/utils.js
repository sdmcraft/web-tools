const cachedResponses = {};

export async function fetchProxy(url) {
  if (!cachedResponses[url]) {
    const renderUrl = `/render?src=${encodeURIComponent(url)}`;
    const response = await fetch(renderUrl);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    cachedResponses[url] = { text, contentType };
  }
  return cachedResponses[url];
}

export async function fetchHtml(url) {
  const content = await fetchProxy(url);
  if (!content.contentType.includes('text/html')) {
    throw new Error('Content is not HTML');
  }
  const html = content.text;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc;
}
