const svg = d3.select("#us-map");
const width = 960;
const height = 600;
const projection = d3.geoAlbersUsa().scale(1100).translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

let currentYear = 1970;
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
const nextYearButton = document.getElementById('next-year-btn');
const investmentFeedback = document.getElementById('investment-feedback');
const investmentsList = document.getElementById('investments-list');
const currentYearEl = document.getElementById('current-year');
const capitalEl = document.getElementById('capital');

//////////////////////////////////////////////////////
// Initialize script
//////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', function() {
    //console.log('Document is fully loaded and parsed');
    updateYear();
    updateBudget();
    updateInvestmentMetric();

    // Tab switching functionality
    const tabGame = document.getElementById('tab-game');
    const tabVisualizations = document.getElementById('tab-visualizations');
    const gameTabContent = document.getElementById('game-tab-content');
    const visualizationsTabContent = document.getElementById('visualizations-tab-content');

    if (tabGame && tabVisualizations && gameTabContent && visualizationsTabContent) {
        tabGame.addEventListener('click', function() {
            // Update tab button styles
            tabGame.classList.add('border-blue-500', 'text-blue-700');
            tabGame.classList.remove('border-transparent', 'text-gray-500');
            tabVisualizations.classList.add('border-transparent', 'text-gray-500');
            tabVisualizations.classList.remove('border-blue-500', 'text-blue-700');
            
            // Show/hide content
            gameTabContent.classList.remove('hidden');
            visualizationsTabContent.classList.add('hidden');
        });

        tabVisualizations.addEventListener('click', function() {
            // Update tab button styles
            tabVisualizations.classList.add('border-blue-500', 'text-blue-700');
            tabVisualizations.classList.remove('border-transparent', 'text-gray-500');
            tabGame.classList.add('border-transparent', 'text-gray-500');
            tabGame.classList.remove('border-blue-500', 'text-blue-700');
            
            // Show/hide content
            visualizationsTabContent.classList.remove('hidden');
            gameTabContent.classList.add('hidden');
        });
    }

    const dropdownBtn = document.getElementById('product-dropdown-btn');
    const dropdownList = document.getElementById('product-dropdown-list');
    if (dropdownBtn && dropdownList) {
        dropdownBtn.addEventListener('click', function(e) {
            dropdownList.classList.toggle('hidden');
        });
        // Hide dropdown when clicking outside
        document.addEventListener('mousedown', function(e) {
            if (!dropdownBtn.contains(e.target) && !dropdownList.contains(e.target)) {
                dropdownList.classList.add('hidden');
            }
        });
        // Checkbox logic
        dropdownList.addEventListener('change', function(e) {
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
        visStateSelect.addEventListener('change', function() {
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

const investmentColorScale = d3.scaleLinear()
    .domain([0, 1]) // 0% to 100% of budget
    .range(["#cbd5e1", "#0000ff"]); // white to blue (Bootstrap blue)

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
    selectedStateInfoEl.textContent = "Error loading map data.";
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
        selectedStateInfoEl.textContent = stateName;

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
        selectedStateInfoEl.textContent = "None";
        investmentPanel.classList.add('hidden'); // Hide the panel

        // Remove graph when deselecting
        d3.select('#graphs-area').selectAll('*').remove();
    }
}

const stateTooltip = document.getElementById('tooltip');

function computeTotalInvestment() {
    return Object.values(investments).reduce((a, b) => a + b, 0);
}

function handleStateHover(event, d) {
    stateTooltip.classList.remove('hidden');
    const investment = investments[d.properties.name] || 0;
    const totalInvestment = computeTotalInvestment();
    const relativeInvestment = totalInvestment == 0 ? 0 : (100 * investment / totalInvestment);
    stateTooltip.innerHTML = `
        <div class="font-semibold text-sm">${d.properties.name}</div>
        <div class="text-xs text-gray-600">Invested: $${investment.toLocaleString()} (${relativeInvestment}%)</div>
    `;
}

function handleTooltipMove(event) {
    // Adjust tooltip position to be slightly to the left and below the cursor
    stateTooltip.style.left = (event.pageX + 20) + "px";
    stateTooltip.style.top = (event.pageY - 5) + "px";  // 15px 
}

function hideTooltip() {
    stateTooltip.classList.add('hidden');
}

investButton.addEventListener('click', handleInvestment);
investmentAmountInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission
        handleInvestment();
        investmentAmountInput.value = '';
    }
});
nextYearButton.addEventListener('click', advanceYear);

const MIN_INVESTMENT = 1000;

function handleInvestment() {
    if (!selectedStateData) return;

    const stateName = selectedStateData.properties.name;
    const amountString = investmentAmountInput.value;
    const amount = parseInt(amountString, 10);

    if (isNaN(amount) || amount < 0) {
        showFeedback("Please enter a valid positive amount.", true);
        return;
    }

    if (amount < MIN_INVESTMENT)
    {
        showFeedback(`Minimum investment is $${MIN_INVESTMENT.toLocaleString()}.`, true);
        return;
    }

    const currentInvestment = investments[stateName] || 0;
    const netChange = amount - currentInvestment;

    if (netChange > budget) {
        showFeedback(`Insufficient funds. You only have $${budget.toLocaleString()} available!`, true);
        return;
    }

    budget -= netChange;
    investments[stateName] = amount;

    // Remove investment entry if amount is 0
    if (investments[stateName] === 0) {
        delete investments[stateName];
    }

    // Update UI
    updateBudget();
    displayInvestments(); // Update the list display
    showFeedback(`Successfully invested $${amount.toLocaleString()} in ${stateName}.`, false);

    investmentAmountInput.max = budget + (investments[stateName] || 0);

    const statePath = svg.select(`.state[data-state-name="${stateName}"]`);
    if (statePath.node()) {
        //const totalInvestments = computeTotalInvestment();
        //const investmentRatio = totalInvestments ? 0 : investments[stateName] / totalInvestments;
        //statePath.style("fill", investmentColorScale(investmentRatio));
        statePath.classed("invested", investments[stateName] > 0);
    } else {
        console.warn(`Could not find SVG path for state: ${stateName}`);
    }

    // Dispatch an event to notify that investments have been updated
    document.dispatchEvent(new CustomEvent('investmentsUpdated'));
}

/////////////////////////////////////////////////////////////
// UI Update Functions
/////////////////////////////////////////////////////////////

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

    // Update investment metric
    updateInvestmentMetric();
}

function showFeedback(message, isError = false) {
    investmentFeedback.textContent = message;
    investmentFeedback.className = `mt-2 text-sm min-h-[1.25rem] ${isError ? 'text-red-600' : 'text-green-600'}`;
}

/////////////////////////////////////////////////////////////
// GAME MECHANICS IMPLEMENTED HERE
/////////////////////////////////////////////////////////////

function updateYear() {
    currentYearEl.textContent = currentYear;
}

function getCapital() {
    // Total capital = budget + investments
    return budget + computeTotalInvestment();
}

function updateBudget() {
    budgetEl.textContent = budget.toLocaleString();
    const capital = getCapital();
    capitalEl.textContent = capital.toLocaleString();
}

function advanceYear() {
    
    applyPayoffs(); // Apply state payoffs
    
    // Increase year but cap it at 2017
    if (currentYear < 2017) {
        currentYear++; // Increase current year counter only if it's less than 2017
    } else {
        showFeedback("You've reached the maximum year (2017). Cannot advance further.", true);
    }

    // Update UI
    displayInvestments();
    updateBudget();
    updateYear();
    updateProfitHistoryChart();
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
            console.log(`Payoff for ${state}: $${payoffs.toLocaleString()}`);
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

// === Visualization: Historical Milk Production Graph ===
function renderMilkProductionGraph(stateName) {
    // Remove any previous graph
    d3.select('#graphs-area').selectAll('*').remove();

    // Filter data for the selected state
    const stateData = state_milk_production.filter(d => d.state === stateName);
    if (!stateData || stateData.length === 0) {
        d3.select('#graphs-area').append('p').text('No data available for ' + stateName);
        return;
    }

    // Sort by year
    stateData.sort((a, b) => a.year - b.year);

    // Define plot area height
    const plotAreaHeight = 280; // Original calculated height (350 - 30 - 40)

    // Set up SVG dimensions
    const margin = {top: 30, right: 30, bottom: 70, left: 70}, // Increased bottom margin for legend
        width = 800 - margin.left - margin.right,
        height = plotAreaHeight; // Use defined plot area height

    // Center the SVG in the container
    const svg = d3.select('#graphs-area')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom) // Adjusted SVG height
        .style('display', 'block')
        .style('margin', '0 auto')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // X and Y scales
    const x = d3.scaleLinear()
        .domain(d3.extent(stateData, d => d.year))
        .range([0, width]);
    const y = d3.scaleLinear()
        .domain([0, d3.max(stateData, d => d.milk_produced)])
        .range([height, 0]);

    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format('d')));
    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y)
            .ticks(8)
            .tickFormat(d => d3.format(",.0f")(d / 1e6) + 'M')
        );

    // Line generator
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.milk_produced));

    // Draw line
    svg.append('path')
        .datum(stateData)
        .attr('fill', 'none')
        .attr('stroke', '#2563eb')
        .attr('stroke-width', 2.5)
        .attr('d', line)
        .attr('class', 'milk-line');

    // Create a group for the events to ensure they're added after the main line
    const eventsGroup = svg.append('g')
        .attr('class', 'events-group');

    // Load events data
    const eventsFilePath = "dataset/Dairy_Industry_Historical_Events.csv"; // "./dataset/events.csv";
    d3.csv(eventsFilePath).then(eventsData => {
        // Debug info
        console.log("Events data loaded:", eventsData);
        
        // Parse year values to numbers
        eventsData.forEach(d => {
            // Check if the year contains a hyphen (like "2017-2018")
            if (d.Year.includes('-')) {
                // Extract just the first year from ranges like "2017-2018"
                d.Year = +d.Year.split('-')[0];
            } else {
                // Convert to number
                d.Year = +d.Year;
            }
        });
        
        // Filter events based on graph's year range and scope
        const yearRange = d3.extent(stateData, d => d.year);
        console.log("Year range for filtering:", yearRange);
        
        const filteredEvents = eventsData.filter(d => {
            const inYearRange = d.Year >= yearRange[0] && d.Year <= yearRange[1];
            const isNational = d.Scope === 'National';
            const stateRegex = new RegExp(`\\b${stateName}\\b`, 'i'); // case-insensitive whole word match
            const matchesState = stateRegex.test(d.Scope);
            return inYearRange && (isNational || matchesState);
        });
        
        console.log("Filtered events:", filteredEvents);
        
        // Clear any existing event elements
        eventsGroup.selectAll('*').remove();
        
        // Add event markers
        eventsGroup.selectAll('.event-marker')
            .data(filteredEvents)
            .enter()
            .append('circle')
            .attr('class', 'event-marker')
            .attr('cx', d => x(d.Year))
            .attr('cy', height) // Position on the x-axis
            .attr('r', 7) // Slightly larger radius
            .attr('fill', d => d.Scope === 'National' ? '#f59e0b' : '#10b981') // Orange for national, green for state
            .attr('stroke', '#fff')
            .attr('stroke-width', 2) // Thicker stroke
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                // Show event tooltip
                const tooltip = d3.select('#graphs-area')
                    .append('div')
                    .attr('class', 'event-tooltip')
                    .style('position', 'absolute')
                    .style('background', 'white')
                    .style('border', '1px solid #2563eb')
                    .style('border-radius', '6px')
                    .style('padding', '10px')
                    .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)')
                    .style('pointer-events', 'none')
                    .style('z-index', 10)
                    .style('max-width', '250px')
                    .style('opacity', 0)
                    .style('transition', 'opacity 0.2s ease');
                
                tooltip.html(`
                    <div style="font-weight: bold; color: #2563eb; margin-bottom: 5px">${d.Year}: ${d.Event}</div>
                    <div style="font-size: 13px">${d.Description}</div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 5px">Scope: ${d.Scope}</div>
                `);
                
                // Position tooltip
                const tooltipNode = tooltip.node();
                const xPos = x(d.Year) + margin.left;
                
                // Find the y-position on the line for this year
                const yearData = stateData.find(sd => sd.year === d.Year);
                const yPos = yearData 
                    ? y(yearData.milk_produced) + margin.top + 5 // Position near the data point
                    : height / 2 + margin.top; // Fallback position if no data
                
                const tooltipWidth = tooltipNode.getBoundingClientRect().width;
                const graphRight = svg.node().getBoundingClientRect().right;
                
                // Adjust position if tooltip would go off the right edge of the graph
                const adjustedX = xPos + tooltipWidth > graphRight 
                    ? xPos - tooltipWidth - 10 
                    : xPos + 10;
                
                tooltip
                    .style('left', `${adjustedX}px`)
                    .style('top', `${yPos}px`)
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
                
                // Highlight this marker
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 8)
                    .attr('stroke-width', 2);
            })
            .on('mouseout', function() {
                // Remove tooltip immediately
                d3.select('.event-tooltip').remove();
                
                // Restore marker size
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 6)
                    .attr('stroke-width', 1.5);
            });
        
        // Add vertical lines from markers to the graph
        eventsGroup.selectAll('.event-line')
            .data(filteredEvents)
            .enter()
            .append('line')
            .attr('class', 'event-line')
            .attr('x1', d => x(d.Year))
            .attr('y1', height) // Start at the x-axis
            .attr('x2', d => x(d.Year))
            .attr('y2', d => { // End at the Y value of the milk production line for that year
                const stateYearData = stateData.find(sd => sd.year === d.Year);
                return stateYearData ? y(stateYearData.milk_produced) : height; // If no data, draw to x-axis
            })
            .attr('stroke', d => d.Scope === 'National' ? '#f59e0b' : '#10b981')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .attr('opacity', 0.6)
            .style('cursor', 'pointer')
            .attr('stroke-linecap', 'round') // Rounded line ends
            .style('pointer-events', 'visibleStroke'); // Ensure the line can capture mouse events
        
        // Add a legend for events
        const legendGroup = svg.append('g')
            .attr('class', 'events-legend')
            .attr('transform', `translate(10, ${height + 55})`); // Position below the graph
        
        // National events
        legendGroup.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 5)
            .attr('fill', '#f59e0b')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);
        
        legendGroup.append('text')
            .attr('x', 10)
            .attr('y', 4)
            .attr('font-size', 12)
            .text('National Events');
        
        // State events
        legendGroup.append('circle')
            .attr('cx', 120)
            .attr('cy', 0)
            .attr('r', 5)
            .attr('fill', '#10b981')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);
        
        legendGroup.append('text')
            .attr('x', 130)
            .attr('y', 4)
            .attr('font-size', 12)
            .text('State Events');

        eventsGroup.raise(); // Ensure eventsGroup is on top to receive mouse events
    })
    .catch(error => {
        console.error('Error loading events data:', error);
    });

    // Tooltip group
    const focus = svg.append('g')
        .style('display', 'none');

    focus.append('circle')
        .attr('r', 6)
        .attr('fill', '#2563eb')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    focus.append('rect')
        .attr('class', 'tooltip-bg')
        .attr('x', 10)
        .attr('y', -22)
        .attr('width', 120)
        .attr('height', 36)
        .attr('rx', 6)
        .attr('fill', 'white')
        .attr('stroke', '#2563eb')
        .attr('stroke-width', 1.5)
        .style('opacity', 0.95);

    focus.append('text')
        .attr('class', 'tooltip-year')
        .attr('x', 18)
        .attr('y', -8)
        .attr('font-size', 13)
        .attr('font-weight', 'bold');
    focus.append('text')
        .attr('class', 'tooltip-value')
        .attr('x', 18)
        .attr('y', 10)
        .attr('font-size', 13);

    // Overlay for mouse events
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseover', () => focus.style('display', null))
        .on('mouseout', () => focus.style('display', 'none'))
        .on('mousemove', function(event) {
            const bisect = d3.bisector(d => d.year).left;
            const mouse = d3.pointer(event, this);
            const x0 = x.invert(mouse[0]);
            const i = bisect(stateData, x0, 1);
            const d0 = stateData[i - 1];
            const d1 = stateData[i] || d0;
            const d = x0 - d0.year > d1.year - x0 ? d1 : d0;
            let tx = x(d.year);
            let ty = y(d.milk_produced);
            // Adjust tooltip position if near right edge
            let tooltipWidth = 130; // width of tooltip rect + some margin
            if (tx + tooltipWidth > width) {
                focus.select('rect.tooltip-bg').attr('x', -tooltipWidth - 10);
                focus.select('.tooltip-year').attr('x', -tooltipWidth - 5);
                focus.select('.tooltip-value').attr('x', -tooltipWidth - 5);
            } else {
                focus.select('rect.tooltip-bg').attr('x', 10);
                focus.select('.tooltip-year').attr('x', 18);
                focus.select('.tooltip-value').attr('x', 18);
            }
            focus.attr('transform', `translate(${tx},${ty})`);
            focus.select('.tooltip-year').text('Year: ' + d.year);
            focus.select('.tooltip-value').text('Milk: ' + d3.format(",.0f")(d.milk_produced));
        });

    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-lg font-semibold')
        .text('Historical Milk Production in ' + stateName);

    // Y axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -60)
        .attr('x', (-height / 2) - 15)
        .attr('dy', '1em')
        .attr('text-anchor', 'middle')
        .attr('class', 'text-sm')
        .text('Milk Produced (pounds)');
    // X axis label
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 35)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-sm')
        .text('Year');
}

// === Product Price Evolution Visualization: Custom Multi-Select Dropdown ===
function populateProductSelect() {
    const dropdownList = document.getElementById('product-dropdown-list');
    if (!dropdownList || !window.milk_products_columns) return;
    dropdownList.innerHTML = '';
    // Exclude 'fluid_milk' from the product list
    const filteredColumns = milk_products_columns.filter(col => col !== 'fluid_milk');
    filteredColumns.forEach((col, idx) => {
        const id = `product-checkbox-${idx}`;
        const item = document.createElement('div');
        item.className = 'flex items-center px-2 py-1 hover:bg-slate-100 cursor-pointer';
        item.innerHTML = `
            <input type="checkbox" id="${id}" value="${col}" class="mr-2">
            <label for="${id}" class="truncate cursor-pointer select-none">${col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
        `;
        dropdownList.appendChild(item);
    });
    // Default select first 2 products
    let checked = 0;
    dropdownList.querySelectorAll('input[type="checkbox"]').forEach((cb, i) => {
        if (checked < 2) { cb.checked = true; checked++; }
    });
    updateProductDropdownLabel();
    renderProductPriceGraph();
}

function getSelectedProducts() {
    const dropdownList = document.getElementById('product-dropdown-list');
    if (!dropdownList) return [];
    // Exclude 'fluid_milk' from selection
    return Array.from(dropdownList.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value)
        .filter(col => col !== 'fluid_milk')
        .slice(0, 4);
}

function updateProductDropdownLabel() {
    const label = document.getElementById('product-dropdown-label');
    const selected = getSelectedProducts();
    if (selected.length === 0) {
        label.textContent = 'Select products...';
    } else {
        label.textContent = selected.map(col => col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
    }
}

function renderProductPriceGraph() {
    // Check if console logger exists to help with debugging
    const debug = true;
    const logDebug = (msg) => { if (debug) console.log(msg); };
    
    logDebug("Rendering product price graph...");
    
    const container = d3.select('#product-price-graph');
    container.selectAll('*').remove();
    if (!window.milk_products_facts || !window.milk_products_columns) return;
    const selected = getSelectedProducts();
    if (selected.length === 0) {
        container.append('p').text('Select at least one product.');
        return;
    }
    
    // Deep copy the data to prevent any unintended modifications
    const data = JSON.parse(JSON.stringify(milk_products_facts));
    logDebug(`Dataset has ${data.length} records`);
    
    // Layout constants
    const margin = {top: 30, right: 40, bottom: 60, left: 70};
    const legendHeight = 30;
    const brushHeight = 50;
    const brushMargin = 40;
    const width = 800 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;
    
    // Increase SVG height to fit graph + legend + brush + extra spacing
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom + legendHeight + brushHeight + brushMargin + 60)
        .style('display', 'block')
        .style('margin', '0 auto')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // X and Y scales
    const years = d3.extent(data, d => d.year);
    let [minYear, maxYear] = years;
    let selectedRange = [minYear, maxYear];
    
    logDebug(`Year range: ${minYear} - ${maxYear}`);
    
    // Main scales for the graph
    const x = d3.scaleLinear()
        .domain(selectedRange)
        .range([0, width]);
    
    // Calculate y domain based on the selected products
    const yMax = d3.max(selected.map(col => d3.max(data, d => +d[col])));
    logDebug(`Y-axis max value: ${yMax}`);
    
    const y = d3.scaleLinear()
        .domain([0, yMax * 1.1]) // Add 10% padding
        .nice()
        .range([height, 0]);
    
    // A separate scale for the brush (always shows full range)
    const xBrush = d3.scaleLinear()
        .domain(years)
        .range([0, width]);
    
    // X axis (main)
    const xAxis = d3.axisBottom(x).tickFormat(d3.format('d'));
    const xAxisG = svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .attr('class', 'main-x-axis')
        .call(xAxis);
    
    // Y axis
    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y).ticks(8));
    
    // Color scale
    const color = d3.scaleOrdinal()
        .domain(selected)
        .range(d3.schemeCategory10);
    
    // Function to filter data based on selected year range
    function filterData(range) {
        const filtered = data.filter(d => +d.year >= range[0] && +d.year <= range[1]);
        logDebug(`Filtered data to ${filtered.length} points in range ${range[0]}-${range[1]}`);
        return filtered;
    }
    
    // --- Draw lines and tooltip ---
    function drawLines(filteredData) {
        logDebug(`Drawing lines for ${filteredData.length} data points with year range ${selectedRange[0]}-${selectedRange[1]}`);
        
        // Update x-domain based on selection
        x.domain([selectedRange[0], selectedRange[1]]);
        
        // Update x-axis with new domain
        xAxisG.transition()
            .duration(300)
            .call(xAxis);
        
        // Remove existing lines before redrawing
        svg.selectAll('.product-line').remove();
        
        // Draw lines for each selected product
        selected.forEach((col, idx) => {
            const line = d3.line()
                .x(d => x(+d.year))
                .y(d => y(+d[col]))
                .defined(d => !isNaN(+d[col]) && +d[col] !== 0); // Handle missing values
            
            svg.append('path')
                .datum(filteredData)
                .attr('fill', 'none')
                .attr('stroke', color(col))
                .attr('stroke-width', 2.5)
                .attr('d', line)
                .attr('class', 'product-line');
        });
        
        // Remove and re-add tooltip group and overlay for correct z-order
        svg.selectAll('.focus-group').remove();
        svg.selectAll('.overlay-rect').remove();
        
        // Create tooltip elements
        const focus = svg.append('g')
            .attr('class', 'focus-group')
            .style('display', 'none');
        
        selected.forEach((col, idx) => {
            focus.append('circle')
                .attr('r', 5)
                .attr('fill', color(col))
                .attr('stroke', '#fff')
                .attr('stroke-width', 1.5)
                .attr('class', `focus-circle-${idx}`);
        });
        
        focus.append('rect')
            .attr('class', 'tooltip-bg')
            .attr('x', 10)
            .attr('y', -22)
            .attr('width', 220)
            .attr('height', 24 + 20 * selected.length)
            .attr('rx', 6)
            .attr('fill', 'white')
            .attr('stroke', '#2563eb')
            .attr('stroke-width', 1.5)
            .style('opacity', 0.97);
        
        const tooltipText = focus.append('g').attr('class', 'tooltip-text-group');
        tooltipText.append('text')
            .attr('class', 'tooltip-year')
            .attr('x', 18)
            .attr('y', -6)
            .attr('font-size', 13)
            .attr('font-weight', 'bold');
        
        selected.forEach((col, idx) => {
            tooltipText.append('text')
                .attr('class', `tooltip-value-${idx}`)
                .attr('x', 18)
                .attr('y', 16 + idx * 18)
                .attr('font-size', 13)
                .attr('fill', color(col));
        });
        
        // Add overlay for tooltip interaction
        svg.append('rect')
            .attr('class', 'overlay-rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .on('mouseover', () => focus.style('display', null))
            .on('mouseout', () => focus.style('display', 'none'))
            .on('mousemove', function(event) {
                const mouse = d3.pointer(event, this);
                const x0 = x.invert(mouse[0]);
                
                // Find closest year
                const bisect = d3.bisector(d => +d.year).left;
                const i = bisect(filteredData, x0, 1);
                if (i === 0 || i >= filteredData.length) return; // Prevent index error
                
                const d0 = filteredData[i - 1];
                const d1 = i < filteredData.length ? filteredData[i] : d0;
                const d = x0 - d0.year > d1.year - x0 ? d1 : d0;
                
                let tx = x(+d.year);
                let ty = y(+d[selected[0]]); // Use first product for vertical placement
                
                // Adjust tooltip position if near right edge
                let tooltipWidth = 230;
                if (tx + tooltipWidth > width) {
                    focus.select('rect.tooltip-bg').attr('x', -tooltipWidth - 10);
                    focus.select('.tooltip-text-group').attr('transform', `translate(${-tooltipWidth - 20},0)`);
                } else {
                    focus.select('rect.tooltip-bg').attr('x', 10);
                    focus.select('.tooltip-text-group').attr('transform', 'translate(0,0)');
                }
                
                focus.attr('transform', `translate(${tx},${ty})`);
                focus.select('.tooltip-year').text('Year: ' + d.year);
                
                selected.forEach((col, idx) => {
                    focus.select(`.tooltip-value-${idx}`)
                        .text(`${col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${d3.format(",.2f")(+d[col])}`);
                    focus.select(`.focus-circle-${idx}`)
                        .attr('cx', 0)
                        .attr('cy', y(+d[col]) - y(+d[selected[0]]));
                });
            });
    }
    
    // Draw initial graph with all data
    let filteredData = filterData(selectedRange);
    drawLines(filteredData);
    
    // --- Legend below graph ---
    const legendY = height + 35;
    const legend = svg.append('g')
        .attr('class', 'product-legend')
        .attr('transform', `translate(0,${legendY})`);
    
    let legendX = 0;
    selected.forEach((col, i) => {
        const label = col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const textWidth = label.length * 8 + 30;
        
        legend.append('rect')
            .attr('x', legendX)
            .attr('y', 0)
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', color(col));
        
        legend.append('text')
            .attr('x', legendX + 26)
            .attr('y', 13)
            .attr('font-size', 13)
            .text(label);
        
        legendX += textWidth;
    });
    
    // --- Brush (slider) below legend ---
    const brushY = legendY + legendHeight + 20; // Increased margin
    
    // Display selected year range
    const rangeDisplay = svg.append('text')
        .attr('x', width / 2)
        .attr('y', brushY - 10)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-sm font-semibold text-blue-600')
        .text(`Selected Years: ${minYear} - ${maxYear}`);
    
    // Create the brush
    const brush = d3.brushX()
        .extent([[0, brushY], [width, brushY + brushHeight]])
        .on('brush end', brushed); // Handle both brush and end events
    
    // Create a group for the brush
    const brushG = svg.append('g')
        .attr('class', 'x-brush')
        .call(brush);
    
    // Style the brush handles and overlay
    brushG.selectAll('.overlay')
        .attr('cursor', 'crosshair');
    
    brushG.selectAll('.selection')
        .attr('fill', '#a0c4ff')
        .attr('stroke', '#2563eb')
        .attr('fill-opacity', 0.3);
    
    brushG.selectAll('.handle')
        .attr('fill', '#2563eb')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);
    
    // Draw brush axis below brush
    svg.append('g')
        .attr('transform', `translate(0,${brushY + brushHeight})`)
        .call(d3.axisBottom(xBrush).tickFormat(d3.format('d')));
    
    // Set initial brush selection to full range
    brushG.call(brush.move, [xBrush(minYear), xBrush(maxYear)]);
    
    // --- Brush event handler ---
    function brushed(event) {
        // Do nothing if the brush selection is cleared
        if (!event.selection) return;
        
        let [x0, x1] = event.selection;
        
        // Convert brush positions to year values using the brush's scale
        let year0 = Math.round(xBrush.invert(x0));
        let year1 = Math.round(xBrush.invert(x1));
        
        // Swap if needed
        if (year0 > year1) [year0, year1] = [year1, year0];
        
        // Prevent empty selection (minimum 1 year)
        if (year0 === year1) {
            if (year0 > minYear) year0--;
            else if (year1 < maxYear) year1++;
        }
        
        // Ensure years are within bounds
        selectedRange = [
            Math.max(minYear, year0), 
            Math.min(maxYear, year1)
        ];
        
        // Update the range display
        rangeDisplay.text(`Selected Years: ${selectedRange[0]} - ${selectedRange[1]}`);
        
        // Only do the full update on the end event (not during dragging)
        // or if we're specifically on a mouse up event
        const isEndEvent = event.type === 'end' || event.sourceEvent && event.sourceEvent.type === 'mouseup';
        
        // Always filter data
        filteredData = filterData(selectedRange);
        
        // Check if we have data in the selected range
        if (filteredData.length === 0) {
            console.warn("No data available in selected year range");
            return;
        }
        
        // Always redraw the graph with the updated data
        drawLines(filteredData);
        
        logDebug(`Brush event: ${event.type}, Year range: ${selectedRange[0]}-${selectedRange[1]}`);
    }
    
    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-lg font-semibold')
        .text('Price Evolution of Selected Milk Products');
    
    // Y axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -55)
        .attr('x', -height / 2)
        .attr('dy', '1em')
        .attr('text-anchor', 'middle')
        .attr('class', 'text-sm')
        .text('Avg consumption in lbs per person');
    
    // X axis label - position it below the brush axis
    // svg.append('text')
    //     .attr('x', width / 2)
    //     .attr('y', brushY - 20)
    //     .attr('text-anchor', 'middle')
    //     .attr('class', 'text-sm')
    //     .text('Year');
    
    // Brush label
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', brushY + brushHeight + 55)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-xs text-gray-500')
        .text('Drag to select timeframe');
}