// --- panelModules/milkRankingPanel.js ---
// Assumes ranking.js functions (getRankingDataForYear, renderMiniGraph2, renderDetailedRanking) are available
// e.g., import { getRankingDataForYear, renderMiniGraph2, renderDetailedRanking } from '../ranking.js';

const milkRankingPanelConfig = {
    id: 'miniGraph2Panel',
    type: 'milkProductionRanking',
    enlargedTitle: 'Milk Production Ranking Details',

    renderSmallView: (containerElement, panelId) => {
        const currentYear = new Date().getFullYear();
        const rankingData = getRankingDataForYear(currentYear);
        // renderMiniGraph2 needs to be adapted to render into a passed container
        // For now, let's assume it clears and appends to containerElement.
        // containerElement.innerHTML = ''; // Clear if renderMiniGraph2 doesn't
        renderMiniGraph2(containerElement, rankingData, currentYear); // Modified signature
    },

    renderDetailedView: (containerElement, panelId) => {
        const currentYear = new Date().getFullYear();
        const currentRankingData = getRankingDataForYear(currentYear);
        const availableYears = [2023, 2024, 2025]; // Or fetch dynamically

        // renderDetailedRanking also needs to be adapted to render into containerElement
        // containerElement.innerHTML = ''; // Clear if renderDetailedRanking doesn't
        renderDetailedRanking(containerElement, currentRankingData, availableYears, currentYear); // Modified signature
    },

    onShrink: (originalContentContainer, panelId) => {
        const currentYear = new Date().getFullYear();
        const rankingData = getRankingDataForYear(currentYear);
        renderMiniGraph2(originalContentContainer, rankingData, currentYear);
    }
};