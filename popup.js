/** Render the preset buttons
 * Each button resizes the current window to the preset dimensions
 * Also handles settings panel for adding/removing presets
 * Uses chrome.storage.local to persist presets
 * @returns {void}
 */
function renderPresets() {
    chrome.storage.local.get({ presets: [] }, (data) => {
        if (data.presets.length === 0) {
            chrome.storage.local.set({ presets: [{ width: 800, height: 600 }] }, renderPresets);
        } else {
            const container = document.getElementById("presets");
            container.innerHTML = "";
            data.presets.forEach((parameter) => {
                const presetBtn = document.createElement("button");
                presetBtn.textContent = `${parameter.width}x${parameter.height}`;
                presetBtn.className = "preset";
                presetBtn.onclick = () => {
                    chrome.windows.getCurrent({}, (window) => {
                        const newLeft = window.left + window.width - parameter.width;
                        chrome.windows.update(
                            window.id,
                            {
                                width: parameter.width,
                                height: parameter.height,
                                left: newLeft
                            });
                    });
                };
                container.appendChild(presetBtn);
            });
        }
    });
}

/** Render the settings panel for managing presets
 * @returns {void}
 */
function renderSettings() {
    chrome.storage.local.get({ presets: [] }, (data) => {
        const listRow = document.getElementById("presetList");
        listRow.innerHTML = "";
        data.presets.forEach((p, i) => {
            const tdWidth = document.createElement("td");
            tdWidth.textContent = p.width;
            const tdHeight = document.createElement("td");
            tdHeight.textContent = p.height;
            const tdDelete = document.createElement("td");
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = " 🗑️ Delete";
            deleteBtn.onclick = () => {
                data.presets.splice(i, 1);
                chrome.storage.local.set({ presets: data.presets }, renderSettings);
            };
            tdDelete.appendChild(deleteBtn);

            const tr = document.createElement("tr");
            tr.appendChild(tdWidth);
            tr.appendChild(tdHeight);
            tr.appendChild(tdDelete);
            listRow.appendChild(tr);
        });
    });
}

/** Handle settings button click
 * @returns {void}
 */
document.getElementById("settings").onclick = () => {
    document.getElementById("presets").style.display = "none";
    document.getElementById("settings").style.display = "none";
    document.getElementById("settingsPanel").style.display = "block";
    renderSettings();
};

/** Handle back button click
 * @returns {void}
 */
document.getElementById("back").onclick = () => {
    document.getElementById("presets").style.display = "block";
    document.getElementById("settings").style.display = "block";
    document.getElementById("settingsPanel").style.display = "none";
    renderPresets();
};

/** Handle add preset button click
 * @returns {void}
 */
document.getElementById("addPreset").onclick = () => {
    const w = parseInt(document.getElementById("newWidth").value, 10);
    const h = parseInt(document.getElementById("newHeight").value, 10);
    chrome.storage.local.get({ presets: [] }, (data) => {
        data.presets.push({ width: w, height: h });
        chrome.storage.local.set({ presets: data.presets }, renderSettings);
    });
};

renderPresets();
