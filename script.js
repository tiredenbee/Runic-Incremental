// 1. RUNE DATABASE
const EarthRunes = [
    { name: "Cracked Pebble",   chance: 2,     maxMastery: 1000, earthMult: 2,   luckMult: 1.5,  color: "#a0a0a0" },
    { name: "Smooth Basalt",    chance: 10,    maxMastery: 1000, earthMult: 3,   luckMult: 2,    color: "#505050" },
    { name: "Sedimentary Slab", chance: 100,   maxMastery: 750,  earthMult: 5,   luckMult: 2,    color: "#8c6e5a" },
    { name: "Geode Core",       chance: 250,   maxMastery: 500,  earthMult: 5,   luckMult: 3,    color: "#b464ff" },
    { name: "Tectonic Slab",    chance: 2500,  maxMastery: 250,  earthMult: 10,  luckMult: 5,    color: "#ff6400" },
    { name: "Gaia's Heart",     chance: 15000, maxMastery: 100,  earthMult: 20,  luckMult: 10,   color: "#32ff96" }
];

// 2. PLAYER STATE
let player = {
    earth: 0,
    baseEarthPerClick: 1,
    baseLuck: 1,
    collection: {} // Format: { "Cracked Pebble": 15 }
};

// 3. CORE LOGIC
function calculateTotals() {
    let totalEarthMultiplier = 1;
    let totalLuckMultiplier = 1;

    EarthRunes.forEach(rune => {
        const owned = player.collection[rune.name] || 0;
        const level = Math.min(owned, rune.maxMastery);
        
        if (level > 0) {
            // Multiplicative increment formula
            const currentEarthBoost = 1 + ((rune.earthMult - 1) * (level / rune.maxMastery));
            const currentLuckBoost = 1 + ((rune.luckMult - 1) * (level / rune.maxMastery));

            totalEarthMultiplier *= currentEarthBoost;
            totalLuckMultiplier *= currentLuckBoost;
        }
    });

    return {
        earthPerClick: player.baseEarthPerClick * totalEarthMultiplier,
        luck: player.baseLuck * totalLuckMultiplier
    };
}

function dig() {
    const stats = calculateTotals();
    player.earth += stats.earthPerClick;
    updateUI();
}

function roll() {
    if (player.earth < 50) return;
    
    player.earth -= 50;
    const stats = calculateTotals();

    // Sort rarest to commonest for RNG check
    let sortedRunes = [...EarthRunes].sort((a, b) => b.chance - a.chance);
    let result = EarthRunes[0]; // Default to most common

    for (let rune of sortedRunes) {
        // Effective chance is base chance divided by luck
        let rollChance = Math.max(1, rune.chance / stats.luck);
        if (Math.random() < (1 / rollChance)) {
            result = rune;
            break;
        }
    }

    // Update collection
    player.collection[result.name] = (player.collection[result.name] || 0) + 1;
    
    // UI Feedback for roll
    const rollDisplay = document.getElementById('last-roll-text');
    rollDisplay.innerText = `Rolled: ${result.name}!`;
    rollDisplay.style.color = result.color;

    updateUI();
}

// 4. UI RENDERING
function updateUI() {
    const stats = calculateTotals();
    
    // Main Stats
    document.getElementById('earth-display').innerText = Math.floor(player.earth).toLocaleString();
    document.getElementById('luck-stat-display').innerText = `Luck: ${stats.luck.toFixed(2)}x`;
    document.getElementById('dig-btn').innerText = `Dig for Earth (+${stats.earthPerClick.toLocaleString(undefined, {maximumFractionDigits: 1})})`;

    // Rune List
    const list = document.getElementById('rune-list');
    list.innerHTML = "";

    EarthRunes.forEach(rune => {
        const owned = player.collection[rune.name] || 0;
        const level = Math.min(owned, rune.maxMastery);
        
        // Calculate specific contribution for display
        const eBoost = 1 + ((rune.earthMult - 1) * (level / rune.maxMastery));
        const lBoost = 1 + ((rune.luckMult - 1) * (level / rune.maxMastery));

        const item = document.createElement('div');
        item.className = "rune-item";
        item.style.borderLeft = `5px solid ${rune.color}`;
        item.innerHTML = `
            <div>
                <span class="rune-name" style="color:${rune.color}">${rune.name}</span>
                <span class="rune-mastery">Owned: ${owned} | Mastery: ${level}/${rune.maxMastery}</span>
            </div>
            <div class="rune-buffs">
                x${eBoost.toFixed(2)} Earth<br>
                x${lBoost.toFixed(2)} Luck
            </div>
        `;
        list.appendChild(item);
    });
}

// 5. INITIALIZATION
document.getElementById('dig-btn').addEventListener('click', dig);
document.getElementById('roll-btn').addEventListener('click', roll);

// Start the UI
updateUI();