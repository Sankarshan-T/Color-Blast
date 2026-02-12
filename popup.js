const pickBtn = document.getElementById("pickBtn");
const clearBtn = document.getElementById("clearBtn");
const palette = document.getElementById("palette");
const currentColor = document.getElementById("currentColor");
const emptyState = document.getElementById("emptyState");
const paletteSelect = document.getElementById("paletteSelect");
const addPaletteButton = document.getElementById("addPaletteBtn");
const currentPaletteName = document.getElementById("currentPaletteName");
const deletePaletteBtn = document.getElementById("deletePaletteBtn");
const countLabel = document.getElementById("colorCount");

let allPalettes = [];
let activeIndex = 0;

loadPalettes();

pickBtn.addEventListener("click", pickColor);
clearBtn.addEventListener("click", clearPalette);
paletteSelect.onchange = (e) => switchPalette(parseInt(e.target.value));

deletePaletteBtn.onclick = () => {
    if (allPalettes.length <= 1) {
        alert("You must have at least one palette!");
        return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete "${allPalettes[activeIndex].name}"?`);

    if (confirmDelete) {
        allPalettes.splice(activeIndex, 1);
        activeIndex = 0;

        saveToStorage();
        renderPaletteList();
        switchPalette(0);
    }
}

addPaletteButton.onclick = () => {
    const name = prompt("Enter a palette name.");
    if (name) {
        allPalettes.push({ name, colors: [] });
        saveToStorage();
        renderPaletteList();
        switchPalette(allPalettes.length - 1);
    }
};

async function pickColor() {
    try {
        const eyeDropper = new EyeDropper();
        const { sRGBHex } = await eyeDropper.open();
        currentColor.textContent = sRGBHex;
        
        saveColorToActive(sRGBHex);
        generateMatches(sRGBHex);

        chrome.runtime.sendMessage({ type: "COLOR_PICKED", color: sRGBHex });
    } catch (e) {
        console.log("Selection cancelled");
    }
}

function saveColorToActive(color) {
    if (!allPalettes[activeIndex].colors.includes(color)) {
        allPalettes[activeIndex].colors.push(color);
        saveToStorage();
        renderColors();
    }
}

function switchPalette(index) {
    activeIndex = index;
    paletteSelect.value = index;
    currentPaletteName.textContent = allPalettes[index].name;
    renderColors();
}

function renderPaletteList() {
    paletteSelect.innerHTML = '';
    allPalettes.forEach((p, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = p.name;
        paletteSelect.appendChild(opt);
    });
}

function renderColors() {
    palette.innerHTML = '';
    const colors = allPalettes[activeIndex].colors;
    emptyState.hidden = colors.length > 0;
    [...colors].reverse().forEach(color => addColorToUI(color));
    countLabel.textContent = `${colors.length} color${colors.length === 1 ? '' : 's'}`;
}

function addColorToUI(color) {
    const box = document.createElement("div");
    box.className = "color-box";
    box.style.background = color;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "×";

    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        allPalettes[activeIndex].colors = allPalettes[activeIndex].colors.filter(c => c !== color);
        saveToStorage();
        renderColors();
    };

    box.onclick = () => {
        navigator.clipboard.writeText(color);
        currentColor.textContent = `Copied ${color}`;

        box.classList.add('copy-animation');
        setTimeout(() => box.classList.remove('copy-animation'), 200);
    };

    box.onmouseenter = () => {
        document.body.style.backgroundColor = `${color}`;
    };

    box.onmouseleave = () => {
        document.body.style.backgroundColor = "";
    };

    box.appendChild(deleteBtn);
    palette.appendChild(box); 
}

function saveToStorage() {
    chrome.storage.local.set({ palettes: allPalettes });
}

function loadPalettes() {
    chrome.storage.local.get(["palettes"], res => {
        allPalettes = res.palettes || [{ name: "Default", colors: [] }];
        renderPaletteList();
        switchPalette(0);
    });
}

function clearPalette() {
    if(confirm("Clear all colors in this palette?")) {
        allPalettes[activeIndex].colors = [];
        saveToStorage();
        renderColors();
    }
}

function hexToHsl(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = (s * Math.min(1 , 1 - l)) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`
}

function generateMatches(baseHex) {
    const hsl = hexToHsl(baseHex);
    const container = document.getElementById("matches-container");
    container.innerHTML = '';

    const angles = [180, 30, -30, 120, 240];

    angles.forEach(angle => {
        const newHue = (hsl.h + angle + 360) % 360;
        const matchedHex = hslToHex(newHue, hsl.s, hsl.l);
        
        const suggestionBox = document.createElement("div");
        suggestionBox.className = "color-box suggestion";
        suggestionBox.style.background = matchedHex;
        suggestionBox.title = "Click to add to the current palette";

        suggestionBox.onclick = () => saveColorToActive(matchedHex);
        container.appendChild(suggestionBox);
    });
}