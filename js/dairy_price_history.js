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
                        .text(`${col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${formatDollar(+d[col])}`);
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
    
    /*
    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-lg font-semibold')
        .text('Price Evolution of Selected Milk Products');
    */
    
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