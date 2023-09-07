const commitForm = document.getElementById('commitForm');
const commitCountElement = document.getElementById('commitCount');

commitForm.addEventListener('submit', function(event) {
  event.preventDefault();

  const orgName = document.getElementById('orgName').value;
  const username = document.getElementById('username').value;
  const accessToken = document.getElementById('accessToken').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  // Use the organization name if provided, otherwise use the username
  const owner = orgName ? orgName : username;

  // Initialize totalCommits outside of the promise chain
  let totalCommits = 0;

  function fetchCommits(repo) {
    return fetch(`https://api.github.com/repos/${owner}/${repo.name}/commits?since=${startDate}&until=${endDate}&author=${username}&per_page=100`, {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    })
      .then(response => response.json())
      .then(commits => {
        totalCommits += commits.length;
      });
  }

  // Fetch commits for each repository in parallel
  const promises = [];

  // Fetch repositories using GitHub REST API
  fetch(`https://api.github.com/users/${owner}/repos`, {
    headers: {
      Authorization: `token ${accessToken}`,
    },
  })
    .then(response => response.json())
    .then(repos => {
      // Construct an array of promises for fetching commits
      for (const repo of repos) {
        promises.push(fetchCommits(repo));
      }

      // Wait for all promises to resolve
      return Promise.all(promises);
    })
    .then(() => {
      commitCountElement.textContent = totalCommits;
    })
    .catch(error => {
      console.error('Error fetching commits:', error);
      commitCountElement.textContent = 'Error fetching commits';
    });
});
