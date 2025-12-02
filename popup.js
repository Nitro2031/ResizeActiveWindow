const windowThickness = 8; // ウィンドウ枠の厚さを考慮

/** Render the preset buttons
 * プリセットボタンの表示と動作設定
 * Each button resizes the current window to the preset dimensions
 * Also handles settings panel for adding/removing presets
 * Uses chrome.storage.local to persist presets
 * @returns {void}
 */
function renderPresets() {
    chrome.storage.local.get({ presets: [] }, (data) => {
        if (data.presets.length === 0) {
            chrome.storage.local.set({
                presets: [{
                    width: 816,
                    height: 560
                }, {
                    width: 1040,
                    height: 748
                }, {
                    width: 1296,
                    height: 760
                }, {
                    width: 1936,
                    height: 1040
                }]
            }, renderPresets);
        } else {
            const container = document.getElementById("presets");
            container.innerHTML = ""; // 既存の内容をクリア
            container.appendChild(document.createElement("hr"));
            data.presets.forEach((parameter) => {
                const presetBtn = document.createElement("button");
                presetBtn.textContent = `${parameter.width}x${parameter.height}`;
                presetBtn.className = "preset";
                presetBtn.onclick = () => {
                    chrome.windows.getCurrent({}, (window) => {
                        // 拡張機能が表示される右上を基準に表示画面の利用可能領域を取得
                        const rightX = window.left + window.width;
                        const topY = window.top;
                        chrome.system.display.getInfo((displays) => {
                            // 右上座標が属するディスプレイを探す
                            const targetDisplay = displays.find(d => {
                                const bounds = d.bounds;
                                //testText(JSON.stringify(bounds));
                                return rightX >= bounds.left &&
                                    rightX <= bounds.left + bounds.width &&
                                    topY >= bounds.top &&
                                    topY <= bounds.top + bounds.height;
                            }) || displays[0]; // 見つからなければプライマリ
                            // 画面の利用可能領域(除くタスクバー)を取得
                            const screenWidth = targetDisplay.workArea.width;
                            const screenHeight = targetDisplay.workArea.height;
                            const screenLeft = targetDisplay.workArea.left;
                            const screenTop = targetDisplay.workArea.top;
                            //testText(JSON.stringify(targetDisplay.workArea));

                            // サイズ上限補正
                            let targetWidth = parameter.width;
                            let targetHeight = parameter.height;
                            if (targetWidth > screenWidth + windowThickness * 2) targetWidth = screenWidth + windowThickness * 2;
                            if (targetHeight > screenHeight + windowThickness) targetHeight = screenHeight + windowThickness;

                            // 位置補正（拡張機能ボタンがある右上基準）
                            let newLeft = window.left + window.width - targetWidth;
                            let newTop = window.top;

                            // 画面左にはみ出さないように調整
                            if (newLeft < screenLeft - windowThickness) {
                                newLeft = screenLeft - windowThickness;
                            }
                            // 画面上にはみ出さないように調整
                            if (newTop < screenTop - windowThickness) {
                                newTop = screenTop;
                            }
                            // 画面右にはみ出さないように調整
                            if (newLeft + targetWidth > screenLeft + screenWidth + windowThickness) {
                                newLeft = screenLeft + screenWidth - targetWidth + windowThickness;
                            }
                            // 画面下にはみ出さないように調整
                            if (newTop + targetHeight > screenTop + screenHeight + windowThickness * 2) {
                                newTop = screenTop + screenHeight - targetHeight + windowThickness;
                            }

                            // ウィンドウサイズと位置を変更
                            chrome.windows.update(
                                window.id,
                                {
                                    width: targetWidth,
                                    height: targetHeight,
                                    left: newLeft,
                                    top: newTop
                                }
                            );
                        });
                    });
                };
                container.appendChild(presetBtn);
                const br = document.createElement("br");
                container.appendChild(br);
            });
            container.appendChild(document.createElement("hr"));
        }
    });
}

/** Render the settings panel for managing presets
 * 設定画面のプリセットボタン一覧を表示
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
 * 新しいプリセットボタンを追加
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

/** フォーム全体で Enter キーを拾い、プリセットボタン保存を呼び出す
 * @returns {void}
 */
document.getElementById("presetForm").addEventListener("submit", (e) => {
    e.preventDefault(); // デフォルトの送信動作を防止
    addPreset();
});

/** Handle settings button click
 * 設定ボタンのクリックで設定画面呼び出し
 * @returns {void}
 */
document.getElementById("settings").onclick = () => {
    document.getElementById("presets").style.display = "none";
    document.getElementById("btn").style.display = "none";
    document.getElementById("settingsPanel").style.display = "block";
    renderSettings();
};

/** Handle back button click
 * 設定画面で戻るボタンからメニュー画面へ切り替え
 * @returns {void}
 */
document.getElementById("back").onclick = () => {
    document.getElementById("presets").style.display = "block";
    document.getElementById("btn").style.display = "block";
    document.getElementById("settingsPanel").style.display = "none";
    renderPresets();
};

/** Handle add preset button click
 * Add ボタンのクリックでもプリセットボタン保存を呼び出す
 * @returns {void}
 */
document.getElementById("addPreset").onclick = (e) => {
    e.preventDefault(); // フォーム送信を防止
    addPreset();
};

/** Update and display current window size and position
 * ウィンドウのサイズと位置を取得して表示
 * @returns {void}
 */
function updateWindowInfo() {
    let contentText = `- × -`;
    chrome.windows.getCurrent({}, (win) => {
        contentText =
            ` ${win.width} × ${win.height}`;
        document.getElementById("currentSize").textContent = contentText;
        document.getElementById("currentPosition").textContent =
            `Window: ( ${win.left} , ${win.top} ) `;
    });

    // タブの表示領域サイズ
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            const url = tabs[0].url || "";
            //testText(url);

            if (url.startsWith("chrome://")
                || url.startsWith("about:")
                || url.startsWith("chrome-extension://")
                || url.startsWith("edge://")
            ) {
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
 * テスト用関数：ポップアップ内にテキスト表示
 * @param {string} textContent - text to display
 * @returns {void}
 */
function testText(textContent) {
    document.getElementById("testText").textContent = textContent;
}

/** Format display information as a string
 * ディスプレイ情報を文字列化
 * @param {Object} display - display object from chrome.system.display.getInfo
 * @returns {string} formatted display information
 */
function displayInfo(display) {
    const name = display.name || `Display${display.id}`;
    const bounds = display.bounds;
    const position = `(${bounds.left}, ${bounds.top})`;
    const size = `${bounds.width} x ${bounds.height}`;
    return `<div class="displayInfo">${name} : ${position} ${size}</div>`;
}

/** Main function to initialize the popup
 * ポップアップの初期化処理
 * @returns {void}
 */
function main() {
    updateWindowInfo();
    chrome.windows.onBoundsChanged.addListener(updateWindowInfo);
    renderPresets();

    // ディスプレイ情報の表示
    chrome.system.display.getInfo((displays) => {
        const displayInfoDiv = document.getElementById("displays");
        displayInfoDiv.innerHTML = "";
        let displayInfoText = "";
        displays.forEach(display => {
            //testText(JSON.stringify(display));
            displayInfoText += displayInfo(display);
        });
        displayInfoDiv.innerHTML = displayInfoText;
    });

    // バージョン情報の表示
    const manifest = chrome.runtime.getManifest();
    const title = manifest.action.default_title || manifest.name;
    const version = manifest.version;
    document.getElementById("version").innerHTML = `${title}<br /> Version: ${version}`;
}

main();
