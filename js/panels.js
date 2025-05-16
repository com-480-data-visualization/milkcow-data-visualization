// --- Start of panels.js ---

const hiddenOriginalContentMap = new Map();

// --- Core Panel Enlargement Logic ---
function enlargeGraph(graphElement) {
    const backdrop = getOrCreateBackdrop();

    if (graphElement.classList.contains('panel-enlarged')) {
        // --- SHRINK PANEL ---
        graphElement.classList.remove('panel-enlarged');

        if (graphElement.dataset.panelType === "miniGraph1" || graphElement.dataset.panelType === "miniGraph2") {
            restoreOriginalMiniGraphContent(graphElement);
        }

        const detailedContentArea = graphElement.querySelector('.detailed-content-area');
        if (detailedContentArea) detailedContentArea.remove();

        if (graphElement.dataset.panelType === "capitalEvolution") { // Check specific type
            const detailedTitle = graphElement.querySelector('.enlarged-panel-dynamic-title');
            if (detailedTitle) detailedTitle.remove();
            // Signal panel3.js (D3 line chart) to re-render small if it has such a function
            if (typeof panel3 !== 'undefined' && typeof panel3.renderSmallGraph === 'function') {
                panel3.renderSmallGraph('capital-evolution-graph');
            } else if (typeof renderCapitalEvolutionGraph === 'function' && initialCapitalData) { // If panel3 was merged
                 // Assuming initialCapitalData is defined similar to pieData
                 // renderCapitalEvolutionGraph(initialCapitalData, false);
            }
        }

        const closeButton = graphElement.querySelector('.close-enlarged-button');
        if (closeButton) closeButton.remove();

        backdrop.style.display = 'none';
        document.body.style.overflow = '';
        delete graphElement.dataset.originalDisplay; // Clean up stored display style
        delete graphElement.dataset.panelType;

    } else {
        // --- ENLARGE PANEL ---
        const currentlyEnlarged = document.querySelector('.panel-enlarged');
        if (currentlyEnlarged && currentlyEnlarged !== graphElement) {
            enlargeGraph(currentlyEnlarged);
        }

        graphElement.classList.add('panel-enlarged');
        // Store original display style for the small chart container if it exists
        const smallPieContainer = graphElement.querySelector('.small-pie-chart-container');
        if (smallPieContainer) {
            graphElement.dataset.originalDisplay = smallPieContainer.style.display || '';
        }


        // Determine panel type
        let currentPanelType = graphElement.dataset.panelType;
        if (!currentPanelType) { // If not already set (e.g. first click)
            if (graphElement.querySelector('.small-pie-chart-container')) { // Check if it's our pie chart panel
                currentPanelType = "miniGraph1";
            } else if (graphElement.textContent.includes("Mini Graph 2 Placeholder")) { // Fallback for MG2
                currentPanelType = "miniGraph2";
            } else if (graphElement.querySelector('#capital-evolution-graph')) {
                currentPanelType = "capitalEvolution";
            }
            graphElement.dataset.panelType = currentPanelType;
        }


        if (currentPanelType === "miniGraph1") {
            storeAndHideOriginalMiniGraphContent(graphElement); // Hides the small pie chart
            displayDetailedMiniGraphContent(graphElement);
        } else if (currentPanelType === "miniGraph2") {
            storeAndHideOriginalMiniGraphContent(graphElement, "Mini Graph 2 Placeholder");
            displayDetailedMiniGraphContent(graphElement);
        } else if (currentPanelType === "capitalEvolution") {
            displayDetailedContentForLargeGraph(graphElement);
            // Signal panel3.js (D3 line chart) to re-render detailed if it has such a function
            if (typeof panel3 !== 'undefined' && typeof panel3.renderDetailedGraph === 'function') {
                panel3.renderDetailedGraph('capital-evolution-graph');
            } else if (typeof renderCapitalEvolutionGraph === 'function' && detailedCapitalData) { // If panel3 was merged
                // Assuming detailedCapitalData is defined
                // renderCapitalEvolutionGraph(detailedCapitalEvolutionData, true);
            }
        }


        backdrop.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function getOrCreateBackdrop() {
    let backdrop = document.getElementById('modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'modal-backdrop';
        backdrop.className = 'fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-60 z-[999]';
        backdrop.style.display = 'none';
        backdrop.onclick = () => {
            const enlargedPanel = document.querySelector('.panel-enlarged');
            if (enlargedPanel) {
                enlargeGraph(enlargedPanel);
            }
        };
        document.body.appendChild(backdrop);
    }
    return backdrop;
}

function addCloseButtonToEnlarged(panelElement) {
    let existingCloseButton = panelElement.querySelector('.close-enlarged-button');
    if (existingCloseButton) existingCloseButton.remove();

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'close-enlarged-button absolute top-3 right-3 text-2xl leading-none bg-gray-700 hover:bg-gray-900 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer focus:outline-none';
    closeButton.style.zIndex = '1005';
    closeButton.setAttribute('aria-label', 'Close dialog');
    closeButton.onclick = function(event) {
        event.stopPropagation();
        enlargeGraph(panelElement);
    };
    panelElement.appendChild(closeButton);
}

function storeAndHideOriginalMiniGraphContent(graphElement, placeholderTextContentForOtherGraphs) {
    if (graphElement.dataset.panelType === "miniGraph1") {
        const pieContainer = graphElement.querySelector('.small-pie-chart-container');
        if (pieContainer) {
            pieContainer.style.display = 'none'; // Hide it
            hiddenOriginalContentMap.set(graphElement, pieContainer); // Store reference to container
        }
    } else { // Logic for other mini graphs (e.g., Mini Graph 2)
        let originalTextNode = null;
        for (const node of graphElement.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === placeholderTextContentForOtherGraphs?.trim()) {
                originalTextNode = node;
                break;
            }
        }
        if (originalTextNode) {
            const tempSpan = document.createElement('span');
            tempSpan.textContent = originalTextNode.textContent;
            tempSpan.style.display = 'none';
            tempSpan.classList.add('original-mini-graph-content');
            graphElement.insertBefore(tempSpan, originalTextNode);
            graphElement.removeChild(originalTextNode);
            hiddenOriginalContentMap.set(graphElement, tempSpan);
        }
    }
}

function restoreOriginalMiniGraphContent(graphElement) {
    const storedElement = hiddenOriginalContentMap.get(graphElement);
    if (storedElement) {
        if (graphElement.dataset.panelType === "miniGraph1" && storedElement.classList.contains('small-pie-chart-container')) {
            storedElement.style.display = graphElement.dataset.originalDisplay || 'flex'; // Restore original display or default
            // Optional: re-render if needed, but hiding/showing is often enough
            // renderSmallPieChart(storedElement, pieData);
        } else if (storedElement.classList.contains('original-mini-graph-content')) { // For text-based placeholders
            const originalTextNode = document.createTextNode(storedElement.textContent);
            graphElement.insertBefore(originalTextNode, storedElement);
            graphElement.removeChild(storedElement);
        }
    }
    hiddenOriginalContentMap.delete(graphElement);
}

function displayDetailedMiniGraphContent(graphElement) {
    let existingDetailedArea = graphElement.querySelector('.detailed-content-area');
    if (existingDetailedArea) existingDetailedArea.remove();

    const panelType = graphElement.dataset.panelType;
    const contentDiv = document.createElement('div');
    // Ensure detailed content takes full height of enlarged panel, considering padding.
    contentDiv.className = 'detailed-content-area w-full h-full text-gray-700 flex flex-col'; // Added flex flex-col


    if (panelType === "miniGraph1") {
        const currentInvestmentData = getInvestmentPieData(); // Get live investment data
        contentDiv.innerHTML = `
            <h4 class="text-xl font-semibold p-3 text-center shrink-0">Investment Portfolio Breakdown</h4>
            <div class="flex flex-col lg:flex-row w-full h-full grow overflow-hidden p-2">
                <div id="interactive-pie-chart-svg-container" class="w-full lg:w-2/3 h-2/3 lg:h-full flex items-center justify-center p-1"></div>
                <div id="interactive-pie-legend-details-container" class="w-full lg:w-1/3 h-1/3 lg:h-full p-3 bg-gray-50 rounded-md shadow overflow-y-auto flex flex-col justify-center items-center text-center">
                    ${currentInvestmentData.length === 0 ? "<p class='normal-text'>No investments yet.</p>" : "<p class='text-gray-500 text-sm'>Hover over or click a slice for details.</p>"}
                </div>
            </div>
        `;
        graphElement.appendChild(contentDiv);
        setTimeout(() => { // Ensure DOM is ready for D3
            renderInteractivePieChart("interactive-pie-chart-svg-container", "interactive-pie-legend-details-container", currentInvestmentData);
        }, 50);

    } else if (panelType === "miniGraph2") {
        const currentYear = new Date().getFullYear();
        const currentRankingData = getRankingDataForYear(currentYear);
        const availableYears = [2023, 2024, 2025]; // Replace with dynamic year fetching if available

        // Clear existing content and prepare for detailed ranking
        contentDiv.innerHTML = `
            <div id="detailed-ranking-container" class="w-full h-full"></div>
        `;
        graphElement.appendChild(contentDiv);

        setTimeout(() => {
            renderDetailedRanking("detailed-ranking-container", currentRankingData, availableYears, currentYear);
        }, 50);
    }
}

function displayDetailedContentForLargeGraph(graphElement) {
    let existingTitle = graphElement.querySelector('.enlarged-panel-dynamic-title');
    if (existingTitle) existingTitle.remove();

    const title = document.createElement('h4');
    title.className = 'enlarged-panel-dynamic-title text-xl font-semibold p-4 pb-2 text-gray-700 shrink-0';
    title.textContent = 'Capital Evolution - Detailed Interactive View';
    // Ensure the main graph SVG container can grow
    const svgContainer = graphElement.querySelector('#capital-evolution-graph');
    if(svgContainer) {
        svgContainer.style.flexGrow = '1'; // Allow SVG to take space in flex column
        graphElement.style.display = 'flex'; // Ensure parent is flex
        graphElement.style.flexDirection = 'column'; // Stack title and graph
    }

    graphElement.insertBefore(title, graphElement.firstChild); // Prepend title
    console.log("Large graph panel enlarged. Expecting panel3.js or similar to update SVG content.");
}

function initializeMiniGraphPlaceholders() {
    const miniGraphPlaceholders = document.querySelectorAll('.mini-graph-placeholder');
    miniGraphPlaceholders.forEach(placeholder => {
        // Try to find the text node to replace it more accurately
        let textNodeToReplace = null;
        let isMiniGraph1 = false;
        for (const node of placeholder.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().includes("Mini Graph 1 Placeholder")) {
                textNodeToReplace = node;
                isMiniGraph1 = true;
                break;
            }
        }

        if (textNodeToReplace && isMiniGraph1) { // Process only Mini Graph 1 for pie chart
            placeholder.removeChild(textNodeToReplace); // Remove the placeholder text

            const pieContainer = document.createElement('div');
            pieContainer.className = 'small-pie-chart-container w-full h-full flex items-center justify-center';
            placeholder.insertBefore(pieContainer, placeholder.querySelector('.info-button'));

            const currentInvestmentData = getInvestmentPieData(); // Get live investment data

            setTimeout(() => renderSmallPieChart(pieContainer, currentInvestmentData), 0);

            placeholder.dataset.graphType = 'pieChart';
        }
        // Note: Logic for Mini Graph 2 (milk ranking) or other placeholders would go here or remain separate
        // For example, if you had a data-identifier="miniGraph2" on the HTML element:
        else if (placeholder.dataset.identifier === "miniGraph2") { // Check for Mini Graph 2 identifier
            const currentYear = new Date().getFullYear(); // Or your game's current year
            const rankingData = getRankingDataForYear(currentYear);
            
            // Create a container for the mini ranking if it doesn't exist
            let miniRankingContainer = placeholder.querySelector('#miniGraph2-content-container');
            if (!miniRankingContainer) {
                miniRankingContainer = document.createElement('div');
                miniRankingContainer.id = 'miniGraph2-content-container';
                miniRankingContainer.className = 'w-full h-full flex flex-col items-center justify-center p-2'; // Basic styling
                placeholder.innerHTML = ''; // Clear placeholder text
                placeholder.appendChild(miniRankingContainer);
            }
            renderMiniGraph2(miniRankingContainer.id, rankingData, currentYear);
        }

    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeMiniGraphPlaceholders();

    // Add click event listener to all small panels to enlarge them
    const panels = document.querySelectorAll('.mini-graph-placeholder, .large-graph-placeholder'); // Include large graph placeholder
    panels.forEach(panel => {
        // Remove the info button from the panel
        const infoButton = panel.querySelector('.info-button');
        if (infoButton) {
            infoButton.remove();
        }

        // Add click event only if the panel is not already enlarged
        panel.addEventListener('click', (event) => {
            if (!panel.classList.contains('panel-enlarged')) {
                enlargeGraph(panel);
            }
        });
    });

    // Add close button to enlarged panels
    function addCloseButtonToPanel(panel) {
        let closeButton = panel.querySelector('.close-enlarged-button');
        if (!closeButton) {
            closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.className = 'close-enlarged-button absolute top-3 right-3 bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-900';
            closeButton.onclick = (event) => {
                event.stopPropagation(); // Prevent triggering panel click
                enlargeGraph(panel); // Shrink the panel
            };
            panel.appendChild(closeButton);
        }
    }

    // Modify enlargeGraph to add the close button when a panel is enlarged
    const originalEnlargeGraph = enlargeGraph;
    enlargeGraph = function (graphElement) {
        originalEnlargeGraph(graphElement);
        if (graphElement.classList.contains('panel-enlarged')) {
            addCloseButtonToPanel(graphElement);
        }
    };

    // Listen for investment updates to refresh the small pie chart
    document.addEventListener('investmentsUpdated', () => {
        const pieChartContainer = document.querySelector('.small-pie-chart-container');
        if (pieChartContainer) {
            const currentInvestmentData = getInvestmentPieData();
            renderSmallPieChart(pieChartContainer, currentInvestmentData);
        }
    });
});

// --- End of panels.js ---