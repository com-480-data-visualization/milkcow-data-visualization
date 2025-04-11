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
          region: d.region,
          state: d.state,
          year: d.year,
          milk_produced: parseFloat(d.milk_produced),
        };
    })
    .then(function(data) {
        console.log("State milk production loaded successfully");
    })
    .catch(function(error) {
        console.error("Error loading state milk production:", error);
    });
