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
                <h3 class="font-semibold text-gray-700 mb-4 text-center p-2" style="flex-shrink:0;">Portfolio Breakdown</h3>
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
    title.textContent = "Portfolio Breakdown";
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

function renderInteractivePieChart(chartContainerId, legendContainerId, data) {
    if (typeof d3 === 'undefined') { console.error("D3 library is not loaded."); return; }

    const chartDiv = document.getElementById(chartContainerId);
    const legendDiv = document.getElementById(legendContainerId);

    if (!chartDiv || !legendDiv) {
        console.error("Chart or Legend container not found for interactive pie chart.");
        return;
    }

    d3.select(chartDiv).select("svg").remove();
    legendDiv.innerHTML = "";

    if (!data || data.length === 0) {
        chartDiv.innerHTML = "<p class='normal-text text-center p-4'>No investments to display.</p>";
        legendDiv.innerHTML = "<p class='normal-text text-center'>Make an investment to see the chart.</p>";
        return;
    }

    const chartRect = chartDiv.getBoundingClientRect();
    const width = chartRect.width > 50 ? chartRect.width : 400;
    const height = chartRect.height > 50 ? chartRect.height : 350;
    const radius = Math.min(width, height) / 2 - 20;

    if (width <= 0 || height <= 0 || radius <= 0) {
        console.warn("Interactive pie chart container too small.", chartRect);
        chartDiv.innerHTML = "<p class='text-gray-500'>Chart area too small to render.</p>";
        return;
    }
    chartDiv.innerHTML = "";

    let selectedPath = null; // To keep track of the selected path

    const svg = d3.select(chartDiv)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Add a background rectangle for capturing clicks outside the pie
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", `translate(${-width / 2},${-height / 2})`) // Adjust to cover the g's area
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("click", function() {
            if (selectedPath) {
                paths.transition().duration(150).attr("d", arcGen).style("opacity", 1);
                selectedPath = null;
                legendDiv.innerHTML = "<p class='small-text text-center'>Hover over or click a slice to see details.</p>";
            }
        });

    const pie = d3.pie().value(d => d.value).sort(null);
    const arcGen = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);
    const arcHover = d3.arc().innerRadius(radius * 0.5).outerRadius(radius * 1.05);

    const paths = svg.selectAll("path.slice") // Added .slice class for specificity
        .data(pie(data))
        .enter()
        .append("path")
        .attr("class", "slice") // Added .slice class
        .attr("d", arcGen)
        .attr("fill", d => d.data.color)
        .attr("stroke", "#fff")
        .style("stroke-width", "2px")
        .style("cursor", "pointer")
        .style("transition", "opacity 0.3s ease, transform 0.3s ease");

    function updateLegend(d) {
        legendDiv.innerHTML = `
            <h5 class="font-semibold normal-text mb-1" style="color:${d.data.color};">${d.data.label}</h5>
            <p class="small-text">Value: $${d3.format(",.2f")(d.data.value)}</p>
            <p class="small-text">Share: ${((d.data.value / d3.sum(data, item => item.value)) * 100).toFixed(1)}%</p>
        `;
    }

    function updateLegendSelected(d) {
        legendDiv.innerHTML = `
            <h4 class="font-bold text-xl mb-2" style="color:${d.data.color};">${d.data.label}</h4>
            <p>Value: ${d3.format(",.2f")(d.data.value)}</p>
            <p>Share: ${((d.data.value / d3.sum(data, item => item.value)) * 100).toFixed(1)}%</p>
            <button id="clear-pie-selection" class="mt-3 px-3 py-1 bg-gray-200 text-xs rounded hover:bg-gray-300 focus:outline-none">Clear Selection</button>
        `;
        d3.select("#clear-pie-selection").on("click", (event) => {
            event.stopPropagation(); // Prevent click from bubbling to the background rect
            paths.transition().duration(150).attr("d", arcGen).style("opacity", 1);
            selectedPath = null;
            legendDiv.innerHTML = "<p class='small-text text-center'>Hover over or click a slice to see details.</p>";
        });
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
            legendDiv.innerHTML = "<p class='small-text text-center'>Hover over or click a slice to see details.</p>";
        }
    })
    .on("click", function (event, d) {
        event.stopPropagation(); // Prevent click from bubbling to the background rect
        const clickedPath = this;

        if (selectedPath === clickedPath) { // Clicked the same selected slice
            paths.transition().duration(150).attr("d", arcGen).style("opacity", 1);
            selectedPath = null;
            legendDiv.innerHTML = "<p class='small-text text-center'>Hover over or click a slice to see details.</p>";
        } else { // Clicked a new slice or the first slice
            selectedPath = clickedPath;
            paths.each(function(p_d) {
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

    legendDiv.innerHTML = "<p class='small-text text-center'>Hover over or click a slice to see details.</p>";
}

// --- End of pie_chart.js ---