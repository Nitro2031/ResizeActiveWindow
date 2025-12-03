/** Handle the settings button to show settings panel
 * settings ボタンで設定パネル表示
 * @returns {void}
 */
function handleSettingsButton() {
    document.getElementById("settings").onclick = () => {
        document.getElementById("moveButtons").style.display = "none";
        //document.getElementById("version").style.display = "block";
        document.getElementById("btn").style.display = "none";
        Array.from(
            document.getElementsByClassName("settingsPanel")
        ).forEach(element => {
            element.style.display = "block";
        });
        Array.from(
            document.getElementsByClassName("deletePreset")
        ).forEach(element => {
            element.disabled = false;
        });
        renderSettings();
    }
}

/** Handle the return button to go back from settings panel
 * back ボタンでメインパネル表示
 * @returns {void}
 */
function handleReturnButton() {
    document.getElementById("back").onclick = () => {
        document.getElementById("moveButtons").style.display = "block";
        //document.getElementById("version").style.display = "none";
        document.getElementById("btn").style.display = "block";
        Array.from(
            document.getElementsByClassName("settingsPanel")
        ).forEach(element => {
            element.style.display = "none";
        });
        Array.from(
            document.getElementsByClassName("deletePreset")
        ).forEach(element => {
            element.disabled = true;
        });
        renderPresets();
    };
}

/** Handle form submission to add a new preset
 * Handle add preset button click
 * フォーム全体で Enter キー押下時に値をプリセットへ追加
 * Add ボタンのクリックでも呼び出し
 * @returns {void}
 */
function handleAddPresetButton(e) {
    e.preventDefault(); // フォーム送信を防止
    addPreset();
}

/** Reset presets to default values
 * プリセットをデフォルト値にリセット
 * @returns {void}
 */
function resetPresets() {
    chrome.storage.local.set(defaultPresets, () => {
        renderPresets();
        handleReturnButton()();
    });
}

/** Test function to display text in the popup
 * テスト用: ポップアップにテキストを表示
 * @param {string} textContent - text to display
 * @returns {void}
 */
function testText(textContent) {
    document.getElementById("testText").textContent = textContent;
}
