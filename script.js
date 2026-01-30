// 1. DATA DATABASE
const EarthRunes = [
    { name: "Cracked Pebble",   rarity: "Basic",       chance: 2,     maxMastery: 200,  earthMult: 2,   luckMult: 1.5,  color: "#a0a0a0" },
    { name: "Smooth Basalt",    rarity: "Basic",       chance: 10,    maxMastery: 200,  earthMult: 3,   luckMult: 2,    color: "#505050" },
    { name: "Sedimentary Slab", rarity: "Regular",     chance: 100,   maxMastery: 150,  earthMult: 5,   luckMult: 2,    color: "#8c6e5a" },
    { name: "Geode Core",       rarity: "Rare",        chance: 250,   maxMastery: 100,  earthMult: 5,   luckMult: 3,    color: "#b464ff" },
    { name: "Tectonic Slab",    rarity: "Exceptional", chance: 2500,  maxMastery: 50,   earthMult: 10,  luckMult: 5,    color: "#ff6400" },
    { name: "Gaia's Heart",     rarity: "Mythic",      chance: 15000, maxMastery: 20,   earthMult: 20,  luckMult: 10,   color: "#32ff96" }
];

const Upgrades = {
    shovelPower: { name: "Shovel Power", baseCost: 5, costAdd: 5, maxLevel: 24, powerPerLevel: 1, hidden: false },
    pickaxe: { name: "Pickaxe", baseCost: 250, costAdd: 0, maxLevel: 1, powerPerLevel: 0, multAdd: 1, hidden: false },
    pickaxeStrength: { name: "Pickaxe Strength", baseCost: 25, costAdd: 25, maxLevel: 24, powerPerLevel: 5, hidden: true },
    drill: { name: "Drill", baseCost: 750, costAdd: 0, maxLevel: 1, powerPerLevel: 0, multAdd: 1, hidden: true },
    drillStrength: { name: "Drill Strength", baseCost: 125, costAdd: 125, maxLevel: 24, powerPerLevel: 25, hidden: true },
    runeLuck: { name: "Rune Luck", baseCost: 1000, costAdd: 1000, maxLevel: 50, luckPerLevel: 0.01, hidden: true },
    automation: { name: "Automation", baseCost: 100000, costAdd: 0, maxLevel: 1, hidden: true }
};

// Automation config
const AutoSystem = {
    autoDig: { 
        name: "Auto-Dig", 
        baseCost: 500000, 
        speedCost: 100000, 
        maxSpeedLevel: 9, // Base (1) + 9 upgrades = 10 total
        desc: "Automatically digs for Earth." 
    },
    autoUpgrade: { 
        name: "Earth Auto-Upgrade", 
        baseCost: 500000, 
        desc: "Automatically buys the cheapest Earth upgrade." 
    }
};

// 2. PLAYER STATE
function getInitialState() {
    return {
        earth: 0,
        baseEarthPerClick: 1,
        baseLuck: 1,
        upgrades: { shovelPower: 0, pickaxe: 0, pickaxeStrength: 0, drill: 0, drillStrength: 0, runeLuck: 0, automation: 0 },
        autoPurchased: { autoDig: false, autoUpgrade: false },
        autoLevels: { autoDigSpeed: 0 }, 
        collection: {},
        automationUnlocked: false
    };
}

let player = getInitialState();
let tickCounter = 0;

// 3. SYSTEM FUNCTIONS
function showNotification(text) {
    const container = document.getElementById('notification-container');
    const popup = document.createElement('div');
    popup.className = 'save-popup';
    popup.innerText = text;
    container.appendChild(popup);
    setTimeout(() => popup.remove(), 2500);
}

function saveGame(isAuto = false) {
    localStorage.setItem("RunicIncrementalSave_V2", JSON.stringify(player));
    if (!isAuto) showNotification("Saved Successfully!");
}

function loadGame() {
    const savedData = localStorage.getItem("RunicIncrementalSave_V2");
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            player = { ...getInitialState(), ...parsed };
            player.upgrades = { ...getInitialState().upgrades, ...parsed.upgrades };
            player.autoLevels = { ...getInitialState().autoLevels, ...parsed.autoLevels };
            player.collection = { ...getInitialState().collection, ...parsed.collection };
        } catch (e) { console.error("Save data corrupt."); }
    }
}

// 4. CORE MATH
function calculateTotals() {
    let runeEMult = 1, runeLMult = 1;
    EarthRunes.forEach(rune => {
        const count = player.collection[rune.name] || 0;
        const level = Math.min(count, rune.maxMastery);
        if (level > 0) {
            runeEMult *= (1 + ((rune.earthMult - 1) * (level / rune.maxMastery)));
            runeLMult *= (1 + ((rune.luckMult - 1) * (level / rune.maxMastery)));
        }
    });

    const sPow = player.upgrades.shovelPower * Upgrades.shovelPower.powerPerLevel;
    const pPow = player.upgrades.pickaxeStrength * Upgrades.pickaxeStrength.powerPerLevel;
    const dPow = player.upgrades.drillStrength * Upgrades.drillStrength.powerPerLevel;
    
    let upgradeMult = 1;
    if (player.upgrades.pickaxe > 0) upgradeMult += Upgrades.pickaxe.multAdd;
    if (player.upgrades.drill > 0) upgradeMult += Upgrades.drill.multAdd;

    let totalLuckMult = player.baseLuck + (player.upgrades.runeLuck * Upgrades.runeLuck.luckPerLevel);

    return { 
        earthPerClick: (player.baseEarthPerClick + sPow + pPow + dPow) * upgradeMult * runeEMult, 
        earthMult: upgradeMult * runeEMult, 
        luck: totalLuckMult * runeLMult 
    };
}

// 5. ACTIONS
function dig() {
    player.earth += calculateTotals().earthPerClick;
    updateUI();
}

function buyUpgrade(id) {
    const upg = Upgrades[id];
    const lvl = player.upgrades[id];
    const cost = upg.baseCost + (lvl * upg.costAdd);
    if (lvl < upg.maxLevel && player.earth >= cost) {
        player.earth -= cost;
        player.upgrades[id]++;
        if (id === "automation") player.automationUnlocked = true;
        updateUI();
    }
}

function buyAutoBase(id) {
    const config = AutoSystem[id];
    if (!player.autoPurchased[id] && player.earth >= config.baseCost) {
        player.earth -= config.baseCost;
        player.autoPurchased[id] = true;
        updateUI();
    }
}

function buyAutoSpeed(id) {
    const config = AutoSystem[id];
    const currentLvl = player.autoLevels[id + 'Speed'] || 0;
    if (currentLvl < config.maxSpeedLevel && player.earth >= config.speedCost) {
        player.earth -= config.speedCost;
        player.autoLevels[id + 'Speed']++;
        updateUI();
    }
}

function roll() {
    if (player.earth < 50) return;
    player.earth -= 50;
    const stats = calculateTotals();
    let won = EarthRunes[0];
    let sorted = [...EarthRunes].sort((a, b) => b.chance - a.chance);
    for (let r of sorted) {
        if (Math.random() < (1 / Math.max(1, r.chance / stats.luck))) { won = r; break; }
    }
    player.collection[won.name] = (player.collection[won.name] || 0) + 1;
    document.getElementById('last-roll-text').innerText = `Rolled: ${won.name}!`;
    document.getElementById('last-roll-text').style.color = won.color;
    updateUI();
}

// 6. UI ENGINE
function updateUI() {
    const stats = calculateTotals();
    document.getElementById('earth-display').innerText = Math.floor(player.earth).toLocaleString();
    document.getElementById('earth-mult-display').innerText = `Multiplier: ${stats.earthMult.toFixed(2)}x`;
    document.getElementById('luck-stat-display').innerText = `Luck: ${stats.luck.toFixed(2)}x`;

    // Milestone logic
    if (player.upgrades.pickaxe > 0) { Upgrades.pickaxeStrength.hidden = false; Upgrades.drill.hidden = false; }
    if (player.upgrades.drill > 0) { Upgrades.drillStrength.hidden = false; Upgrades.runeLuck.hidden = false; Upgrades.automation.hidden = false; }
    if (player.automationUnlocked) document.getElementById('auto-tab-btn').classList.remove('hidden');

    // Standard Upgrades
    const upgList = document.getElementById('upgrade-list');
    upgList.innerHTML = "";
    Object.keys(Upgrades).forEach(id => {
        const upg = Upgrades[id];
        if (upg.hidden) return;
        const lvl = player.upgrades[id], cost = upg.baseCost + (lvl * upg.costAdd);
        const div = document.createElement('div');
        div.className = `upgrade-item ${lvl >= upg.maxLevel ? 'maxed' : ''}`;
        div.onclick = () => buyUpgrade(id);
        div.innerHTML = `<div><strong>${upg.name}</strong><br><small>Lvl ${lvl}/${upg.maxLevel}</small></div>
                         <div>${lvl >= upg.maxLevel ? 'MAX' : cost.toLocaleString()}</div>`;
        upgList.appendChild(div);
    });

    // Automation Hub (Stacked UI)
    const autoContainer = document.getElementById('automation-upgrade-list');
    autoContainer.innerHTML = "";
    Object.keys(AutoSystem).forEach(id => {
        const config = AutoSystem[id];
        const purchased = player.autoPurchased[id];
        
        const row = document.createElement('div');
        row.className = "automation-row";
        
        // Base Unit
        let baseHTML = `<div class="auto-base-unit">
            <strong>${config.name}</strong><br><small>${config.desc}</small><br>
            <button class="sub-upg-box" onclick="buyAutoBase('${id}')" ${purchased ? 'disabled' : ''}>
                ${purchased ? 'Purchased' : config.baseCost.toLocaleString() + ' Earth'}
            </button>
        </div>`;
        
        // Sub Upgrades (Speed)
        let subHTML = `<div class="auto-sub-upgrades">`;
        if (purchased && config.maxSpeedLevel) {
            const currentSpeedLvl = player.autoLevels[id + 'Speed'] || 0;
            const speedCost = config.speedCost;
            subHTML += `<div style="width:100%; margin-bottom:5px;"><small>Speed Level: ${currentSpeedLvl+1}/10</small></div>`;
            if (currentSpeedLvl < config.maxSpeedLevel) {
                subHTML += `<button class="sub-upg-box" onclick="buyAutoSpeed('${id}')">Upgrade Speed (${speedCost.toLocaleString()})</button>`;
            } else {
                subHTML += `<div class="sub-upg-box maxed">Max Speed</div>`;
            }
        }
        subHTML += `</div>`;
        
        row.innerHTML = baseHTML + subHTML;
        autoContainer.appendChild(row);
    });

    // Runes
    const runeList = document.getElementById('rune-list');
    runeList.innerHTML = "";
    EarthRunes.forEach(r => {
        const count = player.collection[r.name] || 0;
        const disc = count > 0;
        const rarity = Math.max(1, r.chance / stats.luck).toLocaleString(undefined, {maximumFractionDigits: 1});
        const eb = 1 + (r.earthMult - 1) * (Math.min(count, r.maxMastery) / r.maxMastery);
        const lb = 1 + (r.luckMult - 1) * (Math.min(count, r.maxMastery) / r.maxMastery);
        
        const div = document.createElement('div');
        div.className = `rune-item ${disc ? '' : 'undiscovered'}`;
        div.style.borderLeft = disc ? `5px solid ${r.color}` : `5px solid #333`;
        div.innerHTML = `<div><span style="color:${disc ? r.color : '#555'}">${disc ? r.name : '???'}</span> [${disc ? r.rarity : '???'}]<br>
                         <small>Owned: ${count} | 1 in ${disc ? rarity : '???'}</small></div>
                         <div class="rune-buffs" style="visibility:${disc ? 'visible' : 'hidden'}">x${eb.toFixed(2)} E | x${lb.toFixed(2)} L</div>`;
        runeList.appendChild(div);
    });
}

// 7. GAME LOOP
function gameTick() {
    tickCounter++;
    
    // Auto-Dig Logic
    if (player.autoPurchased.autoDig) {
        const speedLvl = player.autoLevels.autoDigSpeed || 0; 
        const digsPerSec = 1 + speedLvl; // 1 to 10
        const ticksPerDig = 20 / digsPerSec;
        
        if (tickCounter % Math.floor(ticksPerDig) === 0) {
            dig();
        }
    }

    // Auto-Upgrade Logic (Once per second)
    if (player.autoPurchased.autoUpgrade && tickCounter % 20 === 0) {
        let cheapest = null;
        let minCost = Infinity;
        Object.keys(Upgrades).forEach(id => {
            const upg = Upgrades[id];
            if (!upg.hidden && id !== 'automation') {
                const cost = upg.baseCost + (player.upgrades[id] * upg.costAdd);
                if (player.upgrades[id] < upg.maxLevel && cost < minCost) {
                    minCost = cost;
                    cheapest = id;
                }
            }
        });
        if (cheapest && player.earth >= minCost) buyUpgrade(cheapest);
    }
}

// 8. INIT
document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    setupTabs();
    updateUI();
    document.getElementById('dig-btn').addEventListener('click', dig);
    document.getElementById('roll-btn').addEventListener('click', roll);
    document.getElementById('manual-save-btn').addEventListener('click', () => saveGame(false));
    document.getElementById('reset-btn').addEventListener('click', () => {
        if(confirm("Reset progress?")) { player = getInitialState(); localStorage.clear(); location.reload(); }
    });
    setInterval(gameTick, 50); // 20 ticks per second
    setInterval(() => saveGame(true), 15000); 
});

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('locked')) return;
            document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
}