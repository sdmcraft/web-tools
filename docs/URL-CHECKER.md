# Bulk URL Checker Tool

## Introduction
For checking HTTP response code of URLs in bulk

### How to use
1. Install [Docker](https://docs.docker.com/get-docker/)
2. Run `docker run -d -p 3001:3001 satyadeepm/web-tools:latest`
3. OR if you don't want to use Docker, just synch this repository and execute the following:
    ```
    $ npm i
    $ npx playwright install
    $ npx playwright install-deps
    $ node app.js
    ```
5. Open `http://localhost:3001/check-urls.html` in your browser.
6. Provide the list of URLs and click "Check URLs"
![Local Image](images/url-check.png)
