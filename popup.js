const pickBtn = document.getElementById("pickBtn");
const clearBtn = document.getElementById("clearBtn");
const palette = document.getElementById("palette");
const currentColor = document.getElementById("currentColor");
const emptyState = document.getElementById("emptyState");
const paletteSelect = document.getElementById("paletteSelect");
const addPaletteButton = document.getElementById("addPaletteBtn");
const currentPaletteName = document.getElementById("currentPaletteName");
const deletePaletteBtn = document.getElementById("deletePaletteBtn");

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