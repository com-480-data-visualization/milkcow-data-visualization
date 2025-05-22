// --- panelManager.js ---
const hiddenOriginalContentMap = new Map();
let activePanelConfig = null; // To keep track of the current panel's config

function getOrCreateBackdrop() {
    let backdrop = document.getElementById('modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'modal-backdrop';
        backdrop.className = 'fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-60 z-[999]';
        backdrop.style.display = 'none';
        backdrop.onclick = () => {
            const enlargedPanelElement = document.querySelector('.panel-enlarged');
            if (enlargedPanelElement && activePanelConfig) {
                togglePanelEnlargement(enlargedPanelElement, activePanelConfig);
            }
        };
        document.body.appendChild(backdrop);
    }
    return backdrop;
}

function addCloseButtonToEnlarged(panelElement, panelConfig) {
    let existingCloseButton = panelElement.querySelector('.close-enlarged-button');
    if (existingCloseButton) existingCloseButton.remove();

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'close-enlarged-button absolute top-3 right-3 text-2xl leading-none bg-gray-700 hover:bg-gray-900 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer focus:outline-none';
    closeButton.style.zIndex = '1005';
    closeButton.setAttribute('aria-label', 'Close dialog');
    closeButton.onclick = function(event) {
        event.stopPropagation();
        togglePanelEnlargement(panelElement, panelConfig);
    };
    panelElement.appendChild(closeButton);
}

function storeAndHideOriginalContent(panelElement, panelConfig) {
    const originalContentWrapper = panelElement.querySelector('.panel-original-content');
    if (originalContentWrapper) {
        originalContentWrapper.style.display = 'none';
        hiddenOriginalContentMap.set(panelElement, originalContentWrapper);
    } else {
        // Fallback for content not wrapped, clone and hide
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        tempDiv.classList.add('panel-original-content-fallback');
        while (panelElement.firstChild) {
            tempDiv.appendChild(panelElement.firstChild);
        }
        panelElement.appendChild(tempDiv);
        hiddenOriginalContentMap.set(panelElement, tempDiv);
    }
}

function restoreOriginalContent(panelElement, panelConfig) {
    const storedElement = hiddenOriginalContentMap.get(panelElement);
    const detailedContentArea = panelElement.querySelector('.detailed-content-area');
    if (detailedContentArea) detailedContentArea.remove();

    if (storedElement) {
        if (storedElement.classList.contains('panel-original-content-fallback')) {
            while (storedElement.firstChild) {
                panelElement.appendChild(storedElement.firstChild);
            }
            storedElement.remove();
        } else {
            storedElement.style.display = ''; // Or original display style
        }
    }

    if (panelConfig.onShrink) {
        panelConfig.onShrink(panelElement.querySelector('.panel-original-content') || panelElement, panelConfig.id);
    }
    hiddenOriginalContentMap.delete(panelElement);
}

function togglePanelEnlargement(panelElement, panelConfig) {
    const backdrop = getOrCreateBackdrop();
    activePanelConfig = panelConfig; // Set active config

    if (panelElement.classList.contains('panel-enlarged')) {
        // --- SHRINK PANEL ---
        panelElement.classList.remove('panel-enlarged');
        panelElement.style.cssText = ''; // Reset inline styles

        if (panelElement._originalParent) {
            if (panelElement._originalNextSibling && panelElement._originalNextSibling.parentNode === panelElement._originalParent) {
                panelElement._originalParent.insertBefore(panelElement, panelElement._originalNextSibling);
            } else {
                panelElement._originalParent.appendChild(panelElement);
            }
            delete panelElement._originalParent;
            delete panelElement._originalNextSibling;
        }

        restoreOriginalContent(panelElement, panelConfig);

        const closeButton = panelElement.querySelector('.close-enlarged-button');
        if (closeButton) closeButton.remove();

        backdrop.style.display = 'none';
        document.body.style.overflow = '';
        activePanelConfig = null; // Clear active config

    } else {
        // --- ENLARGE PANEL ---
        const currentlyEnlarged = document.querySelector('.panel-enlarged');
        if (currentlyEnlarged && currentlyEnlarged !== panelElement) {
            // Find config for currently enlarged panel to shrink it properly
            const currentId = currentlyEnlarged.id;
            const currentConfig = panelRegistry.find(p => p.id === currentId);
            if(currentConfig) togglePanelEnlargement(currentlyEnlarged, currentConfig);
        }

        if (!panelElement._originalParent) {
            panelElement._originalParent = panelElement.parentNode;
            panelElement._originalNextSibling = panelElement.nextSibling;
            document.body.appendChild(panelElement);
        }

        panelElement.classList.add('panel-enlarged');
        Object.assign(panelElement.style, {
            position: 'fixed', left: '50%', top: '50%',
            width: '80vw', height: '80vh',
            transform: 'translate(-50%, -50%)',
            zIndex: '10001',
            display: 'flex', // Ensure flex for content alignment
            flexDirection: 'column',
            justifyContent: 'flex-start', // Usually content flows from top
            alignItems: 'stretch' // Stretch content horizontally
        });

        storeAndHideOriginalContent(panelElement, panelConfig);

        const detailedContentArea = document.createElement('div');
        detailedContentArea.className = 'detailed-content-area w-full h-full flex flex-col overflow-auto p-4'; // Added padding
        panelElement.appendChild(detailedContentArea);

        if (panelConfig.enlargedTitle) {
            const titleElement = document.createElement('h4');
            titleElement.className = 'enlarged-panel-dynamic-title text-xl font-semibold text-gray-700 text-center shrink-0';
            titleElement.textContent = panelConfig.enlargedTitle;
            detailedContentArea.appendChild(titleElement); // Add title to detailed area
        }

        if (panelConfig.renderDetailedView) {
            // Create a dedicated container within detailedContentArea for the chart/content itself
            const chartContainer = document.createElement('div');
            chartContainer.className = 'flex-grow'; // Allows this to take remaining space
            detailedContentArea.appendChild(chartContainer);
            panelConfig.renderDetailedView(chartContainer, panelConfig.id);
        }

        addCloseButtonToEnlarged(panelElement, panelConfig);
        backdrop.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

const panelRegistry = [];

function registerPanel(config) {
    panelRegistry.push(config);
}

function initPanels() {
    panelRegistry.forEach(panelConfig => {
        const panelElement = document.getElementById(panelConfig.id);
        if (panelElement) {
            // Wrap initial content for easier show/hide and restoration
            const originalContentWrapper = document.createElement('div');
            originalContentWrapper.className = 'panel-original-content w-full h-full';
            // Move existing children (like the SVG for capitalEvolution) into the wrapper
            while(panelElement.firstChild) {
                originalContentWrapper.appendChild(panelElement.firstChild);
            }
            panelElement.appendChild(originalContentWrapper);

            if (panelConfig.renderSmallView) {
                panelConfig.renderSmallView(originalContentWrapper, panelConfig.id);
            }

            panelElement.classList.add('cursor-pointer'); // Indicate clickable
            panelElement.addEventListener('click', (event) => {
                 // Prevent re-triggering if click is on something inside that already handled enlargement
                if (event.target.closest('.close-enlarged-button') || event.target.closest('.detailed-content-area')) {
                    if (!panelElement.classList.contains('panel-enlarged') && event.target !== panelElement) {
                        // If a click within the small view happens on an interactive element,
                        // but not the panel itself, you might want to still enlarge.
                        // This part depends on desired UX. For now, only direct clicks on panel or non-interactive children.
                    } else {
                        return;
                    }
                }
                if (panelElement.contains(event.target) && !event.target.closest('button, a, select, input')) {
                     togglePanelEnlargement(panelElement, panelConfig);
                }
            });
        } else {
            console.warn(`Panel element with ID '${panelConfig.id}' not found.`);
        }
    });
}

// Function to refresh a specific panel's small view
function refreshPanelSmallView(panelId, data) {
    const config = panelRegistry.find(p => p.id === panelId);
    const panelElement = document.getElementById(panelId);
    if (config && panelElement && config.renderSmallView) {
        const contentWrapper = panelElement.querySelector('.panel-original-content');
        if (contentWrapper) {
            config.renderSmallView(contentWrapper, panelId, data); // Pass new data
        }
    }
}