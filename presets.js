// presets.js

// Data structure to hold preset dimensions
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

/** Resize the current window to specified width and height
 * @param {number} width - New width of the window
 * @param {number} height - New height of the window
 * @returns {void}
 */
function windowResize(width, height) {
    chrome.windows.getCurrent({}, (window) => {
        const newLeft = window.left + window.width - width;
        chrome.windows.update(
            window.id,
            {
                width: width,
                height: height,
                left: newLeft
            });
    });
}

/** Create a preset button and append it to the container
 * @param {{width: number, height: number}} parameter - Preset dimensions
 * @param {HTMLElement} container - Container to append the button to
 * @returns {void}
 */
function createPreset(parameter, index) {
    const preset = document.createElement("button");
    preset.textContent = `${parameter.width} × ${parameter.height}`;
    preset.className = "preset";
    preset.onclick = () => {
        windowResize(parameter.width, parameter.height);
    };
    const td = document.createElement("td");
    td.appendChild(preset);
    const deleteElement = document.createElement("span");
    deleteElement.textContent = " 🗑️ Delete";
    const tdDelete = document.createElement("td");
    tdDelete.appendChild(deleteElement);
    const tr = document.createElement("tr");
    tr.appendChild(td);
    tr.appendChild(tdDelete);
    return tr;
}
/** Create a preset button and append it to the container
 * @param {{width: number, height: number}} parameter - Preset dimensions
 * @param {HTMLElement} container - Container to append the button to
 * @returns {void}
 */
function createPresetButton(parameter, index) {
    const presetBtn = document.createElement("button");
    presetBtn.textContent = `${parameter.width} × ${parameter.height}`;
    presetBtn.className = "preset";
    presetBtn.onclick = () => {
        windowResize(parameter.width, parameter.height);
    };
    const td = document.createElement("td");
    td.appendChild(presetBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = " 🗑️ Delete";
    deleteBtn.className = "deletePreset";
    deleteBtn.onclick = () => {
        data.presets.splice(index, 1); // 削除ボタンを押した行を配列から削除
        // 変更をローカルストレージに保存し、設定パネルを再レンダリング
        chrome.storage.local.set({ presets: data.presets }, renderSettings);
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
        if (data.presets.length === 0) {
            // デフォルトプリセットを作成
            chrome.storage.local.set({
                presets: data.presets.concat(this.data.presets)
            }, renderPresets);
        } else {
            const container = document.getElementById("presets");
            container.innerHTML = "";
            data.presets.forEach((parameter, index) => {
                const tr = createPreset(parameter, index);
                container.appendChild(tr);
            });
        }
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
            const tr = createPreset(parameter, index);
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
