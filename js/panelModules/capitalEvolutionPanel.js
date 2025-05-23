// --- panelModules/capitalEvolutionPanel.js ---
// Assuming panel3.js or similar provides these rendering functions globaly or via import
// e.g. import { renderSmallCapitalEvolution, renderDetailedCapitalEvolution } from '../panel3.js';


// Placeholder functions if panel3.js is not defined
const renderSmallCapitalEvolutionPlaceholder = (container, panelId) => {
    const svgEl = container.querySelector('svg') || container; // Use existing SVG or the container itself
    svgEl.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Small Capital Evolution (Placeholder)</text>`;
    // In a real scenario: panel3.renderSmallGraph(svgEl.id || panelId);
};
const renderDetailedCapitalEvolutionPlaceholder = (container, panelId) => {
    const svgEl = container.querySelector('svg') || document.createElementNS("http://www.w3.org/2000/svg", "svg");
    if(!container.querySelector('svg')){ // if we had to create it
        svgEl.setAttribute("width", "100%");
        svgEl.setAttribute("height", "100%");
        svgEl.id = `detailed-capital-evolution-${panelId}`;
        container.appendChild(svgEl);
    }
    svgEl.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Detailed Capital Evolution (Placeholder)</text>`;
    // In a real scenario: panel3.renderDetailedGraph(svgEl.id || panelId);
};


const capitalEvolutionPanelConfig = {
    id: 'capitalEvolutionPanel',
    type: 'capitalEvolutionChart',
    enlargedTitle: 'Capital Evolution - Detailed Interactive View',

    renderSmallView: (containerElement, panelId) => {
        // Clear previous content to avoid duplicate SVGs
        containerElement.innerHTML = ''; 

        // Create a wrapper for the two charts to manage layout (e.g., flex column)
        const chartsWrapper = document.createElement('div');
        chartsWrapper.style.display = 'flex';
        chartsWrapper.style.flexDirection = 'column';
        chartsWrapper.style.width = '100%';
        chartsWrapper.style.height = '100%';
        containerElement.appendChild(chartsWrapper);

        const totalCapitalSvgId = `total-capital-chart-svg-${panelId}`;
        const gainsChartSvgId = `gains-chart-svg-${panelId}`; // Changed from 'capital-evolution-graph-svg'

        // Create SVG container for Total Capital Chart
        const totalCapitalContainer = document.createElement('div');
        totalCapitalContainer.style.height = '40%'; // Allocate 40% height
        totalCapitalContainer.style.width = '100%';
        const totalCapitalSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        totalCapitalSvg.id = totalCapitalSvgId;
        totalCapitalSvg.setAttribute("width", "100%");
        totalCapitalSvg.setAttribute("height", "100%");
        totalCapitalContainer.appendChild(totalCapitalSvg);
        chartsWrapper.appendChild(totalCapitalContainer);

        // Create SVG container for Gains Chart
        const gainsChartContainer = document.createElement('div');
        gainsChartContainer.style.height = '60%'; // Allocate 60% height
        gainsChartContainer.style.width = '100%';
        const gainsChartSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        gainsChartSvg.id = gainsChartSvgId;
        gainsChartSvg.setAttribute("width", "100%");
        gainsChartSvg.setAttribute("height", "100%");
        gainsChartContainer.appendChild(gainsChartSvg);
        chartsWrapper.appendChild(gainsChartContainer);
        
        // Render Total Capital Chart
        if (typeof totalCapitalChart !== 'undefined' && typeof totalCapitalChart.renderSmall === 'function') {
            // Assuming global totalCapitalHistory similar to gainsData
            // You'll need to ensure totalCapitalHistory is populated
            totalCapitalChart.renderSmall(totalCapitalSvgId, window.totalCapitalHistory || []);
        } else {
            console.warn('totalCapitalChart.renderSmall is not available.');
            // Optionally, render a placeholder in totalCapitalSvg
            d3.select(`#${totalCapitalSvgId}`).append("text").attr("x", "50%").attr("y", "50%").attr("text-anchor", "middle").text("Total Capital Chart N/A");
        }

        // Render Gains Chart (panel3)
        if (typeof panel3 !== 'undefined' && typeof panel3.renderSmallGraph === 'function') {
            panel3.renderSmallGraph(gainsChartSvgId);
        } else {
            console.warn('panel3.renderSmallGraph is not available.');
            // Optionally, render a placeholder in gainsChartSvg
            d3.select(`#${gainsChartSvgId}`).append("text").attr("x", "50%").attr("y", "50%").attr("text-anchor", "middle").text("Gains Chart N/A");
        }
    },

    renderDetailedView: (containerElement, panelId) => {
        // containerElement is the 'detailedContentArea' from panelManager
        containerElement.innerHTML = ''; // Clear previous content
        containerElement.style.overflowY = 'auto'; // Ensure scrolling for tall content
        containerElement.style.display = 'flex';
        containerElement.style.flexDirection = 'column';
        containerElement.style.height = '100%'; // Ensure it takes full modal height

        const totalCapitalSvgId = `detailed-total-capital-chart-svg-${panelId}`;
        const gainsChartSvgId = `detailed-gains-chart-svg-${panelId}`;

        // Create container and SVG for Detailed Total Capital Chart
        const totalCapitalDetailedContainer = document.createElement('div');
        // Make it tall enough to be meaningful, scrolling will handle overflow
        totalCapitalDetailedContainer.style.minHeight = '300px'; // Minimum height
        totalCapitalDetailedContainer.style.height = '50vh'; // Example: 50% of viewport height
        totalCapitalDetailedContainer.style.width = '100%';
        totalCapitalDetailedContainer.style.flexShrink = '0'; // Prevent shrinking
        const totalCapitalDetailedSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        totalCapitalDetailedSvg.id = totalCapitalSvgId;
        totalCapitalDetailedSvg.setAttribute("width", "100%");
        totalCapitalDetailedSvg.setAttribute("height", "100%");
        totalCapitalDetailedContainer.appendChild(totalCapitalDetailedSvg);
        containerElement.appendChild(totalCapitalDetailedContainer);

        // Create container and SVG for Detailed Gains Chart
        const gainsChartDetailedContainer = document.createElement('div');
        gainsChartDetailedContainer.style.minHeight = '350px'; // Minimum height
        gainsChartDetailedContainer.style.height = '60vh'; // Example: 60% of viewport height
        gainsChartDetailedContainer.style.width = '100%';
        gainsChartDetailedContainer.style.flexShrink = '0'; // Prevent shrinking
        const gainsChartDetailedSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        gainsChartDetailedSvg.id = gainsChartSvgId;
        gainsChartDetailedSvg.setAttribute("width", "100%");
        gainsChartDetailedSvg.setAttribute("height", "100%");
        gainsChartDetailedContainer.appendChild(gainsChartDetailedSvg);
        containerElement.appendChild(gainsChartDetailedContainer);

        // Render Detailed Total Capital Chart
        if (typeof totalCapitalChart !== 'undefined' && typeof totalCapitalChart.renderDetailed === 'function') {
            totalCapitalChart.renderDetailed(totalCapitalSvgId, window.totalCapitalHistory || []);
        } else {
            console.warn('totalCapitalChart.renderDetailed is not available.');
            d3.select(`#${totalCapitalSvgId}`).append("text").attr("x", "50%").attr("y", "50%").attr("text-anchor", "middle").text("Detailed Total Capital Chart N/A");
        }

        // Render Detailed Gains Chart
        if (typeof panel3 !== 'undefined' && typeof panel3.renderDetailedGraph === 'function') {
            panel3.renderDetailedGraph(gainsChartSvgId);
        } else {
            console.warn('panel3.renderDetailedGraph is not available.');
            d3.select(`#${gainsChartSvgId}`).append("text").attr("x", "50%").attr("y", "50%").attr("text-anchor", "middle").text("Detailed Gains Chart N/A");
        }
    },
    onShrink: (originalContentContainer, panelId) => {
        // Re-render the small view in the original placeholder
        // The renderSmallView function now clears the container first.
        capitalEvolutionPanelConfig.renderSmallView(originalContentContainer, panelId);
        
        // No specific style resets needed here as renderSmallView rebuilds the content.
    }
};