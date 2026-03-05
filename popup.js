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

    if (isColorLight(color)) {
        box.style.borderColor = "rgba(18, 72, 71, 0.2)";
    }

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

    box.title = color;

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
    if (confirm("Clear all colors in this palette?")) {
        allPalettes[activeIndex].colors = [];
        saveToStorage();
        renderColors();
    }
}

function hexToRgb(hex) {
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16)
    };
}

function rgbToHex(r, g, b) {
    const toHex = (n) => {
        const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
        return hex.padStart(2, '0');
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generateMatches(baseHex) {
    const rgb = hexToRgb(baseHex);
    const container = document.getElementById("matches-container");

    if (!container) return;
    container.innerHTML = '';

    const invert = (c) => 255 - c;
    const mix = (c, target, weight) => c + (target - c) * weight;

    const matches = [
        rgbToHex(invert(rgb.r), invert(rgb.g), invert(rgb.b)),
        rgbToHex(mix(rgb.r, 255, 0.3), mix(rgb.g, 255, 0.3), mix(rgb.b, 255, 0.3)),
        rgbToHex(mix(rgb.r, 0, 0.3), mix(rgb.g, 0, 0.3), mix(rgb.b, 0, 0.3)),
        rgbToHex(mix(rgb.r, 255, 0.6), mix(rgb.g, 255, 0.6), mix(rgb.b, 255, 0.6)),
        rgbToHex(mix(rgb.r, 0, 0.6), mix(rgb.g, 0, 0.6), mix(rgb.b, 0, 0.6))
    ];

    matches.forEach(matchHex => {
        const box = document.createElement("div");
        box.className = "color-box suggestion";
        box.style.background = matchHex;
        box.title = "Click to add to palette";
        box.onclick = () => {
            saveColorToActive(matchHex);

            box.style.transform = "scale(0)";
            box.style.opacity = "0";

            setTimeout(() => box.remove(), 200);
        }
        if (isColorLight(matchHex)) {
            box.style.borderColor = "rgba(18, 72, 71, 0.2)";
        }
        container.appendChild(box);
    });
}

function isColorLight(hex) {
    const rgb = hexToRgb(hex);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 220;
}