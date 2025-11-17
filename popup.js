/** Render the preset buttons
 * Each button resizes the current window to the preset dimensions
 * Also handles settings panel for adding/removing presets
 * Uses chrome.storage.local to persist presets
 * @returns {void}
 */
function renderPresets() {
    chrome.storage.local.get({ presets: [] }, (data) => {
        if (data.presets.length === 0) {
            chrome.storage.local.set(
                {
                    presets: [{
                        width: 800,
                        height: 600
                    }]
                },
                renderPresets
            );
        } else {
            const container = document.getElementById("presets");
            container.innerHTML = "";
            data.presets.forEach((parameter) => {
                const presetBtn = document.createElement("button");
                presetBtn.textContent = `${parameter.width} × ${parameter.height}`;
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
                const tdPreset = document.createElement("td");
                tdPreset.appendChild(presetBtn);
                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = " 🗑️ Delete";
                deleteBtn.disabled = true;
                const tdDelete = document.createElement("td");
                tdDelete.appendChild(deleteBtn);
                const tr = document.createElement("tr");
                tr.appendChild(tdPreset);
                tr.appendChild(tdDelete);
                container.appendChild(tr);
                console.log({ tr });
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
            const td = document.createElement("td");
            td.textContent = p.width + " × " + p.height;
            const tdDelete = document.createElement("td");
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = " 🗑️ Delete";
            deleteBtn.onclick = () => {
                data.presets.splice(i, 1);
                chrome.storage.local.set({ presets: data.presets }, renderSettings);
            };
            tdDelete.appendChild(deleteBtn);

            const tr = document.createElement("tr");
            tr.appendChild(td);
            tr.appendChild(tdDelete);
            listRow.appendChild(tr);
            console.log("Settings: ", { tr });

            // 直近追加された行をハイライト
            if (i === highlightIndex) {
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

/** Update and display current window size and position
 * @returns {void}
 */
function updateWindowInfo() {
    let contentText = `- × -`;
    chrome.windows.getCurrent({}, (window) => {
        document.getElementById("currentPosition").textContent =
            ` ${window.left} × ${window.top} `;

        contentText =
            ` ${window.width} × ${window.height} `;
        document.getElementById("currentSize").textContent = contentText;
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
    let displayText = "";
    chrome.system.display.getInfo((displays) => {
        //testText({ displays });
        if (displays && displays.length > 0) {
            const container = document.getElementById("displaySize");
            container.innerHTML = ""; // 初期化

            displays.forEach((display) => {
                const left = display.bounds.left;
                const top = display.bounds.top;
                const width = display.bounds.width;
                const height = display.bounds.height;

                const th = document.createElement("td");
                th.textContent = display.name;
                const tdPosition = document.createElement("td");
                tdPosition.textContent = ` ${left} × ${top} `;
                const tdSize = document.createElement("td");
                tdSize.textContent = ` ${width} × ${height} `;

                const tr = document.createElement("tr");
                tr.appendChild(th);
                tr.appendChild(tdPosition);
                tr.appendChild(tdSize);
                container.appendChild(tr);
                console.log("display.getInfo: ", { tr });
            });
        }
    });
}

/** Move the current window to a specified position
 * @param {string} position - "left", "right", "top", or "bottom"
 * @returns {void}
 */
function moveWindow(position) {
    chrome.windows.getCurrent({}, (window) => {
        const screenWidth = screen.availWidth;
        const screenHeight = screen.availHeight;
        let newLeft = window.left;
        let newTop = window.top;
        const windowFrameThickness = -8; // Windows のタスクバー分ではなく、ウィンドウ枠の厚さを考慮
        switch (position) {
            case "left":
                newLeft = windowFrameThickness;
                break;
            case "right":
                newLeft = screenWidth - window.width - windowFrameThickness;
                break;
            case "top":
                newTop = windowFrameThickness;
                break;
            case "bottom":
                newTop = screenHeight - window.height - windowFrameThickness;
                break;
        }

        chrome.windows.update(window.id, {
            left: newLeft,
            top: newTop
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

/** Main function to initialize the popup
 * @returns {void}
 */
function main() {
    showDisplaySize();
    updateWindowInfo();
    chrome.windows.onBoundsChanged.addListener(updateWindowInfo);
    renderPresets();

    // フォーム全体で Enter キーを拾う
    document.getElementById("presetForm").addEventListener("submit", (e) => {
        e.preventDefault(); // デフォルトの送信動作を防止
        addPreset();
    });

    // Handle settings button click
    document.getElementById("settings").onclick = () => {
        document.getElementById("moveButtons").style.display = "none";
        document.getElementById("btn").style.display = "none";
        document.getElementById("settingsPanel").style.display = "block";
        renderSettings();
    };

    // Handle back button click
    document.getElementById("back").onclick = () => {
        document.getElementById("moveButtons").style.display = "block";
        document.getElementById("btn").style.display = "block";
        document.getElementById("settingsPanel").style.display = "none";
        renderPresets();
    };

    // Add ボタンのクリックでも呼び出し
    // Handle add preset button click
    document.getElementById("addPreset").onclick = (e) => {
        e.preventDefault(); // フォーム送信を防止
        addPreset();
    };

    // 移動ボタンイベント登録
    document.getElementById("moveLeft").onclick = () => moveWindow("left");
    document.getElementById("moveRight").onclick = () => moveWindow("right");
    document.getElementById("moveTop").onclick = () => moveWindow("top");
    document.getElementById("moveBottom").onclick = () => moveWindow("bottom");

    // バージョン情報の表示
    const manifest = chrome.runtime.getManifest();
    document.getElementById("version").textContent = `${manifest.action.default_title} Version: ${manifest.version}`;
}

main();
