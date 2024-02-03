# Tool to find LHS for all indexed pages in a site

## Introduction
For computing the LHS score for specified list of URLs and do a comparison with the LCP score for the same URLs from another domain.

### How to use
1. Install [Docker](https://docs.docker.com/get-docker/)
2. Run `docker run -p 3001:3001 -e psikey=<optional-psi-key> satyadeepm/web-tools:latest`
3. OR if you don't want to use Docker, just synch this repository and execute the following:
    ```
    $ npm i
    $ npx playwright install
    $ npx playwright install-deps
    $ export port=<optional-port>; export psikey=<optional-psi-key>;node src/app.js
    ```
5. Open `http://localhost:3001/lhs/lhs.html` in your browser.
6. Provide site index URL (for e.g. `https://main--sunstar--hlxsites.hlx.live/query-index.json`) and click on `Load LHS Scorecard` button
![Local Image](images/site-lhs.png)
