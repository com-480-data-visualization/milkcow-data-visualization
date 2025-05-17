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
        // Derived
        parsed.feed_cost_per_lb = parsed.dairy_ration;
        parsed.cow_replacement_cost_per_lb = parsed.milk_cow_cost_per_animal / parsed.milk_volume_to_buy_cow_in_lbs;
        parsed.alfalfa_cost_per_lb = parsed.alfalfa_hay_price / 2000; // tons to lbs
        parsed.other_costs_per_lb = Math.max(0, parsed.avg_price_milk - (parsed.feed_cost_per_lb + parsed.cow_replacement_cost_per_lb + parsed.alfalfa_cost_per_lb));
        return parsed;
    });

    // UI: Add year selector
    let container = d3.select('#sankey-chart-area');
    container.selectAll('*').remove();
    container.append('h3').text('Origin of the Cost of Milk (Sankey)');
    const yearSelect = container.append('select').attr('id', 'milk-cost-sankey-year')
        .style('margin-bottom', '1rem');
    data.forEach(d => {
        yearSelect.append('option').attr('value', d.year).text(d.year);
    });
    // Chart area
    const chartDiv = container.append('div')
        .attr('id', 'milk-cost-sankey-svg-container')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('align-items', 'center');

    function draw(year) {
        chartDiv.selectAll('*').remove();
        const d = data.find(row => row.year == year);
        if (!d) return;
        // Sankey nodes
        const nodes = [
            { name: 'Feed Cost' },
            { name: 'Cow Replacement Cost' },
            { name: 'Alfalfa Hay Cost' },
            { name: 'Total Milk Price' }
        ];
        // Sankey links (all to Total Milk Price)
        const links = [
            { source: 'Feed Cost', target: 'Total Milk Price', value: d.feed_cost_per_lb },
            { source: 'Cow Replacement Cost', target: 'Total Milk Price', value: d.cow_replacement_cost_per_lb },
            { source: 'Alfalfa Hay Cost', target: 'Total Milk Price', value: d.alfalfa_cost_per_lb }
        ];
        // Filter out zero/negative links
        const validLinks = links.filter(l => l.value > 0);
        // Sankey layout
        const width = 600, height = 350;
        const svg = chartDiv.append('svg')
            .attr('width', width)
            .attr('height', height);
        const sankey = d3.sankey()
            .nodeId(d => d.name)
            .nodeWidth(30)
            .nodePadding(30)
            .extent([[0, 0], [width, height]]);
        const {nodes: graphNodes, links: graphLinks} = sankey({
            nodes: nodes.map(d => Object.assign({}, d)),
            links: validLinks.map(d => Object.assign({}, d))
        });
        // Color
        const color = d3.scaleOrdinal()
            .domain(nodes.map(n => n.name))
            .range(['#2ca02c', '#9467bd', '#ff7f0e', '#1f77b4']);

        // Tooltip div
        let tooltip = d3.select('body').select('.sankey-tooltip');
        if (tooltip.empty()) {
            tooltip = d3.select('body').append('div')
                .attr('class', 'sankey-tooltip')
                .style('position', 'fixed') // Use fixed positioning
                .style('z-index', '99999') // Ensure tooltip is above all content
                .style('pointer-events', 'none')
                .style('background', 'rgba(255,255,255,0.97)')
                .style('border', '1px solid #aaa')
                .style('padding', '8px 14px')
                .style('border-radius', '8px')
                .style('font-size', '15px')
                .style('color', '#222')
                .style('box-shadow', '0 2px 8px rgba(0,0,0,0.12)')
                .style('display', 'none');
        }

        // Draw links
        svg.append('g')
            .selectAll('path')
            .data(graphLinks)
            .join('path')
            .attr('d', d3.sankeyLinkHorizontal())
            .attr('stroke', d => color(d.source.name))
            .attr('stroke-width', d => Math.max(1, d.width))
            .attr('fill', 'none')
            .attr('stroke-opacity', 0.6)
            .on('mouseover', function(event, l) {
                d3.select(this).attr('stroke-opacity', 1);
                tooltip.style('display', 'block')
                    .html(`<b>${l.source.name} → ${l.target.name}</b><br>Value: $${d3.format(",.4f")(l.value)} per lb`);
            })
            .on('mousemove', function(event) {
                tooltip.style('left', (event.clientX + 15) + 'px')
                    .style('top', (event.clientY - 30) + 'px');
            })
            .on('mouseout', function(event, l) {
                d3.select(this).attr('stroke-opacity', 0.6);
                tooltip.style('display', 'none');
            });
        // Draw nodes
        const node = svg.append('g')
            .selectAll('g')
            .data(graphNodes)
            .join('g');
        node.append('rect')
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('height', d => Math.max(1, d.y1 - d.y0))
            .attr('width', d => d.x1 - d.x0)
            .attr('fill', d => color(d.name))
            .attr('stroke', '#000')
            .on('mouseover', function(event, n) {
                d3.select(this).attr('stroke-width', 2);
                let info = '';
                if (n.name === 'Feed Cost') info = `Feed cost per lb: $${d3.format(",.4f")(d.feed_cost_per_lb)}`;
                else if (n.name === 'Cow Replacement Cost') info = `Cow replacement cost per lb: $${d3.format(",.4f")(d.cow_replacement_cost_per_lb)}<br>Cow cost: $${d3.format(",.0f")(d.milk_cow_cost_per_animal)}<br>Milk volume to buy cow: ${d3.format(",.0f")(d.milk_volume_to_buy_cow_in_lbs)} lbs`;
                else if (n.name === 'Alfalfa Hay Cost') info = `Alfalfa hay cost per lb: $${d3.format(",.4f")(d.alfalfa_cost_per_lb)}<br>Alfalfa hay price: $${d3.format(",.2f")(d.alfalfa_hay_price)} per ton`;
                else if (n.name === 'Total Milk Price') info = `Total milk price: $${d3.format(",.4f")(d.avg_price_milk)} per lb`;
                tooltip.style('display', 'block')
                    .html(`<b>${n.name}</b><br>${info}`);
            })
            .on('mousemove', function(event) {
                tooltip.style('left', (event.clientX + 15) + 'px')
                    .style('top', (event.clientY - 30) + 'px');
            })
            .on('mouseout', function(event, n) {
                d3.select(this).attr('stroke-width', 1);
                tooltip.style('display', 'none');
            });
        node.append('text')
            .attr('x', d => d.x0 < width / 2 ? d.x1 + 8 : d.x0 - 8)
            .attr('y', d => (d.y1 + d.y0) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
            .text(d => d.name)
            .style('font-size', '13px');
        node.append('title')
            .text(d => d.name === 'Total Milk Price'
                ? `Total Milk Price: $${d3.format(",.4f")(d.value)} per lb`
                : `${d.name}: $${d3.format(",.4f")(d.value)} per lb`);
    }
    // Initial draw
    const initialYear = data[data.length-1].year;
    draw(initialYear);
    yearSelect.property('value', initialYear);
    yearSelect.on('change', function() {
        draw(this.value);
    });
}

// Run the chart
if (typeof d3 !== 'undefined' && typeof d3.sankey !== 'undefined') {
    initMilkCostSankey();
}