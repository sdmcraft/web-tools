const purgeCacheBtn = document.getElementById('purge-cache-btn');

purgeCacheBtn.addEventListener('click', async () => {
	const org = document.getElementById('org-input').value;
	const repo = document.getElementById('repo-input').value;
	const branch = document.getElementById('branch-input').value;
	const path = document.getElementById('path-input').value;

	const purgeUrl = `https://admin.hlx.page/cache/${org}/${repo}/${branch}/${path}`;

	try {
		const response = await fetch(purgeUrl, {
			method: 'POST',
		});

		const responseStatus = response.status;
		const responseText = await response.text();

		alert(`Purge request status: ${responseStatus}\nResponse: ${responseText}`);
	} catch (error) {
		console.error('Error purging cache:', error);
		alert('An error occurred while purging the cache.');
	}
});
