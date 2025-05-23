// Tab switching logic
const tabGame = document.getElementById('tab-game');
const tabVisualizations = document.getElementById('tab-visualizations');
const tabHowToPlay = document.getElementById('tab-howtoplay');
const gameTabContent = document.getElementById('game-tab-content');
const visualizationTabContent = document.getElementById('visualization-tab-content');
const howToPlayTabContent = document.getElementById('howtoplay-tab-content');

// Set initial state for both tabs
gameTabContent.classList.add('tab-active');
visualizationTabContent.classList.add('tab-right');
howToPlayTabContent.classList.add('tab-right');

// Make sure no hidden classes are present
gameTabContent.classList.remove('hidden');
visualizationTabContent.classList.remove('hidden');
howToPlayTabContent.classList.remove('hidden');

// Current active tab
let currentTab = 'game';

function setActiveTab(tab) {
    // Don't do anything if we're already on this tab
    if (tab === currentTab) return;

    // Update which tab is current
    currentTab = tab;

    // Update tab button styles
    const tabs = [
        { button: tabGame, id: 'game' },
        { button: tabVisualizations, id: 'visualizations' },
        { button: tabHowToPlay, id: 'howtoplay' }
    ];

    tabs.forEach(({ button, id }) => {
        if (tab === id) {
            button.classList.add('border-blue-500', 'text-blue-700');
            button.classList.remove('border-transparent', 'text-gray-500');
        } else {
            button.classList.remove('border-blue-500', 'text-blue-700');
            button.classList.add('border-transparent', 'text-gray-500');
        }
    });

    // Position the content based on the selected tab
    if (tab === 'game') {
        gameTabContent.classList.remove('tab-left', 'tab-right');
        gameTabContent.classList.add('tab-active');
        visualizationTabContent.classList.remove('tab-active', 'tab-left');
        visualizationTabContent.classList.add('tab-right');
        howToPlayTabContent.classList.remove('tab-active', 'tab-left');
        howToPlayTabContent.classList.add('tab-right');
    } else if (tab === 'visualizations') {
        visualizationTabContent.classList.remove('tab-left', 'tab-right');
        visualizationTabContent.classList.add('tab-active');
        gameTabContent.classList.remove('tab-active', 'tab-right');
        gameTabContent.classList.add('tab-left');
        howToPlayTabContent.classList.remove('tab-active', 'tab-left');
        howToPlayTabContent.classList.add('tab-right');
        // --- Custom logic: If no state is selected, render Alabama graph ---
        setTimeout(() => {
            const visStateSelect = document.getElementById('visualization-state-select');
            if (visStateSelect) {
                const selectedValue = visStateSelect.value;
                if (!selectedValue || selectedValue === '') {
                    // Set Alabama as selected and render
                    for (let i = 0; i < visStateSelect.options.length; i++) {
                        if (visStateSelect.options[i].value === 'AL') {
                            visStateSelect.selectedIndex = i;
                            break;
                        }
                    }
                    if (typeof renderMilkProductionGraph === 'function') {
                        renderMilkProductionGraph('Alabama');
                    }
                }
            }
        }, 0);
        // --- End custom logic ---
    } else if (tab === 'howtoplay') {
        howToPlayTabContent.classList.remove('tab-left', 'tab-right');
        howToPlayTabContent.classList.add('tab-active');
        gameTabContent.classList.remove('tab-active', 'tab-right');
        gameTabContent.classList.add('tab-left');
        visualizationTabContent.classList.remove('tab-active', 'tab-right');
        visualizationTabContent.classList.add('tab-left');
    }
}

// Add click event listeners to tabs
tabGame.addEventListener('click', () => setActiveTab('game'));
tabVisualizations.addEventListener('click', () => setActiveTab('visualizations'));
tabHowToPlay.addEventListener('click', () => setActiveTab('howtoplay'));