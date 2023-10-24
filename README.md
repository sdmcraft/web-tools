# web-tools
A collection of handy tools to aid website development.

# How to use
## Option 1: Docker
1. Install [Docker](https://docs.docker.com/get-docker/)
2. Run `docker run -p 3001:3001 -d --name web-tools satyadeepm/web-tools:latest`
3. Open `http://localhost:3001/home.html` in your browser.

That's it! :tada:

## A note about Crawler
If you are running `web-tools` on Amazon Linux 2023, install the dependencies before for `puppeteer`
```
sudo yum install libXcomposite libXdamage libXrandr libgbm libxkbcommon pango alsa-lib atk at-spi2-atk cups-libs libdrm
```
Thanks a ton to this [youtube video](https://www.youtube.com/watch?v=pdpzrv1H2RM&ab_channel=legendsmnd) for this.