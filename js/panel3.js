document.addEventListener('DOMContentLoaded', function() {

    // Define the data sets
    const initialData = [ // Fewer data points for the small view
        { year: 2015, capital: 75000 }, { year: 2016, capital: 80000 },
        { year: 2017, capital: 85000 }, { year: 2018, capital: 90000 },
        { year: 2019, capital: 95000 }, { year: 2020, capital: 100000 }
    ];

    const detailedData = [ // More data points and variation for the enlarged view
        { year: 2010, capital: 50000 }, { year: 2011, capital: 55000 },
        { year: 2012, capital: 62000 }, { year: 2013, capital: 60000 }, // Dip
        { year: 2014, capital: 70000 }, { year: 2015, capital: 78000 },
        { year: 2016, capital: 85000 }, { year: 2017, capital: 82000 }, // Another dip
        { year: 2018, capital: 93000 }, { year: 2019, capital: 105000 },
        { year: 2020, capital: 115000 }, { year: 2021, capital: 120000 },
        { year: 2022, capital: 110000 }, { year: 2023, capital: 130000 },
        { year: 2024, capital: 145000 } // More recent data
    ];

    const svgId = 'capital-evolution-graph'; // Assumes your HTML has <svg id="capital-evolution-graph">

    // Main function to draw/update the D3 graph
    function renderCapitalEvolutionGraph(dataToRender, isEnlargedView) {
        const svgContainer = d3.select(".large-graph-placeholder"); // The div containing the SVG
        let svg = svgContainer.select(`#${svgId}`);

        if (svg.empty()) {
            console.error(`SVG element with id #${svgId} not found within .large-graph-placeholder. Cannot render D3 graph.`);
            // Fallback: if the SVG is missing from HTML, create it.
            // Better to ensure HTML provides the SVG structure.
            // svgContainer.append('svg').attr('id', svgId).attr('width', '100%').attr('height', '100%');
            // svg = svgContainer.select(`#${svgId}`);
            // if (svg.empty()) return;
            return;
        }

        svg.selectAll("*").remove(); // Clear previous contents

        let availableWidth = parseFloat(svg.node().clientWidth);
        let availableHeight = parseFloat(svg.node().clientHeight);

        if (!availableWidth || availableWidth < 50 || !availableHeight || availableHeight < 50 ) { // Min dimensions check
            const placeholderNode = svgContainer.node();
            availableWidth = placeholderNode.clientWidth || placeholderNode.offsetWidth;
            availableHeight = placeholderNode.clientHeight || placeholderNode.offsetHeight;
             // If still too small, log and exit
            if (!availableWidth || availableWidth < 50 || !availableHeight || availableHeight < 50 ) {
                console.warn("SVG container is too small for graph rendering.", `W:${availableWidth}, H:${availableHeight}`);
                svg.append("text").attr("x", 10).attr("y", 20).text("Too small to render.").attr("fill", "grey").style("font-size","10px");
                return;
            }
        }
        
        const margin = { top: 30, right: 30, bottom: 50, left: 70 };
        if (isEnlargedView) {
            margin.top = 50; margin.right = 50; margin.bottom = 70; margin.left = 80;
        }

        const width = availableWidth - margin.left - margin.right;
        const height = availableHeight - margin.top - margin.bottom;

        if (width <= 0 || height <= 0) {
            console.warn("Calculated graph dimensions (width/height) are too small.", `W: ${width}, H: ${height}`);
            svg.append("text").attr("x", 10).attr("y", 20).text("Too small to render graph.").attr("fill", "grey").style("font-size","10px");
            return;
        }

        const chartG = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain(d3.extent(dataToRender, d => d.year))
            .range([0, width]);
        chartG.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(isEnlargedView ? Math.min(dataToRender.length, 10) : 5))
            .selectAll("text")
                .style("font-size", isEnlargedView ? "12px" : "10px")
                .attr("transform", "rotate(-30)")
                .attr("text-anchor", "end")
                .attr("dx", "-.8em").attr("dy", ".15em");

        const y = d3.scaleLinear()
            .domain([0, d3.max(dataToRender, d => d.capital) * 1.05])
            .range([height, 0]);
        chartG.append("g")
            .call(d3.axisLeft(y).ticks(isEnlargedView ? 8 : 5).tickFormat(d3.format("~s")))
            .selectAll("text")
                .style("font-size", isEnlargedView ? "12px" : "10px");

        chartG.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + (isEnlargedView ? 20 : 15))
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em").style("text-anchor", "middle")
            .style("font-size", isEnlargedView ? "14px" : "12px")
            .text("Capital ($)");

        chartG.append("text")
            .attr("transform", `translate(${width/2}, ${height + margin.bottom - (isEnlargedView ? 20 : 15)})`)
            .style("text-anchor", "middle")
            .style("font-size", isEnlargedView ? "14px" : "12px")
            .text("Year");

        chartG.append("path")
            .datum(dataToRender)
            .attr("fill", "none")
            .attr("stroke", isEnlargedView ? "orangered" : "steelblue")
            .attr("stroke-width", isEnlargedView ? 2.5 : 2)
            .attr("d", d3.line()
                .x(d => x(d.year))
                .y(d => y(d.capital))
                .curve(d3.curveMonotoneX));
        
        chartG.selectAll(".dot")
            .data(dataToRender)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.capital))
            .attr("r", isEnlargedView ? 4 : 3)
            .attr("fill", isEnlargedView ? "orangered" : "steelblue")
            .append("title")
               .text(d => `Year: ${d.year}\nCapital: $${d3.format(",")(d.capital)}`);

        chartG.append("text")
            .attr("x", width / 2)
            .attr("y", 0 - (margin.top / 2) - (isEnlargedView ? 5 : 0))
            .attr("text-anchor", "middle")
            .style("font-size", isEnlargedView ? "18px" : "14px")
            .style("font-weight", "bold")
            .text(`Capital Evolution (${isEnlargedView ? "Detailed" : "Overview"})`);
    }

    function handleD3PanelInfoClick(event) {
        const placeholder = event.target.closest('.large-graph-placeholder');
        if (!placeholder || !placeholder.querySelector(`#${svgId}`)) return;

        const isAlreadyEnlarged = placeholder.classList.contains('panel3-d3-enlarged');
        const overlayClass = 'panel3-d3-overlay';
        const closeButtonClass = 'panel3-d3-close-button';

        if (isAlreadyEnlarged) {
            placeholder.style.position = placeholder.dataset.originalPosition || '';
            placeholder.style.top = placeholder.dataset.originalTop || '';
            placeholder.style.left = placeholder.dataset.originalLeft || '';
            placeholder.style.width = placeholder.dataset.originalWidth || '';
            placeholder.style.height = placeholder.dataset.originalHeight || '';
            placeholder.style.zIndex = placeholder.dataset.originalZIndex || '';
            placeholder.style.transform = '';
            placeholder.style.backgroundColor = '';
            placeholder.style.padding = '';
            placeholder.style.boxSizing = '';
            placeholder.style.overflow = placeholder.dataset.originalOverflow || '';

            placeholder.querySelector(`.${closeButtonClass}`)?.remove();
            document.querySelector(`.${overlayClass}`)?.remove();
            placeholder.classList.remove('panel3-d3-enlarged');
            document.body.style.overflow = '';

            setTimeout(() => renderCapitalEvolutionGraph(initialData, false), 50);
        } else {
            const overlay = document.createElement('div');
            overlay.className = overlayClass;
            Object.assign(overlay.style, {
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: '999'
            });
            document.body.appendChild(overlay);

            placeholder.dataset.originalPosition = placeholder.style.position;
            placeholder.dataset.originalTop = placeholder.style.top;
            placeholder.dataset.originalLeft = placeholder.style.left;
            placeholder.dataset.originalWidth = placeholder.style.width;
            placeholder.dataset.originalHeight = placeholder.style.height;
            placeholder.dataset.originalZIndex = placeholder.style.zIndex;
            placeholder.dataset.originalOverflow = placeholder.style.overflow;

            Object.assign(placeholder.style, {
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '85vw', height: '80vh', zIndex: '1000', backgroundColor: '#ffffff',
                padding: '15px', boxSizing: 'border-box', overflow: 'hidden'
            });
            placeholder.classList.add('panel3-d3-enlarged');
            document.body.style.overflow = 'hidden';

            const closeButton = document.createElement('button');
            closeButton.className = closeButtonClass;
            closeButton.innerHTML = '&times;';
            Object.assign(closeButton.style, {
                position: 'absolute', top: '10px', right: '10px', cursor: 'pointer',
                zIndex: '1001', background: '#f0f0f0', border: '1px solid #ccc',
                borderRadius: '50%', width: '32px', height: '32px', fontSize: '20px',
                lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                paddingBottom: '2px' // Adjust for vertical centering of '×'
            });
            placeholder.appendChild(closeButton);

            const closeAction = () => {
                // Ensure event.target is correctly simulated or handled if this originates from overlay
                const syntheticEventTarget = placeholder.querySelector('.info-button') || event.target;
                handleD3PanelInfoClick({ target: syntheticEventTarget });
            };
            closeButton.addEventListener('click', closeAction);
            overlay.addEventListener('click', closeAction);

            setTimeout(() => renderCapitalEvolutionGraph(detailedData, true), 50);
        }
    }

    // Initial render for the D3 graph.
    // Make sure .large-graph-placeholder and its #capital-evolution-graph SVG have initial dimensions from CSS.
    setTimeout(() => { // Delay to allow CSS to apply, ensuring container has dimensions
         renderCapitalEvolutionGraph(initialData, false);
    }, 100);

    const d3GraphContainer = document.querySelector('.large-graph-placeholder');
    if (d3GraphContainer) {
        const d3InfoButton = d3GraphContainer.querySelector('.info-button');
        if (d3InfoButton) {
            d3InfoButton.addEventListener('click', handleD3PanelInfoClick);
        } else {
            console.warn("Info button for D3 panel not found in '.large-graph-placeholder'.");
        }
    } else {
        console.warn("Container '.large-graph-placeholder' for D3 panel not found.");
    }
});