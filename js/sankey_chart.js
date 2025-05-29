// Sankey Chart: Origin of the Cost of Milk
// This chart visualizes how the price of milk is composed from its cost components for a selected year.

async function initMilkCostSankey() {
    const rawData = await d3.csv('dataset/milkcow_facts.csv');
    // Parse and clean data
    const data = rawData.map(d => {
        const parsed = {};
        for (const key in d) {
            if (key === 'year' && d[key] === '2e3') parsed[key] = 2000;
            else if (d[key] && typeof d[key] === 'string' && (d[key].includes('e3') || d[key].includes('e6'))) parsed[key] = parseFloat(d[key]);
            else if (!isNaN(parseFloat(d[key])) && isFinite(d[key])) parsed[key] = +d[key];
            else parsed[key] = d[key];
        }
        parsed.year = +parsed.year;
        parsed.avg_price_milk = +parsed.avg_price_milk;
        parsed.dairy_ration = +parsed.dairy_ration;
        parsed.milk_per_cow = +parsed.milk_per_cow;
        parsed.milk_cow_cost_per_animal = +parsed.milk_cow_cost_per_animal;
        parsed.milk_volume_to_buy_cow_in_lbs = +parsed.milk_volume_to_buy_cow_in_lbs;
        parsed.alfalfa_hay_price = +parsed.alfalfa_hay_price;
        parsed.slaughter_cow_price = +parsed.slaughter_cow_price;
        parsed.feed_cost_per_lb = parsed.dairy_ration;
        parsed.cow_replacement_cost_per_lb = parsed.milk_cow_cost_per_animal / parsed.milk_volume_to_buy_cow_in_lbs;
        parsed.alfalfa_cost_per_lb = parsed.alfalfa_hay_price / 2000; // tons to lbs
        parsed.other_costs_per_lb = Math.max(0, parsed.avg_price_milk - (parsed.feed_cost_per_lb + parsed.cow_replacement_cost_per_lb + parsed.alfalfa_cost_per_lb));
        return parsed;
    });

    let container = d3.select('#sankey-chart-area');
    container.selectAll('*').remove();
    
    // Create header with title and year slider
    const header = container.append('div')
        .attr('class', 'sankey-header')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('align-items', 'center')
        .style('gap', '1.5rem')
        .style('margin-bottom', '2rem');
    
    /*
    header.append('h3')
        .attr('class', 'sankey-title')
        .style('font-size', '1.5rem')
        .style('font-weight', '600')
        .style('margin', '0')
        .text('Origin of the Cost of Milk');
    */
        
    // Controls container for year selector and info
    const controls = header.append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '2rem')
        .style('width', '100%')
        .style('justify-content', 'center');
    
    // Year selector container
    const yearSelectorContainer = controls.append('div')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('gap', '0.5rem')
        .style('align-items', 'center');
        
    yearSelectorContainer.append('label')
        .attr('for', 'milk-cost-sankey-year')
        .style('font-weight', '500')
        .text('Select Year');
        
    // Modern styled select with a custom appearance
    const selectContainer = yearSelectorContainer.append('div')
        .style('position', 'relative')
        .style('display', 'inline-block')
        .style('background', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '8px')
        .style('overflow', 'hidden')
        .style('box-shadow', '0 1px 3px rgba(0,0,0,0.1)')
        .style('min-width', '150px');
    
    const yearSelect = selectContainer.append('select')
        .attr('id', 'milk-cost-sankey-year')
        .style('appearance', 'none')
        .style('border', 'none')
        .style('padding', '10px 32px 10px 16px')
        .style('width', '100%')
        .style('font-size', '16px')
        .style('background', 'transparent')
        .style('cursor', 'pointer')
        .style('z-index', '1')
        .style('position', 'relative');
    
    // Add a custom arrow indicator
    selectContainer.append('div')
        .style('position', 'absolute')
        .style('right', '12px')
        .style('top', '50%')
        .style('transform', 'translateY(-50%)')
        .style('pointer-events', 'none')
        .html('<svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    
    // Year options
    data.sort((a, b) => a.year - b.year).forEach(d => {
        yearSelect.append('option').attr('value', d.year).text(d.year);
    });

    // Add summary statistics container
    const summaryStats = controls.append('div')
        .attr('class', 'sankey-summary')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('gap', '0.25rem')
        .style('background', '#f8f8f8')
        .style('padding', '10px 16px')
        .style('border-radius', '8px')
        .style('font-size', '0.9rem');
        
    summaryStats.append('div')
        .attr('id', 'sankey-summary-price')
        .style('font-weight', '500');
        
    summaryStats.append('div')
        .attr('id', 'sankey-summary-components');
    
    // Chart area with responsive container
    const chartContainer = container.append('div')
        .attr('class', 'sankey-chart-container')
        .style('position', 'relative')
        .style('width', '100%')
        .style('max-width', '900px')
        .style('margin', '0 auto')
        .style('height', '450px')
        .style('border-radius', '12px')
        .style('background', '#ffffff')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.05)')
        .style('overflow', 'hidden');
        
    const chartDiv = chartContainer.append('div')
        .attr('id', 'milk-cost-sankey-svg-container')
        .style('width', '100%')
        .style('height', '100%')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('align-items', 'center');

    // Legend
    const legendContainer = container.append('div')
        .attr('class', 'sankey-legend')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('gap', '1.5rem')
        .style('flex-wrap', 'wrap')
        .style('margin-top', '1.5rem');

    // Define the color palette
    const colorPalette = {
        'Feed Cost': '#38bdf8', // bright blue
        'Cow Replacement Cost': '#fb923c', // bright orange
        'Hay Cost': '#a3e635', // lime green
        'Total Milk Price': '#f87171' // red
    };

    // Create legend items
    Object.entries(colorPalette).forEach(([key, color]) => {
        if (key !== 'Total Milk Price') {
            const legendItem = legendContainer.append('div')
                .attr('class', 'legend-item')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('gap', '6px');
                
            legendItem.append('div')
                .style('width', '16px')
                .style('height', '16px')
                .style('background', color)
                .style('border-radius', '4px');
                
            legendItem.append('span')
                .text(key);
        }
    });

    // Create SVG defs for gradients once
    let svgDefs;
    
    // Main draw function that handles both initial render and transitions
    function draw(year, isTransition = false) {
        const d = data.find(row => row.year == year);
        if (!d) return;

        // Update summary statistics
        d3.select('#sankey-summary-price')
            .html(`<strong>Milk Price:</strong> $${d3.format(",.4f")(d.avg_price_milk)} per lb`);
        
        const componentsText = `
            <div><strong>Feed:</strong> $${d3.format(",.4f")(d.feed_cost_per_lb)} per lb</div>
            <div><strong>Cow Replacement:</strong> $${d3.format(",.4f")(d.cow_replacement_cost_per_lb)} per lb</div>
            <div><strong>Hay price:</strong> $${d3.format(",.4f")(d.alfalfa_cost_per_lb)} per lb</div>
        `;
        d3.select('#sankey-summary-components').html(componentsText);

        // Sankey nodes with dynamic "other costs" node
        const nodes = [
            { name: 'Feed Cost' },
            { name: 'Cow Replacement Cost', displayName: 'Cow Replacement' },
            { name: 'Hay Cost' },
            { name: 'Total Milk Price' }
        ];
        
        // Sankey links (all to Total Milk Price)
        const links = [
            { source: 'Feed Cost', target: 'Total Milk Price', value: d.feed_cost_per_lb },
            { source: 'Cow Replacement Cost', target: 'Total Milk Price', value: d.cow_replacement_cost_per_lb },
            { source: 'Hay Cost', target: 'Total Milk Price', value: d.alfalfa_cost_per_lb }
        ];
        
        // Filter out zero/negative links
        const validLinks = links.filter(l => l.value > 0);
        
        // Dimensions and responsive sizing
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const containerWidth = chartDiv.node().getBoundingClientRect().width;
        const containerHeight = chartDiv.node().getBoundingClientRect().height;
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        // Set up SVG if it doesn't exist
        if (chartDiv.select('svg').empty() || !isTransition) {
            chartDiv.selectAll('*').remove();
            
            const svg = chartDiv.append('svg')
                .attr('width', containerWidth)
                .attr('height', containerHeight)
                .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
                .attr('style', 'max-width: 100%; height: auto;');
            
            // Create defs for gradients and clipping paths
            svgDefs = svg.append('defs');
            
            // Add a clip path to constrain content
            svgDefs.append('clipPath')
                .attr('id', 'sankey-clip')
                .append('rect')
                .attr('width', width)
                .attr('height', height);
                
            // Create base group with margin and clipping
            svg.append('g')
                .attr('class', 'sankey-main-group')
                .attr('transform', `translate(${margin.left},${margin.top})`)
                .attr('clip-path', 'url(#sankey-clip)');
        }
        
        const svg = chartDiv.select('svg');
        const mainGroup = svg.select('.sankey-main-group');
        
        // Remove previous chart elements before drawing new ones
        mainGroup.selectAll('*').remove();
        
        // Sankey layout with adjusted settings for better flow containment
        const sankey = d3.sankey()
            .nodeId(d => d.name)
            .nodeWidth(24)
            .nodePadding(40)
            .nodeAlign(d3.sankeyJustify) // Use justify alignment for better visual balance
            .extent([[0, 0], [width, height]])
            .linkSort(null); // Keep links in the original order
        
        const {nodes: graphNodes, links: graphLinks} = sankey({
            nodes: nodes.map(d => Object.assign({}, d)),
            links: validLinks.map(d => Object.assign({}, d))
        });
        
        // Custom link curve generator for smoother, more rounded flows within node boundaries
        const sankeyLinkPath = function(d) {
            const curvature = 0.5; // Curve factor
            
            let x0 = d.source.x1,
                x1 = d.target.x0,
                y0 = d.y0,
                y1 = d.y1;
            
            const xi = d3.interpolateNumber(x0, x1),
                x2 = xi(curvature),
                x3 = xi(1 - curvature);
                
            // Create the path with proper control points
            return `
              M${x0},${y0}
              C${x2},${y0} ${x3},${y1} ${x1},${y1}
            `;
        };

        // Create gradient definitions for each link
        svgDefs.selectAll('*').remove();
        
        graphLinks.forEach((link, i) => {
            const gradient = svgDefs.append('linearGradient')
                .attr('id', `gradient-${i}-${year}`)
                .attr('gradientUnits', 'userSpaceOnUse')
                .attr('x1', link.source.x1)
                .attr('x2', link.target.x0);
                
            gradient.append('stop')
                .attr('offset', '0%')
                .attr('stop-color', colorPalette[link.source.name]);
                
            gradient.append('stop')
                .attr('offset', '100%')
                .attr('stop-color', colorPalette[link.target.name]);
        });

        let tooltip = d3.select('body').select('.sankey-tooltip');
        if (tooltip.empty()) {
            tooltip = d3.select('body').append('div')
                .attr('class', 'sankey-tooltip')
                .style('position', 'fixed')
                .style('z-index', '99999')
                .style('pointer-events', 'none')
                .style('background', 'rgba(15,23,42,0.95)')
                .style('color', 'white')
                .style('border', 'none')
                .style('padding', '10px 16px')
                .style('border-radius', '8px')
                .style('font-size', '15px')
                .style('box-shadow', '0 4px 16px rgba(0,0,0,0.2)')
                .style('max-width', '320px')
                .style('backdrop-filter', 'blur(4px)')
                .style('display', 'none');
        }

        // Create or update links
        const linkGroup = mainGroup.selectAll('.link-group')
            .data(graphLinks, d => `${d.source.name}-${d.target.name}-${year}`); // include year in key
            
        const linkGroupEnter = linkGroup.enter()
            .append('g')
            .attr('class', 'link-group');
            
        linkGroupEnter
            .append('path')
            .attr('class', 'link')
            .attr('d', sankeyLinkPath)
            .style('fill', 'none')
            .style('stroke-opacity', 0)
            .style('stroke-width', d => {
                // Ensure stroke width doesn't exceed available space
                return Math.min(d.width, Math.min(d.source.y1 - d.source.y0, d.target.y1 - d.target.y0));
            })
            .style('stroke', (d, i) => `url(#gradient-${i}-${year})`)
            .style('stroke-linecap', 'butt')
            .style('stroke-linejoin', 'butt')
            .style('transition', 'all 0.4s ease')
            .on('mouseover', function(event, l) {
                // Highlight this link and connected nodes
                d3.select(this)
                    .style('stroke-opacity', 1)
                    .style('filter', 'drop-shadow(0 0 3px rgba(0,0,0,0.2))');
                    
                mainGroup.selectAll('.node')
                    .filter(n => n.name === l.source.name || n.name === l.target.name)
                    .style('filter', 'drop-shadow(0 0 4px rgba(0,0,0,0.3))');
                    
                const percent = (l.value / d.avg_price_milk * 100).toFixed(1);
                tooltip.style('display', 'block')
                    .html(`
                        <div style="font-weight: 600; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px">
                            ${l.source.name} → ${l.target.name}
                        </div>
                        <div style="display: grid; grid-template-columns: auto auto; gap: 4px; margin-top: 8px">
                            <div>Value:</div><div style="text-align: right; font-weight: 500">$${d3.format(",.4f")(l.value)} per lb</div>
                            <div>Percentage:</div><div style="text-align: right, font-weight: 500">${percent}% of milk price</div>
                        </div>
                    `);
            })
            .on('mousemove', function(event) {
                tooltip.style('left', (event.clientX + 15) + 'px')
                    .style('top', (event.clientY - 30) + 'px');
            })
            .on('mouseout', function(event, l) {
                // Remove highlighting
                d3.select(this)
                    .style('stroke-opacity', 0.6)
                    .style('filter', null);
                    
                mainGroup.selectAll('.node')
                    .style('filter', null);
                    
                tooltip.style('display', 'none');
            })
            .transition()
            .duration(isTransition ? 750 : 0)
            .style('stroke-opacity', 0.6);
        
        // Add flow labels to new links
        linkGroupEnter
            .append('text')
            .attr('class', 'link-label')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('pointer-events', 'none')
            .style('font-size', '14px')
            .style('font-weight', '500')
            .style('fill', '#222')
            .style('opacity', 0)
            .text(d => d.source.name)
            .attr('x', d => (d.source.x1 + d.target.x0) / 2)
            .attr('y', d => (d.y0 + d.y1) / 2)
            .transition()
            .duration(isTransition ? 750 : 0)
            .style('opacity', 1);
        
        // Update existing link labels
        linkGroup.select('.link-label')
            .transition()
            .duration(isTransition ? 750 : 0)
            .attr('x', d => (d.source.x1 + d.target.x0) / 2)
            .attr('y', d => (d.y0 + d.y1) / 2)
            .text(d => d.source.name);
        
        linkGroup.exit()
            .transition()
            .duration(isTransition ? 750 : 0)
            .style('opacity', 0)
            .remove();

        // Create or update nodes with smooth transitions
        const node = mainGroup.selectAll('.node')
            .data(graphNodes, d => `${d.name}-${year}`); // include year in key
            
        const nodeEnter = node.enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x0},${d.y0})`)
            .style('opacity', 0);
            
        // Node rectangle
        nodeEnter.append('rect')
            .attr('height', d => Math.max(1, d.y1 - d.y0))
            .attr('width', d => d.x1 - d.x0)
            .attr('fill', d => colorPalette[d.name])
            .attr('rx', 4) // Rounded corners
            .attr('stroke', 'none')
            .style('filter', 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))')
            .style('transition', 'all 0.2s ease')
            .on('mouseover', function(event, n) {
                // Highlight the node
                d3.select(this.parentNode)
                    .style('filter', 'drop-shadow(0 0 4px rgba(0,0,0,0.3))');
                    
                // Also highlight connected links
                mainGroup.selectAll('.link')
                    .filter(l => l.source.name === n.name || l.target.name === n.name)
                    .style('stroke-opacity', 1)
                    .style('filter', 'drop-shadow(0 0 3px rgba(0,0,0,0.2))');

                // Generate tooltip content based on node type
                let info = '';
                if (n.name === 'Feed Cost') {
                    const percent = (d.feed_cost_per_lb / d.avg_price_milk * 100).toFixed(1);
                    info = `
                        <div style="display: grid; grid-template-columns: auto auto; gap: 4px; margin-top: 8px">
                            <div>Feed cost:</div>
                            <div style="text-align: right; font-weight: 500">$${d3.format(",.4f")(d.feed_cost_per_lb)} per lb</div>
                            <div>Percentage:</div>
                            <div style="text-align: right; font-weight: 500">${percent}% of milk price</div>
                        </div>
                    `;
                }
                else if (n.name === 'Cow Replacement Cost') {
                    const percent = (d.cow_replacement_cost_per_lb / d.avg_price_milk * 100).toFixed(1);
                    info = `
                        <div style="display: grid; grid-template-columns: auto auto; gap: 4px; margin-top: 8px">
                            <div>Replacement cost:</div>
                            <div style="text-align: right; font-weight: 500">$${d3.format(",.4f")(d.cow_replacement_cost_per_lb)} per lb</div>
                            <div>Percentage:</div>
                            <div style="text-align: right; font-weight: 500">${percent}% of milk price</div>
                            <div>Cow cost:</div>
                            <div style="text-align: right; font-weight: 500">$${d3.format(",.0f")(d.milk_cow_cost_per_animal)}</div>
                            <div>Milk to buy cow:</div>
                            <div style="text-align: right; font-weight: 500">${d3.format(",.0f")(d.milk_volume_to_buy_cow_in_lbs)} lbs</div>
                        </div>
                    `;
                }
                else if (n.name === 'Hay Cost') {
                    const percent = (d.alfalfa_cost_per_lb / d.avg_price_milk * 100).toFixed(1);
                    info = `
                        <div style="display: grid; grid-template-columns: auto auto; gap: 4px; margin-top: 8px">
                            <div>cost:</div>
                            <div style="text-align: right; font-weight: 500">$${d3.format(",.4f")(d.alfalfa_cost_per_lb)} per lb</div>
                            <div>Percentage:</div>
                            <div style="text-align: right; font-weight: 500">${percent}% of milk price</div>
                            <div>price:</div>
                            <div style="text-align: right; font-weight: 500">$${d3.format(",.2f")(d.alfalfa_hay_price)} per ton</div>
                        </div>
                    `;
                }
                else if (n.name === 'Total Milk Price') {
                    info = `
                        <div style="display: grid; grid-template-columns: auto auto; gap: 4px; margin-top: 8px">
                            <div>Total milk price:</div>
                            <div style="text-align: right; font-weight: 500">$${d3.format(",.4f")(d.avg_price_milk)} per lb</div>
                        </div>
                    `;
                }
                tooltip.style('display', 'block')
                    .html(`
                        <div style="font-weight: 600; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px">
                            ${n.name}
                        </div>
                        ${info}
                    `);
            })
            .on('mousemove', function(event) {
                tooltip.style('left', (event.clientX + 15) + 'px')
                    .style('top', (event.clientY - 30) + 'px');
            })
            .on('mouseout', function(event, n) {
                d3.select(this.parentNode)
                    .style('filter', null);
                    
                mainGroup.selectAll('.link')
                    .style('stroke-opacity', 0.6)
                    .style('filter', null);
                    
                tooltip.style('display', 'none');
            });
            
        // Fade in new nodes
        nodeEnter
            .transition()
            .duration(isTransition ? 750 : 0)
            .style('opacity', 1);
            
        // Update existing nodes with transitions
        const nodeUpdate = node
            .transition()
            .duration(isTransition ? 750 : 0)
            .attr('transform', d => `translate(${d.x0},${d.y0})`)
            .style('opacity', 1);

        nodeUpdate.select('rect')
            .attr('height', d => Math.max(1, d.y1 - d.y0))
            .attr('width', d => d.x1 - d.x0);

        node.exit()
            .transition()
            .duration(isTransition ? 750 : 0)
            .style('opacity', 0)
            .remove();
    }
    
    // Make the visualization responsive
    function resizeChart() {
        const currentYear = yearSelect.property('value');
        draw(currentYear, false);
    }
    
    // Add resize listener
    window.addEventListener('resize', debounce(resizeChart, 250));
    
    // Debounce function to limit resize calls
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    // Initial draw
    const initialYear = data[data.length-1].year;
    draw(initialYear);
    yearSelect.property('value', initialYear);
    
    // Year selector event with smooth transitions
    yearSelect.on('change', function() {
        draw(this.value, true); // Enable transitions on user interaction
    });
}

// Run the chart
if (typeof d3 !== 'undefined' && typeof d3.sankey !== 'undefined') {
    initMilkCostSankey();
}