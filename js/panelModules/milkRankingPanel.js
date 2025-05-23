// --- panelModules/milkRankingPanel.js ---
// Assumes ranking.js functions (getRankingDataForYear, renderMiniGraph2, renderDetailedRanking) are available
// and state_milk_production is a global variable populated by load_datasets.js
// Assumes a global variable 'currentYear' is defined and updated by the game logic.

const milkRankingPanelConfig = {
    id: 'miniGraph2Panel',
    type: 'milkProductionRanking',
    // enlargedTitle: 'Milk Production Ranking Details', // Temporarily removed to disable detailed view

    renderSmallView: (containerElement, panelId) => {
        // Ensure the container centers its content
        containerElement.style.display = 'flex';
        containerElement.style.flexDirection = 'column';
        containerElement.style.alignItems = 'center';
        // containerElement.style.justifyContent = 'center'; // Add this if vertical centering of the whole block is also desired

        if (!containerElement.id) {
            containerElement.id = `${panelId}-small-view-container`; // Ensure it has an ID
        }

        const messageWrapperStyle = "display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; flex-grow: 1;";

        if (typeof currentYear === 'undefined') {
            containerElement.innerHTML = `<div style="${messageWrapperStyle}"><p class="text-center text-gray-500">Game year (currentYear) is not defined.</p></div>`;
            return;
        }

        if (typeof state_milk_production === 'undefined' || state_milk_production.length === 0) {
            containerElement.innerHTML = `<div style="${messageWrapperStyle}"><p class="text-center text-gray-500">No milk production data available.</p></div>`;
            return;
        }

        const allYearsInData = Array.from(new Set(state_milk_production.map(d => d.year))).sort((a, b) => b - a);

        if (allYearsInData.length === 0) {
            containerElement.innerHTML = `<div style="${messageWrapperStyle}"><p class="text-center text-gray-500">No milk production years found in data.</p></div>`;
            return;
        }

        const yearForSmallView = currentYear - 1;

        if (!allYearsInData.includes(yearForSmallView)) {
            containerElement.innerHTML = `<div style="${messageWrapperStyle}"><p class="text-center text-gray-500">No data available for the previous game year (${yearForSmallView}).</p></div>`;
            return;
        }

        const rankingData = getRankingDataForYear(yearForSmallView);
        if (rankingData.length === 0) {
            containerElement.innerHTML = `<div style="${messageWrapperStyle}"><p class="text-center text-gray-500">No ranking data found for ${yearForSmallView}.</p></div>`;
            return;
        }
        // Clear previous message content if any, before rendering graph
        containerElement.innerHTML = ''; 
        renderMiniGraph2(containerElement.id, rankingData, yearForSmallView);
    },

    // renderDetailedView: (containerElement, panelId) => {
    //     if (!containerElement.id) {
    //         containerElement.id = `${panelId}-detailed-view-container`; // Ensure it has an ID
    //     }

    //     if (typeof currentYear === 'undefined') {
    //         containerElement.innerHTML = '<p class="text-center text-gray-500">Game year (currentYear) is not defined.</p>';
    //         return;
    //     }

    //     if (typeof state_milk_production === 'undefined' || state_milk_production.length === 0) {
    //         containerElement.innerHTML = '<p class="text-center text-gray-500">No milk production data available.</p>';
    //         return;
    //     }

    //     const allYearsInData = Array.from(new Set(state_milk_production.map(d => d.year)));
        
    //     // Years strictly below the global currentYear, sorted ascending for the dropdown
    //     const dropdownYears = allYearsInData.filter(year => year < currentYear).sort((a, b) => a - b);

    //     if (dropdownYears.length === 0) {
    //         containerElement.innerHTML = `<p class="text-center text-gray-500">No historical data available before game year ${currentYear}.</p>`;
    //         return;
    //     }

    //     // Initially display the latest year from the allowed historical years
    //     const yearToDisplay = dropdownYears[dropdownYears.length - 1]; 
    //     const currentRankingData = getRankingDataForYear(yearToDisplay);

    //     // Note: The original code had a condition here for currentRankingData.length === 0
    //     // and then called renderDetailedRanking with empty data.
    //     // This behavior is kept, but if no data for yearToDisplay, the list will be empty.
    //     // The title and dropdown will still render.
    //     if (currentRankingData.length === 0) {
    //         // console.warn(`No ranking data found for ${yearToDisplay}, but rendering dropdown.`);
    //          renderDetailedRanking(containerElement.id, [], dropdownYears, yearToDisplay);
    //          // Optionally, add a message inside the container before calling renderDetailedRanking,
    //          // or modify renderDetailedRanking to handle empty data message.
    //          // For now, an empty list will be shown for that year.
    //          return;
    //     }
        
    //     renderDetailedRanking(containerElement.id, currentRankingData, dropdownYears, yearToDisplay);
    // },

    onShrink: (originalContentContainer, panelId) => {
        // Re-use renderSmallView logic for onShrink, which now depends on global currentYear
        milkRankingPanelConfig.renderSmallView(originalContentContainer, panelId);
    }
};

// Listen for the yearChanged event to update the small view
document.addEventListener('yearChanged', function(event) {
    // Ensure the panel's container element exists
    const containerElement = document.getElementById(milkRankingPanelConfig.id);
    if (containerElement) {
        // console.log(`milkRankingPanel: yearChanged event received, refreshing small view for year ${currentYear}`);
        milkRankingPanelConfig.renderSmallView(containerElement, milkRankingPanelConfig.id);
    } else {
        // console.warn(`milkRankingPanel: Container element with ID '${milkRankingPanelConfig.id}' not found for yearChanged event.`);
    }
});