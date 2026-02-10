chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "PICK_COLOR") {
        const eyedropper = new EyeDropper();

        eyedropper.open().then(result => {
            sendResponse({color: result.sRGBHex});
        }).catch(() => {
            sendResponse({ color: null });
        });

        return true;
    }
});