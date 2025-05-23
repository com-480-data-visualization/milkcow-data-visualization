// js/panelModules/totalCapitalChart.js
let totalCapitalChartInstance; // To store chart state if needed

function _renderTotalCapitalChartInternal(svgId, data, isDetailedView) {
    const svgElement = d3.select('#' + svgId);
    if (!svgElement.node()) {
        console.error(`SVG container with ID '${svgId}' not found for Total Capital Chart.`);
        return;
    }
    svgElement.selectAll("*").remove(); // Clear previous content

    const rect = svgElement.node().getBoundingClientRect();
    
    const titleHeight = isDetailedView ? 40 : 30;
    const margin = { 
        top: titleHeight, 
        right: isDetailedView ? 40 : 20, 
        bottom: isDetailedView ? 50 : 40, 
        left: isDetailedView ? 60 : 50 
    };
    
    // Render Chart Title (within SVG, outside the main 'g' for chart content)
    svgElement.append("text")
        .attr("x", rect.width / 2)
        .attr("y", margin.top / 2 + (isDetailedView ? 5 : 0)) // Positioned within the top margin area
        .attr("text-anchor", "middle")
        .style("font-size", isDetailedView ? "16px" : "12px")
        .style("font-weight", "bold")
        .text("Total Capital Over Time");

    let width = rect.width - margin.left - margin.right;
    let height = rect.height - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) {
        svgElement.append("text")
            .attr("x", rect.width / 2)
            .attr("y", rect.height / 2) // Centered if dimensions are too small after title
            .attr("text-anchor", "middle")
            .style("font-size", isDetailedView ? "14px" : "10px")
            .text("Chart area too small.");
        return;
    }

    const g = svgElement.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    let xDomain, yDomain;
    const currentYearGlobal = (typeof currentYear !== 'undefined' && !isNaN(currentYear)) ? currentYear : new Date().getFullYear();
    const defaultStartYear = (typeof currentYear !== 'undefined' && !isNaN(currentYear)) ? Math.max(1970, currentYearGlobal - 9) : new Date().getFullYear() - 9;
    const defaultEndYear = currentYearGlobal;

    if (data && data.length > 0) {
        data.sort((a, b) => a.year - b.year); // Sort data if available
        xDomain = d3.extent(data, d => d.year);
        // Ensure yDomain starts at 0, or slightly below if negative values were possible
        const minY = d3.min(data, d => d.capital);
        const maxY = d3.max(data, d => d.capital);
        yDomain = [Math.min(0, minY || 0), (maxY || 100000) * 1.1]; 
        if (yDomain[0] === 0 && yDomain[1] === 0 && maxY === 0) yDomain[1] = 100000; // Handle all zero data case
        if (yDomain[0] === yDomain[1]) yDomain[1] = yDomain[0] + 100000; // Handle single value data
    } else {
        xDomain = [defaultStartYear, defaultEndYear];
        yDomain = [0, 100000]; // Default Y domain for placeholder
    }
    
    // Ensure xDomain has a valid range if only one year of data or defaultStartYear === defaultEndYear
    if (xDomain[0] === xDomain[1]) {
        xDomain = [xDomain[0] - 1, xDomain[1] + 1];
    }


    const x = d3.scaleLinear().domain(xDomain).range([0, width]);
    const y = d3.scaleLinear().domain(yDomain).range([height, 0]);

    // X Axis
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .ticks(Math.min(xDomain[1] - xDomain[0], isDetailedView ? 10 : 5)) // Adjust ticks based on domain range
            .tickFormat(d3.format("d")));

    // Y Axis
    g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y)
            .ticks(isDetailedView ? 8 : 4)
            .tickFormat(d => `$${d3.format("~s")(d)}`));

    if (!data || data.length === 0) {
        g.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .style("font-size", isDetailedView ? "14px" : "12px")
            .text("No capital data available.");
    } else {
        // Line generator
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.capital))
            .curve(d3.curveLinear); // Explicitly set to linear interpolation

        // Draw the line
        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", isDetailedView ? 1.5 : 1.0) // Made lines slightly thinner
            .attr("d", line);

        // Tooltip group (similar to milk_history.js)
        const focus = g.append('g')
            .attr('class', 'focus')
            .style('display', 'none');

        focus.append('circle')
            .attr('r', 5) // Adjusted radius
            .attr('fill', 'steelblue')
            .attr('stroke', 'white')
            .attr('stroke-width', 1.5);

        focus.append('rect')
            .attr('class', 'tooltip-bg')
            .attr('x', 10)
            .attr('y', -22)
            .attr('width', 140) // Adjusted width for capital values
            .attr('height', 40) // Adjusted height
            .attr('rx', 4) // Rounded corners
            .attr('fill', 'white')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 1)
            .style('opacity', 0.9);

        focus.append('text')
            .attr('class', 'tooltip-year')
            .attr('x', 18)
            .attr('y', -8)
            .style('font-size', '12px')
            .style('font-weight', 'bold');

        focus.append('text')
            .attr('class', 'tooltip-capital')
            .attr('x', 18)
            .attr('y', 10)
            .style('font-size', '12px');

        // Overlay for mouse events
        g.append('rect')
            .attr('class', 'overlay')
            .attr('width', width)
            .attr('height', height)
            .style('fill', 'none')
            .style('pointer-events', 'all')
            .on('mouseover', () => { if (data.length > 0) focus.style('display', null); })
            .on('mouseout', () => focus.style('display', 'none'))
            .on('mousemove', function(event) {
                if (data.length === 0) return;
                const bisectYear = d3.bisector(d => d.year).left;
                const mouse = d3.pointer(event, this);
                const x0 = x.invert(mouse[0]);
                const i = bisectYear(data, x0, 1);
                const d0 = data[i - 1];
                const d1 = data[i] || d0; // Handle edge case where i is out of bounds
                const d = (x0 - d0.year > d1.year - x0) ? d1 : d0;
                
                let tx = x(d.year);
                let ty = y(d.capital);

                // Adjust tooltip position if near right edge
                const tooltipWidth = 150; // Approximate width of tooltip background + padding
                if (tx + tooltipWidth > width) {
                    focus.select('.tooltip-bg').attr('x', -tooltipWidth + 10); // Adjust x for rect
                    focus.select('.tooltip-year').attr('x', -tooltipWidth + 18); // Adjust x for text
                    focus.select('.tooltip-capital').attr('x', -tooltipWidth + 18);
                } else {
                    focus.select('.tooltip-bg').attr('x', 10);
                    focus.select('.tooltip-year').attr('x', 18);
                    focus.select('.tooltip-capital').attr('x', 18);
                }

                focus.attr('transform', `translate(${tx},${ty})`);
                focus.select('.tooltip-year').text('Year: ' + d.year);
                focus.select('.tooltip-capital').text('Capital: $' + d3.format(",.0f")(d.capital));
            });
    }
    
    // X Axis Label
    if (isDetailedView) {
        svgElement.append("text")
            .attr("text-anchor", "middle")
            .attr("x", margin.left + width / 2)
            .attr("y", margin.top + height + margin.bottom - (isDetailedView ? 10 : 5) ) // Adjusted y for spacing
            .style("font-size", isDetailedView ? "12px" : "10px")
            .text("Year");
    }

    // Y Axis Label
    if (isDetailedView) {
        svgElement.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${margin.left / 2 - (isDetailedView ? 15 : 10)},${margin.top + height / 2}) rotate(-90)`) // Adjusted x for spacing
            .style("font-size", isDetailedView ? "12px" : "10px")
            .text("Total Capital ($)");
    }

    totalCapitalChartInstance = { svg: g, x, y, width, height, svgElement, data };
}

// Public functions
function renderSmallTotalCapitalChart(svgId, capitalData) {
    // Ensure capitalData is an array, even if empty
    const data = Array.isArray(capitalData) ? capitalData : [];
    requestAnimationFrame(() => {
        _renderTotalCapitalChartInternal(svgId, data, false);
    });
}

function renderDetailedTotalCapitalChart(svgId, capitalData) {
    const data = Array.isArray(capitalData) ? capitalData : [];
    requestAnimationFrame(() => {
        _renderTotalCapitalChartInternal(svgId, data, true);
    });
}

// Expose functions to be used by capitalEvolutionPanel.js
// This assumes capitalEvolutionPanel.js can access these global functions.
window.totalCapitalChart = {
    renderSmall: renderSmallTotalCapitalChart,
    renderDetailed: renderDetailedTotalCapitalChart
};
