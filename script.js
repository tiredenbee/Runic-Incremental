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
    // NEW LAYER
    drillStrength: { name: "Drill Strength", baseCost: 125, costAdd: 125, maxLevel: 24, powerPerLevel: 25, hidden: true },
    runeLuck: { name: "Rune Luck", baseCost: 1000, costAdd: 1000, maxLevel: 24, luckPerLevel: 0.1, hidden: true },
    automation: { name: "Automation", baseCost: 100000, costAdd: 0, maxLevel: 1, hidden: true }
};

// 2. PLAYER STATE
function getInitialState() {
    return {
        earth: 0,
        baseEarthPerClick: 1,
        baseLuck: 1,
        upgrades: { shovelPower: 0, pickaxe: 0, pickaxeStrength: 0, drill: 0, drillStrength: 0, runeLuck: 0, automation: 0 },
        collection: {},
        automationUnlocked: false
    };
}

let player = getInitialState();

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
    localStorage.setItem("RunicIncrementalSave", JSON.stringify(player));
    if (!isAuto) showNotification("Saved Successfully!");
}

function loadGame() {
    const savedData = localStorage.getItem("RunicIncrementalSave");
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            player = { ...getInitialState(), ...parsed };
            player.upgrades = { ...getInitialState().upgrades, ...parsed.upgrades };
            player.collection = { ...getInitialState().collection, ...parsed.collection };
        } catch (e) { console.error("Save data corrupt."); }
    }
}

function resetGame() {
    if (confirm("Reset everything?") && confirm("Last chance. Wipe?")) {
        player = getInitialState();
        localStorage.removeItem("RunicIncrementalSave");
        location.reload();
    }
}

// 4. MATH
function calculateTotals() {
    let runeEMult = 1, runeLMult = 1;
    EarthRunes.forEach(rune => {
        const level = Math.min(player.collection[rune.name] || 0, rune.maxMastery);
        if (level > 0) {
            runeEMult *= (1 + ((rune.earthMult - 1) * (level / rune.maxMastery)));
            runeLMult *= (1 + ((rune.luckMult - 1) * (level / rune.maxMastery)));
        }
    });

    // Additive Power
    const sPow = player.upgrades.shovelPower * Upgrades.shovelPower.powerPerLevel;
    const pPow = player.upgrades.pickaxeStrength * Upgrades.pickaxeStrength.powerPerLevel;
    const dPow = player.upgrades.drillStrength * Upgrades.drillStrength.powerPerLevel;
    const totalBasePower = player.baseEarthPerClick + sPow + pPow + dPow;

    // Multipliers
    let upgradeMult = 1;
    if (player.upgrades.pickaxe > 0) upgradeMult += Upgrades.pickaxe.multAdd;
    if (player.upgrades.drill > 0) upgradeMult += Upgrades.drill.multAdd;

    // Luck Multipliers (Base 1 + Upgrade Bonus)
    let totalLuckMult = player.baseLuck + (player.upgrades.runeLuck * Upgrades.runeLuck.luckPerLevel);

    return { 
        earthPerClick: totalBasePower * upgradeMult * runeEMult, 
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
    const level = player.upgrades[id] || 0;
    const cost = upg.baseCost + (level * upg.costAdd);
    
    if (level < upg.maxLevel && player.earth >= cost) {
        player.earth -= cost;
        player.upgrades[id]++;
        
        if (id === "automation") player.automationUnlocked = true;
        
        updateUI();
        saveGame(true);
    }
}

function roll() {
    if (player.earth < 50) return;
    player.earth -= 50;
    const stats = calculateTotals();
    let sorted = [...EarthRunes].sort((a, b) => b.chance - a.chance);
    let won = EarthRunes[0];
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
    document.getElementById('dig-btn').innerText = `Dig for Earth (+${stats.earthPerClick.toLocaleString(undefined, {maximumFractionDigits: 1})})`;

    // Visibility Logic
    if (player.upgrades.pickaxe > 0) {
        Upgrades.pickaxeStrength.hidden = false;
        Upgrades.drill.hidden = false;
    }
    if (player.upgrades.drill > 0) {
        Upgrades.drillStrength.hidden = false;
        Upgrades.runeLuck.hidden = false;
        Upgrades.automation.hidden = false;
    }
    
    // Tab visibility
    const autoTabBtn = document.getElementById('auto-tab-btn');
    if (player.automationUnlocked) autoTabBtn.classList.remove('hidden');

    // Upgrade List Rendering
    const upgList = document.getElementById('upgrade-list');
    upgList.innerHTML = "";
    Object.keys(Upgrades).forEach(id => {
        const upg = Upgrades[id];
        if (upg.hidden) return;
        const lvl = player.upgrades[id], maxed = lvl >= upg.maxLevel;
        const cost = upg.baseCost + (lvl * upg.costAdd);
        const div = document.createElement('div');
        div.className = `upgrade-item ${maxed ? 'maxed' : ''}`;
        div.onclick = () => buyUpgrade(id);
        div.innerHTML = `<div><strong>${upg.name}</strong><br><small>Level: ${lvl}/${upg.maxLevel}</small></div>
                         <div>${maxed ? 'MAXED' : cost.toLocaleString() + ' Earth'}</div>`;
        upgList.appendChild(div);
    });

    // Rune List Rendering
    const runeList = document.getElementById('rune-list');
    runeList.innerHTML = "";
    EarthRunes.forEach(r => {
        const count = player.collection[r.name] || 0;
        const mLevel = Math.min(count, r.maxMastery);
        const currentChance = Math.max(1, r.chance / stats.luck).toLocaleString(undefined, {maximumFractionDigits: 1});
        const eb = 1 + (r.earthMult - 1) * (mLevel / r.maxMastery);
        const lb = 1 + (r.luckMult - 1) * (mLevel / r.maxMastery);
        const div = document.createElement('div');
        div.className = "rune-item"; div.style.borderLeft = `5px solid ${r.color}`;
        div.innerHTML = `<div><span style="color:${r.color};font-weight:bold">${r.name}</span> <span style="font-size:0.7rem;opacity:0.7">[${r.rarity}]</span><br>
                         <small>Owned: ${count} | <span style="color:var(--luck-color)">1 in ${currentChance}</span></small></div>
                         <div class="rune-buffs">x${eb.toFixed(2)} Earth<br>x${lb.toFixed(2)} Luck</div>`;
        runeList.appendChild(div);
    });
}

// 7. TAB SWITCHING
function setupTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('locked')) return;
            
            // UI Toggle
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
}

// 8. INIT
document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    setupTabs();
    updateUI();
    document.getElementById('dig-btn').addEventListener('click', dig);
    document.getElementById('roll-btn').addEventListener('click', roll);
    document.getElementById('manual-save-btn').addEventListener('click', () => saveGame(false));
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    setInterval(() => saveGame(true), 15000); 
});