# web-tools
A collection of handy tools to aid website development.

## LSR Bookmarklet
```
javascript: (() => {
    const origin = window.prompt('Origin');
    const omitFolders = window.prompt('Comma seperated list of folders to omit');
    const action = window.prompt('For Preview type 1 and for Publish type 2');
    if (origin && action) {
        window.domainPrefix = origin;
        window.omitFolders = omitFolders;
        window.action = action;
        const script = document.createElement('script');
        script.src = 'http://18.207.211.159:3000/lsr.js';
        document.head.append(script);
    }
})();
```