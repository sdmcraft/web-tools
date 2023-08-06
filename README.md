# web-tools
A collection of handy tools to aid website development.

## LSR Bookmarklet
```
javascript: (() => {
    const origin = 'https://main--sunstar-engineering--hlxsites.hlx.page';
    const omitFolders = '_drafts';
    const action = window.prompt('For Preview type 1 and for Publish type 2');
    if(document.getElementById('lsr')) {
        document.getElementById('lsr').remove();
    }
    if (origin && action) {
        window.domainPrefix = origin;
        window.omitFolders = omitFolders;
        window.action = action;
        const script = document.createElement('script');
        script.src = 'https://idyllic-bunny-7fbc51.netlify.app/lsr.js';
        script.id = 'lsr';
        document.head.append(script);
    }
})();
```