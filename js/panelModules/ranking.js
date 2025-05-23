// Function to render the miniGraph2 with the best states for the current year
function renderMiniGraph2(containerId, data, year) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    const title = document.createElement('h4');
    title.className = 'text-lg font-semibold mb-4 text-center text-gray-600'; // Made title a bit larger and playful color
    title.textContent = `Last Year's Best Producers (${year})`; // Updated title text
    container.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'list-none pl-0 text-center'; // Added text-center to center list items if container is wider

    data.slice(0, 5).forEach((state, index) => {
        const listItem = document.createElement('li');
        let itemClasses = 'text-lg truncate py-1'; // Base classes: bigger font, truncate, padding
        let prefix = '';

        switch (index) {
            case 0: // Top 1
                itemClasses += ' text-yellow-500 font-bold';
                prefix = '🥇 ';
                break;
            case 1: // Top 2
                itemClasses += ' text-slate-400 font-bold';
                prefix = '🥈 ';
                break;
            case 2: // Top 3
                itemClasses += ' text-orange-500 font-bold';
                prefix = '🥉 ';
                break;
            default: // Ranks 4 and 5
                itemClasses += ' text-gray-700';
                prefix = `${index + 1}. `;
                break;
        }
        listItem.className = itemClasses;
        // Prepend emoji or number based on rank
        listItem.textContent = `${prefix}${state.name} - ${state.production.toLocaleString()} gal`;
        list.appendChild(listItem);
    });

    container.appendChild(list);
}

// Function to render the detailed view with the top states and year selection
function renderDetailedRanking(containerId, data, availableYears, selectedYear) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous content
    container.innerHTML = `
        <h4 class='text-xl font-semibold mb-4'>Top States for Milk Production (${selectedYear})</h4> 
        <div class='mb-4'>
            <label for='year-select' class='block text-sm font-medium text-gray-700'>Select Year:</label>
            <select id='year-select' class='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md'>
                ${availableYears.map(year => `<option value='${year}' ${year === selectedYear ? 'selected' : ''}>${year}</option>`).join('')}
            </select>
        </div>
        <ul class='list-decimal pl-5'>
            ${data.map((state, index) => `<li>${index + 1}. ${state.name} - ${state.production.toLocaleString()} gallons</li>`).join('')} {/* Changed from data.slice(0, 50) */}
        </ul>
    `;

    // Add event listener for year selection
    const yearSelect = document.getElementById('year-select');
    yearSelect.addEventListener('change', (event) => {
        const newYear = event.target.value;
        // It's important that state_milk_production is available globally here, or passed appropriately
        const newData = getRankingDataForYear(newYear); 
        // Assuming availableYears remains relevant or is updated by the calling context if years change dynamically
        renderDetailedRanking(containerId, newData, availableYears, newYear);
    });
}

// Function to fetch and process ranking data for a specific year from state_milk_production
function getRankingDataForYear(year) {
    // Ensure state_milk_production is loaded and available (declared globally in load_datasets.js)
    if (typeof state_milk_production === 'undefined' || state_milk_production.length === 0) {
        console.error("state_milk_production is not available or empty. Ensure load_datasets.js has run and populated it.");
        return []; // Return empty array if data is not available
    }

    const numericYear = parseInt(year); // Ensure year is treated as a number for comparison

    // Filter data for the given year
    const yearlyData = state_milk_production.filter(d => d.year === numericYear);

    // Transform data to the required format { name, production } and sort
    const rankedData = yearlyData.map(d => ({
        name: d.state,
        production: d.milk_produced  // This is already a number from load_datasets.js
    })).sort((a, b) => b.production - a.production); // Sort by production descending

    return rankedData;
}

// Example usage (ensure this is updated in your main logic to pass the "previous year")
// For example, if current operational year is 2025, previous year is 2024:
// const previousYear = 2024; 
// const allYearsData = Array.from(new Set(state_milk_production.map(d => d.year))).sort((a,b) => b-a);
// renderMiniGraph2('miniGraph2-container', getRankingDataForYear(previousYear), previousYear);
// renderDetailedRanking('detailed-ranking-container', getRankingDataForYear(previousYear), allYearsData, previousYear);
