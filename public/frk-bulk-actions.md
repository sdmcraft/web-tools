## Franklin Bulk-actions Bookmarklet
```
javascript: (() => {
    const origin = window.prompt('Provide origin (for e.g. https://main--sunstar-engineering--hlxsites.hlx.page)');
    const omitFolders = '_drafts';
    const action = window.prompt('Type 0 for Url List\nType 1 for bulk preview\nType 2 for bulk publish');
    if (origin && action) {
        window.domainPrefix = origin;
        window.omitFolders = omitFolders;
        window.action = action;
        const script = document.createElement('script');
        script.src = 'https://master-sacred-dove.ngrok-free.app/frk-bulk-actions.js';
        document.head.append(script);
    }
})();
```