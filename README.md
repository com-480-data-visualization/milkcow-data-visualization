# Project of Data Visualization (COM-480)

| Student's name     | SCIPER |
| ------------------ | ------ |
| Octave Charrin     | 404884 |
| Jules Peyrat       | 289969 |
| Gabriele Stentella | 404913 |

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (21st March, 5pm)

**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)*

### Dataset

> Find a dataset (or multiple) that you will explore. Assess the quality of the data it contains and how much preprocessing / data-cleaning it will require before tackling visualization. We recommend using a standard dataset as this course is not about scraping nor data processing.
>
> Hint: some good pointers for finding quality publicly available datasets ([Google dataset search](https://datasetsearch.research.google.com/), [Kaggle](https://www.kaggle.com/datasets), [OpenSwissData](https://opendata.swiss/en/), [SNAP](https://snap.stanford.edu/data/) and [FiveThirtyEight](https://data.fivethirtyeight.com/)), you could use also the DataSets proposed by the ENAC (see the Announcements section on Zulip).

[Link to the chosen dataset](https://github.com/rfordatascience/tidytuesday/tree/main/data/2019/2019-01-29)

This dataset, sourced from the USDA, provides comprehensive insights into U.S. dairy production, consumption, and economic factors. It includes five key datasets covering different aspects of the dairy industry:  

1. **milkcow_facts.csv** – Contains yearly data on milk cow numbers, milk production per cow, total production, pricing, and economic factors like feed costs and cow prices.  
2. **fluid_milk_sales.csv** – Tracks annual sales of different milk types in pounds.  
3. **milk_products_facts.csv** – Provides per capita consumption data for various dairy products.  
4. **clean_cheese.csv** – Focuses on cheese consumption trends, detailing various cheese types such as Cheddar, Mozzarella, Swiss, and processed cheeses.  
5. **state_milk_production.csv** – Records annual milk production at the state level, categorized by region.

### Problematic

> Frame the general topic of your visualization and the main axis that you want to develop.
> - What am I trying to show with my visualization?
> - Think of an overview for the project, your motivation, and the target audience.

This visualization project will explore the evolving trends in milk production, dairy consumption, and pricing in the United States. The goal is to analyze changes in milk production, consumer preferences, and economic factors affecting the dairy industry. The main axis of the project will be how milk and dairy product consumption has shifted over time, how this relates to production levels, and what economic factors may be influencing these trends.

All data series in this dataset are quite basic. They are mostly time series which can easily be visualized using graphs with time as x-axis. We think our project will not really be relevant through dataset analysis as we conceed it is quite basic, but rather through genuine interactiveness.

We are looking for a more original way of visualizing evolutions in dairy product consumption based on economic factors. **We would like to turn our visualization project into a very interactive experience, through some sort of minigame**. More on this in the _Exploratory Data Analysis_ part below.

#### Motivation for the Project
This project aims to provide insights into how the industry is evolving and whether traditional dairy consumption is being replaced by other food trends.

#### Project overview
We aim to provide answers about the following aspects:
- Production and Consumption Trends:
    - How has U.S. milk production changed over the years?
    - What are the trends in milk consumption per capita?
- Regional & State-Level Production Analysis:
    - Which states produce the most milk, and how has production shifted over time?
    - Are there regional patterns in milk production growth or decline?
- Cheese & Dairy Product Consumption Patterns:
    - How has cheese consumption evolved, and what types of cheese are most popular?
- Pricing Analysis:
    - How do milk prices correlate with production levels?
    - What is the relationship between dairy cow costs, feed costs, and milk prices?

#### Target Audience
- General public & consumers interested in food trends and how their choices impact the dairy industry.
- Policymakers & agricultural economists examining the sustainability and economic shifts in dairy farming.
- Dairy industry professionals & farmers tracking production, pricing, and demand patterns.
- Students & researchers looking for data-driven insights into agricultural economics and food consumption trends.


### Exploratory Data Analysis

> Pre-processing of the data set you chose
> - Show some basic statistics and get insights about the data

An introductory exploration of the dataset is provided in this [notebook](milestone_1.ipynb). Each cell shows a specific aspect of the data through a table or a graph, summarizing the basic statistics that one could access when encountering the dataset for the first time. We also tried to answer basic questions such as "which are the top 10 states in milk production".

We believe two data series from this dataset are particularily relevant in order to create an interactive visualization experience: `state_milk_production.csv` and `milkcow_facts.csv`.
- `state_milk_production` contains milk production with respect to time and state, which means it can be explored accross two dimensions (time and space). We would like to visualize this series using a full map of America, highlighting regions where milk production has been growing with respect to previous years. The data series has around a 30-years range, so we can definitely compute statistics on this dataset across different time scales.
- `milkcow_facts.csv` provides a more "causal" study of the evolution of milk consumption, it provides economic insights and determining factors that we will be using in conjunction with the other data series to explain the evolution of milk/dairy product consumption.

In order to make our visualization project interesting, we would like to turn it into an interactive game, where the user is originally given a $100,000 budget in 1970 (which is the starting point of most data series). The goal of the game is to reach ~2015 with the highest amount of money, based on the user investments and returns on investments computed against real-world data. _More info under Milestone 2 (word limit)._

This interactive nature of our visualization project will require to join some of our datasets (`milkcow_facts` and `fluid_milk_sales`) when implementing the basic game mechanics, for instance when computing the yearly returns on investments.

### Related work

> - What others have already done with the data?
> - Why is your approach original?
> - What source of inspiration do you take? Visualizations that you found on other websites or magazines (might be unrelated to your data).
> - In case you are using a dataset that you have already explored in another context (ML or ADA course, semester project...), you are required to share the report of that work to outline the differences with the submission for this class.

To our knowledge, this dataset has only been analyzed in a few related articles, including the NPR article ["Nobody is Moving Our Cheese"](https://www.npr.org/2019/01/09/683339929/nobody-is-moving-our-cheese-american-surplus-reaches-record-high), the Washington Post article ["America's Cheese Stockpile Hit an All-Time High"](https://www.washingtonpost.com/news/wonk/wp/2018/06/28/americas-cheese-stockpile-just-hit-an-all-time-high/?noredirect=on&utm_term=.e9b90767af27), and the IDFA article ["American Dairy Consumption Reaches All-Time High"](https://www.idfa.org/news/american-dairy-consumption-reaches-all-time-high-cheese-butter-and-yogurt-continue-to-drive-growth-for-dairy-industry). However, these articles focus only on specific aspects of the dataset, leaving much of its potential unexplored.  

Our goal is to unlock the full value of this dataset by creating an *interactive data visualization* that educates people about the dairy product and milk cow market. We emphasize the importance of interactivity, as a simple static visualization—such as those found in the [notebook](milestone_1.ipynb)—would not offer any meaningful advantage over the insights already covered in existing articles. By making the dataset more engaging and accessible, we aim to provide a deeper and more comprehensive understanding of the dairy industry.

We will take inspiration from these recent articles [here](https://www.agriculture.com/u-s-annual-milk-production-declines-year-over-year-for-second-consecutive-year-11684543) and [there](https://www.washingtonpost.com/nation/interactive/2021/census-population-changes/). Since our data is intrinsically related to time and space (NA state of production, and year of production), we will also take inspiration from [interactive map data visualizations](https://www.tableau.com/learn/articles/interactive-map-and-data-visualization-examples).

**Our approach is very much original by its interactive and recreational nature.** Instead of visualizing data accross time, the user will interact with the dataset accross space (the map of America, the space of cheese types, milkcow types...), and will have to press a button to advance through time. The articles provided above only provide visualizations based on graphs with time as x-axis.

## Milestone 2 (18th April, 5pm)

**10% of the final grade**

> Project Goal: Visualizing the U.S. Dairy Industry Through an Interactive Game

[Link to the website's Homepage](https://com-480-data-visualization.github.io/milkcow-data-visualization/)

### Introduction
This project aims to develop an interactive data visualization that explores the evolving trends in the U.S. dairy industry. Utilizing the USDA dataset, the visualization will focus on how milk production, consumer preferences, and economic factors have changed over time. Instead of a traditional static visualization, we will create an engaging "minigame" that allows users to actively participate in and learn about the dynamics of the dairy market. The core idea is to make the data accessible and interesting, particularly for a general audience.
The project will allow users to understand the economic factors that influence milk production and consumption, and how those factors have changed over time. The interactive game will allow users to make investment decisions based on historical data, and then see the outcomes of those decisions.

### Project overview
The visualization will be structured as an interactive game where users start with a hypothetical budget in the early 1970s and make investment decisions in different states' milk production and various dairy products. The game will progress year by year, with users receiving feedback on their investment performance based on actual market data. This will somewhat give a causal explanation of what happened over one year to the user, to help him understand why their investments were wise/poor.
The game will incorporate several key data series from the dataset:
- `state_milk_production`: Users will invest in milk production in different states, observing how production levels and regional shifts affect their returns.
- `milkcow_facts`: Economic factors such as feed costs, cow prices, and overall milk production will influence the profitability of investments.
- `fluid_milk_sales` & `milk_product_facts`: Users can also invest in different types of milk and dairy products, experiencing how consumer preferences and market demand impact their investments.
- `clean_cheese`: Cheese consumption trends will be integrated, allowing users to explore the growth in cheese demand and its effect on the market.

### Tools and Required Lectures
The following tools and lectures from the course syllabus will be essential for this project:
- HTML, CSS, DOM (1.1, 1.2): For structuring the web page, styling the visualization, and manipulating elements dynamically.
- ECMA 2015+ (JavaScript) (1.3): For implementing the game logic, handling user interactions, and updating the visualization in real-time.
- D3.js (1.4): For creating the interactive map, charts, and other data-driven visualizations. D3 will be crucial for the dynamic elements of the game.
- Visualization Fundamentals (2.1-2.5): Understanding data types, interaction techniques, perceptual principles, and design guidelines will be critical for creating an effective and engaging visualization.
- Maps (3.1): To create an interactive map of the US.
- Tabular Data (3.4): For handling the structured data from the CSV files and performing calculations for the game logic.

### Project Breakdown
The project can be broken down into the following independent pieces:
#### Minimal Viable Product
The MVP will focus on the core game loop and the most essential interactive elements:
1. Interactive U.S. Map: Implement a basic interactive map using D3.js, allowing users to select states.
2. Basic Investment Mechanism: Allow users to allocate a portion of their budget to a selected state.
3. Yearly Progression: Mechanism to advance the game year by year.
4. Simple Yearly Report: Display a simplified report showing the user's investment return for the year, with the key economic indicators.
#### Enhancement Ideas
The following features could enhance the visualization but are not critical for the core functionality:
1. Advanced Economic Modeling: Incorporate more complex economic models to simulate the impact of various factors on milk production and prices.
2. Multiple Investment Options: Allow users to invest in different dairy products (cheese, fluid milk, etc.) in addition to state milk production.
3. Historical Events: Integrate significant historical events (e.g., changes in government regulations, economic crises) that affected the dairy industry.
4. Enhanced Visualizations: Add more sophisticated visualizations, such as animated transitions, interactive tooltips, and detailed charts, to provide deeper insights.
5. User Profiles and Leaderboards: Allow users to save their game progress and compare their performance with others.
6. Sound Effects: Add sound effects to enhance user engagement.

## Milestone 3 (30th May, 5pm)

**80% of the final grade**


## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone
