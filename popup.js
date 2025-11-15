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
function renderSettings(highlightIndex = null) {
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

            // 直近追加された行をハイライト
            if (highlightIndex === i) {
                tr.classList.add("highlight");
                setTimeout(() => {
                    tr.classList.remove("highlight");
                }, 500); // 500ms後に通常表示へ
            }
        });
    });
}

/** Add a new preset from input fields
 * @returns {void}
 */
function addPreset() {
    const w = parseInt(document.getElementById("newWidth").value, 10);
    const h = parseInt(document.getElementById("newHeight").value, 10);
    if (!w || !h) return; // 入力チェック

    chrome.storage.local.get({ presets: [] }, (data) => {
        data.presets.push({ width: w, height: h });
        const newIndex = data.presets.length - 1; // 追加された要素のインデックス
        chrome.storage.local.set({ presets: data.presets }, () => {
            renderSettings(newIndex); // 追加された行だけハイライト
        });
    });
}

/** フォーム全体で Enter キーを拾う
 * @returns {void}
 */
document.getElementById("presetForm").addEventListener("submit", (e) => {
    e.preventDefault(); // デフォルトの送信動作を防止
    addPreset();
});

/** Handle settings button click
 * @returns {void}
 */
document.getElementById("settings").onclick = () => {
    document.getElementById("presets").style.display = "none";
    document.getElementById("btn").style.display = "none";
    document.getElementById("settingsPanel").style.display = "block";
    renderSettings();
};

/** Handle back button click
 * @returns {void}
 */
document.getElementById("back").onclick = () => {
    document.getElementById("presets").style.display = "block";
    document.getElementById("btn").style.display = "block";
    document.getElementById("settingsPanel").style.display = "none";
    renderPresets();
};

/** Handle add preset button click
 * Add ボタンのクリックでも呼び出し
 * @returns {void}
 */
document.getElementById("addPreset").onclick = (e) => {
    e.preventDefault(); // フォーム送信を防止
    addPreset();
};

/** Update and display current window size and position
 * @returns {void}
 */
function updateWindowInfo() {
    let contentText = `- × -`;
    chrome.windows.getCurrent({}, (win) => {
        contentText =
            `Size: ${win.width} × ${win.height}`;
        document.getElementById("currentSize").textContent = contentText;
        document.getElementById("currentPosition").textContent =
            `Position: ${win.left} × ${win.top}`;
    });

    // タブの表示領域サイズ
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            const url = tabs[0].url || "";
            testText(url);

            if (url.startsWith("chrome://") || url.startsWith("about:")) {
                // 内部ページはスクリプト注入不可 → 表示領域サイズは取得しない
                contentText += " | Content: (not accessible)";
            } else {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => {
                        return { w: window.innerWidth, h: window.innerHeight };
                    }
                }, (results) => {
                    if (results && results[0] && results[0].result) {
                        const { w, h } = results[0].result;
                        contentText += " | " + `${w} × ${h}`;
                    }
                    // ← 結果が返ってきたタイミングで更新
                    document.getElementById("currentSize").textContent = contentText;
                });
            }
        }
    });
}

/** Test function to display text in the popup
 * @param {string} textContent - text to display
 * @returns {void}
 */
function testText(textContent) {
    //document.getElementById("testText").textContent = textContent;
}

/** Main function to initialize the popup
 * @returns {void}
 */
function main() {
    updateWindowInfo();
    chrome.windows.onBoundsChanged.addListener(updateWindowInfo);
    renderPresets();
    // バージョン情報の表示
    const manifest = chrome.runtime.getManifest();
    document.getElementById("version").textContent = `${manifest.name} Version: ${manifest.version}`;
}

main();
