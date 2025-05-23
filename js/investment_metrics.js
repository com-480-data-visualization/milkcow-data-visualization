// Investment metrics calculation and visualization
// Gives a score that tells how good the investment strategy is
// It is obviously arbitrary as strategy is out of scope here, it is only to demonstrate

function updateInvestmentMetric() {
    metricValue = _computeInvestmentMetric();

    // Clamp!
    metricValue = Math.min(6, Math.max(0, metricValue));
    
    // Get the grade based on the value
    const grades = ['A', 'B', 'C', 'D', 'E', 'F'];
    const grade = grades[Math.min(5, Math.floor(metricValue))];
    const colors = {
        'F': '#dc2626', // red
        'E': '#ea580c', // orange
        'D': '#d97706', // amber
        'C': '#ca8a04', // yellow
        'B': '#65a30d', // lime
        'A': '#16a34a'  // green
    };

    // Update grade summary
    const gradeSummary = document.getElementById('grade-summary');
    const summaries = {
        'A': 'Excellent portfolio! Your investments are well-balanced and risk-optimized.',
        'B': 'Very good portfolio with smart diversification.',
        'C': 'Decent portfolio, but there\'s room for improvement.',
        'D': 'Portfolio needs attention - consider rebalancing your investments.',
        'E': 'High-risk portfolio - significant changes recommended.',
        'F': 'Critical portfolio issues - immediate action required to minimize risk!'
    };
    gradeSummary.textContent = summaries[grade];
    gradeSummary.style.color = colors[grade];

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

    // Update feedback text
    const statesInvested = Object.entries(investments).filter(([_, amount]) => amount > 0).length;
    const totalInvestment = Object.values(investments).reduce((sum, investment) => sum + investment, 0);
    const capital = budget + totalInvestment;
    const investmentPercentage = (totalInvestment / capital) * 100;
    const entropyPenalty = -_entropyBase();

    // Diversity feedback
    const diversityFeedback = document.getElementById('diversity-feedback');
    if (statesInvested < 5) {
        diversityFeedback.textContent = `🔍 Portfolio too concentrated: Invest in more states (currently ${statesInvested}, aim for 5-10)`;
        diversityFeedback.style.color = '#dc2626'; // red
    } else if (statesInvested > 10) {
        diversityFeedback.textContent = `🔍 Portfolio too spread out: Focus on fewer states (currently ${statesInvested}, aim for 5-10)`;
        diversityFeedback.style.color = '#dc2626'; // red
    } else {
        diversityFeedback.textContent = `✅ Good portfolio diversity: ${statesInvested} states`;
        diversityFeedback.style.color = '#16a34a'; // green
    }

    // Capital allocation feedback
    const capitalFeedback = document.getElementById('capital-feedback');
    if (investmentPercentage < 50) {
        capitalFeedback.textContent = `💰 Underinvested: ${investmentPercentage.toFixed(1)}% of capital invested (aim for 50-80%)`;
        capitalFeedback.style.color = '#dc2626'; // red
    } else if (investmentPercentage > 80) {
        capitalFeedback.textContent = `💰 Overinvested: ${investmentPercentage.toFixed(1)}% of capital invested (aim for 50-80%)`;
        capitalFeedback.style.color = '#dc2626'; // red
    } else {
        capitalFeedback.textContent = `✅ Good capital allocation: ${investmentPercentage.toFixed(1)}% invested`;
        capitalFeedback.style.color = '#16a34a'; // green
    }

    // Balance feedback
    const balanceFeedback = document.getElementById('balance-feedback');
    if (entropyPenalty > 1) {
        balanceFeedback.textContent = `⚖️ Unbalanced portfolio: Some states have too much investment compared to others`;
        balanceFeedback.style.color = '#dc2626'; // red
    } else {
        balanceFeedback.textContent = `✅ Well-balanced portfolio distribution`;
        balanceFeedback.style.color = '#16a34a'; // green
    }
}

/**
 * 
 * @returns Score from 0 to +inf that tells how good the
 * investment strategy is. It is obviously arbitrary as
 * strategy is out of scope here, it is only to demonstrate
 * a simple implementation of a metric and way to visualize
 * this simple metric.
 */
function _computeInvestmentMetric() {
    const div = _diversityPenalty();
    const amt = _amountPenalty();
    const ent = _entropyBase();

    console.log("Diversity penalty: ", div);
    console.log("Amount penalty: ", amt);
    console.log("Entropy penalty: ", ent);
    console.log("Total penalty: ", div + amt + ent);
    return div + amt + ent;
}

const DIVERSITY_PENALTY_FACTOR = 0.5;
const AMOUNT_PENALTY_FACTOR = 10;

function _diversityPenalty() {
    // recommend 10-15 states, otherwise penalize
    // square penalty
    const statesInvested = Object.entries(investments).filter(([_, amount]) => amount > 0).length;

    // every 4 too many/less states, lose 2 points
    if (statesInvested < 5) return DIVERSITY_PENALTY_FACTOR * Math.abs(5 - statesInvested);
    if (statesInvested > 10) return DIVERSITY_PENALTY_FACTOR * Math.abs(statesInvested - 10);
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

function _entropyBase() {
    const weights = _weights();

    console.log("Weights: ", weights);

    let entropy = 0;
    for (const [state, weight] of Object.entries(weights)) {
        entropy += weight * Math.log(weight);
    }

    return -entropy;
}