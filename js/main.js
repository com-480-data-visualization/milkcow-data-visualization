// To use if we decide to make a module out of this
// import { registerPanel, initPanels } from './panelManager.js';
// import { investmentPieChartPanelConfig } from './panelModules/investmentPieChartPanel.js';
// import { milkRankingPanelConfig } from './panelModules/milkRankingPanel.js';
// import { capitalEvolutionPanelConfig } from './panelModules/capitalEvolutionPanel.js';

const map_svg = d3.select("#us-map");
const width = 960;
const height = 600;
const projection = d3.geoAlbersUsa().scale(1100).translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);
const MAX_YEAR = 2017;
const PRETTY_DEC_FORMAT = ",.2~f";

let currentYear = 1970;
let selectedStateElement = null;
let selectedStateData = null;
let budget = 100000;
let investments = {};
let stateIndexMap = {}; // To map state names to their indices

const budgetEl = document.getElementById('budget');
const investmentPanel = document.getElementById('investment-panel');
const investmentLabel = document.getElementById('investment-label');
const investmentAmountInput = document.getElementById('investment-amount');
const investButton = document.getElementById('invest-button');
const nextYearButton = document.getElementById('next-year-btn');
const investmentFeedback = document.getElementById('investment-feedback');
const currentYearEl = document.getElementById('current-year');
const capitalEl = document.getElementById('capital');

//////////////////////////////////////////////////////
// Initialize script
//////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', function () {
    //console.log('Document is fully loaded and parsed');
    updateYear();
    updateBudget();
    updateInvestmentMetric();

    // Investor's panel init
    registerPanel(investmentPieChartPanelConfig);
    registerPanel(milkRankingPanelConfig);
    registerPanel(capitalEvolutionPanelConfig);
    initPanels();

    // Populate the diary product dropdown
    const dropdownBtn = document.getElementById('product-dropdown-btn');
    const dropdownList = document.getElementById('product-dropdown-list');
    if (dropdownBtn && dropdownList) {
        dropdownBtn.addEventListener('click', function (e) {
            dropdownList.classList.toggle('hidden');
        });
        // Hide dropdown when clicking outside
        document.addEventListener('mousedown', function (e) {
            if (!dropdownBtn.contains(e.target) && !dropdownList.contains(e.target)) {
                dropdownList.classList.add('hidden');
            }
        });
        // Checkbox logic
        dropdownList.addEventListener('change', function (e) {
            if (e.target.type === 'checkbox') {
                // Limit to 4 selections
                const checked = dropdownList.querySelectorAll('input[type="checkbox"]:checked');
                if (checked.length > 4) {
                    e.target.checked = false;
                    return;
                }
                updateProductDropdownLabel();
                renderProductPriceGraph();
            }
        });
    }
    // If data already loaded, populate
    if (window.milk_products_columns && milk_products_columns.length > 0) {
        populateProductSelect();
    }

    const visStateSelect = document.getElementById('visualization-state-select');
    if (visStateSelect) {
        // Populate the state-index dictionary
        for (let i = 0; i < visStateSelect.options.length; i++) {
            const stateName = visStateSelect.options[i].text;
            stateIndexMap[stateName] = visStateSelect.options[i].value;
        }
        visStateSelect.addEventListener('change', function () {
            const selectedState = visStateSelect.options[visStateSelect.selectedIndex].text;
            if (selectedState === 'All States' || !selectedState) {
                d3.select('#graphs-area').selectAll('*').remove();
                d3.select('#graphs-area').append('p').text('Select a state to view historical milk production.');
            } else {
                renderMilkProductionGraph(selectedState);
            }
        });
        // Optionally, trigger initial state
        d3.select('#graphs-area').selectAll('*').remove();
        d3.select('#graphs-area').append('p').text('Select a state to view historical milk production.');
    }
});

// const investmentColorScale = d3.scaleLinear()
//     .domain([0, 1]) // 0% to 100% of budget
//     .range(["#256400", "#0000ff"]); // white to green

// Load GeoJSON Data
const geoJsonUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

d3.json(geoJsonUrl).then(us => {
    const statesGeoJson = topojson.feature(us, us.objects.states);

    map_svg.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(statesGeoJson.features)
        .enter().append("path")
        .attr("class", "state")
        .attr("d", path)

        // Store state name in data attribute for easy selection later
        .attr("data-state-name", d => d.properties.name)

        // Click-on-state callback
        .on("click", handleStateClick)

        // Hover callbacks
        .on("mouseover", handleStateHover)
        .on("mousemove", handleTooltipMove)
        .on("mouseout", hideTooltip)

        ;

    console.log("Map loaded successfully.");

}).catch(error => {
    console.error("Error loading or processing map data:", error);
});

// Callback function when clicking on a state.
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

        // Show and configure investment panel
        investmentLabel.textContent = `Invest in ${stateName}:`;
        investmentAmountInput.value = investments[stateName] || '';
        investmentAmountInput.max = budget + (investments[stateName] || 0);
        investmentFeedback.textContent = '';
        investmentPanel.classList.remove('hidden');
        investmentAmountInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Smoothly scroll into view the input field
        renderMilkProductionGraph(stateName); // Render graph for selected state

        // Focus the input field after the scroll animation completes
        setTimeout(() => {
            investmentAmountInput.focus();
        }, 500); // 500ms matches the default smooth scroll duration
    } else {
        // Deselecting the current state (clicking it again)
        d3.select(clickedStateElement).classed("selected", false);
        selectedStateElement = null;
        selectedStateData = null;
        investmentPanel.classList.add('hidden'); // Hide the panel

        // Remove graph when deselecting
        d3.select('#graphs-area').selectAll('*').remove();
    }
}

const stateTooltip = document.getElementById('map-tooltip');

function computeTotalInvestment() {
    return Object.values(investments).reduce((a, b) => a + b, 0);
}

function handleStateHover(event, d) {
    stateTooltip.classList.remove('hidden');
    const investment = investments[d.properties.name] || 0;
    const totalInvestment = computeTotalInvestment();
    const relativeInvestment = totalInvestment == 0 ? 0 : (100 * investment / totalInvestment);
    stateTooltip.innerHTML = `
        <div class="font-semibold text-sm text-white">${d.properties.name}</div>
        <div class="text-xs text-white">Invested: $${d3.format(",.2f")(investment)} (${relativeInvestment}%)</div>
    `;
}

function handleTooltipMove(event) {
    // Adjust tooltip position to be slightly to the left and below the cursor
    stateTooltip.style.left = (event.pageX + 20) + "px";
    stateTooltip.style.top = (event.pageY + 15) + "px";
}

function hideTooltip() {
    stateTooltip.classList.add('hidden');
}

investButton.addEventListener('click', handleInvestment);
investmentAmountInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission
        handleInvestment();
        investmentAmountInput.value = '';
    }
});
nextYearButton.addEventListener('click', advanceYear);

// Not needed anymore since we use grouping by "Others", so we lowered to 100
const MIN_INVESTMENT = 100;

function handleInvestment() {
    if (!selectedStateData) return;

    const stateName = selectedStateData.properties.name;
    const amountString = investmentAmountInput.value;
    const amount = parseInt(amountString, 10);

    if (isNaN(amount) || amount < 0) {
        showFeedback("Please enter a valid positive amount.", true);
        return;
    }

    if (amount < MIN_INVESTMENT) {
        showFeedback(`Minimum investment is $${d3.format(",.2f")(MIN_INVESTMENT)}.`, true);
        return;
    }

    if (amount > budget) {
        showFeedback(`Insufficient funds. You only have $${d3.format(",.2f")(budget)} available!`, true);
        return;
    }

    budget -= amount;
    investments[stateName] = (investments[stateName] || 0) + amount;

    // Remove investment entry if amount is 0
    if (investments[stateName] === 0) {
        delete investments[stateName];
    }

    // Update UI
    updateBudget();
    updateInvestmentMetric();
    showFeedback(`Successfully invested $${d3.format(",.2f")(amount)} in ${stateName}.`, false);

    investmentAmountInput.max = budget + (investments[stateName] || 0);
    updateMap(stateName); // Update the map with the new investment
}

/////////////////////////////////////////////////////////////
// UI Update Functions
/////////////////////////////////////////////////////////////

function updateMap(stateName) {
    const statePath = map_svg.select(`.state[data-state-name="${stateName}"]`);
    if (statePath.node()) {
        // maybe try to fix this with a generic function that needs to go through all states
        // const totalInvestments = computeTotalInvestment();
        // const investmentRatio = totalInvestments ? 0 : investments[stateName] / totalInvestments;
        // statePath.style("fill", investmentColorScale(investmentRatio));
        statePath.classed("invested", investments[stateName] > 0);
    } else {
        console.warn(`Could not find SVG path for state: ${stateName}`);
    }

    // Dispatch an event to notify that investments have been updated
    document.dispatchEvent(new CustomEvent('investmentsUpdated'));
}

function showFeedback(message, isError = false) {
    investmentFeedback.textContent = message;
    investmentFeedback.className = `mt-2 text-sm min-h-[1.25rem] ${isError ? 'text-red-600' : 'text-green-600'}`;
}

function updateYear() {
    currentYearEl.textContent = currentYear;
    if (currentYear >= MAX_YEAR) {

        // Disable next year button
        nextYearButton.disabled = true;
        nextYearButton.textContent = "Game Over!";
        
        // Show and update the final score panel
        const finalScorePanel = document.getElementById('final-score-panel');
        const finalScoreElement = document.getElementById('final-score');
        finalScorePanel.classList.remove('hidden');
        finalScoreElement.textContent = formatDollar(getCapital());
    }
}

function formatDollar(value) {
    return d3.format(PRETTY_DEC_FORMAT)(value);
}

function updateBudget() {
    budgetEl.textContent = formatDollar(budget);
    const capital = getCapital();
    capitalEl.textContent = formatDollar(capital);
}

/////////////////////////////////////////////////////////////
// GAME MECHANICS IMPLEMENTED HERE
/////////////////////////////////////////////////////////////

function getCapital() {
    // Total capital = budget + investments
    return budget + computeTotalInvestment();
}

function advanceYear() {

    // Apply state payoffs
    applyPayoffs(); 

    // Increment year
    currentYear++;

    // Update UI
    updateInvestmentMetric();
    updateBudget();
    updateYear();
    // updateProfitHistoryChart(); now elsewhere
}

/**
 * 
 * @param {*} state State name (string)
 * @param {*} year Year (integer)
 * @returns Payoffs for investments made in milk production for given state and year.
 */
function calculateStatePayoffs(state, year) {
    const investment = investments[state] || 0; // invested amount
    if (investment == 0) return 0; // Small optimization

    delta_found = state_milk_production_delta.find(d => d.key === state).values.find(d => d.year === year);
    if (!delta_found) throw new Error(`No milk production delta found for state ${state} in year ${year}`);

    //.values.find(d => d.year === year);
    //console.log("delta found: ", delta_found, " for state: ", state, " year: ", year);
    const delta_relative = delta_found ? delta_found.delta_relative : 0; // relative delta

    console.log("delta relative: ", delta_relative, " for state: ", state, " year: ", year);

    const payoffs = investment * delta_relative; // Use randomGaussian for payoffs
    return payoffs; // Return calculated payoffs
}

// TODO make it use dataset data and not random increments
function applyPayoffs(current_year) {
    totalGains = 0;

    us_states.forEach((state) => {
        const investment = investments[state] || 0; // invested amount
        const payoffs = calculateStatePayoffs(state, currentYear);
        investments[state] = investment + payoffs; // Do not give, just add to investment amount
        totalGains += payoffs;

        if (payoffs != 0) {
            console.log(`Payoff for ${state}: $${d3.format(",.2f")(payoffs)}`);
        }
    });

    // Update gains chart
    totalGainsRelative = totalGains / getCapital() * 100;
    addToProfitHistoryChart(currentYear, totalGainsRelative);

    /*
    state_milk_production.forEach((d) => {
        if (d.state === state.properties.name && d.year === year) {
            console.log(`got ${investmentAmount} for state ${d.state}`)
            d.milk_produced += investmentAmount; // Increment milk production by investment amount
        }
    });
*/

}
