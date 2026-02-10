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
