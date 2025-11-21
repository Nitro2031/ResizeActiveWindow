/** Main function to initialize the popup
 * @returns {void}
 */
function main() {
    showDisplaySize();
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
                <img src="/icon-128x128.png" alt="Icon"><br />
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
