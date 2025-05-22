// Function to render the miniGraph2 with the best states for the current year
function renderMiniGraph2(containerId, data, year) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    const title = document.createElement('h4');
    title.className = 'text-md font-semibold mb-1 text-center'; // Adjusted for smaller view
    title.textContent = `Top 3 Milk Producers (${year})`;
    container.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'list-none pl-0 text-sm'; // Adjusted for smaller view

    data.slice(0, 3).forEach((state, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'truncate'; // Ensure text doesn't overflow
        listItem.textContent = `${index + 1}. ${state.name} - ${state.production.toLocaleString()} gal`;
        list.appendChild(listItem);
    });

    container.appendChild(list);
}

// Function to render the detailed view with the top 50 states and year selection
function renderDetailedRanking(containerId, data, availableYears, selectedYear) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous content
    container.innerHTML = `
        <h4 class='text-xl font-semibold mb-4'>Top 50 States for Milk Production (${selectedYear})</h4>
        <div class='mb-4'>
            <label for='year-select' class='block text-sm font-medium text-gray-700'>Select Year:</label>
            <select id='year-select' class='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md'>
                ${availableYears.map(year => `<option value='${year}' ${year === selectedYear ? 'selected' : ''}>${year}</option>`).join('')}
            </select>
        </div>
        <ul class='list-decimal pl-5'>
            ${data.slice(0, 50).map((state, index) => `<li>${index + 1}. ${state.name} - ${state.production.toLocaleString()} gallons</li>`).join('')}
        </ul>
    `;

    // Add event listener for year selection
    const yearSelect = document.getElementById('year-select');
    yearSelect.addEventListener('change', (event) => {
        const newYear = event.target.value;
        const newData = getRankingDataForYear(newYear); // Fetch new data for the selected year
        renderDetailedRanking(containerId, newData, availableYears, newYear);
    });
}

// Mock function to fetch ranking data for a specific year
function getRankingDataForYear(year) {
    // Replace this with actual data fetching logic
    // This is mock data, ensure your actual data has a 'production' field that is a number
    const allStatesData = [
        { name: 'California', production: 42000000 }, { name: 'Wisconsin', production: 30000000 },
        { name: 'Idaho', production: 16000000 }, { name: 'New York', production: 15000000 },
        { name: 'Texas', production: 14000000 }, { name: 'Michigan', production: 11000000 },
        { name: 'Pennsylvania', production: 10000000 }, { name: 'Minnesota', production: 9000000 },
        { name: 'New Mexico', production: 8000000 }, { name: 'Washington', production: 7000000 },
        { name: 'Florida', production: 2500000 }, { name: 'Ohio', production: 5400000 },
        { name: 'Arizona', production: 5000000 }, { name: 'Colorado', production: 4800000 },
        { name: 'Indiana', production: 4300000 }, { name: 'Kansas', production: 3800000 },
        { name: 'Iowa', production: 5200000 }, { name: 'Vermont', production: 2700000 },
        { name: 'Oregon', production: 2600000 }, { name: 'Virginia', production: 1800000 },
        // Add more states to reach 50 for detailed view if needed
        // For testing, ensure you have at least 10 for the mini view and up to 50 for detailed
    ];
    // Simulate fetching data for a specific year - in a real app, this would filter/fetch by year
    // For now, just sort and return the same set for any year for simplicity of mock.
    return allStatesData.sort((a, b) => b.production - a.production);
}

function renderMiniGraph2(container, data, year) { // Added container param
    if (!container) return;
    container.innerHTML = ''; // Clear previous content
    const title = document.createElement('h4');
    // ... rest of the function, appending to 'container'
}

function renderDetailedRanking(container, data, availableYears, selectedYear) { // Added container param
    if (!container) return;
    container.innerHTML = ''; // Clear previous content
    // ... rest of the function, creating elements and appending to 'container'
    // ... and event listener for yearSelect should re-render within this container.
    const yearSelect = container.querySelector('#year-select'); // Ensure ID is unique if multiple instances exist or scope selector
    yearSelect.addEventListener('change', () => {
        const newYear = currentYear;
        const newData = getRankingDataForYear(newYear);
        renderDetailedRanking(container, newData, availableYears, newYear); // Recursive call to re-render in same container
    });
}

// Example usage
// renderMiniGraph2('miniGraph2-container', getRankingDataForYear(2025), 2025);
// renderDetailedRanking('detailed-ranking-container', getRankingDataForYear(2025), [2023, 2024, 2025], 2025);
