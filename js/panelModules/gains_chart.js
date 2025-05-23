// js/gain_chart_copy.js
let gainsChart; // Holds { svg (the g element), x, y, width, height, svgElement (the actual svg) }
let gainsData = [];

//////////////////////////////////////////////////////////////////////
// Private helper functions (prefixed with _)
//////////////////////////////////////////////////////////////////////
function _startYear() {
    // currentYear is expected to be a global variable (e.g., from main.js)
    return Math.max(1970, currentYear - 9);
}

function _endYear(startYear) {
    // currentYear is expected to be a global variable
    return Math.max(startYear + 5, currentYear);
}

//////////////////////////////////////////////////////////////////////
// Core chart rendering function (private)
//////////////////////////////////////////////////////////////////////
function _renderGainsChartInternal(svgContainerId) {
    const svgElement = d3.select('#' + svgContainerId);
    if (!svgElement.node()) {
        console.error(`SVG container with ID '${svgContainerId}' not found for Gains Chart.`);
        return;
    }
    svgElement.selectAll("*").remove(); // Clear previous content

    const rect = svgElement.node().getBoundingClientRect();
    
    const isDetailedView = svgContainerId.includes('detailed'); // Heuristic to check if detailed view
    const titleHeight = isDetailedView ? 40 : 30;
    const margin = {
        top: titleHeight, 
        right: isDetailedView ? 30 : 20, 
        bottom: isDetailedView ? 50 : 40, 
        left: isDetailedView ? 60 : 50
    }; 

    // Render Chart Title
    svgElement.append("text")
        .attr("x", rect.width / 2)
        .attr("y", margin.top / 2 + (isDetailedView ? 5 : 0))
        .attr("text-anchor", "middle")
        .attr("class", "normal-text font-semibold text-grey-700") // Applied new classes
        .text("Yearly Profit/Loss (%)");

    let width = rect.width - margin.left - margin.right;
    let height = rect.height - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) {
        svgElement.append("text")
            .attr("x", rect.width / 2)
            .attr("y", rect.height / 2)
            .attr("text-anchor", "middle")
            .style("font-size", isDetailedView ? "14px" : "10px")
            .text("Chart area too small.");
        return;
    }
    
    // Ensure minimum dimensions for the drawing area
    width = Math.max(width, 100); 
    height = Math.max(height, 80);

    const g = svgElement.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const currentYearGlobal = (typeof currentYear !== 'undefined' && !isNaN(currentYear)) ? currentYear : new Date().getFullYear();
    const initialStartYear = _startYear(); // Uses global currentYear or default
    const initialEndYear = _endYear(initialStartYear);

    const x = d3.scaleLinear()
        .domain([initialStartYear - 1, initialEndYear + 1])
        .range([0, width]);

    const initialYears = [];
    for (let year = initialStartYear; year <= initialEndYear; year++) {
        initialYears.push(year);
    }

    svgElement.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(${margin.left},${margin.top + height})`)
        .call(d3.axisBottom(x).tickValues(initialYears).tickFormat(d3.format('d')));

    let init_y_domain_val;
    if (gainsData && gainsData.length > 0) {
        const visibleDataForInitialScale = gainsData.filter(d => d.year >= initialStartYear && d.year <= initialEndYear);
        const maxAbsGain = visibleDataForInitialScale.length > 0 ? Math.max(...visibleDataForInitialScale.map(d => Math.abs(d.gain))) : 1;
        init_y_domain_val = Math.max(maxAbsGain * 1.5, 1);
    } else {
        init_y_domain_val = 1.5; // Default if no data
    }

    const y = d3.scaleLinear()
        .domain([-init_y_domain_val, init_y_domain_val])
        .range([height, 0]);

    svgElement.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .call(d3.axisLeft(y).tickFormat(d => `${d}%`));

    // Add X axis label
    svgElement.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', margin.left + width / 2)
        .attr('y', margin.top + height + margin.bottom - (isDetailedView ? 10 : 5)) // Adjusted y position
        .text('Year')
        .attr('class', 'text-sm text-gray-600')
        .style("font-size", isDetailedView ? "12px" : "10px");

    // Add Y axis label
    svgElement.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', `translate(${margin.left - (isDetailedView ? 40 : 30)},${margin.top + height / 2}) rotate(-90)`) // Adjusted positioning
        .text('Profit/Loss (%)')
        .attr('class', 'text-sm text-gray-600')
        .style("font-size", isDetailedView ? "12px" : "10px");

    g.append('line')
        .attr('class', 'zero-line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', y(0))
        .attr('y2', y(0))
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4');

    gainsChart = {
        svg: g, 
        x: x,
        y: y,
        width: width,
        height: height,
        svgElement: svgElement,
        isDetailedView: isDetailedView // Store view type
    };

    _updateXAxisScale(); // This will use gainsChart.x and gainsChart.isDetailedView if needed
    _updateYAxisScale(); // This will use gainsChart.y and gainsChart.isDetailedView if needed
    updateProfitHistoryChartContent(); 
}

//////////////////////////////////////////////////////////////////////
// Update axis scales
//////////////////////////////////////////////////////////////////////
function _updateXAxisScale() {
    if (!gainsChart || !gainsChart.x) return;
    const startYear = _startYear();
    const endYear = _endYear(startYear);

    gainsChart.x.domain([startYear - 1, endYear + 1]);

    const years = [];
    for (let year = startYear; year <= endYear; year++) {
        years.push(year);
    }
    
    const tickCount = gainsChart.isDetailedView ? Math.min(years.length, 10) : Math.min(years.length, 5);

    gainsChart.svgElement.select('.x-axis')
        .transition()
        .duration(500)
        .call(d3.axisBottom(gainsChart.x)
            .ticks(tickCount)
            .tickValues(years.length <= tickCount ? years : undefined) // Show all if few, else let d3 decide based on ticks()
            .tickFormat(d3.format('d')));
}

function _updateYAxisScale() {
    if (!gainsChart || !gainsChart.y) {
        return;
    }

    const startYear = _startYear(); 
    if (isNaN(startYear)) {
        console.error("_updateYAxisScale: startYear is NaN. currentYear: " + currentYear);
        // Use a default range if currentYear is problematic
        gainsChart.y.domain([-1.5, 1.5]);
    } else {
        const visibleData = gainsData.filter(d => d.year >= startYear);
        const maxAbsGain = visibleData.length > 0 ? Math.max(...visibleData.map(d => Math.abs(d.gain))) : 1;
        const yDomainValue = Math.max(maxAbsGain * 1.5, 0.5); 
        gainsChart.y.domain([-yDomainValue, yDomainValue]);
    }

    gainsChart.svgElement.select('.y-axis')
        .transition()
        .duration(500)
        .call(d3.axisLeft(gainsChart.y)
            .ticks(gainsChart.isDetailedView ? 8 : 4)
            .tickFormat(d => `${d}%`));
}

//////////////////////////////////////////////////////////////////////
// Update chart content (bars, tooltips)
//////////////////////////////////////////////////////////////////////
function updateProfitHistoryChartContent() {
    if (!gainsChart || !gainsChart.svg) {
        // console.warn("Gains chart not initialized. Call renderSmallGraph or renderDetailedGraph first.");
        return;
    }

    const startYear = _startYear();
    const visibleData = gainsData.filter(d => d.year >= startYear);
    const barWidth = Math.min(40, (gainsChart.width / 10) - 4); // Assumes roughly 10 bars visible

    gainsChart.svg.select('.zero-line') // zero-line is in gainsChart.svg (the <g>)
        .transition()
        .duration(500)
        .attr('y1', gainsChart.y(0))
        .attr('y2', gainsChart.y(0));

    const bars = gainsChart.svg.selectAll('.bar')
        .data(visibleData, d => d.year);

    bars.exit()
        .transition()
        .duration(500)
        .attr('width', 0) // Shrink width to 0
        .attr('x', d => gainsChart.x(d.year)) // Keep x position while shrinking
        .remove();

    const barsEnter = bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => gainsChart.x(d.year) - barWidth / 2)
        .attr('y', gainsChart.y(0))
        .attr('width', barWidth)
        .attr('height', 0)
        .attr('fill', d => d.gain >= 0 ? '#059669' : '#dc2626'); // Initial fill

    barsEnter.merge(bars)
        .transition()
        .duration(500)
        .attr('x', d => gainsChart.x(d.year) - barWidth / 2)
        .attr('y', d => d.gain >= 0 ? gainsChart.y(d.gain) : gainsChart.y(0))
        .attr('width', barWidth)
        .attr('height', d => Math.abs(gainsChart.y(d.gain) - gainsChart.y(0)))
        .attr('fill', d => d.gain >= 0 ? '#059669' : '#dc2626');

    gainsChart.svg.selectAll('.bar')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('fill', d.gain >= 0 ? '#047857' : '#991b1b'); // Darken on hover
            
            const tooltip = d3.select('#gains-tooltip'); // Assumes #tooltip exists globally
            tooltip
                .classed('hidden', false)
                .style('opacity', 1)
                .style('display', 'block') // Ensure it's visible
                .style('z-index', '10001') // Ensure tooltip is above the enlarged panel (z-index: 10000)
                .html(`Year: ${d.year}<br>Gain: ${d.gain.toFixed(1)}%`);
        })
        .on('mousemove', function(event) {
            const tooltip = d3.select('#gains-tooltip');
            // Tooltip positioning relative to the page or a specific container
            // This example positions relative to the page.
            // For positioning relative to #game-tab-content, ensure it's the offsetParent or calculate accordingly.
            let newLeft = event.pageX + 15;
            let newTop = event.pageY + 15;
            
            // Basic boundary check (relative to window)
            const tooltipNode = tooltip.node();
            if (tooltipNode) {
                if (newLeft + tooltipNode.offsetWidth > window.innerWidth) {
                    newLeft = event.pageX - tooltipNode.offsetWidth - 15;
                }
                if (newTop + tooltipNode.offsetHeight > window.innerHeight) {
                    newTop = event.pageY - tooltipNode.offsetHeight - 15;
                }
            }
            tooltip.style('left', newLeft + 'px')
                   .style('top', newTop + 'px');
        })
        .on('mouseout', function(event, d) { // Added event, d for consistency
            d3.select(this)
                .attr('fill', d.gain >= 0 ? '#059669' : '#dc2626'); // Revert to original color
            
            d3.select('#gains-tooltip')
                .classed('hidden', true)
                .style('opacity', 0)
                .style('display', 'none'); // Hide it
        });
}

//////////////////////////////////////////////////////////////////////
// Public functions to be exposed via panel3
//////////////////////////////////////////////////////////////////////
function renderSmallGraph(svgId) {
    // console.log(`panel3.renderSmallGraph called for ${svgId}`);
    // Defer rendering slightly to allow the DOM to settle and for container to get its dimensions
    requestAnimationFrame(() => {
        _renderGainsChartInternal(svgId);
    });
}

function renderDetailedGraph(svgId) {
    // console.log(`panel3.renderDetailedGraph called for ${svgId}`);
    // Defer rendering to align with browser's paint cycle
    requestAnimationFrame(() => {
        _renderGainsChartInternal(svgId); // _renderGainsChartInternal is designed to be responsive
    });
}

function addToProfitHistoryChart(year, gainPercentage) {
    gainsData.push({
        year: year,
        gain: gainPercentage
    });
    if (gainsChart && gainsChart.svg) { // Only update if chart is rendered
        _updateXAxisScale(); // Update X axis (e.g. if currentYear changed)
        _updateYAxisScale(); // Update Y axis (domain might change)
        updateProfitHistoryChartContent(); // Redraw bars
    }
}

// Optional: A function to fully refresh the chart if needed externally
function refreshGainsChart() {
    if (gainsChart && gainsChart.svgElement) {
        const svgId = gainsChart.svgElement.attr('id');
        if (svgId) {
            // console.log(`refreshGainsChart called for ${svgId}`);
            requestAnimationFrame(() => { // Defer rendering
                _renderGainsChartInternal(svgId);
            });
        } else {
            console.error("Cannot refresh gains chart: SVG element has no ID.");
        }
    } else {
        console.warn("Gains chart not initialized, cannot refresh.");
    }
}

//////////////////////////////////////////////////////////////////////
// Expose functions globally via panel3 object
//////////////////////////////////////////////////////////////////////
window.panel3 = {
    renderSmallGraph: renderSmallGraph,
    renderDetailedGraph: renderDetailedGraph,
    addToProfitHistoryChart: addToProfitHistoryChart, // If panel manager or other modules need to add data
    refreshGainsChart: refreshGainsChart // If a full refresh is needed
};

// Remove old DOMContentLoaded initialization as chart is now initialized by panelManager
// document.addEventListener('DOMContentLoaded', initGainsChart);