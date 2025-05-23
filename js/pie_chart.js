// --- Start of pie_chart.js ---

// --- Helper function to get and transform investment data for pie chart ---
function getInvestmentPieData() {
    // Access the global 'investments' object from main.js
    if (typeof investments === 'undefined' || Object.keys(investments).length === 0) {
        return []; // Return empty array if no investments or 'investments' is not defined
    }

    const colors = d3.scaleOrdinal(d3.schemeTableau10); // D3 color scheme

    // Sort investments by amount in descending order
    const sortedInvestments = Object.entries(investments)
        .filter(([, amount]) => amount > 0) // Only include states with actual investment
        .sort(([, amountA], [, amountB]) => amountB - amountA);

    // Take the top 9 states
    const topInvestments = sortedInvestments.slice(0, 9);

    // Calculate the sum of remaining states
    const otherInvestmentSum = sortedInvestments.slice(9).reduce((sum, [, amount]) => sum + amount, 0);

    // If there are no other investments, we don't need to add "Others" category
    const otherInvestmentData = sortedInvestments.slice(9).map(([stateName, amount]) => ({
        label: stateName,
        value: amount,
    }));

    // Map the top 9 states to the pie chart data format
    const pieData = topInvestments.map(([stateName, amount], index) => ({
        label: stateName,
        value: amount,
        color: colors(index), // Assign color based on index
        isOther: false, // Optional flag to identify "Other" category
        others_dict: {} // Placeholder for any additional data if needed
    }));

    // Add the "Other" category if there are remaining states
    if (otherInvestmentSum > 0) {
        pieData.push({
            label: "Others",
            value: otherInvestmentSum,
            color: colors(9), // Assign the 10th color to "Other"
            isOther: true, // Optional flag to identify "Other" category
            others_dict: otherInvestmentData
        });
    }

    return pieData;
}

// --- D3 Pie Chart Rendering Functions ---
function renderSmallPieChart(containerElement, data) {
    if (typeof d3 === 'undefined') { console.error("D3 library is not loaded."); return; }

    d3.select(containerElement).select("svg").remove(); // Clear previous SVG
    d3.select(containerElement).select(".custom-d3-tooltip").remove(); // Clear previous tooltip

    if (!data || data.length === 0) {
        containerElement.innerHTML = `
            <div class="portfolio-empty-state" style="display:flex; flex-direction:column; height:100%;">
                <h3 class="font-semibold text-gray-700 mb-4 text-center p-2" style="flex-shrink:0;">Portfolio</h3>
                <div class="portfolio-message-container" style="display:flex; justify-content:center; align-items:center; flex-grow:1;">
                    <p class="normal-text mb-4">No investments to display.</p>
                </div>
            </div>
        `;
        return;
    }

    // Compute dimensions for the svg container
    const containerRect = containerElement.getBoundingClientRect();
    containerElement.innerHTML = ""; // Clear all previous content

    const title = document.createElement("h3");
    title.textContent = "Portfolio";
    title.className = "font-semibold text-gray-700 text-center p-2";
    containerElement.appendChild(title);

    const titleHeight = title.getBoundingClientRect().height;
    const chartAreaHeight = containerRect.height - titleHeight - (parseFloat(getComputedStyle(title).paddingTop) + parseFloat(getComputedStyle(title).paddingBottom) + parseFloat(getComputedStyle(title).marginBottom) || 0);


    const width = containerRect.width > 20 ? containerRect.width : 120;
    const height = chartAreaHeight > 20 ? chartAreaHeight : 120;

    const minSvgDimension = Math.min(width, height);
    const radiusPadding = minSvgDimension > 100 ? 10 : (minSvgDimension > 40 ? 5 : 2); // Adjusted padding for very small charts
    let radius = minSvgDimension / 2 - radiusPadding;

    if (radius <= 0) { // Prevent negative or zero radius
        // console.warn("Calculated radius for small pie chart is too small or zero. Chart may not render.");
        // containerElement.innerHTML += "<p class='text-xs text-gray-400 text-center p-1'>Chart too small</p>";
        // Optionally provide a fallback or simply don't render the SVG if it's too small.
        // For now, we'll let it try, D3 might handle small radii gracefully to some extent.
        radius = Math.max(5, radius); // Ensure a tiny minimum radius if it was <=0
    }


    const svg = d3.select(containerElement)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    // Create the stylish tooltip div - append to containerElement so its position is relative to it
    // IMPORTANT: containerElement should have `position: relative;` in its CSS for this to work best.
    const tooltip = d3.select(containerElement)
        .append("div")
        .attr("class", "custom-d3-tooltip");

    svg.selectAll("path")
        .data(pie(data))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => d.data.color)
        .attr("stroke", "white")
        .style("stroke-width", "1px")
        .on("mouseover", function (event, d) {
            // d3.select(this)
            //     .transition()
            //     .duration(100)
            //     .attr("opacity", 0.8); // Slight visual feedback on hover

            tooltip.transition()
                .duration(100)
                .style("opacity", 1); // Fade in tooltip

            tooltip.html(`<p>${d.data.label}: $${d3.format(",.2f")(d.data.value)}</p>`);
        })
        .on("mousemove", function (event) {
            // Get coordinates relative to the containerElement
            // This assumes containerElement has position: relative or similar
            const [x, y] = d3.pointer(event, containerElement);

            // Adjust position to be slightly offset from the cursor
            // and try to keep tooltip within viewport (very basic boundary detection)
            let left = x + 20;
            let top = y + 20; // Position above cursor initially

            // Basic boundary check (assumes tooltip node is available and has dimensions)
            const tooltipNode = tooltip.node();
            if (tooltipNode) {
                const ttWidth = tooltipNode.offsetWidth;
                const ttHeight = tooltipNode.offsetHeight;

                // if (left + ttWidth > containerRect.width) {
                //     left = x - ttWidth - 15; // Move to left of cursor
                // }
                if (top - ttHeight < 0 && y + ttHeight + 15 < containerRect.height) { // If moving above goes out of bounds, try below
                    top = y + 15;
                } else if (top < 0) { // Still out of bounds (top)
                    top = 5; // Pin to top edge
                }

            }

            tooltip.style("left", `${left}px`)
                .style("top", `${top}px`);
        })
        .on("mouseout", function () {
            // d3.select(this)
            //     .transition()
            //     .duration(100)
            //     .attr("opacity", 1); // Restore opacity

            tooltip.transition()
                .duration(100)
                .style("opacity", 0); // Fade out tooltip
        });
}

function renderInteractivePieChart(chartContainerId, legendContainerId, data, previouslySelectedLabel = null) { // Added previouslySelectedLabel
    if (typeof d3 === 'undefined') { console.error("D3 library is not loaded."); return; }

    const chartDiv = document.getElementById(chartContainerId);
    const legendDiv = document.getElementById(legendContainerId);

    // Assume 'budget' is a global variable, accessible here.
    // Ensure 'budget' is defined, e.g., in main.js: let budget = 100000;
    // Ensure 'investments' is defined, e.g., in main.js: let investments = {};

    if (!chartDiv || !legendDiv) {
        console.error("Chart or Legend container not found for interactive pie chart.");
        return;
    }

    // Ensure legendDiv itself is a flex container to manage top/bottom sections
    legendDiv.style.display = "flex";
    legendDiv.style.flexDirection = "column";
    legendDiv.style.height = "100%"; // Ensure it takes full height to allow content centering

    d3.select(chartDiv).select("svg").remove();

    const capitalDisplayHTMLBase = () => `
        <div class="legend-capital-display font-semibold normal-text mb-2 mt-2">
            Current Liquidity: $${d3.format(",.2f")(typeof budget !== 'undefined' ? budget : 0)}
        </div>
    `;

    // This wrapper will center the content passed to it, and it will grow to fill available space
    const legendContentWrapper = (content) => `
        <div class="legend-main-content-wrapper" style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; overflow-y: auto;">
            ${content}
        </div>
    `;

    if (!data || data.length === 0) {
        chartDiv.innerHTML = "<p class='normal-text text-center p-4'>No investments to display.</p>";
        legendDiv.innerHTML = capitalDisplayHTMLBase() + legendContentWrapper("<p class='normal-text p-4'>Make an investment to see the chart.</p>");
        return;
    }

    const chartRect = chartDiv.getBoundingClientRect();

    let width = chartRect.width;
    let height = chartRect.height;

    const MIN_CHART_DIMENSION = 50;
    if (width < MIN_CHART_DIMENSION || height < MIN_CHART_DIMENSION) {
        chartDiv.innerHTML = "<p class='text-xs text-gray-500 text-center p-1'>Chart area too small</p>";
        legendDiv.innerHTML = capitalDisplayHTMLBase() + legendContentWrapper("<p class='text-xs text-gray-500 p-1'>Chart area too small to display details.</p>");
        return;
    }

    chartDiv.innerHTML = "";
    // legendDiv.innerHTML = ""; // Will be populated by capital + wrapped content

    const marginForRadius = Math.min(width, height) * 0.1;
    let radius = Math.min(width, height) / 2 - marginForRadius;

    if (width <= 0 || height <= 0 || radius <= 0) {
        console.warn("Interactive pie chart dimensions or radius invalid.", { width, height, radius, chartRect });
        chartDiv.innerHTML = "<p class='text-xs text-gray-500 text-center p-1'>Chart cannot be rendered (size issue).</p>";
        return;
    }

    let selectedPath = null;

    const svg = d3.select(chartDiv)
        .append("svg")
        .attr("width", 0.95 * width)
        .attr("height", 0.95 * height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", `translate(${-width / 2},${-height / 2})`)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("click", function () {
            if (selectedPath) {
                paths.transition().duration(150).attr("d", arcGen).style("opacity", 1);
                selectedPath = null;
                legendDiv.innerHTML = capitalDisplayHTMLBase() + legendContentWrapper("<p class='small-text p-2'>Hover over or click a slice to see details.</p>");
            }
        });

    const pie = d3.pie().value(d => d.value).sort(null);
    const arcGen = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);
    const arcHover = d3.arc().innerRadius(radius * 0.5).outerRadius(radius * 1.05);

    const paths = svg.selectAll("path.slice")
        .data(pie(data))
        .enter()
        .append("path")
        .attr("class", "slice")
        .attr("d", arcGen)
        .attr("fill", d => d.data.color)
        .attr("stroke", "#fff")
        .style("stroke-width", "2px")
        .style("cursor", "pointer")
        .style("transition", "opacity 0.3s ease, transform 0.3s ease");

    function updateLegend(d) {
        const detailsHTML = `
            <h5 class="font-semibold normal-text mb-1" style="color:${d.data.color};">${d.data.label}</h5>
            <p class="small-text">Value: $${d3.format(",.2f")(d.data.value)}</p>
            <p class="small-text">Share: ${((d.data.value / d3.sum(data, item => item.value)) * 100).toFixed(1)}%</p>
        `;
        legendDiv.innerHTML = capitalDisplayHTMLBase() + legendContentWrapper(detailsHTML);
    }

    function updateLegendSelected(d) {
        const currentInvestmentValue = d.data.value;
        let detailsAndInteractionsHTML = `
            <h4 class="font-bold text-lg mb-1" style="color:${d.data.color};">${d.data.label}</h4>
            <p class="small-text mb-2">Invested: $${d3.format(",.2f")(currentInvestmentValue)}</p>
            <p class="small-text mb-2">Share: ${((d.data.value / d3.sum(data, item => item.value)) * 100).toFixed(1)}%</p>
        `;

        // Sell Section (only if not "Others")
        if (!d.data.isOther) {
            detailsAndInteractionsHTML += `
            <div class="interaction-section w-full mt-3 pt-3 border-t border-gray-200">
                <p class="small-text font-semibold mb-1">Sell ${d.data.label} shares:</p>
                <div class="flex items-center space-x-2 mb-2">
                    <input type="range" id="pie-chart-sell-percentage-slider" min="0" max="100" value="10" class="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
                    <span id="pie-chart-sell-percentage-value" class="small-text w-10 text-right">10%</span>
                </div>
                <button id="pie-chart-sell-button" class="w-full px-3 py-1 bg-red-500 normal-text-white rounded hover:bg-red-600 focus:outline-none">
                    Sell <span id="pie-chart-sell-amount-display">$${d3.format(",.2f")(currentInvestmentValue * 0.10)}</span>
                </button>
            </div>
        `;
        }

        // TODO: make that the two buttons have the same size
        // Invest Section (only if not "Others")
        if (!d.data.isOther) {
            detailsAndInteractionsHTML += `
                <div class="interaction-section w-full mt-3 pt-3 border-t border-gray-200">
                    <p class="small-text font-semibold mb-1">Invest in ${d.data.label}:</p>
                    <div class="flex items-center space-x-2 mb-2">
                        <span class="small-text">$</span>
                        <input type="number" id="pie-chart-invest-amount-input" min="0" step="100" placeholder="" class="flex-grow small-text p-1 border rounded w-full">
                    </div>
                    <button id="pie-chart-invest-button" class="w-full px-3 py-1 bg-green-500 normal-text-white rounded hover:bg-green-600 focus:outline-none">Invest</button>
                </div>
            `;
        }

        detailsAndInteractionsHTML += `<p id="pie-invest-feedback" class="text-sm min-h-[1.25rem] text-red-600 mt-4"></p>`;

        detailsAndInteractionsHTML += `<button id="clear-pie-selection" class="mt-4 w-full px-3 py-1 bg-gray-200 text-xs rounded hover:bg-gray-300 focus:outline-none">Clear Selection</button>`;

        legendDiv.innerHTML = capitalDisplayHTMLBase() + legendContentWrapper(detailsAndInteractionsHTML);

        // Event Listeners for interaction elements
        const sellSlider = document.getElementById('pie-chart-sell-percentage-slider');
        const sellPercentageValue = document.getElementById('pie-chart-sell-percentage-value');
        const sellAmountDisplay = document.getElementById('pie-chart-sell-amount-display');

        if (sellSlider) {
            sellSlider.addEventListener('input', function () {
                const percentage = parseFloat(this.value);
                sellPercentageValue.textContent = `${percentage.toFixed(0)}%`;
                const sellValue = currentInvestmentValue * (percentage / 100);
                sellAmountDisplay.textContent = `$${d3.format(",.2f")(sellValue)}`;
            });
        }

        const sellButton = document.getElementById('pie-chart-sell-button');
        if (sellButton) {
            sellButton.addEventListener('click', function () {
                const percentageToSell = parseFloat(sellSlider.value);
                if (isNaN(percentageToSell) || percentageToSell < 0 || percentageToSell > 100) {
                    alert("Invalid percentage to sell.");
                    return;
                }
                if (percentageToSell === 0) return; // Nothing to sell

                const amountToSell = currentInvestmentValue * (percentageToSell / 100);
                const selectedLabel = d.data.label; // Capture label before modification

                // Selling from a specific, non-"Other" state
                const stateName = d.data.label;
                if (investments[stateName] && amountToSell > 0) {
                    const actualAmountToSell = Math.min(amountToSell, investments[stateName]);
                    investments[stateName] -= actualAmountToSell;
                    budget += actualAmountToSell;
                    if (investments[stateName] < 0.01) delete investments[stateName];
                } else if (amountToSell > 0) {
                    console.error("Investment not found or already zero for selling:", stateName);
                    return;
                }

                updateInvestmentMetric();
                updateBudget();
                displayInvestments(); //TODO: remove this, pie chart is enough
                updateMap(stateName)
                const newData = getInvestmentPieData();
                renderInteractivePieChart(chartContainerId, legendContainerId, newData, selectedLabel); // Pass selectedLabel
            });
        }

        const investButton = document.getElementById('pie-chart-invest-button');
        const investAmountInput = document.getElementById('pie-chart-invest-amount-input');
        const investFeedback = document.getElementById('pie-invest-feedback');

        // TODO: modularize this with the one in main.js
        function pieShowFeedback(message, isError = false) {
            if (investFeedback) {
                investFeedback.textContent = message;
            }
        }

        function handlePieInvestment() {
            const amountToInvest = parseFloat(investAmountInput.value);
            if (isNaN(amountToInvest) || amountToInvest <= 0) {
                pieShowFeedback("Please enter a valid positive amount to invest.");
                return;
            }
            if (amountToInvest > budget) {
                pieShowFeedback("Not enough budget to make this investment. Available: $" + d3.format(",.2f")(budget));
                return;
            }
            if (amountToInvest < MIN_INVESTMENT) {
                pieShowFeedback(`Minimum investment is $${MIN_INVESTMENT.toLocaleString()}.`, true);
                return;
            }

            const stateName = d.data.label;
            const selectedLabel = d.data.label; // Capture label before modification
            console.log("Investing in:", stateName, "Amount:", amountToInvest);
            investments[stateName] = (investments[stateName] || 0) + amountToInvest;
            budget -= amountToInvest;

            updateInvestmentMetric();
            updateBudget();
            displayInvestments(); //TODO: remove this, pie chart is enough
            updateMap(stateName);
            investFeedback.textContent = "";
            const newData = getInvestmentPieData();
            renderInteractivePieChart(chartContainerId, legendContainerId, newData, selectedLabel); // Pass selectedLabel
        }

        if (investButton && investAmountInput && investFeedback) {
            investButton.addEventListener('click', handlePieInvestment);
            investAmountInput.addEventListener('keypress', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault(); // Prevent form submission
                    handlePieInvestment();
                    investAmountInput.value = '';
                }
            });
        }

        const clearPieButton = document.getElementById('clear-pie-selection');
        if (clearPieButton) {
            clearPieButton.addEventListener('click', function (event) {
                event.stopPropagation();
                paths.transition().duration(150).attr("d", arcGen).style("opacity", 1);
                selectedPath = null;
                legendDiv.innerHTML = capitalDisplayHTMLBase() + legendContentWrapper("<p class='small-text p-2'>Hover over or click a slice to see details.</p>");
            });
        }
    }

    paths.on("mouseover", function (event, d) {
        if (!selectedPath) {
            d3.select(this).transition().duration(150).attr("d", arcHover);
            updateLegend(d);
        }
    })
        .on("mouseout", function (event, d) {
            if (!selectedPath) {
                d3.select(this).transition().duration(150).attr("d", arcGen);
                legendDiv.innerHTML = capitalDisplayHTMLBase() + legendContentWrapper("<p class='small-text p-2'>Hover over or click a slice to see details.</p>");
            }
        })
        .on("click", function (event, d) {
            event.stopPropagation();
            const clickedPath = this;

            if (selectedPath === clickedPath) {
                paths.transition().duration(150).attr("d", arcGen).style("opacity", 1);
                selectedPath = null;
                legendDiv.innerHTML = capitalDisplayHTMLBase() + legendContentWrapper("<p class='small-text p-2'>Hover over or click a slice to see details.</p>");
            } else {
                selectedPath = clickedPath;
                paths.each(function (p_d) {
                    const currentPath = d3.select(this);
                    if (this === clickedPath) {
                        currentPath.transition().duration(150).attr("d", arcHover).style("opacity", 1);
                    } else {
                        currentPath.transition().duration(150).attr("d", arcGen).style("opacity", 0.8);
                    }
                });
                updateLegendSelected(d);
            }
        });

    // legendDiv.innerHTML = capitalDisplayHTMLBase() + legendContentWrapper("<p class='small-text p-2'>Hover over or click a slice to see details.</p>");
    // Logic to handle re-selection or default legend display
    if (previouslySelectedLabel) {
        let foundAndSelected = false;
        paths.each(function (p_d) {
            if (p_d.data.label === previouslySelectedLabel) {
                selectedPath = this; // Update the selectedPath to the new DOM element

                // Apply visual styles for selection
                paths.each(function () {
                    const currentPath = d3.select(this);
                    if (this === selectedPath) {
                        currentPath.transition().duration(150).attr("d", arcHover).style("opacity", 1);
                    } else {
                        currentPath.transition().duration(150).attr("d", arcGen).style("opacity", 0.8);
                    }
                });
                updateLegendSelected(p_d); // Update legend with the new data for this path
                foundAndSelected = true;
            }
        });
        if (!foundAndSelected) { // If the previously selected item no longer exists (e.g., sold out)
            selectedPath = null;
            legendDiv.innerHTML = capitalDisplayHTMLBase() + legendContentWrapper("<p class='small-text p-2'>Hover over or click a slice to see details.</p>");
        }
    } else {
        // Default legend if nothing was pre-selected
        legendDiv.innerHTML = capitalDisplayHTMLBase() + legendContentWrapper("<p class='small-text p-2'>Hover over or click a slice to see details.</p>");
    }
}

// --- End of pie_chart.js ---