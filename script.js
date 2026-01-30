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

const AutoUpgrades = {
    autoDig: { name: "Auto-Dig", cost: 500000, desc: "Digs 5x per second." },
    autoUpgrade: { name: "Auto-Upgrade", cost: 500000, desc: "Buys cheapest Earth upgrade." }
};

// Initial State
let player = {
    earth: 0,
    upgrades: { shovelPower: 0, pickaxe: 0, pickaxeStrength: 0, drill: 0, drillStrength: 0, runeLuck: 0, automation: 0 },
    autoPurchased: { autoDig: false, autoUpgrade: false },
    collection: {},
    automationUnlocked: false
};

function calculateTotals() {
    let rEMult = 1, rLMult = 1;
    EarthRunes.forEach(r => {
        const count = player.collection[r.name] || 0;
        const m = Math.min(count, r.maxMastery);
        if (m > 0) {
            rEMult *= (1 + ((r.earthMult - 1) * (m / r.maxMastery)));
            rLMult *= (1 + ((r.luckMult - 1) * (m / r.maxMastery)));
        }
    });

    const base = 1 + (player.upgrades.shovelPower * 1) + (player.upgrades.pickaxeStrength * 5) + (player.upgrades.drillStrength * 25);
    const mult = 1 + (player.upgrades.pickaxe > 0 ? 1 : 0) + (player.upgrades.drill > 0 ? 1 : 0);
    const luck = (1 + (player.upgrades.runeLuck * 0.01)) * rLMult;
    
    return { gain: base * mult * rEMult, luck: luck, mult: mult * rEMult };
}

function updateUI() {
    const stats = calculateTotals();
    
    // Numbers
    document.getElementById('earth-display').innerText = Math.floor(player.earth).toLocaleString();
    document.getElementById('earth-mult-display').innerText = `Multiplier: ${stats.mult.toFixed(2)}x`;
    document.getElementById('luck-stat-display').innerText = `Luck: ${stats.luck.toFixed(2)}x`;
    document.getElementById('dig-btn').innerText = `Dig (+${stats.gain.toFixed(1)})`;

    // Hidden logic
    if (player.upgrades.pickaxe > 0) { Upgrades.pickaxeStrength.hidden = false; Upgrades.drill.hidden = false; }
    if (player.upgrades.drill > 0) { Upgrades.drillStrength.hidden = false; Upgrades.runeLuck.hidden = false; Upgrades.automation.hidden = false; }
    if (player.automationUnlocked) document.getElementById('auto-tab-btn').classList.remove('hidden');

    // Render Standard Upgrades
    const upgList = document.getElementById('upgrade-list');
    upgList.innerHTML = "";
    Object.keys(Upgrades).forEach(id => {
        const upg = Upgrades[id];
        if (upg.hidden) return;
        const lvl = player.upgrades[id];
        const cost = upg.baseCost + (lvl * upg.costAdd);
        const div = document.createElement('div');
        div.className = `upgrade-item ${lvl >= upg.maxLevel ? 'maxed' : ''}`;
        div.onclick = () => {
            if (player.earth >= cost && lvl < upg.maxLevel) {
                player.earth -= cost;
                player.upgrades[id]++;
                if(id === 'automation') player.automationUnlocked = true;
                updateUI();
            }
        };
        div.innerHTML = `<div><strong>${upg.name}</strong><br><small>Lvl ${lvl}/${upg.maxLevel}</small></div>
                         <div>${lvl >= upg.maxLevel ? 'MAX' : cost.toLocaleString()}</div>`;
        upgList.appendChild(div);
    });

    // Render Automation Upgrades
    const autoList = document.getElementById('automation-upgrade-list');
    autoList.innerHTML = "";
    Object.keys(AutoUpgrades).forEach(id => {
        const upg = AutoUpgrades[id];
        const owned = player.autoPurchased[id];
        const div = document.createElement('div');
        div.className = `upgrade-item ${owned ? 'maxed' : ''}`;
        div.onclick = () => {
            if (!owned && player.earth >= upg.cost) {
                player.earth -= upg.cost;
                player.autoPurchased[id] = true;
                updateUI();
            }
        };
        div.innerHTML = `<div><strong>${upg.name}</strong><br><small>${upg.desc}</small></div>
                         <div>${owned ? 'ACTIVE' : upg.cost.toLocaleString()}</div>`;
        autoList.appendChild(div);
    });

    // Render Runes
    const runeList = document.getElementById('rune-list');
    runeList.innerHTML = "";
    EarthRunes.forEach(r => {
        const count = player.collection[r.name] || 0;
        const disc = count > 0;
        const div = document.createElement('div');
        div.className = `rune-item ${disc ? '' : 'undiscovered'}`;
        div.style.borderLeft = disc ? `5px solid ${r.color}` : `5px solid #333`;
        div.innerHTML = `<div><span style="color:${disc ? r.color : '#555'}">${disc ? r.name : '???'}</span> [${disc ? r.rarity : '???'}]<br>
                        <small>Owned: ${count} | 1 in ${disc ? (r.chance / stats.luck).toFixed(1) : '???'}</small></div>
                        <div class="rune-buffs" style="visibility:${disc ? 'visible' : 'hidden'}">x${r.earthMult} Earth<br>x${r.luckMult} Luck</div>`;
        runeList.appendChild(div);
    });
}

// Logic Loops
document.getElementById('dig-btn').onclick = () => { 
    player.earth += calculateTotals().gain; 
    updateUI(); 
};

document.getElementById('roll-btn').onclick = () => {
    if (player.earth >= 50) {
        player.earth -= 50;
        const stats = calculateTotals();
        let won = EarthRunes[0];
        let sorted = [...EarthRunes].sort((a,b) => b.chance - a.chance);
        for (let r of sorted) { 
            if (Math.random() < (1 / Math.max(1, r.chance / stats.luck))) { won = r; break; } 
        }
        player.collection[won.name] = (player.collection[won.name] || 0) + 1;
        updateUI();
    }
};

// Automation Interval (5 times per second)
setInterval(() => {
    if (player.autoPurchased.autoDig) {
        player.earth += (calculateTotals().gain / 5);
        updateUI();
    }
}, 200);

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        if(!btn.classList.contains('locked')) {
            document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        }
    };
});

// Reset and Save
document.getElementById('reset-btn').onclick = () => {
    if(confirm("Wipe all progress?")) {
        localStorage.clear();
        location.reload();
    }
};

updateUI();