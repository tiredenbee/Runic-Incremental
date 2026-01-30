// 1. DATA DATABASE
const EarthRunes = [
    { name: "Cracked Pebble",   chance: 2,     maxMastery: 1000, earthMult: 2,   luckMult: 1.5,  color: "#a0a0a0" },
    { name: "Smooth Basalt",    chance: 10,    maxMastery: 1000, earthMult: 3,   luckMult: 2,    color: "#505050" },
    { name: "Sedimentary Slab", chance: 100,   maxMastery: 750,  earthMult: 5,   luckMult: 2,    color: "#8c6e5a" },
    { name: "Geode Core",       chance: 250,   maxMastery: 500,  earthMult: 5,   luckMult: 3,    color: "#b464ff" },
    { name: "Tectonic Slab",    chance: 2500,  maxMastery: 250,  earthMult: 10,  luckMult: 5,    color: "#ff6400" },
    { name: "Gaia's Heart",     chance: 15000, maxMastery: 100,  earthMult: 20,  luckMult: 10,   color: "#32ff96" }
];

const Upgrades = {
    shovelPower: {
        name: "Shovel Power",
        baseCost: 10,
        costAdd: 5,
        maxLevel: 25,
        powerPerLevel: 1
    }
};

// 2. PLAYER STATE
let player = {
    earth: 0,
    baseEarthPerClick: 1,
    baseLuck: 1,
    upgrades: { shovelPower: 0 },
    collection: {}
};

// 3. SAVE/LOAD LOGIC
function showSaveNotification() {
    const container = document.getElementById('notification-container');
    const popup = document.createElement('div');
    popup.className = 'save-popup';
    popup.innerText = 'Game Saved!';
    container.appendChild(popup);
    
    // Remove element after animation ends
    setTimeout(() => { popup.remove(); }, 2500);
}

function saveGame() {
    localStorage.setItem("RunicIncrementalSave", JSON.stringify(player));
    showSaveNotification();
}

function loadGame() {
    const savedData = localStorage.getItem("RunicIncrementalSave");
    if (savedData) {
        const parsed = JSON.parse(savedData);
        // Deep merge to ensure nested objects like collection and upgrades are loaded
        player.earth = parsed.earth || 0;
        player.upgrades = { ...player.upgrades, ...parsed.upgrades };
        player.collection = { ...player.collection, ...parsed.collection };
        console.log("Runic Incremental: Data Loaded");
    }
}

// 4. CORE LOGIC
function calculateTotals() {
    let totalEarthMultiplier = 1;
    let totalLuckMultiplier = 1;

    EarthRunes.forEach(rune => {
        const owned = player.collection[rune.name] || 0;
        const level = Math.min(owned, rune.maxMastery);
        if (level > 0) {
            totalEarthMultiplier *= (1 + ((rune.earthMult - 1) * (level / rune.maxMastery)));
            totalLuckMultiplier *= (1 + ((rune.luckMult - 1) * (level / rune.maxMastery)));
        }
    });

    const bonusPower = (player.upgrades.shovelPower || 0) * Upgrades.shovelPower.powerPerLevel;
    const finalBaseEarth = player.baseEarthPerClick + bonusPower;

    return {
        earthPerClick: finalBaseEarth * totalEarthMultiplier,
        earthMult: totalEarthMultiplier,
        luck: player.baseLuck * totalLuckMultiplier
    };
}

function buyUpgrade(id) {
    const upg = Upgrades[id];
    const currentLevel = player.upgrades[id] || 0;
    if (currentLevel >= upg.maxLevel) return;

    const cost = upg.baseCost + (currentLevel * upg.costAdd);
    if (player.earth >= cost) {
        player.earth -= cost;
        player.upgrades[id] = currentLevel + 1;
        updateUI();
        saveGame();
    }
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

    let sortedRunes = [...EarthRunes].sort((a, b) => b.chance - a.chance);
    let result = EarthRunes[0];

    for (let rune of sortedRunes) {
        let rollChance = Math.max(1, rune.chance / stats.luck);
        if (Math.random() < (1 / rollChance)) {
            result = rune;
            break;
        }
    }

    player.collection[result.name] = (player.collection[result.name] || 0) + 1;
    document.getElementById('last-roll-text').innerText = `Rolled: ${result.name}!`;
    document.getElementById('last-roll-text').style.color = result.color;
    updateUI();
    saveGame(); 
}

// 5. UI RENDERING
function updateUI() {
    const stats = calculateTotals();
    
    document.getElementById('earth-display').innerText = Math.floor(player.earth).toLocaleString();
    document.getElementById('earth-mult-display').innerText = `Multiplier: ${stats.earthMult.toFixed(2)}x`;
    document.getElementById('luck-stat-display').innerText = `Luck: ${stats.luck.toFixed(2)}x`;
    document.getElementById('dig-btn').innerText = `Dig for Earth (+${stats.earthPerClick.toLocaleString(undefined, {maximumFractionDigits: 1})})`;

    const upgList = document.getElementById('upgrade-list');
    upgList.innerHTML = "";
    Object.keys(Upgrades).forEach(id => {
        const upg = Upgrades[id];
        const level = player.upgrades[id] || 0;
        const isMaxed = level >= upg.maxLevel;
        const cost = upg.baseCost + (level * upg.costAdd);

        const div = document.createElement('div');
        div.className = `upgrade-item ${isMaxed ? 'maxed' : ''}`;
        div.onclick = () => buyUpgrade(id);
        div.innerHTML = `<div><strong>${upg.name}</strong><br><small>Level: ${level}/${upg.maxLevel}</small></div>
                         <div>${isMaxed ? 'MAXED' : cost.toLocaleString() + ' Earth'}</div>`;
        upgList.appendChild(div);
    });

    const runeList = document.getElementById('rune-list');
    runeList.innerHTML = "";
    EarthRunes.forEach(rune => {
        const owned = player.collection[rune.name] || 0;
        const level = Math.min(owned, rune.maxMastery);
        const eBoost = 1 + ((rune.earthMult - 1) * (level / rune.maxMastery));
        const lBoost = 1 + ((rune.luckMult - 1) * (level / rune.maxMastery));

        const item = document.createElement('div');
        item.className = "rune-item";
        item.style.borderLeft = `5px solid ${rune.color}`;
        item.innerHTML = `<div><span class="rune-name" style="color:${rune.color}">${rune.name}</span>
                         <span class="rune-mastery">Owned: ${owned} | Mastery: ${level}/${rune.maxMastery}</span></div>
                         <div class="rune-buffs">x${eBoost.toFixed(2)} Earth<br>x${lBoost.toFixed(2)} Luck</div>`;
        runeList.appendChild(item);
    });
}

// 6. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    document.title = "Runic Incremental";
    document.getElementById('dig-btn').addEventListener('click', dig);
    document.getElementById('roll-btn').addEventListener('click', roll);
    loadGame();
    updateUI();
    setInterval(saveGame, 5000);
});