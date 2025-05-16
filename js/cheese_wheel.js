/**
 * Cheese Wheel Visualization
 * 
 * This file creates a pie chart visualization of cheese consumption data
 * that resembles a cheese wheel, with options to select different years.
 */

// Data handling
let cheeseData = [];
let cheeseYears = [];
const excludedColumns = ['Year', 'Total American Chese', 'Total Italian Cheese', 'Total Natural Cheese', 'Total Processed Cheese Products'];

// Load the cheese data from CSV
d3.csv("dataset/clean_cheese.csv").then(data => {
    cheeseData = data;
    
    // Extract all available years from the data
    cheeseYears = cheeseData.map(d => d.Year);
    
    // Populate the year dropdown
    populateYearDropdown();
    
    // Initialize with the first year
    renderCheeseWheel(cheeseYears[0]);
}).catch(error => {
    console.error("Error loading cheese data:", error);
    document.getElementById('cheese-wheel-graph').innerHTML = `
        <p class="text-red-600 text-center">Error loading cheese data. Please try again later.</p>
    `;
});

// Populate the year dropdown menu
function populateYearDropdown() {
    const yearSelect = document.getElementById('cheese-year-select');
    
    // Clear existing options
    yearSelect.innerHTML = '';
    
    // Add options for each year
    cheeseYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
    
    // Add event listener for year selection change
    yearSelect.addEventListener('change', function() {
        renderCheeseWheel(this.value);
    });
}

// Function to prepare data for the pie chart
function prepareCheeseData(year) {
    const yearData = cheeseData.find(d => d.Year === year);
    if (!yearData) return [];
    
    // Create an array of objects for pie chart
    const pieData = [];
    
    Object.entries(yearData).forEach(([key, value]) => {
        // Exclude certain columns and check if value exists
        if (!excludedColumns.includes(key) && value !== 'NA' && value !== '') {
            pieData.push({
                type: key,
                value: parseFloat(value)
            });
        }
    });
    
    // Sort by value in descending order for better visualization
    return pieData.sort((a, b) => b.value - a.value);
}

// Generate a color palette that resembles cheese colors
function cheeseColorScale(index, total) {
    // Create a color scale from pale yellow to golden yellow/orange
    const baseColors = [
        "#f9e9bf", // Pale yellow
        "#f5d76e", // Light yellow
        "#f7ca56", // Yellow
        "#f0c13b", // Golden yellow
        "#edba23", // Deep golden
        "#e5ac00", // Amber
        "#d19f00", // Dark golden
        "#c39000", // Bronze
        "#b68300", // Brown gold
        "#9e7200"  // Deep amber
    ];
    
    // If we have more cheese types than colors, cycle through the colors
    return baseColors[index % baseColors.length];
}

// Get cheese-specific theme when hovering
function getCheeseTheme(cheeseType) {
    // Define specific themes for each cheese type
    const cheeseThemes = {
        "Cheddar": {
            color: "#f39c12", // Deep orange-yellow
            pattern: "cheddar",
            description: "Sharp and firm, aged cheese with a distinctive taste"
        },
        "American Other": {
            color: "#ffcc5c", // Pale orange-yellow
            pattern: "american",
            description: "Mild, creamy processed cheese"
        },
        "Mozzarella": {
            color: "#f5f5f5", // White
            pattern: "mozzarella",
            description: "Soft, mild Italian cheese with high moisture content"
        },
        "Italian other": {
            color: "#e8dabc", // Light beige
            pattern: "italian",
            description: "Various Italian cheeses with unique characteristics"
        },
        "Swiss": {
            color: "#ffe9c8", // Pale yellow
            pattern: "swiss",
            description: "Firm cheese with distinctive holes and nutty flavor"
        },
        "Brick": {
            color: "#ddc173", // Light brown
            pattern: "brick",
            description: "Semi-soft cheese with mild flavor when young, stronger when aged"
        },
        "Muenster": {
            color: "#ffdb99", // Pale orange
            pattern: "muenster",
            description: "Smooth, semi-soft cheese with mild flavor and orange rind"
        },
        "Cream and Neufchatel": {
            color: "#fffbf0", // Off-white
            pattern: "cream",
            description: "Soft, mild, spreadable cheese with high fat content"
        },
        "Blue": {
            color: "#b3c9df", // Blueish
            pattern: "blue",
            description: "Strong, sharp cheese with blue veins from mold cultures"
        },
        "Other Dairy Cheese": {
            color: "#e1d5b8", // Light tan
            pattern: "other",
            description: "Various specialty and artisanal cheeses"
        },
        "Processed Cheese": {
            color: "#ffce54", // Yellow-orange
            pattern: "processed",
            description: "Cheese products processed for longer shelf life and consistent texture"
        },
        "Foods and spreads": {
            color: "#fdebd0", // Very light beige
            pattern: "spread",
            description: "Cheese-based spreads and food products"
        }
    };
    
    // Return theme for the cheese type, or a default if not found
    return cheeseThemes[cheeseType] || {
        color: "#f5d76e", // Default yellow
        pattern: "default",
        description: "Delicious dairy product made from milk"
    };
}

// Render the cheese wheel visualization
function renderCheeseWheel(year) {
    // Clear previous visualization
    d3.select("#cheese-wheel-graph").html("");
    d3.select("#cheese-legend").html("");
    
    // Prepare data for the selected year
    const pieData = prepareCheeseData(year);
    if (pieData.length === 0) {
        document.getElementById('cheese-wheel-graph').innerHTML = `
            <p class="text-gray-600 text-center">No data available for ${year}.</p>
        `;
        return;
    }
    
    // Set up dimensions
    const width = 400;
    const height = 400;
    const margin = 20;
    const topMargin = 60; // Extra margin at the top for description
    const radius = Math.min(width, height) / 2 - margin;
    
    // Create SVG container
    const svg = d3.select("#cheese-wheel-graph")
        .append("svg")
        .attr("width", width)
        .attr("height", height + topMargin) // Add extra height for description
        .style("margin-top", "50px") // Add margin to move the wheel lower
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2 + topMargin/2})`);
    
    // Create cheese wheel outer crust (border)
    svg.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", radius + 5)
        .style("fill", "#c39000")
        .style("opacity", 0.7);
    
    // Create pie generator
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null); // Don't sort, preserve original order
    
    // Generate pie arcs
    const arc = d3.arc()
        .innerRadius(radius * 0.3) // Create a hole in the middle like some cheese wheels
        .outerRadius(radius);
    
    // Create the actual pie chart
    const pieSlices = svg.selectAll('path')
        .data(pie(pieData))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => cheeseColorScale(i, pieData.length))
        .attr('stroke', '#e5ac00')
        .style('stroke-width', '1px')
        .style('opacity', 0.9)
        .on('mouseover', function(event, d) {
            const cheeseType = d.data.type;
            const theme = getCheeseTheme(cheeseType);
            
            // Highlight on hover with cheese-specific theme
            d3.select(this)
                .transition()
                .duration(200)
                .style('opacity', 1)
                .attr('transform', 'scale(1.05)')
                .attr('fill', theme.color);
            
            // Add texture pattern if applicable
            if (theme.pattern !== "default") {
                addCheeseTexture(this, theme.pattern, d);
            }
                
            // Show percentage, value, and description in the center
            updateCenterText(cheeseType, d.data.value, d.value, theme.description);
            
            // Change center circle color to match the cheese
            centerInfoGroup.select("circle")
                .transition()
                .duration(200)
                .style("fill", theme.color)
                .style("opacity", 0.9);
        })
        .on('mouseout', function(event, d) {
            const i = pieData.findIndex(item => item.type === d.data.type);
            
            // Restore on mouseout
            d3.select(this)
                .transition()
                .duration(200)
                .style('opacity', 0.9)
                .attr('transform', 'scale(1)')
                .attr('fill', cheeseColorScale(i, pieData.length))
                .style('filter', null); // Remove any filter
                
            // Clear center text
            clearCenterText();
            
            // Restore center circle
            centerInfoGroup.select("circle")
                .transition()
                .duration(200)
                .style("fill", "#f9e9bf")
                .style("opacity", 0.9);
        });
    
    // Create cheese holes (small circles scattered across the cheese)
    for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius * 0.6;
        
        svg.append("circle")
            .attr("cx", Math.cos(angle) * distance)
            .attr("cy", Math.sin(angle) * distance)
            .attr("r", Math.random() * 5 + 2)
            .style("fill", "#f9e9bf")
            .style("opacity", 0.7);
    }
    
    // Add center info group
    const centerInfoGroup = svg.append("g")
        .attr("class", "center-info");
    
    // Add center circle
    centerInfoGroup.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", radius * 0.28) // Slightly larger to accommodate description
        .style("fill", "#f9e9bf")
        .style("opacity", 0.9);
    
    // Add year text in the center
    centerInfoGroup.append("text")
        .attr("class", "year-text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.5em") // Move up slightly
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .style("fill", "#b68300")
        .text(year);
    
    // Info text for hover (initially empty)
    centerInfoGroup.append("text")
        .attr("class", "cheese-type")
        .attr("text-anchor", "middle")
        .attr("dy", "1.2em") // Adjust position
        .style("font-size", "12px")
        .style("fill", "#7e5700")
        .text("");
    
    centerInfoGroup.append("text")
        .attr("class", "cheese-value")
        .attr("text-anchor", "middle")
        .attr("dy", "2.5em") // Adjust position
        .style("font-size", "12px")
        .style("fill", "#7e5700")
        .text("");
    
    // Create a legend
    const legend = d3.select("#cheese-legend");
    
    pieData.forEach((item, i) => {
        const theme = getCheeseTheme(item.type);
        
        const legendItem = legend.append("div")
            .attr("class", "flex items-center mr-4 mb-2")
            .style("cursor", "pointer")
            .on("mouseover", function() {
                // Highlight corresponding pie slice
                pieSlices.filter((d, j) => d.data.type === item.type)
                    .each(function(d) {
                        // Trigger the same hover effect as if hovering on the slice
                        const event = new Event("mouseover");
                        this.dispatchEvent(event);
                    });
                
                // Highlight this legend item
                d3.select(this)
                    .style("background-color", "rgba(0,0,0,0.05)")
                    .style("border-radius", "4px")
                    .style("padding", "2px");
            })
            .on("mouseout", function() {
                // Restore pie slice
                pieSlices.filter((d, j) => d.data.type === item.type)
                    .each(function() {
                        // Trigger mouseout event
                        const event = new Event("mouseout");
                        this.dispatchEvent(event);
                    });
                
                // Restore this legend item
                d3.select(this)
                    .style("background-color", "transparent")
                    .style("padding", "2px");
            });
        
        legendItem.append("div")
            .attr("class", "w-4 h-4 mr-1")
            .style("background-color", theme.color)
            .style("border", "1px solid #e5ac00");
        
        legendItem.append("span")
            .attr("class", "text-sm")
            .text(`${item.type}: ${item.value} lbs per capita`)
            .attr("title", theme.description); // Add description as tooltip
    });
    
    // Function to add cheese texture using SVG filters
    function addCheeseTexture(element, patternType, d) {
        // Define filter based on cheese type
        let filterEffect = "";
        
        switch (patternType) {
            case "cheddar":
                // Sharp, crumbly texture for cheddar
                filterEffect = `
                    <filter id="cheddar-texture-${d.index}" x="-50%" y="-50%" width="200%" height="200%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="3" result="noise"/>
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/>
                    </filter>
                `;
                break;
            case "swiss":
                // Holes for Swiss cheese
                filterEffect = `
                    <filter id="swiss-texture-${d.index}" x="-50%" y="-50%" width="200%" height="200%">
                        <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="noise"/>
                        <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 10 -5" result="holes"/>
                        <feComposite operator="in" in="SourceGraphic" in2="holes"/>
                    </filter>
                `;
                break;
            case "blue":
                // Blue-veined texture
                filterEffect = `
                    <filter id="blue-texture-${d.index}" x="-50%" y="-50%" width="200%" height="200%">
                        <feTurbulence type="turbulence" baseFrequency="0.1" numOctaves="2" result="noise"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 5 -2" result="veins"/>
                        <feComposite operator="over" in="SourceGraphic" in2="veins"/>
                    </filter>
                `;
                break;
            case "mozzarella":
                // Smooth, stretchy texture
                filterEffect = `
                    <filter id="mozzarella-texture-${d.index}" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur"/>
                        <feComposite operator="over" in="SourceGraphic" in2="blur"/>
                    </filter>
                `;
                break;
            case "cream":
                // Soft, creamy texture
                filterEffect = `
                    <filter id="cream-texture-${d.index}" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="blur"/>
                        <feComposite operator="over" in="SourceGraphic" in2="blur"/>
                    </filter>
                `;
                break;
            default:
                // Generic texture for other cheese types
                filterEffect = `
                    <filter id="cheese-texture-${d.index}" x="-50%" y="-50%" width="200%" height="200%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" result="noise"/>
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
                    </filter>
                `;
        }
        
        // Add the filter to the SVG defs
        if (!svg.select(`#cheese-texture-${d.index}`).node()) {
            svg.append("defs")
                .html(filterEffect);
        }
        
        // Apply the filter to the element
        d3.select(element)
            .style("filter", `url(#${patternType}-texture-${d.index})`);
    }
    
    // Function to update center text on hover
    function updateCenterText(type, value, arcValue, description) {
        const percentage = Math.round((arcValue / pie(pieData).reduce((sum, d) => sum + d.value, 0)) * 100);
        
        // Update cheese type text
        svg.select(".cheese-type")
            .text(type)
            .transition()
            .duration(200)
            .style("font-size", "14px")
            .style("font-weight", "bold");
        
        // Update value text
        svg.select(".cheese-value")
            .text(`${value} lbs (${percentage}%)`);
        
        // Get theme for this cheese type
        const theme = getCheeseTheme(type);
        
        // Update description background
        svg.select(".description-bg")
            .transition()
            .duration(200)
            .style("fill", theme.color)
            .style("opacity", 0.3) // Increase opacity for better visibility
        
        // Update description text at the top
        svg.select(".cheese-description")
            .text(description || "")
            .transition()
            .duration(200)
            .style("opacity", 1);
    }
    
    // Function to clear center text
    function clearCenterText() {
        svg.select(".cheese-type").text("");
        svg.select(".cheese-value").text("");
        
        // Fade out description and its background
        svg.select(".description-bg")
            .transition()
            .duration(200)
            .style("opacity", 0);
            
        svg.select(".cheese-description")
            .transition()
            .duration(200)
            .style("opacity", 0);
    }
    
    // Optional title and description area
    const titleGroup = svg.append("g")
        .attr("class", "title-group");
    
    // Title text
    titleGroup.append("text")
        .attr("class", "chart-title")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(0, ${-height/2 - 20})`) // Move up to account for extra space
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`Cheese Consumption (${year})`);
    
    // Description background - positioned with more space below the title
    titleGroup.append("rect")
        .attr("class", "description-bg")
        .attr("x", -150)
        .attr("y", -height/2 + 0) // Positioned farther down from title
        .attr("width", 300)
        .attr("height", 30) // Slightly taller for text
        .attr("rx", 5)
        .style("fill", "#f9e9bf")
        .style("stroke", "#e5ac00")
        .style("stroke-width", "1px")
        .style("opacity", 0);
    
    // Description text (initially empty, will be populated on hover)
    titleGroup.append("text")
        .attr("class", "cheese-description")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(0, ${-height/2 + 20})`) // Centered in the background
        .style("font-size", "13px")
        .style("font-style", "italic")
        .style("font-weight", "500") // Medium weight for better visibility
        .style("fill", "#7e5700")
        .style("opacity", 0)
        .text("");
}
