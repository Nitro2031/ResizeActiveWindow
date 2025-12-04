// presets.js

// Default presets if none are stored
const defaultPresets = {
    presets: [{
        width: 816,
        height: 568
    }, {
        width: 1040,
        height: 756
    }, {
        width: 1296,
        height: 768
    }, {
        width: 1936,
        height: 1048
    }]
};

/** Helper function to get current window as a Promise
 * 呼び出されたウィンドウ情報をPromiseで取得
 * @return {Promise<chrome.windows.Window>}
 */
function getCurrentWindow() {
    return new Promise(resolve => {
        chrome.windows.getCurrent({}, resolve);
    });
}

/** Helper function to get display info as a Promise
 * 全てのディスプレイ情報をPromiseで取得
 * @return {Promise<chrome.system.display.DisplayInfo[]>}
 */
function getDisplays() {
    return new Promise(resolve => {
        chrome.system.display.getInfo(resolve);
    });
}

/** Helper function to set storage as a Promise
 * ローカルストレージへの保存をPromiseで実行
 * @param {Object} data - Data to store
 * @return {Promise<void>}
 */
function setStorage(data) {
    return new Promise(resolve => {
        chrome.storage.local.set(data, resolve);
    });
}

/** Resize the current window to specified width and height
 * アクティブなウィンドウを指定サイズにリサイズする
 * @param {{width: number, height: number}} parameter - New dimensions of the window
 * @returns {void}
 */
async function windowResize(parameter) {
    const window = await getCurrentWindow();

    // 拡張機能が表示される右上を基準に表示画面の利用可能領域を取得
    const rightX = window.left + window.width;
    const topY = window.top;
    const preset = {};

    const displays = await getDisplays();

    // 右上座標が属するディスプレイを探す
    const targetDisplay = displays.find(d => {
        const bounds = d.bounds;
        //testText(JSON.stringify(bounds));
        return rightX >= bounds.left + windowThickness + 1 &&
            rightX <= bounds.left + bounds.width + windowThickness + 1 &&
            topY >= bounds.top - windowThickness - 1 &&
            topY <= bounds.top + bounds.height - windowThickness - 1;
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
    if (targetHeight > screenHeight + windowThickness * 2) targetHeight = screenHeight + windowThickness * 2;

    // 位置補正（拡張機能ボタンがある右上基準）
    let newLeft = window.left + window.width - targetWidth;
    let newTop = window.top - windowThickness;

    // 画面左にはみ出さないように調整
    if (newLeft < screenLeft - windowThickness) {
        newLeft = screenLeft - windowThickness;
    }
    // 画面上にはみ出さないように調整
    if (newTop < screenTop - windowThickness) {
        newTop = screenTop - windowThickness;
    }
    // 画面右にはみ出さないように調整
    if (newLeft + targetWidth > screenLeft + screenWidth + windowThickness) {
        newLeft = screenLeft + screenWidth - targetWidth + windowThickness;
    }
    // 画面下にはみ出さないように調整
    if (newTop + targetHeight > screenTop + screenHeight + windowThickness) {
        newTop = screenTop + screenHeight - targetHeight + windowThickness;
    }
    preset.width = targetWidth;
    preset.height = targetHeight;
    preset.left = newLeft;
    preset.top = newTop;

    const id = window.id;
    preset.state = "normal"; // 最大化・最小化解除
    testText(id + " :( " + preset.left + ", " + preset.top + " ) " + preset.width + " × " + preset.height);
    console.log({ preset });
    console.log({ id })

    await chrome.windows.update(
        window.id,
        preset
    );
}

/** Create a preset button and append it to the tr container
 * プリセットボタンを作成し、指定のコンテナに追加する
 * @param {{width: number, height: number}} parameter - Preset dimensions
 * @param {number} index - Index of the preset in the array
 * @param {Object} data - Data object containing presets
 * @returns {HTMLTableRowElement} - The created table row element
 */
function createPresetButton(parameter, index, data) {
    const presetBtn = document.createElement("button");
    presetBtn.textContent = `${parameter.width} × ${parameter.height}`;
    presetBtn.className = "preset";
    presetBtn.onclick = () => {
        windowResize(parameter);
    };
    const td = document.createElement("td");
    td.appendChild(presetBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = " 🗑️ Delete";
    deleteBtn.className = "delete";
    deleteBtn.onclick = async () => {
        data.presets.splice(index, 1); // 削除ボタンを押した行を配列から削除
        // 変更をローカルストレージに保存し、設定パネルを再レンダリング
        await setStorage(data).then(() => {
            renderSettings();
        });
    };
    const tdDelete = document.createElement("td");
    tdDelete.appendChild(deleteBtn);
    const tr = document.createElement("tr");
    tr.appendChild(td);
    tr.appendChild(tdDelete);
    return tr;
}

/** Render the preset buttons
 * Each button resizes the current window to the preset dimensions
 * Also handles settings panel for adding/removing presets
 * Uses chrome.storage.local to persist presets
 * @returns {void}
 */
function renderPresets() {
    chrome.storage.local.get({ presets: [] }, (data) => {
        let presets;
        if (data.presets.length === 0) {
            // デフォルトプリセットを作成
            presets = defaultPresets.presets;
            chrome.storage.local.set({ presets }, renderPresets);
        } else {
            presets = data.presets;

        }
        const container = document.getElementById("presets");
        container.innerHTML = ""; // 既存の内容をクリア
        presets.forEach((parameter, index) => {
            const tr = createPresetButton(parameter, index, data);
            container.appendChild(tr);
        });
    });
}

/** Render the settings panel for managing presets
 * プリセットを管理する設定画面の描画
 * @param {number} [highlightIndex=-1] 直近追加されたプリセットのインデックス
 * @returns {void}
 */
function renderSettings(highlightIndex = -1) {
    // ローカルストレージからプリセットを取得
    chrome.storage.local.get({ presets: [] }, (data) => {
        const listRow = document.getElementById("presetList");
        listRow.innerHTML = "";
        data.presets.forEach((parameter, index) => {
            const tr = createPresetButton(parameter, index, data);
            listRow.appendChild(tr);

            // 直近追加された行をハイライト
            if (index === highlightIndex) {
                tr.classList.add("highlight");
                setTimeout(() => {
                    tr.classList.remove("highlight");
                }, 500); // 500ms後に通常表示へ
            }
        });
    });
}

/** Add a new preset from input fields
 * 追加ボタン・テキストボックスでエンターキー押下時に値をプリセットへ追加
 * @returns {void}
 */
function addPreset() {
    const w = parseInt(document.getElementById("newWidth").value, 10);
    const h = parseInt(document.getElementById("newHeight").value, 10);
    if (!w || !h) return; // 入力チェック

    // ローカルストレージから既存プリセットを取得
    chrome.storage.local.get({ presets: [] }, (data) => {
        // 新しいプリセットを配列に追加
        data.presets.push({ width: w, height: h });
        const newIndex = data.presets.length - 1; // 追加された要素のインデックス

        // ローカルストレージへ保存し、設定パネルを再レンダリング
        chrome.storage.local.set({ presets: data.presets }, () => {
            renderSettings(newIndex); // 追加された行だけハイライト
        });
    });
}

/** Reset presets to default values
 * プリセットをデフォルト値にリセット
 * @returns {void}
 */
function resetPresets() {
    chrome.storage.local.set(defaultPresets, () => {
        renderPresets();
        handleReturnButton();
    });
}
