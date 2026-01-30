// --- Initial Game State ---
let gameState = {
    earth: 0,
    earthPerClick: 1
};

// --- DOM Elements ---
const earthDisplay = document.getElementById('earth-display');
const digButton = document.getElementById('dig-btn');

// --- Update Function ---
// This ensures the UI always matches the numbers in gameState
function updateUI() {
    // We use toLocaleString to add commas to large numbers (e.g., 1,000)
    earthDisplay.innerText = Math.floor(gameState.earth).toLocaleString();
}

// --- Logic Functions ---
function dig() {
    gameState.earth += gameState.earthPerClick;
    updateUI();
}

// --- Event Listeners ---
digButton.addEventListener('click', dig);

// Initialize the screen
updateUI();