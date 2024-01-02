document.getElementById('submit').addEventListener('click', submitRequest);
function submitRequest() {
    // Get user input
    var userInput = document.getElementById('userInput').value;

    // Make an API call (Using JSONPlaceholder as an example)
    fetch(`/franklin/url-list?indexUrl=${encodeURI(userInput)}`)
        .then(response => response.json())
        .then(data => displayResults(data))
        .catch(error => console.error('Error:', error));
}

function displayResults(results) {
    var resultList = document.getElementById('result-list');
    resultList.innerHTML = ''; // Clear previous results

    if (results.length === 0) {
        resultList.innerHTML = '<li>No results found.</li>';
    } else {
        results.forEach(function (result) {
            var listItem = document.createElement('li');
            listItem.textContent = result;
            resultList.appendChild(listItem);
        });
    }
}
