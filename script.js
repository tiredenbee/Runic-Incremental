const EarthRunes = [
    { name: "Cracked Pebble", chance: 1, color: "#a0a0a0", maxMastery: 100, earthBuff: 0.01 },
    { name: "Geode Core", chance: 250, color: "#b464ff", maxMastery: 10, luckBuff: 0.05 }
];

let player = {
    earth: 0,
    collection: {} // Will look like: {"Cracked Pebble": 5}
};

// Function to render the collection on the right side
function updateRuneList() {
    const list = document.getElementById('rune-list');
    list.innerHTML = ""; // Clear list

    EarthRunes.forEach(rune => {
        const count = player.collection[rune.name] || 0;
        const div = document.createElement('div');
        div.className = "rune-item";
        div.style.borderLeft = `5px solid ${rune.color}`;
        
        // Logic for buff display
        let buffText = "";
        if(rune.earthBuff) buffText = `+${(Math.min(count, rune.maxMastery) * rune.earthBuff * 100).toFixed(0)}% Earth`;
        if(rune.luckBuff) buffText = `+${(Math.min(count, rune.maxMastery) * rune.luckBuff * 100).toFixed(0)}% Luck`;

        div.innerHTML = `
            <span><strong>${rune.name}</strong> (x${count})</span>
            <span>${buffText}</span>
        `;
        list.appendChild(div);
    });
}

// Update the roll function to refresh this list
function roll() {
    if (player.earth >= 50) {
        player.earth -= 50;
        
        // ... (insert your RNG rolling logic here) ...
        // Example result:
        let wonRune = EarthRunes[0]; 
        player.collection[wonRune.name] = (player.collection[wonRune.name] || 0) + 1;
        
        updateUI();
        updateRuneList();
    }
}

// Initialize
updateRuneList();