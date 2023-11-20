export async function fetchUrls(indexUrl, responseParser) {
  const response = await fetch(indexUrl);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const content = await response.json();
  // console.log('here is the content' +  JSON.stringify(content.data, null, 2));
  const urls = responseParser(content, indexUrl);
  return urls;
}

export function franklinIndexParser(content, indexUrl) {
  const origin = new URL(indexUrl).origin;
  return content.data.map((child) => origin + child.path);
}