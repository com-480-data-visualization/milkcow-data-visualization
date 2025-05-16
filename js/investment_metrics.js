function updateInvestmentMetric() {
    metricValue = computeInvestmentMetric();

    // Clamp!
    metricValue = Math.min(6, Math.max(0, metricValue));
    
    // Get the grade based on the value
    const grades = ['A', 'B', 'C', 'D', 'E', 'F'];
    const grade = grades[Math.min(5, Math.floor(metricValue))];
    
    // Update the grade display with appropriate color
    const gradeDisplay = document.getElementById('current-grade');
    gradeDisplay.textContent = grade;
    const colors = {
        'F': '#dc2626', // red
        'E': '#ea580c', // orange
        'D': '#d97706', // amber
        'C': '#ca8a04', // yellow
        'B': '#65a30d', // lime
        'A': '#16a34a'  // green
    };
    gradeDisplay.style.color = colors[grade];

    // Reset all sections to normal size first
    document.querySelectorAll('.grade-section').forEach(section => {
        section.style.transform = 'scale(1)';
        section.style.zIndex = '0';
    });

    // Scale up the current grade section
    const currentSection = document.querySelector(`.grade-section[data-grade="${grade}"]`);
    if (currentSection) {
        currentSection.style.transform = 'scale(1.2)';
        currentSection.style.zIndex = '1';
    }
    
    // Calculate position based on grade sections
    const slider = document.getElementById('metric-slider');
    const position = (6.0 - metricValue) / 6.0 * 100.0;
    slider.style.left = `${position}%`;
}

/**
 * 
 * @returns Score from 0 to +inf that tells how good the
 * investment strategy is. It is obviously arbitrary as
 * strategy is out of scope here, it is only to demonstrate
 * a simple implementation of a metric and way to visualize
 * this simple metric.
 */
function computeInvestmentMetric() {
    const div = _diversityPenalty();
    const amt = _amountPenalty();
    const ent = _entropy();

    console.log("Diversity penalty: ", div);
    console.log("Amount penalty: ", amt);
    console.log("Entropy penalty: ", ent);
    console.log("Total penalty: ", div + amt + ent);
    return div + amt + ent;
}

const DIVERSITY_PENALTY_FACTOR = 0.25;
const AMOUNT_PENALTY_FACTOR = 10;

function _diversityPenalty() {
    // recommend 10-15 states, otherwise penalize
    // square penalty
    const statesInvested = Object.keys(investments).length;

    // every 4 too many/less states, lose 1 point
    if (statesInvested < 10) return DIVERSITY_PENALTY_FACTOR * Math.abs(10 - statesInvested);
    if (statesInvested > 15) return DIVERSITY_PENALTY_FACTOR * Math.abs(statesInvested - 15);
    return 0;
}

function _amountPenalty() {
    // recommend investing 50% of capital, otherwise penalize
    // square penalty
    const totalInvestment = Object.values(investments).reduce((sum, investment) => sum + investment, 0);
    const capital = budget + totalInvestment;

    // every 10% of capital invested too much/little, lose 1 point
    if (totalInvestment < capital * 0.5) return AMOUNT_PENALTY_FACTOR * Math.abs((capital * 0.5 - totalInvestment) / capital);
    if (totalInvestment > capital * 0.8) return AMOUNT_PENALTY_FACTOR * Math.abs((totalInvestment - capital * 0.8) / capital);
    return 0;
}

function _weights() {
    // Get total investment amount
    const totalInvestment = computeTotalInvestment();
    if (totalInvestment === 0) return 0;

    // Calculate weights for each investment
    const weights = {};
    for (const [state, investment] of Object.entries(investments)) {
        if (investment === 0) continue;
        weights[state] = investment / totalInvestment;
    }

    return weights;
}

function _entropy() {
    const weights = _weights();

    console.log("Weights: ", weights);

    let entropy = 0;
    for (const [state, weight] of Object.entries(weights)) {
        entropy += weight * Math.log(weight);
    }

    return -entropy;
}