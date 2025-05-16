document.addEventListener('DOMContentLoaded', function() {
    // Dummy data for the graph
    const data = [
        { year: 2010, capital: 50000 },
        { year: 2011, capital: 55000 },
        { year: 2012, capital: 60000 },
        { year: 2013, capital: 65000 },
        { year: 2014, capital: 70000 },
        { year: 2015, capital: 75000 },
        { year: 2016, capital: 80000 },
        { year: 2017, capital: 85000 },
        { year: 2018, capital: 90000 },
        { year: 2019, capital: 95000 },
        { year: 2020, capital: 100000 }
    ];

    // Set the dimensions and margins of the graph
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    const svg = d3.select(".large-graph-placeholder")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Function to handle the info button click
    function handleInfoClick(event) {
        const placeholder = event.target.closest('.mini-graph-placeholder, .large-graph-placeholder');
        if (!placeholder) return;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.zIndex = 999;
        document.body.appendChild(overlay);

        // Store original styles
        placeholder.dataset.originalPosition = placeholder.style.position;
        placeholder.dataset.originalTop = placeholder.style.top;
        placeholder.dataset.originalLeft = placeholder.style.left;
        placeholder.dataset.originalWidth = placeholder.style.width;
        placeholder.dataset.originalHeight = placeholder.style.height;
        placeholder.dataset.originalZIndex = placeholder.style.zIndex;

        // Apply popup styles
        placeholder.style.position = 'fixed';
        placeholder.style.top = '50%';
        placeholder.style.left = '50%';
        placeholder.style.transform = 'translate(-50%, -50%)';
        placeholder.style.width = '80%';
        placeholder.style.height = '80%';
        placeholder.style.zIndex = 1000;
        placeholder.style.backgroundColor = 'white'; // Or match original background
        placeholder.style.padding = '20px';
        placeholder.style.boxSizing = 'border-box';
        placeholder.style.overflow = 'auto'; // In case content is larger than popup

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = 1001;
        placeholder.appendChild(closeButton);

        // Close button event listener
        closeButton.addEventListener('click', function() {
            // Restore original styles
            placeholder.style.position = placeholder.dataset.originalPosition;
            placeholder.style.top = placeholder.dataset.originalTop;
            placeholder.style.left = placeholder.dataset.originalLeft;
            placeholder.style.width = placeholder.dataset.originalWidth;
            placeholder.style.height = placeholder.dataset.originalHeight;
            placeholder.style.zIndex = placeholder.dataset.originalZIndex;
            placeholder.style.transform = ''; // Remove transform
            placeholder.style.backgroundColor = ''; // Remove added background
            placeholder.style.padding = ''; // Remove added padding
            placeholder.style.boxSizing = ''; // Remove added box-sizing
            placeholder.style.overflow = ''; // Remove added overflow
            closeButton.remove();
            overlay.remove();
        });
    }

    // Add event listeners to all info buttons within the panel
    const infoButtons = document.querySelectorAll('.investment-visualizations .info-button'); // Assuming 'info-button' class is used for info buttons
    infoButtons.forEach(button => {
        button.addEventListener('click', handleInfoClick);
    });

    // X axis: determine the range of years
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d"))); // Format as integer years

    // Y axis: determine the range of capital
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.capital)])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add the line
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => x(d.year))
            .y(d => y(d.capital))
        );
});