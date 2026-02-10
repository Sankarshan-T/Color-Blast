const pickBtn = document.getElementById("pickBtn");
const currentColor = document.getElementById("currentColor");
const palette = document.getElementById("palette");


  

pickBtn.addEventListener("click", async () => {
    try {
        const eyeDropper = new EyeDropper();
        const result = await eyeDropper.open();

        addColor(result.sRGBHex);


        chrome.runtime.sendMessage({
            type: "COLOR_PICKED",
            color: result.sRGBHex
          });
        } catch {
          console.log("User cancelled");
        }
});

function addColor(color) {
    const box = document.createElement("div");
    box.className = "color-box";
    box.style.background = color;
    box.dataset.tooltip = "Click to copy";

    box.onclick = async () => {
        await navigator.clipboard.writeText(color);
        box.dataset.tooltip = "Copied!";
        setTimeout(() => box.dataset.tooltip = "Click to copy", 800);
    }

    palette.appendChild(box);
    saveColor(color);
}   

function saveColor(color) {
    chrome.storage.local.get(["colors"], res => {
        const colors = res.colors || [];
        colors.push(color);
        chrome.storage.local.set({ colors });
    });
}

function loadColors() {
    chrome.storage.local.get(["colors"], res => {
        (res.colors || []).forEach(addColor);
    });
}



loadColors();