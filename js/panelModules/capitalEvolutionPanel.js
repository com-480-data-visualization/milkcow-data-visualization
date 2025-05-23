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
        const svgId = 'capital-evolution-graph-svg';
        let svgContainer = containerElement.querySelector(`#${svgId}`);

        if (!svgContainer) {
            console.warn(`#${svgId} not found in containerElement for renderSmallView. Creating it for panel ${panelId}.`);
            svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgContainer.id = svgId;
            svgContainer.setAttribute("width", "100%");
            svgContainer.setAttribute("height", "100%");
            containerElement.appendChild(svgContainer);
        }

        // Now svgContainer is guaranteed to exist.
        if (typeof panel3 !== 'undefined' && typeof panel3.renderSmallGraph === 'function') {
            panel3.renderSmallGraph(svgId); // Pass the ID string
        } else if (typeof renderCapitalEvolutionGraph === 'function') { // Support for merged panel3
             // renderCapitalEvolutionGraph(initialCapitalData, false, svgId); // false for not detailed
        } else {
            renderSmallCapitalEvolutionPlaceholder(svgContainer, panelId); // svgContainer is now guaranteed
        }
    },

    renderDetailedView: (containerElement, panelId) => {
        // The detailedContentArea in panelManager is already flex-col.
        // The title is added by panelManager. This function just needs to render the graph.
        const svgId = `capital-evolution-graph-svg`; // Keep using the same SVG ID or a new one for detailed
        let svgContainer = document.getElementById(svgId);

        // Ensure the SVG container can grow
        if(svgContainer) {
            svgContainer.style.flexGrow = '1';
            svgContainer.style.width = '100%'; // Ensure it uses the space
            svgContainer.style.height = 'calc(100% - 2em)'; // Example: Adjust if title takes space
            // The parent 'detailedContentArea' is already flex.
            // The 'chartContainer' passed to this function will hold the SVG.
            // If the SVG is not already in chartContainer, move or recreate it.
            if (svgContainer.parentNode !== containerElement) {
                 containerElement.appendChild(svgContainer); // Move the existing SVG
            }
        } else { // Create if it somehow wasn't there
            svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgContainer.id = svgId;
            svgContainer.setAttribute("width", "100%");
            svgContainer.setAttribute("height", "100%");
            svgContainer.style.flexGrow = '1';
            containerElement.appendChild(svgContainer);
        }


        if (typeof panel3 !== 'undefined' && typeof panel3.renderDetailedGraph === 'function') {
            panel3.renderDetailedGraph(svgId);
        } else if (typeof renderCapitalEvolutionGraph === 'function') { // Support for merged panel3
            // renderCapitalEvolutionGraph(detailedCapitalData, true, svgId); // true for detailed
        } else {
             renderDetailedCapitalEvolutionPlaceholder(svgContainer, panelId);
        }
    },
    onShrink: (originalContentContainer, panelId) => {
        const svgId = 'capital-evolution-graph-svg';
        let svgContainer = originalContentContainer.querySelector(`#${svgId}`);

        if (!svgContainer) {
            console.warn(`#${svgId} not found in originalContentContainer during onShrink. Re-creating it for panel ${panelId}.`);
            svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgContainer.id = svgId;
            svgContainer.setAttribute("width", "100%");
            svgContainer.setAttribute("height", "100%");
            originalContentContainer.appendChild(svgContainer);
        }

        // Now svgContainer is guaranteed to exist.
        if (typeof panel3 !== 'undefined' && typeof panel3.renderSmallGraph === 'function') {
            panel3.renderSmallGraph(svgId); // Pass the ID string
        } else if (typeof renderCapitalEvolutionGraph === 'function') {
            // renderCapitalEvolutionGraph(initialCapitalData, false, svgId);
        } else {
            renderSmallCapitalEvolutionPlaceholder(svgContainer, panelId); // svgContainer is now guaranteed
        }
        
        // Reset styles that might have been applied for detailed view
        if(svgContainer) { 
            svgContainer.style.flexGrow = '';
            // Potentially reset other styles if renderSmallGraph doesn't handle it
        }
    }
};