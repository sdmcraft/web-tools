document.addEventListener("DOMContentLoaded", function () {
    let jobId; // Variable to store the jobId

    const form = document.getElementById("compareForm");
    const results = document.getElementById("results");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const pathTextarea = document.getElementById("path");
        const path = pathTextarea.value.split('\n').map(line => line.trim());
        const domain = document.getElementById("domain").value;
        const branch = document.getElementById("branch").value;

        try {
            const response = await fetch("/visual-compare", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ path, domain, branch }),
            });

            if (response.status === 202) {
                const jsonResponse = await response.json();
                jobId = jsonResponse.job_id; // Store the jobId
                results.innerHTML = "Job started. Polling for status...";
                pollStatus(jobId);
            } else {
                results.innerHTML = "Error starting job.";
            }
        } catch (error) {
            console.error(error);
            results.innerHTML = "Error starting job.";
        }
    });

    async function pollStatus(jobId) {
        const statusResponse = await fetch(`/visual-compare-status?jobId=${jobId}`);
        const job = await statusResponse.json();
        results.innerHTML = "";
        job.results.forEach(result => {
            results.innerHTML += result + "<br>";
            if(job.status === 'complete' && result.includes('Browse screenshots')) {
                results.innerHTML += `<a href="/screenshots/${jobId}" target="_blank">Browse screenshots here</a><br>`;
            }
        });
        if (job.status === 'complete' || job.status === 'error') {
            spinner.style.display = "none";
            return;
        } else if (statusResponse.status === 200) {
            spinner.style.display = "block";
            setTimeout(() => pollStatus(jobId), 5000); // Poll every 5 seconds
        }
    }
});
