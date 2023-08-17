export function parseURL(url) {
    const regex = /^https:\/\/([\w-]+)--([\w-]+)--([\w-]+)\.hlx\.page\/([\w\/-]+(\.\w+)?)$/;
    const matches = url.match(regex);

    if (matches) {
        const [, branch, repo, org, path, extension] = matches;
        const result = {
            branch: branch,
            repo: repo,
            org: org,
            path: path,
        };
        return result;
    } else {
        return null;
    }
}
