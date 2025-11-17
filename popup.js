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
    document.getElementById("moveButtons").style.display = "none";
    document.getElementById("presets").style.display = "none";
    document.getElementById("btn").style.display = "none";
    document.getElementById("settingsPanel").style.display = "block";
    renderSettings();
};

/** Handle back button click
 * @returns {void}
 */
document.getElementById("back").onclick = () => {
    document.getElementById("moveButtons").style.display = "block";
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
            //testText(url);

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

/** Display the current display size
 * @returns {void}
 */
function showDisplaySize() {
    chrome.system.display.getInfo((displays) => {
        testText({ displays });
        if (displays && displays.length > 0) {
            // 現在のメインディスプレイを取得
            const primary = displays.find(d => d.isPrimary) || displays[0];
            const width = primary.bounds.width;
            const height = primary.bounds.height;
            testText({ primary, width, height });

            document.getElementById("displaySize").textContent =
                `Display: ${width} × ${height}`;
        }
    });
}

/** Move the current window to a specified position
 * @param {string} position - "left", "right", "top", or "bottom"
 * @returns {void}
 */
function moveWindow(position) {
    chrome.windows.getCurrent({}, (window) => {
        chrome.system.display.getInfo((displays) => {
            const windowFrameThickness = -8; // Windows のタスクバー分ではなく、ウィンドウ枠の厚さを考慮
            const centerX = window.left + window.width / 2;
            const centerY = window.top + window.height / 2;
            const targetDisplay = displays.find(d => {
                const b = d.bounds;
                return (
                    centerX >= b.left &&
                    centerX <= b.left + b.width &&
                    centerY >= b.top &&
                    centerY <= b.top + b.height
                );
            });

            if (!targetDisplay) return;
            const b = targetDisplay.bounds;
            let newLeft = window.left;
            let newTop = window.top;

            switch (position) {
                case "topLeft":
                    newLeft = b.left + windowFrameThickness;
                    newTop = b.top + windowFrameThickness;
                    break;
                case "topRight":
                    newLeft = b.left + b.width - window.width
                        - windowFrameThickness;
                    newTop = b.top + windowFrameThickness;
                    break;
                case "bottomLeft":
                    newLeft = b.left + windowFrameThickness;
                    newTop = b.top + b.height - window.height
                        + windowFrameThickness;
                    break;
                case "bottomRight":
                    newLeft = b.left + b.width - window.width
                        - windowFrameThickness;
                    newTop = b.top + b.height - window.height
                        + windowFrameThickness;
                    break;
                case "center":
                    newLeft = b.left + Math.floor((b.width - window.width) / 2);
                    newTop = b.top + Math.floor((b.height - window.height) / 2);
                    break;
                case "left":
                    newLeft = b.left + windowFrameThickness;
                    break;
                case "right":
                    newLeft = b.left + b.width - window.width
                        - windowFrameThickness;
                    break;
                case "top":
                    newTop = b.top + windowFrameThickness;
                    break;
                case "bottom":
                    newTop = b.top + b.height - window.height
                        + windowFrameThickness;
                    break;
            }

            chrome.windows.update(window.id, { left: newLeft, top: newTop });
        });
    });
}


/** Test function to display text in the popup
 * @param {string} textContent - text to display
 * @returns {void}
 */
function testText(textContent) {
    document.getElementById("testText").textContent = textContent;
}

/** Handle the settings button to show settings panel
 * @returns {void}
 */
function handleSettingsButton() {
    document.getElementById("settings").onclick = () => {
        document.getElementById("moveButtons").style.display = "none";
        document.getElementById("version").style.display = "block";
        document.getElementById("btn").style.display = "none";
        document.getElementById("settingsPanel").style.display = "block";
        renderSettings();
    }
}

/** Handle the return button to go back from settings panel
 * @returns {void}
 */
function handleReturnButton() {
    document.getElementById("back").onclick = () => {
        document.getElementById("moveButtons").style.display = "block";
        document.getElementById("version").style.display = "none";
        document.getElementById("btn").style.display = "block";
        document.getElementById("settingsPanel").style.display = "none";
        renderPresets();
    };
}

function handleAddPresetButton(e) {
    e.preventDefault(); // フォーム送信を防止
    addPreset();
}

/** Main function to initialize the popup
 * @returns {void}
 */
function main() {
    updateWindowInfo();
    chrome.windows.onBoundsChanged.addListener(updateWindowInfo);
    renderPresets();

    document.addEventListener("DOMContentLoaded", () => {
        const settingsBtn = document.getElementById("settings");
        const backBtn = document.getElementById("back");
        const addPresetBtn = document.getElementById("addPreset");
        const presetForm = document.getElementById("presetForm");
        const moveLeft = document.getElementById("moveLeft");
        const moveRight = document.getElementById("moveRight");
        const moveTop = document.getElementById("moveTop");
        const moveBottom = document.getElementById("moveBottom");
        const moveTopLeft = document.getElementById("moveTopLeft");
        const moveTopRight = document.getElementById("moveTopRight");
        const moveBottomLeft = document.getElementById("moveBottomLeft");
        const moveBottomRight = document.getElementById("moveBottomRight");
        const moveCenter = document.getElementById("moveCenter");
        const idVersion = document.getElementById("version");

        // バージョン情報の表示
        if (idVersion) {
            const manifest = chrome.runtime.getManifest();
            idVersion.innerHTML = `
                <img src="/icon-32x32.png" alt="Icon"><br />
                ${manifest.action.default_title}<br/>
                Version ${manifest.version}
            `;
        }

        if (settingsBtn) {
            settingsBtn.onclick = () => {
                // Handle settings button click
                handleSettingsButton();
            };
        }

        if (backBtn) {
            backBtn.onclick = () => {
                // Handle back button click
                handleReturnButton();
            };
        }

        if (addPresetBtn) {
            // Add ボタンのクリックでも呼び出し
            // Handle add preset button click
            addPresetBtn.onclick = (e) => {
                handleAddPresetButton(e);
            };
        }

        if (presetForm) {

            // フォーム全体で Enter キーを拾う
            presetForm.addEventListener("submit", (e) => {
                handleAddPresetButton(e);
            });
        }

        // 移動ボタンイベント登録
        if (moveLeft
            && moveRight
            && moveTop
            && moveBottom
            && moveTopLeft
            && moveTopRight
            && moveBottomLeft
            && moveBottomRight
            && moveCenter
        ) {
            moveLeft.onclick = () => moveWindow("left");
            moveRight.onclick = () => moveWindow("right");
            moveTop.onclick = () => moveWindow("top");
            moveBottom.onclick = () => moveWindow("bottom");
            moveTopLeft.onclick = () => moveWindow("topLeft");
            moveTopRight.onclick = () => moveWindow("topRight");
            moveBottomLeft.onclick = () => moveWindow("bottomLeft");
            moveBottomRight.onclick = () => moveWindow("bottomRight");
            moveCenter.onclick = () => moveWindow("center");
        }
    });
}

main();
