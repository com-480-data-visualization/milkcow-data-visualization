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