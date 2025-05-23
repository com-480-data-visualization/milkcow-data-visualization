// Tab switching logic
const tabGame = document.getElementById('tab-game');
const tabVisualizations = document.getElementById('tab-visualizations');
const gameTabContent = document.getElementById('game-tab-content');
const visualizationTabContent = document.getElementById('visualization-tab-content');

// Set initial state for both tabs
gameTabContent.classList.add('tab-active');
visualizationTabContent.classList.add('tab-right');

// Make sure no hidden classes are present
gameTabContent.classList.remove('hidden');
visualizationTabContent.classList.remove('hidden');

// Current active tab
let currentTab = 'game';

function setActiveTab(tab) {
    // Don't do anything if we're already on this tab
    if (tab === currentTab) return;

    // Update which tab is current
    currentTab = tab;

    // Update tab button styles
    if (tab === 'game') {
        tabGame.classList.add('border-blue-500', 'text-blue-700');
        tabGame.classList.remove('border-transparent', 'text-gray-500');
        tabVisualizations.classList.remove('border-blue-500', 'text-blue-700');
        tabVisualizations.classList.add('border-transparent', 'text-gray-500');

        // First position the game content - will be animated
        gameTabContent.classList.remove('tab-left', 'tab-right');
        gameTabContent.classList.add('tab-active');

        // Then position the visualization content
        visualizationTabContent.classList.remove('tab-active', 'tab-left');
        visualizationTabContent.classList.add('tab-right');
    } else {
        tabVisualizations.classList.add('border-blue-500', 'text-blue-700');
        tabVisualizations.classList.remove('border-transparent', 'text-gray-500');
        tabGame.classList.remove('border-blue-500', 'text-blue-700');
        tabGame.classList.add('border-transparent', 'text-gray-500');

        // First position the visualization content - will be animated
        visualizationTabContent.classList.remove('tab-left', 'tab-right');
        visualizationTabContent.classList.add('tab-active');

        // Then position the game content
        gameTabContent.classList.remove('tab-active', 'tab-right');
        gameTabContent.classList.add('tab-left');
    }
}

// Add click event listeners to tabs
tabGame.addEventListener('click', () => setActiveTab('game'));
tabVisualizations.addEventListener('click', () => setActiveTab('visualizations'));