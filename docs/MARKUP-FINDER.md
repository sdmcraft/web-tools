# Markup Finder Tool

## Introduction
For finding elements in web pages using CSS selectors.

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
5. Open `http://localhost:3001/finder/finder.html` in your browser.
6. Provide inputs and click on `Filter URLS` button
![Local Image](images/markup-finder.png)
