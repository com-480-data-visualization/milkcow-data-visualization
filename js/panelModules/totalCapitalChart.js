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
        .attr("class", "normal-text font-semibold text-grey-700") // Applied new classes
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
        let minActualYear = d3.min(data, d => d.year);
        let maxActualYear = d3.max(data, d => d.year);

        if (minActualYear === maxActualYear) {
            // Single data point: pad by 1 year on each side
            xDomain = [minActualYear - 1, maxActualYear + 1];
        } else {
            // Multiple data points: pad by 0.5 year on each side
            xDomain = [minActualYear - 0.5, maxActualYear + 0.5];
        }
        
        const minY = d3.min(data, d => d.capital);
        const maxY = d3.max(data, d => d.capital);

        if (typeof minY === 'number' && typeof maxY === 'number') {
            yDomain = [minY - 5000, maxY + 5000];
            // Ensure that the domain has a minimal spread if min and max are identical
            // (e.g. single data point). The minY - 5000, maxY + 5000 already gives a 10k spread.
            // This check is a safeguard for any edge case leading to a zero or negative spread.
            if (yDomain[1] <= yDomain[0]) {
                yDomain[1] = yDomain[0] + 10000; // Ensure at least a 10k spread
            }
        } else {
            // Fallback if capital values in data are not numeric
            yDomain = [0, 100000]; 
        }
    } else {
        // No data: use default years and apply padding
        if (defaultStartYear === defaultEndYear) {
            // Single default year: pad by 1 year on each side
            xDomain = [defaultStartYear - 1, defaultEndYear + 1];
        } else {
            // Multiple default years: pad by 0.5 year on each side
            xDomain = [defaultStartYear - 0.5, defaultEndYear + 0.5];
        }
        yDomain = [0, 100000]; // Default Y domain for placeholder
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

        // HTML Tooltip
        const tooltip = d3.select("#capital-tooltip");

        if (tooltip.empty()) {
            console.error("Tooltip element #capital-tooltip not found.");
        }

        // Visible data points
        const dataPoints = g.selectAll(".data-point")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "data-point")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.capital))
            .attr("r", function(d, i) {
                if (isDetailedView) {
                    return 4; // All points visible and larger in detailed view
                }
                // Small view logic
                if (data.length === 1) {
                    return 3; // Single data point visible
                }
                if (i === 0 || i === data.length - 1) {
                    return 3; // First and last points visible
                }
                return 0; // Other points invisible
            })
            .style("fill", "steelblue")
            .style("stroke", "white")
            .style("stroke-width", 1.5)
            .style("opacity", function(d, i) {
                if (isDetailedView) {
                    return 1; // All points fully opaque in detailed view
                }
                // Small view logic
                if (data.length === 1) {
                    return 1; // Single data point opaque
                }
                if (i === 0 || i === data.length - 1) {
                    return 1; // First and last points opaque
                }
                return 0; // Other points transparent
            })
            .style("pointer-events", "none"); // Visual only, no pointer events

        // Invisible hover areas - larger target for mouse events
        g.selectAll(".hover-area")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "hover-area")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.capital))
            .attr("r", 10) // Larger radius for easier hovering
            .style("fill", "transparent")
            .style("stroke", "none")
            .style("pointer-events", "all") // Capture mouse events
            .on('mouseover', function (event, d, i) { // Index 'i' is reported as undefined, datum 'd' should be valid
                if (!tooltip.empty()) {
                    tooltip.classed('hidden', false)
                        .style('z-index', '10001'); 
                }
                if (isDetailedView) {
                    // console.log("Hover-area mouseover: datum 'd':", JSON.stringify(d), "index 'i':", i); // Log for debugging 'i'
                    // Attempt to find the corresponding dataPoint using the datum 'd' from the hover-area
                    const pointToEnlarge = dataPoints.filter(dp_datum => dp_datum.year === d.year);

                    if (!pointToEnlarge.empty()) {
                        pointToEnlarge.transition().duration(100).attr("r", 6);
                    } else {
                        console.log("Datum-based: Could not find point to enlarge for year:", d.year, "All dataPoints datums:", dataPoints.data());
                    }
                }
            })
            .on('mouseout', function (event, d, i) { // Index 'i' is reported as undefined
                if (!tooltip.empty()) {
                    tooltip.classed('hidden', true);
                }
                if (isDetailedView) {
                    const pointToRevert = dataPoints.filter(dp_datum => dp_datum.year === d.year);
                    if (!pointToRevert.empty()) {
                        pointToRevert.transition().duration(100).attr("r", 4);
                    } else {
                        // console.log("Datum-based: Could not find point to revert for year:", d.year);
                    }
                }
            })
            .on('mousemove', function (event, d) {
                if (tooltip.empty()) return;

                tooltip.html(`<strong>Year:</strong> ${d.year}<br><strong>Capital:</strong> $${d3.format(",.0f")(d.capital)}`);

                let left = event.pageX + 15;
                let top = event.pageY + 15;

                const tooltipNode = tooltip.node();
                if (tooltipNode) {
                    const tooltipWidth = tooltipNode.offsetWidth;
                    const tooltipHeight = tooltipNode.offsetHeight;

                    if (left + tooltipWidth > window.innerWidth) {
                        left = event.pageX - tooltipWidth - 15;
                    }
                    if (top + tooltipHeight > window.innerHeight) {
                        top = event.pageY - tooltipHeight - 15;
                    }
                }

                tooltip.style('left', left + 'px')
                    .style('top', top + 'px');
            });
    }

    // X Axis Label
    if (isDetailedView) {
        svgElement.append("text")
            .attr("text-anchor", "middle")
            .attr("x", margin.left + width / 2)
            .attr("y", margin.top + height + margin.bottom - (isDetailedView ? 10 : 5)) // Adjusted y for spacing
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
