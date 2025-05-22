// --- panelModules/investmentPieChartPanel.js ---
// Assumes pie_chart.js functions (getInvestmentPieData, renderSmallPieChart, renderInteractivePieChart) are available
// e.g. import { getInvestmentPieData, renderSmallPieChart, renderInteractivePieChart } from '../pie_chart.js';

const investmentPieChartPanelConfig = {
    id: 'miniGraph1Panel', // Matches HTML element ID
    type: 'investmentPieChart',
    enlargedTitle: 'Investment Portfolio Breakdown',

    renderSmallView: (containerElement, panelId, newData) => {
        // pie_chart.js should be modified so renderSmallPieChart can accept data
        const data = newData || getInvestmentPieData(); // Use new data if provided, else fetch
        renderSmallPieChart(containerElement, data);
    },

    renderDetailedView: (containerElement, panelId) => {
        const currentInvestmentData = getInvestmentPieData();
        containerElement.innerHTML = `
            <div class="flex flex-col lg:flex-row w-full h-full grow overflow-hidden p-1">
                <div id="interactive-pie-chart-svg-container-${panelId}" class="w-full lg:w-2/3 h-2/3 lg:h-full flex items-center justify-center p-1"></div>
                <div id="interactive-pie-legend-details-container-${panelId}" class="w-full lg:w-1/3 h-1/3 lg:h-full p-3 bg-gray-50 rounded-md shadow overflow-y-auto flex flex-col justify-center items-center text-center">
                    ${currentInvestmentData.length === 0 ? "<p class='normal-text'>No investments yet.</p>" : "<p class='text-gray-500 text-sm'>Hover over or click a slice for details.</p>"}
                </div>
            </div>
        `;
        setTimeout(() => {
            renderInteractivePieChart(`interactive-pie-chart-svg-container-${panelId}`, `interactive-pie-legend-details-container-${panelId}`, currentInvestmentData);
        }, 0); // Ensure DOM is ready
    },

    // Optional: onShrink if specific re-render is needed for small view beyond just showing it
    onShrink: (originalContentContainer, panelId) => {
        // If the small pie chart needs explicit re-rendering or data refresh upon shrinking
        // For example, if its size depends on the container being visible.
        const data = getInvestmentPieData();
        renderSmallPieChart(originalContentContainer, data);
    }
};

// Event listener for data updates specific to this panel type
document.addEventListener('investmentsUpdated', (event) => {
    // Call the PanelManager's refresh function
    if (typeof refreshPanelSmallView === 'function') {
        refreshPanelSmallView('miniGraph1Panel', event.detail?.newData || getInvestmentPieData());
    } else { // Fallback if panelManager is not yet fully modularized in terms of event handling
        const pieChartContainer = document.getElementById('miniGraph1Panel')?.querySelector('.panel-original-content');
        if (pieChartContainer) {
            renderSmallPieChart(pieChartContainer, event.detail?.newData || getInvestmentPieData());
        }
    }
});