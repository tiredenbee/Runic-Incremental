// 1. DATA DATABASE
const EarthRunes = [
    { name: "Cracked Pebble",   rarity: "Basic",       chance: 2,     maxMastery: 200,  earthMult: 2,   luckMult: 1.5,  color: "#a0a0a0" },
    { name: "Smooth Basalt",    rarity: "Basic",       chance: 10,    maxMastery: 200,  earthMult: 3,   luckMult: 2,    color: "#505050" },
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

const AutoSystem = {
    autoDig: { name: "Auto-Dig", baseCost: 500000, speedCost: 100000, maxSpeedLevel: 9, desc: "Automatically digs for Earth." }
};

// 2. PLAYER STATE
function getInitialState() {
    return {
        earth: 0, water: 0,
        upgrades: { earth: { shovelPower: 0, pickaxe: 0, pickaxeStrength: 0, drill: 0, drillStrength: 0, runeLuck: 0, automation: 0, unlockWater: 0 }, water: { bucketSize: 0, wellDepth: 0, filtration: 0 } },
        autoPurchased: { autoDig: false },
        autoLevels: { autoDigSpeed: 0 },
        collection: { earth: {}, water: {} },
        automationUnlocked: false,
        waterUnlocked: false
    };
}

let player = getInitialState();
let tickCounter = 0;

// 3. CORE MATH
function calculateTotals(element) {
    let runeMult = 1, runeLuck = 1;
    const runes = element === 'earth' ? EarthRunes : WaterRunes;
    const collection = player.collection[element];

    runes.forEach(r => {
        const count = collection[r.name] || 0;
        const m = Math.min(count, r.maxMastery);
        if (m > 0) {
            runeMult *= (1 + (( (element === 'earth' ? r.earthMult : r.waterMult) - 1) * (m / r.maxMastery)));
            runeLuck *= (1 + ((r.luckMult - 1) * (m / r.maxMastery)));
        }
    });

    if (element === 'earth') {
        const base = 1 + (player.upgrades.earth.shovelPower * 1) + (player.upgrades.earth.pickaxeStrength * 5) + (player.upgrades.earth.drillStrength * 25);
        let mult = 1 + (player.upgrades.earth.pickaxe > 0 ? 1 : 0) + (player.upgrades.earth.drill > 0 ? 1 : 0);
        let luck = 1 + (player.upgrades.earth.runeLuck * 0.01);
        return { gain: base * mult * runeMult, luck: luck * runeLuck, mult: mult * runeMult };
    } else {
        const base = 1 + (player.upgrades.water.bucketSize * 1);
        let mult = 1 + (player.upgrades.water.wellDepth > 0 ? 1 : 0);
        let luck = 1 + (player.upgrades.water.filtration * 0.02);
        return { gain: base * mult * runeMult, luck: luck * runeLuck, mult: mult * runeMult };
    }
}

// 4. ACTIONS
function collect(element) {
    const stats = calculateTotals(element);
    player[element] += stats.gain;
    updateUI();
}

function buyUpgrade(element, id) {
    const upg = Upgrades[element][id];
    const lvl = player.upgrades[element][id];
    const cost = upg.baseCost + (lvl * (upg.costAdd || 0));
    if (lvl < upg.maxLevel && player[element] >= cost) {
        player[element] -= cost;
        player.upgrades[element][id]++;
        if (id === "automation") player.automationUnlocked = true;
        if (id === "unlockWater") player.waterUnlocked = true;
        updateUI();
    }
}

function roll(element) {
    if (player[element] < 50) return;
    player[element] -= 50;
    const stats = calculateTotals(element);
    const runes = element === 'earth' ? EarthRunes : WaterRunes;
    let won = runes[0];
    let sorted = [...runes].sort((a, b) => b.chance - a.chance);
    for (let r of sorted) {
        if (Math.random() < (1 / Math.max(1, r.chance / stats.luck))) { won = r; break; }
    }
    player.collection[element][won.name] = (player.collection[element][won.name] || 0) + 1;
    updateUI();
}

// 5. UI ENGINE
function updateUI() {
    const eStats = calculateTotals('earth');
    const wStats = calculateTotals('water');

    document.getElementById('earth-display').innerText = Math.floor(player.earth).toLocaleString();
    document.getElementById('earth-mult-display').innerText = `Multiplier: ${eStats.mult.toFixed(2)}x`;
    document.getElementById('luck-stat-display').innerText = `Luck: ${eStats.luck.toFixed(2)}x`;
    document.getElementById('dig-btn').innerText = `Dig (+${eStats.gain.toLocaleString(undefined, {maximumFractionDigits:1})})`;

    if (player.waterUnlocked) {
        document.getElementById('water-display').innerText = Math.floor(player.water).toLocaleString();
        document.getElementById('water-mult-display').innerText = `Multiplier: ${wStats.mult.toFixed(2)}x`;
        document.getElementById('water-luck-display').innerText = `Luck: ${wStats.luck.toFixed(2)}x`;
        document.getElementById('gather-water-btn').innerText = `Gather (+${wStats.gain.toLocaleString(undefined, {maximumFractionDigits:1})})`;
        document.getElementById('water-tab-btn').classList.remove('locked');
    }

    // Dynamic Visibility
    if (player.upgrades.earth.drill > 0) Upgrades.earth.unlockWater.hidden = false;
    if (player.automationUnlocked) document.getElementById('auto-tab-btn').classList.remove('hidden');

    renderUpgrades('earth');
    renderUpgrades('water');
    renderRunes('earth', eStats.luck);
    renderRunes('water', wStats.luck);
}

function renderUpgrades(element) {
    const container = document.getElementById(`${element}-upgrade-list`);
    if (!container) return;
    container.innerHTML = "";
    Object.keys(Upgrades[element]).forEach(id => {
        const upg = Upgrades[element][id];
        if (upg.hidden) return;
        const lvl = player.upgrades[element][id];
        const cost = upg.baseCost + (lvl * (upg.costAdd || 0));
        const div = document.createElement('div');
        div.className = `upgrade-item ${lvl >= upg.maxLevel ? 'maxed' : ''}`;
        div.onclick = () => buyUpgrade(element, id);
        div.innerHTML = `<div><strong>${upg.name}</strong><br><small>Lvl ${lvl}/${upg.maxLevel}</small></div>
                         <div>${lvl >= upg.maxLevel ? 'MAX' : cost.toLocaleString()}</div>`;
        container.appendChild(div);
    });
}

function renderRunes(element, luck) {
    const container = document.getElementById(`${element}-rune-list`);
    const runes = element === 'earth' ? EarthRunes : WaterRunes;
    container.innerHTML = "";
    runes.forEach(r => {
        const count = player.collection[element][r.name] || 0;
        const disc = count > 0;
        const rarity = Math.max(1, r.chance / luck).toLocaleString(undefined, {maximumFractionDigits:1});
        const div = document.createElement('div');
        div.className = `rune-item ${disc ? '' : 'undiscovered'}`;
        div.style.borderLeft = disc ? `5px solid ${r.color}` : `5px solid #333`;
        div.innerHTML = `<div><span style="color:${disc ? r.color : '#555'}">${disc ? r.name : '???'}</span> [${disc ? r.rarity : '???'}]<br>
                         <small>Owned: ${count} | 1 in ${disc ? rarity : '???'}</small></div>`;
        container.appendChild(div);
    });
}

// 6. INIT
document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    setupTabs();
    updateUI();
    document.getElementById('dig-btn').onclick = () => collect('earth');
    document.getElementById('roll-btn').onclick = () => roll('earth');
    document.getElementById('gather-water-btn').onclick = () => collect('water');
    document.getElementById('water-roll-btn').onclick = () => roll('water');
    document.getElementById('manual-save-btn').onclick = () => saveGame(false);
    document.getElementById('reset-btn').onclick = () => { localStorage.clear(); location.reload(); };
    setInterval(() => {
        if (player.autoPurchased.autoDig) collect('earth'); 
    }, 200); 
});

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            if (btn.classList.contains('locked')) return;
            document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        };
    });
}