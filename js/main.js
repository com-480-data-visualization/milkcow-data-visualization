const svg = d3.select("#us-map");
const width = 960;
const height = 600;
const projection = d3.geoAlbersUsa().scale(1100).translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

let selectedStateElement = null; 
let selectedStateData = null;
let budget = 100000;
let investments = {};

const selectedStateInfoEl = document.getElementById('selected-state-info');
const budgetEl = document.getElementById('budget');
const investmentPanel = document.getElementById('investment-panel');
const investmentLabel = document.getElementById('investment-label');
const investmentAmountInput = document.getElementById('investment-amount');
const investButton = document.getElementById('invest-button');
const investmentFeedback = document.getElementById('investment-feedback');
const investmentsList = document.getElementById('investments-list');
// const currentYearEl = document.getElementById('current-year'); // For future use

budgetEl.textContent = budget.toLocaleString(); // Format initial budget display

// Load GeoJSON Data
const geoJsonUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

d3.json(geoJsonUrl).then(us => {
    const statesGeoJson = topojson.feature(us, us.objects.states);

    svg.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(statesGeoJson.features)
        .enter().append("path")
        .attr("class", "state")
        .attr("d", path)
        // Store state name in data attribute for easy selection later
        .attr("data-state-name", d => d.properties.name)
        .on("click", handleStateClick);

    console.log("Map loaded successfully.");

}).catch(error => {
    console.error("Error loading or processing map data:", error);
    selectedStateInfoEl.textContent = "Error loading map data.";
});

function handleStateClick(event, d) {
    const clickedStateElement = this;
    const stateName = d.properties.name;

    console.log("Clicked State:", stateName);

    if (selectedStateElement) {
        d3.select(selectedStateElement).classed("selected", false);
    }

    if (selectedStateElement !== clickedStateElement) {
        d3.select(clickedStateElement).classed("selected", true);
        selectedStateElement = clickedStateElement;
        selectedStateData = d;
        selectedStateInfoEl.textContent = stateName;

        // Show and configure investment panel
        investmentLabel.textContent = `Invest in ${stateName}:`;
        investmentAmountInput.value = investments[stateName] || '';
        investmentAmountInput.max = budget + (investments[stateName] || 0);
        investmentFeedback.textContent = '';
        investmentPanel.classList.remove('hidden');
        investmentAmountInput.focus();

    } else {
        // Deselecting the current state (clicking it again)
        d3.select(clickedStateElement).classed("selected", false);
        selectedStateElement = null;
        selectedStateData = null;
        selectedStateInfoEl.textContent = "None";
        investmentPanel.classList.add('hidden'); // Hide the panel
    }
}

investButton.addEventListener('click', handleInvestment);

function handleInvestment() {
    if (!selectedStateData) return;

    const stateName = selectedStateData.properties.name;
    const amountString = investmentAmountInput.value;
    const amount = parseInt(amountString, 10);

    if (isNaN(amount) || amount < 0) {
        showFeedback("Please enter a valid positive amount.", true);
        return;
    }

    const currentInvestment = investments[stateName] || 0;
    const netChange = amount - currentInvestment;

    if (netChange > budget) {
        showFeedback(`Insufficient funds. You only have $${budget.toLocaleString()} available for new investment.`, true);
        return;
    }

    budget -= netChange;
    investments[stateName] = amount;

    // Remove investment entry if amount is 0
    if (investments[stateName] === 0) {
        delete investments[stateName];
    }

    // Update UI 
    budgetEl.textContent = budget.toLocaleString();
    displayInvestments(); // Update the list display
    showFeedback(`Successfully invested $${amount.toLocaleString()} in ${stateName}.`, false);

    investmentAmountInput.max = budget + (investments[stateName] || 0);

    const statePath = svg.select(`.state[data-state-name="${stateName}"]`);
    if (statePath.node()) {
         // Add or remove 'invested' class based on whether the investment amount is > 0
        statePath.classed("invested", investments[stateName] > 0);
    } else {
        console.warn(`Could not find SVG path for state: ${stateName}`);
    }
}

// UI Update Functions

function displayInvestments() {
    investmentsList.innerHTML = '';
    const investedStates = Object.keys(investments);

    if (investedStates.length === 0) {
        investmentsList.innerHTML = '<li>None</li>';
        return;
    }

    investedStates.sort().forEach(stateName => {
        const amount = investments[stateName];
        if (amount > 0) {
            const li = document.createElement('li');
            li.textContent = `${stateName}: $${amount.toLocaleString()}`;
            investmentsList.appendChild(li);
        }
    });
}

function showFeedback(message, isError = false) {
    investmentFeedback.textContent = message;
    investmentFeedback.className = `mt-2 text-sm min-h-[1.25rem] ${isError ? 'text-red-600' : 'text-green-600'}`;
}


// TODO: Future Functions
/*
function loadYearData(year) {}
function calculateInvestmentReturn(state, investmentAmount, year) {}
function advanceYear() {}
*/

