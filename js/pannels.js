const hiddenOriginalContentMap = new Map();

function enlargeGraph(graphElement) {
    const backdrop = getOrCreateBackdrop();
    // The original 'i' button related to this graphElement
    const infoButtonInGraphElement = graphElement.querySelector('.info-button:not(.close-enlarged-button)');

    if (graphElement.classList.contains('panel-enlarged')) {
        // --- SHRINK PANEL ---
        graphElement.classList.remove('panel-enlarged');

        // Restore original content/state for mini-graphs
        if (graphElement.dataset.panelType === "miniGraph1" || graphElement.dataset.panelType === "miniGraph2") {
            restoreOriginalMiniGraphContent(graphElement);
        }

        // Remove detailed content area added for mini-graphs
        const detailedContentArea = graphElement.querySelector('.detailed-content-area');
        if (detailedContentArea) detailedContentArea.remove();

        // For the large graph, remove any added title
        if (graphElement.querySelector('#capital-evolution-graph')) {
            const detailedTitle = graphElement.querySelector('.enlarged-panel-dynamic-title');
            if (detailedTitle) detailedTitle.remove();
            // Optionally, notify panel3.js to render a smaller version
            // e.g., graphElement.querySelector('#capital-evolution-graph').dispatchEvent(new CustomEvent('graphShrunk'));
        }

        // Show the original 'i' button
        if (infoButtonInGraphElement) {
            infoButtonInGraphElement.style.display = 'flex'; // Revert to original display style
        }

        // Remove the 'X' close button
        const closeButton = graphElement.querySelector('.close-enlarged-button');
        if (closeButton) closeButton.remove();

        backdrop.style.display = 'none';
        document.body.style.overflow = ''; // Restore body scroll

        delete graphElement.dataset.panelType;

    } else {
        // --- ENLARGE PANEL ---
        // First, shrink any other panel that might be enlarged
        const currentlyEnlarged = document.querySelector('.panel-enlarged');
        if (currentlyEnlarged && currentlyEnlarged !== graphElement) {
            enlargeGraph(currentlyEnlarged); // This will trigger the shrink logic for the other panel
        }

        graphElement.classList.add('panel-enlarged');

        // Determine panel type and prepare/display detailed content
        if (graphElement.textContent.includes("Mini Graph 1 Placeholder")) {
            graphElement.dataset.panelType = "miniGraph1";
            storeAndHideOriginalMiniGraphContent(graphElement, "Mini Graph 1 Placeholder");
            displayDetailedMiniGraphContent(graphElement);
        } else if (graphElement.textContent.includes("Mini Graph 2 Placeholder")) {
            graphElement.dataset.panelType = "miniGraph2";
            storeAndHideOriginalMiniGraphContent(graphElement, "Mini Graph 2 Placeholder");
            displayDetailedMiniGraphContent(graphElement);
        } else if (graphElement.querySelector('#capital-evolution-graph')) {
            graphElement.dataset.panelType = "capitalEvolution";
            displayDetailedContentForLargeGraph(graphElement);
            // Optionally, notify panel3.js to render a detailed version
            // e.g., graphElement.querySelector('#capital-evolution-graph').dispatchEvent(new CustomEvent('graphEnlarged'));
        }

        // Hide the original 'i' button
        if (infoButtonInGraphElement) {
            infoButtonInGraphElement.style.display = 'none';
        }
        // Add a new 'X' close button
        addCloseButtonToEnlarged(graphElement);

        backdrop.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent body scroll
    }
}

function getOrCreateBackdrop() {
    let backdrop = document.getElementById('modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'modal-backdrop';
        // Apply Tailwind classes or set styles directly (as in CSS above)
        backdrop.className = 'fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-60 z-[999]';
        backdrop.style.display = 'none'; // Initially hidden
        backdrop.onclick = () => {
            const enlargedPanel = document.querySelector('.panel-enlarged');
            if (enlargedPanel) {
                enlargeGraph(enlargedPanel); // Close by clicking backdrop
            }
        };
        document.body.appendChild(backdrop);
    }
    return backdrop;
}

function addCloseButtonToEnlarged(panelElement) {
    let existingCloseButton = panelElement.querySelector('.close-enlarged-button');
    if (existingCloseButton) existingCloseButton.remove(); // Avoid duplicates

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;'; // Use HTML entity for 'X'
    // Using Tailwind classes for styling the close button
    closeButton.className = 'close-enlarged-button absolute top-3 right-3 text-2xl leading-none bg-gray-700 hover:bg-gray-900 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer focus:outline-none';
    closeButton.style.zIndex = '1005'; // Ensure it's above content
    closeButton.setAttribute('aria-label', 'Close dialog');
    closeButton.onclick = function(event) {
        event.stopPropagation(); // Prevent backdrop click if panel is also backdrop
        enlargeGraph(panelElement);
    };
    panelElement.appendChild(closeButton);
}

function storeAndHideOriginalMiniGraphContent(graphElement, placeholderTextContent) {
    // Find the text node containing the placeholder text
    let originalTextNode = null;
    for (const node of graphElement.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === placeholderTextContent.trim()) {
            originalTextNode = node;
            break;
        }
    }
    if (originalTextNode) {
        const tempSpan = document.createElement('span');
        tempSpan.textContent = originalTextNode.textContent;
        tempSpan.style.display = 'none'; // Hide it
        tempSpan.classList.add('original-mini-graph-content'); // Mark it
        graphElement.insertBefore(tempSpan, originalTextNode);
        graphElement.removeChild(originalTextNode);
        hiddenOriginalContentMap.set(graphElement, tempSpan);
    }
}

function restoreOriginalMiniGraphContent(graphElement) {
    const hiddenSpan = hiddenOriginalContentMap.get(graphElement);
    if (hiddenSpan && hiddenSpan.classList.contains('original-mini-graph-content')) {
        const originalTextNode = document.createTextNode(hiddenSpan.textContent);
        graphElement.insertBefore(originalTextNode, hiddenSpan);
        graphElement.removeChild(hiddenSpan); // Remove the temporary span
    }
    hiddenOriginalContentMap.delete(graphElement);
}

function displayDetailedMiniGraphContent(graphElement) {
    let existingDetailedArea = graphElement.querySelector('.detailed-content-area');
    if (existingDetailedArea) existingDetailedArea.remove(); // Clear previous

    const panelType = graphElement.dataset.panelType;
    let detailedHTML = '';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'detailed-content-area w-full h-full text-gray-700'; // Tailwind classes

    if (panelType === "miniGraph1") {
        detailedHTML = `<h4 class="text-xl font-semibold mb-3">Detailed View: Top 50 Countries</h4>
                        <ul class="list-decimal list-inside space-y-1 text-sm">`;
        for (let i = 1; i <= 50; i++) {
            detailedHTML += `<li>Country ${i} - Production Data: ${Math.floor(Math.random() * 10000) + 500} units</li>`;
        }
        detailedHTML += `</ul>`;
    } else if (panelType === "miniGraph2") {
        detailedHTML = `<h4 class="text-xl font-semibold mb-3">Detailed View: Graph 2 Analysis</h4>
                        <p class="text-sm mb-2">This graph now shows expanded data points and deeper analysis for various metrics.</p>
                        <div class="w-full h-64 bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-500">
                            [Placeholder: More complex interactive chart for Graph 2 would be rendered here]
                        </div>
                        <p class="mt-2 text-xs">Further details: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl eros, pulvinar facilisis justo mollis, auctor consequat urna.</p>`;
    }
    contentDiv.innerHTML = detailedHTML;
    graphElement.appendChild(contentDiv);
}

function displayDetailedContentForLargeGraph(graphElement) {
    // For the D3 graph, we mainly provide context. The SVG itself is expected to be handled by panel3.js.
    let existingTitle = graphElement.querySelector('.enlarged-panel-dynamic-title');
    if (existingTitle) existingTitle.remove();

    const title = document.createElement('h4');
    // Using Tailwind for styling the title
    title.className = 'enlarged-panel-dynamic-title text-xl font-semibold p-4 pb-0 text-gray-700';
    title.textContent = 'Capital Evolution - Detailed Interactive View';
    // Prepend title so SVG comes after it in flex-column layout
    graphElement.insertBefore(title, graphElement.firstChild);

    // The SVG (#capital-evolution-graph) is already part of graphElement.
    // Its size will be affected by the .panel-enlarged class on graphElement and specific CSS.
    // panel3.js should ideally listen for resize events on its container or be explicitly told to re-render.
    // Example:
    // const svgElement = graphElement.querySelector('#capital-evolution-graph');
    // if (svgElement && typeof panel3 !== 'undefined' && typeof panel3.updateGraphForEnlargedView === 'function') {
    //     panel3.updateGraphForEnlargedView(svgElement);
    // }
    console.log("Large graph panel enlarged. Expecting panel3.js to update SVG content for detailed view.");
}

// Ensure the DOM is loaded before trying to get the backdrop on initial script run (if getOrCreateBackdrop is called globally)
document.addEventListener('DOMContentLoaded', () => {
    // You can pre-initialize the backdrop if you want, or let enlargeGraph handle it on first click.
    // getOrCreateBackdrop();
});