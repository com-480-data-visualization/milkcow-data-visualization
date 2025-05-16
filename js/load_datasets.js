///////////////////////////////////////////////////////////
//
// State milk production dataset loading and preparation
//
///////////////////////////////////////////////////////////

// State milk production dataset
state_milk_production_delta = {};
state_milk_production = [];
us_states = [];

d3.csv("dataset/state_milk_production.csv", function(d) {
        return {
          //region: d.region, drop region as it is useless
          state: d.state,
          year: Math.trunc(parseFloat(d.year)),
          milk_produced: parseFloat(d.milk_produced),
        };
    })
    .then(function(data) {
        console.log("State milk production loaded successfully");

        state_milk_production = data; // Save full dataset

        // US States
        us_states = Array.from(new Set(d3.map(state_milk_production, (d) => d.state)));
        console.log("US States loaded successfully: ", us_states);

        // Compute deltas
        state_milk_production_delta = Array.from(
            d3.group(state_milk_production, d => d.state), 
            ([key, values]) => ({ key, values })
        );
        state_milk_production_delta.forEach((state) => {
            // Sort the data for each state by year
            state.values.sort((a, b) => d3.ascending(a.year, b.year));
            // Calculate the difference in milk_produced between consecutive years
            state.values.forEach((d, i) => {
                if (i + 1 < state.values.length) {
                    diff = state.values[i + 1].milk_produced - d.milk_produced;
                    d.delta = diff; // absolute delta
                    d.delta_relative = diff / d.milk_produced; // relative delta
                }
            });
        });

        console.log("State milk production deltas computed successfully: ", state_milk_production_delta);

    })
    .catch(function(error) {
        console.error("Error loading state milk production:", error);
    });

///////////////////////////////////////////////////////////
// Milk products facts dataset loading and preparation
///////////////////////////////////////////////////////////

milk_products_facts = [];
milk_products_columns = [];

d3.csv("dataset/milk_products_facts.csv", function(d) {
    // Parse all columns as floats except year
    let parsed = { year: +d.year };
    for (let key in d) {
        if (key !== 'year') parsed[key] = +d[key];
    }
    return parsed;
}).then(function(data) {
    milk_products_facts = data;
    // Get product columns (excluding year)
    if (data.length > 0) {
        milk_products_columns = Object.keys(data[0]).filter(k => k !== 'year');
    }
    console.log("Milk products facts loaded:", milk_products_facts);
    // Optionally, trigger UI update if needed
    if (typeof populateProductSelect === 'function') populateProductSelect();
}).catch(function(error) {
    console.error("Error loading milk products facts:", error);
});
