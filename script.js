// --- DATA ---
const EarthRunes = [
    { name: "Cracked Pebble",   rarity: "Basic",       chance: 2,     maxMastery: 200,  earthMult: 2,   luckMult: 1.5,  color: "#a0a0a0" },
    { name: "Smooth Basalt",    rarity: "Basic",       chance: 10,    maxMastery: 200,  earthMult: 1,   bulkAdd: 1,     maxBulk: 5, color: "#505050" },
    { name: "Sedimentary Slab", rarity: "Regular",     chance: 100,   maxMastery: 150,  earthMult: 5,   luckMult: 2,    color: "#8c6e5a" },
    { name: "Geode Core",       rarity: "Rare",        chance: 250,   maxMastery: 100,  earthMult: 5,   luckMult: 3,    color: "#b464ff" },
    { name: "Tectonic Slab",    rarity: "Exceptional", chance: 2500,  maxMastery: 50,   earthMult: 10,  luckMult: 5,    color: "#ff6400" },
    { name: "Gaia's Heart",     rarity: "Mythic",      chance: 15000, maxMastery: 20,   earthMult: 20,  luckMult: 10,   color: "#32ff96" }
];

const WaterRunes = [
    { name: "Dew Drop",         rarity: "Basic",       chance: 2,     maxMastery: 200,  waterMult: 2,   luckMult: 1.5,  color: "#b3e5fc" },
    { name: "River Stone",      rarity: "Basic",       chance: 10,    maxMastery: 200,  waterMult: 3,   luckMult: 2,    color: "#4fc3f7" },
    { name: "Coral Branch",     rarity: "Regular",     chance: 100,   maxMastery: 150,  waterMult: 5,   luckMult: 2,    color: "#ff8a80" },
    { name: "Abyssal Pearl",    rarity: "Rare",        chance: 250,   maxMastery: 100,  waterMult: 5,   luckMult: 3,    color: "#7986cb" },
    { name: "Tidal Crest",      rarity: "Exceptional", chance: 2500,  maxMastery: 50,   waterMult: 10,  luckMult: 5,    color: "#0288d1" },
    { name: "Neptune's Eye",    rarity: "Mythic",      chance: 15000, maxMastery: 20,   waterMult: 20,  luckMult: 10,   color: "#00bcd4" }
];

const Upgrades = {
    earth: {
        shovelPower: { name: "Shovel Power", baseCost: 5, costAdd: 5, maxLevel: 24, powerPerLevel: 1, hidden: false },
        pickaxe: { name: "Pickaxe", baseCost: 250, costAdd: 0, maxLevel: 1, powerPerLevel: 0, multAdd: 1, hidden: false },
        pickaxeStrength: { name: "Pickaxe Strength", baseCost: 25, costAdd: 25, maxLevel: 24, powerPerLevel: 5, hidden: true },
        drill: { name: "Drill", baseCost: 750, costAdd: 0, maxLevel: 1, powerPerLevel: 0, multAdd: 1, hidden: true },
        drillStrength: { name: "Drill Strength", baseCost: 125, costAdd: 125, maxLevel: 24, powerPerLevel: 25, hidden: true },
        runeLuck: { name: "Rune Luck", baseCost: 1000, costAdd: 1000, maxLevel: 50, luckPerLevel: 0.01, hidden: true },
        automation: { name: "Automation", baseCost: 100000, costAdd: 0, maxLevel: 1, hidden: true },
        unlockWater: { name: "Unlock Water", baseCost: 1000000, costAdd: 0, maxLevel: 1, hidden: true }
    },
    water: {
        bucketSize: { name: "Bucket Size", baseCost: 10, costAdd: 10, maxLevel: 24, powerPerLevel: 1 },
        wellDepth: { name: "Well Depth", baseCost: 500, costAdd: 0, maxLevel: 1, multAdd: 1 },
        filtration: { name: "Filtration", baseCost: 2000, costAdd: 2000, maxLevel: 50, luckPerLevel: 0.02 }
    }
};

const AutoUpgrades = {
    earth: {
        autoDig: { name: "Auto-Dig", cost: 500000, desc: "Digs for Earth 5x per second." },
        autoUpgrade: { name: "Auto-Upgrade", cost: 500000, desc: "Auto-buys Earth upgrades." }
    },
    water: {
        autoGather: { name: "Auto-Gather", cost: 500000, desc: "Gathers Water 5x per second." }
    }
};

let player = {
    earth: 0, water: 0,
    upgrades: { 
        earth: { shovelPower: 0, pickaxe: 0, pickaxeStrength: 0, drill: 0, drillStrength: 0, runeLuck: 0, automation: 0, unlockWater: 0 },
        water: { bucketSize: 0, wellDepth: 0, filtration: 0 }
    },
    autoPurchased: { earth: { autoDig: false, autoUpgrade: false }, water: { autoGather: false } },
    collection: { earth: {}, water: {} },
    automationUnlocked: false,
    waterUnlocked: false
};

// --- SYSTEM ---
function saveGame(isAuto = false) {
    localStorage.setItem("RunicIncremental_SaveV6", JSON.stringify(player));
    const container = document.getElementById('notification-container');
    if (container) container.innerHTML = `<span class="save-popup">${isAuto ? 'Auto-saved' : 'Game Saved!'}</span>`;
}

function loadGame() {
    const saved = localStorage.getItem("RunicIncremental_SaveV6");
    if (saved) {
        const parsed = JSON.parse(saved);
        player = JSON.parse(JSON.stringify(Object.assign({}, player, parsed))); 
    }
}

// --- MATH ---
function calculateTotals(element) {
    let rMult = 1, rLMult = 1, rBulk = 1;
    const runes = element === 'earth' ? EarthRunes : WaterRunes;
    const coll = player.collection[element];

    runes.forEach(r => {
        const count = coll[r.name] || 0;
        const m = Math.min(count, r.maxMastery);
        if (m > 0) {
            if (r.bulkAdd) {
                // Additive bulk logic: count * bulkAdd, capped at maxBulk
                rBulk += Math.min(r.maxBulk, count * r.bulkAdd);
            } else {
                const multVal = element === 'earth' ? r.earthMult : r.waterMult;
                rMult *= (1 + ((multVal - 1) * (m / r.maxMastery)));
                rLMult *= (1 + ((r.luckMult - 1) * (m / r.maxMastery)));
            }
        }
    });

    if (element === 'earth') {
        const base = 1 + (player.upgrades.earth.shovelPower * 1) + (player.upgrades.earth.pickaxeStrength * 5) + (player.upgrades.earth.drillStrength * 25);
        const mult = 1 + (player.upgrades.earth.pickaxe > 0 ? 1 : 0) + (player.upgrades.earth.drill > 0 ? 1 : 0);
        const luck = (1 + (player.upgrades.earth.runeLuck * 0.01)) * rLMult;
        return { gain: base * mult * rMult, luck: luck, mult: mult * rMult, bulk: Math.floor(rBulk) };
    } else {
        const base = 1 + (player.upgrades.water.bucketSize * 1);
        const mult = 1 + (player.upgrades.water.wellDepth > 0 ? 1 : 0);
        const luck = (1 + (player.upgrades.water.filtration * 0.02)) * rLMult;
        return { gain: base * mult * rMult, luck: luck, mult: mult * rMult, bulk: Math.floor(rBulk) };
    }
}

// --- UI ---
function updateUI() {
    const eStats = calculateTotals('earth');
    const wStats = calculateTotals('water');
    
    document.getElementById('earth-display').innerText = Math.floor(player.earth).toLocaleString();
    document.getElementById('earth-mult-display').innerText = `Multiplier: ${eStats.mult.toFixed(2)}x`;
    document.getElementById('luck-stat-display').innerText = `Luck: ${eStats.luck.toFixed(2)}x`;
    document.getElementById('bulk-stat-display').innerText = `Bulk: ${eStats.bulk}`;
    document.getElementById('dig-btn').innerText = `Dig (+${eStats.gain.toFixed(1)})`;

    if (player.waterUnlocked) {
        document.getElementById('water-tab-btn').classList.remove('locked');
        document.getElementById('water-display').innerText = Math.floor(player.water).toLocaleString();
        document.getElementById('water-mult-display').innerText = `Multiplier: ${wStats.mult.toFixed(2)}x`;
        document.getElementById('water-luck-display').innerText = `Luck: ${wStats.luck.toFixed(2)}x`;
        document.getElementById('water-bulk-display').innerText = `Bulk: ${wStats.bulk}`;
        document.getElementById('gather-water-btn').innerText = `Gather (+${wStats.gain.toFixed(1)})`;
    }

    if (player.upgrades.earth.pickaxe > 0) { Upgrades.earth.pickaxeStrength.hidden = false; Upgrades.earth.drill.hidden = false; }
    if (player.upgrades.earth.drill > 0) { Upgrades.earth.drillStrength.hidden = false; Upgrades.earth.runeLuck.hidden = false; Upgrades.earth.automation.hidden = false; }
    if (player.upgrades.earth.automation > 0) { Upgrades.earth.unlockWater.hidden = false; player.automationUnlocked = true; }
    if (player.automationUnlocked) document.getElementById('auto-tab-btn').classList.remove('hidden');

    renderUpgrades('earth', 'upgrade-list');
    renderUpgrades('water', 'water-upgrade-list');
    renderRunes('earth', 'rune-list', eStats.luck);
    renderRunes('water', 'water-rune-list', wStats.luck);
    renderAutomation();
}

function renderUpgrades(element, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    Object.keys(Upgrades[element]).forEach(id => {
        const upg = Upgrades[element][id];
        if (upg.hidden) return;
        const lvl = player.upgrades[element][id];
        const cost = upg.baseCost + (lvl * (upg.costAdd || 0));
        const div = document.createElement('div');
        div.className = `upgrade-item ${lvl >= upg.maxLevel ? 'maxed' : ''}`;
        div.onclick = () => {
            if (player[element] >= cost && lvl < upg.maxLevel) {
                player[element] -= cost;
                player.upgrades[element][id]++;
                if(id === 'unlockWater') player.waterUnlocked = true;
                updateUI();
            }
        };
        div.innerHTML = `<div><strong>${upg.name}</strong><br><small>Lvl ${lvl}/${upg.maxLevel}</small></div>
                         <div>${lvl >= upg.maxLevel ? 'MAX' : cost.toLocaleString()}</div>`;
        container.appendChild(div);
    });
}

function renderRunes(element, containerId, luck) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const runes = element === 'earth' ? EarthRunes : WaterRunes;
    container.innerHTML = "";
    runes.forEach(r => {
        const count = player.collection[element][r.name] || 0;
        const disc = count > 0;
        const m = Math.min(count, r.maxMastery);
        
        let boostText = "";
        if (r.bulkAdd) {
            const currentBulk = Math.min(r.maxBulk, count * r.bulkAdd);
            boostText = `+${currentBulk} Bulk`;
        } else {
            const multVal = element === 'earth' ? r.earthMult : r.waterMult;
            const currentMult = 1 + ((multVal - 1) * (m / r.maxMastery));
            const currentLuck = 1 + ((r.luckMult - 1) * (m / r.maxMastery));