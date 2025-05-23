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
    currentDetailedViewIndex: 0, // 0 for first chart, 1 for second

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
        totalCapitalContainer.style.height = '50%'; // Allocate 50% height
        totalCapitalContainer.style.width = '100%';
        const totalCapitalSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        totalCapitalSvg.id = totalCapitalSvgId;
        totalCapitalSvg.setAttribute("width", "100%");
        totalCapitalSvg.setAttribute("height", "100%");
        totalCapitalContainer.appendChild(totalCapitalSvg);
        chartsWrapper.appendChild(totalCapitalContainer);

        // Create SVG container for Gains Chart
        const gainsChartContainer = document.createElement('div');
        gainsChartContainer.style.height = '50%'; // Allocate 50% height
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

    renderDetailedView: function(containerElement, panelId) { // Changed to a regular function
        containerElement.innerHTML = '';
        // Apply snap scrolling specific class
        containerElement.classList.add('detailed-view-snap-container');
        // Ensure overflowY is auto/scroll for snapping to work, but hide default scrollbar via CSS
        containerElement.style.overflowY = 'scroll'; 
        containerElement.style.display = 'flex';
        containerElement.style.flexDirection = 'column';
        containerElement.style.height = '100%';

        const totalCapitalSvgId = `detailed-total-capital-chart-svg-${panelId}`;
        const gainsChartSvgId = `detailed-gains-chart-svg-${panelId}`;

        // Create container and SVG for Detailed Total Capital Chart
        const totalCapitalDetailedContainer = document.createElement('div');
        totalCapitalDetailedContainer.classList.add('chart-snap-section'); // Class for scroll snapping
        totalCapitalDetailedContainer.style.height = '100%';
        totalCapitalDetailedContainer.style.width = '100%';
        totalCapitalDetailedContainer.style.flexShrink = '0';
        const totalCapitalDetailedSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        totalCapitalDetailedSvg.id = totalCapitalSvgId;
        totalCapitalDetailedSvg.setAttribute("width", "100%");
        totalCapitalDetailedSvg.setAttribute("height", "100%");
        totalCapitalDetailedContainer.appendChild(totalCapitalDetailedSvg);
        containerElement.appendChild(totalCapitalDetailedContainer);

        // Create container and SVG for Detailed Gains Chart
        const gainsChartDetailedContainer = document.createElement('div');
        gainsChartDetailedContainer.classList.add('chart-snap-section'); // Class for scroll snapping
        gainsChartDetailedContainer.style.height = '100%';
        gainsChartDetailedContainer.style.width = '100%';
        gainsChartDetailedContainer.style.flexShrink = '0';
        const gainsChartDetailedSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        gainsChartDetailedSvg.id = gainsChartSvgId;
        gainsChartDetailedSvg.setAttribute("width", "100%");
        gainsChartDetailedSvg.setAttribute("height", "100%");
        gainsChartDetailedContainer.appendChild(gainsChartDetailedSvg);
        containerElement.appendChild(gainsChartDetailedContainer);

        // Render charts
        if (typeof totalCapitalChart !== 'undefined' && typeof totalCapitalChart.renderDetailed === 'function') {
            totalCapitalChart.renderDetailed(totalCapitalSvgId, window.totalCapitalHistory || []);
        } else {
            console.warn('totalCapitalChart.renderDetailed is not available.');
            d3.select(`#${totalCapitalSvgId}`).append("text").attr("x", "50%").attr("y", "50%").attr("text-anchor", "middle").text("Detailed Total Capital Chart N/A");
        }
        if (typeof panel3 !== 'undefined' && typeof panel3.renderDetailedGraph === 'function') {
            panel3.renderDetailedGraph(gainsChartSvgId);
        } else {
            console.warn('panel3.renderDetailedGraph is not available.');
            d3.select(`#${gainsChartSvgId}`).append("text").attr("x", "50%").attr("y", "50%").attr("text-anchor", "middle").text("Detailed Gains Chart N/A");
        }

        // Create and manage custom scrollbar
        this._createCustomScrollbar(containerElement, panelId);

        // Scroll to the current view index (e.g., if panel was re-rendered)
        if (this.currentDetailedViewIndex === 1) {
            gainsChartDetailedContainer.scrollIntoView();
        } else {
            totalCapitalDetailedContainer.scrollIntoView();
        }
    },

    _createCustomScrollbar: function(containerElement, panelId) {
        // The containerElement is the one with scroll-snap (e.g., chartContainer in panelManager)
        // The scrollbar should be a child of its parent (detailedContentArea in panelManager) for fixed positioning relative to it.
        const positioningParent = containerElement.parentElement; 

        let scrollbarWrapper = positioningParent.querySelector('.custom-scrollbar-wrapper');
        if (scrollbarWrapper) scrollbarWrapper.remove();

        scrollbarWrapper = document.createElement('div');
        scrollbarWrapper.className = 'custom-scrollbar-wrapper';

        const dot1 = document.createElement('div');
        dot1.className = 'custom-scrollbar-dot';
        dot1.dataset.index = 0;

        const dot2 = document.createElement('div');
        dot2.className = 'custom-scrollbar-dot';
        dot2.dataset.index = 1;

        scrollbarWrapper.appendChild(dot1);
        scrollbarWrapper.appendChild(dot2);
        positioningParent.appendChild(scrollbarWrapper); // Append to the positioningParent

        const updateActiveDot = () => {
            const scrollPercentage = containerElement.scrollTop / (containerElement.scrollHeight - containerElement.clientHeight);
            if (scrollPercentage < 0.5) {
                this.currentDetailedViewIndex = 0;
                dot1.classList.add('active');
                dot2.classList.remove('active');
            } else {
                this.currentDetailedViewIndex = 1;
                dot1.classList.remove('active');
                dot2.classList.add('active');
            }
        };

        dot1.addEventListener('click', () => {
            containerElement.children[0].scrollIntoView({ behavior: 'smooth' });
        });

        dot2.addEventListener('click', () => {
            containerElement.children[1].scrollIntoView({ behavior: 'smooth' });
        });

        // Use a timeout to ensure layout is stable before initial update
        setTimeout(updateActiveDot, 0);
        containerElement.addEventListener('scroll', updateActiveDot, { passive: true });

        // Initial active state
        if (this.currentDetailedViewIndex === 0) dot1.classList.add('active');
        else dot2.classList.add('active');
    },

    onShrink: function(originalContentContainer, panelId) { // Changed to a regular function for consistency, though not strictly necessary for 'this' here
        // The detailedContentArea is the one that would have the scrollbar
        const detailedContentArea = document.querySelector(`#${this.id} .detailed-content-area`); 
        if (detailedContentArea) {
            detailedContentArea.classList.remove('detailed-view-snap-container');
            const scrollbar = detailedContentArea.querySelector('.custom-scrollbar-wrapper');
            if (scrollbar) scrollbar.remove();
        }
        // Reset view index for next time it's enlarged
        // this.currentDetailedViewIndex = 0; // Decided against resetting, to remember last view

        capitalEvolutionPanelConfig.renderSmallView(originalContentContainer, panelId);
    }
};