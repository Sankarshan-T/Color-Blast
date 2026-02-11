const pickBtn = document.getElementById("pickBtn");
const clearBtn = document.getElementById("clearBtn");
const palette = document.getElementById("palette");
const currentColor = document.getElementById("currentColor");
const emptyState = document.getElementById("emptyState");

loadColors();

pickBtn.addEventListener("click", pickColor);
clearBtn.addEventListener("click", clearPalette);

async function pickColor() {
    try {
        const eyeDropper = new EyeDropper();
        const { sRGBHex } = await eyeDropper.open();

        currentColor.textContent = sRGBHex;
        addColor(sRGBHex, true);

        chrome.runtime.sendMessage({
            type: "COLOR_PICKED",
            color: sRGBHex,
          });
    } catch {
          console.log("Cancelled");
    }
}

function addColor(color, save) {
    const box = document.createElement("div");
    box.className = "color-box";
    box.style.background = color;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "×";

    deleteBtn.onclick = (e) => {
        e.stopPropagation(); 
        removeColor(color, box);
    };
  
    box.onclick = () => copyColor(color);
    
    box.appendChild(deleteBtn);
    palette.prepend(box);
    emptyState.hidden = true;
  
    if (save) saveColor(color);
}


function copyColor(color) {
  navigator.clipboard.writeText(color);
  currentColor.textContent = `Copied ${color}`;
}

function removeColor(color, element) {
    element.remove();
  
    chrome.storage.local.get(["colors"], res => {
      const updated = (res.colors || []).filter(c => c !== color);
      chrome.storage.local.set({ colors: updated });
  
      if (updated.length === 0) emptyState.hidden = false;
    });
}

function clearPalette() {
    palette.innerHTML = "";
    chrome.storage.local.set({ colors: [] });
    emptyState.hidden = false;
}

function saveColor(color) {
    chrome.storage.local.get(["colors"], res => {
        const colors = res.colors || [];
        if (!colors.includes(color)) {
            colors.push(color);
            chrome.storage.local.set({ colors });
        }
    });
}

function loadColors() {
    chrome.storage.local.get(["colors"], res => {
      const colors = res.colors || [];
      if (colors.length === 0) {
        emptyState.hidden = false;
        return;
      }
  
      colors.forEach(color => addColor(color, false));
    });
}

