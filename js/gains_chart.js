// Initialize the gains chart
let gainsChart;
let gainsData = [];

//////////////////////////////////////////////////////////////////////
// Private helper functions (prefixed with _)
//////////////////////////////////////////////////////////////////////
function _startYear() {
    return Math.max(1970, currentYear - 9);
}

function _endYear(startYear) {
    return Math.max(startYear + 5, currentYear);
}

//////////////////////////////////////////////////////////////////////
// Update axis scales
//////////////////////////////////////////////////////////////////////
function _updateXAxisScale() {
    const startYear = _startYear();
    const endYear = _endYear(startYear);
    
    // Update X axis domain with 1-year padding on each side
    gainsChart.x.domain([startYear - 1, endYear + 1]);
    
    // Generate array of unique years for ticks (without the padding years)
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
        years.push(year);
    }
    
    // Update the X axis with animation and custom ticks
    gainsChart.svg.select('.x-axis')
        .transition()
        .duration(500)
        .call(d3.axisBottom(gainsChart.x)
            .tickValues(years)  // Only show ticks for actual years, not padding
            .tickFormat(d3.format('d')));
}

function _updateYAxisScale() {
    const startYear = _startYear();
    const visibleData = gainsData.filter(d => d.year >= startYear);
    
    const maxAbsGain = visibleData.length > 0 ? Math.max(...visibleData.map(d => Math.abs(d.gain))) : 1;
    // Set the domain to ±1.5 times the maximum absolute gain
    const yDomain = Math.max(maxAbsGain * 1.5, 2); // minimum of ±2% range
    gainsChart.y.domain([-yDomain, yDomain]);
    
    // Update the Y axis with animation
    gainsChart.svg.select('.y-axis')
        .transition()
        .duration(500)
        .call(d3.axisLeft(gainsChart.y).tickFormat(d => `${d}`));
}

//////////////////////////////////////////////////////////////////////
// Initialize the gains chart
//////////////////////////////////////////////////////////////////////
function initGainsChart() {
    const startYear = _startYear();

    // Set the dimensions and margins of the graph
    const margin = {top: 20, right: 30, bottom: 40, left: 60};
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Add flex centering to the container
    d3.select('#gains-chart')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('align-items', 'center');

    // Create the SVG container
    const svg = d3.select('#gains-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add X axis with initial domain based on current year
    const x = d3.scaleLinear()
        .domain([startYear - 1, currentYear + 1])  // Add 1-year padding on each side
        .range([0, width]);
    
    // Generate initial years array for ticks (without padding years)
    const years = [];
    for (let year = startYear; year <= currentYear; year++) {
        years.push(year);
    }
    
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .attr('class', 'x-axis')
        .call(d3.axisBottom(x)
            .tickValues(years)  // Only show ticks for actual years, not padding
            .tickFormat(d3.format('d')));

    // Add Y axis with initial domain
    const y = d3.scaleLinear()
        .domain([-2, 2])  // Initial range of ±2%
        .range([height, 0]);
    
    svg.append('g')
        .attr('class', 'y-axis');

    // Add X axis label
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', width/2)
        .attr('y', height + margin.bottom - 5)
        .text('Year')
        .attr('class', 'text-sm text-gray-600');

    // Add Y axis label
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 15)
        .attr('x', -height/2)
        .text('Profit In %')
        .attr('class', 'text-sm text-gray-600');

    // Add zero line
    svg.append('line')
        .attr('class', 'zero-line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', y(0))
        .attr('y2', y(0))
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4');

    // Store the chart elements for updates
    gainsChart = {
        svg,
        x,
        y,
        width,
        height
    };
    
    _updateXAxisScale();
    _updateYAxisScale();
}

//////////////////////////////////////////////////////////////////////
// Update the gains chart
//////////////////////////////////////////////////////////////////////

function addToProfitHistoryChart(year, gainPercentage) {
    gainsData.push({
        year: year,
        gain: gainPercentage
    });
}

function updateProfitHistoryChart() {

    // Update X and Y axis scales based on new data
    _updateXAxisScale();
    _updateYAxisScale();

    // Get visible data range
    const startYear = _startYear();
    const visibleData = gainsData.filter(d => d.year >= startYear);

    // Calculate bar width based on 10-year window
    const barWidth = Math.min(40, (gainsChart.width / 10) - 4); // Always divide by 10 for consistent width

    // Update zero line position with animation
    gainsChart.svg.select('.zero-line')
        .transition()
        .duration(500)
        .attr('y1', gainsChart.y(0))
        .attr('y2', gainsChart.y(0));

    // Update all bars
    const bars = gainsChart.svg.selectAll('.bar')
        .data(visibleData, d => d.year);

    // Remove old bars
    bars.exit()
        .transition()
        .duration(500)
        .attr('width', 0)
        .remove();

    // Add new bars
    const barsEnter = bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => gainsChart.x(d.year))
        .attr('y', gainsChart.y(0))
        .attr('width', 0)
        .attr('height', 0);

    // Update all bars with transition
    barsEnter.merge(bars)
        .transition()
        .duration(500)
        .attr('x', d => gainsChart.x(d.year) - barWidth/2)
        .attr('y', d => d.gain >= 0 ? gainsChart.y(d.gain) : gainsChart.y(0))
        .attr('width', barWidth)
        .attr('height', d => Math.abs(gainsChart.y(d.gain) - gainsChart.y(0)))
        .attr('fill', d => d.gain >= 0 ? '#059669' : '#dc2626');

    // Add hover interactions
    gainsChart.svg.selectAll('.bar')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('fill', d.gain >= 0 ? '#047857' : '#991b1b');
            
            const tooltip = d3.select('#tooltip');
            tooltip.style('display', 'block')
                .html(`Year: ${d.year}<br>Gain: ${d.gain.toFixed(1)}%`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function(d) {
            d3.select(this)
                .attr('fill', d => d.gain >= 0 ? '#059669' : '#dc2626');
            
            d3.select('#tooltip').style('display', 'none');
        });
}

// Initialize the chart when the page loads
document.addEventListener('DOMContentLoaded', initGainsChart); 