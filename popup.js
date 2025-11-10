function renderPresets() {
    chrome.storage.local.get({ presets: [] }, (data) => {
        const container = document.getElementById("presets");
        container.innerHTML = "";
        data.presets.forEach((p, i) => {
            const btn = document.createElement("button");
            btn.textContent = `${p.width}x${p.height}`;
            btn.className = "preset";
            btn.onclick = () => {
                chrome.windows.getCurrent({}, (win) => {
                    chrome.windows.update(win.id, { width: p.width, height: p.height });
                });
            };
            container.appendChild(btn);
        });
    });
}

function renderSettings() {
    chrome.storage.local.get({ presets: [] }, (data) => {
        const list = document.getElementById("presetList");
        list.innerHTML = "";
        data.presets.forEach((p, i) => {
            const div = document.createElement("div");
            div.textContent = `${p.width}x${p.height} `;
            const del = document.createElement("button");
            del.textContent = "削除";
            del.onclick = () => {
                data.presets.splice(i, 1);
                chrome.storage.local.set({ presets: data.presets }, renderSettings);
            };
            div.appendChild(del);
            list.appendChild(div);
        });
    });
}

document.getElementById("settings").onclick = () => {
    document.getElementById("presets").style.display = "none";
    document.getElementById("settings").style.display = "none";
    document.getElementById("settingsPanel").style.display = "block";
    renderSettings();
};

document.getElementById("back").onclick = () => {
    document.getElementById("presets").style.display = "block";
    document.getElementById("settings").style.display = "block";
    document.getElementById("settingsPanel").style.display = "none";
    renderPresets();
};

document.getElementById("addPreset").onclick = () => {
    const w = parseInt(document.getElementById("width").value, 10);
    const h = parseInt(document.getElementById("height").value, 10);
    chrome.storage.local.get({ presets: [] }, (data) => {
        data.presets.push({ width: w, height: h });
        chrome.storage.local.set({ presets: data.presets }, renderSettings);
    });
};

renderPresets();
