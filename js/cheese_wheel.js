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

// Create cheese-specific patterns and textures
function createCheesePatterns(defs) {
    // Create patterns for each cheese type
    const cheeseTypes = [
        "Cheddar", "American Other", "Mozzarella", "Italian other", 
        "Swiss", "Brick", "Muenster", "Cream and Neufchatel", 
        "Blue", "Other Dairy Cheese", "Processed Cheese", "Foods and spreads"
    ];

    cheeseTypes.forEach(cheeseType => {
        const theme = getCheeseTheme(cheeseType);
        const patternId = 'cheese-pattern-' + cheeseType.toLowerCase().replace(/\s+/g, '-');
        
        // Create a pattern for this cheese type
        const pattern = defs.append("pattern")
            .attr("id", patternId)
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 50)
            .attr("height", 50)
            .attr("patternTransform", "rotate(45)");
        
        // Add a background rectangle with the theme color
        pattern.append("rect")
            .attr("width", 50)
            .attr("height", 50)
            .attr("fill", theme.color);
            
        // Add cheese-specific textures based on type
        switch(theme.pattern) {
            case "swiss": 
                // Swiss cheese holes
                for(let i = 0; i < 4; i++) {
                    pattern.append("circle")
                        .attr("cx", 10 + Math.random() * 30)
                        .attr("cy", 10 + Math.random() * 30)
                        .attr("r", 3 + Math.random() * 5)
                        .attr("fill", d3.color(theme.color).brighter(0.5));
                }
                break;
                
            case "blue":
                // Blue cheese veins
                pattern.append("path")
                    .attr("d", "M0,0 L10,10 M15,15 L25,25 M30,10 L40,20 M5,30 L15,40")
                    .attr("stroke", "#b3c9df")
                    .attr("stroke-width", 2.5)
                    .attr("stroke-linecap", "round");
                    
                pattern.append("path")
                    .attr("d", "M20,0 L30,10 M35,35 L45,45 M10,30 L20,40 M40,5 L45,10")
                    .attr("stroke", "#b3c9df")
                    .attr("stroke-width", 2)
                    .attr("stroke-linecap", "round");
                break;
                
            case "cheddar":
                // Cheddar texture - slight crackling
                pattern.append("path")
                    .attr("d", "M0,10 L50,10 M0,30 L50,30")
                    .attr("stroke", d3.color(theme.color).darker(0.2))
                    .attr("stroke-width", 1)
                    .attr("stroke-dasharray", "3,3");
                    
                pattern.append("path")
                    .attr("d", "M10,0 L10,50 M30,0 L30,50")
                    .attr("stroke", d3.color(theme.color).darker(0.2))
                    .attr("stroke-width", 1)
                    .attr("stroke-dasharray", "4,2");
                break;
                
            case "mozzarella":
                // Mozzarella - smooth, milky texture
                // Add some very subtle texture with light highlights
                for(let i = 0; i < 10; i++) {
                    pattern.append("circle")
                        .attr("cx", Math.random() * 50)
                        .attr("cy", Math.random() * 50)
                        .attr("r", 2 + Math.random() * 3)
                        .attr("fill", "white")
                        .attr("opacity", 0.3);
                }
                break;
                
            case "muenster":
                // Muenster - slightly darker rings
                pattern.append("circle")
                    .attr("cx", 25)
                    .attr("cy", 25)
                    .attr("r", 20)
                    .attr("fill", "none")
                    .attr("stroke", d3.color(theme.color).darker(0.3))
                    .attr("stroke-width", 4)
                    .attr("opacity", 0.3);
                    
                pattern.append("circle")
                    .attr("cx", 25)
                    .attr("cy", 25)
                    .attr("r", 10)
                    .attr("fill", "none")
                    .attr("stroke", d3.color(theme.color).darker(0.2))
                    .attr("stroke-width", 2)
                    .attr("opacity", 0.2);
                break;
                
            case "brick":
                // Brick cheese - subtle rectangular texture
                pattern.append("rect")
                    .attr("x", 5)
                    .attr("y", 5)
                    .attr("width", 20)
                    .attr("height", 10)
                    .attr("fill", "none")
                    .attr("stroke", d3.color(theme.color).darker(0.3))
                    .attr("stroke-width", 1);
                    
                pattern.append("rect")
                    .attr("x", 25)
                    .attr("y", 25)
                    .attr("width", 20)
                    .attr("height", 10)
                    .attr("fill", "none")
                    .attr("stroke", d3.color(theme.color).darker(0.3))
                    .attr("stroke-width", 1);
                break;

            case "processed":
                // Processed cheese - smooth with subtle grid
                pattern.append("path")
                    .attr("d", "M0,10 L50,10 M0,20 L50,20 M0,30 L50,30 M0,40 L50,40")
                    .attr("stroke", d3.color(theme.color).darker(0.1))
                    .attr("stroke-width", 1);
                break;
                
            default:
                // Default pattern - subtle dots or specs
                for(let i = 0; i < 15; i++) {
                    pattern.append("circle")
                        .attr("cx", Math.random() * 50)
                        .attr("cy", Math.random() * 50)
                        .attr("r", 0.5 + Math.random() * 1.5)
                        .attr("fill", d3.color(theme.color).darker(0.3))
                        .attr("opacity", 0.4);
                }
                break;
        }
    });
}

// Render the cheese wheel visualization
function renderCheeseWheel(year) {
    // Clear previous visualization
    d3.select("#cheese-wheel-graph").html("");
    
    // Prepare data for the selected year
    const pieData = prepareCheeseData(year);
    if (pieData.length === 0) {
        document.getElementById('cheese-wheel-graph').innerHTML = `
            <p class="text-gray-600 text-center">No data available for ${year}.</p>
        `;
        return;
    }
    
    // Set up dimensions
    const width = 500;
    const height = 420;
    const margin = 20;
    const topMargin = 40; // Extra margin at the top for description
    const radius = Math.min(width, height) / 2 - margin;
    
    // Create container for both chart and legend
    const container = d3.select("#cheese-wheel-graph")
        .style("position", "relative") // For absolute positioning of legend
        .style("width", `${width + 250}px`) // Total width including legend
        .style("height", `${height + topMargin + 50}px`); // Added extra height for translation
    
    // Create SVG container with a clean white background
    const svg = container
        .append("svg")
        .attr("width", width + 250) // Added extra width for legend
        .attr("height", height + topMargin + 50) // Added extra height for translation
        .style("margin-top", "20px")
        .append("g")
        .attr("transform", `translate(${width / 2}, ${(height / 2) + 50})`); // Added 50px to move down

    // Add defs section for patterns
    const defs = svg.append("defs");
    
    // Create cheese textures as patterns
    createCheesePatterns(defs);

    // Create pie generator
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null); // Don't sort, preserve original order
    
    const pieGen = pie(pieData);

    // Generate pie arcs
    const arc = d3.arc()
        .innerRadius(radius * 0.4) // Wider hole in the middle to accommodate longer text
        .outerRadius(radius);
        
    const sideFaceHeight = 15;
    const arcSide = d3.arc()
        .innerRadius(radius * 0.4)
        .outerRadius(radius)
        .startAngle(d => d.startAngle)
        .endAngle(d => d.endAngle);

    const pieSlices = svg.selectAll('path.slice-top')
        .data(pieGen)
        .enter()
        .append('path')
        .attr('class', 'slice-top')
        .attr('d', arc)
        .attr('fill', (d) => {
            const theme = getCheeseTheme(d.data.type);
            return `url(#${getPatternId(d.data.type)})`;
        })
        .attr('stroke', '#e5ac00')
        .style('stroke-width', '1px')
        .style('opacity', 0.95)
        .on('mouseover', function(event, d) {
            const cheeseType = d.data.type;
            const theme = getCheeseTheme(cheeseType);
            
            // Enhanced highlight on hover with more dramatic animation
            d3.select(this)
                .transition()
                .duration(300)
                .style('opacity', 1)
                .attr('transform', 'scale(1.08)')
                //.style('filter', 'drop-shadow(0px 5px 5px rgba(0,0,0,0.3))')
                .style('stroke-width', '2px')
                .style('stroke', '#e09900')
                .on("end", function() {
                    // Add subtle pulsing effect after initial zoom
                    d3.select(this)
                        .transition()
                        .duration(700)
                        .attr('transform', 'scale(1.06)')
                        //.style('filter', 'drop-shadow(0px 4px 4px rgba(0,0,0,0.25))')
                        .transition()
                        .duration(700)
                        .attr('transform', 'scale(1.08)')
                        //.style('filter', 'drop-shadow(0px 5px 5px rgba(0,0,0,0.3))')
                        .on("end", function repeat() {
                            d3.select(this)
                                .transition()
                                .duration(700)
                                .attr('transform', 'scale(1.06)')
                                //.style('filter', 'drop-shadow(0px 4px 4px rgba(0,0,0,0.25))')
                                .transition()
                                .duration(700)
                                .attr('transform', 'scale(1.08)')
                                //.style('filter', 'drop-shadow(0px 5px 5px rgba(0,0,0,0.3))')
                                .on("end", repeat);
                        });
                });
                
            // Show percentage, value, and description in the center
            updateCenterText(cheeseType, d.data.value, d.value, theme.description);
            
            // Change center circle color to match the cheese
            centerInfoGroup.select("circle")
                .transition()
                .duration(200)
                .style("fill", theme.color)
                .style("opacity", 0.9);
                
            // Move the year text higher and fade it slightly to make room for cheese info
            centerInfoGroup.select(".year-text")
                .transition()
                .duration(200)
                .attr("dy", "-0.5em") // Move year text higher
                .style("opacity", 0.3);

            // Highlight the side of this slice too with enhanced effect
            svg.selectAll('path.slice-side')
                .filter((sd, i) => i === pieGen.indexOf(d))
                .transition()
                .duration(300)
                .attr('fill', d3.color(theme.color).darker(0.2))
                .style('filter', 'drop-shadow(0px 3px 3px rgba(0,0,0,0.2))')
                .attr('opacity', 0.9)
                .attr('transform', `translate(0, ${sideFaceHeight - 2})`)  // Move up slightly for 3D "lift" effect
                .on("end", function() {
                    // Subtle "breathing" effect for the side
                    d3.select(this)
                        .transition()
                        .duration(700)
                        .attr('transform', `translate(0, ${sideFaceHeight - 1})`) 
                        .transition()
                        .duration(700)
                        .attr('transform', `translate(0, ${sideFaceHeight - 2})`)
                        .on("end", function repeat() {
                            d3.select(this)
                                .transition()
                                .duration(700)
                                .attr('transform', `translate(0, ${sideFaceHeight - 1})`)
                                .transition()
                                .duration(700)
                                .attr('transform', `translate(0, ${sideFaceHeight - 2})`)
                                .on("end", repeat);
                        });
                });
        })
        .on('mouseout', function(event, d) {
            const theme = getCheeseTheme(d.data.type);
            
            // Smooth transition back to normal state (interrupting any ongoing animations)
            d3.select(this)
                .interrupt() // Stop any ongoing animations
                .transition()
                .duration(400)
                .style('opacity', 0.95)
                .attr('transform', 'scale(1)')
                .style('filter', 'none')
                .style('stroke-width', '1px')
                .style('stroke', '#e5ac00');
                
            // Clear center text completely
            clearCenterText();
            
            // Restore center circle
            centerInfoGroup.select("circle")
                .transition()
                .duration(200)
                .style("fill", "#f9e9bf")
                .style("opacity", 0.9);
                
            // Move the year back to center position and restore opacity
            centerInfoGroup.select(".year-text")
                .transition()
                .duration(200)
                .attr("dy", "0.15em") // Back to original position
                .style("opacity", 1);

            // Restore side color with smooth transition
            svg.selectAll('path.slice-side')
                .filter((sd, i) => i === pieGen.indexOf(d))
                .interrupt() // Stop any ongoing animations
                .transition()
                .duration(400)
                .attr('fill', d3.color(theme.color).darker(0.5))
                .style('filter', 'none')
                .attr('opacity', 0.7)
                .attr('transform', `translate(0, ${sideFaceHeight})`);
        });
    
    // Add center info group
    const centerInfoGroup = svg.append("g")
        .attr("class", "center-info");
    
    // Add center circle
    centerInfoGroup.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", radius * 0.38) // Wider circle to match the inner radius
        .style("fill", "#f9e9bf")
        .style("opacity", 0.9)
        .style("stroke", "#e5ac00")
        .style("stroke-width", "0.5px");
    
    // Add year text in the center - positioned higher to make room for multiline cheese names
    centerInfoGroup.append("text")
        .attr("class", "year-text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.15em") // Higher position to make room for multiline cheese names
        .style("font-size", "36px")
        .style("font-weight", "bold")
        .style("fill", "#b68300")
        .text(year);
    
    // Info text for hover (initially empty) - configured to support multiple lines
    centerInfoGroup.append("text")
        .attr("class", "cheese-type")
        .attr("text-anchor", "middle")
        .attr("dy", "1.5em")
        .style("font-size", "14px")
        .style("fill", "#7e5700")
        .text(""); // Initialize with empty text
    
    centerInfoGroup.append("text")
        .attr("class", "cheese-value")
        .attr("text-anchor", "middle")
        .attr("dy", "3em")
        .style("font-size", "13px")
        .style("fill", "#7e5700")
        .text("");
    
    // Create a more visually appealing legend similar to the infographic
    const legend = container.append("div")
        .attr("id", "cheese-legend")
        .style("position", "absolute") // Position absolutely
        .style("top", "20px") // Match SVG margin-top
        .style("right", "20px") // Add some padding from the right edge
        .style("width", "220px") // Fixed width for legend
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("justify-content", "flex-start")
        .style("padding", "10px")
        .style("background", "rgba(255, 255, 255, 0.9)") // Semi-transparent background
        .style("border-radius", "8px") // Rounded corners
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)"); // Subtle shadow
    
    pieData.forEach((item, i) => {
        const theme = getCheeseTheme(item.type);
        
        const legendItem = legend.append("div")
            .attr("class", "flex items-center mb-2") // Removed mr-4 since we're now in column layout
            .style("cursor", "pointer")
            .style("padding", "4px")
            .style("border-radius", "4px")
            .style("width", "200px") // Fixed width for legend items
            .on("mouseover", function() {
                // Highlight corresponding pie slice
                pieSlices.filter((d) => d.data.type === item.type)
                    .each(function(d) {
                        const event = new Event("mouseover");
                        this.dispatchEvent(event);
                    });
                
                // Highlight this legend item
                d3.select(this)
                    .style("background-color", "rgba(0,0,0,0.05)");
            })
            .on("mouseout", function() {
                // Restore pie slice
                pieSlices.filter((d) => d.data.type === item.type)
                    .each(function() {
                        const event = new Event("mouseout");
                        this.dispatchEvent(event);
                    });
                
                // Restore this legend item
                d3.select(this)
                    .style("background-color", "transparent");
            });
        
        legendItem.append("div")
            .attr("class", "w-5 h-5 mr-2")
            .style("background-color", theme.color)
            .style("border", "1px solid #e5ac00");
        
        legendItem.append("span")
            .attr("class", "text-sm")
            .text(`${item.type}: ${item.value} lbs`)
            .style("font-weight", "500")
            .style("font-size", "13px")
            .style("color", "#333")
            .attr("title", theme.description);
    });
    
    /*
    // Title text (positioned above the chart)
    svg.append("text")
        .attr("class", "chart-title")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(0, ${-height/2 - 30})`)
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("fill", "#333333")
        .text(`Cheese Consumption (${year})`);
    */
    
    // Description text (initially empty, will be populated on hover)
    svg.append("text")
        .attr("class", "cheese-description")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(0, ${-height/2 - 10})`)
        .style("font-size", "15px")
        .style("font-style", "italic")
        .style("font-weight", "500")
        .style("fill", "#7e5700")
        .style("opacity", 0)
        .text("");

    // Function to update center text on hover
    function updateCenterText(type, value, arcValue, description) {
        const percentage = Math.round((arcValue / pie(pieData).reduce((sum, d) => sum + d.value, 0)) * 100);
        
        // For long cheese names, split into multiple lines
        const maxLineLength = 12; // characters per line
        let displayText;
        
        // Clear previous text content
        svg.select(".cheese-type").selectAll('*').remove();
        
        if (type.length > maxLineLength) {
            // Split long names by words
            const words = type.split(' ');
            let lines = [''];
            let currentLine = 0;
            
            words.forEach(word => {
                if ((lines[currentLine] + ' ' + word).length > maxLineLength && lines[currentLine].length > 0) {
                    // Start a new line
                    currentLine++;
                    lines[currentLine] = word;
                } else {
                    // Add to current line
                    if (lines[currentLine].length > 0) {
                        lines[currentLine] += ' ' + word;
                    } else {
                        lines[currentLine] = word;
                    }
                }
            });
            
            // Update cheese type text - each line as separate text element
            lines.forEach((line, i) => {
                svg.select(".cheese-type")
                    .append("tspan")
                    .attr("x", 0)
                    .attr("dy", i === 0 ? 0 : "1.2em")
                    .text(line);
            });
            
            svg.select(".cheese-type")
                .transition()
                .duration(200)
                .style("font-size", "16px")
                .style("font-weight", "bold");
                
            const valueOffset = 1.5 + (lines.length * 1.2);
            
            svg.select(".cheese-value")
                .attr("dy", `${valueOffset}em`)
                .text(`${value} lbs (${percentage}%)`);
        } else {
            // For short names, properly center the text
            svg.select(".cheese-type")
                .append("tspan")
                .attr("x", 0)
                .attr("dy", 0)
                .text(type);
                
            svg.select(".cheese-type")
                .transition()
                .duration(200)
                .style("font-size", "16px")
                .style("font-weight", "bold");
                
            // Fixed position for short names with proper spacing
            svg.select(".cheese-value")
                .attr("dy", "3em")  // Ensure good vertical separation for short names
                .text(`${value} lbs (${percentage}%)`);
        }
        
        // Update description text at the top
        svg.select(".cheese-description")
            .text(description || "")
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("fill", "#333");
    }
    
    // Function to clear center text
    function clearCenterText() {
        // Clear all content from cheese type (including any tspans for multiline text)
        svg.select(".cheese-type").selectAll("*").remove();
        svg.select(".cheese-type").text(""); // Ensure the text element itself is cleared
        svg.select(".cheese-value").text("");
        
        // Reset the value text position to default
        svg.select(".cheese-value")
            .attr("dy", "3em")
            .style("opacity", 1);
        
        // Make sure the year is in the center position
        centerInfoGroup.select(".year-text")
            .transition()
            .duration(200)
            .attr("dy", "0.15em") // Ensure it's back to original position
            .style("opacity", 1);
        
        // Fade out description
        svg.select(".cheese-description")
            .transition()
            .duration(200)
            .style("opacity", 0);
    }

    // Function to get pattern ID from cheese type
    function getPatternId(cheeseType) {
        return 'cheese-pattern-' + cheeseType.toLowerCase().replace(/\s+/g, '-');
    }
}
