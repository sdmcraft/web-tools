# A simple mechanism to perform bulk actions on a list of URLs

## Introduction
A tool to perform bulk actions on a list of URLs. The tool can be used to perform the following actions:
1. List the URLs for all the documents in Sharepoint for a website.
2. Publish all the documents in Sharepoint for a website.
3. Preview all the documents in Sharepoint for a website.

### How to use
1. Install [Docker](https://docs.docker.com/get-docker/)
2. Run `docker run -d -p 3001:3001 -v <Download folder on host>:/usr/src/app/cache satyadeepm/web-tools:latest`
3. OR if you don't want to use Docker, just synch this repository and execute the following:
    ```
    $ npm i
    $ npx playwright install
    $ npx playwright install-deps
    $ export port=<optional-port>; export cache=<download-folder>;node src/app.js
    ```
5. Add this bookmark to your browser:
    ```
    javascript: (() => {     const origin = window.prompt('Provide origin (for e.g. https://main--sunstar-foundation--sunstar-global.hlx.page)');     const omitFolders = '_drafts';     const action = window.prompt('Type 0 for Url List\nType 1 for bulk preview\nType 2 for bulk publish');     if (origin && action) {         window.domainPrefix = origin;         window.omitFolders = omitFolders;         window.action = action;         const script = document.createElement('script');         script.src = 'http://localhost:3001/frk-bulk-actions.js';         document.head.append(script);     } })();
    ```
6. Open the Sharepoint of the website in the browser and click on the bookmark. Provide the origin and the action to perform.

7. The tool will start recursively going through the folders in Sharepoint, starting from the current folder as the root folder. The tool will show the results in the developer console of the browser.

