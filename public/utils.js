const cachedResponses = {};

export async function fetchProxy(url) {
  if (cachedResponses[url]) {
    return cachedResponses[url];
  }

  const renderUrl = `/render?src=${encodeURIComponent(url)}`;
  const response = await fetch(renderUrl);
  cachedResponses[url] = response;
  return response;
}

export async function fetchHtml(url) {
  const response = await fetchProxy(url);
  const html = await response.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc;
}
