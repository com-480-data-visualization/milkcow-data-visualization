<center>
<h1>
🐮 The Big Snort 💸
<p>An interactive game experience to visualize data and learn about dairy farming</p>
</h1>
</center>

This project provides a fun and interactive way to visualize data related to dairy farming in the US, and learn how to discover trends in the dairy market. Let's celebrate together "World Milk Day" on June 1st 2025 (_the day following the project handin_) by playing **The Big Snort™**!

Before playing, we encourage you to go [watch our screencast on YouTube](https://www.youtube.com/watch?v=PHZS612FoJg) first, to learn about the main game mechanics.

You can play our game by visiting our website at [The Big Snort™](https://com-480-data-visualization.github.io/milkcow-data-visualization/). Alternatively, you can run the game locally by following the instructions below.

## Running the Game Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/com-480-data-visualization/milkcow-data-visualization.git
   ```
2. Install [live-server](https://www.npmjs.com/package/live-server):
   ```bash
   npm install -g live-server
   ```
   or use the Live Server extension for Visual Studio Code.
3. Start the live server:
   ```bash
   live-server
   ```
   or start the Live Server from Visual Studio Code (right-click on the root directory and select "Start Live Server").

## Code Structure
We organized the code following the best practices for web development, separating concerns into different directories for assets, CSS, datasets, images, JavaScript files, and the main HTML file. This structure makes it easier to maintain and extend the project in the future.
The `assets` directory contains static files, namely the favicon and the icon used in the game. The `css` directory contains stylesheets for the game, while the `dataset` directory holds CSV files that are the datasets we worked with. The `js` directory contains JavaScript files that implement the game logic and data visualization features with D3.js. Finally, the `index.html` file serves as the main entry point for the game.
It follows the detailed structure of the project:
```
.
├── assets
│   ├── cow_slider_icon.png
│   └── favicon.ico
├── css
│   ├── customScrollbar.css
│   ├── panels.css
│   ├── sankey.css
│   ├── style_index.css
│   └── tab.css
├── dataset
│   ├── clean_cheese.csv
│   ├── Dairy_Industry_Historical_Events.csv
│   ├── fluid_milk_sales.csv
│   ├── milk_products_facts.csv
│   ├── milkcow_facts.csv
│   └── state_milk_production.csv
├── index.html
├── js
│   ├── background.js
│   ├── cheese_wheel.js
│   ├── dairy_price_history.js
│   ├── investment_metrics.js
│   ├── load_datasets.js
│   ├── main.js
│   ├── milk_history.js
│   ├── panelModules
│   │   ├── capitalEvolutionPanel.js
│   │   ├── gains_chart.js
│   │   ├── investmentPieChartPanel.js
│   │   ├── milkRankingPanel.js
│   │   ├── panelManager.js
│   │   ├── pie_chart.js
│   │   ├── ranking.js
│   │   └── totalCapitalChart.js
│   ├── sankey_chart.js
│   └── tab_switching.js
└── README.md
```