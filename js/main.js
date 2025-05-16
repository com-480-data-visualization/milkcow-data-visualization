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
let totalInvestment = 0;

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

///////////////////////////////////////////////////////
// Initialize script
///////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', function() {
    //console.log('Document is fully loaded and parsed');
    displayYear();
    displayBudget();

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
    stateTooltip.style.left = (event.pageX + 20) + "px";
    stateTooltip.style.top = (event.pageY - 5) + "px";
}

function hideTooltip() {
    stateTooltip.classList.add('hidden');
}

investButton.addEventListener('click', handleInvestment);
nextYearButton.addEventListener('click', advanceYear);

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
    displayBudget();
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

function displayYear() {
    currentYearEl.textContent = currentYear;
}

function displayBudget() {
    budgetEl.textContent = budget.toLocaleString();
    const capital = budget + computeTotalInvestment(); // Total capital = budget + investments
    capitalEl.textContent = capital.toLocaleString();
}

function advanceYear() {
    
    applyPayoffs(); // Apply state payoffs
    currentYear++; // At last, increase current year counter

    // Update UI
    displayInvestments();
    displayBudget();
    displayYear();
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
function applyPayoffs() {
    us_states.forEach((state) => {
        const investment = investments[state] || 0; // invested amount
        const payoffs = calculateStatePayoffs(state, currentYear);
        investments[state] = investment + payoffs; // Do not give, just add to investment amount

        if (payoffs != 0) {
            console.log(`Payoff for ${state}: $${payoffs.toLocaleString()}`);
        }
    });

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

    // Set up SVG dimensions
    const margin = {top: 30, right: 30, bottom: 40, left: 70}, // Restore balanced margins
        width = 800 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

    // Center the SVG in the container
    const svg = d3.select('#graphs-area')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
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
        .attr('x', -height / 2)
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
    const container = d3.select('#product-price-graph');
    container.selectAll('*').remove();
    if (!window.milk_products_facts || !window.milk_products_columns) return;
    const selected = getSelectedProducts();
    if (selected.length === 0) {
        container.append('p').text('Select at least one product.');
        return;
    }
    const data = milk_products_facts;
    // Set up SVG
    const margin = {top: 30, right: 40, bottom: 80, left: 70},
        width = 800 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom + 40) // extra for legend
        .style('display', 'block')
        .style('margin', '0 auto')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    // X and Y scales
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);
    const y = d3.scaleLinear()
        .domain([0, d3.max(selected.map(col => d3.max(data, d => d[col])))])
        .nice()
        .range([height, 0]);
    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format('d')));
    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(8));
    // Color scale
    const color = d3.scaleOrdinal()
        .domain(selected)
        .range(d3.schemeCategory10);
    // Draw lines
    selected.forEach((col, idx) => {
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d[col]));
        svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', color(col))
            .attr('stroke-width', 2.5)
            .attr('d', line)
            .attr('class', 'product-line');
    });
    // Tooltip group for all products
    const focus = svg.append('g')
        .style('display', 'none');
    // One circle per product
    selected.forEach((col, idx) => {
        focus.append('circle')
            .attr('r', 5)
            .attr('fill', color(col))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .attr('class', `focus-circle-${idx}`);
    });
    // Tooltip background
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
    // Tooltip text group
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
    // Overlay for mouse events
    svg.append('rect')
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
            const bisect = d3.bisector(d => d.year).left;
            const i = bisect(data, x0, 1);
            const d0 = data[i - 1];
            const d1 = data[i] || d0;
            const d = x0 - d0.year > d1.year - x0 ? d1 : d0;
            let tx = x(d.year);
            let ty = y(d[selected[0]]); // Use first product for vertical placement
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
                    .text(`${col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${d3.format(",.2f")(d[col])}`);
                // Move circle to correct y for each product
                focus.select(`.focus-circle-${idx}`)
                    .attr('cx', 0)
                    .attr('cy', y(d[col]) - y(d[selected[0]]));
            });
        });
    // Move legend below the graph, adapt spacing to product name length
    const legend = svg.append('g')
        .attr('class', 'product-legend')
        .attr('transform', `translate(0,${height + 50})`);
    let legendX = 0;
    selected.forEach((col, i) => {
        // Estimate text width (approx 8px per character + 30px for rect and padding)
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
    // X axis label
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 35)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-sm')
        .text('Year');
}

// TODO: Future Functions
/*
function loadYearData(year) {}


*/

