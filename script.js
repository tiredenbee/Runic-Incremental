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
    { name: "River Stone",      rarity: "Basic",       chance: 10,    maxMastery: 200,  waterMult: 3,   luckMult: 2,    color: "#4fc3f7" }
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
        wellDepth: { name: "Well Depth", baseCost: 500, costAdd: 0, maxLevel: 1, multAdd: 1 }
    }
};

const AutoUpgrades = {
    earth: {
        autoDig: { name: "Auto-Dig", cost: 500000, desc: "Digs for Earth 5x per second." }
    },
    water: {
        autoGather: { name: "Auto-Gather", cost: 500000, desc: "Gathers Water 5x per second." }
    }
};

let player = {
    earth: 0, water: 0,
    upgrades: { earth: {}, water: {} },
    autoPurchased: { earth: {}, water: {} },
    collection: { earth: {}, water: {} },
    automationUnlocked: false,
    waterUnlocked: false
};

// Initialize empty upgrade levels if missing
Object.keys(Upgrades.earth).forEach(k => player.upgrades.earth[k] = 0);
Object.keys(Upgrades.water).forEach(k => player.upgrades.water[k] = 0);
Object.keys(AutoUpgrades.earth).forEach(k => player.autoPurchased.earth[k] = false);
Object.keys(AutoUpgrades.water).forEach(k => player.autoPurchased.water[k] = false);

function saveGame(isAuto = false) {
    localStorage.setItem("RunicIncremental_SaveV7", JSON.stringify(player));
    const container = document.getElementById('notification-container');
    if (container) container.innerHTML = `<span class="save-popup">${isAuto ? 'Auto-saved' : 'Game Saved!'}</span>`;
}

function loadGame() {
    const saved = localStorage.getItem("RunicIncremental_SaveV7");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Deep Merge logic
            if (parsed.earth !== undefined) player.earth = parsed.earth;
            if (parsed.water !== undefined) player.water = parsed.water;
            if (parsed.upgrades?.earth) player.upgrades.earth = {...player.upgrades.earth, ...parsed.upgrades.earth};
            if (parsed.upgrades?.water) player.upgrades.water = {...player.upgrades.water, ...parsed.upgrades.water};
            if (parsed.collection?.earth) player.collection.earth = {...player.collection.earth, ...parsed.collection.earth};
            if (parsed.collection?.water) player.collection.water = {...player.collection.water, ...parsed.collection.water};
            if (parsed.autoPurchased?.earth) player.autoPurchased.earth = {...player.autoPurchased.earth, ...parsed.autoPurchased.earth};
            if (parsed.autoPurchased?.water) player.autoPurchased.water = {...player.autoPurchased.water, ...parsed.autoPurchased.water};
            player.automationUnlocked = parsed.automationUnlocked || false;
            player.waterUnlocked = parsed.waterUnlocked || false;
        } catch(e) { console.error("Load failed", e); }
    }
}

function calculateTotals(element) {
    let rMult = 1, rLMult = 1, rBulk = 1;
    const runes = element === 'earth' ? EarthRunes : WaterRunes;
    const coll = player.collection[element] || {};

    runes.forEach(r => {
        const count = coll[r.name] || 0;
        const m = Math.min(count, r.maxMastery);
        if (m > 0) {
            if (r.bulkAdd) {
                rBulk += Math.min(r.maxBulk, count * r.bulkAdd);
            } else {
                const multVal = (element === 'earth' ? r.earthMult : r.waterMult) || 1;
                rMult *= (1 + ((multVal - 1) * (m / r.maxMastery)));
                rLMult *= (1 + ((r.luckMult - 1) * (m / r.maxMastery)));
            }
        }
    });

    if (element === 'earth') {
        const upg = player.upgrades.earth;
        const base = 1 + (upg.shovelPower * 1) + (upg.pickaxeStrength * 5) + (upg.drillStrength * 25);
        const mult = 1 + (upg.pickaxe > 0 ? 1 : 0) + (upg.drill > 0 ? 1 : 0);
        const luck = (1 + (upg.runeLuck * 0.01)) * rLMult;
        return { gain: base * mult * rMult, luck: luck, mult: mult * rMult, bulk: Math.floor(rBulk) };
    } else {
        const upg = player.upgrades.water;
        const base = 1 + (upg.bucketSize * 1);
        const mult = 1 + (upg.wellDepth > 0 ? 1 : 0);
        return { gain: base * mult * rMult, luck: rLMult, mult: mult * rMult, bulk: Math.floor(rBulk) };
    }
}

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

    // Dynamic visibility
    const earthU = player.upgrades.earth;
    if (earthU.pickaxe > 0) { Upgrades.earth.pickaxeStrength.hidden = false; Upgrades.earth.drill.hidden = false; }
    if (earthU.drill > 0) { Upgrades.earth.drillStrength.hidden = false; Upgrades.earth.runeLuck.hidden = false; Upgrades.earth.automation.hidden = false; }
    if (earthU.automation > 0) { Upgrades.earth.unlockWater.hidden = false; player.automationUnlocked = true; }
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
        const lvl = player.upgrades[element][id] || 0;
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
            boostText = `+${Math.min(r.maxBulk, count * r.bulkAdd)} Bulk`;
        } else {
            const multVal = (element === 'earth' ? r.earthMult : r.waterMult) || 1;
            boostText = `x${(1 + (multVal-1)*(m/r.maxMastery)).toFixed(2)} Power<br>x${(1 + (r.luckMult-1)*(m/r.maxMastery)).toFixed(2)} Luck`;
        }
        const div = document.createElement('div');
        div.className = `rune-item ${disc ? '' : 'undiscovered'}`;
        div.style.borderLeft = `5px solid ${disc ? r.color : '#333'}`;
        div.innerHTML = `<div><span style="color:${disc ? r.color : '#555'}">${disc ? r.name : '???'}</span><br>
                        <small>Owned: ${count} | 1 in ${(r.chance / luck).toFixed(1)}</small></div>
                        <div class="rune-buffs">${disc ? boostText : ''}</div>`;
        container.appendChild(div);
    });
}

function renderAutomation() {
    const container = document.getElementById('automation-categories');
    if (!container) return;
    container.innerHTML = "";
    Object.keys(AutoUpgrades).forEach(el => {
        if (el !== 'earth' && !player[`${el}Unlocked`]) return;
        const cat = document.createElement('div');
        cat.className = "auto-category";
        catDiv = `<div class="category-header">${el} Automation</div><div class="automation-grid">`;
        Object.keys(AutoUpgrades[el]).forEach(id => {
            const upg = AutoUpgrades[el][id];
            const owned = player.autoPurchased[el][id];
            catDiv += `<div class="upgrade-item ${owned ? 'maxed' : ''}" onclick="buyAuto('${el}','${id}',${upg.cost})">
                <div><strong>${upg.name}</strong><br><small>${upg.desc}</small></div>
                <div>${owned ? 'ACTIVE' : upg.cost.toLocaleString() + ' Earth'}</div>
            </div>`;
        });
        cat.innerHTML = catDiv + `</div>`;
        container.appendChild(cat);
    });
}

window.buyAuto = (el, id, cost) => {
    if (!player.autoPurchased[el][id] && player.earth >= cost) {
        player.earth -= cost;
        player.autoPurchased[el][id] = true;
        updateUI();
    }
};

document.getElementById('dig-btn').onclick = () => { player.earth += calculateTotals('earth').gain; updateUI(); };
document.getElementById('gather-water-btn').onclick = () => { player.water += calculateTotals('water').gain; updateUI(); };

function roll(element) {
    if (player[element] < 50) return;
    const stats = calculateTotals(element);
    player[element] -= 50;
    const runes = element === 'earth' ? EarthRunes : WaterRunes;
    const sorted = [...runes].sort((a,b) => b.chance - a.chance);
    for (let i = 0; i < stats.bulk; i++) {
        let won = runes[0];
        for (let r of sorted) { 
            if (Math.random() < (1 / (r.chance / stats.luck))) { won = r; break; } 
        }
        player.collection[element][won.name] = (player.collection[element][won.name] || 0) + 1;
    }
    updateUI();
}

document.getElementById('roll-btn').onclick = () => roll('earth');
document.getElementById('water-roll-btn').onclick = () => roll('water');

setInterval(() => {
    if (player.autoPurchased.earth.autoDig) player.earth += (calculateTotals('earth').gain / 5);
    if (player.autoPurchased.water.autoGather) player.water += (calculateTotals('water').gain / 5);
    updateUI();
}, 200);

setInterval(() => saveGame(true), 30000);

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        if(!btn.classList.contains('locked')) {
            document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        }
    };
});

document.getElementById('manual-save-btn').onclick = () => saveGame(false);
document.getElementById('reset-btn').onclick = () => { if(confirm("Wipe progress?")) { localStorage.clear(); location.reload(); } };

window.onload = () => { loadGame(); updateUI(); };