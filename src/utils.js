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

// A function to get the final URL after following redirects
export async function getFinalUrl(inputUrl) {
  try {
    const response = await fetch(inputUrl, { redirect: 'follow' });

    if (response.ok) {
      // If the response is successful, return the final URL
      return response.url;
    } else {
      console.error('Request failed with status:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error during fetch:', error);
    return null;
  }
}