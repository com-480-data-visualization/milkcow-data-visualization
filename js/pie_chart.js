// --- Start of pie_chart.js ---

// Sample Pie Data (if needed as a fallback or for other purposes)
const staticPieData = [
    { label: "Housing", value: 35, color: "#66c2a5" },
    { label: "Food", value: 20, color: "#fc8d62" },
    { label: "Transport", value: 15, color: "#8da0cb" },
    { label: "Utilities", value: 10, color: "#e78ac3" },
    { label: "Savings", value: 10, color: "#a6d854" },
    { label: "Other", value: 10, color: "#ffd92f" }
];

// --- Helper function to get and transform investment data for pie chart ---
function getInvestmentPieData() {
    // Access the global 'investments' object from main.js
    if (typeof investments === 'undefined' || Object.keys(investments).length === 0) {
        return []; // Return empty array if no investments or 'investments' is not defined
    }

    const colors = d3.scaleOrdinal(d3.schemeTableau10); // D3 color scheme

    return Object.entries(investments)
        .filter(([, amount]) => amount > 0) // Only include states with actual investment
        .map(([stateName, amount], index) => ({
            label: stateName,
            value: amount,
            color: colors(index) // Assign color based on index
        }));
}

// --- D3 Pie Chart Rendering Functions ---
function renderSmallPieChart(containerElement, data) {
    if (typeof d3 === 'undefined') { console.error("D3 library is not loaded."); return; }
    d3.select(containerElement).select("svg").remove(); // Clear previous

    if (!data || data.length === 0) {
        containerElement.innerHTML = "<p class='normal-text text-center p-2'>No investments to display.</p>";
        return;
    }

    const containerRect = containerElement.getBoundingClientRect();
    const width = containerRect.width > 20 ? containerRect.width : 120;
    const height = containerRect.height > 20 ? containerRect.height : 120;
    const radius = Math.min(width, height) / 2 - (Math.min(width, height) > 100 ? 10 : 5);

    if (width <= 0 || height <= 0 || radius <=0) {
        console.warn("Small pie chart container too small to render.", containerRect);
        containerElement.innerHTML = "<p class='text-xs text-gray-400 text-center p-1'>Chart too small</p>";
        return;
    }
    containerElement.innerHTML = ""; // Clear any fallback text

    const svg = d3.select(containerElement)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    svg.selectAll("path")
        .data(pie(data))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => d.data.color)
        .attr("stroke", "white")
        .style("stroke-width", "1px")
        .append("title") // Basic tooltip
            .text(d => `${d.data.label}: $${d3.format(",")(d.data.value)}`);
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

    if (width <= 0 || height <= 0 || radius <=0) {
        console.warn("Interactive pie chart container too small.", chartRect);
        chartDiv.innerHTML = "<p class='text-gray-500'>Chart area too small to render.</p>";
        return;
    }
    chartDiv.innerHTML = "";

    const svg = d3.select(chartDiv)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie().value(d => d.value).sort(null);
    const arcGen = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);
    const arcHover = d3.arc().innerRadius(radius * 0.5).outerRadius(radius * 1.05);

    const paths = svg.selectAll("path")
        .data(pie(data))
        .enter()
        .append("path")
        .attr("d", arcGen)
        .attr("fill", d => d.data.color)
        .attr("stroke", "#fff")
        .style("stroke-width", "2px")
        .style("cursor", "pointer")
        .style("transition", "opacity 0.3s ease, transform 0.3s ease")
        .on("mouseover", function(event, d) {
            d3.select(this).transition().duration(150).attr("d", arcHover);
            legendDiv.innerHTML = `
                <h5 class="font-semibold text-lg mb-1" style="color:${d.data.color};">${d.data.label}</h5>
                <p class="text-sm">Value: ${d3.format(",")(d.data.value)}</p>
                <p class="text-sm">Share: ${((d.data.value / d3.sum(data, item => item.value)) * 100).toFixed(1)}%</p>
            `;
        })
        .on("mouseout", function(event, d) {
            if (!d3.select(this).classed("selected-slice")) {
                d3.select(this).transition().duration(150).attr("d", arcGen);
            }
        })
        .on("click", function(event, d) {
            const alreadySelected = d3.select(this).classed("selected-slice");
            paths.classed("selected-slice", false)
                 .transition().duration(150).attr("d", arcGen).style("opacity", 0.7);

            if (alreadySelected) {
                paths.style("opacity", 1);
                legendDiv.innerHTML = "<p class='text-gray-500 text-sm'>Hover or click a slice.</p>";
            } else {
                d3.select(this)
                    .classed("selected-slice", true)
                    .transition().duration(150)
                    .attr("d", arcHover)
                    .style("opacity", 1);

                legendDiv.innerHTML = `
                    <h4 class="font-bold text-xl mb-2" style="color:${d.data.color};">${d.data.label}</h4>
                    <p>Value: ${d3.format(",")(d.data.value)}</p>
                    <p>Share: ${((d.data.value / d3.sum(data, item => item.value)) * 100).toFixed(1)}%</p>
                    <button id="clear-pie-selection" class="mt-3 px-3 py-1 bg-gray-200 text-xs rounded hover:bg-gray-300 focus:outline-none">Clear Selection</button>
                `;
                d3.select("#clear-pie-selection").on("click", () => {
                    paths.classed("selected-slice", false)
                         .transition().duration(150).attr("d", arcGen).style("opacity", 1);
                    legendDiv.innerHTML = "<p class='text-gray-500 text-sm'>Hover or click a slice.</p>";
                });
            }
        });
    legendDiv.innerHTML = "<p class='text-gray-500 text-sm text-center'>Hover over or click a slice to see details.</p>";
}

// --- End of pie_chart.js ---
