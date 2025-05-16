// --- Start of panels.js ---

const hiddenOriginalContentMap = new Map();

// Sample Pie Data (globally accessible or passed appropriately)
const staticPieData = [ // Renamed from pieData to avoid confusion, can be removed if no longer needed elsewhere
    { label: "Housing", value: 35, color: "#66c2a5" },
    { label: "Food", value: 20, color: "#fc8d62" },
    { label: "Transport", value: 15, color: "#8da0cb" },
    { label: "Utilities", value: 10, color: "#e78ac3" },
    { label: "Savings", value: 10, color: "#a6d854" },
    { label: "Other", value: 10, color: "#ffd92f" }
];

// --- Helper function to get and transform investment data for pie chart ---
function getInvestmentPieData() {
    // Access the global 'investments' object from main.js
    if (typeof investments === 'undefined' || Object.keys(investments).length === 0) {
        return []; // Return empty array if no investments or 'investments' is not defined
    }

    const colors = d3.scaleOrdinal(d3.schemeTableau10); // D3 color scheme

    return Object.entries(investments)
        .filter(([, amount]) => amount > 0) // Only include states with actual investment
        .map(([stateName, amount], index) => ({
            label: stateName,
            value: amount,
            color: colors(index) // Assign color based on index
        }));
}


// --- D3 Pie Chart Rendering Functions ---
function renderSmallPieChart(containerElement, data) {
    if (typeof d3 === 'undefined') { console.error("D3 library is not loaded."); return; }
    d3.select(containerElement).select("svg").remove(); // Clear previous

    if (!data || data.length === 0) {
        containerElement.innerHTML = "<p class='text-xs text-gray-500 text-center p-2'>No investments to display.</p>";
        return;
    }

    const containerRect = containerElement.getBoundingClientRect();
    // Fallback dimensions if containerRect isn't fully ready (e.g. display:none parent)
    const width = containerRect.width > 20 ? containerRect.width : 120;
    const height = containerRect.height > 20 ? containerRect.height : 120;
    const radius = Math.min(width, height) / 2 - (Math.min(width, height) > 100 ? 10 : 5); // Smaller margin for smaller charts

    if (width <= 0 || height <= 0 || radius <=0) {
        console.warn("Small pie chart container too small to render.", containerRect);
        containerElement.innerHTML = "<p class='text-xs text-gray-400 text-center p-1'>Chart too small</p>";
        return;
    }
    containerElement.innerHTML = ""; // Clear any fallback text

    const svg = d3.select(containerElement)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    svg.selectAll("path")
        .data(pie(data))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => d.data.color)
        .attr("stroke", "white")
        .style("stroke-width", "1px")
        .append("title") // Basic tooltip
            .text(d => `${d.data.label}: ${d.data.value}`);
}

function renderInteractivePieChart(chartContainerId, legendContainerId, data) {
    if (typeof d3 === 'undefined') { console.error("D3 library is not loaded."); return; }

    const chartDiv = document.getElementById(chartContainerId);
    const legendDiv = document.getElementById(legendContainerId);

    if (!chartDiv || !legendDiv) {
        console.error("Chart or Legend container not found for interactive pie chart.");
        return;
    }

    d3.select(chartDiv).select("svg").remove(); // Clear previous chart
    legendDiv.innerHTML = ""; // Clear previous legend

    if (!data || data.length === 0) {
        chartDiv.innerHTML = "<p class='text-gray-500 text-center p-4'>No investments to display.</p>";
        legendDiv.innerHTML = "<p class='text-gray-500 text-sm text-center'>Make an investment to see the chart.</p>";
        return;
    }

    const chartRect = chartDiv.getBoundingClientRect();
    const width = chartRect.width > 50 ? chartRect.width : 400; // Default width
    const height = chartRect.height > 50 ? chartRect.height : 350; // Default height
    const radius = Math.min(width, height) / 2 - 20;

    if (width <= 0 || height <= 0 || radius <=0) {
        console.warn("Interactive pie chart container too small.", chartRect);
        chartDiv.innerHTML = "<p class='text-gray-500'>Chart area too small to render.</p>";
        return;
    }
    chartDiv.innerHTML = "";


    const svg = d3.select(chartDiv)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius); // Donut chart
    const arcHover = d3.arc().innerRadius(radius * 0.5).outerRadius(radius * 1.05); // Slight expansion on hover

    const paths = svg.selectAll("path")
        .data(pie(data))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => d.data.color)
        .attr("stroke", "#fff")
        .style("stroke-width", "2px")
        .style("cursor", "pointer")
        .style("transition", "opacity 0.3s ease, transform 0.3s ease") // Smooth transition for opacity/transform
        .on("mouseover", function(event, d) {
            d3.select(this).transition().duration(150).attr("d", arcHover);
            legendDiv.innerHTML = `
                <h5 class="font-semibold text-lg mb-1" style="color:${d.data.color};">${d.data.label}</h5>
                <p class="text-sm">Value: ${d3.format(",")(d.data.value)}</p>
                <p class="text-sm">Share: ${((d.data.value / d3.sum(data, item => item.value)) * 100).toFixed(1)}%</p>
            `;
        })
        .on("mouseout", function(event, d) {
            if (!d3.select(this).classed("selected-slice")) { // Only revert if not selected
                d3.select(this).transition().duration(150).attr("d", arc);
            }
            // legendDiv.innerHTML = "<p class='text-gray-500 text-sm'>Hover or click a slice.</p>"; // Reset legend on mouseout
        })
        .on("click", function(event, d) {
            const alreadySelected = d3.select(this).classed("selected-slice");

            paths.classed("selected-slice", false) // Clear previous selection visual cue
                 .transition().duration(150).attr("d", arc).style("opacity", 0.7); // Dim all

            if (alreadySelected) { // Clicked an already selected slice to deselect
                paths.style("opacity", 1); // Restore opacity for all
                legendDiv.innerHTML = "<p class='text-gray-500 text-sm'>Hover or click a slice.</p>";
            } else {
                d3.select(this)
                    .classed("selected-slice", true)
                    .transition().duration(150)
                    .attr("d", arcHover) // Keep it hovered/larger
                    .style("opacity", 1); // Highlight clicked one

                legendDiv.innerHTML = `
                    <h4 class="font-bold text-xl mb-2" style="color:${d.data.color};">${d.data.label}</h4>
                    <p>Value: ${d3.format(",")(d.data.value)}</p>
                    <p>Share: ${((d.data.value / d3.sum(data, item => item.value)) * 100).toFixed(1)}%</p>
                    <button id="clear-pie-selection" class="mt-3 px-3 py-1 bg-gray-200 text-xs rounded hover:bg-gray-300 focus:outline-none">Clear Selection</button>
                `;
                d3.select("#clear-pie-selection").on("click", () => {
                    paths.classed("selected-slice", false)
                         .transition().duration(150).attr("d", arc).style("opacity", 1); // Restore opacity
                    legendDiv.innerHTML = "<p class='text-gray-500 text-sm'>Hover or click a slice.</p>";
                });
            }
        });

    legendDiv.innerHTML = "<p class='text-gray-500 text-sm text-center'>Hover over or click a slice to see details.</p>";
}

// --- Core Panel Enlargement Logic ---
function enlargeGraph(graphElement) {
    const backdrop = getOrCreateBackdrop();
    const infoButtonInGraphElement = graphElement.querySelector('.info-button:not(.close-enlarged-button)');

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

        if (infoButtonInGraphElement) {
            infoButtonInGraphElement.style.display = 'flex';
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
                // renderCapitalEvolutionGraph(detailedCapitalData, true);
            }
        }


        if (infoButtonInGraphElement) {
            infoButtonInGraphElement.style.display = 'none';
        }
        addCloseButtonToEnlarged(graphElement);

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
                    ${currentInvestmentData.length === 0 ? "<p class='text-gray-500 text-sm'>No investments yet.</p>" : "<p class='text-gray-500 text-sm'>Hover over or click a slice for details.</p>"}
                </div>
            </div>
        `;
        graphElement.appendChild(contentDiv);
        setTimeout(() => { // Ensure DOM is ready for D3
            renderInteractivePieChart("interactive-pie-chart-svg-container", "interactive-pie-legend-details-container", currentInvestmentData);
        }, 50);

    } else if (panelType === "miniGraph2") {
        // ... (keep existing Mini Graph 2 logic) ...
        contentDiv.innerHTML = `<h4 class="text-xl font-semibold mb-3 p-4 text-center">Detailed View: Graph 2 Analysis</h4>
                        <div class="px-4 grow flex flex-col justify-center">
                            <p class="text-sm mb-2">Expanded data points and deeper analysis for various metrics.</p>
                            <div class="w-full h-64 bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-500">
                                [Placeholder: More complex interactive chart for Graph 2 would be rendered here]
                            </div>
                            <p class="mt-2 text-xs">Further details: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, pulvinar facilisis justo mollis, auctor consequat urna.</p>
                        </div>`;
        graphElement.appendChild(contentDiv);
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
        else if (placeholder.dataset.identifier === "miniGraph2" && placeholder.querySelector('.ranking-content')) {
            // This part is handled by loadAndDisplayMilkRanking, so no changes needed here for MG2
        }

    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeMiniGraphPlaceholders();
    // getOrCreateBackdrop(); // Pre-create backdrop if desired
});

// --- End of panels.js ---