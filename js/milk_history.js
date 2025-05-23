// === Visualization: Historical Milk Production Graph ===
function renderMilkProductionGraph(stateName) {
    // Update the dropdown to reflect the selected state
    const stateSelectElement = document.getElementById('visualization-state-select');
    if (stateSelectElement) {
        stateSelectElement.value = stateIndexMap[stateName];
    }
    
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